'use client';

import { useState, useCallback } from 'react';
import HotelSplitView from './HotelSplitView';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  discountPercent: number;
  avgRating: number | null;
  coverImage: string | null;
  roomTypes: Array<{ pricePerNight: number }>;
  [key: string]: any;
}

interface Props {
  initialHotels: Hotel[];
  searchParams: Record<string, string | undefined>;
  pageSize?: number;
  totalHotels: number;
}

export default function HotelViewContainer({
  initialHotels,
  searchParams,
  pageSize = 18,
  totalHotels,
}: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);

  const handleHoverHotel = useCallback((hotelId: string | null) => {
    setHoveredHotelId(hotelId);
  }, []);

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{totalHotels}</span> hotels found
        </p>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
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
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'map'
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
      </div>

      {/* Hotel View */}
      <HotelSplitView
        initialHotels={initialHotels}
        searchParams={searchParams}
        pageSize={pageSize}
        viewMode={viewMode}
        onHoverHotel={handleHoverHotel}
      />
    </div>
  );
}
