import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import CouponsClient from './CouponsClient';

export default async function CouponsPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/coupons');

  const rawCoupons = await prisma.coupon.findMany({
    where: { userId: session.userId },
    include: {
      hotel: {
        select: {
          name: true, city: true, country: true, slug: true,
          coverImage: true, starRating: true, address: true,
          discountPercent: true,
        },
      },
    },
    orderBy: { generatedAt: 'desc' },
  });
  const userRecord = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, avatar: true },
  });

  // Auto-expire active coupons past their expiry
  const now = new Date();
  const coupons = rawCoupons.map(c => ({
    ...c,
    status: c.status === 'active' && c.expiresAt < now ? 'expired' : c.status,
  }));

  const serialize = (c: typeof coupons[0]) => ({
    id: c.id,
    code: c.code,
    qrDataUrl: c.qrDataUrl,
    discountPercent: c.discountPercent,
    guestName: c.guestName,
    status: c.status,
    generatedAt: c.generatedAt.toISOString(),
    expiresAt: c.expiresAt.toISOString(),
    redeemedAt: c.redeemedAt ? c.redeemedAt.toISOString() : null,
    hotel: c.hotel,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CouponsClient
        coupons={coupons.map(serialize)}
        ownerName={userRecord?.fullName || 'Traveler'}
        ownerAvatar={userRecord?.avatar || null}
      />
    </div>
  );
}
