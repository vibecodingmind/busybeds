import Link from 'next/link';
import Navbar from '@/components/Navbar';
import HotelCard from '@/components/HotelCard';
import SuggestHotelModal from '@/components/SuggestHotelModal';
import FilterPanel from '@/components/FilterPanel';
import prisma from '@/lib/prisma';

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
) {
  const starsArr    = stars ? stars.split(',').map(s => parseInt(s)).filter(Boolean) : [];
  const discountNum = minDiscount ? parseInt(minDiscount) : undefined;
  const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
  const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;
  const amenityArr  = amenities ? amenities.split(',').filter(Boolean) : [];

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
    ];
  }
  if (city) where.city = { contains: city };

  /* each amenity must appear in the JSON string */
  if (amenityArr.length === 1) {
    where.amenities = { contains: amenityArr[0] };
  } else if (amenityArr.length > 1) {
    where.AND = amenityArr.map((a: string) => ({ amenities: { contains: a } }));
  }

  /* price range — filter on related roomTypes */
  if (minPriceNum !== undefined || maxPriceNum !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (minPriceNum !== undefined) priceFilter.gte = minPriceNum;
    if (maxPriceNum !== undefined) priceFilter.lte = maxPriceNum;
    where.roomTypes = { some: { pricePerNight: priceFilter } };
  }

  /* sort order */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any[];
  switch (sort) {
    case 'rating':   orderBy = [{ avgRating: 'desc' }, { reviewCount: 'desc' }]; break;
    case 'discount': orderBy = [{ discountPercent: 'desc' }]; break;
    default:         orderBy = [{ isFeatured: 'desc' }, { avgRating: 'desc' }, { createdAt: 'desc' }];
  }

  const [rawHotels, total] = await prisma.$transaction([
    prisma.hotel.findMany({
      where,
      include: {
        roomTypes: { orderBy: { displayOrder: 'asc' }, take: 1 },
        photos:    { orderBy: { displayOrder: 'asc' }, take: 5 },
      },
      orderBy,
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
    }),
    prisma.hotel.count({ where }),
  ]);

  /* client-side price sort (prices live on roomTypes relation) */
  let hotels = rawHotels;
  if (sort === 'price_asc' || sort === 'price_desc') {
    hotels = [...rawHotels].sort((a, b) => {
      const pa = a.roomTypes[0]?.pricePerNight ?? 0;
      const pb = b.roomTypes[0]?.pricePerNight ?? 0;
      return sort === 'price_asc' ? pa - pb : pb - pa;
    });
  }

  return { hotels, total };
}

