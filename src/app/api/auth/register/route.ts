export const dynamic = 'force-dynamic';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { sendEmail, emailWelcome, emailVerifyEmail } from '@/lib/email';
import crypto from 'crypto';

const schema = z.object({
  fullName: z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(['traveler', 'hotel_owner']).default('traveler'),
  hotelId:  z.string().optional(),   // provided when role = hotel_owner
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(`register:${getIp(req)}`, { limit: 5, windowSec: 3600 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    // If hotel_owner, validate hotel exists and is not already claimed
    if (data.role === 'hotel_owner' && data.hotelId) {
      const hotel = await prisma.hotel.findUnique({ where: { id: data.hotelId }, select: { id: true } });
      if (!hotel) return NextResponse.json({ error: 'Selected hotel not found' }, { status: 404 });

      const existingClaim = await prisma.hotelOwner.findUnique({
        where: { hotelId: data.hotelId },
        select: { kycStatus: true },
      });
      // Allow if no claim exists, or if previous claim was rejected
      if (existingClaim && existingClaim.kycStatus !== 'rejected') {
        return NextResponse.json(
          { error: 'This hotel already has a pending or active claim. Contact support if you believe this is an error.' },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, fullName: data.fullName, role: data.role },
    });

    // Create HotelOwner claim if hotel_owner + hotelId
    if (data.role === 'hotel_owner' && data.hotelId) {
      // Delete any rejected claim first to avoid userId unique conflict on upsert
      await prisma.hotelOwner.deleteMany({
        where: { hotelId: data.hotelId, kycStatus: 'rejected' },
      });
      await prisma.hotelOwner.create({
        data: {
          userId:         user.id,
          hotelId:        data.hotelId,
          kycStatus:      'pending',
          kycSubmittedAt: new Date(),
        },
      });
    }

    // Email verification
    const emailVerifyToken  = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data:  { emailVerifyToken, emailVerifyExpiry },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${emailVerifyToken}`;

    sendEmail({ to: user.email, subject: 'Welcome to Busy Beds! 🏨', html: emailWelcome(user.fullName) })
      .catch(e => console.error('Email error:', e));

    sendEmail({ to: user.email, subject: 'Verify your email address', html: emailVerifyEmail(user.fullName, verifyUrl) })
      .catch(e => console.error('Verification email error:', e));

    const token = await signToken({
      userId: user.id, email: user.email, role: user.role, fullName: user.fullName,
    });

    const res = NextResponse.json(
      { user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } },
      { status: 201 }
    );
    res.cookies.set('bb_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    const message = err instanceof Error ? err.message : String(err);
    console.error('[register] Server error:', message, err);
    return NextResponse.json({ error: message || 'Server error' }, { status: 500 });
  }
}
