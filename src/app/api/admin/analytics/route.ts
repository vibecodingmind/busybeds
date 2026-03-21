import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Auth check: verify session exists and role is admin
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 1. Daily Redemptions (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const redeemedCoupons = await prisma.coupon.findMany({
      where: {
        status: 'redeemed',
        redeemedAt: {
          gte: fourteenDaysAgo,
        },
      },
      select: {
        redeemedAt: true,
      },
    });

    // Group by date in JS
    const dailyRedemptionsMap = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
      });
      dailyRedemptionsMap.set(dateStr, 0);
    }

    redeemedCoupons.forEach((coupon) => {
      if (coupon.redeemedAt) {
        const dateStr = coupon.redeemedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
        });
        dailyRedemptionsMap.set(
          dateStr,
          (dailyRedemptionsMap.get(dateStr) || 0) + 1
        );
      }
    });

    const dailyRedemptions = Array.from(dailyRedemptionsMap.entries())
      .reverse()
      .map(([date, count]) => ({
        date,
        count,
      }));

    // 2. Top Hotels by Redemptions
    const topHotels = await prisma.hotel.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            coupons: {
              where: {
                status: 'redeemed',
              },
            },
          },
        },
      },
      orderBy: {
        coupons: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const topHotelsFormatted = topHotels.map((hotel) => ({
      name: hotel.name,
      redeemed: hotel._count.coupons,
    }));

    // 3. Revenue by Plan (subscription packages)
    const subscriptionPackages = await prisma.subscriptionPackage.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'active',
              },
            },
          },
        },
      },
    });

    const revenueByPlan = subscriptionPackages.map((pkg) => ({
      plan: pkg.name,
      count: pkg._count.subscriptions,
    }));

    // 4. Monthly Signups (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by month in JS
    const monthlySignupsMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      monthlySignupsMap.set(monthStr, 0);
    }

    newUsers.forEach((user) => {
      const monthStr = user.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      monthlySignupsMap.set(
        monthStr,
        (monthlySignupsMap.get(monthStr) || 0) + 1
      );
    });

    const monthlySignups = Array.from(monthlySignupsMap.entries())
      .reverse()
      .map(([month, count]) => ({
        month,
        count,
      }));

    // Return all analytics
    return NextResponse.json({
      dailyRedemptions,
      topHotels: topHotelsFormatted,
      revenueByPlan,
      monthlySignups,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
