import { Request, Response, NextFunction } from 'express';
import {
  Training,
  TrainingAttendance,
  TrainingTask,
  TrainingReport,
  Student,
} from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';
import { TrainingStatus, AttendanceStatus, TaskStatus, UserRole } from '@upvia/shared';
import { logAuditEvent } from '../../utils/audit.util';

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
      const { trainingId, date, status, checkIn, checkOut, hours, notes } = req.body;
      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training not found');

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
      const { trainingId, title, description, dueDate, priority } = req.body;
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
      const { status, comments } = req.body;
      const task = await TrainingTask.findById(req.params.taskId);
      if (!task) throw new NotFoundError('Task not found');

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
      const { trainingId, reportType, weekNumber, title, activities, tasksCompleted, skillsApplied, challenges, learningOutcomes } = req.body;
      const training = await Training.findById(trainingId);
      if (!training) throw new NotFoundError('Training not found');

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

  async updateTrainingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, finalGrade } = req.body;
      const training = await Training.findById(req.params.id);
      if (!training) throw new NotFoundError('Training not found');

      const prevStatus = training.status;
      training.status = status;
      if (finalGrade !== undefined) training.finalGrade = finalGrade;
      await training.save();

      if (req.user) {
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
      }

      sendSuccess(res, training, `Training status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }
}

export const trainingController = new TrainingController();
