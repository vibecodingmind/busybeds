'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VIBE_TAGS } from '@/lib/vibeTags';

interface Props {
  params: Record<string, string | undefined>;
}

const SORT_OPTIONS = [
  { value: 'best',       label: 'Best match'           },
  { value: 'rating',     label: 'Highest rated'        },
  { value: 'price_asc',  label: 'Price: Low to high'   },
  { value: 'price_desc', label: 'Price: High to low'   },
  { value: 'discount',   label: 'Most discounted'      },
];

const COMMON_AMENITIES = [
  'WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar',
  'Parking', 'Air Conditioning', 'Beach Access',
  'Breakfast Included', 'Pet Friendly', 'Room Service',
];

export default function FilterPanel({ params }: Props) {
  const router = useRouter();

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  /* local state — synced from URL params whenever they change */
  const [sort,        setSort]        = useState(params.sort || 'best');
  const [stars,       setStars]       = useState<string[]>(params.stars ? params.stars.split(',') : []);
  const [minPrice,    setMinPrice]    = useState(params.minPrice || '');
  const [maxPrice,    setMaxPrice]    = useState(params.maxPrice || '');
  const [minDiscount, setMinDiscount] = useState(params.minDiscount || '');
  const [amenities,   setAmenities]   = useState<string[]>(
    params.amenities ? params.amenities.split(',').filter(Boolean) : [],
  );
  const [vibeTag,     setVibeTag]     = useState(params.vibeTag || '');

  /* Re-sync local state when URL params change (e.g. chip removals, back/forward) */
  useEffect(() => {
    setSort(params.sort || 'best');
    setStars(params.stars ? params.stars.split(',').filter(Boolean) : []);
    setMinPrice(params.minPrice || '');
    setMaxPrice(params.maxPrice || '');
    setMinDiscount(params.minDiscount || '');
    setAmenities(params.amenities ? params.amenities.split(',').filter(Boolean) : []);
    setVibeTag(params.vibeTag || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.sort, params.stars, params.minPrice, params.maxPrice,
    params.minDiscount, params.amenities, params.vibeTag,
  ]);

  const activeFilterCount = [
    stars.length > 0,
    minPrice || maxPrice,
    minDiscount,
    amenities.length > 0,
    vibeTag,
  ].filter(Boolean).length;

  const buildQs = (overrides: Record<string, string | undefined> = {}) => {
    const merged: Record<string, string | undefined> = {
      ...params,
      sort:        sort !== 'best' ? sort : undefined,
      stars:       stars.join(',') || undefined,
      minPrice:    minPrice || undefined,
      maxPrice:    maxPrice || undefined,
      minDiscount: minDiscount || undefined,
      amenities:   amenities.join(',') || undefined,
      vibeTag:     vibeTag || undefined,
      ...overrides,
      page: undefined,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/?${qs}` : '/';
  };

  const applyFilters = () => {
    router.push(buildQs());
    setShowFilters(false);
  };

  const resetFilters = () => {
    setStars([]); setMinPrice(''); setMaxPrice(''); setMinDiscount(''); setAmenities([]); setVibeTag('');
    const p = new URLSearchParams();
    if (params.search)   p.set('search',   params.search);
    if (params.city)     p.set('city',     params.city);
    if (params.category) p.set('category', params.category);
    if (params.sort && params.sort !== 'best') p.set('sort', params.sort);
    const qs = p.toString();
    router.push(qs ? `/?${qs}` : '/');
    setShowFilters(false);
  };

  const applySort = (s: string) => {
    setSort(s);
    const overrides: Record<string, string | undefined> = { sort: s !== 'best' ? s : undefined };
    const p = new URLSearchParams();
    const merged = { ...params, ...overrides, page: undefined };
    for (const [k, v] of Object.entries(merged)) { if (v) p.set(k, v); }
    const qs = p.toString();
    router.push(qs ? `/?${qs}` : '/');
    setShowSort(false);
  };

  const toggleStar = (n: string) =>
    setStars(prev => prev.includes(n) ? prev.filter(s => s !== n) : [...prev, n]);

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === (params.sort || 'best'))?.label ?? 'Best match';

  return (
    <>
      {/* ── Trigger row ── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
              params.sort && params.sort !== 'best'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            {currentSortLabel}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              className={`transition-transform ${showSort ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showSort && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
              <div className="absolute right-0 top-11 z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 min-w-[200px]">
                {SORT_OPTIONS.map(o => {
                  const active = (params.sort || 'best') === o.value;
                  return (
                    <button key={o.value} onClick={() => applySort(o.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2.5 ${active ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {active
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <span className="w-3.5" />}
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Filters button */}
        <button
          onClick={() => { setShowFilters(true); setShowSort(false); }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
            activeFilterCount > 0
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700 bg-white hover:border-gray-400'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-gray-900 text-xs font-bold flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter Modal ── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />

          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <button onClick={resetFilters} className="text-sm font-medium text-gray-500 hover:text-gray-900 underline transition-colors">
                Reset all
              </button>
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

              {/* Sort */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Sort by</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => setSort(o.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                        sort === o.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Star rating */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Star rating</h4>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => toggleStar(String(n))}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        stars.includes(String(n)) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}>
                      {n} <span className={stars.includes(String(n)) ? 'text-yellow-300' : 'text-yellow-400'}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Price range */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Price per night</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
                  </div>
                  <span className="text-gray-400 flex-shrink-0 font-medium">—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Minimum discount */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Minimum discount</h4>
                <div className="flex gap-2 flex-wrap">
                  {['10','20','30','50'].map(d => (
                    <button key={d} onClick={() => setMinDiscount(minDiscount === d ? '' : d)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        minDiscount === d ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}>
                      {d}%+
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Amenities */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Amenities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_AMENITIES.map(a => {
                    const on = amenities.includes(a);
                    return (
                      <button key={a} onClick={() => toggleAmenity(a)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all ${
                          on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke={on ? 'white' : '#9ca3af'} strokeWidth={2.5} strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Vibe Tags */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Vibe</h4>
                <div className="flex flex-wrap gap-2">
                  {VIBE_TAGS.map(vt => {
                    const on = vibeTag === vt.id;
                    return (
                      <button key={vt.id} onClick={() => setVibeTag(on ? '' : vt.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all ${
                          on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}>
                        <span>{vt.emoji}</span>
                        <span>{vt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
              <button onClick={applyFilters}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: '#FF385C' }}>
                Show results{activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
