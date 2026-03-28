export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/admin/loyalty — list top users by loyalty points + stats
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const [loyaltyRows, totalUsers, totalPoints] = await Promise.all([
    (prisma as any).loyaltyPoints.findMany({
      include: { user: { select: { id: true, fullName: true, email: true, avatar: true } } },
      orderBy: { lifetime: 'desc' },
      take: 200,
    }),
    (prisma as any).loyaltyPoints.count(),
    (prisma as any).loyaltyPoints.aggregate({ _sum: { points: true, lifetime: true } }),
  ]);

  const filtered = search
    ? loyaltyRows.filter((r: any) =>
        r.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : loyaltyRows;

  const stats = {
    totalUsers,
    totalActivePoints:   totalPoints._sum?.points   ?? 0,
    totalLifetimePoints: totalPoints._sum?.lifetime  ?? 0,
  };

  return NextResponse.json({ rows: filtered, stats });
}

// POST /api/admin/loyalty — manually award or deduct points
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, points, reason } = await req.json();
  if (!userId || points === undefined || !reason) {
    return NextResponse.json({ error: 'userId, points, and reason are required' }, { status: 400 });
  }

  const pts = parseInt(points);
  if (isNaN(pts) || pts === 0) {
    return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
  }

  await (prisma as any).loyaltyPoints.upsert({
    where:  { userId },
    create: { userId, points: pts, lifetime: pts > 0 ? pts : 0 },
    update: {
      points:   { increment: pts },
      lifetime: pts > 0 ? { increment: pts } : undefined,
    },
  });

  await (prisma as any).pointTransaction.create({
    data: {
      userId,
      points: pts,
      type:   'admin_adjustment',
      description: reason,
    },
  });

  return NextResponse.json({ ok: true });
}
