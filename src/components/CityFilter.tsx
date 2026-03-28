'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  cities: string[];
  activeCity?: string;
}

export default function CityFilter({ cities, activeCity }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (cities.length <= 1) return null;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      {activeCity ? (
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#E8395A] text-[#E8395A] bg-red-50">
            📍 {activeCity}
          </span>
          <Link
            href="/"
            className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-[#E8395A] hover:bg-red-200 transition-colors text-xs font-bold"
            title="Clear city filter"
          >
            ×
          </Link>
        </div>
      ) : (
        <button
          onClick={() => setOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:border-gray-300 transition-all"
        >
          📍 City
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      )}

      {/* Dropdown */}
      {open && !activeCity && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 py-2 min-w-[160px] max-h-64 overflow-y-auto">
          {cities.slice(0, 15).map(c => (
            <Link
              key={c}
              href={`/?city=${encodeURIComponent(c)}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#E8395A] transition-colors"
            >
              <span className="text-gray-300">📍</span> {c}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
