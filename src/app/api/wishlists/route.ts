export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    include: { hotel: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ wishlist: favorites.map(f => f.hotel) });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId } = await req.json();

  const favorite = await prisma.favorite.upsert({
    where: { userId_hotelId: { userId: session.userId, hotelId } },
    create: { userId: session.userId, hotelId },
    update: {},
  });

  return NextResponse.json({ favorite }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId } = await req.json();
  await prisma.favorite.deleteMany({
    where: { userId: session.userId, hotelId },
  });

  return NextResponse.json({ ok: true });
}
