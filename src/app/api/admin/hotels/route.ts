export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const hotels = await prisma.hotel.findMany({
    include: { owner: { include: { user: { select: { fullName: true, email: true } } } }, _count: { select: { coupons: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ hotels });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, city, country, starRating = 3, discountPercent = 15, status = 'active', isFeatured = false, coverImage, category = 'Hotel', descriptionShort = '', descriptionLong = '' } = body;
  if (!name || !city || !country) return NextResponse.json({ error: 'name, city, country required' }, { status: 400 });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const hotel = await prisma.hotel.create({
    data: { name, slug, city, country, starRating: Number(starRating), discountPercent: Number(discountPercent), status, isFeatured, coverImage: coverImage || null, category, descriptionShort, descriptionLong },
    include: { _count: { select: { coupons: true, roomTypes: true } } },
  });
  return NextResponse.json({ hotel }, { status: 201 });
}
