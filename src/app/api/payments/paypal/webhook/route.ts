/**
 * POST /api/payments/paypal/webhook
 *
 * Handles PayPal Webhook Notifications for subscription lifecycle events.
 *
 * PayPal event types handled:
 *  - BILLING.SUBSCRIPTION.ACTIVATED   → activate subscription
 *  - BILLING.SUBSCRIPTION.RENEWED     → extend subscription expiry
 *  - BILLING.SUBSCRIPTION.CANCELLED   → cancel subscription
 *  - BILLING.SUBSCRIPTION.SUSPENDED   → suspend subscription
 *  - BILLING.SUBSCRIPTION.EXPIRED     → mark subscription expired
 *  - PAYMENT.SALE.COMPLETED           → confirm a sale payment
 *  - PAYMENT.SALE.REVERSED            → handle reversal / chargeback
 *
 * Signature verification uses PayPal's webhook verification API.
 * Set PAYPAL_WEBHOOK_ID in your environment (.env).
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, emailSubscriptionConfirmed } from '@/lib/email';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

// ─── PayPal OAuth token cache ─────────────────────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return null;
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

// ─── Signature verification ───────────────────────────────────────────────────
async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  if (!process.env.PAYPAL_WEBHOOK_ID) {
    // No webhook ID configured: skip verification in development
    if (process.env.NODE_ENV === 'production') {
      console.error('[PayPal Webhook] PAYPAL_WEBHOOK_ID not configured');
      return false;
    }
    console.warn('[PayPal Webhook] Skipping signature verification (no PAYPAL_WEBHOOK_ID)');
    return true;
  }

  const token = await getAccessToken();
  if (!token) {
    console.error('[PayPal Webhook] Failed to get access token for verification');
    return false;
  }

  const verifyRes = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      auth_algo:         headers.get('paypal-auth-algo'),
      cert_url:          headers.get('paypal-cert-url'),
      transmission_id:   headers.get('paypal-transmission-id'),
      transmission_sig:  headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id:        process.env.PAYPAL_WEBHOOK_ID,
      webhook_event:     JSON.parse(rawBody),
    }),
  });

  if (!verifyRes.ok) {
    console.error('[PayPal Webhook] Verification request failed');
    return false;
  }

  const verifyData = await verifyRes.json();
  return verifyData.verification_status === 'SUCCESS';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function paypalSubId(subscriptionId: string) {
  return `paypal:${subscriptionId}`;
}

function extendExpiry(currentExpiry: Date, durationDays: number): Date {
  const newExpiry = new Date(currentExpiry);
  newExpiry.setDate(newExpiry.getDate() + durationDays);
  return newExpiry;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify signature
  const isValid = await verifyWebhookSignature(req.headers, rawBody);
  if (!isValid) {
    console.error('[PayPal Webhook] Invalid signature — rejecting');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event_type, resource } = event;
  console.log(`[PayPal Webhook] Received: ${event_type}`);

  try {
    // ── BILLING.SUBSCRIPTION.ACTIVATED ──────────────────────────────────────
    if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subscriptionId = resource.id as string;

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: paypalSubId(subscriptionId) },
        include: { user: true, package: true },
      });

      if (sub && sub.status !== 'active') {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'active' },
        });
        console.log(`[PayPal Webhook] Activated subscription ${sub.id}`);

        try {
          await sendEmail({
            to: sub.user.email,
            subject: `Your ${sub.package.name} subscription is active — BusyBeds`,
            html: emailSubscriptionConfirmed(sub.user.fullName, sub.package.name, sub.expiresAt),
          });
        } catch (e) { console.error('[PayPal Webhook] Email error:', e); }
      }
    }

    // ── BILLING.SUBSCRIPTION.RENEWED ────────────────────────────────────────
    else if (event_type === 'BILLING.SUBSCRIPTION.RENEWED') {
      const subscriptionId = resource.id as string;

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: paypalSubId(subscriptionId), status: 'active' },
        include: { user: true, package: true },
      });

      if (sub) {
        const newExpiry = extendExpiry(sub.expiresAt, sub.package.durationDays);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { expiresAt: newExpiry },
        });
        console.log(`[PayPal Webhook] Renewed subscription ${sub.id}, new expiry: ${newExpiry}`);

        try {
          await sendEmail({
            to: sub.user.email,
            subject: `Your ${sub.package.name} subscription has been renewed — BusyBeds`,
            html: emailSubscriptionConfirmed(sub.user.fullName, sub.package.name, newExpiry),
          });
        } catch (e) { console.error('[PayPal Webhook] Email error:', e); }
      }
    }

    // ── BILLING.SUBSCRIPTION.CANCELLED ──────────────────────────────────────
    else if (event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const subscriptionId = resource.id as string;

      const updated = await prisma.subscription.updateMany({
        where: { stripeSubId: paypalSubId(subscriptionId) },
        data: { status: 'cancelled' },
      });
      console.log(`[PayPal Webhook] Cancelled ${updated.count} subscription(s) for PayPal ID ${subscriptionId}`);

      // Notify user
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: paypalSubId(subscriptionId) },
        include: { user: true, package: true },
      });
      if (sub) {
        try {
          await sendEmail({
            to: sub.user.email,
            subject: `Your ${sub.package.name} subscription was cancelled — BusyBeds`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px">
                <h2 style="color:#1A3C5E">Subscription Cancelled</h2>
                <p>Hi ${sub.user.fullName},</p>
                <p>Your <strong>${sub.package.name}</strong> subscription has been cancelled.</p>
                <p>You'll continue to have access until <strong>${sub.expiresAt.toLocaleDateString('en-US', { dateStyle: 'long' })}</strong>.</p>
                <p>If this was a mistake, you can re-subscribe at any time at <a href="${APP_URL}/subscribe">${APP_URL}/subscribe</a>.</p>
                <p style="color:#888;font-size:12px;margin-top:24px">— BusyBeds Team</p>
              </div>
            `,
          });
        } catch (e) { console.error('[PayPal Webhook] Cancellation email error:', e); }
      }
    }

    // ── BILLING.SUBSCRIPTION.SUSPENDED ──────────────────────────────────────
    else if (event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      const subscriptionId = resource.id as string;
      await prisma.subscription.updateMany({
        where: { stripeSubId: paypalSubId(subscriptionId) },
        data: { status: 'suspended' as string },
      });
      console.log(`[PayPal Webhook] Suspended subscription ${subscriptionId}`);
    }

    // ── BILLING.SUBSCRIPTION.EXPIRED ────────────────────────────────────────
    else if (event_type === 'BILLING.SUBSCRIPTION.EXPIRED') {
      const subscriptionId = resource.id as string;
      await prisma.subscription.updateMany({
        where: { stripeSubId: paypalSubId(subscriptionId) },
        data: { status: 'expired' as string },
      });
      console.log(`[PayPal Webhook] Expired subscription ${subscriptionId}`);
    }

    // ── PAYMENT.SALE.COMPLETED ───────────────────────────────────────────────
    else if (event_type === 'PAYMENT.SALE.COMPLETED') {
      // Confirm the sale is linked to a known subscription
      const billingAgreementId = resource.billing_agreement_id as string | undefined;
      if (billingAgreementId) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubId: paypalSubId(billingAgreementId) },
        });
        if (sub) {
          console.log(`[PayPal Webhook] Sale completed for subscription ${sub.id}`);
        }
      }
    }

    // ── PAYMENT.SALE.REVERSED ────────────────────────────────────────────────
    else if (event_type === 'PAYMENT.SALE.REVERSED') {
      const billingAgreementId = resource.billing_agreement_id as string | undefined;
      if (billingAgreementId) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubId: paypalSubId(billingAgreementId) },
          include: { user: true },
        });
        if (sub) {
          console.warn(`[PayPal Webhook] Payment reversed for subscription ${sub.id}`);
          // Flag for manual review — don't auto-cancel as it may be a dispute
        }
      }
    }

    else {
      console.log(`[PayPal Webhook] Unhandled event type: ${event_type}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PayPal Webhook] Processing error:', err);
    // Return 500 so PayPal retries
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
