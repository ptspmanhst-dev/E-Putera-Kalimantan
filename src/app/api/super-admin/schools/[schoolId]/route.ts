import { NextRequest, NextResponse } from 'next/server';
import { updateSchool, deleteSchool } from '@/lib/worker';
import { verifySuperAdminFromRequest } from '@/lib/session';

type RouteContext = {
  params: Promise<{ schoolId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const isAuthorized = await verifySuperAdminFromRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { schoolId } = await context.params;
    const body = await request.json();
    const result = await updateSchool(schoolId, body as any);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const isAuthorized = await verifySuperAdminFromRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { schoolId } = await context.params;
    const result = await deleteSchool(schoolId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
