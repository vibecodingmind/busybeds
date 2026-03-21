import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { stripe, hasStripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const packages = await prisma.subscriptionPackage.findMany({
    orderBy: { priceMonthly: 'asc' },
    include: { _count: { select: { subscriptions: true } } },
  });
  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, priceMonthly, priceAnnual, durationDays, couponLimitPerPeriod, isActive } = body;
  if (!name || priceMonthly == null) return NextResponse.json({ error: 'name and priceMonthly required' }, { status: 400 });

  let stripePriceIdMonthly: string | null = null;

  // Auto-create Stripe product + price if Stripe is configured
  if (hasStripe && stripe) {
    try {
      const product = await stripe.products.create({
        name,
        description: `BusyBeds ${name} — ${couponLimitPerPeriod || 5} coupons per period`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(Number(priceMonthly) * 100), // cents
        currency: 'usd',
        recurring: { interval: 'month' },
      });

      stripePriceIdMonthly = price.id;
    } catch (err) {
      console.error('Stripe product/price creation failed:', err);
      // Continue without Stripe — will fall back to mock payments
    }
  }

  const pkg = await prisma.subscriptionPackage.create({
    data: {
      name,
      priceMonthly: Number(priceMonthly),
      priceAnnual: priceAnnual ? Number(priceAnnual) : null,
      durationDays: Number(durationDays || 30),
      couponLimitPerPeriod: Number(couponLimitPerPeriod || 5),
      isActive: Boolean(isActive ?? true),
      stripePriceIdMonthly,
    },
  });

  return NextResponse.json({ pkg, stripeConnected: !!stripePriceIdMonthly }, { status: 201 });
}
