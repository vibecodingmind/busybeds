'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PhotoLightbox from '@/components/PhotoLightbox';
import ReviewsSection from '@/components/ReviewsSection';
import PriceAlertButton from '@/components/PriceAlertButton';
import GetCouponButton from './GetCouponButton';
import { VIBE_TAGS } from '@/lib/vibeTags';

export interface RelatedHotel {
  id: string; name: string; slug: string; city: string; country: string;
  coverImage: string | null; photo: string | null;
  discountPercent: number; avgRating: number | null; reviewCount: number;
  basePrice: number | null;
}

export interface HotelData {
  id: string; name: string; city: string; country: string;
  address: string | null; category: string | null; slug: string;
  descriptionShort: string; descriptionLong: string;
  starRating: number; amenities: string[]; vibeTags?: string[];
  websiteUrl: string | null; whatsapp: string | null; email: string | null;
  coverImage: string | null; discountPercent: number; couponValidDays: number;
  avgRating: number | null; reviewCount: number; isFeatured: boolean;
  roomTypes: Array<{ id: string; name: string; description: string; pricePerNight: number; maxOccupancy: number }>;
  photos: Array<{ id: string; url: string }>;
  affiliateLinks: Array<{ id: string; platform: string; url: string }>;
}

type SubState = 'loading' | 'not_logged_in' | 'no_sub' | 'expired' | 'limit_reached' | 'active';

/* ─── Partner platform metadata ─────────────────────────── */
const PARTNERS: Record<string, { name: string; bg: string; text: string; logo: string }> = {
  booking_com:  { name: 'Booking.com',  bg: '#003580', text: '#fff',    logo: 'https://logo.clearbit.com/booking.com'  },
  airbnb:       { name: 'Airbnb',       bg: '#FF5A5F', text: '#fff',    logo: 'https://logo.clearbit.com/airbnb.com'   },
  expedia:      { name: 'Expedia',      bg: '#00355F', text: '#fff',    logo: 'https://logo.clearbit.com/expedia.com'  },
  agoda:        { name: 'Agoda',        bg: '#E31837', text: '#fff',    logo: 'https://logo.clearbit.com/agoda.com'    },
  tripadvisor:  { name: 'TripAdvisor',  bg: '#00A680', text: '#fff',    logo: 'https://logo.clearbit.com/tripadvisor.com' },
  hotels_com:   { name: 'Hotels.com',   bg: '#D4001C', text: '#fff',    logo: 'https://logo.clearbit.com/hotels.com'   },
  kayak:        { name: 'KAYAK',        bg: '#FF690F', text: '#fff',    logo: 'https://logo.clearbit.com/kayak.com'    },
  trivago:      { name: 'Trivago',      bg: '#007DC3', text: '#fff',    logo: 'https://logo.clearbit.com/trivago.com'  },
};

