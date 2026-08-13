import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { confirmDepositFormAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HotelBookingsPage() {
  const user = await getCurrentUser();
  const hotelId = user?.contexts.find((c) => c.hotelId)?.hotelId;
  if (!hotelId) return null;

  const bookings = await prisma.stayBooking.findMany({
    where: {
      hotelId,
      status: { in: ["DEPOSIT_PENDING", "DEPOSIT_CONFIRMED", "VERIFIED"] },
    },
    include: { member: true, roomType: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bookings</h1>
      {bookings.map((b) => (
        <Card key={b.id}>
          <CardHeader>
            <CardTitle className="text-base">{b.member.email}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {b.roomType.name} · {b.couponCode} · {b.status}
            </p>
          </CardHeader>
          {b.status === "DEPOSIT_PENDING" && (
            <CardContent>
              <form action={confirmDepositFormAction}>
                <input type="hidden" name="bookingId" value={b.id} />
                <Button type="submit">Confirm deposit received</Button>
              </form>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
