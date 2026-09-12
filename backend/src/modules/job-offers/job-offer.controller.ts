import { Request, Response, NextFunction } from 'express';
import { JobOffer, Student, EmploymentRecord, Company } from '../../models';
import { sendSuccess } from '../../utils/response.util';
import { NotFoundError, BadRequestError } from '../../utils/errors.util';
import { JobOfferStatus, StudentStatus } from '@upvia/shared';
import { logAuditEvent } from '../../utils/audit.util';

export class JobOfferController {
  async createJobOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { trainingId, studentId, companyId, jobTitleEn, jobTitleAr, salary, city, employmentType, startDate } = req.body;

      const offer = await JobOffer.create({
        trainingId,
        studentId,
        companyId,
        jobTitleEn,
        jobTitleAr,
        salary,
        city,
        employmentType: employmentType || 'FULL_TIME',
        startDate: new Date(startDate),
        offerDate: new Date(),
        status: JobOfferStatus.PENDING,
      });

      if (req.user) {
        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: 'EXTEND_JOB_OFFER',
          entity: 'JobOffer',
          entityId: offer._id.toString(),
          newStatus: JobOfferStatus.PENDING,
          ipAddress: req.ip,
        });
      }

      sendSuccess(res, offer, 'Job offer submitted to student', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyOffers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      const offers = await JobOffer.find({ studentId: student._id })
        .populate('companyId', 'nameEn nameAr logoUrl sector averageRating')
        .sort({ createdAt: -1 })
        .lean();

      sendSuccess(res, offers);
    } catch (error) {
      next(error);
    }
  }

  async respondToOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body; // ACCEPTED or REJECTED
      const offer = await JobOffer.findById(req.params.id);
      if (!offer) throw new NotFoundError('Job offer not found');

      offer.status = status;
      await offer.save();

      if (status === JobOfferStatus.ACCEPTED) {
        // Find student and company to create EmploymentRecord
        const student = await Student.findById(offer.studentId);
        const company = await Company.findById(offer.companyId);

        if (student && company) {
          student.studentStatus = StudentStatus.GRADUATE;
          await student.save();

          await EmploymentRecord.create({
            studentId: student._id,
            companyId: company._id,
            companyName: company.nameEn,
            programId: student.programId,
            collegeId: student.collegeId,
            universityId: student.universityId,
            jobTitle: offer.jobTitleEn,
            sector: company.sector,
            salary: offer.salary,
            startDate: offer.startDate,
            isPostTrainingHire: !!offer.trainingId,
            trainingId: offer.trainingId,
            timeToEmploymentMonths: 1,
            skillsUsed: ['TypeScript', 'Full-Stack Development', 'Problem Solving'],
          });

          // Update company employed count
          company.studentsEmployed = (company.studentsEmployed || 0) + 1;
          if (company.studentsTrained > 0) {
            company.trainingToEmploymentRate =
              Math.round((company.studentsEmployed / company.studentsTrained) * 1000) / 10;
          }
          await company.save();
        }
      }

      if (req.user) {
        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: `JOB_OFFER_${status}`,
          entity: 'JobOffer',
          entityId: offer._id.toString(),
          newStatus: status,
          ipAddress: req.ip,
        });
      }

      sendSuccess(res, offer, `Job offer ${status.toLowerCase()}`);
    } catch (error) {
      next(error);
    }
  }
}

export const jobOfferController = new JobOfferController();
