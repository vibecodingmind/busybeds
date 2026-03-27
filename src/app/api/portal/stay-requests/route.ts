export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/** GET /api/portal/stay-requests — hotel manager views stay requests for their hotel */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Find the hotel this user manages
    const manager = await prisma.hotelManager.findFirst({
      where: { userId: session.userId, isActive: true },
    });
    const owner = await prisma.hotelOwner.findFirst({
      where: { userId: session.userId },
    });

    const hotelId = manager?.hotelId || owner?.hotelId;
    if (!hotelId) {
      return NextResponse.json({ error: 'No hotel associated with this account.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = { hotelId };
    if (status) where.status = status;

    const requests = await prisma.stayRequest.findMany({
      where,
      include: {
        roomType: { select: { name: true, pricePerNight: true } },
        traveler: { select: { id: true, fullName: true, email: true, phone: true } },
        coupon: { select: { id: true, code: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ requests, hotelId });

  } catch (err) {
    console.error('[Portal StayRequests GET Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
