import { Request, Response, NextFunction } from 'express';
import { Interview, Application, Opportunity, Student } from '../../models';
import { sendSuccess, sendPaginated } from '../../utils/response.util';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.util';
import {
  InterviewStatus,
  ApplicationStatus,
  UserRole,
  assertLegalTransition,
  assertRoleCanTransition,
  INTERVIEW_STATUS_TRANSITIONS,
  INTERVIEW_STATUS_TRANSITION_ROLES,
  APPLICATION_STATUS_TRANSITIONS,
  APPLICATION_STATUS_TRANSITION_ROLES,
} from '../../shared';
import { logAuditEvent } from '../../utils/audit.util';

const COMPANY_STAFF_ROLES = [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER];
const VALID_RESULTS = ['RECOMMENDED', 'NOT_RECOMMENDED', 'PENDING'];

export class InterviewController {
  /**
   * Schedules an interview for an application. If the application is still
   * SHORTLISTED, this also advances it to INTERVIEW — closing the gap where
   * interviews previously had no wiring into the application lifecycle at all.
   */
  async scheduleInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { applicationId, date, time, type, location, meetingUrl, interviewers } = req.body;

      if (!applicationId || !date || !time) {
        throw new BadRequestError('applicationId, date, and time are required');
      }

      const application = await Application.findById(applicationId);
      if (!application) throw new NotFoundError('Application not found');

      const opportunity = await Opportunity.findById(application.opportunityId);
      if (!opportunity) throw new NotFoundError('Opportunity not found for this application');

      if (COMPANY_STAFF_ROLES.includes(req.user.role)) {
        if (!req.user.companyId || opportunity.companyId.toString() !== req.user.companyId) {
          throw new ForbiddenError('You do not own the opportunity behind this application');
        }
      }

      const interview = await Interview.create({
        applicationId: application._id,
        studentId: application.studentId,
        companyId: opportunity.companyId,
        date: new Date(date),
        time,
        type,
        location,
        meetingUrl,
        interviewers: interviewers || [],
        status: InterviewStatus.SCHEDULED,
        result: 'PENDING',
      });

