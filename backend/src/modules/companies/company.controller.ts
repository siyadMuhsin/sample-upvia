import { Request, Response, NextFunction } from 'express';
import { Company } from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError } from '../../utils/errors.util';

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
      const company = await Company.create(req.body);
      sendSuccess(res, company, 'Company registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!company) throw new NotFoundError('Company not found');
      sendSuccess(res, company, 'Company updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();
