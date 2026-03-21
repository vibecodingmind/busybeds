import HotelsClient from './HotelsClient';
import HotelsBulkClient from './HotelsBulkClient';
import prisma from '@/lib/prisma';

export const metadata = { title: 'Hotels — BusyBeds Admin' };

export default async function HotelsPage() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        include: {
          user: {
            select: { fullName: true, email: true },
          },
        },
      },
      _count: { select: { coupons: true, roomTypes: true } },
    },
    take: 200,
  });

  const hotelsWithOwner = hotels.map(h => ({
    ...h,
    owner: h.owner ? { fullName: h.owner.user.fullName, email: h.owner.user.email } : undefined,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Hotels Management</h1>
        <p className="text-sm text-gray-500">View, edit, and bulk approve/reject hotels</p>
      </div>
      <HotelsBulkClient initialHotels={hotelsWithOwner as any} />
    </div>
  );
}
