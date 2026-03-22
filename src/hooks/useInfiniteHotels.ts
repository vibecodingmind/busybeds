import { useState, useCallback, useRef } from 'react';

interface Hotel { id: string; [key: string]: any; }

interface Options {
  initialHotels: Hotel[];
  pageSize?: number;
  params?: Record<string, string>;
}

export function useInfiniteHotels({ initialHotels, pageSize = 18, params = {} }: Options) {
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHotels.length === pageSize);
  const pageRef = useRef(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = pageRef.current + 1;
      const qs = new URLSearchParams({ ...params, page: String(nextPage), limit: String(pageSize) });
      const res = await fetch(`/api/hotels?${qs}`);
      if (!res.ok) {
        setHasMore(false);
        return;
      }
      const data = await res.json();
      const newHotels: Hotel[] = data.hotels || [];
      if (newHotels.length < pageSize) setHasMore(false);
      if (newHotels.length > 0) {
        setHotels(prev => {
          const ids = new Set(prev.map(h => h.id));
          return [...prev, ...newHotels.filter(h => !ids.has(h.id))];
        });
        pageRef.current = nextPage;
      } else {
        setHasMore(false);
      }
    } catch {
      // Network or parse error — stop trying to load more to prevent crash
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, params, pageSize]);

  return { hotels, loading, hasMore, loadMore };
}
