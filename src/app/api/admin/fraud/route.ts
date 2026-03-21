export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    // Users who generated many coupons in last 7 days (>5 = suspicious)
    const heavyUsers = await (prisma as any).couponUsage?.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _count: { userId: true },
      having: { userId: { _count: { gt: 5 } } },
      orderBy: { _count: { userId: 'desc' } },
      take: 20,
    }).catch(() => []);

    // Enrich with user info
    const flags = [];
    for (const entry of (heavyUsers || [])) {
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { id: true, fullName: true, email: true, isBanned: true },
      }).catch(() => null);
      if (user) {
        flags.push({
          ...user,
          couponCount: entry._count.userId,
          risk: entry._count.userId > 20 ? 'high' : entry._count.userId > 10 ? 'medium' : 'low',
        });
      }
    }

    // Recently banned users
    const bannedUsers = await prisma.user.findMany({
      where: { isBanned: true },
      select: { id: true, fullName: true, email: true, createdAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }).catch(() => []);

    return NextResponse.json({ flags, bannedUsers, scannedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
