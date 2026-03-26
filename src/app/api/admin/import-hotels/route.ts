export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { fetchNearbyLandmarks } from '@/lib/landmarks';

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

/**
 * Extract Place ID from various Google Maps URL formats:
 * - https://www.google.com/maps/place/...!1s<place_id>...
 * - https://www.google.com/maps/place/.../data=!4m...!1s<place_id>...
 * - https://maps.google.com/?cid=...
 * - https://www.google.com/maps?q=place_id:<place_id>
 * - https://goo.gl/maps/... (shortened URL - requires following redirect)
 * - https://maps.app.goo.gl/... (shortened URL - requires following redirect)
 * - Direct Place ID (ChIJ...)
 */
async function extractPlaceIdFromUrl(url: string): Promise<string | null> {
  const trimmed = url.trim();
  
  // Check if it's already a Place ID (starts with ChIJ or 0x and is ~27 chars)
  if (/^(ChIJ[A-Za-z0-9_-]{20,}|0x[A-Fa-f0-9]+:0x[A-Fa-f0-9]+)$/i.test(trimmed)) {
    return trimmed;
  }
  
  // Try to parse as URL
  let targetUrl = trimmed;
  
  // Handle shortened URLs (goo.gl/maps, maps.app.goo.gl)
  if (trimmed.includes('goo.gl/maps') || trimmed.includes('maps.app.goo.gl')) {
    try {
      // Use GET request as some URL shorteners don't respond to HEAD
      const res = await fetch(trimmed, { 
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BusyBedsBot/1.0)',
          'Accept': 'text/html',
        },
      });
      targetUrl = res.url;
      console.log(`[URL Resolve] Shortened URL ${trimmed} resolved to: ${targetUrl}`);
    } catch (err) {
      console.error(`[URL Resolve] Failed to resolve shortened URL:`, err);
      // If redirect fails, try to use the URL as-is
    }
  }
  
  // Extract Place ID from URL patterns
  
  // Pattern 1: !1s<place_id> in data parameter (most common)
  const dataPlaceIdMatch = targetUrl.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
  if (dataPlaceIdMatch) return dataPlaceIdMatch[1];
  
  // Pattern 1b: !1s0x...:0x... format (hex coordinates as place ID)
  const hexPlaceIdMatch = targetUrl.match(/!1s(0x[A-Fa-f0-9]+:0x[A-Fa-f0-9]+)/i);
  if (hexPlaceIdMatch) return hexPlaceIdMatch[1];
  
  // Pattern 2: Look for place_id in various positions
  // !4m2!3m1!1s<place_id> or similar patterns
  const placeIdInData = targetUrl.match(/!1s([A-Za-z0-9_-]{20,})/);
  if (placeIdInData && placeIdInData[1].startsWith('ChIJ')) {
    return placeIdInData[1];
  }
  
  // Pattern 3: ?cid= parameter (CID is different from Place ID, need to convert)
  const cidMatch = targetUrl.match(/[?&]cid=(\d+)/);
  if (cidMatch) {
    // CID can be used to look up Place ID via Places API
    // Return the CID - we'll need to convert it via API
    return `cid:${cidMatch[1]}`;
  }
  
  // Pattern 4: place_id=<place_id> parameter
  const placeIdParamMatch = targetUrl.match(/[?&]place_id=([A-Za-z0-9_-]+)/);
  if (placeIdParamMatch) return placeIdParamMatch[1];
  
  // Pattern 5: /place/.../@lat,lng or /place/name
  // Try to extract coordinates and use reverse geocoding
  const coordMatch = targetUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `coords:${coordMatch[1]},${coordMatch[2]}`;
  }
  
  // Pattern 6: /maps/search/<query>
  const searchMatch = targetUrl.match(/\/maps\/search\/([^/@]+)/);
  if (searchMatch) {
    return `search:${decodeURIComponent(searchMatch[1])}`;
  }
  
  // Pattern 7: /place/<name> without other identifiers - extract the place name
  const placeNameMatch = targetUrl.match(/\/maps\/place\/([^/@]+)/);
  if (placeNameMatch) {
    return `placename:${decodeURIComponent(placeNameMatch[1])}`;
  }
  
  // Pattern 8: Look for any ChIJ pattern anywhere in the URL
  const anyPlaceIdMatch = targetUrl.match(/(ChIJ[A-Za-z0-9_-]{20,})/);
  if (anyPlaceIdMatch) return anyPlaceIdMatch[1];
  
  return null;
}

