export const dynamic = 'force-dynamic';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { generateCouponCode, generateQRDataUrl } from '@/lib/qr';
import { sendEmail, emailCouponGenerated } from '@/lib/email';

// GET /api/coupons — list caller's coupons (supports ?hotelId=&status= filters)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filterHotelId = searchParams.get('hotelId') || undefined;
  const filterStatus  = searchParams.get('status')  || undefined;

  const where: Record<string, unknown> = { userId: session.userId };
  if (filterHotelId) where.hotelId = filterHotelId;
  if (filterStatus)  where.status  = filterStatus;

  const coupons = await prisma.coupon.findMany({
    where,
    include: { hotel: true },
    orderBy: { generatedAt: 'desc' },
  });

  // Auto-expire old active coupons (only when fetching all, not filtered)
  if (!filterHotelId && !filterStatus) {
    const now = new Date();
    for (const c of coupons) {
      if (c.status === 'active' && c.expiresAt < now) {
        await prisma.coupon.update({ where: { id: c.id }, data: { status: 'expired' } });
        c.status = 'expired';
      }
    }
  }

  return NextResponse.json({ coupons });
}

const schema = z.object({
  hotelId: z.string(),
  guestName: z.string().trim().max(80).optional(),
});

// POST /api/coupons — generate a coupon (supports guestName for extra friend coupons)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Rate limit: 5 coupon generations per 10 minutes per user
  const rl = rateLimit(`coupon:${session.userId}`, { limit: 5, windowSec: 600 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many coupon generation requests. Please wait a few minutes.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json();
  const { hotelId, guestName } = schema.parse(body);

  // Check active subscription
  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId, status: 'active', expiresAt: { gt: now } },
    include: { package: true },
    orderBy: { expiresAt: 'desc' },
  });
  if (!sub) {
    return NextResponse.json({ error: 'No active subscription', code: 'NO_SUBSCRIPTION' }, { status: 402 });
  }

  // Check coupon limit (counts ALL coupons including guest ones)
  const used = await prisma.coupon.count({
    where: { userId: session.userId, subscriptionId: sub.id, generatedAt: { gte: sub.startsAt } },
  });
  if (used >= sub.package.couponLimitPerPeriod) {
    return NextResponse.json({ error: 'Coupon limit reached for this period', code: 'LIMIT_REACHED' }, { status: 429 });
  }

  // For self (no guestName): check if already has an active coupon for this hotel
  if (!guestName) {
    const existing = await prisma.coupon.findFirst({
      where: { userId: session.userId, hotelId, status: 'active', expiresAt: { gt: now }, guestName: null },
    });
    if (existing) {
      return NextResponse.json({ coupon: existing, existing: true });
    }
  }

  // Get hotel
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel || hotel.status !== 'active') {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
  }

  const code = generateCouponCode();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const qrDataUrl = await generateQRDataUrl(code, appUrl);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + hotel.couponValidDays);

  const coupon = await prisma.coupon.create({
    data: {
      code,
      qrDataUrl,
      userId: session.userId,
      hotelId,
      subscriptionId: sub.id,
      discountPercent: hotel.discountPercent,
      guestName: guestName || null,
      expiresAt,
    },
    include: { hotel: true },
  });

  // Send coupon email
  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user) {
      const recipientName = guestName ? `${guestName} (via ${user.fullName})` : user.fullName;
      await sendEmail({
        to: user.email,
        subject: `Your ${hotel.discountPercent}% off coupon for ${hotel.name} — Busy Beds`,
        html: emailCouponGenerated(recipientName, hotel.name, hotel.discountPercent, code, expiresAt),
      });
    }
  } catch (e) { console.error('Email error:', e); }

  return NextResponse.json({ coupon }, { status: 201 });
}
