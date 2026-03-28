export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// POST — invite a member by email (admin only)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Must be corporate admin
  const corporate = await prisma.corporateAccount.findUnique({
    where: { adminUserId: session.userId },
    include: { members: true },
  });
  if (!corporate) {
    return NextResponse.json({ error: 'Not a corporate admin' }, { status: 403 });
  }
  if (corporate.status !== 'active') {
    return NextResponse.json({ error: 'Corporate account is not active yet' }, { status: 403 });
  }

  const body = await req.json();
  const { email } = z.object({ email: z.string().email() }).parse(body);

  // Check seat limit
  if (corporate.members.length >= corporate.maxSeats) {
    return NextResponse.json({ error: `Seat limit reached (${corporate.maxSeats} seats)`, code: 'SEAT_LIMIT' }, { status: 429 });
  }

  // Find or note user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Send invite email to non-registered email
    try {
      await sendEmail({
        to: email,
        subject: `You've been invited to join ${corporate.companyName} on BusyBeds`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
            <h2 style="color:#1A3C5E;">You're Invited! 🎉</h2>
            <p>Your company <strong>${corporate.companyName}</strong> has set up a corporate BusyBeds account.</p>
            <p>Sign up at <a href="${process.env.NEXT_PUBLIC_APP_URL}/register?corp=${corporate.id}">BusyBeds</a> with this email address to get access to exclusive hotel discounts.</p>
            <p style="color:#888;font-size:12px;">— The BusyBeds Team</p>
          </div>
        `,
      });
    } catch (e) { console.error('[Corporate invite] Email error:', e); }
    return NextResponse.json({ invited: true, registered: false });
  }

  // Check not already in a corporate account
  if (user.corporateAccountId) {
    return NextResponse.json({ error: 'User already belongs to a corporate account' }, { status: 409 });
  }

  // Add them
  await prisma.user.update({
    where: { id: user.id },
    data: { corporateAccountId: corporate.id },
  });

  // Send welcome email
  try {
    await sendEmail({
      to: email,
      subject: `You've been added to ${corporate.companyName} on BusyBeds`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#1A3C5E;">Welcome to the Team! 🎉</h2>
          <p>Hi ${user.fullName},</p>
          <p>You've been added to the <strong>${corporate.companyName}</strong> corporate account on BusyBeds.</p>
          <p>You now have access to exclusive hotel discounts covered by your company subscription. <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Visit your dashboard</a> to start generating coupons.</p>
          <p style="color:#888;font-size:12px;">— The BusyBeds Team</p>
        </div>
      `,
    });
  } catch (e) { console.error('[Corporate invite] Email error:', e); }

  return NextResponse.json({ invited: true, registered: true, userId: user.id });
}

// DELETE — remove a member (admin only)
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const corporate = await prisma.corporateAccount.findUnique({
    where: { adminUserId: session.userId },
  });
  if (!corporate) return NextResponse.json({ error: 'Not a corporate admin' }, { status: 403 });

  const { userId } = await req.json();
  if (!userId || userId === session.userId) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId, corporateAccountId: corporate.id },
    data: { corporateAccountId: null },
  });

  return NextResponse.json({ removed: true });
}
