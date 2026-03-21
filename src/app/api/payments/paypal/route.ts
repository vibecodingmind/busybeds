import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { hasPayPal, createPayPalSubscription } from '@/lib/paypal';
import { sendEmail, emailSubscriptionConfirmed } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/** POST /api/payments/paypal — initiate PayPal subscription */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!hasPayPal) {
      return NextResponse.json({ error: 'PayPal is not configured' }, { status: 503 });
    }

    let body: { packageId?: string } = {};
    try { body = await req.json(); } catch { /* ignore */ }

    if (!body.packageId) {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
    }

    const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: body.packageId } });
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

    if (!(pkg as any).paypalPlanId) {
      return NextResponse.json({ error: 'This plan is not set up for PayPal payments yet.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { approvalUrl, subscriptionId } = await createPayPalSubscription(
      (pkg as any).paypalPlanId,
      `${APP_URL}/subscribe/success?method=paypal&subscription_id={SUBSCRIPTION_ID}`,
      `${APP_URL}/subscribe`,
      `${session.userId}:${body.packageId}`
    );

    // Store pending subscription reference
    await prisma.subscription.updateMany({
      where: { userId: session.userId, status: 'active' },
      data: { status: 'cancelled' },
    });

    // We store a pending record — webhook or callback will activate it
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

    await prisma.subscription.create({
      data: {
        userId: session.userId,
        packageId: body.packageId,
        status: 'pending',
        billingCycle: 'monthly',
        expiresAt,
        stripeSubId: `paypal:${subscriptionId}`, // store PayPal sub ID here
      },
    });

    return NextResponse.json({ url: approvalUrl, mode: 'paypal' });
  } catch (err) {
    console.error('[PayPal Checkout Error]', err);
    return NextResponse.json({ error: 'PayPal payment error. Please try again.' }, { status: 502 });
  }
}

/** GET /api/payments/paypal?subscription_id=xxx — activate after PayPal approval */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscription_id');

    if (!subscriptionId) {
      return NextResponse.redirect(`${APP_URL}/subscribe?error=missing_subscription`);
    }

    // Find the pending subscription
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubId: `paypal:${subscriptionId}`, status: 'pending' },
      include: { user: true, package: true },
    });

    if (!sub) {
      return NextResponse.redirect(`${APP_URL}/subscribe?error=subscription_not_found`);
    }

    // Activate it
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'active', stripeSubId: `paypal:${subscriptionId}` },
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
    console.error('[PayPal Callback Error]', err);
    return NextResponse.redirect(`${APP_URL}/subscribe?error=paypal_error`);
  }
}
