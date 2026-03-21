import HotelsClient from './HotelsClient';
import prisma from '@/lib/prisma';

export const metadata = { title: 'Hotels — BusyBeds Admin' };

export default async function HotelsPage() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { coupons: true, roomTypes: true } } },
    take: 200,
  });
  return <HotelsClient initialHotels={hotels as any} />;
}
