export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  hotelId:     z.string(),
  email:       z.string().email(),
  minDiscount: z.number().int().min(0).max(99).optional().default(0),
});

// ── POST — subscribe to price alert ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();
    const { hotelId, email, minDiscount } = schema.parse(body);

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { id: true, name: true } });
    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

    await (prisma as any).priceAlert.upsert({
      where: { hotelId_email: { hotelId, email } },
      update: {
        minDiscount,
        isActive: true,
        userId: session?.userId || undefined,
        updatedAt: new Date(),
      },
      create: {
        hotelId,
        email,
        minDiscount,
        isActive: true,
        userId: session?.userId || undefined,
      },
    });

    return NextResponse.json({ ok: true, hotelName: hotel.name });
  } catch (e: any) {
    console.error('[Price Alerts POST]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

// ── GET — list user's price alerts ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = await (prisma as any).priceAlert.findMany({
    where: { userId: session.userId, isActive: true },
    include: {
      hotel: { select: { id: true, name: true, slug: true, city: true, country: true, discountPercent: true, coverImage: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ alerts });
}

// ── DELETE — unsubscribe from alert ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const alertId = searchParams.get('id');
  const hotelId = searchParams.get('hotelId');

  if (alertId) {
    await (prisma as any).priceAlert.updateMany({
      where: { id: alertId, userId: session.userId },
      data: { isActive: false },
    });
  } else if (hotelId) {
    await (prisma as any).priceAlert.updateMany({
      where: { hotelId, userId: session.userId },
      data: { isActive: false },
    });
  } else {
    return NextResponse.json({ error: 'Missing id or hotelId' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
