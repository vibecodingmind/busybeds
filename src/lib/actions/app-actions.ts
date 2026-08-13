"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import {
  confirmAvailability,
  markNoAvailability,
  confirmDeposit,
  verifyBookingAtHotel,
  redeemBooking,
  createBookingRequest,
  BookingError,
} from "@/lib/booking/booking-service";
import { resolveRateForStay } from "@/lib/rates/rate-engine";
import {
  getActiveSubscription,
  hasActiveMembership,
  requireUser,
} from "@/lib/auth/session";
import { activateSubscription } from "@/lib/subscription/service";
import { getPaymentProvider } from "@/lib/payments/providers";
import { dispatchNotification } from "@/lib/notifications/service";
import { MAX_AUTO_DISCOUNT_PERCENT } from "@/lib/constants";
import { calculateSavings } from "@/lib/rates/discount";

export async function createStayRequestAction(formData: FormData) {
  const user = await requireUser();
  const sub = await getActiveSubscription(user.id);
  if (!hasActiveMembership(sub)) {
    return { error: "Active membership required" };
  }

  const hotelId = String(formData.get("hotelId"));
  const roomTypeId = String(formData.get("roomTypeId"));
  const checkIn = new Date(String(formData.get("checkIn")));
  const checkOut = new Date(String(formData.get("checkOut")));

  const rate = await resolveRateForStay(roomTypeId, checkIn);
  if (!rate) {
    return { error: "No approved rate for selected dates" };
  }

  try {
    const booking = await createBookingRequest({
      memberId: user.id,
      hotelId,
      roomTypeId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      rackSnapshot: rate.rackAmount,
      stoSnapshot: rate.stoAmount,
      currency: rate.currency,
      subscriptionId: sub?.id,
      planId: sub?.planId,
    });

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    await dispatchNotification(
      "BOOKING_REQUESTED",
      user.id,
      user.email,
      { hotel: hotel?.name ?? "" },
    );

    revalidatePath("/app");
    revalidatePath("/app/wallet");
    return { success: true, bookingId: booking.id };
  } catch (e) {
    if (e instanceof BookingError) return { error: e.message };
    throw e;
  }
}

