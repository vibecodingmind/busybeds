export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateCouponCode, generateQRDataUrl } from '@/lib/qr';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/** GET /api/stay-requests/[id]/pay/callback — payment provider redirects here after payment */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const method = searchParams.get('method');

    const stayRequest = await prisma.stayRequest.findUnique({
      where: { id },
      include: {
        hotel: { select: { name: true, slug: true } },
        roomType: { select: { name: true } },
        traveler: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!stayRequest) {
      return NextResponse.redirect(`${APP_URL}/my-stay-requests?error=not_found`);
    }

    if (!['pending_payment', 'paid'].includes(stayRequest.status)) {
      return NextResponse.redirect(`${APP_URL}/my-stay-requests?already=1`);
    }

    // Mark as paid and generate date-locked coupon
    const now = new Date();

    // Generate unique coupon code
    let code = generateCouponCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.coupon.findUnique({ where: { code } });
      if (!exists) break;
      code = generateCouponCode();
      attempts++;
    }

    const qrDataUrl = await generateQRDataUrl(code, APP_URL);

    // Create date-locked coupon — valid only from check-in to check-out
    const coupon = await prisma.coupon.create({
      data: {
        code,
        qrDataUrl,
        userId: stayRequest.travelerId,
        hotelId: stayRequest.hotelId,
        subscriptionId: stayRequest.id, // use stayRequestId as reference
        discountPercent: stayRequest.discountPercent,
        status: 'active',
        startTime: stayRequest.checkIn,    // coupon valid from check-in
        endTime: stayRequest.checkOut,     // coupon expires at check-out
        expiresAt: stayRequest.checkOut,
        usageLimit: 1,
        usageCount: 0,
        guestName: stayRequest.traveler.fullName,
      },
    });

    // Update stay request: paid + link coupon
    await prisma.stayRequest.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: now,
        paymentMethod: method || 'stripe',
        couponId: coupon.id,
      },
    });

    // Record deposit transaction
    await prisma.depositTransaction.upsert({
      where: { stayRequestId: id },
      update: {
        status: 'captured',
        capturedAt: now,
        paymentMethod: method || 'stripe',
      },
      create: {
        stayRequestId: id,
        amount: stayRequest.depositAmount,
        platformFee: stayRequest.platformFeeAmount,
        hotelAmount: stayRequest.hotelReceives,
        currency: 'USD',
        paymentMethod: method || 'stripe',
        status: 'captured',
        capturedAt: now,
      },
    });

    // Notify traveler
    try {
      await prisma.notification.create({
        data: {
          userId: stayRequest.travelerId,
          title: 'Booking Confirmed!',
          message: `Your stay at ${stayRequest.hotel.name} is confirmed. Your QR coupon is ready — show it at check-in on ${new Date(stayRequest.checkIn).toLocaleDateString()}.`,
          type: 'stay_request',
          link: '/my-stay-requests',
        },
      });
    } catch (e) { console.error('Notification error:', e); }

    // Notify hotel manager
    try {
      const manager = await prisma.hotelManager.findFirst({
        where: { hotelId: stayRequest.hotelId, isActive: true },
      });
      if (manager) {
        await prisma.notification.create({
          data: {
            userId: manager.userId,
            title: 'Stay Request Confirmed',
            message: `Deposit received for ${stayRequest.traveler.fullName}'s stay at ${stayRequest.hotel.name}. Check-in: ${new Date(stayRequest.checkIn).toLocaleDateString()}. Amount received: $${stayRequest.hotelReceives.toFixed(2)}.`,
            type: 'stay_request',
            link: '/portal/stay-requests',
          },
        });
      }
    } catch (e) { console.error('Notification error:', e); }

    return NextResponse.redirect(`${APP_URL}/my-stay-requests?paid=1`);

  } catch (err) {
    console.error('[StayRequest Pay Callback Error]', err);
    return NextResponse.redirect(`${APP_URL}/my-stay-requests?error=payment_failed`);
  }
}
