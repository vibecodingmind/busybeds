import { prisma } from "@/lib/db";
import {
  adminConfirmAvailabilityFormAction,
  adminNoAvailabilityFormAction,
} from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminBookingsPage() {
  const bookings = await prisma.stayBooking.findMany({
    where: { status: "PENDING_AVAILABILITY" },
    include: {
      member: true,
      hotel: true,
      roomType: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Availability queue</h1>
      <p className="text-muted-foreground">
        Call hotels to confirm, then approve to issue QR + 3-hour deposit window.
      </p>
      <div className="space-y-4">
        {bookings.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        )}
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle className="text-base">{b.hotel.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {b.member.firstName} {b.member.lastName} · {b.roomType.name} · {b.nights} nights
              </p>
              <p className="text-xs text-muted-foreground">
                {b.checkInDate.toISOString().slice(0, 10)} → {b.checkOutDate.toISOString().slice(0, 10)}
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <form action={adminConfirmAvailabilityFormAction}>
                <input type="hidden" name="bookingId" value={b.id} />
                <Button type="submit">Confirm availability → Issue QR</Button>
              </form>
              <form action={adminNoAvailabilityFormAction}>
                <input type="hidden" name="bookingId" value={b.id} />
                <Button type="submit" variant="outline">No availability</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
