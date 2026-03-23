export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { stripe, hasStripe } from '@/lib/stripe';
import { sendEmail, emailSubscriptionConfirmed } from '@/lib/email';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId, status: 'active', expiresAt: { gt: now } },
    include: { package: true },
    orderBy: { expiresAt: 'desc' },
  });

  const couponsThisPeriod = sub
    ? await prisma.coupon.count({
        where: { userId: session.userId, subscriptionId: sub.id, generatedAt: { gte: sub.startsAt } },
      })
    : 0;

  return NextResponse.json({ subscription: sub, couponsThisPeriod });
}

const schema = z.object({ packageId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { packageId?: string };
    try { body = await req.json(); } catch { body = {}; }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
    const { packageId } = parsed.data;

    const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ── Stripe Checkout (when keys are configured) ───────────────
    if (hasStripe && stripe && pkg.stripePriceIdMonthly) {
      try {
        const checkoutSession = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer_email: user.email,
          line_items: [{ price: pkg.stripePriceIdMonthly, quantity: 1 }],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
          metadata: { userId: session.userId, packageId },
        });
        return NextResponse.json({ url: checkoutSession.url, mode: 'stripe' });
      } catch (stripeErr) {
        console.error('[Stripe Checkout Error]', stripeErr);
        return NextResponse.json({ error: 'Payment provider error. Please try again.' }, { status: 502 });
      }
    }

    // ── Direct Payment / Mock ─────────────────────────────────────
    await prisma.subscription.updateMany({
      where: { userId: session.userId, status: 'active' },
      data: { status: 'cancelled' },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

    const sub = await prisma.subscription.create({
      data: { userId: session.userId, packageId, status: 'active', billingCycle: 'monthly', expiresAt },
      include: { package: true },
    });

    try {
      await sendEmail({
        to: user.email,
        subject: `Your ${pkg.name} subscription is active — Busy Beds`,
        html: emailSubscriptionConfirmed(user.fullName, pkg.name, expiresAt),
      });
    } catch (e) { console.error('Email error:', e); }

    // Create referral earning for the user who referred this subscriber
    try {
      const referralUse = await prisma.referralUse.findUnique({ where: { referredId: session.userId } });
      if (referralUse) {
        const earningAmount = Math.round(pkg.priceMonthly * 0.20 * 100) / 100;
        const availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + 30);
        await prisma.referralEarning.create({
          data: {
            referrerId: referralUse.referrerId,
            referredId: session.userId,
            amount: earningAmount,
            subscriptionId: sub.id,
            availableAt,
          },
        });
        await prisma.notification.create({
          data: {
            userId: referralUse.referrerId,
            title: 'Referral Commission Earned!',
            message: `You earned $${earningAmount.toFixed(2)} from a referral. Available in 30 days.`,
            type: 'referral',
            link: '/referral#earnings',
          },
        });
      }
    } catch (e) { console.error('Referral earning error:', e); }

    return NextResponse.json({ subscription: sub, mode: 'mock' }, { status: 201 });

  } catch (err) {
    console.error('[Subscription POST Error]', err);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Cancel via Stripe if applicable
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId, status: 'active' },
    orderBy: { expiresAt: 'desc' },
  });
  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 });

  if (hasStripe && stripe && sub.stripeSubId) {
    await stripe.subscriptions.update(sub.stripeSubId, { cancel_at_period_end: true });
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'cancelled' },
  });

  return NextResponse.json({ ok: true });
}
