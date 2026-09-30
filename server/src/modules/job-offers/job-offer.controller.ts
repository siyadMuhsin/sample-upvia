import { Request, Response, NextFunction } from 'express';
import { JobOffer, Student, EmploymentRecord, Company, Training } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.util';
import { JobOfferStatus, StudentStatus, UserRole } from '../../shared';
import { logAuditEvent } from '../../utils/audit.util';

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375;
const COMPANY_STAFF_ROLES = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER];

export class JobOfferController {
  async createJobOffer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { trainingId, studentId, jobTitleEn, jobTitleAr, salary, city, employmentType, startDate } = req.body;

      // Company staff can only ever extend offers on behalf of their own company.
      let companyId: string | undefined = req.body.companyId;
      if (COMPANY_STAFF_ROLES.includes(req.user.role)) {
        if (!req.user.companyId) throw new ForbiddenError('No company associated with this account');
        companyId = req.user.companyId;
      }
      if (!companyId) throw new BadRequestError('companyId is required');

      const student = await Student.findById(studentId);
      if (!student) throw new NotFoundError('Student not found');

      if (trainingId) {
        const training = await Training.findById(trainingId);
        if (!training) throw new NotFoundError('Training record not found');
      }

      const offer = await JobOffer.create({
        trainingId,
        studentId,
        companyId,
        jobTitleEn,
        jobTitleAr,
        salary,
        city,
        employmentType: employmentType || 'FULL_TIME',
        startDate: new Date(startDate),
        offerDate: new Date(),
        status: JobOfferStatus.PENDING,
      });

      if (req.user) {
        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: 'EXTEND_JOB_OFFER',
          entity: 'JobOffer',
          entityId: offer._id.toString(),
          newStatus: JobOfferStatus.PENDING,
          ipAddress: req.ip,
        });
      }

      sendSuccess(res, offer, 'Job offer submitted to student', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyOffers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      const offers = await JobOffer.find({ studentId: student._id })
        .populate('companyId', 'nameEn nameAr logoUrl sector averageRating')
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, offers);
    } catch (error) {
      next(error);
    }
  }

  async respondToOffer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { status } = req.body; // ACCEPTED or REJECTED
      const offer = await JobOffer.findById(req.params.id);
      if (!offer) throw new NotFoundError('Job offer not found');

      if (req.user.role === UserRole.STUDENT) {
        const requestingStudent = await Student.findOne({ userId: req.user.userId });
        if (!requestingStudent || offer.studentId.toString() !== requestingStudent._id.toString()) {
          throw new ForbiddenError('You may only respond to your own job offers');
        }
      } else if (req.user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenError('Only the offered student may respond to a job offer');
      }

      offer.status = status;
      await offer.save();

      if (status === JobOfferStatus.ACCEPTED) {
        // Find student and company to create EmploymentRecord
        const student = await Student.findById(offer.studentId);
        const company = await Company.findById(offer.companyId);

        if (student && company) {
          student.studentStatus = StudentStatus.GRADUATE;
          await student.save();

          // Real date-diff: months between training completion (or expected
          // graduation, if no training is attached) and the offer's acceptance.
          const training = offer.trainingId ? await Training.findById(offer.trainingId) : null;
          const referenceDate = training?.endDate || student.expectedGraduationDate || new Date();
          const monthsElapsed = (Date.now() - new Date(referenceDate).getTime()) / MS_PER_MONTH;
          const timeToEmploymentMonths = Math.max(1, Math.round(monthsElapsed));

          await EmploymentRecord.create({
            studentId: student._id,
            companyId: company._id,
            companyName: company.nameEn,
            programId: student.programId,
            collegeId: student.collegeId,
            universityId: student.universityId,
            jobTitle: offer.jobTitleEn,
            sector: company.sector,
            salary: offer.salary,
            startDate: offer.startDate,
            isPostTrainingHire: !!offer.trainingId,
            trainingId: offer.trainingId,
            timeToEmploymentMonths,
            skillsUsed: ['TypeScript', 'Full-Stack Development', 'Problem Solving'],
          });

          // Update company employed count
          company.studentsEmployed = (company.studentsEmployed || 0) + 1;
          if (company.studentsTrained > 0) {
            company.trainingToEmploymentRate =
              Math.round((company.studentsEmployed / company.studentsTrained) * 1000) / 10;
          }
          await company.save();
        }
      }

      if (req.user) {
        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: `JOB_OFFER_${status}`,
          entity: 'JobOffer',
          entityId: offer._id.toString(),
          newStatus: status,
          ipAddress: req.ip,
        });
      }

      sendSuccess(res, offer, `Job offer ${status.toLowerCase()}`);
    } catch (error) {
      next(error);
    }
  }
}

export const jobOfferController = new JobOfferController();
