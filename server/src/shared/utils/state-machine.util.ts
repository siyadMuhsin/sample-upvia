import { BadRequestError, ForbiddenError } from '../../utils/errors.util';
import { OpportunityStatus, ApplicationStatus, TrainingStatus, InterviewStatus, UserRole } from '../constants';

/**
 * Throws if `next` is not a legal successor of `current` per `allowedTransitions`.
 * A no-op transition (current === next) is always legal (idempotent re-submits).
 */
export function assertLegalTransition<T extends string>(
  current: T,
  next: T,
  allowedTransitions: Partial<Record<T, T[]>>
): void {
  if (current === next) return;
  const allowed = allowedTransitions[current] || [];
  if (!allowed.includes(next)) {
    throw new BadRequestError(
      `Illegal status transition: ${current} -> ${next}`,
      'ILLEGAL_TRANSITION'
    );
  }
}

/**
 * Throws if `role` is not permitted to set the target status `next`, per `roleMap`.
 * SUPER_ADMIN always bypasses (mirrors the blanket bypass in rbac.middleware.ts).
 * A target status absent from `roleMap` is treated as unrestricted.
 */
export function assertRoleCanTransition(
  role: UserRole,
  next: string,
  roleMap: Record<string, UserRole[]>
): void {
  if (role === UserRole.SUPER_ADMIN) return;
  const allowedRoles = roleMap[next];
  if (allowedRoles && !allowedRoles.includes(role)) {
    throw new ForbiddenError(`Role ${role} is not permitted to set status to ${next}`);
  }
}

// ---------------------------------------------------------------------------
// Opportunity status state machine
// ---------------------------------------------------------------------------

export const OPPORTUNITY_STATUS_TRANSITIONS: Partial<Record<OpportunityStatus, OpportunityStatus[]>> = {
  [OpportunityStatus.DRAFT]: [OpportunityStatus.SUBMITTED],
  [OpportunityStatus.SUBMITTED]: [
    OpportunityStatus.PROGRAM_REVIEW,
    OpportunityStatus.REJECTED,
    OpportunityStatus.NEEDS_REVISION,
  ],
  [OpportunityStatus.PROGRAM_REVIEW]: [
    OpportunityStatus.TRAINING_UNIT_REVIEW,
    OpportunityStatus.REJECTED,
    OpportunityStatus.NEEDS_REVISION,
  ],
  [OpportunityStatus.TRAINING_UNIT_REVIEW]: [
    OpportunityStatus.APPROVED,
    OpportunityStatus.REJECTED,
    OpportunityStatus.NEEDS_REVISION,
  ],
  [OpportunityStatus.APPROVED]: [OpportunityStatus.PUBLISHED],
  [OpportunityStatus.PUBLISHED]: [OpportunityStatus.CLOSED],
  [OpportunityStatus.CLOSED]: [OpportunityStatus.ARCHIVED],
  [OpportunityStatus.REJECTED]: [OpportunityStatus.SUBMITTED, OpportunityStatus.ARCHIVED],
  [OpportunityStatus.NEEDS_REVISION]: [OpportunityStatus.SUBMITTED, OpportunityStatus.ARCHIVED],
  [OpportunityStatus.ARCHIVED]: [],
};

export const OPPORTUNITY_STATUS_TRANSITION_ROLES: Record<string, UserRole[]> = {
  [OpportunityStatus.SUBMITTED]: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.UNIVERSITY_ADMIN],
  [OpportunityStatus.PROGRAM_REVIEW]: [UserRole.PROGRAM_COORDINATOR, UserRole.UNIVERSITY_ADMIN],
  [OpportunityStatus.TRAINING_UNIT_REVIEW]: [UserRole.PROGRAM_COORDINATOR, UserRole.UNIVERSITY_ADMIN],
  [OpportunityStatus.APPROVED]: [UserRole.COOPERATIVE_TRAINING_UNIT, UserRole.UNIVERSITY_ADMIN],
  [OpportunityStatus.PUBLISHED]: [UserRole.COOPERATIVE_TRAINING_UNIT, UserRole.UNIVERSITY_ADMIN],
  [OpportunityStatus.REJECTED]: [UserRole.PROGRAM_COORDINATOR, UserRole.COOPERATIVE_TRAINING_UNIT, UserRole.UNIVERSITY_ADMIN],
  [OpportunityStatus.NEEDS_REVISION]: [
    UserRole.PROGRAM_COORDINATOR,
    UserRole.COOPERATIVE_TRAINING_UNIT,
    UserRole.UNIVERSITY_ADMIN,
  ],
  [OpportunityStatus.CLOSED]: [
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_RECRUITER,
    UserRole.COOPERATIVE_TRAINING_UNIT,
    UserRole.UNIVERSITY_ADMIN,
  ],
  [OpportunityStatus.ARCHIVED]: [UserRole.COOPERATIVE_TRAINING_UNIT, UserRole.UNIVERSITY_ADMIN],
};

