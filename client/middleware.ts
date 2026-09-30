import { NextRequest, NextResponse } from 'next/server';
import { getAllowedRolesForPath } from './lib/route-access';

/**
 * Edge-level route gate. The app authenticates via a JWT kept in
 * localStorage (not cookies), which Middleware cannot read — so login/logout
 * in `auth-context.tsx` also mirrors `upvia_authed` / `upvia_role` into
 * plain (non-httpOnly) cookies purely for this coarse redirect check. This is
 * a UX/routing convenience, not the security boundary: real authorization is
 * enforced by the API (Bearer token + server-side RBAC) regardless of what
 * this middleware decides.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const allowedRoles = getAllowedRolesForPath(pathname);
  if (!allowedRoles) {
    return NextResponse.next();
  }

  const isAuthed = request.cookies.get('upvia_authed')?.value === '1';
  const role = request.cookies.get('upvia_role')?.value;

  if (!isAuthed || !role || !allowedRoles.includes(role as any)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/company/:path*', '/student/:path*'],
};
