import { Request, Response, NextFunction } from 'express';
import { Opportunity } from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';
import { OpportunityStatus, UserRole } from '@upvia/shared';
import { logAuditEvent } from '../../utils/audit.util';

export class OpportunityController {
  async getOpportunities(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const type = req.query.type as string;
      const city = req.query.city as string;
      const specialization = req.query.specialization as string;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const filter: any = {};
      // Public / students view published by default unless specified by admin
      if (status) {
        filter.status = status;
      } else if (!req.user || req.user.role === UserRole.STUDENT) {
        filter.status = OpportunityStatus.PUBLISHED;
      }

      if (type) filter.type = type;
      if (city) filter.city = city;
      if (specialization) filter.requiredSpecializations = specialization;
      if (search) {
        filter.$or = [
          { titleEn: { $regex: search, $options: 'i' } },
          { descriptionEn: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await Opportunity.countDocuments(filter);
      const opportunities = await Opportunity.find(filter)
        .populate('companyId', 'nameEn nameAr logoUrl sector averageRating cities')
        .populate('requiredSkills.skillId', 'nameEn category')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      sendPaginated(res, opportunities, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getOpportunityById(req: Request, res: Response, next: NextFunction) {
    try {
      const opportunity = await Opportunity.findById(req.params.id)
        .populate('companyId')
        .populate('requiredSkills.skillId')
        .lean();
      if (!opportunity) throw new NotFoundError('Opportunity not found');
      sendSuccess(res, opportunity);
    } catch (error) {
      next(error);
    }
  }

  async createOpportunity(req: Request, res: Response, next: NextFunction) {
    try {
      const oppData = {
        ...req.body,
        seatsRemaining: req.body.numberOfSeats,
        status: req.user?.role === UserRole.SUPER_ADMIN ? OpportunityStatus.PUBLISHED : OpportunityStatus.SUBMITTED,
      };

      const opportunity = await Opportunity.create(oppData);

      if (req.user) {
        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: 'CREATE_OPPORTUNITY',
          entity: 'Opportunity',
          entityId: opportunity._id.toString(),
          newStatus: opportunity.status,
          ipAddress: req.ip,
        });
      }

      sendSuccess(res, opportunity, 'Opportunity created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkflowStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, comment, rejectionReason } = req.body;
      if (!status || !Object.values(OpportunityStatus).includes(status)) {
        throw new BadRequestError('Valid status is required');
      }

      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) throw new NotFoundError('Opportunity not found');

      const prevStatus = opportunity.status;
      opportunity.status = status;
      if (rejectionReason) opportunity.rejectionReason = rejectionReason;

      if (status === OpportunityStatus.PROGRAM_REVIEW && req.user) {
        opportunity.reviewedByProgramCoordinatorId = req.user.userId as any;
      } else if (status === OpportunityStatus.TRAINING_UNIT_REVIEW && req.user) {
        opportunity.reviewedByTrainingUnitId = req.user.userId as any;
      } else if (status === OpportunityStatus.APPROVED && req.user) {
        opportunity.approvedByUniversityId = req.user.userId as any;
      }

      await opportunity.save();

      if (req.user) {
        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: `TRANSITION_OPPORTUNITY_TO_${status}`,
          entity: 'Opportunity',
          entityId: opportunity._id.toString(),
          previousStatus: prevStatus,
          newStatus: status,
          comment,
          ipAddress: req.ip,
        });
      }

      sendSuccess(res, opportunity, `Opportunity moved to ${status}`);
    } catch (error) {
      next(error);
    }
  }
}

export const opportunityController = new OpportunityController();
