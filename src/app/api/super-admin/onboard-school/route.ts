import { NextRequest, NextResponse } from 'next/server';
import { onboardSchool } from '@/lib/worker';
import { verifySuperAdminFromRequest } from '@/lib/session';

export async function POST(request: NextRequest) {
  const isAuthorized = await verifySuperAdminFromRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const result = await onboardSchool(body as any);
  return NextResponse.json(result, { status: 201 });
}