/* ─── Amenity icon map ───────────────────────────────────── */
function AmenityIcon({ name }: { name: string }) {
  const lc = name.toLowerCase();
  const s = 18;
  const sw = 1.8;
  const cls = `flex-shrink-0 text-[#FF385C]`;
  const base = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (lc.includes('wifi') || lc.includes('internet'))
    return <svg {...base} className={cls}><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>;
  if (lc.includes('pool') || lc.includes('swim'))
    return <svg {...base} className={cls}><path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M2 19c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M12 3v5M9 6l3-3 3 3"/></svg>;
  if (lc.includes('gym') || lc.includes('fitness'))
    return <svg {...base} className={cls}><path d="M6 4v16M18 4v16M6 12h12M2 8v8M22 8v8"/></svg>;
  if (lc.includes('spa') || lc.includes('wellness') || lc.includes('massage'))
    return <svg {...base} className={cls}><path d="M12 22s8-4.5 8-11.5A8 8 0 0012 3a8 8 0 00-8 8.5c0 7 8 10.5 8 10.5z"/><path d="M12 3v19"/><path d="M7 8c1.5 2 3 3 5 3s3.5-1 5-3"/></svg>;
  if (lc.includes('restaurant') || lc.includes('dining') || lc.includes('food'))
    return <svg {...base} className={cls}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20M21 15V2v0a5 5 0 00-5 5v6h3v7M18 22v-7"/></svg>;
  if (lc.includes('bar') || lc.includes('lounge') || lc.includes('cocktail'))
    return <svg {...base} className={cls}><path d="M8 22h8M12 11v11M3 3h18l-2 5H5L3 3z"/><path d="M8 8s1 3 4 3 4-3 4-3"/></svg>;
  if (lc.includes('parking') || lc.includes('garage'))
    return <svg {...base} className={cls}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>;
  if (lc.includes('air') || lc.includes('ac') || lc.includes('condition'))
    return <svg {...base} className={cls}><path d="M8 4v16M16 4v16M4 8h16M4 16h16"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>;
  if (lc.includes('beach') || lc.includes('ocean') || lc.includes('sea'))
    return <svg {...base} className={cls}><path d="M2 22s4-4 10-4 10 4 10 4"/><path d="M7 14c0-3 2-5 5-7 3 2 5 4 5 7"/><path d="M12 7V3M9 5l3-2 3 2"/></svg>;
  if (lc.includes('breakfast') || lc.includes('coffee') || lc.includes('café'))
    return <svg {...base} className={cls}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
  if (lc.includes('pet') || lc.includes('dog') || lc.includes('cat'))
    return <svg {...base} className={cls}><path d="M10 5.172C10 3.443 8.557 2 6.828 2s-3.172 1.443-3.172 3.172C3.656 8.558 6 10 6 10s2.344-1.443 2.344-4.828z"/><path d="M14 5.172C14 3.443 15.443 2 17.172 2s3.172 1.443 3.172 3.172C20.344 8.558 18 10 18 10s-2.344-1.443-2.344-4.828z"/><path d="M6 10c0 4 2 6 6 8 4-2 6-4 6-8"/><path d="M9 14c0 1 1 2 3 2s3-1 3-2"/></svg>;
  if (lc.includes('room service') || lc.includes('service') || lc.includes('bell'))
    return <svg {...base} className={cls}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><line x1="12" y1="2" x2="12" y2="4"/></svg>;
  if (lc.includes('tv') || lc.includes('television'))
    return <svg {...base} className={cls}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M17 2l-5 5-5-5"/></svg>;
  if (lc.includes('safe') || lc.includes('security') || lc.includes('locker'))
    return <svg {...base} className={cls}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>;
  if (lc.includes('laundry') || lc.includes('washer') || lc.includes('laund'))
    return <svg {...base} className={cls}><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M6 6h.01M9 6h.01M12 6h.01"/></svg>;
  if (lc.includes('lift') || lc.includes('elevator'))
    return <svg {...base} className={cls}><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M8 7l4-4 4 4M8 17l4 4 4-4M12 3v18"/></svg>;
  if (lc.includes('concierge') || lc.includes('reception') || lc.includes('24'))
    return <svg {...base} className={cls}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (lc.includes('transfer') || lc.includes('shuttle') || lc.includes('airport'))
    return <svg {...base} className={cls}><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5a2 2 0 01-2 2h-2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg>;
  if (lc.includes('view') || lc.includes('balcony') || lc.includes('terrace'))
    return <svg {...base} className={cls}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  // default
  return <svg {...base} className={cls}><polyline points="20 6 9 17 4 12"/></svg>;
}

