'use client';
import { useState } from 'react';
import Link from 'next/link';
import FavoriteButton from './FavoriteButton';
import AddToTripButton from './AddToTripButton';
import { useCurrency } from '@/context/CurrencyContext';
import { useCompare } from '@/context/CompareContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { VIBE_TAGS } from '@/lib/vibeTags';

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
  vibeTags?: string;
  partnershipStatus: 'ACTIVE' | 'INACTIVE' | 'LISTING_ONLY';
  roomTypes: Array<{ pricePerNight: number }>;
  photos: Array<{ id: string; url: string }>;
  adminFeatured?: boolean;
  adminFeaturedUntil?: string | null;
  subscription?: {
    status: string;
    tier: {
      name: string;
      displayName: string;
      showVerifiedBadge: boolean;
    };
  } | null;
}

const FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  const { format } = useCurrency();
  const { addHotel, removeHotel, isComparing, canAdd } = useCompare();
  const { addHotel: addToRecent } = useRecentlyViewed();
  const comparing = isComparing(hotel.id);

  const allImages = [
    hotel.coverImage || FALLBACK,
    ...(hotel.photos || []).map(p => p.url),
  ].filter(Boolean);

  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i - 1 + allImages.length) % allImages.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i + 1) % allImages.length);
  };

  // Calculate minimum price from all room types ("From $X")
  const prices = hotel.roomTypes.map(r => r.pricePerNight).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasMultiplePrices = prices.length > 1;
  
  // Check if this hotel has active partnership (coupons enabled)
  const isPartnerActive = hotel.partnershipStatus === 'ACTIVE';
  
  // Only calculate discount for active partners
  const discountedPrice = (minPrice && isPartnerActive && hotel.discountPercent > 0) 
    ? Math.round(minPrice * (1 - hotel.discountPercent / 100)) 
    : null;
  const savings = (minPrice && discountedPrice) ? Math.round(minPrice - discountedPrice) : null;
  const rating = hotel.avgRating ?? hotel.starRating ?? null;
  const parsedVibeTags: string[] = (() => { try { return JSON.parse(hotel.vibeTags || '[]'); } catch { return []; } })();
  const vibeTagObjects  = parsedVibeTags.slice(0, 2).map(id => VIBE_TAGS.find(v => v.id === id)).filter(Boolean);

  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group block"
      onClick={() => addToRecent({
        id: hotel.id, name: hotel.name, slug: hotel.slug, coverImage: hotel.coverImage,
        city: hotel.city, country: hotel.country, discountPercent: hotel.discountPercent, starRating: hotel.starRating,
      })}
    >
      {/* ── Image container ── */}
      <div className="relative aspect-square rounded-[20px] overflow-hidden bg-gray-100 mb-3 shadow-sm">
        <img
          src={imgError ? FALLBACK : allImages[imgIndex]}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          onError={() => setImgError(true)}
        />

        {/* Subtle gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* ── Discount badge (only for active partners) ── */}
        {isPartnerActive && hotel.discountPercent > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}>
            {hotel.discountPercent}% off
          </div>
        )}
        
        {/* ── Listing only badge (for non-partners) ── */}
        {!isPartnerActive && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
            {hotel.partnershipStatus === 'LISTING_ONLY' ? 'Listed' : 'Partner Ended'}
          </div>
        )}

        {/* ── Premium/Subscription badge (top-right corner) ── */}
        {hotel.subscription?.status === 'active' && (
          <div 
            className="absolute top-3 right-12 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg"
            style={{ 
              background: hotel.subscription.tier.name === 'premium' ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' :
                         hotel.subscription.tier.name === 'growth' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' :
                         'linear-gradient(135deg, #059669, #047857)',
              color: 'white'
            }}>
            {hotel.subscription.tier.name === 'premium' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            )}
            {hotel.subscription.tier.name === 'growth' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 7H11V11H7V13H11V17H13V13H17V11H13V7ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/></svg>
            )}
            {hotel.subscription.tier.name === 'starter' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/></svg>
            )}
            {hotel.subscription.tier.displayName}
          </div>
        )}

        {/* ── Admin Featured badge (if manually featured by admin) ── */}
        {hotel.adminFeatured && !hotel.subscription && (
          <div className="absolute top-3 right-12 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            Featured
          </div>
        )}

        {/* Savings pill — only for active partners with discount */}
        {isPartnerActive && savings && savings > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg"
            style={{ background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(8px)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Save {format(savings)}/night
          </div>
        )}

        {/* ── Favourite button ── */}
        <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
          <FavoriteButton hotelId={hotel.id} size="sm" />
        </div>

        {/* ── Trip Planner button ── */}
        <div className="absolute bottom-3 left-3" onClick={e => e.preventDefault()}>
          <AddToTripButton hotel={{
            hotelId: hotel.id, name: hotel.name, slug: hotel.slug,
            city: hotel.city, country: hotel.country,
            coverImage: hotel.coverImage, starRating: hotel.starRating,
          }} />
        </div>

        {/* ── Compare button ── */}
        <div className="absolute bottom-3 right-3" onClick={e => e.preventDefault()}>
          <button
            onClick={e => {
              e.preventDefault(); e.stopPropagation();
              comparing ? removeHotel(hotel.id) : canAdd && addHotel({
                id: hotel.id, name: hotel.name, slug: hotel.slug,
                coverImage: hotel.coverImage, starRating: hotel.starRating,
                discountPercent: hotel.discountPercent, city: hotel.city,
                country: hotel.country, avgRating: hotel.avgRating,
              });
            }}
            disabled={!comparing && !canAdd}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 backdrop-blur-sm ${
              comparing
                ? 'bg-blue-500 text-white scale-105'
                : canAdd
                ? 'bg-white/85 text-gray-600 hover:bg-white hover:text-blue-600 hover:scale-105'
                : 'bg-white/60 text-gray-300 cursor-not-allowed'
            }`}
            title={comparing ? 'Remove from compare' : canAdd ? 'Add to compare' : 'Max 3 hotels'}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
          </button>
        </div>

        {/* ── Carousel arrows ── */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.90)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              onClick={next}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.90)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {allImages.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === imgIndex ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Info ── */}
      <div className="space-y-1 px-0.5">
        {/* Row 1: Name + Verified + Rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-1">
              {hotel.name}
            </p>
            {/* Verified badge for premium subscribers */}
            {hotel.subscription?.tier?.showVerifiedBadge && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#3B82F6" className="flex-shrink-0" title="Verified Partner">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                <circle cx="12" cy="12" r="10" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.3"/>
              </svg>
            )}
          </div>
          {rating != null && (
            <div className="flex items-center gap-1 flex-shrink-0 text-[13px] font-semibold text-gray-900">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#E8395A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {typeof rating === 'number' ? rating.toFixed(1) : rating}
              {hotel.reviewCount > 0 && (
                <span className="text-gray-400 font-normal text-[12px]">({hotel.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Location */}
        <p className="text-gray-500 text-sm truncate">
          {hotel.city}, {hotel.country}
        </p>

        {/* Row 3: Vibe tags */}
        {vibeTagObjects.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            {vibeTagObjects.map(vt => vt && (
              <span
                key={vt.id}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gray-100/80 text-gray-600 text-[11px] font-medium"
              >
                <span>{vt.emoji}</span>
                <span>{vt.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Row 4: Price */}
        {minPrice && (
          <div className="flex items-baseline gap-1.5 mt-1">
            {isPartnerActive && discountedPrice && discountedPrice < minPrice ? (
              <>
                {hasMultiplePrices && <span className="text-gray-500 text-sm font-medium">From</span>}
                <span className="line-through text-gray-400 text-sm">{format(minPrice)}</span>
                <span className="font-bold text-gray-900 text-[15px]">{format(discountedPrice)}</span>
                <span className="text-gray-500 text-sm font-normal">/ night</span>
              </>
            ) : (
              <>
                {hasMultiplePrices && <span className="text-gray-500 text-sm font-medium">From</span>}
                <span className="font-bold text-gray-900 text-[15px]">{format(minPrice)}</span>
                <span className="text-gray-500 text-sm font-normal">/ night</span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
