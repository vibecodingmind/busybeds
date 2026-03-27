'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NearMeButton({ active }: { active: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = () => {
    if (active) {
      // Remove near-me params
      const sp = new URLSearchParams(params.toString());
      sp.delete('lat'); sp.delete('lng'); sp.delete('radius');
      router.push(`/?${sp.toString()}`);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const sp = new URLSearchParams(params.toString());
        sp.set('lat', pos.coords.latitude.toFixed(6));
        sp.set('lng', pos.coords.longitude.toFixed(6));
        sp.set('radius', '200'); // 200km radius to catch more hotels
        sp.delete('page');
        router.push(`/?${sp.toString()}`);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setError('Location access denied. Please allow location in browser settings.');
        } else if (err.code === 2) {
          setError('Location unavailable. Try again.');
        } else {
          setError('Request timed out. Try again.');
        }
      },
      {
        timeout: 10000,
        maximumAge: 60000,       // use cached location up to 1 min old
        enableHighAccuracy: false, // faster, uses network location
      }
    );
  };

  return (
    <div className="flex-shrink-0">
      <button
        onClick={handleClick}
        disabled={loading}
        title={active ? 'Clear Near Me filter' : 'Find hotels near your current location'}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
          active
            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
            : error
            ? 'bg-red-50 text-red-600 border-red-200'
            : 'bg-white text-gray-700 border-gray-200 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50'
        } ${loading ? 'opacity-60 cursor-wait' : ''}`}
      >
        {loading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" strokeOpacity={0.2}/>
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
          </svg>
        ) : active ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        )}
        <span>{loading ? 'Locating…' : active ? 'Near Me ✓' : 'Near Me'}</span>
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute mt-1 z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-[220px] shadow-lg">
          {error}
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
}