async function getCities() {
  const rows = await prisma.hotel.findMany({ where: { status: 'active' }, select: { city: true }, distinct: ['city'] });
  return rows.map(h => h.city);
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
  };
}) {
  const currentPage    = searchParams.page ? parseInt(searchParams.page) : 1;
  const activeCategory = searchParams.category || 'all';

  /* detect if ANY filter/search is active */
  const isFiltered = !!(
    searchParams.search || searchParams.city || searchParams.stars ||
    searchParams.minDiscount || searchParams.featured || searchParams.amenities ||
    (searchParams.category && searchParams.category !== 'all') ||
    searchParams.minPrice || searchParams.maxPrice || searchParams.sort
  );

  const [{ hotels, total }, cities, hotelTypes, trending] = await Promise.all([
    getHotels(
      currentPage,
      searchParams.search, searchParams.city, searchParams.stars,
      searchParams.minDiscount, searchParams.featured, searchParams.amenities,
      searchParams.category, searchParams.minPrice, searchParams.maxPrice,
      searchParams.sort,
    ),
    getCities(),
    getHotelTypes(),
    isFiltered ? Promise.resolve([]) : getTrending(),
  ]);

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

  const removeChip = (key: string) => {
    if (key === '_price') return buildHref({ minPrice: undefined, maxPrice: undefined, page: undefined });
    if (key.startsWith('amenity_')) {
      const a = key.slice(8);
      const remaining = (searchParams.amenities || '').split(',').filter(x => x && x !== a).join(',');
      return buildHref({ amenities: remaining || undefined, page: undefined });
    }
    return buildHref({ [key]: undefined, page: undefined });
  };

  // Pass params to FilterPanel (plain strings only)
  const filterPanelParams: Record<string, string | undefined> = {
    search:      searchParams.search,
    city:        searchParams.city,
    stars:       searchParams.stars,
    minDiscount: searchParams.minDiscount,
    featured:    searchParams.featured,
    amenities:   searchParams.amenities,
    category:    searchParams.category,
    minPrice:    searchParams.minPrice,
    maxPrice:    searchParams.maxPrice,
    sort:        searchParams.sort,
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Category filter bar (Airbnb-style, sticky) ── */}
      <div className="border-b border-gray-200 bg-white sticky top-20 z-40">
        <div className="max-w-[1760px] mx-auto px-6 sm:px-10">
          <div className="flex items-end gap-0 overflow-x-auto scrollbar-none">

            {/* "All" tab */}
            <Link href="/"
              className={`flex flex-col items-center gap-1.5 px-5 py-3.5 whitespace-nowrap transition-all flex-shrink-0 min-w-[72px] border-b-2 group ${
                activeCategory === 'all' ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
              }`}>
              <span className={`transition-colors ${activeCategory === 'all' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                <CategoryIcon icon="all" size={24} />
              </span>
              <span className={`text-xs font-medium transition-colors ${activeCategory === 'all' ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-800'}`}>All</span>
            </Link>

            {/* DB-driven hotel type categories */}
            {hotelTypes.map((ht: { id: string; name: string; icon: string }) => {
              const isActive = activeCategory === ht.name;
              return (
                <Link key={ht.id} href={`/?category=${encodeURIComponent(ht.name)}`}
                  className={`flex flex-col items-center gap-1.5 px-5 py-3.5 whitespace-nowrap transition-all flex-shrink-0 min-w-[72px] border-b-2 group ${
                    isActive ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                  }`}>
                  <span className={`transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                    <CategoryIcon icon={ht.icon} size={24} />
                  </span>
                  <span className={`text-xs font-medium transition-colors ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-800'}`}>{ht.name}</span>
                </Link>
              );
            })}

            {/* Separator */}
            {cities.length > 0 && hotelTypes.length > 0 && (
              <div className="w-px h-8 bg-gray-200 flex-shrink-0 mx-2 self-center" />
            )}

            {/* City quick filters */}
            {cities.slice(0, 8).map((city: string) => {
              const isActive = searchParams.city === city;
              return (
                <Link key={city} href={buildHref({ city: isActive ? undefined : city, page: undefined })}
                  className={`flex flex-col items-center gap-1.5 px-5 py-3.5 whitespace-nowrap transition-all flex-shrink-0 min-w-[72px] border-b-2 group ${
                    isActive ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                  }`}>
                  <span className={`transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span className={`text-xs font-medium transition-colors ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover:text-gray-800'}`}>{city}</span>
                </Link>
              );
            })}

            {/* Clear all */}
            {isFiltered && (
              <Link href="/"
                className="flex flex-col items-center gap-1.5 px-5 py-3.5 whitespace-nowrap flex-shrink-0 min-w-[72px] border-b-2 border-transparent hover:border-red-200 group ml-1">
                <span className="text-gray-300 group-hover:text-red-400 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </span>
                <span className="text-xs font-medium text-gray-400 group-hover:text-red-500 transition-colors">Clear</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-[1760px] mx-auto px-6 sm:px-10 py-6 pb-24">

        {/* ── Trending section (only when no active filters) ── */}
        {!isFiltered && trending.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🔥</span> Trending this week
              </h2>
              <span className="text-xs text-gray-400">Most reviewed</span>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(trending as any[]).map((hotel) => (
                <Link key={hotel.id} href={`/hotels/${hotel.slug}`}
                  className="flex-shrink-0 w-52 group">
                  <div className="relative rounded-2xl overflow-hidden h-36 mb-2">
                    <img
                      src={hotel.photos[0]?.url || hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-gray-800 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {hotel.avgRating?.toFixed(1) ?? '—'}
                    </div>
                    {hotel.discountPercent >= 10 && (
                      <div className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                        style={{ background: '#FF385C' }}>
                        {hotel.discountPercent}% off
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-600 transition-colors">{hotel.name}</p>
                  <p className="text-xs text-gray-500 truncate">{hotel.city}, {hotel.country}</p>
                  {hotel.roomTypes[0] && (
                    <p className="text-xs text-gray-700 font-medium mt-0.5">
                      <span className="line-through text-gray-400 mr-1">${hotel.roomTypes[0].pricePerNight.toFixed(0)}</span>
                      ${Math.round(hotel.roomTypes[0].pricePerNight * (1 - hotel.discountPercent / 100))}/night
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Results header: count + filter controls ── */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {total === 0 ? 'No hotels found' : (
                <>
                  {total > PAGE_SIZE ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, total)} of ` : ''}{total} hotel{total !== 1 ? 's' : ''}
                  {searchParams.city ? ` in ${searchParams.city}` : ''}
                  {searchParams.category && searchParams.category !== 'all' ? ` · ${searchParams.category}` : ''}
                  {searchParams.search ? ` matching "${searchParams.search}"` : ''}
                </>
              )}
            </p>
          </div>

          {/* Sort + Filters (client component) */}
          <FilterPanel params={filterPanelParams} />
        </div>

        {/* ── Active filter chips ── */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-gray-400 font-medium">Active filters:</span>
            {activeChips.map(chip => (
              <Link key={chip.removeKey} href={removeChip(chip.removeKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors">
                {chip.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </Link>
            ))}
            {activeChips.length > 1 && (
              <Link href="/" className="text-xs font-medium text-gray-500 hover:text-gray-900 underline transition-colors">
                Clear all
              </Link>
            )}
          </div>
        )}

        {/* ── Hotel grid ── */}
        {hotels.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hotels found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or clearing some filters</p>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#FF385C' }}>
              Clear all filters
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 gap-y-8">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(hotels as any[]).map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                {currentPage > 1 ? (
                  <Link href={buildHref({ page: String(currentPage - 1) })}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:border-gray-900 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </Link>
                ) : (
                  <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center opacity-40 cursor-not-allowed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </span>
                )}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Link key={p} href={buildHref({ page: String(p) })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        currentPage === p ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700 hover:border-gray-900'
                      }`}>{p}</Link>
                  );
                })}
                {currentPage < totalPages ? (
                  <Link href={buildHref({ page: String(currentPage + 1) })}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:border-gray-900 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                ) : (
                  <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center opacity-40 cursor-not-allowed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── How it works ── */}
      <div className="border-t border-gray-100 py-14 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How BusyBeds works</h2>
          <p className="text-gray-500 mb-10 text-sm">Three steps from subscription to savings</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { n: '1', title: 'Subscribe',      desc: 'Pick a plan and unlock all hotel discount coupons.' },
              { n: '2', title: 'Get Your QR',    desc: 'Choose a hotel and generate your unique QR coupon instantly.' },
              { n: '3', title: 'Redeem at Hotel',desc: 'Show the QR at reception. Staff scans it. Discount applied.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4" style={{ background: '#FF385C' }}>{n}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/subscribe"
              className="px-8 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#FF385C' }}>
              Get Started — from $9/mo
            </Link>
            <SuggestHotelModal trigger={
              <span className="px-8 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:border-gray-900 transition-colors cursor-pointer inline-flex items-center justify-center">
                Suggest a Hotel
              </span>
            } />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-8 bg-white">
        <div className="max-w-[1760px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" style={{ color: '#FF385C' }}>busybeds</span>
            <span className="text-xs text-gray-400">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/subscribe" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/apply" className="hover:text-gray-900 transition-colors">List Your Hotel</Link>
            <Link href="/profile" className="hover:text-gray-900 transition-colors">Account</Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
