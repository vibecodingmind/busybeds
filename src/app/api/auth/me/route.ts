export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, signToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, avatar: true },
  });
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}

const updateSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  email:    z.string().email().optional(),
  avatar:   z.string().url().nullable().optional().or(z.literal('')),
});

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 422 });

  const { fullName, email, avatar } = parsed.data;

  if (email && email !== session.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(fullName             ? { fullName }              : {}),
      ...(email                ? { email }                 : {}),
      ...(avatar !== undefined ? { avatar: avatar || null }: {}),
    },
    select: { id: true, email: true, fullName: true, role: true, avatar: true },
  });

  const newToken = await signToken({
    userId: updated.id, email: updated.email, role: updated.role, fullName: updated.fullName,
  });

  const res = NextResponse.json({ user: updated });
  res.cookies.set('bb_token', newToken, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('bb_token', '', { maxAge: 0, path: '/' });
  return res;
}
