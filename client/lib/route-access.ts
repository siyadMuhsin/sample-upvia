import { UserRole } from '@/shared';

/**
 * Role matrix shared by `middleware.ts` (edge-level redirect) and the
 * per-route-group client layouts (`admin/layout.tsx`, `company/layout.tsx`,
 * `student/layout.tsx`) so both enforce the exact same rules.
 */
export const ROUTE_ROLE_MATRIX: Array<{ prefix: string; roles: UserRole[] }> = [
  {
    prefix: '/student',
    roles: [UserRole.STUDENT],
  },
  {
    prefix: '/company',
    roles: [UserRole.COMPANY_ADMIN, UserRole.COMPANY_RECRUITER, UserRole.TRAINING_ENTITY_SUPERVISOR],
  },
  {
    prefix: '/admin',
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.UNIVERSITY_ADMIN,
      UserRole.UNIVERSITY_LEADERSHIP,
      UserRole.COLLEGE_DEAN,
      UserRole.COLLEGE_VICE_DEAN,
      UserRole.PROGRAM_COORDINATOR,
      UserRole.STUDY_PLAN_DIRECTOR,
      UserRole.COOPERATIVE_TRAINING_UNIT,
      UserRole.ALUMNI_EMPLOYMENT_UNIT,
      UserRole.ACADEMIC_SUPERVISOR,
    ],
  },
];

export function getAllowedRolesForPath(pathname: string): UserRole[] | null {
  const entry = ROUTE_ROLE_MATRIX.find((e) => pathname === e.prefix || pathname.startsWith(`${e.prefix}/`));
  return entry ? entry.roles : null;
}

export function isRoleAllowedForPath(pathname: string, role: string | undefined | null): boolean {
  const allowed = getAllowedRolesForPath(pathname);
  if (!allowed) return true; // Unprotected route
  return !!role && allowed.includes(role as UserRole);
}
