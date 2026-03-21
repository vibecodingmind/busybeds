'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import PhotoLightbox from '@/components/PhotoLightbox';
import HotelReviews from './HotelReviews';

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  category?: string;
  slug: string;
  descriptionShort: string;
  descriptionLong: string;
  starRating: number;
  amenities: string[];
  websiteUrl: string | null;
  coverImage: string | null;
  discountPercent: number;
  couponValidDays: number;
  avgRating: number | null;
  reviewCount: number;
  isFeatured: boolean;
  roomTypes: Array<{
    id: string;
    name: string;
    description: string;
    pricePerNight: number;
    maxOccupancy: number;
  }>;
  photos: Array<{ id: string; url: string }>;
  affiliateLinks: Array<{ id: string; platform: string; url: string }>;
}

type SubState = 'loading' | 'not_logged_in' | 'no_sub' | 'expired' | 'limit_reached' | 'active';

interface PageProps { params: { slug: string } }

const platformInfo: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  booking_com:  { label: 'Booking.com',  bg: '#003580', text: '#ffffff', dot: '#003580' },
  airbnb:       { label: 'Airbnb',       bg: '#FF5A5F', text: '#ffffff', dot: '#FF5A5F' },
  expedia:      { label: 'Expedia',      bg: '#00355F', text: '#ffffff', dot: '#00355F' },
  agoda:        { label: 'Agoda',        bg: '#5392CE', text: '#ffffff', dot: '#5392CE' },
  tripadvisor:  { label: 'TripAdvisor',  bg: '#00A680', text: '#ffffff', dot: '#00A680' },
};

