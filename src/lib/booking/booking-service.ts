import { randomBytes } from "crypto";
import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  COUPON_CODE_PREFIX,
  DEPOSIT_WINDOW_MS,
  MIN_STAY_NIGHTS,
} from "@/lib/constants";
import { computeNights, validateMinStay } from "@/lib/rates/discount";
import { hashQrToken, signBookingToken } from "@/lib/coupons/qr";
import { awardRedemptionPoints } from "@/lib/loyalty/service";

export class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

function generateCouponCode(): string {
  const segment = randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
  return `${COUPON_CODE_PREFIX}-${segment}`;
}

async function appendTimeline(
  bookingId: string,
  toStatus: BookingStatus,
  actorId?: string,
  fromStatus?: BookingStatus,
  note?: string,
) {
  await prisma.bookingTimelineEvent.create({
    data: {
      bookingId,
      actorId,
      fromStatus,
      toStatus,
      note,
    },
  });
}

export interface CreateBookingInput {
  memberId: string;
  hotelId: string;
  roomTypeId: string;
  checkInDate: Date;
  checkOutDate: Date;
  rackSnapshot: number;
  stoSnapshot: number;
  currency: string;
  subscriptionId?: string;
  planId?: string;
}

export async function createBookingRequest(input: CreateBookingInput) {
  const nights = computeNights(input.checkInDate, input.checkOutDate);

  if (!validateMinStay(nights, MIN_STAY_NIGHTS)) {
    throw new BookingError(
      `Minimum stay is ${MIN_STAY_NIGHTS} nights`,
      "MIN_STAY_VIOLATION",
    );
  }

  const depositAmount = input.stoSnapshot * nights;

  const booking = await prisma.stayBooking.create({
    data: {
      memberId: input.memberId,
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      subscriptionId: input.subscriptionId,
      planId: input.planId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      nights,
      rackSnapshot: input.rackSnapshot,
      stoSnapshot: input.stoSnapshot,
      currency: input.currency,
      depositAmount,
      status: "PENDING_AVAILABILITY",
    },
  });

  await appendTimeline(
    booking.id,
    "PENDING_AVAILABILITY",
    input.memberId,
    undefined,
    "Booking request created",
  );

  return booking;
}

/** Admin confirms availability — issues QR/coupon and starts 3-hour deposit window. */
export async function confirmAvailability(
  bookingId: string,
  adminId: string,
  notes?: string,
) {
  const booking = await prisma.stayBooking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  if (booking.status !== "PENDING_AVAILABILITY") {
    throw new BookingError("Booking is not pending availability", "INVALID_STATUS");
  }

  const now = new Date();
  const depositDeadline = new Date(now.getTime() + DEPOSIT_WINDOW_MS);
  const couponCode = generateCouponCode();
  const qrToken = signBookingToken(bookingId, couponCode);
  const qrTokenHash = hashQrToken(qrToken);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.stayBooking.update({
      where: { id: bookingId },
      data: {
        status: "DEPOSIT_PENDING",
        couponCode,
        qrTokenHash,
        depositDeadline,
        confirmedAt: now,
        confirmedById: adminId,
        availabilityNotes: notes,
      },
    });

    await tx.bookingTimelineEvent.create({
      data: {
        bookingId,
        actorId: adminId,
        fromStatus: "PENDING_AVAILABILITY",
        toStatus: "AVAILABILITY_CONFIRMED",
        note: notes ?? "Availability confirmed",
      },
    });

    await tx.bookingTimelineEvent.create({
      data: {
        bookingId,
        actorId: adminId,
        fromStatus: "AVAILABILITY_CONFIRMED",
        toStatus: "DEPOSIT_PENDING",
        note: `QR issued; deposit due within ${DEPOSIT_WINDOW_MS / 3600000} hours`,
      },
    });

    return result;
  });

  return updated;
}

export async function markNoAvailability(bookingId: string, adminId: string, note?: string) {
  const booking = await prisma.stayBooking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  if (booking.status !== "PENDING_AVAILABILITY") {
    throw new BookingError("Booking is not pending availability", "INVALID_STATUS");
  }

  const updated = await prisma.stayBooking.update({
    where: { id: bookingId },
    data: { status: "NO_AVAILABILITY" },
  });

  await appendTimeline(
    bookingId,
    "NO_AVAILABILITY",
    adminId,
    "PENDING_AVAILABILITY",
    note ?? "No availability",
  );

  return updated;
}

export async function confirmDeposit(
  bookingId: string,
  confirmerId: string,
) {
  const booking = await prisma.stayBooking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  if (booking.status !== "DEPOSIT_PENDING") {
    throw new BookingError("Booking is not awaiting deposit", "INVALID_STATUS");
  }

  if (booking.depositDeadline && booking.depositDeadline < new Date()) {
    throw new BookingError("Deposit window expired", "DEPOSIT_EXPIRED");
  }

  const updated = await prisma.stayBooking.update({
    where: { id: bookingId },
    data: {
      status: "DEPOSIT_CONFIRMED",
      depositConfirmedAt: new Date(),
      depositConfirmedById: confirmerId,
    },
  });

  await appendTimeline(
    bookingId,
    "DEPOSIT_CONFIRMED",
    confirmerId,
    "DEPOSIT_PENDING",
    "Deposit confirmed by hotel",
  );

  return updated;
}

export async function expireDepositPendingBookings() {
  const now = new Date();
  const expired = await prisma.stayBooking.findMany({
    where: {
      status: "DEPOSIT_PENDING",
      depositDeadline: { lt: now },
    },
  });

  for (const booking of expired) {
    await prisma.stayBooking.update({
      where: { id: booking.id },
      data: { status: "EXPIRED" },
    });
    await appendTimeline(
      booking.id,
      "EXPIRED",
      undefined,
      "DEPOSIT_PENDING",
      "Deposit window expired (3 hours)",
    );
  }

  return expired.length;
}

export async function verifyBookingAtHotel(
  couponCode: string,
  hotelId: string,
  staffId: string,
) {
  const booking = await prisma.stayBooking.findFirst({
    where: { couponCode, hotelId },
    include: { member: true },
  });

  if (!booking) {
    throw new BookingError("Invalid coupon code", "INVALID_COUPON");
  }

  if (booking.status !== "DEPOSIT_CONFIRMED") {
    throw new BookingError(
      `Coupon not valid for verification (status: ${booking.status})`,
      "INVALID_STATUS",
    );
  }

  const updated = await prisma.stayBooking.update({
    where: { id: booking.id },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verifiedById: staffId,
    },
  });

  await appendTimeline(
    booking.id,
    "VERIFIED",
    staffId,
    "DEPOSIT_CONFIRMED",
    "Member verified at reception",
  );

  return { booking: updated, member: booking.member };
}

export async function redeemBooking(
  bookingId: string,
  staffId: string,
) {
  const booking = await prisma.stayBooking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  if (booking.status !== "VERIFIED") {
    throw new BookingError("Booking must be verified before redemption", "INVALID_STATUS");
  }

  const updated = await prisma.stayBooking.update({
    where: { id: bookingId },
    data: {
      status: "REDEEMED",
      redeemedAt: new Date(),
      redeemedById: staffId,
    },
  });

  await appendTimeline(
    bookingId,
    "REDEEMED",
    staffId,
    "VERIFIED",
    "Stay completed / benefit redeemed",
  );

  await awardRedemptionPoints(booking.memberId, bookingId);

  return updated;
}
