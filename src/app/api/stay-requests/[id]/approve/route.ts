export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/** POST /api/stay-requests/[id]/approve — hotel manager approves a stay request */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    // Find the stay request
    const stayRequest = await prisma.stayRequest.findUnique({
      where: { id },
      include: {
        hotel: { select: { id: true, name: true } },
        traveler: { select: { id: true, email: true, fullName: true } },
        roomType: { select: { name: true } },
      },
    });
    if (!stayRequest) return NextResponse.json({ error: 'Stay request not found.' }, { status: 404 });

    // Verify the user is a manager or owner of this hotel
    const isManager = await prisma.hotelManager.findFirst({
      where: { userId: session.userId, hotelId: stayRequest.hotelId, isActive: true },
    });
    const isOwner = await prisma.hotelOwner.findFirst({
      where: { userId: session.userId, hotelId: stayRequest.hotelId },
    });
    const isAdmin = (session as any).role === 'admin';

    if (!isManager && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. You are not authorized to manage this hotel.' }, { status: 403 });
    }

    if (stayRequest.status !== 'pending_approval') {
      return NextResponse.json({ error: `Cannot approve a request with status: ${stayRequest.status}` }, { status: 400 });
    }

    // Approve
    const updated = await prisma.stayRequest.update({
      where: { id },
      data: {
        status: 'pending_payment',
        approvedAt: new Date(),
        managerId: session.userId,
      },
    });

    // Notify the traveler
    try {
      await prisma.notification.create({
        data: {
          userId: stayRequest.travelerId,
          title: 'Stay Request Approved!',
          message: `Your stay request at ${stayRequest.hotel.name} (${stayRequest.nights} nights, ${stayRequest.roomType.name}) has been approved. Please complete your deposit payment to confirm your booking.`,
          type: 'stay_request',
          link: '/my-stay-requests',
        },
      });
    } catch (e) { console.error('Notification error:', e); }

    return NextResponse.json({ stayRequest: updated });

  } catch (err) {
    console.error('[StayRequest Approve Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
