import { Request, Response, NextFunction } from 'express';
import {
  Training,
  TrainingAttendance,
  TrainingTask,
  TrainingReport,
  Student,
  Company,
} from '../../models';
import { ITrainingDocument } from './training.model';
import { TokenPayload } from '../../utils/jwt.util';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.util';
import {
  TrainingStatus,
  AttendanceStatus,
  TaskStatus,
  UserRole,
  assertLegalTransition,
  assertRoleCanTransition,
  TRAINING_STATUS_TRANSITIONS,
  TRAINING_STATUS_TRANSITION_ROLES,
} from '../../shared';
import { logAuditEvent } from '../../utils/audit.util';

const COMPANY_SIDE_ROLES = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.TRAINING_ENTITY_SUPERVISOR];

/**
 * A training placement may only be mutated by its assigned academic/company
 * supervisor, someone from its own company, or a university-level override
 * (COOPERATIVE_TRAINING_UNIT / UNIVERSITY_ADMIN / SUPER_ADMIN).
 */
function assertTrainingActor(training: ITrainingDocument, user: TokenPayload): void {
  if (user.role === UserRole.SUPER_ADMIN) return;
  if (user.role === UserRole.COOPERATIVE_TRAINING_UNIT || user.role === UserRole.UNIVERSITY_ADMIN) return;
  if (user.role === UserRole.ACADEMIC_SUPERVISOR) {
    if (training.academicSupervisorId && training.academicSupervisorId.toString() === user.userId) return;
    throw new ForbiddenError('You are not the assigned academic supervisor for this training');
  }
  if (COMPANY_SIDE_ROLES.includes(user.role)) {
    if (user.companyId && training.companyId.toString() === user.companyId) return;
    throw new ForbiddenError('You do not belong to the company hosting this training');
  }
  throw new ForbiddenError('You are not permitted to modify this training placement');
}

