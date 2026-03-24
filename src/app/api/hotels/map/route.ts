export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || '';
  const minDiscount = searchParams.get('minDiscount') || '';
  const search = searchParams.get('search') || '';

  try {
    const where: any = {
      status: 'active',
      latitude: { not: null },
      longitude: { not: null },
    };

    if (category && category !== 'all') where.category = category;
    if (minDiscount) where.discountPercent = { gte: parseInt(minDiscount) };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
    ];

    const hotels = await prisma.hotel.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        discountPercent: true,
        starRating: true,
        avgRating: true,
        coverImage: true,
        category: true,
        roomTypes: { select: { pricePerNight: true }, take: 1 },
      },
      take: 500,
    });

    return NextResponse.json({ hotels });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
