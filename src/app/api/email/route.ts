export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import {
  sendEmail,
  emailCouponExpiringSoon,
  emailCouponShareReceived,
  emailWelcomeOwner,
} from '@/lib/email';

/**
 * POST /api/email
 * Trigger transactional emails for various events.
 * Payload: { type: string, ...params }
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type } = body;

  try {
    if (type === 'coupon_expiry_reminder') {
      // Send reminders for coupons expiring in the next 3 days
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

      const expiringSoon = await prisma.coupon.findMany({
        where: {
          status: 'active',
          expiresAt: { gte: oneDayFromNow, lte: threeDaysFromNow },
        },
        include: {
          user: { select: { fullName: true, email: true } },
          hotel: { select: { name: true } },
        },
        take: 100,
      });

      let sent = 0;
      for (const coupon of expiringSoon) {
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${coupon.code}`;
        const html = emailCouponExpiringSoon(
          coupon.user.fullName,
          coupon.hotel.name,
          coupon.code,
          coupon.discountPercent,
          coupon.expiresAt,
          shareUrl,
        );
        await sendEmail({
          to: coupon.user.email,
          subject: `⏰ Your ${coupon.discountPercent}% coupon expires soon!`,
          html,
        });
        sent++;
      }
      return NextResponse.json({ ok: true, sent });
    }

    if (type === 'share_coupon_email') {
      const { couponCode, recipientEmail, recipientName } = body;
      if (!couponCode || !recipientEmail) {
        return NextResponse.json({ error: 'Missing couponCode or recipientEmail' }, { status: 400 });
      }

      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
        include: {
          user: { select: { fullName: true } },
          hotel: { select: { name: true, slug: true } },
        },
      });

      if (!coupon || coupon.userId !== session.userId) {
        return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      }

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${coupon.code}`;
      const html = emailCouponShareReceived(
        recipientName || recipientEmail.split('@')[0],
        coupon.user.fullName,
        coupon.hotel.name,
        coupon.discountPercent,
        shareUrl,
        coupon.expiresAt,
      );

      await sendEmail({
        to: recipientEmail,
        subject: `🎁 ${coupon.user.fullName} shared a ${coupon.discountPercent}% hotel deal with you!`,
        html,
      });
      return NextResponse.json({ ok: true });
    }

    if (type === 'welcome_owner') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { fullName: true, email: true },
      });
      const owner = await prisma.hotelOwner.findUnique({
        where: { userId: session.userId },
        include: { hotel: { select: { name: true } } },
      });
      if (!user || !owner) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const html = emailWelcomeOwner(user.fullName, owner.hotel.name);
      await sendEmail({
        to: user.email,
        subject: `🏨 Welcome to BusyBeds! Your hotel has been submitted`,
        html,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
  } catch (err: any) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Failed to send email', detail: err.message }, { status: 500 });
  }
}
