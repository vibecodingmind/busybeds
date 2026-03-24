export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPesapalTransactionStatus } from '@/lib/pesapal';
import { sendEmail, emailSubscriptionConfirmed } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/** GET /api/payments/pesapal/callback — Pesapal IPN + redirect callback */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderTrackingId = searchParams.get('tracking_id') || searchParams.get('OrderTrackingId');
    const subId = searchParams.get('sub_id');

    if (!orderTrackingId) {
      return NextResponse.redirect(`${APP_URL}/subscribe?error=missing_tracking`);
    }

    // Check payment status with Pesapal
    const status = await getPesapalTransactionStatus(orderTrackingId);

    // payment_status_description: 'Completed' means success
    const isCompleted = status.payment_status_description === 'Completed' ||
                        status.status_code === 1;

    if (!isCompleted) {
      return NextResponse.redirect(`${APP_URL}/subscribe?error=payment_not_completed`);
    }

    // Find the pending subscription
    const sub = await prisma.subscription.findFirst({
      where: subId
        ? { id: subId }
        : { stripeSubId: `pesapal:${orderTrackingId}`, status: 'pending' },
      include: { user: true, package: true },
    });

    if (!sub) {
      return NextResponse.redirect(`${APP_URL}/subscribe?error=subscription_not_found`);
    }

    if (sub.status === 'active') {
      // Already activated (IPN fired before redirect)
      return NextResponse.redirect(`${APP_URL}/subscribe/success`);
    }

    // Activate subscription
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'active', stripeSubId: `pesapal:${orderTrackingId}` },
    });

    try {
      await sendEmail({
        to: sub.user.email,
        subject: `Your ${sub.package.name} subscription is active — Busy Beds`,
        html: emailSubscriptionConfirmed(sub.user.fullName, sub.package.name, sub.expiresAt),
      });
    } catch (e) { console.error('Email error:', e); }

    return NextResponse.redirect(`${APP_URL}/subscribe/success`);
  } catch (err) {
    console.error('[Pesapal Callback Error]', err);
    return NextResponse.redirect(`${APP_URL}/subscribe?error=pesapal_error`);
  }
}
