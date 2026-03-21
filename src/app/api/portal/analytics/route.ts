export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // Get hotels owned by this user
    const hotels = await prisma.hotel.findMany({
      where: { owner: { userId: session.userId } },
      select: {
        id: true, name: true, slug: true, discountPercent: true,
        viewCount: true, status: true,
        roomTypes: { select: { pricePerNight: true }, take: 1 },
        coupons: {
          where: { createdAt: { gte: since } },
          select: { id: true, createdAt: true }
        }
      },
    });

    if (hotels.length === 0) return NextResponse.json({ hotels: [], summary: {}, dailyScans: [] });

    // Build daily scan data for chart (last N days)
    const dailyScans: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyScans[key] = 0;
    }

    // Per-hotel stats
    const hotelStats = hotels.map((hotel: any) => {
      const scans = hotel.coupons.length;
      
      // Track daily scans
      hotel.coupons.forEach((coupon: any) => {
        const key = new Date(coupon.createdAt).toISOString().split('T')[0];
        if (key in dailyScans) dailyScans[key]++;
      });

      const price = hotel.roomTypes[0]?.pricePerNight ?? 0;
      const discountedPrice = price * (1 - hotel.discountPercent / 100);
      const estimatedRevenue = scans * discountedPrice;
      const totalViews = hotel.viewCount || 0;
      const conversionRate = totalViews > 0 ? ((scans / totalViews) * 100).toFixed(1) : '0';

      return {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        discountPercent: hotel.discountPercent,
        status: hotel.status,
        scans,
        totalViews,
        conversionRate: parseFloat(conversionRate),
        estimatedRevenue: Math.round(estimatedRevenue),
        basePrice: price,
      };
    });

    // Summary totals
    const summary = {
      totalScans: hotelStats.reduce((s: number, h: any) => s + h.scans, 0),
      totalViews: hotelStats.reduce((s: number, h: any) => s + h.totalViews, 0),
      totalHotels: hotels.length,
      estimatedRevenue: hotelStats.reduce((s: number, h: any) => s + h.estimatedRevenue, 0),
      avgConversion: hotelStats.length > 0
        ? (hotelStats.reduce((s: number, h: any) => s + h.conversionRate, 0) / hotelStats.length).toFixed(1)
        : '0',
    };

    return NextResponse.json({
      hotels: hotelStats,
      summary,
      dailyScans: Object.entries(dailyScans).map(([date, count]) => ({ date, count })),
    });
  } catch (e: any) {
    console.error('Analytics error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
