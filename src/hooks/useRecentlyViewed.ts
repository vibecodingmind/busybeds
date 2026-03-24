import { useEffect, useState, useCallback } from 'react';

const KEY = 'bb_recently_viewed';
const MAX = 8;

export interface RecentHotel {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  coverImage: string | null;
  starRating: number;
  discountPercent: number;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentHotel[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {}
  }, []);

  const addHotel = useCallback((hotel: Omit<RecentHotel, 'viewedAt'>) => {
    setRecent(prev => {
      const filtered = prev.filter(h => h.id !== hotel.id);
      const updated = [{ ...hotel, viewedAt: Date.now() }, ...filtered].slice(0, MAX);
      try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    localStorage.removeItem(KEY);
  }, []);

  return { recent, addHotel, clearRecent };
}
