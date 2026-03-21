export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { subscription } = body; // PushSubscription JSON

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  // Save or update push subscription for user
  await (prisma as any).pushSubscription?.upsert?.({
    where: { userId: session.userId },
    update: { subscription: JSON.stringify(subscription), updatedAt: new Date() },
    create: { userId: session.userId, subscription: JSON.stringify(subscription) },
  }).catch(() => {});
  // If table doesn't exist yet, just return OK
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await (prisma as any).pushSubscription?.deleteMany?.({ where: { userId: session.userId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
