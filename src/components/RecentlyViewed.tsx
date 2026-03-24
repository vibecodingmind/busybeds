'use client';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import Link from 'next/link';

export default function RecentlyViewed() {
  const { recent, clearRecent } = useRecentlyViewed();

  if (recent.length === 0) return null;

  return (
    <section className="py-6 border-b border-gray-100">
      <div className="max-w-[1760px] mx-auto px-6 sm:px-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Recently Viewed</h2>
          <button onClick={clearRecent} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recent.map(hotel => (
            <Link key={hotel.id} href={`/hotels/${hotel.slug}`}
              className="flex-shrink-0 w-44 group">
              <div className="relative h-28 rounded-xl overflow-hidden bg-gray-100 mb-2">
                {hotel.coverImage
                  ? <img src={hotel.coverImage} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">🏨</div>
                }
                <div className="absolute top-2 right-2 bg-[#E8395A] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  -{hotel.discountPercent}%
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#E8395A] transition-colors">{hotel.name}</p>
              <p className="text-xs text-gray-400">{hotel.city}, {hotel.country}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
