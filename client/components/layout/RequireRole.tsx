'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '@/shared';

interface RequireRoleProps {
  allowed: UserRole[];
  children: React.ReactNode;
}

/**
 * Page-level defense-in-depth for admin sub-pages that are more sensitive
 * than the coarse `/admin/*` role matrix enforced by middleware.ts and
 * RouteGuard (e.g. university provisioning is Super-Admin-only, not
 * "any academic staff role"). Renders inside <AppShell> so the shell chrome
 * stays intact instead of a jarring blank redirect.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ allowed, children }) => {
  const { user } = useAuth();

  if (!user || !allowed.includes(user.role)) {
    return (
      <div className="py-20 text-center">
        <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-upvia-navy">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">Your role does not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};
