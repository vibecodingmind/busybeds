/**
 * POST /api/subscriptions/webhook
 *
 * Stripe webhook handler — handles one-time payment events:
 *  - checkout.session.completed → create one-time subscription
 *
 * Note: Changed from recurring subscriptions to one-time payments.
 * Other events (invoice.payment_succeeded, subscriptions.updated, etc.)
 * are still handled below for backwards compatibility but won't trigger
 * in one-time payment mode.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { sendEmail, emailSubscriptionConfirmed } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

function emailPaymentFailed(name: string, packageName: string, retryUrl: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0}
    .w{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden}
    .h{background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff}
    .b{padding:28px 32px;color:#1D2939;line-height:1.6}
    .btn{display:inline-block;background:#E8395A;color:white;padding:12px 28px;border-radius:10px;font-weight:bold;text-decoration:none;margin-top:16px}
    .f{padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee;text-align:center}
  </style></head><body>
  <div class="w">
    <div class="h"><h2 style="margin:0">⚠️ Payment Failed</h2></div>
    <div class="b">
      <p>Hi ${name},</p>
      <p>We were unable to process your payment for your <strong>${packageName}</strong> subscription.</p>
      <p>Please update your payment details to keep your subscription active:</p>
      <a href="${retryUrl}" class="btn">Update Payment Method</a>
      <p style="margin-top:20px;font-size:13px;color:#888">Need help? Contact us at support@busybeds.com</p>
    </div>
    <div class="f">© ${new Date().getFullYear()} BusyBeds</div>
  </div></body></html>`;
}

function emailTrialEndingSoon(name: string, packageName: string, trialEnd: Date, upgradeUrl: string) {
  const formatted = trialEnd.toLocaleDateString('en-US', { dateStyle: 'long' });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0}
    .w{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden}
    .h{background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff}
    .b{padding:28px 32px;color:#1D2939;line-height:1.6}
    .btn{display:inline-block;background:linear-gradient(135deg,#1A3C5E,#0E7C7B);color:white;padding:12px 28px;border-radius:10px;font-weight:bold;text-decoration:none;margin-top:16px}
    .f{padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee;text-align:center}
  </style></head><body>
  <div class="w">
    <div class="h"><h2 style="margin:0">⏰ Your Trial Ends Soon</h2></div>
    <div class="b">
      <p>Hi ${name},</p>
      <p>Your free trial of <strong>${packageName}</strong> ends on <strong>${formatted}</strong>.</p>
      <p>Upgrade now to keep enjoying premium features:</p>
      <a href="${upgradeUrl}" class="btn">Continue Subscription</a>
      <p style="margin-top:20px;font-size:13px;color:#888">No action needed if you prefer to let the trial expire.</p>
    </div>
    <div class="f">© ${new Date().getFullYear()} BusyBeds</div>
  </div></body></html>`;
}

function emailActionRequired(name: string, packageName: string, actionUrl: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0}
    .w{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden}
    .h{background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff}
    .b{padding:28px 32px;color:#1D2939;line-height:1.6}
    .btn{display:inline-block;background:#F59E0B;color:white;padding:12px 28px;border-radius:10px;font-weight:bold;text-decoration:none;margin-top:16px}
    .f{padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee;text-align:center}
  </style></head><body>
  <div class="w">
    <div class="h"><h2 style="margin:0">🔐 Action Required</h2></div>
    <div class="b">
      <p>Hi ${name},</p>
      <p>Your payment for <strong>${packageName}</strong> requires additional verification (e.g. 3D Secure).</p>
      <p>Please complete verification to keep your subscription active:</p>
      <a href="${actionUrl}" class="btn">Complete Payment</a>
      <p style="margin-top:20px;font-size:13px;color:#888">This link expires shortly. Contact us if you need help.</p>
    </div>
    <div class="f">© ${new Date().getFullYear()} BusyBeds</div>
  </div></body></html>`;
}

function emailCancelled(name: string, packageName: string, accessUntil: Date, resubUrl: string) {
  const formatted = accessUntil.toLocaleDateString('en-US', { dateStyle: 'long' });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;background:#F2F4F7;margin:0;padding:0}
    .w{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden}
    .h{background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:24px 32px;color:#fff}
    .b{padding:28px 32px;color:#1D2939;line-height:1.6}
    .btn{display:inline-block;background:linear-gradient(135deg,#1A3C5E,#0E7C7B);color:white;padding:12px 28px;border-radius:10px;font-weight:bold;text-decoration:none;margin-top:16px}
    .f{padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee;text-align:center}
  </style></head><body>
  <div class="w">
    <div class="h"><h2 style="margin:0">Subscription Cancelled</h2></div>
    <div class="b">
      <p>Hi ${name},</p>
      <p>Your <strong>${packageName}</strong> subscription has been cancelled.</p>
      <p>You'll retain access until <strong>${formatted}</strong>.</p>
      <p>We'd love to have you back — you can re-subscribe any time:</p>
      <a href="${resubUrl}" class="btn">Re-subscribe</a>
    </div>
    <div class="f">© ${new Date().getFullYear()} BusyBeds</div>
  </div></body></html>`;
}

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });

  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('[Stripe Webhook] Missing signature or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Invalid signature:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received: ${event.type}`);

  try {
    // ── checkout.session.completed ────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        metadata?: { userId?: string; packageId?: string };
        subscription?: string;
      };
      const { userId, packageId } = session.metadata || {};
      if (!userId || !packageId) return NextResponse.json({ ok: true });

      const [pkg, user] = await Promise.all([
        prisma.subscriptionPackage.findUnique({ where: { id: packageId } }),
        prisma.user.findUnique({ where: { id: userId } }),
      ]);
      if (!pkg || !user) return NextResponse.json({ ok: true });

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
          billingCycle: 'one-time',
          expiresAt,
        },
      });
      console.log(`[Stripe Webhook] Created subscription ${newSub.id} for user ${userId}`);

      try {
        await sendEmail({
          to: user.email,
          subject: `🎉 Your ${pkg.name} subscription is active — BusyBeds`,
          html: emailSubscriptionConfirmed(user.fullName, pkg.name, expiresAt),
        });
      } catch (e) { console.error('[Stripe Webhook] Email error:', e); }

      // Create referral earning for whoever referred this user
      try {
        const referralUse = await prisma.referralUse.findUnique({ where: { referredId: userId } });
        if (referralUse) {
          const earningAmount = Math.round(pkg.priceMonthly * 0.20 * 100) / 100;
          const availableAt = new Date();
          availableAt.setDate(availableAt.getDate() + 30);
          await prisma.referralEarning.create({
            data: {
              referrerId: referralUse.referrerId,
              referredId: userId,
              amount: earningAmount,
              subscriptionId: newSub.id,
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
      } catch (e) { console.error('[Stripe Webhook] Referral earning error:', e); }
    }

    // ── invoice.payment_succeeded (renewal) ───────────────────────────────────
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as {
        subscription?: string;
        billing_reason?: string;
        paid?: boolean;
      };
      if (!invoice.subscription || !invoice.paid) return NextResponse.json({ ok: true });
      if (invoice.billing_reason === 'subscription_create') return NextResponse.json({ ok: true });

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: invoice.subscription as string },
        include: { package: true, user: true },
      });

      if (sub) {
        const newExpiresAt = new Date(sub.expiresAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + sub.package.durationDays);

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { expiresAt: newExpiresAt, status: 'active' },
        });
        console.log(`[Stripe Webhook] Renewed subscription ${sub.id}, new expiry: ${newExpiresAt}`);

        try {
          await sendEmail({
            to: sub.user.email,
            subject: `✅ Your ${sub.package.name} subscription renewed — BusyBeds`,
            html: emailSubscriptionConfirmed(sub.user.fullName, sub.package.name, newExpiresAt),
          });
        } catch (e) { console.error('[Stripe Webhook] Renewal email error:', e); }
      }
    }

    // ── invoice.payment_failed ────────────────────────────────────────────────
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as { subscription?: string; hosted_invoice_url?: string };
      if (!invoice.subscription) return NextResponse.json({ ok: true });

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: invoice.subscription as string },
        include: { user: true, package: true },
      });

      if (sub) {
        console.warn(`[Stripe Webhook] Payment failed for subscription ${sub.id}`);
        try {
          await sendEmail({
            to: sub.user.email,
            subject: `⚠️ Payment failed for your ${sub.package.name} subscription — BusyBeds`,
            html: emailPaymentFailed(
              sub.user.fullName,
              sub.package.name,
              invoice.hosted_invoice_url || `${APP_URL}/subscribe`
            ),
          });
        } catch (e) { console.error('[Stripe Webhook] Payment failed email error:', e); }
      }
    }

    // ── invoice.payment_action_required ──────────────────────────────────────
    else if (event.type === 'invoice.payment_action_required') {
      const invoice = event.data.object as { subscription?: string; hosted_invoice_url?: string };
      if (!invoice.subscription) return NextResponse.json({ ok: true });

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: invoice.subscription as string },
        include: { user: true, package: true },
      });

      if (sub) {
        try {
          await sendEmail({
            to: sub.user.email,
            subject: `🔐 Action required for your ${sub.package.name} payment — BusyBeds`,
            html: emailActionRequired(
              sub.user.fullName,
              sub.package.name,
              invoice.hosted_invoice_url || `${APP_URL}/subscribe`
            ),
          });
        } catch (e) { console.error('[Stripe Webhook] Action required email error:', e); }
      }
    }

    // ── customer.subscription.deleted ────────────────────────────────────────
    else if (event.type === 'customer.subscription.deleted') {
      const stripeSubId = (event.data.object as { id: string }).id;

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId },
        include: { user: true, package: true },
      });

      const updated = await prisma.subscription.updateMany({
        where: { stripeSubId },
        data: { status: 'cancelled' },
      });
      console.log(`[Stripe Webhook] Cancelled ${updated.count} subscription(s) for ${stripeSubId}`);

      if (sub) {
        try {
          await sendEmail({
            to: sub.user.email,
            subject: `Your ${sub.package.name} subscription has been cancelled — BusyBeds`,
            html: emailCancelled(sub.user.fullName, sub.package.name, sub.expiresAt, `${APP_URL}/subscribe`),
          });
        } catch (e) { console.error('[Stripe Webhook] Cancellation email error:', e); }
      }
    }

    // ── customer.subscription.updated ────────────────────────────────────────
    else if (event.type === 'customer.subscription.updated') {
      const stripeSubObj = event.data.object as {
        id: string;
        status: string;
        cancel_at_period_end?: boolean;
      };

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: stripeSubObj.id },
      });

      if (sub) {
        if (stripeSubObj.status === 'past_due') {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'past_due' as string } });
          console.warn(`[Stripe Webhook] Subscription ${sub.id} is past_due`);
        } else if (stripeSubObj.status === 'active' && sub.status !== 'active') {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'active' } });
          console.log(`[Stripe Webhook] Reactivated subscription ${sub.id}`);
        }

        if (stripeSubObj.cancel_at_period_end) {
          console.log(`[Stripe Webhook] Subscription ${sub.id} will cancel at period end`);
        }
      }
    }

    // ── customer.subscription.trial_will_end ─────────────────────────────────
    else if (event.type === 'customer.subscription.trial_will_end') {
      const stripeSubObj = event.data.object as { id: string; trial_end?: number };
      const trialEnd = stripeSubObj.trial_end
        ? new Date(stripeSubObj.trial_end * 1000)
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const sub = await prisma.subscription.findFirst({
        where: { stripeSubId: stripeSubObj.id },
        include: { user: true, package: true },
      });

      if (sub) {
        try {
          await sendEmail({
            to: sub.user.email,
            subject: `⏰ Your BusyBeds trial ends in 3 days`,
            html: emailTrialEndingSoon(sub.user.fullName, sub.package.name, trialEnd, `${APP_URL}/subscribe`),
          });
        } catch (e) { console.error('[Stripe Webhook] Trial end email error:', e); }
      }
    }

    else {
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Stripe Webhook] Processing error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
