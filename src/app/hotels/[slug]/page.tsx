'use client';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import PhotoLightbox from '@/components/PhotoLightbox';
import ReviewsSection from '@/components/ReviewsSection';
import InquiryForm from '@/components/InquiryForm';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: params.slug },
    include: { roomTypes: { take: 1 }, photos: { take: 1 } },
  });
  
  if (!hotel) {
    return { title: 'Hotel Not Found — BusyBeds' };
  }

  const base = hotel.roomTypes[0]?.pricePerNight ?? null;
  const discounted = base ? Math.round(base * (1 - hotel.discountPercent / 100)) : null;
  const image = hotel.coverImage || hotel.photos[0]?.url || 'https://busybeds.com/og-default.jpg';
  const desc = `Save ${hotel.discountPercent}% at ${hotel.name} in ${hotel.city}, ${hotel.country}.${discounted ? ` From $${discounted}/night.` : ''} Get your exclusive discount coupon now on BusyBeds.`;

  return {
    title: `${hotel.name} — ${hotel.discountPercent}% Off | BusyBeds`,
    description: desc,
    openGraph: {
      title: `${hotel.name} — ${hotel.discountPercent}% Discount`,
      description: desc,
      images: [{ url: image, width: 1200, height: 630, alt: hotel.name }],
      type: 'website',
      siteName: 'BusyBeds',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${hotel.name} — ${hotel.discountPercent}% Off`,
      description: desc,
      images: [image],
    },
    keywords: [hotel.name, hotel.city, hotel.country, 'hotel discount', 'hotel coupon', 'BusyBeds', `${hotel.discountPercent}% off hotel`],
  };
}

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
  whatsapp: string | null;
  email: string | null;
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
        <span key={i} style={{ color: i < Math.round(rating) ? '#FF385C' : '#e5e7eb' }}>★</span>
      ))}
    </span>
  );
}

export default function HotelPage({ params }: PageProps) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [subState, setSubState] = useState<SubState>('loading');
  const [couponEmail, setCouponEmail] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [error, setError] = useState('');

  /* Fetch hotel & check subscription on mount */
  useEffect(() => {
    const fetchData = async () => {
      try {
        /* Hotel data */
        const hRes = await fetch(`/api/hotels/${params.slug}`);
        if (!hRes.ok) return notFound();
        const hotelData = await hRes.json();
        setHotel(hotelData);

        /* Check user subscription */
        const sRes = await fetch('/api/subscription-status');
        if (!sRes.ok) return setSubState('not_logged_in');
        const { state, email, expiresAt } = await sRes.json();
        setSubState(state);
        if (email) setCouponEmail(email);
        if (expiresAt) setCouponExpiry(expiresAt);
      } catch {
        setSubState('not_logged_in');
      }
    };

    fetchData();
  }, [params.slug]);

  const handleGenerateCoupon = useCallback(async () => {
    if (!hotel) return;
    setCouponLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coupons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.id, hotelName: hotel.name }),
      });
      if (res.ok) {
        window.location.href = '/portal/coupons?generated=true';
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate coupon');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setCouponLoading(false);
    }
  }, [hotel]);

  if (!hotel) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const mainImage = hotel.coverImage || hotel.photos[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const otherImages = hotel.photos.slice(1);
  const basePrice = hotel.roomTypes[0]?.pricePerNight;
  const discountedPrice = basePrice ? Math.round(basePrice * (1 - hotel.discountPercent / 100)) : null;
  const savings = basePrice && discountedPrice ? Math.round(basePrice - discountedPrice) : null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero image grid */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden">
          <div className="md:col-span-2 md:row-span-2 h-64 md:h-full cursor-pointer"
            onClick={() => { setLightboxIndex(0); setShowLightbox(true); }}>
            <img src={mainImage} alt={hotel.name} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
          </div>
          {otherImages.slice(0, 4).map((photo, i) => (
            <div key={photo.id} className="h-32 cursor-pointer"
              onClick={() => { setLightboxIndex(i + 1); setShowLightbox(true); }}>
              <img src={photo.url} alt={`${hotel.name} photo ${i + 1}`}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
            </div>
          ))}
          {hotel.photos.length > 5 && (
            <div className="h-32 bg-gray-800 text-white flex items-center justify-center text-lg font-semibold cursor-pointer"
              onClick={() => { setLightboxIndex(5); setShowLightbox(true); }}>
              +{hotel.photos.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Main content */}
        <div className="md:col-span-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{hotel.name}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={hotel.starRating} size="md" />
                  <span className="text-sm text-gray-500">({hotel.starRating} star{hotel.starRating !== 1 ? 's' : ''})</span>
                </div>
                <p className="text-sm text-gray-600">{hotel.address || `${hotel.city}, ${hotel.country}`}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 mb-1">{hotel.discountPercent}%</div>
                <div className="text-xs text-gray-500">discount</div>
              </div>
            </div>
          </div>

          {/* Rating section */}
          {hotel.avgRating && (
            <div className="mb-8 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{hotel.avgRating.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">{hotel.reviewCount} reviews</div>
                </div>
                <div>
                  <StarRating rating={hotel.avgRating} size="lg" />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About this hotel</h2>
            <p className="text-gray-700 mb-4">{hotel.descriptionLong || hotel.descriptionShort}</p>
            {hotel.websiteUrl && (
              <a href={hotel.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#FF385C' }}>
                Visit website
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            )}
          </div>

          {/* Room types */}
          {hotel.roomTypes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Room types</h2>
              <div className="space-y-3">
                {hotel.roomTypes.map(room => {
                  const discounted = Math.round(room.pricePerNight * (1 - hotel.discountPercent / 100));
                  return (
                    <div key={room.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{room.name}</h3>
                          <p className="text-xs text-gray-500">{room.maxOccupancy} guest{room.maxOccupancy !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            <span className="line-through text-gray-400 mr-2">${room.pricePerNight.toFixed(0)}</span>
                            <span style={{ color: '#FF385C' }}>${discounted}/night</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Save ${(room.pricePerNight - discounted).toFixed(0)}</div>
                        </div>
                      </div>
                      {room.description && <p className="text-sm text-gray-600">{room.description}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amenities */}
          {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-3">
                {hotel.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-[#FF385C]">✓</span> {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affiliate links */}
          {hotel.affiliateLinks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Book elsewhere</h2>
              <div className="flex flex-wrap gap-3">
                {hotel.affiliateLinks.map(link => {
                  const info = platformInfo[link.platform] || { label: link.platform, bg: '#666', text: '#fff' };
                  return (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                      style={{ background: info.bg }}>
                      Book on {info.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ReviewsSection hotelId={hotel.id} hotelName={hotel.name} avgRating={hotel.avgRating} reviewCount={hotel.reviewCount} />
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          {/* Price card */}
          {basePrice && (
            <div className="sticky top-32 p-6 border border-gray-200 rounded-2xl mb-6 bg-white">
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-1">From</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">${discountedPrice}</p>
                <p className="text-sm text-gray-600 line-through mb-2">${basePrice.toFixed(0)}/night</p>
                {savings && (
                  <p className="text-sm font-semibold text-green-600">Save ${savings}/night</p>
                )}
              </div>

              {subState === 'active' && (
                <>
                  <button
                    onClick={handleGenerateCoupon}
                    disabled={couponLoading}
                    className="w-full py-3 rounded-full text-white font-semibold mb-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: '#FF385C' }}>
                    {couponLoading ? 'Generating...' : 'Get Discount Coupon'}
                  </button>
                  {error && <p className="text-xs text-red-600 text-center mb-2">{error}</p>}
                  <p className="text-xs text-gray-500 text-center mb-4">Valid for {hotel.couponValidDays} days</p>
                  <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-2">
                    <p><strong>Email:</strong> {couponEmail}</p>
                    <p><strong>Expires:</strong> {couponExpiry ? new Date(couponExpiry).toLocaleDateString() : '—'}</p>
                  </div>
                </>
              )}

              {subState !== 'active' && (
                <div className="space-y-3">
                  {subState === 'not_logged_in' && (
                    <>
                      <p className="text-sm font-semibold text-gray-900 mb-3">Subscribe to unlock coupons</p>
                      <Link href="/register"
                        className="w-full block text-center py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
                        style={{ background: '#FF385C' }}>
                        Create Account
                      </Link>
                      <Link href="/login"
                        className="w-full block text-center py-3 rounded-full border border-gray-300 text-gray-900 font-semibold hover:border-gray-900 transition-colors">
                        Sign In
                      </Link>
                    </>
                  )}
                  {subState === 'no_sub' && (
                    <Link href="/subscribe"
                      className="w-full block text-center py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: '#FF385C' }}>
                      Subscribe Now
                    </Link>
                  )}
                  {subState === 'expired' && (
                    <Link href="/subscribe"
                      className="w-full block text-center py-3 rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: '#FF385C' }}>
                      Renew Subscription
                    </Link>
                  )}
                  {subState === 'limit_reached' && (
                    <p className="text-sm text-gray-600 p-4 bg-yellow-50 rounded-lg">
                      You've reached your coupon limit for this period. Try a different hotel or upgrade your plan.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inquiry Form */}
          <div className="mt-4">
            <InquiryForm
              hotelId={hotel.id}
              hotelName={hotel.name}
              hasWhatsapp={!!hotel.whatsapp}
              whatsappNumber={hotel.whatsapp || undefined}
            />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <PhotoLightbox
          photos={[{ url: mainImage }, ...otherImages]}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
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
