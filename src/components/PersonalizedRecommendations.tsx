'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';

interface Hotel {
  id: string; name: string; slug: string; city: string; country: string;
  coverImage: string | null; discountPercent: number; starRating: number;
  avgRating: number | null; roomTypes: Array<{ pricePerNight: number }>;
}

export default function PersonalizedRecommendations() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    // Get recently viewed hotel IDs from localStorage
    const viewed: Array<{ id: string; slug: string; city?: string }> = [];
    try {
      const raw = localStorage.getItem('bb_recently_viewed');
      if (raw) viewed.push(...JSON.parse(raw));
    } catch {}

    // Get favorite hotel IDs
    const favorites: string[] = [];
    try {
      const raw = localStorage.getItem('bb_favorites');
      if (raw) favorites.push(...JSON.parse(raw));
    } catch {}

    const seenIds = [...viewed.map(h => h.id), ...favorites];

    // Fetch recommendations based on history
    const params = new URLSearchParams({ limit: '6', sort: 'discount' });
    if (viewed[0]?.city) params.set('search', viewed[0].city);

    fetch(`/api/hotels?${params}`)
      .then(r => r.json())
      .then(data => {
        // Filter out already seen hotels
        const recs = (data.hotels || []).filter((h: Hotel) => !seenIds.includes(h.id)).slice(0, 6);
        setHotels(recs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || hotels.length === 0) return null;

  return (
    <section className="max-w-[1760px] mx-auto px-6 sm:px-10 py-10">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recommended for you</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {hotels.map(hotel => {
          const base = hotel.roomTypes[0]?.pricePerNight ?? null;
          const discounted = base ? Math.round(base * (1 - hotel.discountPercent / 100)) : null;
          const rating = hotel.avgRating ?? hotel.starRating;
          return (
            <Link key={hotel.id} href={`/hotels/${hotel.slug}`} className="group block">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2 relative">
                <img
                  src={hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
                />
                {hotel.discountPercent >= 10 && (
                  <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {hotel.discountPercent}% off
                  </div>
                )}
              </div>
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{hotel.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{hotel.city}, {hotel.country}</p>
              <div className="flex items-center justify-between mt-1">
                {discounted && (
                  <p className="text-xs text-gray-900 dark:text-white font-semibold">{format(discounted)}<span className="font-normal text-gray-500">/night</span></p>
                )}
                {rating != null && (
                  <div className="flex items-center gap-0.5 text-xs text-gray-700 dark:text-gray-300">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {typeof rating === 'number' ? rating.toFixed(1) : rating}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
