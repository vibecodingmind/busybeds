export const dynamic = 'force-dynamic';
import { rateLimit, getIp } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // 10 attempts per IP per 15 minutes
  const rl = rateLimit(`login:${getIp(req)}`, { limit: 10, windowSec: 900 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    if (user.suspendedAt) return NextResponse.json({ error: 'Account suspended' }, { status: 403 });

    const valid = await compare(data.password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = await signToken({
      userId: user.id, email: user.email, role: user.role, fullName: user.fullName,
    });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    });
    res.cookies.set('bb_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error('[LOGIN ERROR]', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}