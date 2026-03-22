export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

/* ────────────────────────────────────────────────────────────────
   Google Places helpers
──────────────────────────────────────────────────────────────── */
const API_KEY = () =>
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

/** Maps Google `types[]` → BusyBeds category */
function mapCategory(types: string[]): string {
  if (types.includes('lodging')) {
    if (types.includes('campground'))         return 'Camping';
    if (types.includes('rv_park'))            return 'Camping';
    if (types.includes('hostel'))             return 'Hostel';
    if (types.includes('motel'))              return 'Motel';
    if (types.includes('resort_hotel'))       return 'Resort';
    if (types.includes('bed_and_breakfast'))  return 'B&B';
    if (types.includes('guest_house'))        return 'Guesthouse';
    if (types.includes('apartment'))          return 'Apartment';
  }
  return 'Hotel';
}

/** Maps Google price_level (0–4) → estimated price per night in USD */
function mapPrice(priceLevel?: number): number {
  switch (priceLevel) {
    case 0: return 30;
    case 1: return 60;
    case 2: return 120;
    case 3: return 220;
    case 4: return 400;
    default: return 100;
  }
}

/** Google rating (0–5 float) → star rating (1–5 int) */
function mapStars(rating?: number): number {
  if (!rating) return 3;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

/** Extract city + country from address_components */
function extractLocation(components: GoogleAddressComponent[]): {
  city: string; country: string;
} {
  let city    = '';
  let country = '';
  for (const c of components) {
    if (c.types.includes('locality'))             city    = c.long_name;
    if (c.types.includes('administrative_area_level_1') && !city) city = c.long_name;
    if (c.types.includes('country'))              country = c.long_name;
  }
  return { city: city || 'Unknown', country: country || 'Unknown' };
}

/** Fetch a Google Places photo URL and follow the redirect to get the
 *  actual CDN image URL (no API key in the stored URL). */
async function resolvePhotoUrl(photoReference: string): Promise<string> {
  const key = API_KEY();
  const url = `${PLACES_BASE}/photo?maxwidth=1200&photoreference=${photoReference}&key=${key}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const location = res.headers.get('location');
    if (location) return location;           // actual CDN URL — key-free
  } catch {/* fall through */}
  return url;                                // fallback: original URL
}

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */
interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlaceSearchResult {
  placeId:       string;
  name:          string;
  address:       string;
  lat:           number;
  lng:           number;
  rating:        number | null;
  reviewCount:   number | null;
  priceLevel:    number | null;
  photoUrl:      string | null;
  types:         string[];
  category:      string;
  estimatedPrice: number;
}

/* ────────────────────────────────────────────────────────────────
   GET /api/admin/import-hotels?q=...&pagetoken=...
   → Text-search Google Places and return candidate results
──────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const key = API_KEY();
  if (!key)
    return NextResponse.json(
      { error: 'Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your .env file.' },
      { status: 503 },
    );

  const { searchParams } = new URL(req.url);
  const q          = searchParams.get('q')?.trim();
  const pagetoken  = searchParams.get('pagetoken') || '';

  if (!q) return NextResponse.json({ error: 'query (q) is required' }, { status: 400 });

  // Build text-search URL
  const params = new URLSearchParams({
    query: q,
    type:  'lodging',
    key,
  });
  if (pagetoken) params.set('pagetoken', pagetoken);

  const raw = await fetch(`${PLACES_BASE}/textsearch/json?${params}`);
  if (!raw.ok)
    return NextResponse.json({ error: 'Google Places request failed' }, { status: 502 });

  const json = await raw.json();
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    return NextResponse.json(
      { error: `Google Places error: ${json.status} — ${json.error_message || ''}` },
      { status: 502 },
    );
  }

  // Fetch photo redirect URLs in parallel (max 10 per page)
  const results: PlaceSearchResult[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (json.results as any[]).map(async (p) => {
      const photoRef = p.photos?.[0]?.photo_reference;
      const photoUrl = photoRef ? await resolvePhotoUrl(photoRef) : null;
      return {
        placeId:        p.place_id,
        name:           p.name,
        address:        p.formatted_address,
        lat:            p.geometry.location.lat,
        lng:            p.geometry.location.lng,
        rating:         p.rating   ?? null,
        reviewCount:    p.user_ratings_total ?? null,
        priceLevel:     p.price_level ?? null,
        photoUrl,
        types:          p.types ?? [],
        category:       mapCategory(p.types ?? []),
        estimatedPrice: mapPrice(p.price_level),
      } satisfies PlaceSearchResult;
    }),
  );

  return NextResponse.json({
    results,
    nextPageToken: json.next_page_token || null,
    total:         json.results?.length ?? 0,
  });
}

/* ────────────────────────────────────────────────────────────────
   POST /api/admin/import-hotels
   Body: { placeIds: string[], discountPercent?: number, couponValidDays?: number }
   → Fetch full details for each placeId, create hotel records, return results
──────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const key = API_KEY();
  if (!key)
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 503 });

  const body = await req.json();
  const placeIds: string[]    = body.placeIds ?? [];
  const discountPercent: number = Number(body.discountPercent) || 15;
  const couponValidDays: number = Number(body.couponValidDays) || 30;
  const pricePerNight: number   = Number(body.pricePerNight)   || 0;

  if (!placeIds.length)
    return NextResponse.json({ error: 'placeIds array is required' }, { status: 400 });

  const importResults = await Promise.all(
    placeIds.map(async (placeId) => {
      try {
        /* ── 1. Fetch Place Details ── */
        const detailParams = new URLSearchParams({
          place_id: placeId,
          fields: [
            'name', 'formatted_address', 'address_components',
            'geometry', 'rating', 'user_ratings_total',
            'website', 'formatted_phone_number', 'international_phone_number',
            'photos', 'price_level', 'types',
          ].join(','),
          key,
        });
        const detailRes = await fetch(`${PLACES_BASE}/details/json?${detailParams}`);
        const detail    = await detailRes.json();

        if (detail.status !== 'OK' || !detail.result) {
          return { placeId, success: false, error: `Places API: ${detail.status}` };
        }

        const p = detail.result;

        /* ── 2. Resolve fields ── */
        const { city, country } = extractLocation(p.address_components ?? []);
        const category  = mapCategory(p.types ?? []);
        const stars     = mapStars(p.rating);
        const price     = pricePerNight || mapPrice(p.price_level);

        // Resolve cover image (follow redirect → key-free CDN URL)
        const photoRef  = p.photos?.[0]?.photo_reference;
        const coverImage = photoRef ? await resolvePhotoUrl(photoRef) : null;

        // Resolve extra photos (up to 4 more)
        const extraPhotos: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const ph of (p.photos ?? []).slice(1, 5) as any[]) {
          const url = await resolvePhotoUrl(ph.photo_reference);
          extraPhotos.push(url);
        }

        /* ── 3. Build slug ── */
        const slug =
          p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
          '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);

        /* ── 4. Create hotel record ── */
        const hotel = await prisma.hotel.create({
          data: {
            name:             p.name,
            slug,
            city,
            country,
            address:          p.formatted_address || null,
            category,
            starRating:       stars,
            discountPercent,
            couponValidDays,
            coverImage:       coverImage ?? undefined,
            websiteUrl:       p.website || null,
            whatsapp:         p.international_phone_number || p.formatted_phone_number || null,
            latitude:         p.geometry?.location?.lat ?? null,
            longitude:        p.geometry?.location?.lng ?? null,
            amenities:        '[]',
            status:           'active',
            descriptionShort: `${category} in ${city}, ${country}`,
            descriptionLong:  `${p.name} is a ${stars}-star ${category.toLowerCase()} located in ${city}, ${country}. ${p.rating ? `Rated ${p.rating.toFixed(1)}/5 by ${(p.user_ratings_total ?? 0).toLocaleString()} guests on Google.` : ''} Imported via Google Places.`,
            isFeatured:       false,
            // Extra photos
            photos: extraPhotos.length > 0 ? {
              create: extraPhotos.map((url, idx) => ({
                url,
                displayOrder: idx,
              })),
            } : undefined,
            // Default room type
            roomTypes: {
              create: [{
                name:          'Standard Room',
                description:   'Standard room imported from Google Places.',
                pricePerNight: price,
                displayOrder:  0,
              }],
            },
          },
        });

        return {
          placeId,
          success: true,
          hotelId:  hotel.id,
          hotelSlug: hotel.slug,
          name:      hotel.name,
          city:      hotel.city,
          country:   hotel.country,
          coverImage: hotel.coverImage,
        };

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { placeId, success: false, error: msg };
      }
    }),
  );

  const succeeded = importResults.filter(r => r.success).length;
  const failed    = importResults.filter(r => !r.success).length;

  return NextResponse.json({ results: importResults, succeeded, failed }, { status: 201 });
}
