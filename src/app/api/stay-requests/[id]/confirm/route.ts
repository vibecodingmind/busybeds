export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/** POST /api/stay-requests/[id]/confirm — hotel staff confirms check-in (triggers deposit release) */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    const stayRequest = await prisma.stayRequest.findUnique({
      where: { id },
      include: { hotel: { select: { name: true } } },
    });
    if (!stayRequest) return NextResponse.json({ error: 'Stay request not found.' }, { status: 404 });

    const isManager = await prisma.hotelManager.findFirst({
      where: { userId: session.userId, hotelId: stayRequest.hotelId, isActive: true },
    });
    const isOwner = await prisma.hotelOwner.findFirst({
      where: { userId: session.userId, hotelId: stayRequest.hotelId },
    });
    const isAdmin = (session as any).role === 'admin';

    if (!isManager && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (stayRequest.status !== 'paid') {
      return NextResponse.json({ error: `Cannot confirm check-in for status: ${stayRequest.status}` }, { status: 400 });
    }

    const now = new Date();

    // Confirm check-in
    await prisma.stayRequest.update({
      where: { id },
      data: { status: 'confirmed', confirmedAt: now },
    });

    // Release deposit to hotel
    await prisma.depositTransaction.updateMany({
      where: { stayRequestId: id },
      data: { status: 'released_to_hotel', releasedAt: now },
    });

    // Notify traveler
    try {
      await prisma.notification.create({
        data: {
          userId: stayRequest.travelerId,
          title: 'Check-in Confirmed',
          message: `Your check-in at ${stayRequest.hotel.name} has been confirmed. Enjoy your stay!`,
          type: 'stay_request',
          link: '/my-stay-requests',
        },
      });
    } catch (e) { console.error('Notification error:', e); }

    return NextResponse.json({
      ok: true,
      message: `Check-in confirmed. Deposit of $${stayRequest.hotelReceives.toFixed(2)} released to hotel.`,
    });

  } catch (err) {
    console.error('[StayRequest Confirm Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
