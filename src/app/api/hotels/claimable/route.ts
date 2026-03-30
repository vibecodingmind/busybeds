import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Returns hotels that can be claimed (no active/pending owner)
// Used by the register page Step 4 "Find Your Hotel"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (q.length < 2) return NextResponse.json({ hotels: [] });

  try {
    const hotels = await prisma.hotel.findMany({
      where: {
        status: 'active',
        OR: [
          { name:    { contains: q, mode: 'insensitive' } },
          { city:    { contains: q, mode: 'insensitive' } },
          { country: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id:         true,
        name:       true,
        city:       true,
        country:    true,
        starRating: true,
        category:   true,
        coverImage: true,
        owner: {
          select: { kycStatus: true },
        },
      },
      orderBy: [{ adminFeatured: 'desc' }, { avgRating: 'desc' }],
      take: 10,
    });

    // Filter out already claimed hotels (pending or approved)
    const claimable = hotels.filter(h =>
      !h.owner || h.owner.kycStatus === 'rejected'
    );

    return NextResponse.json({ hotels: claimable });
  } catch {
    return NextResponse.json({ hotels: [] });
  }
}
