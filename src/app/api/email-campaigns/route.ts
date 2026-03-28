export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// ── Audience targeting ─────────────────────────────────────────
async function getRecipients(audience: string): Promise<{ email: string; fullName: string }[]> {
  if (audience === 'all') {
    return prisma.user.findMany({
      where: { emailVerified: true },
      select: { email: true, fullName: true },
    });
  }
  if (audience === 'subscribers') {
    const now = new Date();
    const subs = await prisma.subscription.findMany({
      where: { status: 'active', expiresAt: { gt: now } },
      include: { user: { select: { email: true, fullName: true, emailVerified: true } } },
    });
    return subs
      .filter(s => s.user.emailVerified)
      .map(s => ({ email: s.user.email, fullName: s.user.fullName }));
  }
  if (audience === 'travelers') {
    return prisma.user.findMany({
      where: { role: 'traveler', emailVerified: true },
      select: { email: true, fullName: true },
    });
  }
  if (audience === 'hotel_owners') {
    return prisma.user.findMany({
      where: { role: { in: ['hotel_owner', 'hotel_manager'] }, emailVerified: true },
      select: { email: true, fullName: true },
    });
  }
  return [];
}

// ── Build HTML email from campaign content ─────────────────────
function buildCampaignHtml(title: string, content: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';
  // Convert newlines to <br> for basic formatting
  const htmlContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #F2F4F7; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg,#E8395A,#c0284a); padding: 32px 32px 24px; color: #fff; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; opacity: .75; font-size: 13px; }
  .body { padding: 32px; color: #1D2939; line-height: 1.7; font-size: 15px; }
  .body p { margin: 0 0 16px; }
  .btn { display: inline-block; background: #E8395A; color: #fff !important; padding: 13px 30px;
         border-radius: 10px; text-decoration: none; font-weight: bold; margin: 16px 0; }
  .footer { padding: 20px 32px; font-size: 12px; color: #888; border-top: 1px solid #eee; text-align: center; }
</style></head>
<body><div class="wrap">
  <div class="header">
    <h1>🏨 BusyBeds</h1>
    <p>Hotel discounts, verified by QR</p>
  </div>
  <div class="body">
    <h2 style="margin-top:0;color:#1A3C5E">${title}</h2>
    <p>${htmlContent}</p>
    <a href="${appUrl}" class="btn">Browse Hotels →</a>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} BusyBeds · You received this because you have an account with us.<br/>
    <a href="${appUrl}/profile" style="color:#E8395A">Manage email preferences</a>
  </div>
</div></body></html>`;
}

// ── POST /api/email-campaigns — create + optionally send ───────
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, content, audience = 'all', sendNow = false } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  // Get recipient list
  const recipients = await getRecipients(audience);

  // Create campaign record
  const campaign = await prisma.emailCampaign.create({
    data: {
      title,
      content,
      recipientCount: recipients.length,
    },
  });

  if (!sendNow || recipients.length === 0) {
    return NextResponse.json({ campaign, sent: 0, skipped: !sendNow ? 'draft' : 'no_recipients' }, { status: 201 });
  }

  // Send emails in batches of 10 to avoid rate limits
  const html = buildCampaignHtml(title, content);
  let sent = 0;
  let failed = 0;
  const BATCH = 10;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (r) => {
        try {
          await sendEmail({ to: r.email, subject: title, html });
          sent++;
        } catch {
          failed++;
        }
      })
    );
    // Small delay between batches
    if (i + BATCH < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return NextResponse.json({ campaign, sent, failed, total: recipients.length }, { status: 201 });
}

// ── GET /api/email-campaigns — list campaigns ──────────────────
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { sentAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ campaigns });
}
