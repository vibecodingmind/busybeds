'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface CompareHotel {
  id: string; name: string; slug: string;
  coverImage: string | null; starRating: number;
  discountPercent: number; city: string; country: string;
  avgRating: number | null; couponLimitPerPeriod?: number;
}

interface CompareContextType {
  hotels: CompareHotel[];
  addHotel: (h: CompareHotel) => void;
  removeHotel: (id: string) => void;
  clearAll: () => void;
  isComparing: (id: string) => boolean;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextType>({
  hotels: [], addHotel: () => {}, removeHotel: () => {}, clearAll: () => {},
  isComparing: () => false, canAdd: true,
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [hotels, setHotels] = useState<CompareHotel[]>([]);

  const addHotel = (h: CompareHotel) => {
    if (hotels.length >= 3 || hotels.find(x => x.id === h.id)) return;
    setHotels(prev => [...prev, h]);
  };

  const removeHotel = (id: string) => setHotels(prev => prev.filter(h => h.id !== id));
  const clearAll = () => setHotels([]);
  const isComparing = (id: string) => hotels.some(h => h.id === id);
  const canAdd = hotels.length < 3;

  return (
    <CompareContext.Provider value={{ hotels, addHotel, removeHotel, clearAll, isComparing, canAdd }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() { return useContext(CompareContext); }
