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

    // ── Core counts ──────────────────────────────────────────────────────────
    const [
      activeSubscriptions,
      totalUsers,
      newUsersThisMonth,
      totalHotels,
      pendingHotels,
      activeHotels,
      newsletterCount,
      referralCount,
      totalCoupons,
      redeemedCoupons,
      priceAlertCount,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: 'active' } }).catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }).catch(() => 0),
      prisma.hotel.count().catch(() => 0),
      prisma.hotel.count({ where: { status: 'pending' } }).catch(() => 0),
      prisma.hotel.count({ where: { status: 'active' } }).catch(() => 0),
      prisma.newsletterSubscriber.count().catch(() => 0),
      prisma.referral.count({ where: { referredId: { not: null } } }).catch(() => 0),
      prisma.coupon.count().catch(() => 0),
      prisma.coupon.count({ where: { status: 'redeemed' } }).catch(() => 0),
      (prisma as any).priceAlert?.count({ where: { isActive: true } }).catch(() => 0) ?? 0,
    ]);

    // ── MRR from active subs with billing cycle ───────────────────────────
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'active' },
      include: {
        package: {
          select: { name: true, priceMonthly: true, priceAnnual: true },
        },
      },
    }).catch(() => []);

    // Monthly revenue per subscription (annual = divided by 12)
    let mrr = 0;
    const byPlan: Record<string, { count: number; revenue: number; color: string }> = {};
    const planColors = ['#FF385C', '#0E7C7B', '#1A3C5E', '#F59E0B', '#8B5CF6', '#10B981'];
    let colorIdx = 0;

    for (const sub of activeSubs) {
      const pkg = sub.package;
      if (!pkg) continue;
      const monthly =
        sub.billingCycle === 'annual' && pkg.priceAnnual
          ? pkg.priceAnnual / 12
          : pkg.priceMonthly;
      mrr += monthly;

      const name = pkg.name;
      if (!byPlan[name]) {
        byPlan[name] = { count: 0, revenue: 0, color: planColors[colorIdx++ % planColors.length] };
      }
      byPlan[name].count++;
      byPlan[name].revenue += monthly;
    }

    // ── 12-month historical trends ─────────────────────────────────────────
    const monthlyTrends: Array<{
      month: string;
      newSubs: number;
      cancelledSubs: number;
      newUsers: number;
      couponsGenerated: number;
      couponsRedeemed: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [newSubs, cancelledSubs, newUsers, couponsGenerated, couponsRedeemed] = await Promise.all([
        prisma.subscription.count({ where: { createdAt: { gte: start, lt: end } } }).catch(() => 0),
        // Cancelled subs whose expiresAt falls in this period (proxy for cancellation date)
        prisma.subscription.count({
          where: { status: 'cancelled', expiresAt: { gte: start, lt: end } },
        }).catch(() => 0),
        prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }).catch(() => 0),
        prisma.coupon.count({ where: { generatedAt: { gte: start, lt: end } } }).catch(() => 0),
        prisma.coupon.count({ where: { redeemedAt: { gte: start, lt: end } } }).catch(() => 0),
      ]);

      monthlyTrends.push({
        month: start.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        newSubs,
        cancelledSubs,
        newUsers,
        couponsGenerated,
        couponsRedeemed,
      });
    }

    // ── Top hotels by coupon count ─────────────────────────────────────────
    const topHotelCoupons = await prisma.coupon.groupBy({
      by: ['hotelId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }).catch(() => []);

    const topHotelIds = topHotelCoupons.map(h => h.hotelId);
    const topHotelNames = await prisma.hotel.findMany({
      where: { id: { in: topHotelIds } },
      select: { id: true, name: true, city: true },
    }).catch(() => []);

    const nameMap = Object.fromEntries(topHotelNames.map(h => [h.id, `${h.name} (${h.city})`]));
    const topHotels = topHotelCoupons.map(h => ({
      name: nameMap[h.hotelId] || h.hotelId,
      count: h._count.id,
    }));

    // ── Subscription churn rate (last 3 months) ───────────────────────────
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const [churned3m, started3m] = await Promise.all([
      prisma.subscription.count({
        where: { status: 'cancelled', expiresAt: { gte: threeMonthsAgo } },
      }).catch(() => 0),
      prisma.subscription.count({
        where: { createdAt: { gte: threeMonthsAgo } },
      }).catch(() => 0),
    ]);
    const churnRate = started3m > 0 ? Math.round((churned3m / started3m) * 100) : 0;

    return NextResponse.json({
      // ── Overview
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      activeSubscriptions,
      totalUsers,
      newUsersThisMonth,
      // ── Hotels
      totalHotels,
      pendingHotels,
      activeHotels,
      // ── Engagement
      newsletterCount,
      referralCount,
      totalCoupons,
      redeemedCoupons,
      priceAlertCount,
      couponRedemptionRate: totalCoupons > 0 ? Math.round((redeemedCoupons / totalCoupons) * 100) : 0,
      // ── Charts
      byPlan,
      monthlyTrends,
      topHotels,
      churnRate,
    });
  } catch (e: any) {
    console.error('[Revenue API]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
