export const dynamic = 'force-dynamic';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { generateCouponCode, generateQRDataUrl } from '@/lib/qr';
import { sendEmail, emailCouponGenerated, emailGiftCoupon } from '@/lib/email';
import { getEffectiveDiscount } from '@/lib/discountRules';
import { awardPoints } from '@/lib/loyalty';
import { sendSMS, smsCouponGenerated } from '@/lib/sms';

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

  // Auto-expire old active coupons using batch update (not individual)
  if (!filterHotelId && !filterStatus) {
    const now = new Date();
    const expiredIds = coupons
      .filter(c => c.status === 'active' && c.expiresAt < now)
      .map(c => c.id);
    
    if (expiredIds.length > 0) {
      await prisma.coupon.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'expired' }
      });
      // Update local state
      for (const c of coupons) {
        if (expiredIds.includes(c.id)) c.status = 'expired';
      }
    }
  }

  return NextResponse.json({ coupons });
}

const schema = z.object({
  hotelId: z.string(),
  guestName: z.string().trim().max(80).optional(),
  guestEmail: z.string().email().optional(),
  checkIn: z.string().optional(),   // ISO date string e.g. "2025-02-15"
  checkOut: z.string().optional(),  // ISO date string e.g. "2025-02-20"
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
  const { hotelId, guestName, guestEmail, checkIn, checkOut } = schema.parse(body);

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';
  const qrDataUrl = await generateQRDataUrl(code, appUrl);

  // If dates provided: coupon is valid from checkIn to checkOut (date-locked)
  // Otherwise: fall back to hotel's couponValidDays
  const startTime = checkIn ? new Date(checkIn) : null;
  const endTime = checkOut ? new Date(checkOut) : null;
  const expiresAt = endTime
    ? new Date(new Date(checkOut!).getTime() + 86400000) // day after checkout as hard expiry
    : (() => { const d = new Date(); d.setDate(d.getDate() + hotel.couponValidDays); return d; })();

  // Apply dynamic discount rules if any match today
  const { discount: effectiveDiscount } = getEffectiveDiscount(
    (hotel as any).discountRules || '[]',
    hotel.discountPercent,
  );

  const coupon = await prisma.coupon.create({
    data: {
      code,
      qrDataUrl,
      userId: session.userId,
      hotelId,
      subscriptionId: sub.id,
      discountPercent: effectiveDiscount,
      guestName: guestName || null,
      expiresAt,
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    },
    include: { hotel: true },
  });

  // Update hotel's lastCouponAt timestamp
  await prisma.hotel.update({ where: { id: hotelId }, data: { lastCouponAt: new Date() } }).catch(() => {});

  // Award loyalty points for coupon generation (+10 pts)
  await awardPoints(session.userId, 10, 'coupon_gen', `Generated coupon for ${hotel.name}`);

  // Send coupon email + SMS
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { notificationPreference: true },
    });
    if (user) {
      if (guestName && guestEmail) {
        // Send gift coupon directly to friend's email
        await sendEmail({
          to: guestEmail,
          subject: `🎁 ${user.fullName} gifted you ${effectiveDiscount}% off at ${hotel.name} — Busy Beds`,
          html: emailGiftCoupon(guestName, user.fullName, hotel.name, effectiveDiscount, code, expiresAt, qrDataUrl),
        });
      } else {
        const recipientName = guestName ? `${guestName} (via ${user.fullName})` : user.fullName;
        await sendEmail({
          to: user.email,
          subject: `Your ${effectiveDiscount}% off coupon for ${hotel.name} — Busy Beds`,
          html: emailCouponGenerated(recipientName, hotel.name, effectiveDiscount, code, expiresAt, qrDataUrl),
        });
      }

      // SMS notification (only if user has a phone and SMS alerts enabled or preference not set)
      const smsEnabled = user.notificationPreference?.smsAlerts !== false;
      if (user.phone && smsEnabled) {
        sendSMS({
          to: user.phone,
          message: smsCouponGenerated(hotel.name, code, effectiveDiscount, expiresAt),
          userId: user.id,
        }).catch(e => console.error('[SMS] Coupon gen error:', e));
      }
    }
  } catch (e) { console.error('Email/SMS error:', e); }

  return NextResponse.json({ coupon }, { status: 201 });
}
