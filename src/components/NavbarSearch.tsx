'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface AutocompleteResult {
  hotels: { name: string; slug: string; city: string; country: string }[];
  cities: { city: string; country: string }[];
}

export default function NavbarSearch() {
  const [searchVal, setSearchVal]       = useState('');
  const [geoLoading, setGeoLoading]     = useState(false);
  const [geoError, setGeoError]         = useState('');
  const [suggestions, setSuggestions]   = useState<AutocompleteResult>({ hotels: [], cities: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef                      = useRef<HTMLDivElement>(null);
  const router                          = useRouter();
  const searchParams                    = useSearchParams();

  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
    setShowDropdown(false);
  }, [searchParams]);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (searchVal.trim().length < 2) {
      setSuggestions({ hotels: [], cities: [] });
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hotels/autocomplete?q=${encodeURIComponent(searchVal.trim())}`);
        if (res.ok) {
          const data: AutocompleteResult = await res.json();
          setSuggestions(data);
          setShowDropdown(data.hotels.length > 0 || data.cities.length > 0);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim()) {
      params.set('search', searchVal.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(params.toString() ? `/?${params.toString()}` : '/');
  };

  const handleCitySelect = useCallback((city: string) => {
    setShowDropdown(false);
    setSearchVal(city);
    const params = new URLSearchParams(searchParams.toString());
    params.set('city', city);
    params.delete('search');
    params.delete('page');
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  const handleNearMe = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } },
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state;
          if (city) {
            setSearchVal(city);
            const params = new URLSearchParams(searchParams.toString());
            params.set('search', city);
            params.delete('page');
            router.push(`/?${params.toString()}`);
          } else {
            setGeoError('Could not detect your city. Try typing it.');
          }
        } catch {
          setGeoError('Location lookup failed. Try again.');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoError('Location permission denied.');
        setGeoLoading(false);
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  };

  const hasResults = suggestions.hotels.length > 0 || suggestions.cities.length > 0;

  return (
    <div className="flex-1 flex flex-col max-w-2xl w-full" ref={wrapperRef}>
      <div className="relative">
        <form
          onSubmit={handleSearch}
          className="flex items-center border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden"
        >
          {/* Search icon */}
          <svg className="ml-5 flex-shrink-0 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>

          {/* Input */}
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setShowDropdown(false); }}
            placeholder="Search by hotel name, city or Near me…"
            className="flex-1 px-4 py-3.5 text-sm bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 min-w-0"
            autoComplete="off"
          />

          {/* Clear button */}
          {searchVal && (
            <button type="button" onClick={() => { setSearchVal(''); setShowDropdown(false); }}
              className="mr-1 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}

          {/* Near Me button */}
          <button
            type="button"
            onClick={handleNearMe}
            disabled={geoLoading}
            title="Find hotels near me"
            className="mr-1 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {geoLoading ? (
              <svg className="animate-spin text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                <circle cx="12" cy="12" r="9" strokeDasharray="2 2"/>
              </svg>
            )}
          </button>

          {/* Search button */}
          <button type="submit"
            className="m-1.5 px-5 py-2.5 rounded-full flex items-center gap-2 text-white text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: '#FF385C' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Search</span>
          </button>
        </form>

        {/* Autocomplete dropdown */}
        {showDropdown && hasResults && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {suggestions.hotels.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hotels</p>
                {suggestions.hotels.map(h => (
                  <Link
                    key={h.slug}
                    href={`/hotels/${h.slug}`}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                      <p className="text-xs text-gray-400 truncate">{h.city}, {h.country}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {suggestions.cities.length > 0 && (
              <div className={suggestions.hotels.length > 0 ? 'border-t border-gray-50' : ''}>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Cities</p>
                {suggestions.cities.map(c => (
                  <button
                    key={`${c.city}-${c.country}`}
                    onClick={() => handleCitySelect(c.city)}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-gray-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-sm text-gray-700">{c.city}, <span className="text-gray-400">{c.country}</span></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Geo error toast */}
      {geoError && (
        <p className="text-xs text-red-500 mt-1 px-4">{geoError}</p>
      )}
    </div>
  );
}
