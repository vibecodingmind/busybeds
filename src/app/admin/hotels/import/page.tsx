'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { PlaceSearchResult } from '@/app/api/admin/import-hotels/route';

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */
type ImportResult = {
  placeId: string;
  success: boolean;
  skipped?: boolean;
  hotelId?: string;
  hotelSlug?: string;
  name?: string;
  city?: string;
  country?: string;
  coverImage?: string | null;
  reviewsImported?: number;
  error?: string;
};

type ImportStatus = 'idle' | 'searching' | 'importing' | 'done';

type HotelType = {
  id: string;
  name: string;
  icon: string;
};

/* ────────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────────── */
export default function ImportHotelsPage() {
  // Search state
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<PlaceSearchResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [status, setStatus]             = useState<ImportStatus>('idle');
  const [searchError, setSearchError]   = useState('');

  // Selection
  const [selected, setSelected]         = useState<Set<string>>(new Set());

  // Import settings
  const [discountPercent, setDiscountPercent] = useState(15);
  const [couponValidDays, setCouponValidDays] = useState(30);
  const [defaultPrice, setDefaultPrice]       = useState(0); // 0 = auto from price_level
  const [selectedCategory, setSelectedCategory] = useState(''); // Hotel type category
  const [importReviews, setImportReviews]     = useState(true); // Default: import reviews

  // Hotel types from DB
  const [hotelTypes, setHotelTypes] = useState<HotelType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Import results
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults]     = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch hotel types on mount
  useEffect(() => {
    fetch('/api/hotel-types')
      .then(r => r.json())
      .then(data => {
        setHotelTypes(data.types || []);
        setLoadingTypes(false);
      })
      .catch(() => setLoadingTypes(false));
  }, []);

  /* ── Search ── */
  const doSearch = useCallback(async (q: string, pagetoken?: string) => {
    if (!q.trim()) return;
    setStatus('searching');
    setSearchError('');
    if (!pagetoken) setResults([]);

    try {
      const params = new URLSearchParams({ q });
      if (pagetoken) params.set('pagetoken', pagetoken);

      const res = await fetch(`/api/admin/import-hotels?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || 'Search failed');
        setStatus('idle');
        return;
      }

      setResults(prev => pagetoken ? [...prev, ...data.results] : data.results);
      setNextPageToken(data.nextPageToken || null);
    } catch {
      setSearchError('Network error — please try again');
    } finally {
      setStatus('idle');
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelected(new Set());
    doSearch(query);
  };

  /* ── Select / deselect ── */
  const toggle = (placeId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(placeId) ? next.delete(placeId) : next.add(placeId);
      return next;
    });
  };
  // Only select hotels that haven't been imported yet
  const selectAll = () => setSelected(new Set(results.filter(r => !r.alreadyImported).map(r => r.placeId)));
  const clearAll  = () => setSelected(new Set());

  /* ── Import ── */
  const doImport = async () => {
    if (!selected.size) return;
    setStatus('importing');
    setImportResults([]);
    setShowResults(false);

    const res = await fetch('/api/admin/import-hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeIds: Array.from(selected),
        discountPercent,
        couponValidDays,
        pricePerNight: defaultPrice || undefined,
        category: selectedCategory || undefined,
        importReviews, // Pass the toggle value
      }),
    });
    const data = await res.json();
    setImportResults(data.results ?? []);
    setShowResults(true);
    setStatus('done');

    // Remove successfully imported from selection + results
    const successIds = new Set(
      (data.results as ImportResult[]).filter(r => r.success).map(r => r.placeId),
    );
    setSelected(prev => {
      const next = new Set(prev);
      successIds.forEach(id => next.delete(id));
      return next;
    });
    setResults(prev => prev.filter(r => !successIds.has(r.placeId)));
  };

  /* ── Helpers ── */
  const priceLevelLabel = (level: number | null) => {
    if (level === null) return null;
    return ['Free', '$', '$$', '$$$', '$$$$'][level] ?? null;
  };

  const isImporting = status === 'importing';
  const isSearching = status === 'searching';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, #F4F6FB)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin/hotels"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Hotels</h1>
            <p className="text-sm text-gray-500 mt-0.5">Search Google Places → preview → import into BusyBeds</p>
          </div>
        </div>

        {/* ── Info banner ── */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl mb-7 text-sm"
          style={{ background: 'rgba(13,61,94,0.06)', border: '1px solid rgba(13,61,94,0.12)' }}
        >
          <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D3D5E" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ color: '#0D3D5E' }}>
            <strong>Imported hotels live in your own database.</strong> If the Google API is ever disabled, every imported hotel remains completely unaffected — names, addresses, photos, and coordinates are all stored permanently in BusyBeds. No ongoing Google dependency.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-7">

          {/* ── Left: search + results ── */}
          <div className="space-y-6">

            {/* Search form */}
            <form onSubmit={handleSearch}
              className="flex gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder='e.g. "luxury hotels in Dar es Salaam" or "safari lodges Serengeti"'
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#E8395A] focus:ring-2 focus:ring-[#E8395A]/10 shadow-sm"
                  disabled={isImporting}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-6 py-3 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)', boxShadow: '0 4px 16px rgba(232,57,90,0.30)' }}
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Search
                  </>
                )}
              </button>
            </form>

            {/* Quick suggestions */}
            {!results.length && !searchError && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick searches</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'luxury hotels Dar es Salaam',
                    'safari lodges Serengeti',
                    'beach resorts Zanzibar',
                    'boutique hotels Arusha',
                    'budget hotels Nairobi',
                    'resorts Mombasa Kenya',
                    'lodges Ngorongoro',
                    'hotels Cape Town',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); doSearch(s); }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {searchError && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {searchError}
              </div>
            )}

            {/* ── Import results ── */}
            {showResults && importResults.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">Import Results</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-700 font-semibold">
                      ✓ {importResults.filter(r => r.success).length} imported
                    </span>
                    {importResults.filter(r => !r.success && r.skipped).length > 0 && (
                      <span className="text-amber-600 font-semibold">
                        ↩ {importResults.filter(r => r.skipped).length} skipped
                      </span>
                    )}
                    {importResults.filter(r => !r.success && !r.skipped).length > 0 && (
                      <span className="text-red-600 font-semibold">
                        ✗ {importResults.filter(r => !r.success && !r.skipped).length} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {importResults.map(r => (
                    <div key={r.placeId} className="flex items-center gap-3 px-5 py-3">
                      {r.success ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{r.city}, {r.country}</span>
                              {r.reviewsImported && r.reviewsImported > 0 && (
                                <span className="text-green-600 font-medium">· {r.reviewsImported} reviews imported</span>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/hotels/${r.hotelSlug}`}
                            target="_blank"
                            className="text-xs text-[#E8395A] font-semibold hover:underline flex-shrink-0"
                          >
                            View →
                          </Link>
                        </>
                      ) : r.skipped ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">Already in BusyBeds</p>
                            <p className="text-xs text-amber-600 truncate">{r.error}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">Failed to import</p>
                            <p className="text-xs text-red-500 truncate">{r.error}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Results grid ── */}
            {results.length > 0 && (
              <div>
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{results.length}</span> results
                    {selected.size > 0 && (
                      <span className="ml-2 text-[#E8395A] font-semibold">· {selected.size} selected</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <button onClick={selectAll} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold transition-colors">
                      Select all
                    </button>
                    {selected.size > 0 && (
                      <button onClick={clearAll} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map(place => {
                    const isSelected   = selected.has(place.placeId);
                    const isImported   = place.alreadyImported;
                    return (
                      <button
                        key={place.placeId}
                        onClick={() => !isImported && toggle(place.placeId)}
                        disabled={isImporting || isImported}
                        className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 focus:outline-none group ${
                          isImported
                            ? 'border-green-400 opacity-75 cursor-default'
                            : isSelected
                            ? 'border-[#E8395A] shadow-lg shadow-[#E8395A]/15 scale-[1.01]'
                            : 'border-transparent hover:border-gray-200 hover:shadow-md'
                        } bg-white`}
                      >
                        {/* Photo */}
                        <div className="relative h-40 bg-gray-100 overflow-hidden">
                          {place.photoUrl ? (
                            <img
                              src={place.photoUrl}
                              alt={place.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                            </div>
                          )}

                          {/* Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                          {/* Already imported banner */}
                          {isImported && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                                style={{ background: 'rgba(22,163,74,0.90)', backdropFilter: 'blur(8px)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Already imported
                              </div>
                            </div>
                          )}

                          {/* Category pill */}
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                            style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}>
                            {place.category}
                          </div>

                          {/* Price level */}
                          {place.priceLevel !== null && (
                            <div className="absolute top-2.5 right-10 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                              style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}>
                              {priceLevelLabel(place.priceLevel)}
                            </div>
                          )}

                          {/* Checkbox — hidden for already-imported */}
                          {!isImported && (
                            <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-[#E8395A] bg-[#E8395A]'
                                : 'border-white/70 bg-white/20 backdrop-blur-sm'
                            }`}>
                              {isSelected && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </div>
                          )}

                          {/* Rating */}
                          {place.rating && (
                            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', color: '#0F172A' }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="#E8395A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              {place.rating.toFixed(1)}
                              {place.reviewCount && (
                                <span className="text-gray-500 font-normal">({place.reviewCount.toLocaleString()})</span>
                              )}
                            </div>
                          )}

                          {/* Est. price */}
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                            ~${place.estimatedPrice}/night
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3.5">
                          <p className="font-bold text-gray-900 text-sm leading-snug truncate">{place.name}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{place.address}</p>
                          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Load more */}
                {nextPageToken && (
                  <div className="text-center mt-5">
                    <button
                      onClick={() => doSearch(query, nextPageToken)}
                      disabled={isSearching}
                      className="px-6 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      {isSearching ? 'Loading…' : 'Load more results'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: import settings + import button ── */}
          <div className="space-y-4">

            {/* Import settings card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Import Settings</h3>
                <p className="text-xs text-gray-400 mt-0.5">Applied to all imported hotels</p>
              </div>
              <div className="p-5 space-y-4">

                {/* Hotel Type Category Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Hotel Type Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    disabled={loadingTypes || isImporting}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Auto-detect from Google</option>
                    {hotelTypes.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Leave empty to auto-detect from Google Places types
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Discount %
                  </label>
                  <div className="relative">
                    <input
                      type="number" min={1} max={80}
                      value={discountPercent}
                      onChange={e => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Coupon Valid Days
                  </label>
                  <div className="relative">
                    <input
                      type="number" min={1} max={365}
                      value={couponValidDays}
                      onChange={e => setCouponValidDays(Number(e.target.value))}
                      className="w-full px-3 py-2.5 pr-14 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">days</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Price Override <span className="font-normal normal-case text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number" min={0}
                      value={defaultPrice || ''}
                      onChange={e => setDefaultPrice(Number(e.target.value))}
                      placeholder="Auto from Google"
                      className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Leave empty to auto-estimate from Google price level</p>
                </div>

                {/* Import Reviews Toggle */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={importReviews}
                        onChange={e => setImportReviews(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${importReviews ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${importReviews ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Import Google Reviews</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">Up to 5 recent reviews per hotel (auto-approved)</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Import button */}
            <button
              onClick={doImport}
              disabled={!selected.size || isImporting || isSearching}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #E8395A, #C41F40)',
                boxShadow: selected.size ? '0 6px 24px rgba(232,57,90,0.40)' : 'none',
              }}
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {selected.size > 0
                    ? `Import ${selected.size} Hotel${selected.size !== 1 ? 's' : ''}`
                    : 'Select hotels to import'}
                </>
              )}
            </button>

            {selected.size > 0 && (
              <p className="text-xs text-center text-gray-400">
                Each hotel will be added with photos, coordinates, and a default room type — fully editable after import.
              </p>
            )}

            {/* How it works */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-3">How it works</p>
              <div className="space-y-2.5">
                {[
                  { n: '1', text: 'Search any city or area' },
                  { n: '2', text: 'Select the hotels you want' },
                  { n: '3', text: 'Set discount % and valid days' },
                  { n: '4', text: 'Click Import — done in seconds' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}
                    >
                      {n}
                    </div>
                    <p className="text-xs text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* API key info */}
            <div className="rounded-2xl border border-dashed border-gray-200 p-4">
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                Uses your <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">GOOGLE_PLACES_API_KEY</code> (or <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>). Calls are made server-side only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
