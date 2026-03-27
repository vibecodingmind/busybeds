'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { PlaceSearchResult } from '@/app/api/admin/import-hotels/route';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/locations';

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
  landmarksImported?: number;
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

  // URL import state
  const [importMode, setImportMode]     = useState<'search' | 'url'>('search');
  const [urlInput, setUrlInput]         = useState('');
  const [urlResolvedName, setUrlResolvedName] = useState<string | null>(null);

  // Selection
  const [selected, setSelected]         = useState<Set<string>>(new Set());

  // Import settings
  const [noDiscount, setNoDiscount]           = useState(false);
  const [discountPercent, setDiscountPercent] = useState(15);
  const [couponValidDays, setCouponValidDays] = useState(30);
  const [defaultPrice, setDefaultPrice]       = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [importReviews, setImportReviews]     = useState(true);
  const [importLandmarks, setImportLandmarks] = useState(true);
  const [fetchAllPages, setFetchAllPages]     = useState(true);
  const [markAsPartner, setMarkAsPartner]     = useState(false);

  // Country/City for quick search
  const [selectedCountry, setSelectedCountry] = useState('Tanzania');
  const [selectedCity, setSelectedCity] = useState('');
  const availableCities = CITIES_BY_COUNTRY[selectedCountry] || [];

  // Hotel types from DB
  const [hotelTypes, setHotelTypes] = useState<HotelType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Import results
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults]     = useState(false);

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/hotel-types')
      .then(r => r.json())
      .then(data => { setHotelTypes(data.types || []); setLoadingTypes(false); })
      .catch(() => setLoadingTypes(false));
  }, []);

  /* ── Search by URL ── */
  const doUrlSearch = useCallback(async (url: string) => {
    if (!url.trim()) return;
    setStatus('searching');
    setSearchError('');
    setResults([]);
    setUrlResolvedName(null);

    try {
      const params = new URLSearchParams({ url });
      const res = await fetch(`/api/admin/import-hotels?${params}`);
      const data = await res.json();

      if (!res.ok) {
        const hint = data.hint ? ` — ${data.hint}` : '';
        setSearchError((data.error || 'Failed to process URL') + hint);
        setStatus('idle');
        return;
      }

      setResults(data.results || []);
      setNextPageToken(null);
      if (data.urlResolved) setUrlResolvedName(data.urlResolved);

      // Auto-select if not already imported
      if (data.results?.[0] && !data.results[0].alreadyImported) {
        setSelected(new Set([data.results[0].placeId]));
      }
    } catch {
      setSearchError('Network error — please try again');
    } finally {
      setStatus('idle');
    }
  }, []);

  /* ── Search by query ── */
  const doSearch = useCallback(async (q: string, pagetoken?: string) => {
    if (!q.trim()) return;
    setStatus('searching');
    setSearchError('');
    if (!pagetoken) setResults([]);

    try {
      const params = new URLSearchParams({ q });
      if (pagetoken) params.set('pagetoken', pagetoken);
      if (fetchAllPages && !pagetoken) params.set('fetchAll', 'true');

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
  }, [fetchAllPages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelected(new Set());
    setShowResults(false);
    if (importMode === 'url') doUrlSearch(urlInput);
    else doSearch(query);
  };

  /* ── Select / deselect ── */
  const toggle = (placeId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(placeId) ? next.delete(placeId) : next.add(placeId);
      return next;
    });
  };
  const newResults   = results.filter(r => !r.alreadyImported);
  const doneResults  = results.filter(r =>  r.alreadyImported);
  const selectAll    = () => setSelected(new Set(newResults.map(r => r.placeId)));
  const clearAll     = () => setSelected(new Set());

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
        noDiscount,
        discountPercent,
        couponValidDays,
        pricePerNight: defaultPrice || undefined,
        category: selectedCategory || undefined,
        importReviews,
        importLandmarks,
        markAsPartner,
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
    // Mark them as already imported in results list
    setResults(prev => prev.map(r =>
      successIds.has(r.placeId) ? { ...r, alreadyImported: true } : r
    ));
  };

  /* ── Helpers ── */
  const priceLevelLabel = (level: number | null) =>
    level === null ? null : ['Free', '$', '$$', '$$$', '$$$$'][level] ?? null;

  const searchByLocation = useCallback(() => {
    const q = selectedCity
      ? `hotels in ${selectedCity}, ${selectedCountry}`
      : `hotels in ${selectedCountry}`;
    setQuery(q);
    doSearch(q);
  }, [selectedCountry, selectedCity, doSearch]);

  const isImporting = status === 'importing';
  const isSearching = status === 'searching';
  const nonImportedCount = newResults.length;
  const alreadyImportedCount = doneResults.length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, #F4F6FB)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/hotels"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Import from Google</h1>
            <p className="text-sm text-gray-500 mt-0.5">Search Google Places or paste a Google Maps link → select → import</p>
          </div>
        </div>

        {/* ── Info banner ── */}
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-6 text-sm"
          style={{ background: 'rgba(13,61,94,0.05)', border: '1px solid rgba(13,61,94,0.12)' }}>
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D3D5E" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ color: '#0D3D5E' }}>
            Hotels are stored permanently in your database — photos, addresses, and coordinates saved. No ongoing Google dependency.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ── Left: search + results ── */}
          <div className="space-y-5">

            {/* Mode Tabs + Search */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  onClick={() => { setImportMode('search'); setResults([]); setSearchError(''); setUrlResolvedName(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    importMode === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
                <button
                  onClick={() => { setImportMode('url'); setResults([]); setSearchError(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    importMode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Google Maps Link
                </button>
              </div>

              {/* Search form */}
              <form onSubmit={handleSearch}>
                {importMode === 'search' ? (
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder='e.g. "luxury hotels in Dar es Salaam" or "safari lodges Serengeti"'
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#E8395A] focus:ring-2 focus:ring-[#E8395A]/10 focus:bg-white"
                        disabled={isImporting}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || !query.trim()}
                      className="px-5 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}
                    >
                      {isSearching
                        ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Searching…</>
                        : 'Search'
                      }
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      <input
                        type="text"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder='Paste Google Maps URL — https://maps.google.com/... or goo.gl/maps/...'
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#E8395A] focus:ring-2 focus:ring-[#E8395A]/10 focus:bg-white"
                        disabled={isImporting}
                      />
                    </div>
                    {/* Supported formats hint */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="text-green-500 font-bold">✓</span> google.com/maps/place/...</span>
                      <span className="flex items-center gap-1"><span className="text-green-500 font-bold">✓</span> goo.gl/maps/...</span>
                      <span className="flex items-center gap-1"><span className="text-green-500 font-bold">✓</span> maps.app.goo.gl/...</span>
                      <span className="flex items-center gap-1"><span className="text-green-500 font-bold">✓</span> Place ID (ChIJ...)</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || !urlInput.trim()}
                      className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #0D3D5E, #1A5C8A)' }}
                    >
                      {isSearching
                        ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Looking up hotel…</>
                        : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Look up from Google Maps</>
                      }
                    </button>
                  </div>
                )}
              </form>

              {/* URL resolved success */}
              {importMode === 'url' && urlResolvedName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Found: <strong>{urlResolvedName}</strong>
                </div>
              )}
            </div>

            {/* Quick location search — only in search mode when no results */}
            {importMode === 'search' && !results.length && !searchError && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Quick search by location</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedCountry}
                      onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }}
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#E8395A]"
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {availableCities.length > 0 && (
                      <select
                        value={selectedCity}
                        onChange={e => setSelectedCity(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#E8395A]"
                      >
                        <option value="">All cities</option>
                        {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                    <button
                      onClick={searchByLocation}
                      disabled={isSearching}
                      className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      {isSearching ? 'Searching…' : `Search ${selectedCity || selectedCountry}`}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'luxury hotels Dar es Salaam',
                      'safari lodges Serengeti',
                      'beach resorts Zanzibar',
                      'boutique hotels Arusha',
                      'budget hotels Nairobi',
                      'resorts Mombasa',
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
              </div>
            )}

            {/* Error */}
            {searchError && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700">
                <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{searchError}</span>
              </div>
            )}

            {/* ── Import Results Banner ── */}
            {showResults && importResults.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm">Import Results</h3>
                  <div className="flex items-center gap-3 text-xs">
                    {importResults.filter(r => r.success).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                        ✓ {importResults.filter(r => r.success).length} imported
                      </span>
                    )}
                    {importResults.filter(r => !r.success && r.skipped).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                        ↩ {importResults.filter(r => r.skipped).length} skipped
                      </span>
                    )}
                    {importResults.filter(r => !r.success && !r.skipped).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                        ✗ {importResults.filter(r => !r.success && !r.skipped).length} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {importResults.map(r => (
                    <div key={r.placeId} className="flex items-center gap-3 px-5 py-3">
                      {r.success ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{r.city}, {r.country}</span>
                              {!!r.reviewsImported && <span className="text-green-600 font-medium">· {r.reviewsImported} reviews</span>}
                              {!!r.landmarksImported && <span className="text-blue-600 font-medium">· {r.landmarksImported} landmarks</span>}
                            </div>
                          </div>
                          <Link href={`/hotels/${r.hotelSlug}`} target="_blank"
                            className="text-xs text-[#E8395A] font-bold hover:underline flex-shrink-0">
                            View →
                          </Link>
                        </>
                      ) : r.skipped ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">Already in BusyBeds</p>
                            <p className="text-xs text-amber-600 truncate">{r.error}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

            {/* ── Results ── */}
            {results.length > 0 && (
              <div className="space-y-4">

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-gray-900">{results.length}</span> results
                      {alreadyImportedCount > 0 && (
                        <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                          {alreadyImportedCount} already imported
                        </span>
                      )}
                      {selected.size > 0 && (
                        <span className="ml-1.5 text-[#E8395A] font-semibold">
                          · {selected.size} selected
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {nonImportedCount > 0 && (
                      <button onClick={selectAll}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold transition-colors">
                        Select all new ({nonImportedCount})
                      </button>
                    )}
                    {selected.size > 0 && (
                      <button onClick={clearAll}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold transition-colors">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Not yet imported — full colour cards */}
                {nonImportedCount > 0 && (
                  <div>
                    {alreadyImportedCount > 0 && (
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                        Not yet imported ({nonImportedCount})
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {newResults.map(place => {
                        const isSelected = selected.has(place.placeId);
                        return (
                          <button
                            key={place.placeId}
                            onClick={() => toggle(place.placeId)}
                            disabled={isImporting}
                            className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 focus:outline-none group bg-white ${
                              isSelected
                                ? 'border-[#E8395A] shadow-lg shadow-[#E8395A]/15 scale-[1.01]'
                                : 'border-transparent hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            {/* Photo */}
                            <div className="relative h-40 bg-gray-100 overflow-hidden">
                              {place.photoUrl ? (
                                <img src={place.photoUrl} alt={place.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                              {/* Category pill */}
                              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                                {place.category}
                              </div>

                              {/* Price level */}
                              {place.priceLevel !== null && (
                                <div className="absolute top-2.5 right-10 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                                  {priceLevelLabel(place.priceLevel)}
                                </div>
                              )}

                              {/* Checkbox */}
                              <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'border-[#E8395A] bg-[#E8395A]' : 'border-white/80 bg-white/25 backdrop-blur-sm'
                              }`}>
                                {isSelected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                              </div>

                              {/* Rating */}
                              {place.rating && (
                                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                                  style={{ background: 'rgba(255,255,255,0.92)', color: '#0F172A' }}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#E8395A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                  {place.rating.toFixed(1)}
                                  {place.reviewCount && <span className="text-gray-500 font-normal">({place.reviewCount.toLocaleString()})</span>}
                                </div>
                              )}

                              {/* Price */}
                              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
                                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                                ~${place.estimatedPrice}/night
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-3.5">
                              <p className="font-bold text-gray-900 text-sm leading-snug truncate">{place.name}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{place.address}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Already imported — muted list style */}
                {alreadyImportedCount > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Already in BusyBeds ({alreadyImportedCount})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {doneResults.map(place => (
                        <div key={place.placeId}
                          className="relative flex items-center gap-3 bg-white rounded-xl border border-green-200 p-3 opacity-75">
                          {/* Thumb */}
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {place.photoUrl ? (
                              <img src={place.photoUrl} alt={place.name}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">{place.name}</p>
                            <p className="text-xs text-gray-400 truncate">{place.address}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              <span className="text-[11px] text-green-600 font-semibold">Imported</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Load more */}
                {nextPageToken && (
                  <div className="text-center pt-2">
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

          {/* ── Right: Settings + Import button (sticky) ── */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">

            {/* Import button — primary CTA */}
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
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Importing…</>
              ) : selected.size > 0 ? (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Import {selected.size} Hotel{selected.size !== 1 ? 's' : ''}
                </>
              ) : (
                <span className="text-white/80">Select hotels from results first</span>
              )}
            </button>

            {selected.size > 0 && (
              <p className="text-xs text-center text-gray-400 -mt-1">
                Photos, coordinates, and a default room type will be added — all editable after import.
              </p>
            )}

            {/* Import settings — collapsible */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setSettingsOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-bold text-gray-900 text-sm text-left">Import Settings</h3>
                  <p className="text-xs text-gray-400 mt-0.5 text-left">Discount, reviews, landmarks…</p>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                  className={`transition-transform text-gray-400 ${settingsOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {settingsOpen && (
                <div className="border-t border-gray-100 p-5 space-y-4">

                  {/* Hotel Type */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Hotel Type
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      disabled={loadingTypes || isImporting}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] bg-white"
                    >
                      <option value="">Auto-detect from Google</option>
                      {hotelTypes.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Discount %</label>
                    <div className="relative">
                      <input
                        type="number" min={0} max={80}
                        value={noDiscount ? 0 : discountPercent}
                        onChange={e => setDiscountPercent(Number(e.target.value))}
                        disabled={noDiscount}
                        className={`w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] ${noDiscount ? 'bg-gray-100 text-gray-400' : ''}`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" checked={noDiscount} onChange={e => setNoDiscount(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#E8395A] focus:ring-[#E8395A]"/>
                      <span className="text-xs text-gray-600">No coupon (0% discount)</span>
                    </label>
                  </div>

                  {/* Coupon days */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Coupon Valid Days</label>
                    <div className="relative">
                      <input type="number" min={1} max={365}
                        value={couponValidDays}
                        onChange={e => setCouponValidDays(Number(e.target.value))}
                        className="w-full px-3 py-2.5 pr-14 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">days</span>
                    </div>
                  </div>

                  {/* Price override */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Price Override <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" min={0}
                        value={defaultPrice || ''}
                        onChange={e => setDefaultPrice(Number(e.target.value))}
                        placeholder="Auto from Google"
                        className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  {[
                    { label: 'Import Google Reviews', sub: 'Up to 5 reviews per hotel (auto-approved)', val: importReviews, set: setImportReviews },
                    { label: 'Import Nearby Landmarks', sub: 'Supermarkets, parks, hospitals (5km)', val: importLandmarks, set: setImportLandmarks },
                    { label: 'Fetch All 60 Results', sub: 'Auto-fetch 3 pages from Google', val: fetchAllPages, set: setFetchAllPages },
                  ].map(({ label, sub, val, set }) => (
                    <label key={label} className="flex items-start gap-3 cursor-pointer pt-1">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="sr-only"/>
                        <div className={`w-10 h-6 rounded-full transition-colors ${val ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-4' : 'translate-x-0'}`}/>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                        <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
                      </div>
                    </label>
                  ))}

                  {/* Mark as Partner */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input type="checkbox" checked={markAsPartner} onChange={e => setMarkAsPartner(e.target.checked)} className="sr-only"/>
                        <div className={`w-10 h-6 rounded-full transition-colors ${markAsPartner ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${markAsPartner ? 'translate-x-4' : 'translate-x-0'}`}/>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-amber-800">Mark as Active Partner</span>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          {markAsPartner
                            ? '✓ Hotels will show "Get Coupon" button'
                            : 'Hotels listed only — no coupon until agreement signed'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-3">How it works</p>
              <div className="space-y-2.5">
                {[
                  { n: '1', text: 'Search a city or paste a Google Maps link' },
                  { n: '2', text: 'Select the hotels you want to add' },
                  { n: '3', text: 'Adjust settings if needed' },
                  { n: '4', text: 'Click Import — done in seconds!' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}>
                      {n}
                    </div>
                    <p className="text-xs text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-200 p-4">
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                Uses your <code className="bg-gray-100 px-1 rounded text-gray-600">GOOGLE_PLACES_API_KEY</code> (server-side only — key is never exposed to users).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
