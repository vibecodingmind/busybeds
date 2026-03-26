'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Coupon {
  code: string;
  qrDataUrl: string | null;
  discountPercent: number;
  expiresAt: string;
  guestName?: string | null;
}

interface RoomType {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxOccupancy: number;
}

interface HotelData {
  id: string;
  name: string;
  discountPercent: number;
  couponValidDays: number;
  partnershipStatus: 'ACTIVE' | 'INACTIVE' | 'LISTING_ONLY';
  roomTypes: RoomType[];
}

type SubState = 'loading' | 'not_logged_in' | 'no_sub' | 'expired' | 'limit_reached' | 'active';

type Step = 'cta' | 'recipient' | 'friend-form' | 'success';

type Recipient = 'me' | 'friend';

interface Props {
  hotelId: string;
  hotelName: string;
  hotel: HotelData;
  subState: SubState;
}

export default function GetCouponButton({ hotelId, hotelName, hotel, subState }: Props) {
  const router = useRouter();
  
  // Session state
  const [session, setSession] = useState<boolean>(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // Coupon flow state
  const [step, setStep] = useState<Step>('cta');
  const [forWhom, setForWhom] = useState<Recipient>('me');
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  // Post-generation friend-add
  const [showMore, setShowMore] = useState(false);
  const [addingMore, setAddingMore] = useState(false);
  const [moreSuccess, setMoreSuccess] = useState('');

  // Check session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setSession(!!data);
        setSessionLoading(false);
      })
      .catch(() => {
        setSession(false);
        setSessionLoading(false);
      });
  }, []);

  // Calculate pricing
  const prices = hotel.roomTypes.map(r => r.pricePerNight).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasMultiplePrices = prices.length > 1;
  const isPartnerActive = hotel.partnershipStatus === 'ACTIVE' && hotel.discountPercent > 0;
  const discountedPrice = (minPrice && isPartnerActive && hotel.discountPercent > 0)
    ? Math.round(minPrice * (1 - hotel.discountPercent / 100))
    : minPrice;
  const savings = (minPrice && discountedPrice && isPartnerActive) ? Math.round(minPrice - discountedPrice) : null;
  const effectiveDiscount = isPartnerActive ? hotel.discountPercent : 0;

  async function generate(guestName?: string) {
    const isFriend = Boolean(guestName);
    if (isFriend) setAddingMore(true); else setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hotelId, 
          ...(guestName ? { guestName, ...(friendEmail ? { guestEmail: friendEmail } : {}) } : {}) 
        }),
      });
      const data = await res.json();
      if (res.status === 401) { 
        router.push('/login?next=' + encodeURIComponent(window.location.pathname)); 
        return; 
      }
      if (res.status === 402 && data.code === 'NO_SUBSCRIPTION') { 
        router.push('/subscribe?hotel=' + hotelId); 
        return; 
      }
      if (res.status === 429) { 
        setError("You've reached your coupon limit for this period."); 
        return; 
      }
      if (!res.ok) { 
        setError(data.error || 'Something went wrong'); 
        return; 
      }
      
      const newCoupon = data.coupon;
      setCoupons(prev => [...prev.filter(c => c.code !== newCoupon.code), newCoupon]);
      setCoupon(newCoupon);
      
      if (isFriend) { 
        setMoreSuccess(`Coupon generated for ${guestName}!`); 
        setShowMore(false); 
        setFriendName(''); 
        setFriendEmail(''); 
        setFriendPhone(''); 
      } else {
        setStep('success');
      }
    } finally { 
      setLoading(false); 
      setAddingMore(false); 
    }
  }

  function handleGetCouponClick() {
    if (!session) {
      router.push('/register?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (subState !== 'active') {
      router.push('/subscribe?hotel=' + hotelId);
      return;
    }
    setStep('recipient');
  }

  function handleRecipientSelect(recipient: Recipient) {
    setForWhom(recipient);
    setError('');
    if (recipient === 'me') {
      generate();
    } else {
      setStep('friend-form');
    }
  }

  function handleFriendSubmit() {
    if (!friendName.trim()) {
      setError("Please enter your friend's full name.");
      return;
    }
    generate(friendName.trim());
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Loading state
  if (sessionLoading || subState === 'loading') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Success state: coupon(s) already generated ────────────────────────────
  if (coupons.length > 0 || step === 'success') {
    const displayCoupons = coupons.length > 0 ? coupons : coupon ? [coupon] : [];
    
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
        {/* Price Display */}
        {minPrice && (
          <div className="pb-4 border-b border-gray-100">
            <div className="flex items-baseline gap-2">
              {hasMultiplePrices && (
                <span className="text-sm text-gray-500">From</span>
              )}
              <span className="text-3xl font-bold text-gray-900">
                ${discountedPrice}
              </span>
              <span className="text-base font-normal text-gray-500">/night</span>
            </div>
            {effectiveDiscount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-sm font-semibold">
                  {effectiveDiscount}% OFF
                </span>
                {savings && savings > 0 && (
                  <span className="text-emerald-600 text-sm font-medium">
                    Save ${savings}/night
                  </span>
                )}
              </div>
            )}
            {effectiveDiscount > 0 && minPrice && (
              <p className="text-sm text-gray-400 mt-1">
                <span className="line-through">${minPrice}</span> original price
              </p>
            )}
          </div>
        )}

        {/* Partnership Status Banner */}
        {!isPartnerActive && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700">Partnership Inactive</p>
                <p className="text-xs text-gray-500 mt-0.5">Coupons may not be redeemable at this time.</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Coupons */}
        <div className="space-y-3">
          {displayCoupons.map((c, idx) => (
            <CouponResultCard
              key={c.code}
              coupon={c}
              hotelName={hotelName}
              idx={idx}
              friendEmail={idx > 0 ? friendEmail : undefined}
              friendPhone={idx > 0 ? friendPhone : undefined}
              copied={copied}
              onCopy={() => copyCode(c.code)}
            />
          ))}
        </div>

        {moreSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-2.5 rounded-xl">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {moreSuccess}
          </div>
        )}
        
        {error && <ErrorBanner msg={error} />}

        {/* Add another for a friend */}
        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-sm font-semibold transition-colors hover:bg-purple-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add coupon for another friend
          </button>
        ) : (
          <FriendForm
            name={friendName}
            setName={setFriendName}
            email={friendEmail}
            setEmail={setFriendEmail}
            phone={friendPhone}
            setPhone={setFriendPhone}
            loading={addingMore}
            onCancel={() => { 
              setShowMore(false); 
              setFriendName(''); 
              setFriendEmail(''); 
              setFriendPhone(''); 
              setError('');
            }}
            onSubmit={() => { 
              if (!friendName.trim()) { 
                setError("Please enter your friend's name."); 
                return; 
              } 
              generate(friendName.trim()); 
            }}
          />
        )}

        <Link 
          href="/coupons" 
          className="block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          View all my coupons →
        </Link>
      </div>
    );
  }

  // ── Main CTA Card ─────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-5">
      {/* Price Display */}
      {minPrice && (
        <div>
          <div className="flex items-baseline gap-2">
            {hasMultiplePrices && (
              <span className="text-sm text-gray-500">From</span>
            )}
            <span className="text-3xl font-bold text-gray-900">
              ${discountedPrice}
            </span>
            <span className="text-base font-normal text-gray-500">/night</span>
          </div>
          {effectiveDiscount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-sm font-semibold">
                {effectiveDiscount}% OFF
              </span>
              {savings && savings > 0 && (
                <span className="text-emerald-600 text-sm font-medium">
                  Save ${savings}/night
                </span>
              )}
            </div>
          )}
          {effectiveDiscount > 0 && minPrice && (
            <p className="text-sm text-gray-400 mt-1">
              <span className="line-through">${minPrice}</span> original price
            </p>
          )}
        </div>
      )}

      {/* Partnership Status Banner */}
      {!isPartnerActive && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Partnership Inactive</p>
              <p className="text-xs text-gray-500 mt-0.5">Coupons may not be redeemable at this time.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tier 1: Not Logged In */}
      {!session && (
        <div className="space-y-3">
          <button
            onClick={() => router.push('/register?next=' + encodeURIComponent(window.location.pathname))}
            className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-[#1B4D3E] hover:bg-[#2D6A4F] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Sign Up to Get Coupon
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link 
              href={`/login?next=${encodeURIComponent(window.location.pathname)}`}
              className="text-emerald-700 font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      )}

      {/* Tier 2: Logged In, No Active Subscription */}
      {session && subState !== 'active' && (
        <div className="space-y-3">
          <button
            onClick={() => router.push('/subscribe?hotel=' + hotelId)}
            className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-[#1B4D3E] hover:bg-[#2D6A4F] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Subscribe to Get Coupon
          </button>
          <p className="text-center text-sm text-gray-500">
            Unlock exclusive hotel discounts
          </p>
        </div>
      )}

      {/* Tier 3: Logged In + Active Subscription - Initial CTA */}
      {session && subState === 'active' && step === 'cta' && (
        <button
          onClick={handleGetCouponClick}
          className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-[#1B4D3E] hover:bg-[#2D6A4F] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          Get My Coupon
        </button>
      )}

      {/* Tier 3: Recipient Selection */}
      {session && subState === 'active' && step === 'recipient' && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">Who is this coupon for?</p>
          <div className="grid grid-cols-2 gap-3">
            {/* For Me */}
            <button
              type="button"
              onClick={() => handleRecipientSelect('me')}
              disabled={loading}
              className={`relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-center transition-all ${
                forWhom === 'me'
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {forWhom === 'me' && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div>
                <p className="text-sm font-semibold">For Me</p>
                <p className="text-xs text-gray-400 mt-0.5">Added to my account</p>
              </div>
            </button>

            {/* For a Friend */}
            <button
              type="button"
              onClick={() => handleRecipientSelect('friend')}
              disabled={loading}
              className={`relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-center transition-all ${
                forWhom === 'friend'
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {forWhom === 'friend' && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">For a Friend</p>
                <p className="text-xs text-gray-400 mt-0.5">Gift to someone else</p>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm text-gray-600">Generating coupon...</span>
            </div>
          )}

          <button
            onClick={() => setStep('cta')}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Tier 3: Friend Details Form */}
      {session && subState === 'active' && step === 'friend-form' && (
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-semibold text-purple-700">Friend&apos;s Details</p>
            </div>

            {/* Full name — required */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    value={friendName}
                    onChange={e => setFriendName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email — optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-gray-400 font-normal">(optional — coupon sent directly)</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={friendEmail}
                    onChange={e => setFriendEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone — optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <input
                    type="tel"
                    value={friendPhone}
                    onChange={e => setFriendPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && <ErrorBanner msg={error} />}

          <div className="flex gap-3">
            <button
              onClick={() => { 
                setStep('recipient'); 
                setError(''); 
              }}
              className="flex-1 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleFriendSubmit}
              disabled={loading || !friendName.trim()}
              className="flex-1 py-3 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Generate Coupon
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Friend details form (for "add more" mode) ─────────────────────────────────
function FriendForm({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  loading,
  onCancel,
  onSubmit,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  loading: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  return (
    <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-sm font-semibold text-purple-700">Friend&apos;s Details</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jane Smith"
            autoFocus
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Phone <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
          />
        </div>
      </div>

      {onCancel && onSubmit && (
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
            Generate
          </button>
        </div>
      )}
    </div>
  );
}

// ── Generated coupon result card ──────────────────────────────────────────────
function CouponResultCard({
  coupon,
  hotelName,
  idx,
  friendEmail,
  friendPhone,
  copied,
  onCopy,
}: {
  coupon: Coupon;
  hotelName: string;
  idx: number;
  friendEmail?: string;
  friendPhone?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const isMine = idx === 0 && !coupon.guestName;
  const accentColor = isMine ? 'emerald' : 'purple';
  const bgGradient = isMine
    ? 'from-emerald-50 to-teal-50'
    : 'from-purple-50 to-fuchsia-50';
  const borderColor = isMine ? 'border-emerald-200' : 'border-purple-200';
  const headerBg = isMine
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
    : 'bg-gradient-to-r from-purple-600 to-fuchsia-600';

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-xl border ${borderColor} overflow-hidden`}>
      {/* Header */}
      <div className={`${headerBg} px-4 py-2.5 text-white text-sm font-semibold flex items-center gap-2`}>
        <span>{isMine ? '✓' : '🎁'}</span>
        <span className="flex-1 truncate">
          {isMine ? `Your coupon for ${hotelName}` : `Coupon for ${coupon.guestName} · ${hotelName}`}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* QR Code */}
        {coupon.qrDataUrl && (
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <img src={coupon.qrDataUrl} alt="QR Code" width={112} height={112} className="w-28 h-28" />
            </div>
          </div>
        )}

        {/* Coupon Code */}
        <div className="bg-white rounded-lg px-4 py-3 border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Coupon Code</p>
              <p className="font-mono text-lg font-semibold tracking-wider text-gray-800 truncate">
                {coupon.code}
              </p>
            </div>
            <button
              onClick={onCopy}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Discount & Expiry */}
        <div className="flex items-center justify-between text-sm">
          <span className={`font-semibold ${isMine ? 'text-emerald-700' : 'text-purple-700'}`}>
            {coupon.discountPercent}% OFF
          </span>
          <span className="text-gray-500">
            Expires {new Date(coupon.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Share buttons for friend */}
        {coupon.guestName && (friendEmail || friendPhone) && (
          <div className="pt-3 border-t border-gray-200/50 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Share with friend</p>
            <div className="flex flex-wrap gap-2">
              {friendEmail && (
                <a
                  href={`mailto:${friendEmail}?subject=Your ${coupon.discountPercent}% off coupon for ${hotelName}&body=Hi ${coupon.guestName},%0A%0AHere is your BusyBeds coupon!%0A%0ACoupon Code: ${coupon.code}%0ADiscount: ${coupon.discountPercent}% OFF%0AHotel: ${hotelName}%0AExpires: ${new Date(coupon.expiresAt).toLocaleDateString()}%0A%0APresent this code at hotel reception.`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 text-xs font-medium hover:bg-purple-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              )}
              {friendPhone && (
                <a
                  href={`https://wa.me/${friendPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${coupon.guestName}! Here's your BusyBeds discount coupon for ${hotelName}:\n\nCode: ${coupon.code}\nDiscount: ${coupon.discountPercent}% OFF\nExpires: ${new Date(coupon.expiresAt).toLocaleDateString()}\n\nPresent this at hotel reception.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 text-xs font-medium hover:bg-purple-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );
}
