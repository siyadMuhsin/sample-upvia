import { Request, Response, NextFunction } from 'express';
import { Company } from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.util';
import { UserRole } from '../../shared';
import { logAuditEvent } from '../../utils/audit.util';

const COMPANY_STAFF_ROLES = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER];

// Fields a caller may set directly; aggregate/derived metrics and partnership
// status are excluded and only mutated by server-side logic.
const COMPANY_WRITABLE_FIELDS = [
  'nameEn',
  'nameAr',
  'logoUrl',
  'descriptionEn',
  'descriptionAr',
  'sector',
  'industry',
  'companySize',
  'cities',
  'website',
  'contacts',
  'requiredSpecializations',
  'requiredSkills',
] as const;

function pickWritableFields(body: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const field of COMPANY_WRITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
}

export class CompanyController {
  async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const sector = req.query.sector as string;
      const search = req.query.search as string;

      const filter: any = {};
      if (sector) filter.sector = sector;
      if (search) {
        filter.$or = [
          { nameEn: { $regex: search, $options: 'i' } },
          { nameAr: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await Company.countDocuments(filter);
      const companies = await Company.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ trainingToEmploymentRate: -1 })
        .lean();

      sendPaginated(res, companies, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyById(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await Company.findById(req.params.id)
        .populate('requiredSkills.skillId')
        .lean();
      if (!company) throw new NotFoundError('Company not found');
      sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  }

  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await Company.create(pickWritableFields(req.body));
      sendSuccess(res, company, 'Company registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');

      if (COMPANY_STAFF_ROLES.includes(req.user.role) && req.user.companyId !== req.params.id) {
        throw new ForbiddenError('You may only update your own company profile');
      }

      const company = await Company.findByIdAndUpdate(req.params.id, pickWritableFields(req.body), { new: true });
      if (!company) throw new NotFoundError('Company not found');
      sendSuccess(res, company, 'Company updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePartnershipDecision(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { decision, note } = req.body;
      const validDecisions = ['ACTIVE', 'STRENGTHEN', 'REVIEW', 'TERMINATE'];
      if (!decision || !validDecisions.includes(decision)) {
        throw new BadRequestError(`decision must be one of: ${validDecisions.join(', ')}`);
      }

      const company = await Company.findById(req.params.id);
      if (!company) throw new NotFoundError('Company not found');

      const previousDecision = company.partnershipDecision;
      company.partnershipDecision = decision;
      company.partnershipDecisionNote = note;
      company.partnershipDecisionAt = new Date();
      company.partnershipDecisionBy = req.user.userId as any;
      await company.save();

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: `PARTNERSHIP_DECISION_${decision}`,
        entity: 'Company',
        entityId: company._id.toString(),
        previousStatus: previousDecision,
        newStatus: decision,
        comment: note,
        ipAddress: req.ip,
      });

      sendSuccess(res, company, `Partnership decision set to ${decision}`);
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();
