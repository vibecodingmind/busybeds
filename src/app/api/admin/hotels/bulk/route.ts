export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { ids, action, reason } = await req.json();
  if (!ids?.length || !action) {
    return NextResponse.json({ error: 'ids and action required' }, { status: 400 });
  }

  const validActions = ['active', 'inactive', 'pending', 'rejected'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    const result = await prisma.hotel.updateMany({
      where: { id: { in: ids } },
      data: { status: action, updatedAt: new Date() },
    });

    // Log audit
    try {
      await (prisma as any).auditLog.create({
        data: {
          userId: session.userId,
          action: `bulk_${action}`,
          resource: 'hotel',
          metadata: JSON.stringify({ ids, count: result.count, reason }),
        },
      });
    } catch {}

    return NextResponse.json({ updated: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
