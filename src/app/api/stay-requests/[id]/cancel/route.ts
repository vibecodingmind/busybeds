export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/** POST /api/stay-requests/[id]/cancel — traveler cancels (refund if >3 days before check-in) */
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

    // Only the traveler or admin can cancel
    const isAdmin = (session as any).role === 'admin';
    if (stayRequest.travelerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // Can only cancel if not already completed/cancelled/no_show
    const cancellableStatuses = ['pending_approval', 'approved', 'pending_payment', 'paid', 'confirmed'];
    if (!cancellableStatuses.includes(stayRequest.status)) {
      return NextResponse.json({ error: `Cannot cancel a request with status: ${stayRequest.status}` }, { status: 400 });
    }

    const now = new Date();
    const checkIn = new Date(stayRequest.checkIn);
    const msUntilCheckIn = checkIn.getTime() - now.getTime();
    const daysUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60 * 24);

    // Refund logic: full refund (minus 5% platform fee) if cancelled >3 days before check-in
    // Non-refundable if cancelled within 3 days
    let refundAmount = 0;
    const hasPaid = ['paid', 'confirmed'].includes(stayRequest.status);

    if (hasPaid) {
      if (daysUntilCheckIn > 3) {
        // Refund deposit minus platform fee
        refundAmount = stayRequest.hotelReceives; // traveler gets back depositAmount - platformFee
      } else {
        // Non-refundable within 3 days
        refundAmount = 0;
      }
    }

    // Update stay request
    const updated = await prisma.stayRequest.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: now,
        cancelledBy: session.userId,
        refundAmount: hasPaid ? refundAmount : null,
      },
    });

    // Update deposit transaction if it exists
    if (hasPaid) {
      try {
        await prisma.depositTransaction.updateMany({
          where: { stayRequestId: id },
          data: {
            status: refundAmount > 0 ? 'refunded' : 'captured',
            refundedAt: refundAmount > 0 ? now : undefined,
            refundAmount: refundAmount > 0 ? refundAmount : undefined,
          },
        });
      } catch (e) { console.error('Deposit update error:', e); }
    }

    // Cancel linked coupon if one was generated
    if (stayRequest.couponId) {
      try {
        await prisma.coupon.update({
          where: { id: stayRequest.couponId },
          data: { status: 'cancelled', cancelledAt: now, cancelledBy: session.userId },
        });
      } catch (e) { console.error('Coupon cancel error:', e); }
    }

    // Notify traveler
    try {
      const refundMsg = hasPaid
        ? (refundAmount > 0
          ? ` A refund of $${refundAmount.toFixed(2)} has been initiated.`
          : ' No refund is available as the cancellation was within 3 days of check-in.')
        : '';
      await prisma.notification.create({
        data: {
          userId: stayRequest.travelerId,
          title: 'Stay Request Cancelled',
          message: `Your stay request at ${stayRequest.hotel.name} has been cancelled.${refundMsg}`,
          type: 'stay_request',
          link: '/my-stay-requests',
        },
      });
    } catch (e) { console.error('Notification error:', e); }

    return NextResponse.json({
      stayRequest: updated,
      refundAmount,
      refundEligible: hasPaid && refundAmount > 0,
      message: hasPaid
        ? (refundAmount > 0
          ? `Cancellation confirmed. Refund of $${refundAmount.toFixed(2)} initiated.`
          : 'Cancellation confirmed. No refund — cancelled within 3 days of check-in.')
        : 'Cancellation confirmed.',
    });

  } catch (err) {
    console.error('[StayRequest Cancel Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
