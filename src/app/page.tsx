export const revalidate = 0;

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Logo from '@/components/Logo';
import HotelCard from '@/components/HotelCard';
import HotelViewContainer from '@/components/HotelViewContainer';
import RecentlyViewed from '@/components/RecentlyViewed';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import FlashDealsWidget from '@/components/FlashDealsWidget';
import NearMeButton from '@/components/NearMeButton';
import ViewToggle from '@/components/ViewToggle';
import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { VIBE_TAGS } from '@/lib/vibeTags';

const PAGE_SIZE = 18;

/* ─────────────────────────────────────────────────────────
   Thin-stroke SVG icons for hotel type category bar
───────────────────────────────────────────────────────── */
function CategoryIcon({ icon, size = 24 }: { icon: string; size?: number }) {
  const s = size;
  const sw = 1.5;
  switch (icon) {
    case 'hotel': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M9 15h6"/>
      </svg>
    );
    case 'villa': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12L12 4l9 8"/><rect x="5" y="12" width="14" height="9"/><rect x="9" y="16" width="3" height="5"/><rect x="14" y="14" width="3" height="3"/>
      </svg>
    );
    case 'apartment': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="12" height="19"/><path d="M14 8h6v14H14"/><path d="M6 8v1M6 12v1M6 16v1M10 8v1M10 12v1M10 16v1M17 12v1M17 16v1"/>
      </svg>
    );
    case 'bnb': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20v-8l10-8 10 8v8"/><path d="M2 20h20"/><rect x="7" y="14" width="4" height="6"/><path d="M15 10h4v4h-4z"/>
      </svg>
    );
    case 'lodge': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V9l9-6 9 6v12"/><path d="M9 21V12h6v9"/><path d="M2 10l10-7 10 7"/>
      </svg>
    );
    case 'resort': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M12 12v10"/><path d="M8 22h8"/><path d="M4 10c2-1 4.5-1 8 1s6 2 8 1"/>
      </svg>
    );
    case 'hostel': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M7 4v6M17 4v6M7 14h4M7 17h4M13 14h4M13 17h4"/>
      </svg>
    );
    case 'guesthouse': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18"/><path d="M10 21v-7h4v7"/><circle cx="12" cy="11" r="1.5"/>
      </svg>
    );
    case 'boutique': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V9l9-6 9 6v13"/><path d="M3 22h18"/><path d="M9 22v-6h6v6"/>
        <path d="M12 3l1.2 2.5H16l-2 1.8.8 2.7L12 8.5l-2.8 1.5.8-2.7L8 5.5h2.8z"/>
      </svg>
    );
    case 'motel': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="12" rx="1"/><path d="M2 11h20"/><path d="M6 7V5m4 2V5m4 2V5m4 2V5"/><path d="M5 15h2M9 15h2M13 15h2M17 15h2"/>
      </svg>
    );
    case 'camping': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 20h20L12 2z"/><path d="M12 2v18"/><path d="M2 20h20"/>
      </svg>
    );
    case 'beach': return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.657 6.343A8 8 0 106.343 17.657"/><path d="M12 12l5.657-5.657"/><path d="M2 22h20"/>
      </svg>
    );
    default: return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   Data fetchers
───────────────────────────────────────────────────────── */
async function getHotelTypes() {
  try {
    return await prisma.hotelType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  } catch { return []; }
}

async function getTrending() {
  try {
    return await prisma.hotel.findMany({
      where: { status: 'active', avgRating: { not: null } },
      include: {
        roomTypes: { orderBy: { displayOrder: 'asc' }, take: 1 },
        photos: { orderBy: { displayOrder: 'asc' }, take: 1 },
      },
      orderBy: [{ reviewCount: 'desc' }, { avgRating: 'desc' }, { isFeatured: 'desc' }],
      take: 8,
    });
  } catch { return []; }
}

