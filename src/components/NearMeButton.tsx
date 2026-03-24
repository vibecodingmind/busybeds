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
      setError('Geolocation not supported');
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
        sp.set('radius', '50');
        sp.delete('page');
        router.push(`/?${sp.toString()}`);
      },
      (err) => {
        setLoading(false);
        setError(err.code === 1 ? 'Location access denied' : 'Could not get location');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="flex-shrink-0">
      <button
        onClick={handleClick}
        disabled={loading}
        title={error || (active ? 'Clear Near Me filter' : 'Find hotels near your current location')}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
          active
            ? 'bg-rose-600 text-white border-rose-600'
            : error
            ? 'bg-red-50 text-red-600 border-red-200'
            : 'bg-white text-gray-700 border-gray-200 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50'
        } ${loading ? 'opacity-60 cursor-wait' : ''}`}
      >
        {loading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/>
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        )}
        <span>{loading ? 'Locating…' : active ? 'Near Me ✓' : 'Near Me'}</span>
      </button>
      {error && <p className="text-[11px] text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}
