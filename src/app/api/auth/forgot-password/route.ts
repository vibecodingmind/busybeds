export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail, emailPasswordReset } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return 200 to prevent email enumeration
    if (user) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Update user with reset token and expiry
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiry,
        },
      });

      // Build reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

      // Send email
      await sendEmail({
        to: user.email,
        subject: 'Reset your Busy Beds password',
        html: emailPasswordReset(user.fullName, resetUrl),
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
