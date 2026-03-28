export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// POST /api/admin/test-email  { "to": "you@example.com" }
// Sends a test email to verify Resend is configured correctly.
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { to } = await req.json();
  if (!to) return NextResponse.json({ error: '"to" email is required' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';
  const hasKey = !!process.env.RESEND_API_KEY;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #F2F4F7; margin: 0; padding: 0; }
  .wrap { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg,#E8395A,#c0284a); padding: 28px 32px; color: #fff; }
  .header h1 { margin: 0; font-size: 20px; }
  .body { padding: 32px; color: #1D2939; line-height: 1.6; }
  .badge { display:inline-block; background:#d1fae5; color:#065f46; font-weight:bold; padding:6px 14px; border-radius:20px; font-size:13px; margin-bottom:16px; }
  .footer { padding: 16px 32px; font-size: 12px; color: #888; border-top: 1px solid #eee; text-align: center; }
</style></head>
<body><div class="wrap">
  <div class="header"><h1>🏨 BusyBeds — Test Email</h1></div>
  <div class="body">
    <div class="badge">✅ Email delivery is working!</div>
    <p>This is a test email sent from your BusyBeds admin panel.</p>
    <p style="font-size:13px;color:#666">
      Sent at: <strong>${new Date().toUTCString()}</strong><br/>
      Provider: <strong>Resend</strong><br/>
      App URL: <strong>${appUrl}</strong>
    </p>
    <p style="font-size:13px;color:#888">If you received this, your Resend integration is configured correctly. 🎉</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} BusyBeds</div>
</div></body></html>`;

  if (!hasKey) {
    // Log to console in dev mode
    console.log(`\n📧 TEST EMAIL → ${to} (dev mode — no RESEND_API_KEY set)\n`);
    return NextResponse.json({
      success: true,
      mode: 'dev',
      message: 'No RESEND_API_KEY set — email logged to console. Set RESEND_API_KEY in your environment to send real emails.',
      to,
    });
  }

  try {
    await sendEmail({ to, subject: '✅ BusyBeds — Test Email', html });
    return NextResponse.json({ success: true, mode: 'live', message: `Test email sent to ${to}`, to });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
