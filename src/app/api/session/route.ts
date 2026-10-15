import { NextRequest, NextResponse } from 'next/server';
import {
  MIN_PORTAL_SESSION_SECRET_LENGTH,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE_SEC,
  signSuperAdminPortalSession,
  verifySuperAdmin,
} from '@/lib/session';

function sessionSecretConfigured() {
  const raw =
    process.env.SUPER_ADMIN_JWT_SECRET?.trim() ||
    process.env.SUPER_ADMIN_API_KEY?.trim();
  return Boolean(raw && raw.length >= 20);
}

export async function POST(request: NextRequest) {
  const { token } = (await request.json().catch(() => ({}))) as {
    token?: string;
  };
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  if (!sessionSecretConfigured()) {
    return NextResponse.json(
      {
        error: 'Server misconfigured: missing session secret.',
        code: 'missing_session_secret',
      },
      { status: 500 },
    );
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    return NextResponse.json(
      {
        error: 'Server misconfigured: missing project ID.',
        code: 'missing_project_id',
      },
      { status: 500 },
    );
  }

  try {
    const payload = await verifySuperAdmin(token, projectId);
    const sub = String(payload.sub);
    const email = typeof payload.email === 'string' ? payload.email : undefined;

    const sessionJwt = await signSuperAdminPortalSession({
      sub,
      email,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        uid: sub,
        email,
      },
    });

    response.cookies.set(SESSION_COOKIE, sessionJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SEC,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === 'development') {
      console.error('[api/session]', err);
    }

    if (message === 'Not a super admin session') {
      return NextResponse.json(
        {
          error:
            'This account is not a super admin (custom claims missing on the ID token).',
          code: 'not_super_admin',
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        error: 'Could not verify Firebase ID token.',
        code: 'invalid_token',
      },
      { status: 401 },
    );
  }
}
