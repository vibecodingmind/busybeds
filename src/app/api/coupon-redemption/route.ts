export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { awardPoints } from '@/lib/loyalty';

// POST /api/coupon-redemption - redeem a coupon (with usage limit checking)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { couponId } = await req.json();
  if (!couponId) return NextResponse.json({ error: 'couponId required' }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: { hotel: true },
  });

  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

  // Check if coupon is still valid
  const now = new Date();
  if (coupon.expiresAt < now) {
    return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
  }

  // Check time window if set
  if (coupon.startTime && coupon.startTime > now) {
    return NextResponse.json({ error: 'Coupon not yet valid' }, { status: 400 });
  }

  // Already redeemed? (for single-use coupons)
  if (coupon.redeemedAt && !coupon.usageLimit) {
    return NextResponse.json({ error: 'Coupon already redeemed' }, { status: 400 });
  }

  // Redeem/increment usage
  const updated = await prisma.coupon.update({
    where: { id: couponId },
    data: {
      usageCount: { increment: 1 },
      ...(coupon.usageCount === 0 && { redeemedAt: now, redeemedBy: session.userId }),
    },
    include: { hotel: true },
  });

  // Award loyalty points for coupon redemption (+25 pts) to coupon owner
  await awardPoints(coupon.userId, 25, 'coupon_redeem', `Coupon redeemed at ${coupon.hotel.name}`);

  return NextResponse.json({ coupon: updated });
}

// GET /api/coupon-redemption - get redemption history for logged-in user
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const coupons = await prisma.coupon.findMany({
    where: {
      redeemedBy: session.userId,
    },
    include: { hotel: true },
    orderBy: { redeemedAt: 'desc' },
  });

  return NextResponse.json({ redemptionHistory: coupons });
}
