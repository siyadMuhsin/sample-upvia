import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User, Student, Program } from '../../models';
import { parseCsvToRecords } from '../../utils/csv.util';
import { hashPassword } from '../../utils/password.util';
import { generateInvitationToken, buildActivationLink } from '../../utils/token.util';
import { logAuditEvent } from '../../utils/audit.util';
import { sendSuccess } from '../../utils/response.util';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.util';
import { StudentStatus, UserRole } from '../../shared';
import { ENV } from '../../config/environment';
import { IProgramDocument } from '../universities/university.model';

const REQUIRED_CSV_COLUMNS = ['email', 'fullName', 'studentIdNumber', 'programId', 'expectedGraduationDate'];
const CHUNK_SIZE = 50;

interface BulkImportRowError {
  row: number;
  email?: string;
  reason: string;
}

interface BulkImportRowSuccess {
  row: number;
  email: string;
  studentId: string;
  status: 'created' | 'updated';
  activationLink?: string;
}

function splitFullName(fullName: string): { firstNameEn: string; lastNameEn: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstNameEn = parts[0] || fullName.trim();
  const lastNameEn = parts.length > 1 ? parts.slice(1).join(' ') : firstNameEn;
  return { firstNameEn, lastNameEn };
}

function parseOptionalNumber(value: string | undefined, fieldLabel: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error(`${fieldLabel} "${value}" is not a valid number`);
  return parsed;
}

export class StudentProvisionController {
  /**
   * Bulk-imports/upserts students from an admin-uploaded CSV. Each row is
   * processed independently (its own compensating rollback on partial
   * failure) so one bad row never aborts the batch — true multi-document
   * Mongo transactions aren't used here because this platform's MongoDB
   * deployment runs as a standalone instance (not a replica set), where
   * `session.startTransaction()` is unsupported.
   */
  async bulkImportStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { csv, universityId: bodyUniversityId } = req.body;
      if (!csv || typeof csv !== 'string') {
        throw new BadRequestError('csv (raw CSV file content as a string) is required');
      }

      const universityId = req.user.role === UserRole.SUPER_ADMIN ? bodyUniversityId : req.user.universityId;
      if (!universityId) {
        throw new BadRequestError('universityId is required (Super Admin must supply it explicitly)');
      }

      const records = parseCsvToRecords(csv);
      if (records.length === 0) {
        throw new BadRequestError('CSV contains no data rows');
      }

      const missingColumns = REQUIRED_CSV_COLUMNS.filter((col) => !(col in records[0]));
      if (missingColumns.length > 0) {
        throw new BadRequestError(`CSV is missing required column(s): ${missingColumns.join(', ')}`);
      }

      const successes: BulkImportRowSuccess[] = [];
      const errors: BulkImportRowError[] = [];
      const programCache = new Map<string, IProgramDocument | null>();

