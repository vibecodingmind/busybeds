export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { hasPesapal, createPesapalOrder, registerAndGetIpnId } from '@/lib/pesapal';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

/** POST /api/payments/pesapal — initiate Pesapal payment */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!hasPesapal) {
      return NextResponse.json({ error: 'Pesapal is not configured' }, { status: 503 });
    }

    let body: { packageId?: string } = {};
    try { body = await req.json(); } catch { /* ignore */ }

    if (!body.packageId) {
      return NextResponse.json({ error: 'packageId is required' }, { status: 400 });
    }

    const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: body.packageId } });
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Auto-register IPN URL and get the ID
    const ipnUrl = process.env.PESAPAL_IPN_URL || `${APP_URL}/api/payments/pesapal/callback`;
    let ipnId: string;
    try {
      ipnId = await registerAndGetIpnId(ipnUrl);
    } catch (err) {
      console.error('[Pesapal IPN Registration Error]', err);
      return NextResponse.json({ error: 'Pesapal IPN registration failed. Please try again.' }, { status: 503 });
    }

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
      where: { userId: session.userId, status: 'active' },
      data: { status: 'cancelled' },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

    // Create a pending subscription
    const sub = await prisma.subscription.create({
      data: {
        userId: session.userId,
        packageId: body.packageId,
        status: 'pending',
        billingCycle: 'monthly',
        expiresAt,
      },
    });

    const nameParts = user.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const { redirectUrl, orderTrackingId } = await createPesapalOrder({
      orderId: sub.id, // use subscription ID as order ID
      amount: pkg.priceMonthly,
      currency: 'USD',
      description: `${pkg.name} — Busy Beds Subscription`,
      firstName,
      lastName,
      email: user.email,
      callbackUrl: `${APP_URL}/api/payments/pesapal/callback?sub_id=${sub.id}`,
      ipnId,
    });

    // Save tracking ID on the subscription
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { stripeSubId: `pesapal:${orderTrackingId}` },
    });

    return NextResponse.json({ url: redirectUrl, mode: 'pesapal' });
  } catch (err) {
    console.error('[Pesapal Checkout Error]', err);
    return NextResponse.json({ error: 'Pesapal payment error. Please try again.' }, { status: 502 });
  }
}
