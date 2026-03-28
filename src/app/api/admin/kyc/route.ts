export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// POST /api/admin/kyc — approve or reject a hotel owner KYC application
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId, action, rejectionReason } = await req.json();

  if (!applicationId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Find the HotelOwner application with user + hotel info
  const application = await prisma.hotelOwner.findUnique({
    where: { id: applicationId },
    include: {
      user:  { select: { id: true, email: true, fullName: true } },
      hotel: { select: { id: true, name: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  if (application.kycStatus !== 'pending') {
    return NextResponse.json({ error: 'Application already reviewed' }, { status: 400 });
  }

  const now = new Date();

  if (action === 'approve') {
    // 1. Update KYC status to approved
    await prisma.hotelOwner.update({
      where: { id: applicationId },
      data: {
        kycStatus:    'approved',
        kycReviewedAt: now,
        kycRejectionReason: null,
      },
    });

    // 2. Update the user's role to hotel_owner if not already
    await prisma.user.update({
      where: { id: application.userId },
      data: { role: 'hotel_owner' },
    });

    // 3. Send approval email
    await sendKycEmail({
      to:       application.user.email,
      name:     application.user.fullName,
      hotelName: application.hotel.name,
      approved: true,
    });

    return NextResponse.json({ ok: true, status: 'approved' });
  }

  // action === 'reject'
  await prisma.hotelOwner.update({
    where: { id: applicationId },
    data: {
      kycStatus:         'rejected',
      kycReviewedAt:     now,
      kycRejectionReason: rejectionReason || null,
    },
  });

  // Send rejection email
  await sendKycEmail({
    to:       application.user.email,
    name:     application.user.fullName,
    hotelName: application.hotel.name,
    approved: false,
    reason:   rejectionReason,
  });

  return NextResponse.json({ ok: true, status: 'rejected' });
}

// ── Email helper ────────────────────────────────────────────────────────────
async function sendKycEmail({
  to, name, hotelName, approved, reason,
}: {
  to: string; name: string; hotelName: string; approved: boolean; reason?: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL    = process.env.EMAIL_FROM || 'BusyBeds <no-reply@busybeds.com>';
  if (!RESEND_API_KEY) return;

  const subject = approved
    ? `✅ Your BusyBeds hotel claim has been approved — ${hotelName}`
    : `❌ Your BusyBeds hotel claim was not approved — ${hotelName}`;

  const html = approved
    ? `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#111;margin-bottom:8px;">Congratulations, ${name}! 🎉</h2>
        <p style="color:#444;line-height:1.6;">Your claim for <strong>${hotelName}</strong> has been <strong style="color:#16a34a;">approved</strong>.</p>
        <p style="color:#444;line-height:1.6;">You can now log in to your Owner Dashboard to manage your hotel listing, update details, and monitor your discount coupons.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com'}/owner"
           style="display:inline-block;margin-top:16px;padding:12px 28px;background:#E8395A;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">
          Go to Owner Dashboard
        </a>
        <p style="margin-top:28px;color:#888;font-size:13px;">If you have any questions, reply to this email or contact support@busybeds.com</p>
      </div>`
    : `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#111;margin-bottom:8px;">Application Update</h2>
        <p style="color:#444;line-height:1.6;">Hi ${name},</p>
        <p style="color:#444;line-height:1.6;">We reviewed your claim for <strong>${hotelName}</strong> and were unable to approve it at this time.</p>
        ${reason ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:6px;color:#b91c1c;margin:16px 0;">${reason}</div>` : ''}
        <p style="color:#444;line-height:1.6;">If you believe this is an error or have additional information, please contact us at <a href="mailto:support@busybeds.com">support@busybeds.com</a> and we will be happy to reconsider.</p>
        <p style="margin-top:28px;color:#888;font-size:13px;">BusyBeds Team</p>
      </div>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
  } catch {
    // Non-fatal — don't block the approval if email fails
  }
}
