import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const users = await prisma.user.findMany({
    where: search ? { OR: [{ fullName: { contains: search } }, { email: { contains: search } }] } : {},
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, suspendedAt: true, avatar: true, _count: { select: { subscriptions: true, coupons: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ users });
}

const createSchema = z.object({
  fullName: z.string().min(2),
  email:    z.string().email(),
  role:     z.enum(['traveler', 'hotel_owner', 'hotel_manager', 'admin']).default('traveler'),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
  const { fullName, email, role, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash: hashed, role, emailVerified: true },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, suspendedAt: true, avatar: true, _count: { select: { subscriptions: true, coupons: true } } },
  });
  return NextResponse.json({ user }, { status: 201 });
}
