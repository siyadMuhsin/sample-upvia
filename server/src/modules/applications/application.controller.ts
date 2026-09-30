import { Request, Response, NextFunction } from 'express';
import { Application, Student, Opportunity, Training } from '../../models';
import { defaultMatchingProvider } from '../matching/matching.service';
import { ensureTrainingForApplication } from '../training/training.service';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../utils/errors.util';
import {
  ApplicationStatus,
  TrainingStatus,
  UserRole,
  assertLegalTransition,
  assertRoleCanTransition,
  APPLICATION_STATUS_TRANSITIONS,
  APPLICATION_STATUS_TRANSITION_ROLES,
  TRAINING_STATUS_TRANSITIONS,
} from '../../shared';
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
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { opportunityId, status } = req.query;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const filter: any = {};
      if (status) filter.status = status;

      // Company staff may only see applications for their own company's opportunities.
      const isCompanyStaff = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER].includes(req.user.role);
      if (isCompanyStaff) {
        if (!req.user.companyId) throw new ForbiddenError('No company associated with this account');
        const companyOpportunityIds = await Opportunity.find({ companyId: req.user.companyId }).distinct('_id');
        if (opportunityId) {
          const requested = String(opportunityId);
          const owned = companyOpportunityIds.map((id: any) => id.toString());
          if (!owned.includes(requested)) throw new ForbiddenError('You do not own this opportunity');
          filter.opportunityId = requested;
        } else {
          filter.opportunityId = { $in: companyOpportunityIds };
        }
      } else if (opportunityId) {
        filter.opportunityId = opportunityId;
      }

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
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { status, notes, rejectionReason } = req.body;
      if (!status || !Object.values(ApplicationStatus).includes(status)) {
        throw new BadRequestError('Valid status is required');
      }

      const application = await Application.findById(req.params.id);
      if (!application) throw new NotFoundError('Application not found');

      const opportunity = await Opportunity.findById(application.opportunityId);
      if (!opportunity) throw new NotFoundError('Opportunity not found for this application');

      const isCompanyStaff = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER].includes(req.user.role);
      if (isCompanyStaff) {
        if (!req.user.companyId || opportunity.companyId.toString() !== req.user.companyId) {
          throw new ForbiddenError('You do not own the opportunity behind this application');
        }
      } else if (req.user.role === UserRole.STUDENT) {
        const student = await Student.findOne({ userId: req.user.userId });
        if (!student || application.studentId.toString() !== student._id.toString()) {
          throw new ForbiddenError('You may only withdraw your own applications');
        }
        if (status !== ApplicationStatus.WITHDRAWN) {
          throw new ForbiddenError('Students may only withdraw an application');
        }
      }

      const prevStatus = application.status;
      assertLegalTransition(prevStatus, status, APPLICATION_STATUS_TRANSITIONS);
      assertRoleCanTransition(req.user.role, status, APPLICATION_STATUS_TRANSITION_ROLES);

      application.status = status;
      if (notes) application.notes = notes;
      if (rejectionReason) application.rejectionReason = rejectionReason;
      await application.save();

      // Application -> Nomination bridge: provision the Training placement the
      // first time an application is selected, then promote it on acceptance.
      if (status === ApplicationStatus.SELECTED) {
        await ensureTrainingForApplication({
          studentId: application.studentId,
          opportunityId: application.opportunityId,
        });
      } else if (status === ApplicationStatus.ACCEPTED) {
        const training = await Training.findOne({
          studentId: application.studentId,
          opportunityId: application.opportunityId,
        });
        if (training && training.status === TrainingStatus.NOMINATED) {
          const prevTrainingStatus = training.status;
          assertLegalTransition(prevTrainingStatus, TrainingStatus.COMPANY_ADMISSION, TRAINING_STATUS_TRANSITIONS);
          training.status = TrainingStatus.COMPANY_ADMISSION;
          await training.save();
          await logAuditEvent({
            actorId: req.user.userId,
            actorName: req.user.email,
            actorRole: req.user.role,
            action: `TRANSITION_TRAINING_TO_${training.status}`,
            entity: 'Training',
            entityId: training._id.toString(),
            previousStatus: prevTrainingStatus,
            newStatus: training.status,
            ipAddress: req.ip,
          });
        }
      }

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

      sendSuccess(res, application, `Application status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }
}

export const applicationController = new ApplicationController();