export async function adminConfirmAvailabilityAction(bookingId: string, notes?: string) {
  const admin = await requireAdmin();
  const booking = await confirmAvailability(bookingId, admin.id, notes);

  const member = await prisma.user.findUnique({ where: { id: booking.memberId } });
  const hotel = await prisma.hotel.findUnique({ where: { id: booking.hotelId } });
  if (member && booking.couponCode) {
    await dispatchNotification(
      "AVAILABILITY_CONFIRMED",
      member.id,
      member.email,
      {
        code: booking.couponCode,
        deposit: String(booking.depositAmount),
        hotel: hotel?.name ?? "",
      },
    );
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/app/wallet");
  return { success: true };
}

export async function adminNoAvailabilityAction(bookingId: string, note?: string) {
  const admin = await requireAdmin();
  await markNoAvailability(bookingId, admin.id, note);
  revalidatePath("/admin/bookings");
  return { success: true };
}

export async function confirmDepositAction(bookingId: string) {
  const user = await requireUser();
  await confirmDeposit(bookingId, user.id);

  const booking = await prisma.stayBooking.findUnique({
    where: { id: bookingId },
    include: { member: true, hotel: true },
  });
  if (booking?.member) {
    await dispatchNotification(
      "DEPOSIT_CONFIRMED",
      booking.member.id,
      booking.member.email,
      { hotel: booking.hotel.name },
    );
  }

  revalidatePath("/hotel");
  revalidatePath("/app/wallet");
  return { success: true };
}

export async function verifyCouponAction(couponCode: string, hotelId: string) {
  const user = await requireUser();
  try {
    const result = await verifyBookingAtHotel(
      couponCode.toUpperCase(),
      hotelId,
      user.id,
    );
    revalidatePath("/hotel/verify");
    return { success: true, booking: result.booking, member: result.member };
  } catch (e) {
    if (e instanceof BookingError) return { error: e.message };
    throw e;
  }
}

export async function redeemCouponAction(bookingId: string) {
  const user = await requireUser();
  const booking = await redeemBooking(bookingId, user.id);

  const member = await prisma.user.findUnique({ where: { id: booking.memberId } });
  const hotel = await prisma.hotel.findUnique({ where: { id: booking.hotelId } });
  if (member) {
    await dispatchNotification(
      "COUPON_REDEEMED",
      member.id,
      member.email,
      { hotel: hotel?.name ?? "" },
    );
  }

  revalidatePath("/hotel/verify");
  return { success: true };
}

export async function approveHotelAction(hotelId: string) {
  const admin = await requireAdmin();
  await prisma.hotel.update({
    where: { id: hotelId },
    data: { status: "APPROVED", approvedAt: new Date(), approvedById: admin.id },
  });
  revalidatePath("/admin/hotels");
  return { success: true };
}

export async function rejectHotelAction(hotelId: string, reason: string) {
  await requireAdmin();
  await prisma.hotel.update({
    where: { id: hotelId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/hotels");
  return { success: true, reason };
}

export async function approveRateAction(rateId: string) {
  const admin = await requireAdmin();
  const rule = await prisma.pricingRule.update({
    where: { id: rateId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: admin.id,
    },
  });
  await prisma.pricingRuleHistory.create({
    data: {
      pricingRuleId: rateId,
      snapshot: rule,
      changedById: admin.id,
      changeReason: "Approved",
    },
  });
  revalidatePath("/admin/rates");
  return { success: true };
}

export async function rejectRateAction(rateId: string, reason: string) {
  await requireAdmin();
  await prisma.pricingRule.update({
    where: { id: rateId },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  revalidatePath("/admin/rates");
  return { success: true };
}

export async function submitRateForApprovalAction(rateId: string) {
  const user = await requireUser();
  await prisma.pricingRule.update({
    where: { id: rateId },
    data: { status: "PENDING_APPROVAL", submittedAt: new Date() },
  });
  revalidatePath("/hotel/rates");
}

export async function createPricingRuleAction(formData: FormData) {
  const user = await requireUser();
  const roomTypeId = String(formData.get("roomTypeId"));
  const sto = Number(formData.get("stoAmount"));
  const rack = Number(formData.get("rackAmount"));
  const currency = String(formData.get("currency") ?? "USD");
  const validFrom = new Date(String(formData.get("validFrom")));
  const validTo = new Date(String(formData.get("validTo")));

  const savings = calculateSavings(rack, sto);
  const status =
    savings.requiresAdminApproval && savings.discountPercent > MAX_AUTO_DISCOUNT_PERCENT
      ? "PENDING_APPROVAL"
      : "DRAFT";

  await prisma.pricingRule.create({
    data: {
      roomTypeId,
      stoAmount: sto,
      rackAmount: rack,
      currency,
      validFrom,
      validTo,
      minStayNights: 3,
      status,
      createdById: user.id,
    },
  });

  revalidatePath("/hotel/rates");
}

export async function startCheckoutAction(planId: string) {
  const user = await requireUser();
  const plan = await prisma.membershipPlan.findUniqueOrThrow({
    where: { id: planId },
  });

  const provider = getPaymentProvider();
  const session = await provider.createSubscriptionCheckout({
    userId: user.id,
    planId: plan.id,
    planSlug: plan.slug,
    amount: Number(plan.priceAmount),
    currency: plan.priceCurrency,
    email: user.email,
  });

  return { url: session.url };
}

export async function completeCheckoutAction(planId: string) {
  const user = await requireUser();
  const existing = await getActiveSubscription(user.id);
  if (existing?.planId === planId && hasActiveMembership(existing)) {
    return { success: true, subscriptionId: existing.id };
  }

  const plan = await prisma.membershipPlan.findUniqueOrThrow({
    where: { id: planId },
  });

  const sub = await activateSubscription(user.id, planId);
  await dispatchNotification(
    "MEMBERSHIP_ACTIVATED",
    user.id,
    user.email,
    { plan: plan.name },
  );
  revalidatePath("/app");
  return { success: true, subscriptionId: sub.id };
}

export async function updateHotelProfileAction(formData: FormData) {
  await requireUser();
  const hotelId = String(formData.get("hotelId"));
  const description = String(formData.get("description") ?? "");
  const amenities = String(formData.get("amenities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.hotel.update({
    where: { id: hotelId },
    data: { description, amenities },
  });

  revalidatePath("/hotel/profile");
}

export async function createRoomTypeAction(formData: FormData) {
  const hotelId = String(formData.get("hotelId"));
  const name = String(formData.get("name"));
  const description = String(formData.get("description") ?? "");

  await prisma.roomType.create({
    data: { hotelId, name, description },
  });

  revalidatePath("/hotel/rooms");
}

export async function updateHotelProfileFormAction(formData: FormData) {
  await updateHotelProfileAction(formData);
}

export async function createPricingRuleFormAction(formData: FormData) {
  await createPricingRuleAction(formData);
}

export async function createRoomTypeFormAction(formData: FormData) {
  await createRoomTypeAction(formData);
}

export async function adminConfirmAvailabilityFormAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  await adminConfirmAvailabilityAction(bookingId);
}

export async function adminNoAvailabilityFormAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  await adminNoAvailabilityAction(bookingId, "No availability");
}

export async function confirmDepositFormAction(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  await confirmDepositAction(bookingId);
}

export async function approveHotelFormAction(formData: FormData) {
  const hotelId = String(formData.get("hotelId"));
  await approveHotelAction(hotelId);
}

export async function approveRateFormAction(formData: FormData) {
  const rateId = String(formData.get("rateId"));
  await approveRateAction(rateId);
}

export async function submitRateForApprovalFormAction(formData: FormData) {
  const rateId = String(formData.get("rateId"));
  await submitRateForApprovalAction(rateId);
}
