import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { sendEmail, emailSubscriptionConfirmed } from '@/lib/email';

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('[Webhook] Missing signature or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Webhook] Invalid signature:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    // ── Checkout session completed (initial subscription payment)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { userId?: string; packageId?: string }; subscription?: string };
      const { userId, packageId } = session.metadata || {};
      if (!userId || !packageId) {
        console.warn('[Webhook] Missing userId or packageId in metadata');
        return NextResponse.json({ ok: true });
      }

      const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!pkg || !user) {
        console.warn('[Webhook] Package or user not found');
        return NextResponse.json({ ok: true });
      }

      // Cancel previous subscriptions
      await prisma.subscription.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'cancelled' },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

      const newSub = await prisma.subscription.create({
        data: {
          userId,
          packageId,
          status: 'active',
          billingCycle: 'monthly',
          expiresAt,
          stripeSubId: typeof session.subscription === 'string' ? session.subscription : undefined,
        },
      });

      console.log(`[Webhook] Created subscription ${newSub.id} for user ${userId}`);

      try {
        await sendEmail({
          to: user.email,
          subject: `Your ${pkg.name} subscription is active — Busy Beds`,
          html: emailSubscriptionConfirmed(user.fullName, pkg.name, expiresAt),
        });
      } catch (e) {
        console.error('[Webhook] Email error:', e);
      }
    }

    // ── Subscription renewal (for recurring billing)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as { subscription?: string; paid?: boolean };
      if (!invoice.subscription || !invoice.paid) {
        return NextResponse.json({ ok: true });
      }

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: invoice.subscription as string },
        include: { package: true, user: true },
      });

      if (sub) {
        const newExpiresAt = new Date(sub.expiresAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + sub.package.durationDays);

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { expiresAt: newExpiresAt },
        });

        console.log(`[Webhook] Renewed subscription ${sub.id}, expires at ${newExpiresAt}`);

        try {
          await sendEmail({
            to: sub.user.email,
            subject: `Your ${sub.package.name} subscription renewed — Busy Beds`,
            html: emailSubscriptionConfirmed(sub.user.fullName, sub.package.name, newExpiresAt),
          });
        } catch (e) {
          console.error('[Webhook] Email error:', e);
        }
      }
    }

    // ── Subscription deleted (user cancelled on Stripe)
    if (event.type === 'customer.subscription.deleted') {
      const stripeSubId = (event.data.object as { id: string }).id;
      const updated = await prisma.subscription.updateMany({
        where: { stripeSubId },
        data: { status: 'cancelled' },
      });
      console.log(`[Webhook] Cancelled ${updated.count} subscription(s) with stripeSubId ${stripeSubId}`);
    }

    // ── Payment failed
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as { subscription?: string };
      if (invoice.subscription) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubId: invoice.subscription as string },
          include: { user: true },
        });
        if (sub) {
          console.warn(`[Webhook] Payment failed for subscription ${sub.id}`);
          // Could send email notifying user of failed payment
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Webhook] Error processing event:', err);
    // Return 500 to tell Stripe to retry
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
