import { Request, Response, NextFunction } from 'express';
import {
  Student,
  Company,
  Opportunity,
  Training,
  Graduate,
  EmploymentRecord,
  SkillGap,
  ReportRecord,
} from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { BadRequestError } from '../../utils/errors.util';

export class ReportController {
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportType, format = 'JSON' } = req.body;
      let data: any[] = [];
      let filename = `upvia-${reportType?.toLowerCase() || 'report'}-${Date.now()}`;

      switch (reportType) {
        case 'EMPLOYMENT_REPORT':
          data = await EmploymentRecord.find().populate('companyId', 'nameEn sector').lean();
          break;
        case 'TRAINING_REPORT':
          data = await Training.find()
            .populate('companyId', 'nameEn sector')
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstNameEn lastNameEn email' } })
            .lean();
          break;
        case 'COMPANIES_PERFORMANCE_REPORT':
          data = await Company.find()
            .select('nameEn sector trainingToEmploymentRate averageRating studentsTrained studentsEmployed')
            .lean();
          break;
        case 'SKILL_GAPS_REPORT':
          data = await SkillGap.find()
            .populate('programId', 'nameEn code')
            .populate('skillId', 'nameEn category')
            .lean();
          break;
        case 'GRADUATE_TRACKING_REPORT':
          data = await Graduate.find()
            .populate('programId', 'nameEn code')
            .populate('collegeId', 'nameEn')
            .lean();
          break;
        default:
          throw new BadRequestError(`Unsupported report type: ${reportType}`);
      }

      if (format === 'CSV') {
        // Flatten simple keys for CSV
        if (data.length === 0) {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
          res.status(200).send('No data available');
          return;
        }

        const keys = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object');
        const csvRows = [
          keys.join(','),
          ...data.map((row) => keys.map((k) => JSON.stringify(row[k] ?? '')).join(',')),
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.status(200).send(csvRows.join('\n'));
        return;
      }

      // Record generation in ReportRecord
      if (req.user) {
        await ReportRecord.create({
          title: `${reportType} Export`,
          reportType,
          format,
          parameters: req.body,
          generatedBy: req.user.userId,
          status: 'GENERATED',
        });
      }

      sendSuccess(res, {
        reportType,
        format,
        generatedAt: new Date(),
        totalRecords: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ReportRecord.find()
        .populate('generatedBy', 'firstNameEn lastNameEn email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      sendSuccess(res, reports);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
