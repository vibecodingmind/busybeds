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
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Subscriptions data
    const [
      activeSubscriptions,
      totalUsers,
      newUsersThisMonth,
      totalHotels,
      pendingHotels,
      activeHotels,
      newsletterCount,
      referralCount,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: 'active' } }).catch(() => 0),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.hotel.count(),
      prisma.hotel.count({ where: { status: 'pending' } }).catch(() => 0),
      prisma.hotel.count({ where: { status: 'active' } }).catch(() => 0),
      (prisma as any).newsletterSubscriber?.count().catch(() => 0),
      (prisma as any).referral?.count({ where: { referredId: { not: null } } }).catch(() => 0),
    ]);

    // Revenue by plan — fetch active subscriptions with package info
    const subs = await prisma.subscription.findMany({
      where: { status: 'active' },
      include: { package: { select: { name: true, price: true } } },
    }).catch(() => []);

    const mrr = subs.reduce((sum: number, s: any) => sum + (s.package?.price || 0), 0);

    // Group by plan
    const byPlan: Record<string, { count: number; revenue: number }> = {};
    for (const sub of subs) {
      const name = (sub as any).package?.name || 'Unknown';
      const price = (sub as any).package?.price || 0;
      if (!byPlan[name]) byPlan[name] = { count: 0, revenue: 0 };
      byPlan[name].count++;
      byPlan[name].revenue += price;
    }

    // Monthly new subscriptions (last 6 months)
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.subscription.count({
        where: { createdAt: { gte: start, lt: end } },
      }).catch(() => 0);
      monthlyGrowth.push({
        month: start.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        count,
      });
    }

    // Coupon scans this month
    const couponsThisMonth = await (prisma as any).couponUsage?.count({
      where: { createdAt: { gte: monthStart } },
    }).catch(() => 0);

    return NextResponse.json({
      mrr,
      arr: mrr * 12,
      activeSubscriptions,
      totalUsers,
      newUsersThisMonth,
      totalHotels,
      pendingHotels,
      activeHotels,
      newsletterCount,
      referralCount,
      couponsThisMonth,
      byPlan,
      monthlyGrowth,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
