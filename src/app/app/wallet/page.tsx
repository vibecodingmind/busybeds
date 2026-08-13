import { getCurrentUser } from "@/lib/auth/session";
import { getMemberBookings } from "@/lib/hotels/queries";
import { enrichBookingWithQr } from "@/lib/booking/enrich-booking";
import { CouponCard } from "@/components/domain/coupon-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const bookings = await getMemberBookings(user.id);
  const enriched = await Promise.all(bookings.map(enrichBookingWithQr));

  const active = enriched.filter((b) =>
    ["DEPOSIT_PENDING", "DEPOSIT_CONFIRMED", "VERIFIED"].includes(b.status),
  );
  const used = enriched.filter((b) => b.status === "REDEEMED");
  const expired = enriched.filter((b) =>
    ["EXPIRED", "NO_AVAILABILITY", "CANCELLED", "REJECTED"].includes(b.status),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupon wallet</h1>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="used">Used</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="grid gap-4 md:grid-cols-2">
          {active.map((b) => (
            <CouponCard
              key={b.id}
              code={b.couponCode ?? "—"}
              hotelName={b.hotel.name}
              roomName={b.roomType.name}
              rackAmount={Number(b.rackSnapshot)}
              stoAmount={Number(b.stoSnapshot)}
              currency={b.currency}
              status={b.status}
              depositDeadline={b.depositDeadline}
              nights={b.nights}
              checkIn={b.checkInDate.toISOString().slice(0, 10)}
              checkOut={b.checkOutDate.toISOString().slice(0, 10)}
              qrDataUrl={b.qrDataUrl}
            />
          ))}
        </TabsContent>
        <TabsContent value="used" className="grid gap-4 md:grid-cols-2">
          {used.map((b) => (
            <CouponCard
              key={b.id}
              code={b.couponCode ?? "—"}
              hotelName={b.hotel.name}
              roomName={b.roomType.name}
              rackAmount={Number(b.rackSnapshot)}
              stoAmount={Number(b.stoSnapshot)}
              currency={b.currency}
              status={b.status}
              nights={b.nights}
              checkIn={b.checkInDate.toISOString().slice(0, 10)}
              checkOut={b.checkOutDate.toISOString().slice(0, 10)}
            />
          ))}
        </TabsContent>
        <TabsContent value="expired" className="grid gap-4 md:grid-cols-2">
          {expired.map((b) => (
            <CouponCard
              key={b.id}
              code={b.couponCode ?? "—"}
              hotelName={b.hotel.name}
              roomName={b.roomType.name}
              rackAmount={Number(b.rackSnapshot)}
              stoAmount={Number(b.stoSnapshot)}
              currency={b.currency}
              status={b.status}
              nights={b.nights}
              checkIn={b.checkInDate.toISOString().slice(0, 10)}
              checkOut={b.checkOutDate.toISOString().slice(0, 10)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
