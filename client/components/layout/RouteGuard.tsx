'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { getAllowedRolesForPath } from '../../lib/route-access';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side companion to `middleware.ts`. Middleware handles the
 * server/edge redirect on first navigation; this guard additionally reacts
 * to auth state changes that happen entirely client-side (logout, a token
 * expiring, session restored from localStorage after middleware already ran)
 * without requiring a full page reload to be caught.
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowedRoles = getAllowedRolesForPath(pathname);
  const isAllowed = !allowedRoles || (!!user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !isAllowed) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isAllowed, pathname, router]);

  if (isLoading || !isAuthenticated || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};
