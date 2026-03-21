export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

async function getStaffHotelId(session: { userId: string; role: string }) {
  if (session.role === 'hotel_owner') {
    const o = await prisma.hotelOwner.findUnique({ where: { userId: session.userId } });
    return o?.kycStatus === 'approved' ? o.hotelId : null;
  }
  if (session.role === 'hotel_manager') {
    const m = await prisma.hotelManager.findFirst({ where: { userId: session.userId, isActive: true } });
    return m?.hotelId ?? null;
  }
  return null;
}

const flashSchema = z.object({
  discountPercent: z.number().int().min(1).max(80),
  endsAt: z.string(), // ISO date string
  label: z.string().max(40).optional(), // e.g. "Flash Sale", "Weekend Deal"
});

// POST — start a flash sale (boost discount temporarily)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getStaffHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data = flashSchema.parse(body);

  const endsAt = new Date(data.endsAt);
  if (endsAt <= new Date()) return NextResponse.json({ error: 'End date must be in the future' }, { status: 400 });

  // Store flash sale as a promo banner + temporarily bump discount
  // We track it by saving flashSaleEndsAt and flashSaleDiscount on the hotel
  // using the existing promoBanner table for display
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { discountPercent: true } });
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  await prisma.hotel.update({
    where: { id: hotelId },
    data: { discountPercent: data.discountPercent },
  });

  // Also create a promo banner for sitewide visibility
  const banner = await (prisma as any).promoBanner?.create?.({
    data: {
      message: `🔥 Flash Sale: ${data.discountPercent}% OFF at participating hotels${data.label ? ` – ${data.label}` : ''}!`,
      linkUrl: '/',
      linkText: 'Grab it now',
      bgColor: '#E8395A',
      textColor: '#FFFFFF',
      isActive: true,
      endsAt,
    },
  }).catch(() => null);

  return NextResponse.json({ ok: true, newDiscount: data.discountPercent, endsAt, bannerId: banner?.id });
}

// DELETE — end the flash sale
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const hotelId = await getStaffHotelId(session);
  if (!hotelId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { originalDiscount, bannerId } = await req.json();
  await prisma.hotel.update({
    where: { id: hotelId },
    data: { discountPercent: originalDiscount || 15 },
  });

  // Deactivate banner if provided
  if (bannerId) {
    await (prisma as any).promoBanner?.update?.({
      where: { id: bannerId },
      data: { isActive: false },
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
