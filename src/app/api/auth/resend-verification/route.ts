export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail, emailVerifyEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, fullName: true, email: true, emailVerified: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ message: 'Already verified' });

  // Generate a fresh token
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: token, emailVerifyExpiry: expiry },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your BusyBeds email address',
      html: emailVerifyEmail(user.fullName, verifyUrl),
    });
  } catch (e) {
    console.error('Failed to send verification email:', e);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Verification email sent' });
}