function StarRating({ rating, max = 5, size = 'md' }: { rating: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <span className={`${cls} leading-none`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

/* ── Inline coupon CTA (no separate file needed) ─────────────────────────── */
function CouponCTA({ hotelId, hotelName, subState, couponLimit, couponsUsed }: {
  hotelId: string;
  hotelName: string;
  subState: SubState;
  couponLimit: number;
  couponsUsed: number;
}) {
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; qrDataUrl: string; expiresAt: string } | null>(null);
  const [error, setError] = useState('');

  const handleGet = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      setCoupon(data.coupon);
    } finally { setLoading(false); }
  };

  if (coupon) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 text-green-700 text-sm font-semibold px-4 py-2.5 rounded-xl border border-green-200">
          ✅ Coupon ready for {hotelName}!
        </div>
        {coupon.qrDataUrl && (
          <div className="flex justify-center">
            <img src={coupon.qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-2xl border-4 border-rose-100" />
          </div>
        )}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Your Coupon Code</p>
          <p className="font-mono text-sm font-bold tracking-widest text-gray-800 break-all">{coupon.code}</p>
        </div>
        <p className="text-xs text-gray-400">
          Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <Link href="/coupons" className="block text-center text-sm font-medium hover:underline" style={{ color: '#FF385C' }}>
          View all my coupons →
        </Link>
      </div>
    );
  }

  /* ── Not logged in ── */
  if (subState === 'not_logged_in') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
          <p className="text-sm font-semibold text-gray-800 mb-0.5">Sign in to get your coupon</p>
          <p className="text-xs text-gray-500">Create a free account and subscribe to unlock discounts</p>
        </div>
        <Link href={`/login?next=${encodeURIComponent('/hotels/' + hotelId)}`}
          className="block w-full text-center py-3 px-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#FF385C' }}>
          Sign In / Register
        </Link>
      </div>
    );
  }

  /* ── No subscription ── */
  if (subState === 'no_sub') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
          <p className="text-sm font-semibold text-rose-800 mb-0.5">Subscribe to get coupons</p>
          <p className="text-xs text-rose-600">A subscription unlocks exclusive hotel discounts</p>
        </div>
        <Link href="/subscribe"
          className="block w-full text-center py-3 px-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#FF385C' }}>
          🎫 Subscribe Now
        </Link>
        <p className="text-xs text-gray-400 text-center">Plans from just a few dollars/month</p>
      </div>
    );
  }

  /* ── Expired subscription ── */
  if (subState === 'expired') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-sm font-semibold text-amber-800 mb-0.5">Your subscription has expired</p>
          <p className="text-xs text-amber-700">Renew to continue getting exclusive coupons</p>
        </div>
        <Link href="/subscribe"
          className="block w-full text-center py-3 px-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#FF385C' }}>
          🔄 Renew Subscription
        </Link>
      </div>
    );
  }

  /* ── Coupon limit reached ── */
  if (subState === 'limit_reached') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
          <p className="text-sm font-semibold text-purple-800 mb-0.5">Coupon limit reached</p>
          <p className="text-xs text-purple-700">You've used {couponsUsed} of {couponLimit} coupons this period</p>
        </div>
        <Link href="/subscribe"
          className="block w-full text-center py-3 px-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#FF385C' }}>
          ⬆️ Upgrade Plan
        </Link>
        <p className="text-xs text-gray-400 text-center">Get more coupons with a higher tier</p>
      </div>
    );
  }

  /* ── Active subscription — normal get coupon ── */
  if (subState === 'active') {
    return (
      <div>
        <button
          onClick={handleGet}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 py-3"
        >
          {loading ? (
            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
          ) : '🎫 Get My Coupon'}
        </button>
        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
        <div className="mt-4 space-y-2.5">
          {[
            'Unique QR code — yours only',
            'Verified by hotel staff on-site',
            'No booking required in advance',
          ].map(t => (
            <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* loading state */
  return (
    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
  );
}

export default function HotelPage({ params }: PageProps) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAllDesc, setShowAllDesc] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [subState, setSubState] = useState<SubState>('loading');
  const [couponLimit, setCouponLimit] = useState(0);
  const [couponsUsed, setCouponsUsed] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hotelRes = await fetch(`/api/hotels/${params.slug}`);
        if (!hotelRes.ok) { notFound(); return; }
        const hotelData = await hotelRes.json();
        setHotel(hotelData);

        /* ── subscription state ── */
        try {
          const subRes = await fetch('/api/subscriptions');
          if (!subRes.ok) {
            setSubState('not_logged_in');
          } else {
            const { subscription: sub, couponsThisPeriod } = await subRes.json();

            if (!sub) {
              setSubState('no_sub');
            } else {
              const now = new Date();
              const expires = new Date(sub.expiresAt);
              if (expires <= now) {
                setSubState('expired');
              } else {
                const limit = sub.package?.couponLimitPerPeriod ?? 5;
                setCouponLimit(limit);
                setCouponsUsed(couponsThisPeriod);
                if (couponsThisPeriod >= limit) {
                  setSubState('limit_reached');
                } else {
                  setSubState('active');
                }
              }
            }

            /* favorites check */
            const favRes = await fetch('/api/favorites');
            if (favRes.ok) {
              const favData = await favRes.json();
              setIsFavorited(favData.favoriteIds?.includes(hotelData.id));
            }
          }
        } catch {
          setSubState('not_logged_in');
        }
      } catch { notFound(); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [params.slug]);

  const handleFavorite = useCallback(async () => {
    if (!hotel) return;
    if (subState === 'not_logged_in') {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setFavLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
      }
    } finally {
      setFavLoading(false);
    }
  }, [hotel, subState]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = hotel?.name || 'Hotel';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* user dismissed */ }
    }
    /* fallback: copy to clipboard */
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* ignore */ }
  }, [hotel]);

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="h-[440px] bg-gray-100 rounded-2xl animate-pulse mb-6" />
        <div className="h-8 bg-gray-100 rounded-xl w-1/2 animate-pulse mb-3" />
        <div className="h-4 bg-gray-100 rounded-xl w-1/3 animate-pulse" />
      </div>
    </div>
  );

  if (!hotel) { notFound(); return null; }

  const photos = hotel.photos.length > 0
    ? hotel.photos
    : [{ id: 'cover', url: hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200' }];

  const descLong = hotel.descriptionLong || hotel.descriptionShort;
  const descTrimmed = descLong.length > 300 && !showAllDesc ? descLong.slice(0, 300) + '…' : descLong;

  const discountedPrice = hotel.roomTypes[0]
    ? Math.round(hotel.roomTypes[0].pricePerNight * (1 - hotel.discountPercent / 100))
    : null;

  const activeAffiliates = hotel.affiliateLinks.filter(l => platformInfo[l.platform]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-900 transition-colors">Hotels</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
          <Link href={`/?search=${encodeURIComponent(hotel.city)}`} className="hover:text-gray-900 transition-colors">{hotel.city}</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{hotel.name}</span>
        </nav>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {hotel.isFeatured && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: '#FF385C' }}>
                  ⭐ Guest Favourite
                </span>
              )}
              {hotel.category && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{hotel.category}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{hotel.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <StarRating rating={hotel.starRating} size="sm" />
                <span className="text-sm text-gray-500">{hotel.starRating}-star hotel</span>
              </div>
              {hotel.avgRating !== null && (
                <>
                  <span className="text-gray-300">·</span>
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span className="text-sm font-semibold text-gray-900">{hotel.avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({hotel.reviewCount} {hotel.reviewCount === 1 ? 'review' : 'reviews'})</span>
                  </div>
                </>
              )}
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {hotel.city}, {hotel.country}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save / Favorite */}
            <button
              onClick={handleFavorite}
              disabled={favLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all disabled:opacity-50"
              style={isFavorited
                ? { borderColor: '#FF385C', color: '#FF385C', background: '#FF385C10' }
                : { borderColor: '#d1d5db', color: '#374151', background: 'transparent' }
              }
            >
              <svg width="15" height="15" viewBox="0 0 24 24"
                fill={isFavorited ? '#FF385C' : 'none'}
                stroke={isFavorited ? '#FF385C' : 'currentColor'}
                strokeWidth={2} strokeLinecap="round">
                <path strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"/>
              </svg>
              {isFavorited ? 'Saved' : 'Save'}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {shareCopied ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Share
                </>
              )}
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
            <div className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
              onClick={() => setLightboxIndex(0)}>
              <img src={photos[0]?.url} alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className="relative cursor-pointer group overflow-hidden"
                onClick={() => setLightboxIndex(i)}>
                <img src={photos[i]?.url || photos[0]?.url} alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                {i === 4 && photos.length > 5 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-sm font-semibold">+{photos.length - 4} photos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setLightboxIndex(0)}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Show all photos
          </button>
        </div>

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <PhotoLightbox photos={photos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left: Main Content ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            <section className="border-b border-gray-100 pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About this hotel</h2>
              <p className="text-gray-700 leading-relaxed">{descTrimmed}</p>
              {descLong.length > 300 && (
                <button onClick={() => setShowAllDesc(!showAllDesc)}
                  className="mt-3 text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors">
                  {showAllDesc ? 'Show less' : 'Show more'}
                </button>
              )}
            </section>

            {/* Amenities */}
            {hotel.amenities.length > 0 && (
              <section className="border-b border-gray-100 pb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What this place offers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {hotel.amenities.map((a: string) => (
                    <div key={a} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={2} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Room Types */}
            {hotel.roomTypes.length > 0 && (
              <section className="border-b border-gray-100 pb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Room Types</h2>
                <div className="space-y-3">
                  {hotel.roomTypes.map(room => {
                    const discounted = Math.round(room.pricePerNight * (1 - hotel.discountPercent / 100));
                    return (
                      <div key={room.id} className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={1.5} strokeLinecap="round"><path d="M2 20v-4a2 2 0 012-2h16a2 2 0 012 2v4"/><path d="M7 14V8a1 1 0 011-1h8a1 1 0 011 1v6"/><path d="M2 10h20"/></svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{room.name}</p>
                            {room.description && <p className="text-sm text-gray-500 mt-0.5">{room.description}</p>}
                            <p className="text-xs text-gray-400 mt-1">Up to {room.maxOccupancy} guests</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-400 line-through">${room.pricePerNight.toFixed(0)}/night</div>
                          <div className="text-xl font-bold text-gray-900">${discounted}</div>
                          <div className="text-xs font-semibold mt-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                            {hotel.discountPercent}% off
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Booking Partners ── */}
            {activeAffiliates.length > 0 && (
              <section className="border-b border-gray-100 pb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Book on these platforms</h2>
                <p className="text-sm text-gray-500 mb-5">Also available on these trusted booking sites</p>
                <div className="flex flex-wrap gap-3">
                  {activeAffiliates.map(link => {
                    const p = platformInfo[link.platform];
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-85 hover:shadow-md"
                        style={{ background: p.bg, color: p.text }}
                      >
                        <span className="w-2 h-2 rounded-full bg-white opacity-80 flex-shrink-0" />
                        {p.label}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="opacity-70"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location */}
            <section className="border-b border-gray-100 pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Where you&apos;ll be</h2>
              {hotel.address
                ? <p className="text-sm text-gray-500 mb-4">{hotel.address}, {hotel.city}, {hotel.country}</p>
                : <p className="text-sm text-gray-500 mb-4">{hotel.city}, {hotel.country}</p>
              }
              <div className="rounded-2xl overflow-hidden h-72 border border-gray-200">
                <iframe
                  title="Hotel Location"
                  width="100%" height="100%"
                  style={{ border: 0 }} loading="lazy" allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={
                    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                      ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent((hotel.address ? hotel.address + ', ' : '') + hotel.name + ', ' + hotel.city + ', ' + hotel.country)}&zoom=15`
                      : `https://maps.google.com/maps?q=${encodeURIComponent((hotel.address ? hotel.address + ', ' : '') + hotel.name + ', ' + hotel.city + ', ' + hotel.country)}&output=embed&z=15`
                  }
                />
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                {hotel.avgRating !== null ? (
                  <span className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {hotel.avgRating.toFixed(2)} · {hotel.reviewCount} {hotel.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                ) : 'Guest Reviews'}
              </h2>
              <HotelReviews hotelId={hotel.id} avgRating={hotel.avgRating ?? null} reviewCount={hotel.reviewCount ?? 0} />
            </section>
          </div>

          {/* ── Right: Sticky Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Coupon Card */}
              <div className="rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Price header */}
                <div className="p-6 border-b border-gray-100">
                  {discountedPrice !== null ? (
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-2xl font-bold text-gray-900">${discountedPrice}</span>
                      <span className="text-sm text-gray-400 line-through mb-0.5">${hotel.roomTypes[0].pricePerNight.toFixed(0)}</span>
                      <span className="text-sm text-gray-500 mb-0.5">/ night</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-1">Contact for pricing</p>
                  )}
                  <div className="flex items-center gap-2">
                    {hotel.avgRating && (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF385C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span className="text-sm font-semibold text-gray-700">{hotel.avgRating.toFixed(1)}</span>
                        <span className="text-gray-300">·</span>
                      </>
                    )}
                    <StarRating rating={hotel.starRating} size="sm" />
                  </div>
                </div>

                {/* Discount badge */}
                <div className="mx-5 mt-5 rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, #FF385C15, #FF385C05)', border: '1px solid #FF385C30' }}>
                  <div className="text-4xl font-black" style={{ color: '#FF385C' }}>{hotel.discountPercent}%</div>
                  <div className="text-sm font-semibold text-gray-700 mt-0.5">OFF your entire stay</div>
                  <div className="text-xs text-gray-400 mt-1">Valid for {hotel.couponValidDays} days · Redeem at reception</div>
                </div>

                {/* CTA — subscription-aware */}
                <div className="p-5">
                  <CouponCTA
                    hotelId={hotel.id}
                    hotelName={hotel.name}
                    subState={subState}
                    couponLimit={couponLimit}
                    couponsUsed={couponsUsed}
                  />
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hotel Info</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">{hotel.category || 'Hotel'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Rating</span>
                  <span className="font-medium text-gray-900"><StarRating rating={hotel.starRating} size="sm" /></span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">{hotel.city}</span>
                </div>
                {hotel.reviewCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Reviews</span>
                    <span className="font-medium text-gray-900">{hotel.reviewCount} guest review{hotel.reviewCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {activeAffiliates.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Also on</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAffiliates.map(link => {
                        const p = platformInfo[link.platform];
                        return (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-medium px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                            style={{ background: p.bg + '20', color: p.bg, border: `1px solid ${p.bg}40` }}>
                            {p.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
