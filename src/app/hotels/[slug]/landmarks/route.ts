export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Find hotel by slug
    const hotel = await prisma.hotel.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Fetch landmarks for this hotel
    const landmarks = await prisma.landmark.findMany({
      where: { hotelId: hotel.id },
      orderBy: [
        { distanceKm: 'asc' },
        { totalRatings: 'desc' },
      ],
    });

    return NextResponse.json({ landmarks });
  } catch (error) {
    console.error('[Landmarks API Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch landmarks' },
      { status: 500 }
    );
  }
}
