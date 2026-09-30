import { Request, Response, NextFunction } from 'express';
import { Opportunity, Company } from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.util';
import {
  OpportunityStatus,
  UserRole,
  assertLegalTransition,
  assertRoleCanTransition,
  OPPORTUNITY_STATUS_TRANSITIONS,
  OPPORTUNITY_STATUS_TRANSITION_ROLES,
} from '../../shared';
import { logAuditEvent } from '../../utils/audit.util';

const COMPANY_STAFF_ROLES = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER];

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

      // Company staff only ever see their own company's postings (including
      // drafts, pending review, and rejected/needs-revision ones) — never a
      // competitor's unpublished pipeline.
      if (req.user && COMPANY_STAFF_ROLES.includes(req.user.role)) {
        if (!req.user.companyId) throw new ForbiddenError('No company associated with this account');
        filter.companyId = req.user.companyId;
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
      if (!req.user) throw new BadRequestError('User not authenticated');

      // Company staff can only ever post on behalf of their own company —
      // any client-supplied companyId is ignored to prevent spoofing.
      let companyId: string | undefined = req.body.companyId;
      if (COMPANY_STAFF_ROLES.includes(req.user.role)) {
        if (!req.user.companyId) throw new ForbiddenError('No company associated with this account');
        companyId = req.user.companyId;
      }
      if (!companyId) throw new BadRequestError('companyId is required');

      const company = await Company.findById(companyId);
      if (!company) throw new NotFoundError('Company not found');

      const oppData = {
        ...req.body,
        companyId,
        seatsRemaining: req.body.numberOfSeats,
        status: req.user.role === UserRole.SUPER_ADMIN ? OpportunityStatus.PUBLISHED : OpportunityStatus.SUBMITTED,
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
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { status, comment, rejectionReason } = req.body;
      if (!status || !Object.values(OpportunityStatus).includes(status)) {
        throw new BadRequestError('Valid status is required');
      }

      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) throw new NotFoundError('Opportunity not found');

      if (COMPANY_STAFF_ROLES.includes(req.user.role)) {
        if (!req.user.companyId || opportunity.companyId.toString() !== req.user.companyId) {
          throw new ForbiddenError('You do not own this opportunity');
        }
      }

      const isRejectionPath = status === OpportunityStatus.REJECTED || status === OpportunityStatus.NEEDS_REVISION;
      if (isRejectionPath && !rejectionReason?.trim()) {
        throw new BadRequestError('rejectionReason is required when rejecting or requesting revisions');
      }

      const prevStatus = opportunity.status;
      assertLegalTransition(prevStatus, status, OPPORTUNITY_STATUS_TRANSITIONS);
      assertRoleCanTransition(req.user.role, status, OPPORTUNITY_STATUS_TRANSITION_ROLES);

      opportunity.status = status;

      if (status === OpportunityStatus.PROGRAM_REVIEW) {
        opportunity.reviewedByProgramCoordinatorId = req.user.userId as any;
      } else if (status === OpportunityStatus.TRAINING_UNIT_REVIEW) {
        opportunity.reviewedByTrainingUnitId = req.user.userId as any;
      } else if (status === OpportunityStatus.APPROVED) {
        opportunity.approvedByUniversityId = req.user.userId as any;
      } else if (isRejectionPath) {
        opportunity.rejectionReason = rejectionReason.trim();
        opportunity.rejectedByUserId = req.user.userId as any;
      } else {
        // Non-rejection re-transitions (e.g. NEEDS_REVISION/REJECTED -> SUBMITTED on resubmit)
        // clear any stale rejection record so the company banner doesn't persist.
        opportunity.rejectionReason = undefined;
        opportunity.rejectedByUserId = undefined;
      }

      await opportunity.save();

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: `TRANSITION_OPPORTUNITY_TO_${status}`,
        entity: 'Opportunity',
        entityId: opportunity._id.toString(),
        previousStatus: prevStatus,
        newStatus: status,
        comment: isRejectionPath ? rejectionReason.trim() : comment,
        ipAddress: req.ip,
      });

      sendSuccess(res, opportunity, `Opportunity moved to ${status}`);
    } catch (error) {
      next(error);
    }
  }
}

export const opportunityController = new OpportunityController();
