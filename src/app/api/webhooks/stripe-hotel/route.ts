import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_HOTEL_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const hotelId = session.metadata?.hotelId;
        const tierId = session.metadata?.tierId;
        const billingCycle = session.metadata?.billingCycle || 'monthly';

        if (!hotelId || !tierId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Get subscription from Stripe
        const subscriptionId = session.subscription as string;
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Create or update subscription in database
        const now = new Date();
        const periodEnd = new Date(stripeSubscription.current_period_end * 1000);

        await prisma.hotelSubscription.upsert({
          where: { hotelId },
          update: {
            tierId,
            status: 'active',
            billingCycle,
            stripeSubId: subscriptionId,
            stripeCustomerId: session.customer as string,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            usageResetAt: now,
          },
          create: {
            hotelId,
            tierId,
            status: 'active',
            billingCycle,
            stripeSubId: subscriptionId,
            stripeCustomerId: session.customer as string,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            usageResetAt: now,
          },
        });

        console.log(`Created subscription for hotel ${hotelId}, tier ${tierId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const hotelId = stripeSub.metadata?.hotelId;

        if (!hotelId) break;

        const status = mapStripeStatus(stripeSub.status);
        const periodEnd = new Date(stripeSub.current_period_end * 1000);

        await prisma.hotelSubscription.updateMany({
          where: { stripeSubId: stripeSub.id },
          data: {
            status,
            currentPeriodEnd: periodEnd,
            canceledAt: stripeSub.cancel_at_period_end ? new Date() : null,
            cancelAt: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
          },
        });

        console.log(`Updated subscription for hotel ${hotelId}, status: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;

        await prisma.hotelSubscription.updateMany({
          where: { stripeSubId: stripeSub.id },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          },
        });

        console.log(`Canceled subscription ${stripeSub.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await prisma.hotelSubscription.updateMany({
            where: { stripeSubId: subscriptionId },
            data: { status: 'past_due' },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function mapStripeStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'expired',
    trialing: 'active',
    incomplete: 'past_due',
    incomplete_expired: 'expired',
  };
  return map[status] || 'active';
}
