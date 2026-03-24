'use client';
import { useCallback } from 'react';
import HotelCard from './HotelCard';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';
import { HotelGridSkeleton } from './Skeleton';
import { useInfiniteHotels } from '@/hooks/useInfiniteHotels';

interface Hotel { id: string; [key: string]: any; }

interface Props {
  initialHotels: Hotel[];
  searchParams: Record<string, string | undefined>;
  pageSize?: number;
}

export default function HotelGridClient({ initialHotels, searchParams, pageSize = 18 }: Props) {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (v && k !== 'page') params[k] = v;
  }

  const { hotels, loading, hasMore, loadMore } = useInfiniteHotels({
    initialHotels,
    pageSize,
    params,
  });

  const handleLoadMore = useCallback(() => { loadMore(); }, [loadMore]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 gap-y-8">
        {(hotels as any[]).map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>

      {loading && !hotels.length && <HotelGridSkeleton count={pageSize} />}

      <InfiniteScrollTrigger
        onIntersect={handleLoadMore}
        loading={loading}
        hasMore={hasMore}
      />
    </>
  );
}