// ---------------------------------------------------------------------------
// Application status state machine
// ---------------------------------------------------------------------------

export const APPLICATION_STATUS_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.INTERVIEW]: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SELECTED]: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.ACCEPTED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

// Roles allowed to move an application to the given target status.
// STUDENT is intentionally restricted to WITHDRAWN only; ownership (their own
// application) must additionally be checked by the caller.
export const APPLICATION_STATUS_TRANSITION_ROLES: Record<string, UserRole[]> = {
  [ApplicationStatus.UNDER_REVIEW]: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.COOPERATIVE_TRAINING_UNIT],
  [ApplicationStatus.SHORTLISTED]: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER],
  [ApplicationStatus.INTERVIEW]: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER],
  [ApplicationStatus.SELECTED]: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER],
  [ApplicationStatus.ACCEPTED]: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.COOPERATIVE_TRAINING_UNIT],
  [ApplicationStatus.REJECTED]: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.COOPERATIVE_TRAINING_UNIT],
  [ApplicationStatus.WITHDRAWN]: [UserRole.STUDENT],
};

// ---------------------------------------------------------------------------
// Training status state machine
// ---------------------------------------------------------------------------

export const TRAINING_STATUS_TRANSITIONS: Partial<Record<TrainingStatus, TrainingStatus[]>> = {
  [TrainingStatus.NOMINATED]: [TrainingStatus.COMPANY_ADMISSION, TrainingStatus.TERMINATED],
  [TrainingStatus.COMPANY_ADMISSION]: [TrainingStatus.UNIVERSITY_ACCREDITED, TrainingStatus.TERMINATED],
  [TrainingStatus.UNIVERSITY_ACCREDITED]: [TrainingStatus.IN_TRAINING, TrainingStatus.TERMINATED],
  [TrainingStatus.IN_TRAINING]: [TrainingStatus.COMPLETED, TrainingStatus.TERMINATED],
  [TrainingStatus.COMPLETED]: [],
  [TrainingStatus.TERMINATED]: [],
};

export const TRAINING_STATUS_TRANSITION_ROLES: Record<string, UserRole[]> = {
  [TrainingStatus.COMPANY_ADMISSION]: [
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_RECRUITER,
    UserRole.TRAINING_ENTITY_SUPERVISOR,
    UserRole.COOPERATIVE_TRAINING_UNIT,
  ],
  [TrainingStatus.UNIVERSITY_ACCREDITED]: [UserRole.COOPERATIVE_TRAINING_UNIT, UserRole.UNIVERSITY_ADMIN],
  [TrainingStatus.IN_TRAINING]: [UserRole.COOPERATIVE_TRAINING_UNIT, UserRole.UNIVERSITY_ADMIN],
  [TrainingStatus.COMPLETED]: [
    UserRole.ACADEMIC_SUPERVISOR,
    UserRole.COOPERATIVE_TRAINING_UNIT,
    UserRole.UNIVERSITY_ADMIN,
  ],
  [TrainingStatus.TERMINATED]: [UserRole.COOPERATIVE_TRAINING_UNIT, UserRole.UNIVERSITY_ADMIN],
};

// ---------------------------------------------------------------------------
// Interview status state machine
// ---------------------------------------------------------------------------

export const INTERVIEW_STATUS_TRANSITIONS: Partial<Record<InterviewStatus, InterviewStatus[]>> = {
  [InterviewStatus.SCHEDULED]: [InterviewStatus.COMPLETED, InterviewStatus.CANCELLED, InterviewStatus.RESCHEDULED],
  [InterviewStatus.RESCHEDULED]: [InterviewStatus.SCHEDULED, InterviewStatus.CANCELLED],
  [InterviewStatus.COMPLETED]: [],
  [InterviewStatus.CANCELLED]: [],
};

const INTERVIEW_MANAGING_ROLES: UserRole[] = [
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.UNIVERSITY_ADMIN,
];

export const INTERVIEW_STATUS_TRANSITION_ROLES: Record<string, UserRole[]> = {
  [InterviewStatus.SCHEDULED]: INTERVIEW_MANAGING_ROLES,
  [InterviewStatus.COMPLETED]: INTERVIEW_MANAGING_ROLES,
  [InterviewStatus.CANCELLED]: INTERVIEW_MANAGING_ROLES,
  [InterviewStatus.RESCHEDULED]: INTERVIEW_MANAGING_ROLES,
};
