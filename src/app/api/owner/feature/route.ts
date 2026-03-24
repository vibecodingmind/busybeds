export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { stripe, hasStripe } from '@/lib/stripe';

const PLANS = [
  { days: 7,  price: 19 },
  { days: 14, price: 35 },
  { days: 30, price: 59 },
];

// GET /api/owner/feature?days=7|14|30
// Creates a Stripe one-time checkout session or (if no Stripe) activates directly
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.redirect(new URL('/login?next=/owner', req.url));

  const days = parseInt(new URL(req.url).searchParams.get('days') || '0');
  const plan = PLANS.find(p => p.days === days);
  if (!plan) return NextResponse.json({ error: 'Invalid plan. Choose 7, 14, or 30 days.' }, { status: 400 });

  const hotelOwner = await prisma.hotelOwner.findUnique({
    where: { userId: session.userId },
    include: { hotel: true },
  });
  if (!hotelOwner) return NextResponse.json({ error: 'No hotel found for this user' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (hasStripe && stripe) {
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: undefined,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Feature ${hotelOwner.hotel.name} for ${days} days`, description: 'Top placement in BusyBeds search results and homepage' },
            unit_amount: plan.price * 100,
          },
          quantity: 1,
        }],
        success_url: `${appUrl}/api/owner/feature/success?days=${days}&hotelId=${hotelOwner.hotel.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/owner`,
        metadata: { hotelId: hotelOwner.hotel.id, days: String(days) },
      });
      return NextResponse.redirect(new URL(checkoutSession.url!));
    } catch (e) {
      console.error('[Feature Checkout]', e);
      return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
    }
  }

  // No Stripe — activate directly (dev/demo)
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);
  await prisma.hotel.update({
    where: { id: hotelOwner.hotel.id },
    data: { isFeatured: true, featuredUntil },
  });
  return NextResponse.redirect(new URL('/owner?featured=1', req.url));
}
