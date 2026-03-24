'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  starRating: number;
  category: string;
  descriptionShort: string;
  coverImage?: string;
  discountPercent: number;
  avgRating?: number;
  reviewCount?: number;
}

interface CouponShare {
  code: string;
  discountPercent: number;
  status: string;
  expiresAt: string;
  guestName?: string | null;
  qrDataUrl?: string | null;
  sharedBy: string;
  hotel: Hotel;
}

interface Props {
  coupon: CouponShare;
}

export default function SharePageClient({ coupon }: Props) {
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const isExpired = coupon.status === 'expired' || new Date(coupon.expiresAt) < new Date();
  const isRedeemed = coupon.status === 'redeemed';
  const isValid = !isExpired && !isRedeemed && coupon.status === 'active';

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const shareUrl = `${appUrl}/share/${coupon.code}`;
  const hotelUrl = `${appUrl}/hotels/${coupon.hotel.slug}`;

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(coupon.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const msg = `🏨 ${coupon.discountPercent}% OFF at ${coupon.hotel.name}!\n\nI found this exclusive deal on BusyBeds. Use coupon code: *${coupon.code}*\n\n👉 ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareTwitter = () => {
    const msg = `Just scored ${coupon.discountPercent}% off at ${coupon.hotel.name} via @BusyBeds! 🏨✨ Use code: ${coupon.code}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2 group">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg" style={{ background: '#0E7C7B' }}>BB</div>
        <span className="text-white font-bold text-lg tracking-tight">BusyBeds</span>
      </Link>

      {/* Main card */}
      <div className="w-full max-w-md">
        {/* Status banner */}
        {isRedeemed && (
          <div className="bg-gray-700 text-gray-300 text-center py-2 px-4 rounded-t-2xl text-sm font-medium">
            ✓ This coupon has already been redeemed
          </div>
        )}
        {isExpired && !isRedeemed && (
          <div className="bg-red-900/60 text-red-300 text-center py-2 px-4 rounded-t-2xl text-sm font-medium">
            ⚠️ This coupon has expired
          </div>
        )}

        <div className={`bg-white shadow-2xl overflow-hidden ${(isExpired || isRedeemed) ? 'rounded-b-2xl opacity-75' : 'rounded-2xl'}`}>
          {/* Hotel image header */}
          <div className="relative h-44 overflow-hidden">
            <Image
              src={coupon.hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
              alt={coupon.hotel.name}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Discount badge */}
            <div className="absolute top-4 right-4">
              <div className="bg-teal-500 text-white font-black text-2xl w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg rotate-3">
                <span>{coupon.discountPercent}%</span>
                <span className="text-xs font-semibold -mt-1">OFF</span>
              </div>
            </div>

            <div className="absolute bottom-3 left-4">
              <div className="flex">
                {[...Array(coupon.hotel.starRating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              <h1 className="text-white font-bold text-lg leading-tight">{coupon.hotel.name}</h1>
              <p className="text-white/80 text-sm">{coupon.hotel.city}, {coupon.hotel.country}</p>
            </div>
          </div>

          {/* Shared by */}
          <div className="bg-teal-50 px-5 py-3 border-b border-teal-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {coupon.sharedBy.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm text-teal-700">
              <span className="font-semibold">{coupon.sharedBy}</span> shared this exclusive deal with you!
            </p>
          </div>

          {/* Coupon body */}
          <div className="p-5 space-y-4">
            {/* Description */}
            <p className="text-gray-600 text-sm">{coupon.hotel.descriptionShort}</p>

            {/* Rating */}
            {coupon.hotel.avgRating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                  <span className="text-yellow-500 text-sm">★</span>
                  <span className="text-sm font-bold text-yellow-700">{coupon.hotel.avgRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400 text-xs">({coupon.hotel.reviewCount} reviews)</span>
              </div>
            )}

            {/* Coupon code */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Your Coupon Code</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xl font-black tracking-widest text-gray-800 font-mono">{coupon.code}</code>
                <button
                  onClick={copyCode}
                  className="text-sm px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: copied ? '#dcfce7' : '#f0fdf4', color: copied ? '#16a34a' : '#0E7C7B' }}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Expiry & QR */}
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">📅</span>
                  <span className="text-gray-600">
                    {isValid
                      ? <><span className="font-semibold text-orange-500">{daysLeft} days</span> left to use</>
                      : `Expired ${new Date(coupon.expiresAt).toLocaleDateString()}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">🏨</span>
                  <span className="text-gray-600">{coupon.hotel.category}</span>
                </div>
                {coupon.guestName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">👤</span>
                    <span className="text-gray-600">For: <span className="font-medium">{coupon.guestName}</span></span>
                  </div>
                )}
              </div>
              {coupon.qrDataUrl && (
                <div className="flex-shrink-0">
                  <img src={coupon.qrDataUrl} alt="QR Code" className="w-20 h-20 rounded-lg border border-gray-200" />
                  <p className="text-xs text-gray-400 text-center mt-1">Scan at hotel</p>
                </div>
              )}
            </div>

            {/* CTA */}
            {isValid ? (
              <Link
                href={hotelUrl}
                className="block w-full py-3 rounded-xl text-center font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0E7C7B, #1A3C5E)' }}
              >
                🏨 View Hotel & Book Now
              </Link>
            ) : (
              <Link
                href="/"
                className="block w-full py-3 rounded-xl text-center font-bold text-white text-base"
                style={{ background: '#1A3C5E' }}
              >
                Find Other Deals on BusyBeds
              </Link>
            )}
          </div>

          {/* Dashed divider - ticket style */}
          <div className="flex items-center px-5 py-2">
            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-gray-200 mx-2 flex-shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
          </div>

          {/* Share section */}
          <div className="px-5 pb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Share this deal</p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">💬</span>
                <span className="text-xs text-gray-500">WhatsApp</span>
              </button>
              <button
                onClick={shareTwitter}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">𝕏</span>
                <span className="text-xs text-gray-500">Twitter</span>
              </button>
              <button
                onClick={shareFacebook}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">📘</span>
                <span className="text-xs text-gray-500">Facebook</span>
              </button>
              <button
                onClick={copyShareLink}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">🔗</span>
                <span className="text-xs text-gray-500">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Get your own coupon CTA */}
        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm mb-3">Don't have an account yet?</p>
          <Link
            href="/register"
            className="inline-block bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all backdrop-blur-sm"
          >
            Join BusyBeds — Get Your Own Coupons →
          </Link>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © {new Date().getFullYear()} BusyBeds · Exclusive hotel discount coupons
        </p>
      </div>
    </div>
  );
}
