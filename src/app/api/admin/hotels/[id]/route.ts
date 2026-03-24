export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();

  const allowed = ['name', 'city', 'country', 'starRating', 'discountPercent', 'couponValidDays', 'status', 'isFeatured', 'coverImage', 'category', 'descriptionShort', 'descriptionLong', 'websiteUrl', 'email', 'whatsapp', 'address', 'partnershipStatus'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) data[key] = body[key]; }
  if ('latitude'  in body) data.latitude  = body.latitude  != null ? Number(body.latitude)  : null;
  if ('longitude' in body) data.longitude = body.longitude != null ? Number(body.longitude) : null;
  if ('vibeTags'     in body) data.vibeTags     = JSON.stringify(body.vibeTags);
  if ('discountRules' in body) data.discountRules = JSON.stringify(body.discountRules);
  if ('amenities'    in body) data.amenities    = JSON.stringify(body.amenities);

  // Auto-set featuredUntil when toggling isFeatured
  if (body.isFeatured === true) data.featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const hotel = await prisma.hotel.update({ where: { id: params.id }, data, include: { _count: { select: { coupons: true, roomTypes: true } } } });

  // Replace affiliate links if provided
  if (Array.isArray(body.affiliateLinks)) {
    await prisma.affiliateLink.deleteMany({ where: { hotelId: params.id } });
    if (body.affiliateLinks.length > 0) {
      await prisma.affiliateLink.createMany({
        data: body.affiliateLinks.map((l: { platform: string; url: string }) => ({
          hotelId: params.id,
          platform: l.platform,
          url: l.url,
          isActive: true,
        })),
      });
    }
  }

  // Replace photos if provided
  if (Array.isArray(body.photos)) {
    await prisma.hotelPhoto.deleteMany({ where: { hotelId: params.id } });
    if (body.photos.length > 0) {
      await prisma.hotelPhoto.createMany({
        data: body.photos.map((url: string, i: number) => ({
          hotelId: params.id, url, displayOrder: i,
        })),
      });
    }
  }

  return NextResponse.json({ hotel });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    // Check if hotel exists and can be deleted
    const hotel = await prisma.hotel.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, status: true },
    });
    
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    
    // Only allow deletion if hotel is inactive or rejected
    if (hotel.status !== 'inactive' && hotel.status !== 'rejected') {
      return NextResponse.json({
        error: `Cannot delete hotel with status "${hotel.status}". Set status to "inactive" first.`,
        hint: 'Use the toggle button or edit form to change status to inactive.',
      }, { status: 400 });
    }
    
    await prisma.hotel.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: `"${hotel.name}" deleted` });
  } catch (error: any) {
    console.error('[Delete Hotel Error]', error);
    return NextResponse.json({ 
      error: 'Failed to delete hotel', 
      details: error.message 
    }, { status: 500 });
  }
}
