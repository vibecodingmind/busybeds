import { prisma } from "@/lib/db";
import { resolveRateForStay } from "@/lib/rates/rate-engine";

export async function getApprovedHotels(filters?: {
  country?: string;
  city?: string;
}) {
  return prisma.hotel.findMany({
    where: {
      status: "APPROVED",
      ...(filters?.country ? { country: filters.country } : {}),
      ...(filters?.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
    },
    include: {
      roomTypes: {
        where: { isActive: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getHotelBySlug(slug: string) {
  return prisma.hotel.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      roomTypes: { where: { isActive: true } },
      benefits: { where: { isActive: true } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getHotelWithRates(slug: string, checkIn?: Date) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return null;

  const date = checkIn ?? new Date();
  const roomRates = await Promise.all(
    hotel.roomTypes.map(async (room) => {
      const rate = await resolveRateForStay(room.id, date);
      return { room, rate };
    }),
  );

  return { hotel, roomRates };
}

export async function getMemberBookings(userId: string) {
  return prisma.stayBooking.findMany({
    where: { memberId: userId },
    include: {
      hotel: true,
      roomType: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminMetrics() {
  const [members, hotels, bookings, pendingBookings, pendingHotels, pendingRates] =
    await Promise.all([
      prisma.user.count({ where: { platformRole: "MEMBER" } }),
      prisma.hotel.count({ where: { status: "APPROVED" } }),
      prisma.stayBooking.count(),
      prisma.stayBooking.count({ where: { status: "PENDING_AVAILABILITY" } }),
      prisma.hotel.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.pricingRule.count({ where: { status: "PENDING_APPROVAL" } }),
    ]);

  return {
    members,
    hotels,
    bookings,
    pendingBookings,
    pendingHotels,
    pendingRates,
  };
}
