import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HotelDashboardPage() {
  const user = await getCurrentUser();
  const hotelId = user?.contexts.find((c) => c.hotelId)?.hotelId;
  if (!hotelId) return null;

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      roomTypes: true,
      stayBookings: {
        where: { status: { in: ["DEPOSIT_PENDING", "DEPOSIT_CONFIRMED", "VERIFIED"] } },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!hotel) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{hotel.name}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Room types</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{hotel.roomTypes.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Active bookings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{hotel.stayBookings.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent className="text-lg font-medium">{hotel.status}</CardContent>
        </Card>
      </div>
    </div>
  );
}
