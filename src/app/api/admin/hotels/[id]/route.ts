export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const allowed = ['name', 'city', 'country', 'starRating', 'discountPercent', 'status', 'isFeatured', 'coverImage', 'category', 'descriptionShort', 'descriptionLong', 'websiteUrl', 'email', 'whatsapp', 'address'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) data[key] = body[key]; }
  const hotel = await prisma.hotel.update({ where: { id: params.id }, data, include: { _count: { select: { coupons: true, roomTypes: true } } } });
  return NextResponse.json({ hotel });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.hotel.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
