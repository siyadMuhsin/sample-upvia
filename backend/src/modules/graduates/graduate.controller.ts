import { Request, Response, NextFunction } from 'express';
import { Graduate, GraduateFollowUp, EmploymentRecord } from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';

export class GraduateController {
  async getGraduates(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const programId = req.query.programId as string;
      const status = req.query.status as string;

      const filter: any = {};
      if (programId) filter.programId = programId;
      if (status) filter.employmentStatus = status;

      const total = await Graduate.countDocuments(filter);
      const graduates = await Graduate.find(filter)
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstNameEn lastNameEn email phone avatarUrl' },
        })
        .populate('programId', 'nameEn code')
        .populate('collegeId', 'nameEn code')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ graduationYear: -1, cumulativeGpa: -1 })
        .lean();

      sendPaginated(res, graduates, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getGraduateFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const { graduateId } = req.params;
      const followUps = await GraduateFollowUp.find({ graduateId }).sort({ surveyCompletedAt: -1 }).lean();
      sendSuccess(res, followUps);
    } catch (error) {
      next(error);
    }
  }

  async submitFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const followUp = await GraduateFollowUp.create(req.body);
      // Update graduate current employment status
      await Graduate.findByIdAndUpdate(req.body.graduateId, {
        employmentStatus: req.body.employmentStatus,
        currentEmployer: req.body.employerName,
        currentJobTitle: req.body.jobTitle,
        currentSector: req.body.sector,
      });

      sendSuccess(res, followUp, 'Graduate follow-up recorded', 201);
    } catch (error) {
      next(error);
    }
  }

  async getEmploymentRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await EmploymentRecord.find()
        .populate('companyId', 'nameEn nameAr logoUrl sector')
        .populate('programId', 'nameEn code')
        .sort({ startDate: -1 })
        .limit(50)
        .lean();

      sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  }
}

export const graduateController = new GraduateController();
