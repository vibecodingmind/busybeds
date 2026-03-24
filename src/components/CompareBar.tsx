'use client';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';

export default function CompareBar() {
  const { hotels, removeHotel, clearAll } = useCompare();
  if (hotels.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hotels.map(h => (
              <div key={h.id} className="relative flex-1 min-w-0 max-w-[160px]">
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  {h.coverImage
                    ? <img src={h.coverImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm">🏨</div>
                  }
                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{h.name}</p>
                </div>
                <button onClick={() => removeHotel(h.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">×</button>
              </div>
            ))}
            {hotels.length < 3 && (
              <div className="flex-1 min-w-[80px] max-w-[160px] h-12 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-center">
                <span className="text-xs text-gray-400">+ Add hotel</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hotels.length >= 2 && (
              <Link href={`/compare?ids=${hotels.map(h => h.id).join(',')}`}
                className="px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: '#E8395A' }}>
                Compare {hotels.length}
              </Link>
            )}
            <button onClick={clearAll} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1.5">
          {hotels.length === 1 ? 'Add 1 more hotel to compare' : hotels.length === 2 ? 'Add 1 more or click Compare' : 'Comparing 3 hotels'}
        </p>
      </div>
    </div>
  );
}
