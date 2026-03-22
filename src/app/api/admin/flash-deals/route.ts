export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return null;
  return session;
}

// GET  /api/admin/flash-deals  — list all deals (paginated)
export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deals = await prisma.flashDeal.findMany({
    include: { hotel: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ deals });
}

// POST /api/admin/flash-deals  — create a flash deal
export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId, title, discountPercent, startsAt, endsAt } = await req.json();
  if (!hotelId || !title || !discountPercent || !startsAt || !endsAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const deal = await prisma.flashDeal.create({
    data: {
      hotelId,
      title,
      discountPercent: Number(discountPercent),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      createdBy: session.userId,
    },
    include: { hotel: { select: { name: true, slug: true } } },
  });

  return NextResponse.json({ deal });
}

// DELETE /api/admin/flash-deals?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.flashDeal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/flash-deals?id=xxx  — toggle active / update
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await req.json();
  const deal = await prisma.flashDeal.update({ where: { id }, data: body });
  return NextResponse.json({ deal });
}