      for (let chunkStart = 0; chunkStart < records.length; chunkStart += CHUNK_SIZE) {
        const chunk = records.slice(chunkStart, chunkStart + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async (record, offsetInChunk) => {
            const rowNumber = chunkStart + offsetInChunk + 2; // +1 header row, +1 to be 1-indexed
            const email = record.email?.toLowerCase().trim();

            try {
              if (!email || !record.fullName || !record.studentIdNumber || !record.programId || !record.expectedGraduationDate) {
                throw new Error('Missing one or more required fields (email, fullName, studentIdNumber, programId, expectedGraduationDate)');
              }
              if (!mongoose.isValidObjectId(record.programId)) {
                throw new Error(`programId "${record.programId}" is not a valid identifier`);
              }

              let program = programCache.get(record.programId);
              if (program === undefined) {
                const fetchedProgram = await Program.findById(record.programId);
                programCache.set(record.programId, fetchedProgram);
                program = fetchedProgram;
              }
              if (!program) throw new Error(`Program "${record.programId}" was not found`);

              const expectedGraduationDate = new Date(record.expectedGraduationDate);
              if (Number.isNaN(expectedGraduationDate.getTime())) {
                throw new Error(`expectedGraduationDate "${record.expectedGraduationDate}" is not a valid date`);
              }

              const gpa = parseOptionalNumber(record.gpa, 'gpa');
              const creditsCompleted = parseOptionalNumber(record.creditsCompleted, 'creditsCompleted');
              const passedCourses = record.passedCourses
                ? record.passedCourses.split(',').map((c) => c.trim()).filter(Boolean)
                : [];
              const { firstNameEn, lastNameEn } = splitFullName(record.fullName);

              const existingUser = await User.findOne({ email });

              if (existingUser) {
                if (existingUser.role !== UserRole.STUDENT) {
                  throw new Error(`Email "${email}" already belongs to a non-student account`);
                }
                const student = await Student.findOne({ userId: existingUser._id });
                if (!student) {
                  throw new Error(`Existing user "${email}" has no student profile to update`);
                }

                student.studentId = record.studentIdNumber;
                student.programId = program._id;
                student.collegeId = program.collegeId;
                student.departmentId = program.departmentId;
                student.expectedGraduationDate = expectedGraduationDate;
                if (gpa !== undefined) student.gpa = gpa;
                if (creditsCompleted !== undefined) student.creditsCompleted = creditsCompleted;
                if (passedCourses.length > 0) student.passedCourses = passedCourses;
                await student.save();

                successes.push({ row: rowNumber, email, studentId: student.studentId, status: 'updated' });
                return;
              }

              const { hashedToken, expiresAt, rawToken } = generateInvitationToken();
              const placeholderPasswordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));

              const createdUser = await User.create({
                email,
                passwordHash: placeholderPasswordHash,
                firstNameEn,
                lastNameEn,
                role: UserRole.STUDENT,
                universityId,
                collegeId: program.collegeId,
                departmentId: program.departmentId,
                programId: program._id,
                isActive: false,
                isActivated: false,
                invitationToken: hashedToken,
                invitationExpires: expiresAt,
              });

              try {
                const createdStudent = await Student.create({
                  userId: createdUser._id,
                  studentId: record.studentIdNumber,
                  universityId,
                  collegeId: program.collegeId,
                  departmentId: program.departmentId,
                  programId: program._id,
                  studentStatus: StudentStatus.CURRENT_STUDENT,
                  expectedGraduationDate,
                  specialization: program.nameEn,
                  gpa,
                  creditsCompleted,
                  passedCourses,
                });

                successes.push({
                  row: rowNumber,
                  email,
                  studentId: createdStudent.studentId,
                  status: 'created',
                  activationLink: buildActivationLink(ENV.CLIENT_URL, rawToken),
                });
              } catch (studentCreateError) {
                // Compensate: no orphaned User account without a Student profile.
                await User.findByIdAndDelete(createdUser._id);
                throw studentCreateError;
              }
            } catch (rowError: any) {
              errors.push({ row: rowNumber, email, reason: rowError.message || 'Unknown error processing row' });
            }
          })
        );
      }

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: 'BULK_IMPORT_STUDENTS',
        entity: 'Student',
        entityId: universityId.toString(),
        details: { totalProcessed: records.length, successCount: successes.length, errorCount: errors.length },
        ipAddress: req.ip,
      });

      sendSuccess(
        res,
        {
          totalProcessed: records.length,
          successCount: successes.length,
          createdCount: successes.filter((s) => s.status === 'created').length,
          updatedCount: successes.filter((s) => s.status === 'updated').length,
          created: successes,
          errors,
        },
        `Processed ${records.length} rows: ${successes.length} succeeded, ${errors.length} failed`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual override for SIS-locked academic fields (used when the automated
   * academic-sync pipeline is unavailable or a correction is needed).
   * Every change is captured in the immutable audit log with before/after values.
   */
  async academicOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { gpa, creditsCompleted, passedCourses, studentStatus, expectedGraduationDate } = req.body;

      const student = await Student.findById(req.params.id);
      if (!student) throw new NotFoundError('Student not found');

      if (req.user.role !== UserRole.SUPER_ADMIN && student.universityId.toString() !== req.user.universityId) {
        throw new ForbiddenError('You may only override academic records for your own university');
      }

      if (studentStatus !== undefined && !Object.values(StudentStatus).includes(studentStatus)) {
        throw new BadRequestError(`studentStatus must be one of: ${Object.values(StudentStatus).join(', ')}`);
      }
      let parsedGraduationDate: Date | undefined;
      if (expectedGraduationDate !== undefined) {
        parsedGraduationDate = new Date(expectedGraduationDate);
        if (Number.isNaN(parsedGraduationDate.getTime())) {
          throw new BadRequestError('expectedGraduationDate is not a valid date');
        }
      }

      const previousValues = {
        gpa: student.gpa,
        creditsCompleted: student.creditsCompleted,
        passedCourses: student.passedCourses,
        studentStatus: student.studentStatus,
        expectedGraduationDate: student.expectedGraduationDate,
      };

      if (gpa !== undefined) student.gpa = gpa;
      if (creditsCompleted !== undefined) student.creditsCompleted = creditsCompleted;
      if (passedCourses !== undefined) {
        student.passedCourses = Array.isArray(passedCourses)
          ? passedCourses
          : String(passedCourses).split(',').map((c: string) => c.trim()).filter(Boolean);
      }
      if (studentStatus !== undefined) student.studentStatus = studentStatus;
      if (parsedGraduationDate !== undefined) student.expectedGraduationDate = parsedGraduationDate;

      await student.save();

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: 'ACADEMIC_OVERRIDE',
        entity: 'Student',
        entityId: student._id.toString(),
        details: {
          previousValues,
          newValues: {
            gpa: student.gpa,
            creditsCompleted: student.creditsCompleted,
            passedCourses: student.passedCourses,
            studentStatus: student.studentStatus,
            expectedGraduationDate: student.expectedGraduationDate,
          },
        },
        ipAddress: req.ip,
      });

      sendSuccess(res, student, 'Academic record overridden successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const studentProvisionController = new StudentProvisionController();
