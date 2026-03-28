/**
 * SDASMS helper — lightweight wrapper around the SDASMS REST API.
 * https://my.sdasms.com
 *
 * Usage:
 *   import { sendSMS } from '@/lib/sms';
 *   await sendSMS({ to: '+255712345678', message: 'Hello from BusyBeds!' });
 *
 * Never blocks the main flow — all errors are caught and logged.
 */

import prisma from '@/lib/prisma';

const ENDPOINT = 'https://my.sdasms.com/api/http/sms/send';

interface SendSMSOptions {
  /** Recipient phone number(s) in international format. Comma-separated for bulk. */
  to: string | string[];
  /** SMS body (max ~160 chars for single-part SMS) */
  message: string;
  /** Alphanumeric sender ID (max 11 chars). Defaults to env SDASMS_SENDER_ID or 'BusyBeds' */
  senderId?: string;
  /** Optional userId for logging (can be null for non-registered numbers) */
  userId?: string | null;
}

interface SMSResult {
  success: boolean;
  error?: string;
  raw?: unknown;
}

export async function sendSMS(opts: SendSMSOptions): Promise<SMSResult> {
  const apiToken = process.env.SDASMS_API_TOKEN;
  if (!apiToken) {
    console.warn('[SMS] SDASMS_API_TOKEN not set — skipping SMS send');
    return { success: false, error: 'SDASMS_API_TOKEN not configured' };
  }

  const senderId = (opts.senderId || process.env.SDASMS_SENDER_ID || '').slice(0, 11);
  if (!senderId) {
    console.warn('[SMS] SDASMS_SENDER_ID not set — skipping SMS send');
    return { success: false, error: 'SDASMS_SENDER_ID not configured' };
  }
  const recipient = Array.isArray(opts.to) ? opts.to.join(',') : opts.to;

  // Log each recipient separately in DB
  const phones = recipient.split(',').map(p => p.trim()).filter(Boolean);
  const logIds: string[] = [];

  for (const phone of phones) {
    try {
      const log = await prisma.sMSLog.create({
        data: {
          userId: opts.userId ?? null,
          phone,
          message: opts.message,
          provider: 'sdasms',
          status: 'pending',
        },
      });
      logIds.push(log.id);
    } catch (e) {
      console.error('[SMS] DB log error:', e);
    }
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        api_token: apiToken,
        recipient,
        sender_id: senderId,
        type: 'plain',
        message: opts.message,
      }),
    });

    const data = await res.json() as { status: string; message?: string };

    const newStatus = data.status === 'success' ? 'sent' : 'failed';

    // Update all DB logs
    for (const id of logIds) {
      await prisma.sMSLog.update({
        where: { id },
        data: { status: newStatus, ...(newStatus === 'sent' ? { sentAt: new Date() } : {}) },
      }).catch(() => {});
    }

    if (data.status === 'success') {
      return { success: true, raw: data };
    } else {
      console.error('[SMS] SDASMS API error:', data.message);
      return { success: false, error: data.message, raw: data };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SMS] Network error:', msg);
    for (const id of logIds) {
      await prisma.sMSLog.update({ where: { id }, data: { status: 'failed' } }).catch(() => {});
    }
    return { success: false, error: msg };
  }
}

// ─── Typed Message Templates ────────────────────────────────────────────────

/** Sent when a user generates a new coupon */
export function smsCouponGenerated(hotelName: string, code: string, discountPct: number, expiresAt: Date): string {
  const exp = expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `BusyBeds: Your ${discountPct}% coupon for ${hotelName} is ready! Code: ${code}. Expires: ${exp}. Show at reception.`;
}

/** Sent when a subscription is activated */
export function smsSubscriptionActivated(packageName: string, expiresAt: Date): string {
  const exp = expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `BusyBeds: Your ${packageName} subscription is now active until ${exp}. Start generating hotel discount coupons at busybeds.com`;
}

/** Sent 2 days before a coupon expires */
export function smsCouponExpiringSoon(hotelName: string, code: string, discountPct: number, expiresAt: Date): string {
  const exp = expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  return `BusyBeds: Reminder! Your ${discountPct}% coupon for ${hotelName} (${code}) expires ${exp}. Use it before it's gone!`;
}

/** Sent 3 days before a subscription expires */
export function smsSubscriptionExpiringSoon(packageName: string, daysLeft: number): string {
  return `BusyBeds: Your ${packageName} subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew at busybeds.com to keep your discounts.`;
}

/** Generic admin broadcast */
export function smsBroadcast(message: string): string {
  return `BusyBeds: ${message}`;
}