async function getFeaturedHotels() {
  try {
    const now = new Date();
    // Get hotels with active subscriptions OR admin featured
    const hotels = await prisma.hotel.findMany({
      where: {
        status: 'active',
        OR: [
          // Hotels with active subscription
          {
            subscription: {
              status: 'active',
              currentPeriodEnd: { gt: now },
              tier: { featuredOnHomepage: true },
            },
          },
          // Admin featured hotels
          {
            adminFeatured: true,
            OR: [
              { adminFeaturedUntil: null },
              { adminFeaturedUntil: { gt: now } },
            ],
          },
        ],
      },
      include: {
        roomTypes: { orderBy: { displayOrder: 'asc' }, take: 1 },
        photos: { orderBy: { displayOrder: 'asc' }, take: 1 },
        subscription: {
          include: { tier: { select: { name: true, displayName: true, showVerifiedBadge: true } } },
        },
      },
      orderBy: [
        // Premium > Growth > Starter > Admin Featured
        { subscription: { tier: { featuredPriority: 'desc' } } },
        { avgRating: 'desc' },
      ],
      take: 12,
    });
    return hotels;
  } catch { return []; }
}

/* Haversine distance in km */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getHotels(
  page: number = 1,
  search?: string,
  city?: string,
  stars?: string,           // comma-separated: "3,4,5"
  minDiscount?: string,
  featured?: string,
  amenities?: string,       // comma-separated: "WiFi,Pool"
  category?: string,
  minPrice?: string,
  maxPrice?: string,
  sort?: string,
  vibeTag?: string,         // single vibe tag id
  lat?: string,             // Near Me Now latitude
  lng?: string,             // Near Me Now longitude
  radius?: string,          // km radius (default 50)
) {
  const starsArr    = stars ? stars.split(',').map(s => parseInt(s)).filter(Boolean) : [];
  const discountNum = minDiscount ? parseInt(minDiscount) : undefined;
  const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
  const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;
  const amenityArr  = amenities ? amenities.split(',').filter(Boolean) : [];
  const latNum      = lat ? parseFloat(lat) : undefined;
  const lngNum      = lng ? parseFloat(lng) : undefined;
  const radiusNum   = radius ? parseFloat(radius) : 50;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { status: 'active' };

  if (starsArr.length === 1)  where.starRating = starsArr[0];
  if (starsArr.length > 1)    where.starRating = { in: starsArr };
  if (discountNum)             where.discountPercent = { gte: discountNum };
  if (featured)                where.isFeatured = true;
  if (category && category !== 'all') where.category = category;

  if (search) {
    where.OR = [
      { name:    { contains: search } },
      { city:    { contains: search } },
      { country: { contains: search } },
      { descriptionShort: { contains: search } },
    ];
  }
  if (city) where.city = { contains: city };

  /* each amenity must appear in the JSON string */
  if (amenityArr.length === 1) {
    where.amenities = { contains: amenityArr[0] };
  } else if (amenityArr.length > 1) {
    where.AND = amenityArr.map((a: string) => ({ amenities: { contains: a } }));
  }

  /* vibe tag filter */
  if (vibeTag) {
    const existing = where.AND as Array<Record<string, unknown>> | undefined;
    const vibeFilter = { vibeTags: { contains: vibeTag } };
    where.AND = existing ? [...existing, vibeFilter] : [vibeFilter];
  }

  /* price range — filter on related roomTypes */
  if (minPriceNum !== undefined || maxPriceNum !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPriceNum !== undefined) priceFilter.gte = minPriceNum;
    if (maxPriceNum !== undefined) priceFilter.lte = maxPriceNum;
    where.roomTypes = { some: { pricePerNight: priceFilter } };
  }

  /* Near Me Now: require geo data */
  if (latNum !== undefined && lngNum !== undefined) {
    where.latitude  = { not: null };
    where.longitude = { not: null };
  }

  /* sort order */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any[];
  switch (sort) {
    case 'rating':   orderBy = [{ avgRating: 'desc' }, { reviewCount: 'desc' }]; break;
    case 'discount': orderBy = [{ discountPercent: 'desc' }]; break;
    default:
      // Default 4-tier priority:
      // Tier 1: Featured + ACTIVE + discount > 0
      // Tier 2: ACTIVE + discount > 0 (non-featured)
      // Tier 3: ACTIVE + no discount
      // Tier 4: LISTING_ONLY / INACTIVE
      // Within each tier: adminFeatured → subscriptionBoost → rating
      orderBy = [
        { isFeatured: 'desc' },
        { discountPercent: 'desc' },
        { avgRating: 'desc' },
        { createdAt: 'desc' },
      ];
  }

  // Sequential queries to avoid connection pool exhaustion on Supabase (connection_limit=1)
  const rawHotels = await prisma.hotel.findMany({
    where,
    include: {
      roomTypes: { orderBy: { displayOrder: 'asc' }, take: 1 },
      photos:    { orderBy: { displayOrder: 'asc' }, take: 5 },
      subscription: {
        where: { status: 'active' },
        include: {
          tier: {
            select: {
              name: true,
              displayName: true,
              searchBoost: true,
              showVerifiedBadge: true,
            }
          }
        }
      }
    },
    orderBy,
    skip:  latNum !== undefined ? 0 : (page - 1) * PAGE_SIZE, // fetch all for geo sort
    take:  latNum !== undefined ? 1000 : PAGE_SIZE,
  });
  const total = await prisma.hotel.count({ where });

  // Transform and boost by subscription
  let processedHotels = rawHotels.map(h => ({
    ...h,
    subscription: (h.subscription as unknown as Array<{ tier: { searchBoost: number } }>)?.[0] || null,
    _boostScore: (h.subscription as unknown as Array<{ tier: { searchBoost: number } }>)?.[0]?.tier?.searchBoost || 0,
  }));

  // Apply full 4-tier priority sort (overrides DB orderBy for precise control)
  if (!sort || sort === 'best') {
    processedHotels.sort((a, b) => {
      // Compute tier: lower number = higher priority
      const tierOf = (h: typeof processedHotels[0]) => {
        const isActive = h.partnershipStatus === 'ACTIVE';
        const hasCoupon = isActive && h.discountPercent > 0;
        const isFeat   = h.adminFeatured || h.isFeatured;
        if (isFeat && hasCoupon)  return 1; // Featured + partner + coupon
        if (hasCoupon)            return 2; // Active partner + coupon
        if (isActive)             return 3; // Active partner, no coupon
        return 4;                           // LISTING_ONLY / INACTIVE
      };
      const ta = tierOf(a), tb = tierOf(b);
      if (ta !== tb) return ta - tb;
      // Within same tier: subscription boost → rating
      if (a._boostScore !== b._boostScore) return b._boostScore - a._boostScore;
      return (b.avgRating || 0) - (a.avgRating || 0);
    });
  }

  /* Near Me Now: filter + sort by distance */
  if (latNum !== undefined && lngNum !== undefined) {
    const withDist = processedHotels
      .filter(h => h.latitude != null && h.longitude != null)
      .map(h => ({ ...h, _distKm: haversine(latNum, lngNum, h.latitude!, h.longitude!) }))
      .filter(h => h._distKm <= radiusNum)
      .sort((a, b) => a._distKm - b._distKm);
    const paged = withDist.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { hotels: paged, total: withDist.length };
  }

  /* client-side price sort (prices live on roomTypes relation) */
  let hotels = processedHotels;
  if (sort === 'price_asc' || sort === 'price_desc') {
    hotels = [...processedHotels].sort((a, b) => {
      const pa = a.roomTypes[0]?.pricePerNight ?? 0;
      const pb = b.roomTypes[0]?.pricePerNight ?? 0;
      return sort === 'price_asc' ? pa - pb : pb - pa;
    });
  }

  return { hotels, total };
}

