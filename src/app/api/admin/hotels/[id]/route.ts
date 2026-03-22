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
  // Coordinates — accept null to clear, or float to set
  if ('latitude'  in body) data.latitude  = body.latitude  != null ? Number(body.latitude)  : null;
  if ('longitude' in body) data.longitude = body.longitude != null ? Number(body.longitude) : null;
  if ('vibeTags' in body) data.vibeTags = JSON.stringify(body.vibeTags);
  if ('discountRules' in body) data.discountRules = JSON.stringify(body.discountRules);
  const hotel = await prisma.hotel.update({ where: { id: params.id }, data, include: { _count: { select: { coupons: true, roomTypes: true } } } });
  return NextResponse.json({ hotel });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.hotel.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
