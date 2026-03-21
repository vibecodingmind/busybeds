export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotel = await prisma.hotel.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
        status: 'active',
      },
      include: {
        roomTypes: { orderBy: { displayOrder: 'asc' } },
        photos: { orderBy: { displayOrder: 'asc' } },
        affiliateLinks: { where: { isActive: true } },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const amenities = JSON.parse(hotel.amenities || '[]');
    const formattedPhotos = hotel.photos.map(p => ({ id: p.id, url: p.url }));

    return NextResponse.json({
      ...hotel,
      amenities,
      photos: formattedPhotos,
    });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return NextResponse.json({ error: 'Failed to fetch hotel' }, { status: 500 });
  }
}