async function getCities() {
  try {
    const rows = await prisma.hotel.findMany({ where: { status: 'active' }, select: { city: true }, distinct: ['city'] });
    return rows.map(h => h.city);
  } catch { return []; }
}

/* Fetch LISTING_ONLY hotels grouped by city for regional sections.
   Returns top cities (by hotel count) with up to REGION_LIMIT hotels each. */
const REGION_LIMIT = 6;
const MAX_REGIONS  = 4;

async function getRegionalListings() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hotels = await (prisma as any).hotel.findMany({
      where: {
        status: 'active',
        partnershipStatus: { in: ['LISTING_ONLY', 'INACTIVE'] },
        coverImage: { not: null }, // only hotels with photos
      },
      include: {
        roomTypes: { orderBy: { displayOrder: 'asc' }, take: 1 },
        photos:    { orderBy: { displayOrder: 'asc' }, take: 1 },
      },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
    });

    // Group by city
    const byCity = new Map<string, typeof hotels>();
    for (const h of hotels) {
      const key = `${h.city}, ${h.country}`;
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key)!.push(h);
    }

    // Sort cities by hotel count (most hotels first), take top MAX_REGIONS
    const sorted = Array.from(byCity.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, MAX_REGIONS);

    return sorted.map(([region, regionHotels]) => ({
      region,
      hotels: regionHotels.slice(0, REGION_LIMIT),
      total: regionHotels.length,
    }));
  } catch { return []; }
}

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */
export default async function HomePage({
  searchParams,
}: {
  searchParams: {
    search?: string; city?: string; stars?: string; minDiscount?: string;
    page?: string; featured?: string; amenities?: string; category?: string;
    minPrice?: string; maxPrice?: string; sort?: string;
    vibeTag?: string; lat?: string; lng?: string; radius?: string;
    view?: string;
  };
}) {
  const currentPage    = searchParams.page ? parseInt(searchParams.page) : 1;
  const activeCategory = searchParams.category || 'all';
  const nearMe = !!(searchParams.lat && searchParams.lng);
  const viewMode = searchParams.view === 'map' ? 'map' : 'list';

  /* detect if ANY filter/search is active — map view also uses filtered layout */
  const isFiltered = !!(
    searchParams.search || searchParams.city || searchParams.stars ||
    searchParams.minDiscount || searchParams.featured || searchParams.amenities ||
    (searchParams.category && searchParams.category !== 'all') ||
    searchParams.minPrice || searchParams.maxPrice || searchParams.sort ||
    searchParams.vibeTag || nearMe || viewMode === 'map'
  );

  // Sequential to avoid connection pool exhaustion (Supabase connection_limit=1)
  const { hotels, total } = await getHotels(
    currentPage,
    searchParams.search, searchParams.city, searchParams.stars,
    searchParams.minDiscount, searchParams.featured, searchParams.amenities,
    searchParams.category, searchParams.minPrice, searchParams.maxPrice,
    searchParams.sort, searchParams.vibeTag,
    searchParams.lat, searchParams.lng, searchParams.radius,
  ).catch(() => ({ hotels: [], total: 0 }));
  const cities          = await getCities();
  const hotelTypes      = await getHotelTypes();
  const trending        = isFiltered ? [] : await getTrending();
  const featured        = isFiltered ? [] : await getFeaturedHotels();
  const regionalListings = isFiltered ? [] : await getRegionalListings();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* Build URL helper (preserves existing params) */
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = { ...searchParams, ...overrides };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && k !== 'page') params.set(k, v);
    }
    if (overrides.page) params.set('page', overrides.page);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  /* Active filter chips */
  const activeChips: { label: string; removeKey: string }[] = [];
  if (searchParams.search)      activeChips.push({ label: `"${searchParams.search}"`,       removeKey: 'search' });
  if (searchParams.city)        activeChips.push({ label: searchParams.city,                 removeKey: 'city' });
  if (searchParams.stars)       activeChips.push({ label: `${searchParams.stars}★`,          removeKey: 'stars' });
  if (searchParams.minDiscount) activeChips.push({ label: `${searchParams.minDiscount}%+ off`, removeKey: 'minDiscount' });
  if (searchParams.minPrice || searchParams.maxPrice) {
    const label = searchParams.minPrice && searchParams.maxPrice
      ? `$${searchParams.minPrice}–$${searchParams.maxPrice}`
      : searchParams.minPrice ? `From $${searchParams.minPrice}` : `Up to $${searchParams.maxPrice}`;
    activeChips.push({ label, removeKey: '_price' });
  }
  if (searchParams.amenities) {
    searchParams.amenities.split(',').filter(Boolean).forEach(a =>
      activeChips.push({ label: a, removeKey: `amenity_${a}` }),
    );
  }
  if (searchParams.sort && searchParams.sort !== 'best') {
    const sortLabels: Record<string, string> = {
      rating: 'Highest rated', price_asc: 'Price ↑', price_desc: 'Price ↓', discount: 'Most discounted',
    };
    activeChips.push({ label: sortLabels[searchParams.sort] || searchParams.sort, removeKey: 'sort' });
  }
  if (searchParams.vibeTag) {
    const vt = VIBE_TAGS.find(v => v.id === searchParams.vibeTag);
    if (vt) activeChips.push({ label: `${vt.emoji} ${vt.label}`, removeKey: 'vibeTag' });
  }
  if (nearMe) activeChips.push({ label: '📍 Near Me', removeKey: '_nearme' });

  const removeChip = (key: string) => {
    if (key === '_price') return buildHref({ minPrice: undefined, maxPrice: undefined, page: undefined });
    if (key === '_nearme') return buildHref({ lat: undefined, lng: undefined, radius: undefined, page: undefined });
    if (key.startsWith('amenity_')) {
      const a = key.slice(8);
      const remaining = (searchParams.amenities || '').split(',').filter(x => x && x !== a).join(',');
      return buildHref({ amenities: remaining || undefined, page: undefined });
    }
    return buildHref({ [key]: undefined, page: undefined });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════
          STICKY CATEGORY + CONTROLS BAR
      ══════════════════════════════════════════════════════ */}
      <div
        className="sticky z-40"
        style={{
          top: 70,
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-[1760px] mx-auto px-5 sm:px-10">
          <div className="flex items-center h-[56px] gap-0">

            {/* LEFT — scrollable category pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-2">

              {/* All */}
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 text-xs font-semibold ${
                  activeCategory === 'all'
                    ? 'cat-pill-active'
                    : 'text-gray-500 hover:bg-black/[0.05] hover:text-gray-800'
                }`}
              >
                <CategoryIcon icon="all" size={14} />
                All
              </Link>

              {/* Hotel types */}
              {hotelTypes.slice(0, 9).map((ht: { id: string; name: string; icon: string }) => {
                const isActive = activeCategory === ht.name;
                return (
                  <Link
                    key={ht.id}
                    href={`/?category=${encodeURIComponent(ht.name)}`}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 text-xs font-semibold ${
                      isActive
                        ? 'cat-pill-active'
                        : 'text-gray-500 hover:bg-black/[0.05] hover:text-gray-800'
                    }`}
                  >
                    <CategoryIcon icon={ht.icon} size={14} />
                    {ht.name}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-black/10 flex-shrink-0 mx-3" />

            {/* RIGHT — controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">

              {/* Near Me */}
              <Suspense fallback={null}><NearMeButton active={nearMe} /></Suspense>

              {/* View Toggle */}
              <Suspense fallback={null}>
                <ViewToggle currentView={viewMode} />
              </Suspense>

            </div>
          </div>
        </div>
      </div>

      {/* ── Flash Deals (full-width, above main content) ── */}
      {!isFiltered && <FlashDealsWidget />}

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-[1760px] mx-auto px-5 sm:px-10 py-7 pb-24">

        {/* ── Trending this week ── */}
        {!isFiltered && trending.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">🔥</span> Trending this week
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Highest rated · most reviewed</p>
              </div>
              <Link href="/?sort=rating" className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1">
                View all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(trending as any[]).map((hotel, idx) => (
                <Link
                  key={hotel.id}
                  href={`/hotels/${hotel.slug}`}
                  className="flex-shrink-0 w-56 group"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Image */}
                  <div
                    className="relative rounded-2xl overflow-hidden mb-2.5"
                    style={{ height: 148, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                  >
                    <img
                      src={hotel.photos[0]?.url || hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Rating badge */}
                    {hotel.avgRating && (
                      <div
                        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold text-gray-900"
                        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#E8395A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {hotel.avgRating.toFixed(1)}
                      </div>
                    )}

                    {/* Discount pill */}
                    {hotel.discountPercent >= 10 && (
                      <div
                        className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}
                      >
                        {hotel.discountPercent}% off
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-600 transition-colors">{hotel.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{hotel.city}, {hotel.country}</p>
                  {hotel.roomTypes[0] && (
                    <p className="text-xs text-gray-700 font-medium mt-1">
                      <span className="line-through text-gray-400 mr-1">${hotel.roomTypes[0].pricePerNight.toFixed(0)}</span>
                      <span className="font-bold text-gray-900">${Math.round(hotel.roomTypes[0].pricePerNight * (1 - hotel.discountPercent / 100))}</span>
                      <span className="text-gray-400 font-normal">/night</span>
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Hotels (Premium Partners) ── */}
        {!isFiltered && featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">⭐</span> Featured Hotels
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Premium partners · Verified quality</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(featured as any[]).map((hotel, idx) => (
                <Link
                  key={hotel.id}
                  href={`/hotels/${hotel.slug}`}
                  className="group"
                >
                  {/* Image */}
                  <div
                    className="relative rounded-2xl overflow-hidden mb-2"
                    style={{ height: 120, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                  >
                    <img
                      src={hotel.photos[0]?.url || hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Premium badge */}
                    {hotel.subscription?.tier && (
                      <div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ 
                          background: hotel.subscription.tier.name === 'premium' ? '#7C3AED' :
                                     hotel.subscription.tier.name === 'growth' ? '#2563EB' : '#059669',
                          color: 'white',
                        }}
                      >
                        {hotel.subscription.tier.displayName}
                      </div>
                    )}

                    {/* Rating badge */}
                    {hotel.avgRating && (
                      <div
                        className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {hotel.avgRating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-600 transition-colors">{hotel.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{hotel.city}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Active filter chips + results count ── */}
        {(activeChips.length > 0 || total > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <p className="text-sm text-gray-500">
              {total === 0 ? 'No hotels found' : (
                <>
                  <span className="font-bold text-gray-900">{total.toLocaleString()}</span>{' '}
                  hotel{total !== 1 ? 's' : ''}
                  {searchParams.city ? <> in <span className="font-semibold text-gray-800">{searchParams.city}</span></> : ''}
                  {searchParams.category && searchParams.category !== 'all' ? <> · {searchParams.category}</> : ''}
                  {searchParams.search ? <> matching &ldquo;{searchParams.search}&rdquo;</> : ''}
                </>
              )}
            </p>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map(chip => (
                  <Link
                    key={chip.removeKey}
                    href={removeChip(chip.removeKey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold transition-all hover:opacity-90 hover:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)', boxShadow: '0 2px 8px rgba(232,57,90,0.30)' }}
                  >
                    {chip.label}
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </Link>
                ))}
                {activeChips.length > 1 && (
                  <Link href="/" className="text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors ml-1 underline underline-offset-2">
                    Clear all
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Region quick-filter pills (unfiltered only, when cities exist) ── */}
        {!isFiltered && cities.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 mb-7">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1">Browse by city:</span>
            {cities.slice(0, 10).map(c => (
              <Link
                key={c}
                href={`/?city=${encodeURIComponent(c)}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:border-[#E8395A] hover:text-[#E8395A] transition-all"
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {/* ── Hotel grid / empty state ── */}
        {hotels.length === 0 ? (
          <div className="text-center py-28">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(232,57,90,0.08)', border: '1px solid rgba(232,57,90,0.15)' }}
            >
              {nearMe ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E8395A" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E8395A" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {nearMe ? 'No hotels found near you' : 'No hotels found'}
            </h3>
            <p className="text-gray-500 mb-8 text-sm">
              {nearMe
                ? "We couldn't find any hotels within 200km of your location. Try browsing all hotels instead."
                : 'Try adjusting your search or clearing some filters'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-bold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)', boxShadow: '0 4px 20px rgba(232,57,90,0.35)' }}
            >
              {nearMe ? 'Browse all hotels' : 'Clear all filters'}
            </Link>
          </div>
        ) : !isFiltered ? (
          /* ── UNFILTERED HOME: tiered layout ── */
          <div className="space-y-12">

            {/* ── Tier 1 + 2: Partner hotels with coupons ── */}
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const partners = (hotels as any[]).filter(
                h => h.partnershipStatus === 'ACTIVE' && h.discountPercent > 0
              );
              if (!partners.length) return null;
              return (
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-xl">🎟️</span> Partner Hotels — Exclusive Coupons
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {partners.length} hotel{partners.length !== 1 ? 's' : ''} · Get a coupon and save up to{' '}
                        {Math.max(...partners.map((h: any) => h.discountPercent))}% at check-in
                      </p>
                    </div>
                    <Link
                      href="/?minDiscount=1"
                      className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                    >
                      View all
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 gap-y-8">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {partners.map((hotel: any) => (
                      <HotelCard key={hotel.id} hotel={hotel} />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* ── Tier 3: Active partners without coupon ── */}
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const noCoupon = (hotels as any[]).filter(
                h => h.partnershipStatus === 'ACTIVE' && h.discountPercent === 0
              );
              if (!noCoupon.length) return null;
              return (
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-xl">🏨</span> More Partner Hotels
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">Verified partners · contact hotel directly for rates</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 gap-y-8">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {noCoupon.map((hotel: any) => (
                      <HotelCard key={hotel.id} hotel={hotel} />
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* ── Tier 4: Regional sections for LISTING_ONLY ── */}
            {regionalListings.length > 0 && (
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    Explore by Region
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(regionalListings as any[]).map(({ region, hotels: rHotels, total: rTotal }) => (
                  <section key={region}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8395A" strokeWidth={2} strokeLinecap="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {region}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{rTotal} hotel{rTotal !== 1 ? 's' : ''} in this area</p>
                      </div>
                      {rTotal > REGION_LIMIT && (
                        <Link
                          href={`/?city=${encodeURIComponent(region.split(',')[0].trim())}`}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                        >
                          See all {rTotal}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </Link>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 gap-y-8">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(rHotels as any[]).map((hotel: any) => (
                        <HotelCard key={hotel.id} hotel={hotel} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── FILTERED: normal paginated grid ── */
          <HotelViewContainer
            initialHotels={hotels as any[]}
            searchParams={searchParams as Record<string, string | undefined>}
            pageSize={PAGE_SIZE}
            totalHotels={total}
            viewMode={viewMode}
          />
        )}
      </div>

      <PersonalizedRecommendations />

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0D3D5E 0%, #0a2d48 60%, #0D3D5E 100%)',
        }}>
        {/* Subtle mesh */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(at 20% 50%, rgba(232,57,90,0.15) 0px, transparent 55%), radial-gradient(at 80% 20%, rgba(14,124,123,0.20) 0px, transparent 50%)',
        }} />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white/80 mb-5"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            ✦ How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Save up to <span style={{ color: '#E8395A' }}>70%</span> on hotels
          </h2>
          <p className="text-white/60 mb-14 text-base max-w-md mx-auto">
            Three simple steps from subscription to real savings at reception
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                n: '01', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                ),
                title: 'Subscribe',
                desc: 'Pick a monthly plan and instantly unlock exclusive discount coupons for all partner hotels.',
              },
              {
                n: '02', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                ),
                title: 'Get Your QR',
                desc: 'Browse hotels and generate a unique QR coupon instantly — delivered straight to your inbox.',
              },
              {
                n: '03', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M9 12l2 2 4-4"/><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                ),
                title: 'Redeem at Hotel',
                desc: 'Show the QR at check-in. Staff scans it and the discount is applied — no negotiation needed.',
              },
            ].map(({ n, icon, title, desc }) => (
              <div
                key={n}
                className="relative flex flex-col items-center text-center p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {/* Step number */}
                <span className="absolute top-5 right-6 text-5xl font-black text-white/[0.06] select-none">{n}</span>

                {/* Icon circle */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5"
                  style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)', boxShadow: '0 6px 20px rgba(232,57,90,0.40)' }}
                >
                  {icon}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/subscribe"
              className="px-8 py-4 rounded-full text-white text-sm font-bold transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)', boxShadow: '0 6px 24px rgba(232,57,90,0.45)' }}
            >
              Get Started — from $9/mo
            </Link>
            <Link
              href="/apply"
              className="px-8 py-4 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              🏨 List Your Hotel
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recently Viewed (logged-in users only, bottom of page) ── */}
      <RecentlyViewed />

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{ background: '#070D1C', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1760px] mx-auto px-6 sm:px-10 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">

            {/* Brand */}
            <div>
              <Logo height={28} variant="light" />
              <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Exclusive hotel discounts · Verified coupons · Africa &amp; beyond
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {[
                { href: '/subscribe', label: 'Pricing' },
                { href: '/apply', label: 'List Your Hotel' },
                { href: '/profile', label: 'Account' },
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
              ].map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="transition-colors hover:text-white"
                  style={{ color: 'inherit' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div
            className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}
          >
            <p>© {new Date().getFullYear()} BusyBeds. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
