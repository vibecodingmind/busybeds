import { generateQrDataUrl } from "@/lib/coupons/qr";
import type { StayBooking, Hotel, RoomType } from "@prisma/client";

export async function enrichBookingWithQr(
  booking: StayBooking & { hotel: Hotel; roomType: RoomType },
) {
  let qrDataUrl: string | null = null;
  if (booking.couponCode && booking.status === "DEPOSIT_PENDING") {
    const qr = await generateQrDataUrl({
      bookingId: booking.id,
      couponCode: booking.couponCode,
    });
    qrDataUrl = qr.dataUrl;
  }
  return { ...booking, qrDataUrl };
}
