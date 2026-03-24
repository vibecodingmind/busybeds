import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (q.length < 2) {
    return NextResponse.json({ hotels: [], cities: [] });
  }

  try {
    const [hotelResults, cityResults] = await Promise.allSettled([
      prisma.hotel.findMany({
        where: {
          status: 'active',
          name: { contains: q, mode: 'insensitive' },
        },
        select: { name: true, slug: true, city: true, country: true },
        orderBy: [{ isFeatured: 'desc' }, { avgRating: 'desc' }],
        take: 5,
      }),
      prisma.hotel.findMany({
        where: {
          status: 'active',
          city: { contains: q, mode: 'insensitive' },
        },
        select: { city: true, country: true },
        orderBy: { avgRating: 'desc' },
        take: 20,
      }),
    ]);

    const hotels = hotelResults.status === 'fulfilled' ? hotelResults.value : [];
    const cityRows = cityResults.status === 'fulfilled' ? cityResults.value : [];

    // Deduplicate cities
    const seen = new Set<string>();
    const cities: { city: string; country: string }[] = [];
    for (const row of cityRows) {
      const key = `${row.city}|${row.country}`;
      if (!seen.has(key)) {
        seen.add(key);
        cities.push({ city: row.city, country: row.country });
        if (cities.length >= 5) break;
      }
    }

    return NextResponse.json({ hotels, cities });
  } catch {
    return NextResponse.json({ hotels: [], cities: [] });
  }
}
