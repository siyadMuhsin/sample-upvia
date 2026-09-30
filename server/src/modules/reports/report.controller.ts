import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
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
import { maskGraduateSalary } from '../graduates/graduate-privacy.util';

/** Top-level scalar/primitive keys usable as flat table columns for exports. */
function flatKeys(row: Record<string, any>): string[] {
  return Object.keys(row).filter((k) => row[k] === null || row[k] === undefined || typeof row[k] !== 'object');
}

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
          data = (
            await Graduate.find()
              .populate('programId', 'nameEn code')
              .populate('collegeId', 'nameEn')
              .lean()
          ).map(maskGraduateSalary);
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

      if (format === 'EXCEL') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet((reportType || 'Report').slice(0, 31));

        const keys = data.length > 0 ? flatKeys(data[0]) : [];
        worksheet.columns = keys.map((k) => ({ header: k, key: k, width: 22 }));
        data.forEach((row) => {
          const flatRow: Record<string, any> = {};
          keys.forEach((k) => {
            flatRow[k] = row[k] ?? '';
          });
          worksheet.addRow(flatRow);
        });
        worksheet.getRow(1).font = { bold: true };

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

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
        return;
      }

      if (format === 'PDF') {
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

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);

        doc.fontSize(18).text(`Upvia ${reportType || 'Report'}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#42506B').text(`Generated: ${new Date().toISOString()} — ${data.length} record(s)`, {
          align: 'center',
        });
        doc.moveDown(1.5);
        doc.fillColor('#0B1B3A');

        if (data.length === 0) {
          doc.fontSize(12).text('No data available for this report.');
        } else {
          const keys = flatKeys(data[0]);
          data.forEach((row, idx) => {
            const line = keys.map((k) => `${k}: ${row[k] ?? '—'}`).join('   |   ');
            doc.fontSize(9).text(`${idx + 1}. ${line}`, { width: 515 });
            doc.moveDown(0.3);
            if (doc.y > 760) doc.addPage();
          });
        }

        doc.end();
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
