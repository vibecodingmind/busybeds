import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get hotel owner
  const hotelOwner = await prisma.hotelOwner.findUnique({
    where: { userId: session.userId },
    include: { hotel: true },
  });

  if (!hotelOwner) {
    return NextResponse.json({ error: 'No hotel found' }, { status: 400 });
  }

  const { tierId, billingCycle } = await req.json();

  // Get tier
  const tier = await prisma.hotelSubscriptionTier.findUnique({
    where: { id: tierId },
  });

  if (!tier || !tier.isActive) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  // Check if tier is free
  if (tier.priceMonthly === 0) {
    return NextResponse.json({ error: 'Cannot subscribe to free tier' }, { status: 400 });
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const existingSub = await prisma.hotelSubscription.findUnique({
    where: { hotelId: hotelOwner.hotelId },
  });

  if (existingSub?.stripeCustomerId) {
    stripeCustomerId = existingSub.stripeCustomerId;
  } else {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: session.email,
      metadata: {
        hotelId: hotelOwner.hotelId,
        userId: session.userId,
      },
    });
    stripeCustomerId = customer.id;
  }

  // Get price ID
  const priceId = billingCycle === 'annual' 
    ? tier.stripePriceIdAnnual 
    : tier.stripePriceIdMonthly;

  if (!priceId) {
    // If no Stripe price ID, create checkout without subscription (manual processing)
    // This allows you to set up Stripe prices later
    return NextResponse.json({ 
      error: 'Stripe pricing not configured for this tier. Please contact support.' 
    }, { status: 400 });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com'}/owner/upgrade?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com'}/owner/upgrade?canceled=true`,
    metadata: {
      hotelId: hotelOwner.hotelId,
      tierId: tier.id,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        hotelId: hotelOwner.hotelId,
        tierId: tier.id,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
