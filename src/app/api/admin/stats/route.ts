export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const now = new Date();
  const [totalUsers, totalHotels, activeSubscriptions, totalCoupons, redeemedCoupons, pendingKyc] =
    await Promise.all([
      prisma.user.count(),
      prisma.hotel.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'active', expiresAt: { gt: now } } }),
      prisma.coupon.count(),
      prisma.coupon.count({ where: { status: 'redeemed' } }),
      prisma.hotelOwner.count({ where: { kycStatus: 'pending' } }),
    ]);

  return NextResponse.json({ totalUsers, totalHotels, activeSubscriptions, totalCoupons, redeemedCoupons, pendingKyc });
}
