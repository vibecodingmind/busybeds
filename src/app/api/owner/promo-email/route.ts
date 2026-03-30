export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  subject: z.string().min(5).max(100),
  message: z.string().min(30).max(600),
  audience: z.enum(['subscribers', 'travelers', 'all']),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';

function buildHtml(hotelName: string, hotelSlug: string, subject: string, message: string) {
  const hotelUrl = `${APP_URL}/hotels/${hotelSlug}`;
  const htmlMessage = message
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:system-ui,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#1A3C5E,#0E7C7B);padding:28px 32px">
    <img src="${APP_URL}/logo-light.svg" alt="BusyBeds" height="32" style="display:block;margin-bottom:12px"/>
    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0">Special offer from one of our hotel partners</p>
  </div>
  <div style="padding:28px 32px">
    <h2 style="font-size:20px;font-weight:800;color:#1a202c;margin:0 0 16px">${subject}</h2>
    <div style="font-size:15px;line-height:1.7;color:#4a5568"><p>${htmlMessage}</p></div>
    <div style="text-align:center;margin:28px 0">
      <a href="${hotelUrl}" style="display:inline-block;background:linear-gradient(135deg,#1A3C5E,#0E7C7B);color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none">
        View Deal at ${hotelName} →
      </a>
    </div>
    <p style="font-size:12px;color:#a0aec0;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px">
      This promotional email was sent via <a href="${APP_URL}" style="color:#0E7C7B">BusyBeds</a> on behalf of ${hotelName}.
      You received this because you have an active BusyBeds account.
      <a href="${APP_URL}/settings/notifications" style="color:#0E7C7B">Manage email preferences</a>.
    </p>
  </div>
</div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Must be a hotel_owner
  if (session.role !== 'hotel_owner') return NextResponse.json({ error: 'Not a hotel owner' }, { status: 403 });

  try {
    const body = await req.json();
    const { subject, message, audience } = schema.parse(body);

    // Get owner's hotel + subscription
    const hotelOwner = await prisma.hotelOwner.findUnique({
      where: { userId: session.userId },
      include: {
        hotel: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!hotelOwner?.hotel) return NextResponse.json({ error: 'No hotel found for your account' }, { status: 404 });
    if (hotelOwner.kycStatus !== 'approved') return NextResponse.json({ error: 'Your hotel must be approved before sending campaigns' }, { status: 403 });

    // Check subscription tier allows promo emails
    const sub = await prisma.hotelSubscription.findUnique({
      where: { hotelId: hotelOwner.hotel.id },
      include: { tier: { select: { promotionalEmails: true } } },
    });
    const allowed = sub?.tier?.promotionalEmails ?? 0;
    if (allowed === 0) return NextResponse.json({ error: 'Your current plan does not include promotional emails. Upgrade to Growth or Premium.' }, { status: 403 });

    const used = sub?.promoEmailsUsed ?? 0;
    if (allowed < 999 && used >= allowed) return NextResponse.json({ error: 'You have used all your promotional email slots for this month.' }, { status: 429 });

    // Get recipients
    const now = new Date();
    let recipients: { email: string; fullName: string }[] = [];

    if (audience === 'subscribers') {
      const subs = await prisma.subscription.findMany({
        where: { status: 'active', expiresAt: { gt: now } },
        include: { user: { select: { email: true, fullName: true, emailVerified: true } } },
      });
      recipients = subs.filter(s => s.user.emailVerified).map(s => ({ email: s.user.email, fullName: s.user.fullName }));
    } else if (audience === 'travelers') {
      recipients = await prisma.user.findMany({
        where: { role: 'traveler', emailVerified: true },
        select: { email: true, fullName: true },
      });
    } else {
      recipients = await prisma.user.findMany({
        where: { emailVerified: true },
        select: { email: true, fullName: true },
      });
    }

    if (recipients.length === 0) return NextResponse.json({ error: 'No eligible recipients found' }, { status: 400 });

    const hotel = hotelOwner.hotel;
    const html = buildHtml(hotel.name, hotel.slug, subject, message);

    // Send emails in batches of 50 to avoid rate limits
    const BATCH = 50;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(r => sendEmail({ to: r.email, subject: `[${hotel.name}] ${subject}`, html }))
      );
    }

    // Increment usage counter
    await prisma.hotelSubscription.update({
      where: { hotelId: hotel.id },
      data: { promoEmailsUsed: { increment: 1 } },
    });

    // Log in EmailCampaign for analytics
    await prisma.emailCampaign.create({
      data: {
        title: `[${hotel.name}] ${subject}`,
        content: message,
        recipientCount: recipients.length,
      },
    });

    return NextResponse.json({ success: true, sent: recipients.length });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message || 'Invalid input' }, { status: 400 });
    console.error('[owner/promo-email]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
