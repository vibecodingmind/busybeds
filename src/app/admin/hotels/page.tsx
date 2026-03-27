export const revalidate = 0;

import Link from 'next/link';
import HotelsBulkClient from './HotelsBulkClient';
import prisma from '@/lib/prisma';

export const metadata = { title: 'Hotels — BusyBeds Admin' };

export default async function HotelsPage() {
  // Fetch hotels with all necessary data
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
      subscription: {
        include: {
          tier: {
            select: { displayName: true, name: true },
          },
        },
      },
      _count: { select: { coupons: true, roomTypes: true } },
    },
    take: 500, // Increased limit for better filtering
  });

  // Fetch hotel types from the database
  const hotelTypes = await prisma.hotelType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { name: true },
  });

  const hotelTypeNames = hotelTypes.map(t => t.name);

  const hotelsWithOwner = hotels.map(h => ({
    ...h,
    category: h.category || 'Hotel',
    owner: h.owner ? { fullName: h.owner.user.fullName, email: h.owner.user.email } : undefined,
    subscription: h.subscription?.status === 'active' ? {
      id: h.subscription.id,
      status: h.subscription.status,
      tier: h.subscription.tier,
      isComped: h.subscription.isComped,
    } : null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Hotels Management</h1>
          <p className="text-sm text-gray-500">View, edit, and bulk approve/reject hotels. Use filters to find hotels by country, city, or type.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/hotels/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Hotel
          </Link>
          <Link
            href="/admin/hotels/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Import from Google
          </Link>
        </div>
      </div>
      <HotelsBulkClient initialHotels={hotelsWithOwner as any} hotelTypes={hotelTypeNames} />
    </div>
  );
}