/* ─── Stars ─────────────────────────────────────────────── */
function Stars({ n, max = 5, size = 16 }: { n: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < Math.round(n) ? '#FF385C' : '#e5e7eb'} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function HotelPageClient({
  hotel,
  relatedHotels = [],
}: {
  hotel: HotelData;
  relatedHotels?: RelatedHotel[];
}) {
  const [subState, setSubState] = useState<SubState>('loading');
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetch('/api/subscription-status')
      .then(r => r.ok ? r.json() : { state: 'not_logged_in' })
      .then(({ state }) => setSubState(state || 'not_logged_in'))
      .catch(() => setSubState('not_logged_in'));
  }, []);

  const allPhotos = [
    ...(hotel.coverImage ? [{ id: 'cover', url: hotel.coverImage }] : []),
    ...hotel.photos,
  ];
  const basePrice       = hotel.roomTypes[0]?.pricePerNight;
  const discountedPrice = basePrice ? Math.round(basePrice * (1 - hotel.discountPercent / 100)) : null;
  const savings         = basePrice && discountedPrice ? Math.round(basePrice - discountedPrice) : null;

  const canClickPartner = subState === 'active';

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      {/* ── Photo Grid ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-5">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[420px]">
          {/* Main large photo */}
          <div className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => { setLightboxIndex(0); setShowLightbox(true); }}>
            <img src={allPhotos[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
              alt={hotel.name} className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300" />
            {allPhotos.length > 5 && (
              <button onClick={e => { e.stopPropagation(); setShowLightbox(true); }}
                className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-2 rounded-full shadow hover:bg-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                View all {allPhotos.length} photos
              </button>
            )}
          </div>
          {/* 4 smaller photos */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="relative cursor-pointer group overflow-hidden"
              onClick={() => { setLightboxIndex(i); setShowLightbox(true); }}>
              {allPhotos[i] ? (
                <img src={allPhotos[i].url} alt={`${hotel.name} ${i}`}
                  className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

        {/* ════ LEFT COLUMN ════════════════════════════════════ */}
        <div className="min-w-0">

          {/* Hotel title + meta */}
          <div className="mb-8">
            <div className="flex items-start gap-3 flex-wrap mb-2">
              {hotel.category && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">{hotel.category}</span>
              )}
              {hotel.isFeatured && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">⭐ Featured</span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">{hotel.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Stars n={hotel.starRating} size={16} />
              <span className="text-sm text-gray-500">{hotel.starRating}-star hotel</span>
              {hotel.avgRating && (
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {hotel.avgRating.toFixed(1)}
                  <span className="text-gray-400 font-normal">({hotel.reviewCount} reviews)</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {hotel.address || `${hotel.city}, ${hotel.country}`}
            </p>
          </div>

          {/* Contact details */}
          {(hotel.whatsapp || hotel.email || hotel.websiteUrl) && (
            <div className="mb-8 pb-8 border-b border-gray-100">
              <div className="flex flex-wrap gap-3">
                {hotel.whatsapp && (
                  <a href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C47] rounded-xl text-sm font-semibold hover:bg-[#25D366]/20 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {hotel.whatsapp}
                  </a>
                )}
                {hotel.email && (
                  <a href={`mailto:${hotel.email}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {hotel.email}
                  </a>
                )}
                {hotel.websiteUrl && (
                  <a href={hotel.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                    </svg>
                    Official Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3">About this hotel</h2>
            <p className="text-gray-600 leading-relaxed">{hotel.descriptionLong || hotel.descriptionShort}</p>
          </div>

          {/* Room types */}
          {hotel.roomTypes.length > 0 && (
            <div className="mb-8 pb-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Room types</h2>
              <div className="space-y-3">
                {hotel.roomTypes.map(room => {
                  const disc = Math.round(room.pricePerNight * (1 - hotel.discountPercent / 100));
                  return (
                    <div key={room.id} className="flex items-start justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-0.5">{room.name}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                          Up to {room.maxOccupancy} guest{room.maxOccupancy !== 1 ? 's' : ''}
                        </p>
                        {room.description && <p className="text-sm text-gray-500 mt-1">{room.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-gray-400 line-through">${room.pricePerNight.toFixed(0)}/night</p>
                        <p className="text-lg font-bold text-gray-900">${disc}<span className="text-xs font-normal text-gray-400">/night</span></p>
                        <p className="text-xs font-semibold text-green-600">Save ${(room.pricePerNight - disc).toFixed(0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amenities */}
          {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
            <div className="mb-8 pb-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((am, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <AmenityIcon name={am} />
                    <span className="text-sm text-gray-700 font-medium">{am}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vibe Tags */}
          {Array.isArray(hotel.vibeTags) && hotel.vibeTags.length > 0 && (
            <div className="mb-8 pb-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Vibes</h2>
              <div className="flex flex-wrap gap-2">
                {hotel.vibeTags.map(tagId => {
                  const vt = VIBE_TAGS.find(v => v.id === tagId);
                  if (!vt) return null;
                  return (
                    <Link key={tagId} href={`/?vibeTag=${tagId}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-rose-300 hover:bg-rose-50 transition-colors shadow-sm">
                      <span>{vt.emoji}</span><span className="font-medium">{vt.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ReviewsSection hotelId={hotel.id} hotelName={hotel.name} avgRating={hotel.avgRating} reviewCount={hotel.reviewCount} />

          {/* Related Hotels */}
          {relatedHotels.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                More hotels in {hotel.city}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {relatedHotels.map(h => {
                  const img = h.photo || h.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                  const disc = h.basePrice ? Math.round(h.basePrice * (1 - h.discountPercent / 100)) : null;
                  return (
                    <Link key={h.id} href={`/hotels/${h.slug}`}
                      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-36 overflow-hidden">
                        <img src={img} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {h.discountPercent}% off
                        </div>
                        {h.avgRating && (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-gray-800 flex items-center gap-0.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            {h.avgRating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-gray-900 text-sm truncate">{h.name}</p>
                        <p className="text-xs text-gray-400 mb-1">{h.city}, {h.country}</p>
                        {disc && (
                          <p className="text-sm font-bold text-gray-900">
                            <span className="line-through text-gray-400 font-normal text-xs mr-1">${h.basePrice?.toFixed(0)}</span>
                            ${disc}<span className="text-xs text-gray-400 font-normal">/night</span>
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT COLUMN (sticky) ══════════════════════════ */}
        <div className="lg:sticky lg:top-24 space-y-4">

          {/* ── Coupon Widget ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-6">
            {/* Pricing */}
            {basePrice && (
              <div className="mb-5">
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">${discountedPrice}</span>
                  <span className="text-gray-400 line-through text-base mb-1">${basePrice.toFixed(0)}</span>
                </div>
                <p className="text-xs text-gray-400">per night · before taxes</p>
                {savings && (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full text-xs font-semibold text-green-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    You save ${savings}/night · {hotel.discountPercent}% off
                  </div>
                )}
              </div>
            )}

            {/* Coupon generation — handles all subscription states internally */}
            {subState === 'loading' ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : (
              <GetCouponButton hotelId={hotel.id} hotelName={hotel.name} />
            )}

            <p className="text-xs text-gray-400 text-center mt-3">
              Valid for {hotel.couponValidDays} days · Show at reception
            </p>
          </div>

          {/* ── Book Directly (Partners) ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900">Book Directly</h3>
              {!canClickPartner && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {subState === 'not_logged_in' ? 'Sign in to access' : 'Subscription required'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">Our partner booking platforms</p>

            {hotel.affiliateLinks.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {hotel.affiliateLinks.map(link => {
                  const p = PARTNERS[link.platform] || { name: link.platform, bg: '#374151', text: '#fff', logo: '' };
                  return canClickPartner ? (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 border-2 border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group bg-white">
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} className="h-6 w-auto object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : null}
                      <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900">{p.name}</span>
                    </a>
                  ) : (
                    <div key={link.id}
                      className="flex flex-col items-center gap-1.5 p-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed opacity-60 relative">
                      <svg className="absolute top-1.5 right-1.5 text-gray-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} className="h-6 w-auto object-contain grayscale"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : null}
                      <span className="text-xs font-semibold text-gray-400">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* No links yet — show all partner logos as placeholders */
              <div className="grid grid-cols-3 gap-2">
                {Object.values(PARTNERS).map(p => (
                  <div key={p.name}
                    className="flex flex-col items-center gap-1.5 p-2.5 border border-gray-100 rounded-xl bg-gray-50 opacity-40">
                    <img src={p.logo} alt={p.name} className="h-5 w-auto object-contain grayscale"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-[10px] font-medium text-gray-400 text-center leading-tight">{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            {!canClickPartner && (
              <Link href={subState === 'not_logged_in' ? '/login' : '/subscribe'}
                className="mt-3 w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#FF385C' }}>
                {subState === 'not_logged_in' ? 'Sign in to access partner links' : 'Subscribe to unlock partner links'}
              </Link>
            )}
          </div>

          {/* ── Price Alert ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Price Alert</h3>
            <p className="text-xs text-gray-400 mb-3">Get notified when the discount increases</p>
            <PriceAlertButton hotelId={hotel.id} hotelName={hotel.name} discountPercent={hotel.discountPercent} />
          </div>

          {/* ── Contact via WhatsApp ── */}
          {hotel.whatsapp && (
            <a href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, '')}?text=Hi%2C%20I%20found%20your%20hotel%20on%20BusyBeds%20and%20I%27m%20interested%20in%20booking%20at%20${encodeURIComponent(hotel.name)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-2xl p-4 shadow-md transition-colors group">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div className="flex-1">
                <p className="font-bold text-sm">Chat on WhatsApp</p>
                <p className="text-xs text-white/80">Contact hotel directly</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          )}

        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <PhotoLightbox
          photos={allPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" style={{ color: '#FF385C' }}>busybeds</span>
            <span className="text-xs text-gray-400">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/subscribe" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/apply" className="hover:text-gray-900 transition-colors">List Your Hotel</Link>
            <Link href="/profile" className="hover:text-gray-900 transition-colors">Account</Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
