export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

const schema = z.object({ reason: z.string().max(500).optional() });

/** POST /api/stay-requests/[id]/decline — hotel manager declines a stay request */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const { reason } = schema.parse(body);

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

    if (!['pending_approval', 'approved'].includes(stayRequest.status)) {
      return NextResponse.json({ error: `Cannot decline a request with status: ${stayRequest.status}` }, { status: 400 });
    }

    const updated = await prisma.stayRequest.update({
      where: { id },
      data: {
        status: 'declined',
        declinedAt: new Date(),
        declineReason: reason || null,
        managerId: session.userId,
      },
    });

    // Notify traveler
    try {
      await prisma.notification.create({
        data: {
          userId: stayRequest.travelerId,
          title: 'Stay Request Declined',
          message: `Your stay request at ${stayRequest.hotel.name} was not approved${reason ? `: ${reason}` : '.'}. You can try another hotel or dates.`,
          type: 'stay_request',
          link: '/my-stay-requests',
        },
      });
    } catch (e) { console.error('Notification error:', e); }

    return NextResponse.json({ stayRequest: updated });

  } catch (err) {
    console.error('[StayRequest Decline Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
