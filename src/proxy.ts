import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  verifySuperAdminPortalSession,
} from '@/lib/session';

const protectedPaths = [
  /^\/dashboard(?:\/.*)?$/,
  /^\/schools(?:\/.*)?$/,
  /^\/users(?:\/.*)?$/,
  /^\/audit-logs(?:\/.*)?$/,
  /^\/settings(?:\/.*)?$/,
  /^\/api\/super-admin(?:\/.*)?$/,
];

function wantsJson(request: NextRequest) {
  const accept = request.headers.get('accept') ?? '';
  return (
    accept.includes('application/json') ||
    request.nextUrl.pathname.startsWith('/api/')
  );
}

function redirectToLogin(request: NextRequest, clearCookie: boolean) {
  const res = NextResponse.redirect(new URL('/login', request.url));
  if (clearCookie) {
    res.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((pattern) => pattern.test(pathname));

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const paramToken = request.nextUrl.searchParams.get('session');
  const token = cookieToken || paramToken;

  if (!token) {
    return wantsJson(request)
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : redirectToLogin(request, false);
  }

  try {
    await verifySuperAdminPortalSession(token);
    const res = NextResponse.next();
    if (paramToken && !cookieToken) {
      res.cookies.set(SESSION_COOKIE, paramToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return res;
  } catch {
    return wantsJson(request)
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : redirectToLogin(request, true);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/schools/:path*',
    '/users/:path*',
    '/audit-logs/:path*',
    '/settings/:path*',
    '/api/super-admin/:path*',
  ],
};
