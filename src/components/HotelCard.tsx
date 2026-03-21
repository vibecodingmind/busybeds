'use client';
import { useState } from 'react';
import Link from 'next/link';
import FavoriteButton from './FavoriteButton';
import { useCurrency } from '@/context/CurrencyContext';

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  slug: string;
  coverImage: string | null;
  discountPercent: number;
  starRating: number;
  avgRating: number | null;
  reviewCount: number;
  isFeatured: boolean;
  roomTypes: Array<{ pricePerNight: number }>;
  photos: Array<{ id: string; url: string }>;
}

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  const { format } = useCurrency();

  const allImages = [
    hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    ...hotel.photos.map(p => p.url),
  ].filter(Boolean);

  const [imgIndex, setImgIndex] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i - 1 + allImages.length) % allImages.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i + 1) % allImages.length);
  };

  const basePrice = hotel.roomTypes[0]?.pricePerNight ?? null;
  const discountedPrice = basePrice ? Math.round(basePrice * (1 - hotel.discountPercent / 100)) : null;
  const rating = hotel.avgRating ?? hotel.starRating ?? null;

  return (
    <Link href={`/hotels/${hotel.slug}`} className="group block">
      {/* Image container — square aspect ratio like Airbnb */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
        <img
          src={allImages[imgIndex]}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
          }}
        />

        {/* Featured badge (like "Guest favourite") */}
        {hotel.isFeatured && (
          <div className="absolute top-3 left-3 bg-white text-gray-900 text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-sm">
            Guest favourite
          </div>
        )}

        {/* Discount badge */}
        {hotel.discountPercent >= 10 && !hotel.isFeatured && (
          <div className="absolute top-3 left-3 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-sm" style={{ background: '#FF385C' }}>
            {hotel.discountPercent}% off
          </div>
        )}

        {/* Favorite button */}
        <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
          <FavoriteButton hotelId={hotel.id} size="sm" />
        </div>

        {/* Carousel arrows — only show on hover if multiple images */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95"
              aria-label="Previous photo"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95"
              aria-label="Next photo"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }}
                  className={`rounded-full transition-all ${i === imgIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        {/* Row 1: Name + Rating */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 text-[15px] leading-snug truncate flex-1">{hotel.name}</p>
          {rating != null && (
            <div className="flex items-center gap-1 flex-shrink-0 text-[14px] text-gray-900">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span className="font-medium">{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            </div>
          )}
        </div>

        {/* Row 2: City, Country */}
        <p className="text-gray-500 text-sm truncate">{hotel.city}, {hotel.country}</p>

        {/* Row 3: Price */}
        {basePrice && (
          <p className="text-[15px] text-gray-900 mt-1">
            {discountedPrice ? (
              <>
                <span className="line-through text-gray-400 mr-1">{format(basePrice)}</span>
                <span className="font-semibold">{format(discountedPrice)}</span>
                <span className="text-gray-500 font-normal"> / night</span>
              </>
            ) : (
              <>
                <span className="font-semibold">{format(basePrice)}</span>
                <span className="text-gray-500 font-normal"> / night</span>
              </>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
