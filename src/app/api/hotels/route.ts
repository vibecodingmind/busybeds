import { NextResponse } from "next/server";
import { getApprovedHotels } from "@/lib/hotels/queries";
import { resolveRateForStay } from "@/lib/rates/rate-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") ?? undefined;
  const city = searchParams.get("city") ?? undefined;

  const hotels = await getApprovedHotels({ country, city });
  const checkIn = searchParams.get("checkIn")
    ? new Date(searchParams.get("checkIn")!)
    : new Date();

  const enriched = await Promise.all(
    hotels.map(async (hotel) => {
      const room = hotel.roomTypes[0];
      const rate = room ? await resolveRateForStay(room.id, checkIn) : null;
      return {
        id: hotel.id,
        slug: hotel.slug,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        category: hotel.category,
        currency: hotel.currency,
        rackAmount: rate?.rackAmount,
        stoAmount: rate?.stoAmount,
      };
    }),
  );

  return NextResponse.json({ hotels: enriched });
}
