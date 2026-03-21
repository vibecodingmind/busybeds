'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NavbarSearch() {
  const [searchVal, setSearchVal]   = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]     = useState('');
  const router      = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim()) {
      params.set('search', searchVal.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(params.toString() ? `/?${params.toString()}` : '/');
  };

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

  return (
    <div className="flex-1 flex flex-col max-w-2xl w-full">
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
          placeholder="Search by hotel name, city or Near me…"
          className="flex-1 px-4 py-3.5 text-sm bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 min-w-0"
        />

        {/* Clear button */}
        {searchVal && (
          <button type="button" onClick={() => setSearchVal('')}
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

      {/* Geo error toast */}
      {geoError && (
        <p className="text-xs text-red-500 mt-1 px-4">{geoError}</p>
      )}
    </div>
  );
}
