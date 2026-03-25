'use client';

import HotelSplitView from './HotelSplitView';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Hotel = any;

interface Props {
  initialHotels: Hotel[];
  searchParams: Record<string, string | undefined>;
  pageSize?: number;
  totalHotels: number;
  viewMode: 'list' | 'map';
}

export default function HotelViewContainer({
  initialHotels,
  searchParams,
  pageSize = 18,
  totalHotels,
  viewMode,
}: Props) {
  return (
    <div>
      {/* Hotel count */}
      <p className="text-sm text-gray-500 mb-5">
        <span className="font-bold text-gray-900">{totalHotels}</span> hotels found
      </p>

      {/* Hotel View */}
      <HotelSplitView
        initialHotels={initialHotels}
        searchParams={searchParams}
        pageSize={pageSize}
        viewMode={viewMode}
      />
    </div>
  );
}
