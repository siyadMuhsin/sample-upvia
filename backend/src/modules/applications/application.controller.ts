import { Request, Response, NextFunction } from 'express';
import { Application, Student, Opportunity } from '../../models';
import { defaultMatchingProvider } from '../matching/matching.service';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors.util';
import { ApplicationStatus, UserRole } from '@upvia/shared';
import { logAuditEvent } from '../../utils/audit.util';

export class ApplicationController {
  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { opportunityId, coverLetter, cvUrl } = req.body;
      if (!opportunityId) throw new BadRequestError('opportunityId is required');

      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      const opportunity = await Opportunity.findById(opportunityId);
      if (!opportunity) throw new NotFoundError('Opportunity not found');

      const existing = await Application.findOne({ studentId: student._id, opportunityId });
      if (existing) throw new ConflictError('You have already submitted an application for this opportunity');

      // Calculate explainable match score
      const matchResult = await defaultMatchingProvider.calculateMatch(student, opportunity);

      const application = await Application.create({
        opportunityId: opportunity._id,
        studentId: student._id,
        status: ApplicationStatus.SUBMITTED,
        cvUrl: cvUrl || student.cvUrl,
        coverLetter,
        matchScore: matchResult.score,
        matchDetails: matchResult,
      });

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: `${req.user.email}`,
        actorRole: req.user.role,
        action: 'SUBMIT_APPLICATION',
        entity: 'Application',
        entityId: application._id.toString(),
        newStatus: ApplicationStatus.SUBMITTED,
        ipAddress: req.ip,
      });

      sendSuccess(res, application, 'Application submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      const applications = await Application.find({ studentId: student._id })
        .populate({
          path: 'opportunityId',
          populate: { path: 'companyId', select: 'nameEn nameAr logoUrl sector averageRating' },
        })
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, applications);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const { opportunityId, status } = req.query;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const filter: any = {};
      if (opportunityId) filter.opportunityId = opportunityId;
      if (status) filter.status = status;

      const total = await Application.countDocuments(filter);
      const applications = await Application.find(filter)
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstNameEn lastNameEn email avatarUrl phone' },
        })
        .populate('opportunityId', 'titleEn titleAr type location')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ matchScore: -1, createdAt: -1 })
        .lean();

      sendPaginated(res, applications, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, notes, rejectionReason } = req.body;
      const application = await Application.findById(req.params.id);
      if (!application) throw new NotFoundError('Application not found');

      const prevStatus = application.status;
      application.status = status;
      if (notes) application.notes = notes;
      if (rejectionReason) application.rejectionReason = rejectionReason;

      await application.save();

      if (req.user) {
        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: `UPDATE_APPLICATION_${status}`,
          entity: 'Application',
          entityId: application._id.toString(),
          previousStatus: prevStatus,
          newStatus: status,
          ipAddress: req.ip,
        });
      }

      sendSuccess(res, application, `Application status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }
}

export const applicationController = new ApplicationController();
