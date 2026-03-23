export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getOwnerHotel(userId: string) {
  const owner = await prisma.hotelOwner.findUnique({
    where: { userId },
    select: { hotelId: true, kycStatus: true },
  });
  return owner;
}

// GET /api/owner/hotel  — get owner's hotel details
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owner = await getOwnerHotel(session.userId);
  if (!owner) return NextResponse.json({ error: 'No hotel found' }, { status: 404 });

  const hotel = await prisma.hotel.findUnique({
    where: { id: owner.hotelId },
    include: { roomTypes: true, photos: true, affiliateLinks: true },
  });

  return NextResponse.json({ hotel, kycStatus: owner.kycStatus });
}

// PATCH /api/owner/hotel  — update allowed fields
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owner = await getOwnerHotel(session.userId);
  if (!owner) return NextResponse.json({ error: 'No hotel found' }, { status: 404 });
  if (owner.kycStatus !== 'approved') {
    return NextResponse.json({ error: 'Hotel not yet approved. You can edit after KYC approval.' }, { status: 403 });
  }

  const body = await req.json();

  // Only allow safe fields — no status, slug, featured
  const ALLOWED = [
    'descriptionShort', 'descriptionLong', 'address',
    'email', 'whatsapp', 'websiteUrl',
    'socialFacebook', 'socialInstagram', 'socialTwitter', 'socialTiktok',
    'coverImage',
  ];
  const data: Record<string, any> = {};
  for (const key of ALLOWED) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  const hotel = await prisma.hotel.update({
    where: { id: owner.hotelId },
    data,
  });

  return NextResponse.json({ hotel });
}
