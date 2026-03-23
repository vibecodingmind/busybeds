export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, role: true,
          createdAt: true, isBanned: true,
          _count: { select: { coupons: true } },
          hotelOwner: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, action, role } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: 'userId and action required' }, { status: 400 });

  try {
    let updateData: any = {};
    if (action === 'ban') updateData.isBanned = true;
    else if (action === 'unban') updateData.isBanned = false;
    else if (action === 'set_role' && role) updateData.role = role;
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const user = await prisma.user.update({ where: { id: userId }, data: updateData });

    try {
      await (prisma as any).auditLog.create({
        data: { userId: session.userId, action: `user_${action}`, resource: 'user', resourceId: userId, metadata: JSON.stringify({ role }) },
      });
    } catch {}

    return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, isBanned: (user as any).isBanned } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
