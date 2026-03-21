import prisma from '@/lib/prisma';
import AnalyticsCharts from './AnalyticsCharts';

export const metadata = { title: 'Analytics — BusyBeds Admin' };

async function getAnalyticsData() {
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneYearAgo  = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const [dailyRedemptions, topHotelsData, subscriptionsByPlan, monthlySignupsData] = await Promise.all([
    prisma.coupon.groupBy({ by: ['redeemedAt'], where: { redeemedAt: { gte: twoWeeksAgo, lte: now }, status: 'redeemed' }, _count: true }),
    prisma.coupon.groupBy({ by: ['hotelId'], where: { status: 'redeemed' }, _count: true, orderBy: { _count: { hotelId: 'desc' } }, take: 8 }),
    prisma.subscription.groupBy({ by: ['packageId'], where: { status: 'active', expiresAt: { gt: now } }, _count: true }),
    prisma.user.groupBy({ by: ['createdAt'], where: { createdAt: { gte: oneYearAgo } }, _count: true }),
  ]);

  const dailyRedemptionsFormatted = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(twoWeeksAgo); date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const count = dailyRedemptions.find(d => d.redeemedAt?.toISOString().split('T')[0] === dateStr)?._count || 0;
    return { date: dateStr, count };
  });

  const topHotels = await Promise.all(topHotelsData.map(async h => {
    const hotel = await prisma.hotel.findUnique({ where: { id: h.hotelId } });
    return { name: hotel?.name || 'Unknown', redeemed: h._count };
  }));

  const revenueByPlan = await Promise.all(subscriptionsByPlan.map(async s => {
    const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: s.packageId } });
    return { plan: pkg?.name || 'Unknown', count: s._count };
  }));

  const monthlySignupsMap: Record<string, number> = {};
  Array.from({ length: 12 }, (_, i) => {
    const date = new Date(oneYearAgo); date.setMonth(date.getMonth() + i);
    monthlySignupsMap[date.toISOString().substring(0, 7)] = 0;
  });
  monthlySignupsData.forEach(m => {
    const k = m.createdAt.toISOString().substring(0, 7);
    if (monthlySignupsMap[k] !== undefined) monthlySignupsMap[k] += m._count;
  });
  const monthlySignups = Object.entries(monthlySignupsMap).map(([month, count]) => ({ month, count }));

  return { dailyRedemptions: dailyRedemptionsFormatted, topHotels, revenueByPlan, monthlySignups };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform insights and trends</p>
      </div>
      <AnalyticsCharts
        dailyRedemptions={data.dailyRedemptions}
        topHotels={data.topHotels}
        revenueByPlan={data.revenueByPlan}
        monthlySignups={data.monthlySignups}
      />
    </div>
  );
}
