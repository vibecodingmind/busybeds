export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const schema = z.object({ code: z.string().min(1) });

// POST /api/coupons/scan — hotel staff validates & redeems a coupon
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['hotel_manager', 'hotel_owner', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { code } = schema.parse(body);

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { hotel: true, user: { select: { fullName: true, email: true } } },
  });

  if (!coupon) {
    return NextResponse.json({ valid: false, reason: 'Coupon not found' }, { status: 404 });
  }

  // Verify hotel match (manager/owner can only scan their hotel's coupons)
  if (session.role !== 'admin') {
    const staffRecord = session.role === 'hotel_manager'
      ? await prisma.hotelManager.findFirst({ where: { userId: session.userId, isActive: true } })
      : await prisma.hotelOwner.findFirst({ where: { userId: session.userId, kycStatus: 'approved' } });

    const staffHotelId = staffRecord ? ('hotelId' in staffRecord ? staffRecord.hotelId : null) : null;

    if (!staffHotelId || staffHotelId !== coupon.hotelId) {
      return NextResponse.json({ valid: false, reason: 'Coupon does not belong to your hotel' }, { status: 403 });
    }
  }

  const now = new Date();

  if (coupon.status === 'redeemed') {
    return NextResponse.json({ valid: false, reason: 'Already redeemed', coupon }, { status: 409 });
  }
  if (coupon.status === 'cancelled') {
    return NextResponse.json({ valid: false, reason: 'Coupon cancelled', coupon }, { status: 410 });
  }
  if (coupon.expiresAt < now || coupon.status === 'expired') {
    return NextResponse.json({ valid: false, reason: 'Coupon expired', coupon }, { status: 410 });
  }

  // All checks passed — redeem it
  const redeemed = await prisma.coupon.update({
    where: { id: coupon.id },
    data: { status: 'redeemed', redeemedAt: now, redeemedBy: session.userId },
    include: { hotel: true, user: { select: { fullName: true, email: true } } },
  });

  return NextResponse.json({ valid: true, coupon: redeemed });
}