/**
 * Decode hex location format (0x...:0x...) to approximate lat/lng
 * This is Google's internal format for locations without a proper Place ID
 */
function decodeHexLocation(hexLocation: string): { lat: number; lng: number } | null {
  // Format: 0xHEX_LNG:0xHEX_LAT
  const match = hexLocation.match(/0x([a-fA-F0-9]+):0x([a-fA-F0-9]+)/);
  if (!match) return null;
  
  try {
    // Google encodes coordinates as hex integers representing microdegrees
    // The first part is longitude, second is latitude
    const lngHex = match[1];
    const latHex = match[2];
    
    // Convert hex to integer, then to microdegrees (divide by 1e6)
    const lng = parseInt(lngHex, 16) / 1e6;
    const lat = parseInt(latHex, 16) / 1e6;
    
    // Validate coordinates are in reasonable range
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    
    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Resolve a Place ID from CID, coordinates, or search query
 */
async function resolvePlaceId(
  input: string, 
  apiKey: string
): Promise<{ placeId: string; name?: string } | null> {
  console.log(`[resolvePlaceId] Resolving: ${input}`);
  
  // Already a valid Place ID (ChIJ format)
  if (input.startsWith('ChIJ')) {
    return { placeId: input };
  }
  
  // Handle CID (Google Maps Customer ID)
  if (input.startsWith('cid:')) {
    const cid = input.replace('cid:', '');
    // CID can be converted to a location-based search
    // Use the Geocoding API to convert CID to coordinates
    try {
      const params = new URLSearchParams({
        place_id: cid,
        key: apiKey,
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      const data = await res.json();
      if (data.results?.[0]?.place_id) {
        return { placeId: data.results[0].place_id };
      }
    } catch {
      // Fall through to return null
    }
    return null;
  }
  
  // Handle coordinates
  if (input.startsWith('coords:')) {
    const [lat, lng] = input.replace('coords:', '').split(',').map(Number);
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: '500',
      type: 'lodging',
      key: apiKey,
    });
    const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`);
    const data = await res.json();
    console.log(`[resolvePlaceId] Nearby search result:`, data.status);
    if (data.results?.[0]?.place_id) {
      return { 
        placeId: data.results[0].place_id,
        name: data.results[0].name,
      };
    }
    return null;
  }
  
  // Handle search query
  if (input.startsWith('search:') || input.startsWith('placename:')) {
    const query = input.replace(/^(search|placename):/, '');
    const params = new URLSearchParams({
      query: `${query} hotel lodge resort`,
      type: 'lodging',
      key: apiKey,
    });
    const res = await fetch(`${PLACES_BASE}/textsearch/json?${params}`);
    const data = await res.json();
    console.log(`[resolvePlaceId] Text search result for "${query}":`, data.status);
    if (data.results?.[0]?.place_id) {
      return { 
        placeId: data.results[0].place_id,
        name: data.results[0].name,
      };
    }
    return null;
  }
  
  // Handle 0x:0x format (hex coordinates)
  if (input.startsWith('0x') && input.includes(':0x')) {
    // Try to decode hex location to lat/lng
    const decoded = decodeHexLocation(input);
    if (decoded) {
      console.log(`[resolvePlaceId] Decoded hex location to: ${decoded.lat}, ${decoded.lng}`);
      // Use nearby search to find the actual place
      const params = new URLSearchParams({
        location: `${decoded.lat},${decoded.lng}`,
        radius: '200',
        type: 'lodging',
        key: apiKey,
      });
      const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`);
      const data = await res.json();
      if (data.results?.[0]?.place_id) {
        return { 
          placeId: data.results[0].place_id,
          name: data.results[0].name,
        };
      }
    }
    // If decoding fails, try using it directly (sometimes works)
    return { placeId: input };
  }
  
  return null;
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
   GET /api/admin/import-hotels?q=...&pagetoken=...&fetchAll=true&url=...
   → Text-search Google Places and return candidate results.
     Results include alreadyImported flag based on googlePlaceId.
     If fetchAll=true, automatically fetches all 3 pages (up to 60 results).
     If url=..., extract Place ID from Google Maps URL and return single result.
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
  const fetchAll  = searchParams.get('fetchAll') === 'true';
  const urlParam  = searchParams.get('url')?.trim(); // Google Maps URL or Place ID

  // ── Handle Google Maps URL or direct Place ID ──────────────────
  if (urlParam && !q) {
    try {
      console.log(`[Import] Processing URL: ${urlParam}`);
      const extractedId = await extractPlaceIdFromUrl(urlParam);
      console.log(`[Import] Extracted ID: ${extractedId}`);
      
      if (!extractedId) {
        return NextResponse.json({
          error: 'Could not extract Place ID from URL. Please try searching instead.',
          hint: 'Supported formats: Google Maps URLs, goo.gl/maps links, or Place IDs (ChIJ...)',
        }, { status: 400 });
      }
      
      // Resolve the Place ID (handles coords, search, etc.)
      const resolved = await resolvePlaceId(extractedId, key);
      console.log(`[Import] Resolved:`, resolved);
      
      if (!resolved) {
        return NextResponse.json({
          error: 'Could not find the hotel from this URL. Try searching by name instead.',
          extractedData: extractedId,
        }, { status: 404 });
      }
      
      const { placeId, name: foundName } = resolved;
      
      // Check if already imported
      const existing = await prisma.hotel.findFirst({
        where: { googlePlaceId: placeId },
        select: { googlePlaceId: true, name: true, slug: true },
      });
      
      if (existing) {
        return NextResponse.json({
          results: [{
            placeId,
            name: existing.name,
            address: 'Already imported',
            lat: 0,
            lng: 0,
            rating: null,
            reviewCount: null,
            priceLevel: null,
            photoUrl: null,
            types: [],
            category: 'Hotel',
            estimatedPrice: 0,
            alreadyImported: true,
            existingSlug: existing.slug,
          }],
          nextPageToken: null,
          total: 1,
          source: 'url',
          message: `This hotel is already imported as "${existing.name}"`,
        });
      }
      
      // Fetch Place Details to get full info
      console.log(`[Import] Fetching place details for: ${placeId}`);
      const detailParams = new URLSearchParams({
        place_id: placeId,
        fields: [
          'name', 'formatted_address', 'address_components',
          'geometry', 'rating', 'user_ratings_total',
          'photos', 'price_level', 'types',
        ].join(','),
        key,
      });
      const detailUrl = `${PLACES_BASE}/details/json?${detailParams}`;
      console.log(`[Import] Detail API URL (without key): ${PLACES_BASE}/details/json?place_id=${placeId}&fields=...`);
      
      const detailRes = await fetch(detailUrl);
      const detail = await detailRes.json();
      console.log(`[Import] Detail API response:`, detail.status, detail.error_message || '');
      
      if (detail.status !== 'OK' || !detail.result) {
        return NextResponse.json({
          error: `Failed to fetch hotel details: ${detail.status}`,
          errorDetails: detail.error_message,
          placeId,
          extractedData: extractedId,
        }, { status: 502 });
      }
      
      const p = detail.result;
      const photoRef = p.photos?.[0]?.photo_reference;
      const photoUrl = photoRef ? await resolvePhotoUrl(photoRef) : null;
      
      return NextResponse.json({
        results: [{
          placeId,
          name: p.name,
          address: p.formatted_address,
          lat: p.geometry?.location?.lat ?? 0,
          lng: p.geometry?.location?.lng ?? 0,
          rating: p.rating ?? null,
          reviewCount: p.user_ratings_total ?? null,
          priceLevel: p.price_level ?? null,
          photoUrl,
          types: p.types ?? [],
          category: mapCategory(p.types ?? []),
          estimatedPrice: mapPrice(p.price_level, p.rating),
          alreadyImported: false,
        }],
        nextPageToken: null,
        total: 1,
        source: 'url',
        urlResolved: foundName || p.name,
      });
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json({ error: `Failed to process URL: ${msg}` }, { status: 500 });
    }
  }

  if (!q) return NextResponse.json({ error: 'query (q) or url is required' }, { status: 400 });
  
  // Ensure q is a string after the check (TypeScript type narrowing)
  const queryStr: string = q;

  // Helper function to fetch a single page
  async function fetchPage(token: string): Promise<{
    results: typeof rawResults;
    nextPageToken: string | null;
    status: string;
    errorMessage?: string;
  }> {
    const params = new URLSearchParams({ query: queryStr, type: 'lodging', key });
    if (token) params.set('pagetoken', token);

    const raw = await fetch(`${PLACES_BASE}/textsearch/json?${params}`);
    if (!raw.ok) {
      return { results: [], nextPageToken: null, status: 'ERROR', errorMessage: 'Google Places request failed' };
    }

    const json = await raw.json();
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      return { 
        results: [], 
        nextPageToken: null, 
        status: json.status, 
        errorMessage: json.error_message 
      };
    }

    return {
      results: json.results ?? [],
      nextPageToken: json.next_page_token || null,
      status: json.status,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawResults: any[] = [];
  let currentToken: string = pagetoken;
  let finalNextPageToken: string | null = null;
  let lastError: { status: string; errorMessage?: string } | null = null;

  // If fetchAll is true, fetch all 3 pages (Google limits to 60 results max)
  const maxPages = fetchAll ? 3 : 1;
  let pagesFetched = 0;

  do {
    // Google requires a delay between paginated requests (they need time to prepare next page)
    if (currentToken && pagesFetched > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }

    const pageResult = await fetchPage(currentToken);
    
    if (pageResult.status !== 'OK' && pageResult.status !== 'ZERO_RESULTS') {
      lastError = { status: pageResult.status, errorMessage: pageResult.errorMessage };
      break;
    }

    rawResults = rawResults.concat(pageResult.results);
    finalNextPageToken = pageResult.nextPageToken;
    currentToken = pageResult.nextPageToken || '';
    pagesFetched++;
  } while (fetchAll && currentToken && pagesFetched < maxPages);

  // If not fetchAll and we have a pagetoken, use the normal flow
  if (!fetchAll && pagetoken) {
    const pageResult = await fetchPage(pagetoken);
    if (pageResult.status !== 'OK' && pageResult.status !== 'ZERO_RESULTS') {
      return NextResponse.json(
        { error: `Google Places error: ${pageResult.status} — ${pageResult.errorMessage || ''}` },
        { status: 502 },
      );
    }
    rawResults = pageResult.results;
    finalNextPageToken = pageResult.nextPageToken;
  }

  if (lastError && rawResults.length === 0) {
    return NextResponse.json(
      { error: `Google Places error: ${lastError.status} — ${lastError.errorMessage || ''}` },
      { status: 502 },
    );
  }

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
    nextPageToken: finalNextPageToken,
    total:         results.length,
    pagesFetched,
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
  const noDiscount: boolean     = body.noDiscount === true; // If true, discountPercent = 0
  const discountPercent: number = noDiscount ? 0 : (Number(body.discountPercent) || 15);
  const couponValidDays: number = Number(body.couponValidDays) || 30;
  const pricePerNight: number   = Number(body.pricePerNight)   || 0;
  const categoryOverride: string | undefined = body.category; // Manual category override
  const importReviews: boolean  = body.importReviews !== false; // Default: true
  const importLandmarks: boolean = body.importLandmarks !== false; // Default: true
  const markAsPartner: boolean  = body.markAsPartner === true; // Default: false (LISTING_ONLY)
  const partnershipStatus = markAsPartner ? 'ACTIVE' : 'LISTING_ONLY';

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
    | { placeId: string; success: true; hotelId: string; hotelSlug: string; name: string; city: string; country: string; coverImage: string | null; reviewsImported: number; landmarksImported: number }
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
        // Generate all googleReviewIds first
        const reviewIds = (p.reviews as GoogleReview[]).slice(0, 5).map(rev => ({
          rev,
          googleReviewId: generateGoogleReviewId(placeId, rev.author_name, rev.time),
        }));
        
        // Check which review IDs already exist in DB
        const existingReviews = await prisma.review.findMany({
          where: {
            googleReviewId: { in: reviewIds.map(r => r.googleReviewId) },
          },
          select: { googleReviewId: true },
        });
        const existingReviewIds = new Set(existingReviews.map(r => r.googleReviewId));
        
        // Only include reviews that don't already exist
        for (const { rev, googleReviewId } of reviewIds) {
          if (existingReviewIds.has(googleReviewId)) {
            console.log(`[Import] Skipping duplicate review: ${googleReviewId}`);
            continue;
          }
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

      /* ── 5. Create hotel record (reviews created separately) ── */
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
          partnershipStatus, // LISTING_ONLY by default, ACTIVE if markAsPartner is true
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
        },
      });

      // Create reviews separately with skipDuplicates to handle edge cases
      let reviewsImported = 0;
      if (reviewsData.length > 0) {
        try {
          await prisma.review.createMany({
            data: reviewsData.map(r => ({
              ...r,
              hotelId: hotel.id,
            })),
            skipDuplicates: true,
          });
          reviewsImported = reviewsData.length;
        } catch (reviewError) {
          console.error(`[Import] Review creation error for ${hotel.name}:`, reviewError);
          // Don't fail the whole import if reviews fail
        }
      }

      /* ── 6. Fetch and store nearby landmarks ── */
      let landmarksImported = 0;
      if (importLandmarks && hotel.latitude && hotel.longitude) {
        try {
          const landmarks = await fetchNearbyLandmarks(
            hotel.latitude,
            hotel.longitude,
            key,
            5,    // 5km radius
            10,   // Minimum 10 ratings for "popular"
            3,    // Max 3 per type
          );

          if (landmarks.length > 0) {
            // Create landmarks for this hotel one by one to handle duplicates with SQLite
            for (const landmark of landmarks) {
              try {
                await prisma.landmark.create({
                  data: {
                    hotelId: hotel.id,
                    googlePlaceId: landmark.googlePlaceId,
                    name: landmark.name,
                    type: landmark.type,
                    typeName: landmark.typeName,
                    address: landmark.address,
                    latitude: landmark.latitude,
                    longitude: landmark.longitude,
                    distanceKm: landmark.distanceKm,
                    rating: landmark.rating,
                    totalRatings: landmark.totalRatings,
                    photoUrl: landmark.photoUrl,
                  },
                });
                landmarksImported++;
              } catch {
                // Skip duplicates silently
              }
            }
            console.log(`[Import] Added ${landmarks.length} landmarks for ${hotel.name}`);
          }
        } catch (landmarkError) {
          console.error(`[Import] Failed to fetch landmarks for ${hotel.name}:`, landmarkError);
          // Don't fail the whole import if landmarks fail
        }
      }

      importResults.push({
        placeId,
        success:    true,
        hotelId:    hotel.id,
        hotelSlug:  hotel.slug,
        name:       hotel.name,
        city:       hotel.city,
        country:    hotel.country,
        coverImage: hotel.coverImage,
        reviewsImported,
        landmarksImported,
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
  const totalLandmarks = importResults
    .filter((r) => r.success)
    .reduce((sum, r) => sum + ((r as { landmarksImported: number }).landmarksImported ?? 0), 0);

  return NextResponse.json({ 
    results: importResults, 
    succeeded, 
    skipped, 
    failed,
    reviewsImported: totalReviews,
    landmarksImported: totalLandmarks,
  }, { status: 201 });
}
