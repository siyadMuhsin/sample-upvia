import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@upvia/shared';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.util';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Super Admin has access to all routes
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied: Requires one of [${allowedRoles.join(', ')}]`));
    }

    next();
  };
};

export const requireUniversityAdmin = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.UNIVERSITY_ADMIN,
  UserRole.UNIVERSITY_LEADERSHIP
);

export const requireAcademicStaff = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.UNIVERSITY_ADMIN,
  UserRole.UNIVERSITY_LEADERSHIP,
  UserRole.STUDY_PLAN_DIRECTOR,
  UserRole.COLLEGE_DEAN,
  UserRole.COLLEGE_VICE_DEAN,
  UserRole.PROGRAM_COORDINATOR,
  UserRole.COOPERATIVE_TRAINING_UNIT,
  UserRole.ALUMNI_EMPLOYMENT_UNIT,
  UserRole.ACADEMIC_SUPERVISOR
);

export const requireCompanyStaff = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.COMPANY_RECRUITER,
  UserRole.TRAINING_ENTITY_SUPERVISOR
);

export const requireStudent = requireRoles(
  UserRole.SUPER_ADMIN,
  UserRole.STUDENT
);
