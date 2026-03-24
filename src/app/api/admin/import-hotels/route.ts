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

/**
 * Maps Google price_level (0–4) + rating → estimated price per night in USD.
 * Uses rating as a modifier so hotels in the same price tier get varied prices.
 */
function mapPrice(priceLevel?: number, rating?: number): number {
  // Base ranges per price level
  const bases: Record<number, [number, number]> = {
    0: [20,  45],
    1: [45,  90],
    2: [90,  180],
    3: [180, 350],
    4: [350, 700],
  };
  const [lo, hi] = bases[priceLevel ?? -1] ?? [70, 150];
  // rating 1–5 → interpolate within range (higher rating = higher price)
  const t = rating ? Math.min(1, Math.max(0, (rating - 1) / 4)) : 0.5;
  return Math.round(lo + t * (hi - lo));
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

/** Google review data structure */
interface GoogleReview {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description?: string;
  text: string;
  time: number;
}

/** Generate a unique ID for Google reviews (since Google doesn't provide one) */
function generateGoogleReviewId(placeId: string, authorName: string, timestamp: number): string {
  const hash = Buffer.from(`${placeId}-${authorName}-${timestamp}`).toString('base64').slice(0, 16);
  return `gr_${hash}`;
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
  placeId:        string;
  name:           string;
  address:        string;
  lat:            number;
  lng:            number;
  rating:         number | null;
  reviewCount:    number | null;
  priceLevel:     number | null;
  photoUrl:       string | null;
  types:          string[];
  category:       string;
  estimatedPrice: number;
  alreadyImported: boolean;   // ← new: true if placeId already in DB
}

/* ────────────────────────────────────────────────────────────────
   GET /api/admin/import-hotels?q=...&pagetoken=...
   → Text-search Google Places and return candidate results.
     Results include alreadyImported flag based on googlePlaceId.
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
  const q         = searchParams.get('q')?.trim();
  const pagetoken = searchParams.get('pagetoken') || '';

  if (!q) return NextResponse.json({ error: 'query (q) is required' }, { status: 400 });

  // Build text-search URL
  const params = new URLSearchParams({ query: q, type: 'lodging', key });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawResults = (json.results as any[]) ?? [];

  // Check which placeIds are already in DB (single query)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const placeIds = rawResults.map((p) => p.place_id as string);
  const existing: { googlePlaceId: string | null }[] = await db.hotel.findMany({
    where: { googlePlaceId: { in: placeIds } },
    select: { googlePlaceId: true },
  });
  const importedSet = new Set(existing.map((h) => h.googlePlaceId));

  // Fetch photo redirect URLs sequentially to avoid rate-limits
  const results: PlaceSearchResult[] = [];
  for (const p of rawResults) {
    const photoRef = p.photos?.[0]?.photo_reference;
    const photoUrl = photoRef ? await resolvePhotoUrl(photoRef) : null;
    results.push({
      placeId:         p.place_id,
      name:            p.name,
      address:         p.formatted_address,
      lat:             p.geometry.location.lat,
      lng:             p.geometry.location.lng,
      rating:          p.rating          ?? null,
      reviewCount:     p.user_ratings_total ?? null,
      priceLevel:      p.price_level     ?? null,
      photoUrl,
      types:           p.types           ?? [],
      category:        mapCategory(p.types ?? []),
      estimatedPrice:  mapPrice(p.price_level, p.rating),
      alreadyImported: importedSet.has(p.place_id),
    });
  }

  return NextResponse.json({
    results,
    nextPageToken: json.next_page_token || null,
    total:         results.length,
  });
}

/* ────────────────────────────────────────────────────────────────
   POST /api/admin/import-hotels
   Body: { placeIds: string[], discountPercent?, couponValidDays?, pricePerNight?, category?, importReviews? }
   → Fetches details sequentially (avoids connection-pool exhaustion),
     skips placeIds already in DB, creates hotel records.
     If importReviews is true, also imports up to 5 Google reviews per hotel.
──────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const key = API_KEY();
  if (!key)
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 503 });

  const body = await req.json();
  const placeIds: string[]      = body.placeIds        ?? [];
  const discountPercent: number = Number(body.discountPercent) || 15;
  const couponValidDays: number = Number(body.couponValidDays) || 30;
  const pricePerNight: number   = Number(body.pricePerNight)   || 0;
  const categoryOverride: string | undefined = body.category; // Manual category override
  const importReviews: boolean  = body.importReviews !== false; // Default: true

  if (!placeIds.length)
    return NextResponse.json({ error: 'placeIds array is required' }, { status: 400 });

  // Pre-check which placeIds already exist — skip them entirely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const alreadyInDb: { googlePlaceId: string | null; name: string }[] = await db.hotel.findMany({
    where: { googlePlaceId: { in: placeIds } },
    select: { googlePlaceId: true, name: true },
  });
  const alreadySet = new Set(alreadyInDb.map((h) => h.googlePlaceId));

  // ── Import SEQUENTIALLY to avoid connection-pool timeout ──────
  type ImportResult =
    | { placeId: string; success: true; hotelId: string; hotelSlug: string; name: string; city: string; country: string; coverImage: string | null; reviewsImported: number }
    | { placeId: string; success: false; error: string; skipped?: boolean };

  const importResults: ImportResult[] = [];

  for (const placeId of placeIds) {
    // Skip already-imported hotels
    if (alreadySet.has(placeId)) {
      const existing = alreadyInDb.find((h) => h.googlePlaceId === placeId);
      importResults.push({
        placeId,
        success: false,
        skipped: true,
        error: `Already imported as "${existing?.name}"`,
      });
      continue;
    }

    try {
      /* ── 1. Fetch Place Details (with reviews) ── */
      const detailParams = new URLSearchParams({
        place_id: placeId,
        fields: [
          'name', 'formatted_address', 'address_components',
          'geometry', 'rating', 'user_ratings_total',
          'website', 'formatted_phone_number', 'international_phone_number',
          'photos', 'price_level', 'types', 'reviews',
        ].join(','),
        key,
      });
      const detailRes = await fetch(`${PLACES_BASE}/details/json?${detailParams}`);
      const detail    = await detailRes.json();

      if (detail.status !== 'OK' || !detail.result) {
        importResults.push({ placeId, success: false, error: `Places API: ${detail.status}` });
        continue;
      }

      const p = detail.result;

      /* ── 2. Resolve fields ── */
      const { city, country } = extractLocation(p.address_components ?? []);
      const category  = categoryOverride || mapCategory(p.types ?? []); // Use override if provided
      const stars     = mapStars(p.rating);
      const price     = pricePerNight || mapPrice(p.price_level, p.rating);

      // Resolve cover image (follow redirect → key-free CDN URL)
      const photoRef   = p.photos?.[0]?.photo_reference;
      const coverImage = photoRef ? await resolvePhotoUrl(photoRef) : null;

      // Resolve extra photos (up to 4 more) — sequential to avoid rate-limits
      const extraPhotos: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const ph of (p.photos ?? []).slice(1, 5) as any[]) {
        const url = await resolvePhotoUrl(ph.photo_reference);
        extraPhotos.push(url);
      }

      /* ── 3. Build unique slug ── */
      const slug =
        p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
        '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);

      /* ── 4. Prepare reviews data if importing ── */
      const reviewsData: Array<{
        googleReviewId: string;
        rating: number;
        title: string;
        body: string;
        authorName: string;
        authorPhotoUrl: string | null;
        reviewedAt: Date;
        source: string;
        isVerified: boolean;
        isApproved: boolean;
      }> = [];
      
      if (importReviews && p.reviews && Array.isArray(p.reviews)) {
        for (const rev of (p.reviews as GoogleReview[]).slice(0, 5)) {
          const googleReviewId = generateGoogleReviewId(placeId, rev.author_name, rev.time);
          reviewsData.push({
            googleReviewId,
            rating: Math.min(5, Math.max(1, rev.rating)),
            title: rev.text ? rev.text.slice(0, 60) + (rev.text.length > 60 ? '...' : '') : `Review by ${rev.author_name}`,
            body: rev.text || 'No comment provided.',
            authorName: rev.author_name,
            authorPhotoUrl: rev.profile_photo_url || null,
            reviewedAt: new Date(rev.time * 1000), // Convert Unix timestamp to Date
            source: 'google',
            isVerified: true, // Google reviews are verified
            isApproved: true, // Auto-approve Google reviews
          });
        }
      }

      /* ── 5. Create hotel record with reviews ── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hotel = await (prisma as any).hotel.create({
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
          googlePlaceId:    placeId,
          amenities:        '[]',
          status:           'active',
          descriptionShort: `${category} in ${city}, ${country}`,
          descriptionLong:  `${p.name} is a ${stars}-star ${category.toLowerCase()} located in ${city}, ${country}. ${p.rating ? `Rated ${p.rating.toFixed(1)}/5 by ${(p.user_ratings_total ?? 0).toLocaleString()} guests on Google.` : ''} Imported via Google Places.`,
          isFeatured:       false,
          avgRating:        p.rating || null,
          reviewCount:      reviewsData.length,
          photos: extraPhotos.length > 0 ? {
            create: extraPhotos.map((url, idx) => ({ url, displayOrder: idx })),
          } : undefined,
          roomTypes: {
            create: [{
              name:          'Standard Room',
              description:   'Standard room imported from Google Places.',
              pricePerNight: price,
              displayOrder:  0,
            }],
          },
          reviews: reviewsData.length > 0 ? {
            create: reviewsData,
          } : undefined,
        },
      });

      importResults.push({
        placeId,
        success:    true,
        hotelId:    hotel.id,
        hotelSlug:  hotel.slug,
        name:       hotel.name,
        city:       hotel.city,
        country:    hotel.country,
        coverImage: hotel.coverImage,
        reviewsImported: reviewsData.length,
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      importResults.push({ placeId, success: false, error: msg });
    }
  }

  const succeeded = importResults.filter((r) => r.success).length;
  const skipped   = importResults.filter((r) => !r.success && (r as { skipped?: boolean }).skipped).length;
  const failed    = importResults.filter((r) => !r.success && !(r as { skipped?: boolean }).skipped).length;
  const totalReviews = importResults
    .filter((r) => r.success)
    .reduce((sum, r) => sum + ((r as { reviewsImported: number }).reviewsImported ?? 0), 0);

  return NextResponse.json({ 
    results: importResults, 
    succeeded, 
    skipped, 
    failed,
    reviewsImported: totalReviews,
  }, { status: 201 });
}
