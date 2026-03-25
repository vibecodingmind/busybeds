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
  // Build the filter context label
  const getFilterLabel = (): string => {
    const { category, city, search, stars, minDiscount, vibeTag } = searchParams;
    
    // Priority: specific filters first
    if (category && category !== 'all') {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
    if (city) return city;
    if (search) return `"${search}"`;
    if (stars) return `${stars} star`;
    if (minDiscount) return `${minDiscount}%+ off`;
    if (vibeTag) return vibeTag;
    
    // Default to "Hotels" when no filter
    return 'Hotels';
  };

  const filterLabel = getFilterLabel();

  return (
    <div>
      {/* Hotel count with filter context */}
      <p className="text-sm text-gray-500 mb-5">
        <span className="font-bold text-gray-900">{totalHotels}</span> hotels
        <span className="text-gray-400"> · </span>
        <span className="font-semibold text-gray-700">{filterLabel}</span>
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
