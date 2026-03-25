'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  currentView: 'list' | 'map';
}

export default function ViewToggle({ currentView }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = (view: 'list' | 'map') => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'map') {
      params.set('view', 'map');
    } else {
      params.delete('view');
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/', { scroll: false });
  };

  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-xl">
      <button
        onClick={() => setView('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          currentView === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        List
      </button>
      <button
        onClick={() => setView('map')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          currentView === 'map'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        Map
      </button>
    </div>
  );
}
