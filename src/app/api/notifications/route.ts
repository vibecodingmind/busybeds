export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ notifications: [] });

  try {
    const notifications = await (prisma as any).notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST(req: NextRequest) {
  // Admin: create notification for user(s)
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { userId, userIds, title, message, type = 'system', link } = await req.json();
    const targets = userIds || (userId ? [userId] : []);
    if (targets.length === 0) {
      // Broadcast to all users
      const users = await prisma.user.findMany({ select: { id: true } });
      const data = users.map((u: any) => ({ userId: u.id, title, message, type, link: link || null }));
      await (prisma as any).notification.createMany({ data }).catch(() => {});
    } else {
      const data = targets.map((uid: string) => ({ userId: uid, title, message, type, link: link || null }));
      await (prisma as any).notification.createMany({ data }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, markAllRead } = await req.json();
    if (markAllRead) {
      await (prisma as any).notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      }).catch(() => {});
    } else if (id) {
      await (prisma as any).notification.update({
        where: { id },
        data: { isRead: true },
      }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