      // Advance the application lifecycle: SHORTLISTED -> INTERVIEW.
      if (application.status === ApplicationStatus.SHORTLISTED) {
        const prevStatus = application.status;
        assertLegalTransition(prevStatus, ApplicationStatus.INTERVIEW, APPLICATION_STATUS_TRANSITIONS);
        assertRoleCanTransition(req.user.role, ApplicationStatus.INTERVIEW, APPLICATION_STATUS_TRANSITION_ROLES);
        application.status = ApplicationStatus.INTERVIEW;
        await application.save();

        await logAuditEvent({
          actorId: req.user.userId,
          actorName: req.user.email,
          actorRole: req.user.role,
          action: 'TRANSITION_APPLICATION_TO_INTERVIEW',
          entity: 'Application',
          entityId: application._id.toString(),
          previousStatus: prevStatus,
          newStatus: ApplicationStatus.INTERVIEW,
          ipAddress: req.ip,
        });
      }

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: 'SCHEDULE_INTERVIEW',
        entity: 'Interview',
        entityId: interview._id.toString(),
        newStatus: InterviewStatus.SCHEDULED,
        ipAddress: req.ip,
      });

      sendSuccess(res, interview, 'Interview scheduled successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyInterviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student) throw new NotFoundError('Student profile not found');

      const interviews = await Interview.find({ studentId: student._id })
        .populate('companyId', 'nameEn nameAr logoUrl sector')
        .populate('applicationId', 'opportunityId status')
        .sort({ date: -1 })
        .lean();

      sendSuccess(res, interviews);
    } catch (error) {
      next(error);
    }
  }

  async getInterviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as string;

      const filter: any = {};
      if (status) filter.status = status;

      if (COMPANY_STAFF_ROLES.includes(req.user.role) || req.user.role === UserRole.TRAINING_ENTITY_SUPERVISOR) {
        if (!req.user.companyId) throw new ForbiddenError('No company associated with this account');
        filter.companyId = req.user.companyId;
      } else if (req.query.companyId) {
        filter.companyId = req.query.companyId;
      }

      const total = await Interview.countDocuments(filter);
      const interviews = await Interview.find(filter)
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstNameEn lastNameEn email avatarUrl' },
        })
        .populate('companyId', 'nameEn nameAr logoUrl')
        .populate('applicationId', 'opportunityId status')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date: -1 })
        .lean();

      sendPaginated(res, interviews, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getInterviewById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await Interview.findById(req.params.id)
        .populate({
          path: 'studentId',
          populate: { path: 'userId', select: 'firstNameEn lastNameEn email avatarUrl' },
        })
        .populate('companyId')
        .populate('applicationId')
        .lean();

      if (!interview) throw new NotFoundError('Interview not found');
      sendSuccess(res, interview);
    } catch (error) {
      next(error);
    }
  }

  private assertInterviewActor(interview: { companyId: any }, user: { role: UserRole; companyId?: string }): void {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.COOPERATIVE_TRAINING_UNIT || user.role === UserRole.UNIVERSITY_ADMIN) {
      return;
    }
    if (COMPANY_STAFF_ROLES.includes(user.role)) {
      if (user.companyId && interview.companyId.toString() === user.companyId) return;
      throw new ForbiddenError('You do not belong to the company hosting this interview');
    }
    throw new ForbiddenError('You are not permitted to manage this interview');
  }

  async updateInterviewStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { status, date, time } = req.body;
      if (!status || !Object.values(InterviewStatus).includes(status)) {
        throw new BadRequestError('Valid status is required');
      }

      const interview = await Interview.findById(req.params.id);
      if (!interview) throw new NotFoundError('Interview not found');
      this.assertInterviewActor(interview, req.user);

      const prevStatus = interview.status;
      assertLegalTransition(prevStatus, status, INTERVIEW_STATUS_TRANSITIONS);
      assertRoleCanTransition(req.user.role, status, INTERVIEW_STATUS_TRANSITION_ROLES);

      interview.status = status;
      // Rescheduling / re-confirming a date naturally comes with new date/time.
      if (date) interview.date = new Date(date);
      if (time) interview.time = time;
      await interview.save();

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: `UPDATE_INTERVIEW_STATUS_TO_${status}`,
        entity: 'Interview',
        entityId: interview._id.toString(),
        previousStatus: prevStatus,
        newStatus: status,
        ipAddress: req.ip,
      });

      sendSuccess(res, interview, `Interview status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Records the interviewer's evaluation outcome. Submitting a result
   * implicitly completes the interview if it's still SCHEDULED/RESCHEDULED.
   */
  async submitResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { result, notes } = req.body;
      if (!result || !VALID_RESULTS.includes(result)) {
        throw new BadRequestError(`result must be one of: ${VALID_RESULTS.join(', ')}`);
      }

      const interview = await Interview.findById(req.params.id);
      if (!interview) throw new NotFoundError('Interview not found');
      this.assertInterviewActor(interview, req.user);

      const prevStatus = interview.status;
      if (prevStatus === InterviewStatus.SCHEDULED || prevStatus === InterviewStatus.RESCHEDULED) {
        assertLegalTransition(prevStatus, InterviewStatus.COMPLETED, INTERVIEW_STATUS_TRANSITIONS);
        assertRoleCanTransition(req.user.role, InterviewStatus.COMPLETED, INTERVIEW_STATUS_TRANSITION_ROLES);
        interview.status = InterviewStatus.COMPLETED;
      } else if (prevStatus === InterviewStatus.CANCELLED) {
        throw new BadRequestError('Cannot submit a result for a cancelled interview');
      }

      interview.result = result;
      if (notes) interview.notes = notes;
      await interview.save();

      await logAuditEvent({
        actorId: req.user.userId,
        actorName: req.user.email,
        actorRole: req.user.role,
        action: `SUBMIT_INTERVIEW_RESULT_${result}`,
        entity: 'Interview',
        entityId: interview._id.toString(),
        previousStatus: prevStatus,
        newStatus: interview.status,
        comment: notes,
        ipAddress: req.ip,
      });

      sendSuccess(res, interview, `Interview result recorded as ${result}`);
    } catch (error) {
      next(error);
    }
  }
}

export const interviewController = new InterviewController();
