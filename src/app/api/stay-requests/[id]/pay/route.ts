export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { stripe, hasStripe } from '@/lib/stripe';
import { hasPayPal, createPayPalOrder } from '@/lib/paypal';
import { hasPesapal, createPesapalOrder, registerAndGetIpnId } from '@/lib/pesapal';

const schema = z.object({
  paymentMethod: z.enum(['stripe', 'paypal', 'pesapal']),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/** POST /api/stay-requests/[id]/pay — initiate deposit payment */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'paymentMethod is required (stripe|paypal|pesapal)' }, { status: 400 });
    const { paymentMethod } = parsed.data;

    const stayRequest = await prisma.stayRequest.findUnique({
      where: { id },
      include: {
        hotel: { select: { name: true } },
        roomType: { select: { name: true } },
        traveler: { select: { email: true, fullName: true } },
      },
    });
    if (!stayRequest) return NextResponse.json({ error: 'Stay request not found.' }, { status: 404 });

    if (stayRequest.travelerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (stayRequest.status !== 'pending_payment') {
      return NextResponse.json({ error: `Payment not available for status: ${stayRequest.status}` }, { status: 400 });
    }

    const amount = stayRequest.depositAmount;
    const description = `BusyBeds Stay Deposit — ${stayRequest.hotel.name} (${stayRequest.nights} nights, ${stayRequest.roomType.name})`;
    const nameParts = stayRequest.traveler.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // ── Stripe ────────────────────────────────────────────────
    if (paymentMethod === 'stripe') {
      if (!hasStripe || !stripe) {
        return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
      }
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: stayRequest.traveler.email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: description },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        success_url: `${APP_URL}/api/stay-requests/${id}/pay/callback?method=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/my-stay-requests?cancelled=1`,
        metadata: { stayRequestId: id, userId: session.userId },
      });
      return NextResponse.json({ url: checkoutSession.url, mode: 'stripe' });
    }

    // ── PayPal ────────────────────────────────────────────────
    if (paymentMethod === 'paypal') {
      if (!hasPayPal) {
        return NextResponse.json({ error: 'PayPal is not configured.' }, { status: 503 });
      }
      try {
        const { approvalUrl, orderId } = await (createPayPalOrder as any)({
          amount,
          currency: 'USD',
          description,
          returnUrl: `${APP_URL}/api/stay-requests/${id}/pay/callback?method=paypal&order_id=${'{orderId}'}`,
          cancelUrl: `${APP_URL}/my-stay-requests?cancelled=1`,
        });
        // Store paypal order reference
        await prisma.stayRequest.update({
          where: { id },
          data: { paymentRef: `paypal:${orderId}`, paymentMethod: 'paypal' },
        });
        return NextResponse.json({ url: approvalUrl, mode: 'paypal' });
      } catch (e: any) {
        return NextResponse.json({ error: `PayPal error: ${e.message}` }, { status: 502 });
      }
    }

    // ── Pesapal ───────────────────────────────────────────────
    if (paymentMethod === 'pesapal') {
      if (!hasPesapal) {
        return NextResponse.json({ error: 'Pesapal is not configured.' }, { status: 503 });
      }
      const ipnUrl = process.env.PESAPAL_IPN_URL || `${APP_URL}/api/payments/pesapal/callback`;
      let ipnId: string;
      try {
        ipnId = await registerAndGetIpnId(ipnUrl);
      } catch (err) {
        return NextResponse.json({ error: 'Pesapal IPN registration failed.' }, { status: 503 });
      }

      const { redirectUrl, orderTrackingId } = await createPesapalOrder({
        orderId: `sr-${id}`,
        amount,
        currency: 'USD',
        description,
        firstName,
        lastName,
        email: stayRequest.traveler.email,
        callbackUrl: `${APP_URL}/api/stay-requests/${id}/pay/callback?method=pesapal&tracking_id=${'{orderTrackingId}'}`,
        ipnId,
      });

      await prisma.stayRequest.update({
        where: { id },
        data: { paymentRef: `pesapal:${orderTrackingId}`, paymentMethod: 'pesapal' },
      });

      return NextResponse.json({ url: redirectUrl, mode: 'pesapal' });
    }

    return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });

  } catch (err) {
    console.error('[StayRequest Pay Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
