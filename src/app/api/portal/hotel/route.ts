export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// GET /api/portal/hotel — get this staff member's hotel
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let hotelId: string | null = null;

  if (session.role === 'hotel_owner') {
    const owner = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
    hotelId = owner?.hotelId ?? null;
    if (owner?.kycStatus !== 'approved') {
      return NextResponse.json({ error: 'KYC not approved', kycStatus: owner?.kycStatus }, { status: 403 });
    }
  } else if (session.role === 'hotel_manager') {
    const mgr = await prisma.hotelManager.findFirst({ where: { userId: session.userId, isActive: true } });
    hotelId = mgr?.hotelId ?? null;
  } else if (session.role === 'admin') {
    // Admin can pass hotelId as query param
    hotelId = new URL(req.url).searchParams.get('hotelId');
  }

  if (!hotelId) return NextResponse.json({ error: 'No hotel assigned' }, { status: 404 });

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      roomTypes: { orderBy: { displayOrder: 'asc' } },
      photos: { orderBy: { displayOrder: 'asc' } },
      affiliateLinks: true,
      managers: { include: { user: { select: { fullName: true, email: true } } } },
      owner: { include: { user: { select: { fullName: true, email: true } } } },
    },
  });

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  // Recent redemptions
  const redemptions = await prisma.coupon.findMany({
    where: { hotelId, status: 'redeemed' },
    include: { user: { select: { fullName: true } } },
    orderBy: { redeemedAt: 'desc' },
    take: 20,
  });

  const stats = await prisma.coupon.groupBy({
    by: ['status'],
    where: { hotelId },
    _count: true,
  });

  return NextResponse.json({
    hotel: { ...hotel, amenities: JSON.parse(hotel.amenities || '[]') },
    redemptions,
    stats,
  });
}

// PATCH /api/portal/hotel — update hotel details
const updateSchema = z.object({
  name: z.string().min(2).optional(),
  descriptionShort: z.string().optional(),
  descriptionLong: z.string().optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  discountPercent: z.number().int().min(1).max(80).optional(),
  couponValidDays: z.number().int().min(1).max(365).optional(),
  coverImage: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let hotelId: string | null = null;
  if (session.role === 'hotel_owner') {
    const owner = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
    if (owner?.kycStatus !== 'approved') return NextResponse.json({ error: 'KYC not approved' }, { status: 403 });
    hotelId = owner?.hotelId ?? null;
  } else if (session.role === 'hotel_manager') {
    const mgr = await prisma.hotelManager.findFirst({ where: { userId: session.userId, isActive: true } });
    hotelId = mgr?.hotelId ?? null;
  } else if (session.role === 'admin') {
    hotelId = (await req.json().catch(() => ({}))).hotelId ?? null;
  }

  if (!hotelId) return NextResponse.json({ error: 'No hotel assigned' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data = updateSchema.parse(body);
  const { amenities, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest };
  if (amenities) updateData.amenities = JSON.stringify(amenities);

  const hotel = await prisma.hotel.update({ where: { id: hotelId }, data: updateData as any });
  return NextResponse.json({ hotel });
}
