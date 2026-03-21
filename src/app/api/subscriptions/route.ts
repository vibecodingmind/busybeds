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
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { packageId } = schema.parse(body);

  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // ── Stripe Checkout (when keys are configured) ───────────────
  if (hasStripe && stripe && pkg.stripePriceIdMonthly) {
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
  }

  // ── Mock Payment (dev — no Stripe keys needed) ───────────────
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

  return NextResponse.json({ subscription: sub, mode: 'mock' }, { status: 201 });
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
