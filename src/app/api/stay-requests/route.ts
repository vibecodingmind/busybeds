export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const createSchema = z.object({
  hotelId: z.string(),
  roomTypeId: z.string(),
  checkIn: z.string(), // ISO date string
  checkOut: z.string(),
  guests: z.number().int().min(1).max(20),
  travelerNotes: z.string().max(500).optional(),
});

/** GET /api/stay-requests — list current user's stay requests */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await prisma.stayRequest.findMany({
    where: { travelerId: session.userId },
    include: {
      hotel: { select: { id: true, name: true, slug: true, coverImage: true, city: true, country: true } },
      roomType: { select: { id: true, name: true, pricePerNight: true } },
      coupon: { select: { id: true, code: true, status: true, qrDataUrl: true, expiresAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
}

/** POST /api/stay-requests — create a new stay request (all active subscribers) */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse body
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request data', details: parsed.error.errors }, { status: 400 });
    }
    const { hotelId, roomTypeId, checkIn, checkOut, guests, travelerNotes } = parsed.data;

    // Check active subscription (any tier)
    const now = new Date();
    const sub = await prisma.subscription.findFirst({
      where: { userId: session.userId, status: 'active', expiresAt: { gt: now } },
      include: { package: true },
      orderBy: { expiresAt: 'desc' },
    });

    if (!sub) {
      return NextResponse.json({ error: 'An active subscription is required for Stay Requests.' }, { status: 403 });
    }

    // Validate hotel is an active partner
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, name: true, status: true, partnershipStatus: true, discountPercent: true },
    });
    if (!hotel || hotel.status !== 'active') {
      return NextResponse.json({ error: 'Hotel not found.' }, { status: 404 });
    }
    if ((hotel as any).partnershipStatus !== 'ACTIVE') {
      return NextResponse.json({ error: 'This hotel is not accepting Stay Requests.' }, { status: 400 });
    }

    // Validate room type belongs to this hotel
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId },
    });
    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found for this hotel.' }, { status: 404 });
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid dates provided.' }, { status: 400 });
    }
    if (checkInDate < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past.' }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 400 });
    }

    const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      return NextResponse.json({ error: 'Minimum stay is 1 night.' }, { status: 400 });
    }

    // Check no duplicate pending/approved request for same hotel+dates
    const existing = await prisma.stayRequest.findFirst({
      where: {
        travelerId: session.userId,
        hotelId,
        status: { in: ['pending_approval', 'approved', 'pending_payment', 'paid', 'confirmed'] },
        checkIn: checkInDate,
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'You already have an active Stay Request for this hotel and check-in date.' }, { status: 409 });
    }

    // Get platform fee from site settings
    const feeRow = await prisma.siteSettings.findUnique({ where: { key: 'stay_request_platform_fee_percent' } });
    const platformFeePercent = feeRow ? parseFloat(feeRow.value) : 5;

    // Calculate pricing
    const roomPricePerNight = Number(roomType.pricePerNight);
    const totalStayCost = roomPricePerNight * nights;
    const depositAmount = Math.round(totalStayCost * 0.25 * 100) / 100;
    const platformFeeAmount = Math.round(depositAmount * (platformFeePercent / 100) * 100) / 100;
    const hotelReceives = Math.round((depositAmount - platformFeeAmount) * 100) / 100;

    // Approval deadline = 48 hours from now
    const approvalDeadline = new Date();
    approvalDeadline.setHours(approvalDeadline.getHours() + 48);

    const stayRequest = await prisma.stayRequest.create({
      data: {
        travelerId: session.userId,
        hotelId,
        roomTypeId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        guests,
        roomPricePerNight,
        totalStayCost,
        depositAmount,
        platformFeeAmount,
        hotelReceives,
        discountPercent: hotel.discountPercent,
        status: 'pending_approval',
        approvalDeadline,
        travelerNotes: travelerNotes || null,
      },
      include: {
        hotel: { select: { name: true, city: true, country: true } },
        roomType: { select: { name: true } },
      },
    });

    // Notify hotel manager
    try {
      const manager = await prisma.hotelManager.findFirst({ where: { hotelId, isActive: true } });
      if (manager) {
        await prisma.notification.create({
          data: {
            userId: manager.userId,
            title: 'New Stay Request',
            message: `A traveler has requested a stay at ${hotel.name} (${nights} nights, check-in ${checkInDate.toLocaleDateString()}). Please review within 48 hours.`,
            type: 'stay_request',
            link: '/portal/stay-requests',
          },
        });
      }
      // Also notify hotel owner
      const owner = await prisma.hotelOwner.findFirst({ where: { hotelId } });
      if (owner && owner.userId !== manager?.userId) {
        await prisma.notification.create({
          data: {
            userId: owner.userId,
            title: 'New Stay Request',
            message: `A traveler has requested a stay at ${hotel.name} (${nights} nights, check-in ${checkInDate.toLocaleDateString()}). Please review within 48 hours.`,
            type: 'stay_request',
            link: '/portal/stay-requests',
          },
        });
      }
    } catch (e) { console.error('Notification error:', e); }

    return NextResponse.json({ stayRequest }, { status: 201 });

  } catch (err) {
    console.error('[StayRequest POST Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
