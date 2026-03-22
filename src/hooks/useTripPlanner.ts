import { useEffect, useState, useCallback } from 'react';

const KEY = 'bb_trip_plan';

export interface TripHotel {
  hotelId: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  coverImage: string | null;
  starRating: number;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export function useTripPlanner() {
  const [plan, setPlan] = useState<TripHotel[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setPlan(JSON.parse(stored));
    } catch {}
  }, []);

  const save = (updated: TripHotel[]) => {
    setPlan(updated);
    try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
  };

  const addHotel = useCallback((hotel: Omit<TripHotel, 'checkIn' | 'checkOut' | 'notes'>) => {
    setPlan(prev => {
      if (prev.some(h => h.hotelId === hotel.hotelId)) return prev;
      const updated = [...prev, hotel];
      try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const removeHotel = useCallback((hotelId: string) => {
    setPlan(prev => {
      const updated = prev.filter(h => h.hotelId !== hotelId);
      try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const updateHotel = useCallback((hotelId: string, patch: Partial<Pick<TripHotel, 'checkIn' | 'checkOut' | 'notes'>>) => {
    setPlan(prev => {
      const updated = prev.map(h => h.hotelId === hotelId ? { ...h, ...patch } : h);
      try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearPlan = useCallback(() => {
    setPlan([]);
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  const isInPlan = useCallback((hotelId: string) => plan.some(h => h.hotelId === hotelId), [plan]);

  return { plan, addHotel, removeHotel, updateHotel, clearPlan, isInPlan };
}