export class TrainingController {
  async getMyTraining(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      const training = await Training.findOne({ studentId: student._id })
        .populate('companyId', 'nameEn nameAr logoUrl sector averageRating')
        .populate('opportunityId', 'titleEn titleAr workMode location')
        .populate('academicSupervisorId', 'firstNameEn lastNameEn email phone')
        .populate('companySupervisorId', 'firstNameEn lastNameEn email phone')
        .lean();

      sendSuccess(res, training);
    } catch (error) {
      next(error);
    }
  }

  async getTrainings(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;
      const companyId = req.query.companyId as string;

      const filter: any = {};
      if (status) filter.status = status;
      if (companyId) filter.companyId = companyId;

      const total = await Training.countDocuments(filter);
      const trainings = await Training.find(filter)
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstNameEn lastNameEn email avatarUrl' },
        })
        .populate('companyId', 'nameEn nameAr sector logoUrl')
        .populate('opportunityId', 'titleEn titleAr')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      sendPaginated(res, trainings, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrainingById(req: Request, res: Response, next: NextFunction) {
    try {
      const training = await Training.findById(req.params.id)
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstNameEn lastNameEn email avatarUrl phone' },
        })
        .populate('companyId')
        .populate('opportunityId')
        .populate('academicSupervisorId')
        .populate('companySupervisorId')
        .lean();

      if (!training) throw new NotFoundError('Training placement not found');

      // Fetch attendance, tasks, and reports
      const [attendance, tasks, reports] = await Promise.all([
        TrainingAttendance.find({ trainingId: training._id }).sort({ date: -1 }).limit(30).lean(),
        TrainingTask.find({ trainingId: training._id }).sort({ dueDate: 1 }).lean(),
        TrainingReport.find({ trainingId: training._id }).sort({ createdAt: -1 }).lean(),
      ]);

      sendSuccess(res, {
        ...training,
        attendance,
        tasks,
        reports,
      });
    } catch (error) {
      next(error);
    }
  }

  async logAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { trainingId, date, status, checkIn, checkOut, hours, notes } = req.body;
      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training not found');
      assertTrainingActor(training, req.user);

      const attendance = await TrainingAttendance.findOneAndUpdate(
        { trainingId, date: new Date(date) },
        {
          trainingId,
          studentId: training.studentId,
          date: new Date(date),
          status: status || AttendanceStatus.PRESENT,
          checkIn,
          checkOut,
          hours: hours || 8,
          notes,
        },
        { upsert: true, new: true }
      );

      // Recalculate training attendance percentage & hours
      const allAttendance = await TrainingAttendance.find({ trainingId });
      const presentCount = allAttendance.filter((a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.EXCUSED).length;
      const totalHours = allAttendance.reduce((acc, curr) => acc + (curr.hours || 0), 0);

      training.attendancePercentage = Math.round((presentCount / Math.max(allAttendance.length, 1)) * 100);
      training.totalHoursCompleted = totalHours;
      await training.save();

      sendSuccess(res, attendance, 'Attendance logged');
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { trainingId, title, description, dueDate, priority } = req.body;
      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training not found');
      assertTrainingActor(training, req.user);

      const task = await TrainingTask.create({
        trainingId,
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        status: TaskStatus.TODO,
      });
      sendSuccess(res, task, 'Task created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { status, comments } = req.body;
      const task = await TrainingTask.findById(req.params.taskId);
      if (!task) throw new NotFoundError('Task not found');

      const training = await Training.findById(task.trainingId);
      if (!training) throw new NotFoundError('Training not found for this task');
      assertTrainingActor(training, req.user);

      task.status = status;
      if (comments) task.comments = comments;
      if (status === TaskStatus.COMPLETED) task.completedAt = new Date();

      await task.save();
      sendSuccess(res, task, 'Task status updated');
    } catch (error) {
      next(error);
    }
  }

  async submitReport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { trainingId, reportType, weekNumber, title, activities, tasksCompleted, skillsApplied, challenges, learningOutcomes } = req.body;
      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training not found');

      // Reports are typically self-authored by the trainee; staff may also
      // file them (e.g. a supervisor logging a final report on the student's behalf).
      if (req.user.role === UserRole.STUDENT) {
        const student = await Student.findOne({ userId: req.user.userId });
        if (!student || training.studentId.toString() !== student._id.toString()) {
          throw new ForbiddenError('You may only submit reports for your own training');
        }
      } else {
        assertTrainingActor(training, req.user);
      }

      const report = await TrainingReport.create({
        trainingId,
        studentId: training.studentId,
        reportType,
        weekNumber,
        title,
        activities,
        tasksCompleted,
        skillsApplied,
        challenges,
        learningOutcomes,
        status: 'SUBMITTED',
      });

      sendSuccess(res, report, 'Training report submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  private static readonly REPORT_REVIEW_STATUSES = ['APPROVED', 'REVISION_REQUESTED'] as const;

  /**
   * Supervisor review of a submitted training report. Restricted to the
   * training's assigned actors (academic/company supervisor, or a
   * university-level override) via the same `assertTrainingActor` check
   * used for attendance/tasks/status.
   */
  async reviewReport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { status, supervisorComments } = req.body;
      if (!status || !TrainingController.REPORT_REVIEW_STATUSES.includes(status)) {
        throw new BadRequestError(
          `status must be one of: ${TrainingController.REPORT_REVIEW_STATUSES.join(', ')}`
        );
      }

      const { trainingId, reportId } = req.params;
      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training not found');
      assertTrainingActor(training, req.user);

      const report = await TrainingReport.findById(reportId);
      if (!report || report.trainingId.toString() !== trainingId) {
        throw new NotFoundError('Report not found for this training');
      }

      const prevStatus = report.status;
      report.status = status;
      if (supervisorComments !== undefined) report.supervisorComments = supervisorComments;
      await report.save();

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: `REVIEW_TRAINING_REPORT_${status}`,
        entity: 'TrainingReport',
        entityId: report._id.toString(),
        previousStatus: prevStatus,
        newStatus: status,
        comment: supervisorComments,
        ipAddress: req.ip,
      });

      sendSuccess(res, report, `Training report marked as ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async updateTrainingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { status, finalGrade } = req.body;
      if (!status || !Object.values(TrainingStatus).includes(status)) {
        throw new BadRequestError('Valid status is required');
      }

      const training = await Training.findById(req.params.id);
      if (!training) throw new NotFoundError('Training not found');
      assertTrainingActor(training, req.user);

      // Only the assigned academic supervisor (or a university-level override)
      // may certify a final grade.
      if (finalGrade !== undefined && COMPANY_SIDE_ROLES.includes(req.user.role)) {
        throw new ForbiddenError('Only an academic supervisor may set the final grade');
      }

      const prevStatus = training.status;
      assertLegalTransition(prevStatus, status, TRAINING_STATUS_TRANSITIONS);
      assertRoleCanTransition(req.user.role, status, TRAINING_STATUS_TRANSITION_ROLES);

      training.status = status;
      if (finalGrade !== undefined) training.finalGrade = finalGrade;
      await training.save();

      if (status === TrainingStatus.COMPLETED) {
        const company = await Company.findById(training.companyId);
        if (company) {
          company.studentsTrained = (company.studentsTrained || 0) + 1;
          await company.save();
        }
      }

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: `UPDATE_TRAINING_STATUS_TO_${status}`,
        entity: 'Training',
        entityId: training._id.toString(),
        previousStatus: prevStatus,
        newStatus: status,
        ipAddress: req.ip,
      });

      sendSuccess(res, training, `Training status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }
}

export const trainingController = new TrainingController();
