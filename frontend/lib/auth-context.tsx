'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api';
import { UserRole } from '@upvia/shared';

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
  login: (email: string, password?: string) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('upvia_access_token');
        localStorage.removeItem('upvia_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        const { accessToken, refreshToken, user: authUser } = res.data;
        setToken(accessToken);
        setUser(authUser);

        localStorage.setItem('upvia_access_token', accessToken);
        localStorage.setItem('upvia_refresh_token', refreshToken);
        localStorage.setItem('upvia_user', JSON.stringify(authUser));

        // Route to corresponding portal based on role
        if (authUser.role === UserRole.STUDENT) {
          router.push('/student/dashboard');
        } else if (authUser.role.startsWith('COMPANY')) {
          router.push('/company/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: UserRole) => {
    const email = DEMO_EMAILS[role] || 'student@upvia.com';
    await login(email, 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('upvia_access_token');
    localStorage.removeItem('upvia_refresh_token');
    localStorage.removeItem('upvia_user');
    setUser(null);
    setToken(null);
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
