'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api';
import { UserRole } from '@/shared';
import { isRoleAllowedForPath } from './route-access';

interface AuthUser {
  id: string;
  email: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr?: string;
  lastNameAr?: string;
  role: UserRole;
  universityId?: string;
  collegeId?: string;
  programId?: string;
  companyId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password?: string,
    returnUrl?: string | null,
    role?: UserRole
  ) => Promise<void>;
  loginAsDemo: (role: UserRole, returnUrl?: string | null) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  activateAccount: (invitationToken: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mirrors the essential auth state into plain cookies purely so
// `middleware.ts` (which cannot read localStorage) can gate routes at the
// edge. Not the security boundary — see middleware.ts for details.
const setAuthCookies = (role: UserRole) => {
  const maxAge = 60 * 60 * 24 * 7; // 7 days, matches refresh token lifetime intent
  document.cookie = `upvia_authed=1; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `upvia_role=${role}; path=/; max-age=${maxAge}; samesite=lax`;
};

const clearAuthCookies = () => {
  document.cookie = 'upvia_authed=; path=/; max-age=0';
  document.cookie = 'upvia_role=; path=/; max-age=0';
};

const DEMO_EMAILS: Record<string, string> = {
  [UserRole.STUDENT]: 'student@upvia.com',
  [UserRole.COMPANY_ADMIN]: 'company.admin@upvia.com',
  [UserRole.COMPANY_RECRUITER]: 'recruiter.elm@upvia.com',
  [UserRole.UNIVERSITY_LEADERSHIP]: 'leadership@upvia.com',
  [UserRole.SUPER_ADMIN]: 'superadmin@upvia.com',
  [UserRole.COLLEGE_DEAN]: 'dean.computing@upvia.com',
  [UserRole.PROGRAM_COORDINATOR]: 'coordinator.se@upvia.com',
  [UserRole.STUDY_PLAN_DIRECTOR]: 'director.plans@upvia.com',
  [UserRole.COOPERATIVE_TRAINING_UNIT]: 'training.unit@upvia.com',
  [UserRole.ALUMNI_EMPLOYMENT_UNIT]: 'alumni.unit@upvia.com',
  [UserRole.ACADEMIC_SUPERVISOR]: 'supervisor.academic@upvia.com',
  [UserRole.TRAINING_ENTITY_SUPERVISOR]: 'supervisor.company@upvia.com',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('upvia_access_token');
    const savedUser = localStorage.getItem('upvia_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        setAuthCookies(parsedUser.role);
      } catch (e) {
        localStorage.removeItem('upvia_access_token');
        localStorage.removeItem('upvia_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Default landing page per role — there are only three distinct route
  // groups (student/company/admin); the sidebar within each adapts further.
  const defaultRouteForRole = (role: UserRole): string => {
    if (role === UserRole.STUDENT) return '/student/dashboard';
    if (role.startsWith('COMPANY') || role === UserRole.TRAINING_ENTITY_SUPERVISOR) return '/company/dashboard';
    return '/admin/dashboard';
  };

  // Shared by login() and activateAccount(): persists the session and routes
  // the user to a validated returnUrl or their role's default portal.
  const establishSession = (
    accessToken: string,
    refreshToken: string,
    authUser: AuthUser,
    returnUrl?: string | null
  ) => {
    setToken(accessToken);
    setUser(authUser);

    localStorage.setItem('upvia_access_token', accessToken);
    localStorage.setItem('upvia_refresh_token', refreshToken);
    localStorage.setItem('upvia_user', JSON.stringify(authUser));
    setAuthCookies(authUser.role);

    // Honor a returnUrl (e.g. set by middleware.ts when redirecting an
    // unauthenticated/unauthorized visit) only when it's a safe, local
    // path this role is actually allowed to view; otherwise fall back to
    // their default portal (also prevents a redirect loop when a demo
    // login switches to a role the stale returnUrl doesn't belong to).
    const isSafeLocalPath =
      !!returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && returnUrl !== '/login';
    const targetRoute =
      isSafeLocalPath && isRoleAllowedForPath(returnUrl!, authUser.role)
        ? returnUrl!
        : defaultRouteForRole(authUser.role);

    router.push(targetRoute);
  };

  const login = async (
    email: string,
    password = 'admin@123',
    returnUrl?: string | null,
    role?: UserRole
  ) => {
    setIsLoading(true);
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (res.success && res.data) {
        const { accessToken, refreshToken, user: authUser } = res.data;
        establishSession(accessToken, refreshToken, authUser, returnUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: UserRole, returnUrl?: string | null) => {
    await login('admin@gmail.com', 'admin@123', returnUrl, role);
  };

  const switchRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await apiClient('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });

      if (res.success && res.data) {
        const { accessToken, refreshToken, user: authUser } = res.data;
        establishSession(accessToken, refreshToken, authUser, null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Consumes an invitation token (see /activate), sets the invitee's chosen
  // password, and logs them straight into their role's dashboard.
  const activateAccount = async (invitationToken: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient('/auth/activate', {
        method: 'POST',
        body: JSON.stringify({ token: invitationToken, password }),
      });

      if (res.success && res.data) {
        const { accessToken, refreshToken, user: authUser } = res.data;
        establishSession(accessToken, refreshToken, authUser, null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('upvia_access_token');
    localStorage.removeItem('upvia_refresh_token');
    localStorage.removeItem('upvia_user');
    clearAuthCookies();
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginAsDemo,
        switchRole,
        activateAccount,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
