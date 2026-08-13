import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { getHotelWithRates } from "@/lib/hotels/queries";
import { SiteHeader } from "@/components/layout/site-header";
import { RateDisplay } from "@/components/domain/rate-display";
import { BookingRequestForm } from "@/components/guest/booking-request-form";
import { Badge } from "@/components/ui/badge";

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string }>;
}) {
  const { slug } = await params;
  const { checkIn: checkInStr } = await searchParams;
  const checkIn = checkInStr ? new Date(checkInStr) : new Date();

  const data = await getHotelWithRates(slug, checkIn);
  if (!data) notFound();

  const { hotel, roomRates } = data;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{hotel.name}</h1>
          <p className="text-muted-foreground">{hotel.city}, {hotel.country}</p>
          {hotel.category && <Badge className="mt-2">{hotel.category}</Badge>}
        </div>
        <p className="mb-8 max-w-2xl text-muted-foreground">{hotel.description}</p>

        <div className="grid gap-8 lg:grid-cols-2">
          {roomRates.map(({ room, rate }) => (
            <div key={room.id} className="space-y-4 rounded-lg border p-4">
              <h2 className="text-lg font-semibold">{room.name}</h2>
              <p className="text-sm text-muted-foreground">{room.description}</p>
              {rate ? (
                <>
                  <RateDisplay
                    rackAmount={rate.rackAmount}
                    stoAmount={rate.stoAmount}
                    currency={rate.currency}
                  />
                  <BookingRequestForm
                    hotelId={hotel.id}
                    roomTypeId={room.id}
                    defaultCheckIn={checkIn.toISOString().slice(0, 10)}
                  />
                </>
              ) : (
                <p className="text-sm text-amber-700">
                  No BusyBeds availability / rates for selected dates. Hotel may still be bookable elsewhere.
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
