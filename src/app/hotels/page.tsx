import { getApprovedHotels } from "@/lib/hotels/queries";

export const dynamic = "force-dynamic";
import { resolveRateForStay } from "@/lib/rates/rate-engine";
import { HotelCard } from "@/components/domain/hotel-card";
import { SiteHeader } from "@/components/layout/site-header";

export default async function HotelsPage() {
  const hotels = await getApprovedHotels();
  const checkIn = new Date();

  const enriched = await Promise.all(
    hotels.map(async (hotel) => {
      const room = hotel.roomTypes[0];
      const rate = room ? await resolveRateForStay(room.id, checkIn) : null;
      return { hotel, rate };
    }),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Partner hotels</h1>
        <p className="mt-2 text-muted-foreground">
          Hotels remain listed even when BusyBeds has no availability for your dates.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enriched.map(({ hotel, rate }) => (
            <HotelCard
              key={hotel.id}
              slug={hotel.slug}
              name={hotel.name}
              city={hotel.city}
              country={hotel.country}
              category={hotel.category}
              rackAmount={rate?.rackAmount}
              stoAmount={rate?.stoAmount}
              currency={hotel.currency}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
