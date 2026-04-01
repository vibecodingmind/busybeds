'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StayRequestForm from '@/components/StayRequestForm';

interface Coupon {
  code: string;
  qrDataUrl: string | null;
  discountPercent: number;
  expiresAt: string;
  startTime?: string | null;
  endTime?: string | null;
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

// Steps: cta → dates → recipient → (friend-form) → success
type Step = 'cta' | 'dates' | 'recipient' | 'friend-form' | 'success';
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

  // Flow state
  const [step, setStep] = useState<Step>('cta');
  const [forWhom, setForWhom] = useState<Recipient>('me');

  // Date selection (Step 2)
  const today = new Date().toISOString().split('T')[0];
  const defaultCheckIn = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState('');

  // Friend details
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendPhone, setFriendPhone] = useState('');

  // Coupon state
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Post-generation friend-add
  const [showMore, setShowMore] = useState(false);
  const [addingMore, setAddingMore] = useState(false);
  const [moreSuccess, setMoreSuccess] = useState('');

  // Extended stay (available after coupon obtained)
  const [showStayRequest, setShowStayRequest] = useState(false);
  const [stayRequestSuccess, setStayRequestSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSession(!!data); setSessionLoading(false); })
      .catch(() => { setSession(false); setSessionLoading(false); });
  }, []);

  // Pricing calculations
  const prices = hotel.roomTypes.map(r => r.pricePerNight).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasMultiplePrices = prices.length > 1;
  const isPartnerActive = hotel.partnershipStatus === 'ACTIVE' && hotel.discountPercent > 0;
  const discountedPrice = (minPrice && isPartnerActive && hotel.discountPercent > 0)
    ? Math.round(minPrice * (1 - hotel.discountPercent / 100))
    : minPrice;
  const savings = (minPrice && discountedPrice && isPartnerActive) ? Math.round(minPrice - discountedPrice) : null;
  const effectiveDiscount = isPartnerActive ? hotel.discountPercent : 0;

  // Nights count for date step
  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  async function generate(guestName?: string) {
    const isFriend = Boolean(guestName);
    if (isFriend) setAddingMore(true); else setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        hotelId,
        ...(checkIn ? { checkIn } : {}),
        ...(checkOut ? { checkOut } : {}),
        ...(guestName ? { guestName, ...(friendEmail ? { guestEmail: friendEmail } : {}) } : {}),
      };

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 401) { router.push('/login?next=' + encodeURIComponent(window.location.pathname)); return; }
      if (res.status === 402 && data.code === 'NO_SUBSCRIPTION') { router.push('/subscribe?hotel=' + hotelId); return; }
      if (res.status === 429) { setError("You've reached your coupon limit for this period."); return; }
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }

      const newCoupon = data.coupon;
      setCoupons(prev => [...prev.filter(c => c.code !== newCoupon.code), newCoupon]);
      setCoupon(newCoupon);

      if (isFriend) {
        setMoreSuccess(`Coupon generated for ${guestName}!`);
        setShowMore(false);
        setFriendName(''); setFriendEmail(''); setFriendPhone('');
      } else {
        setStep('success');
      }
    } finally {
      setLoading(false);
      setAddingMore(false);
    }
  }

  function handleGetCouponClick() {
    if (!session) { router.push('/register?next=' + encodeURIComponent(window.location.pathname)); return; }
    if (subState !== 'active') { router.push('/subscribe?hotel=' + hotelId); return; }
    setStep('dates');
  }

  function handleDatesConfirm() {
    if (!checkIn) { setError('Please select a check-in date.'); return; }
    if (!checkOut) { setError('Please select a check-out date.'); return; }
    if (nights < 1) { setError('Check-out must be after check-in.'); return; }
    setError('');
    setStep('recipient');
  }

  function handleRecipientSelect(recipient: Recipient) {
    setForWhom(recipient);
    setError('');
    if (recipient === 'me') { generate(); }
    else { setStep('friend-form'); }
  }

  function handleFriendSubmit() {
    if (!friendName.trim()) { setError("Please enter your friend's full name."); return; }
    generate(friendName.trim());
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (sessionLoading || subState === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Success: coupon(s) obtained ──────────────────────────────────────────────
  if (coupons.length > 0 || step === 'success') {
    const displayCoupons = coupons.length > 0 ? coupons : coupon ? [coupon] : [];

    return (
      <>
        <div className="space-y-4">
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              {moreSuccess}
            </div>
          )}

          {error && <ErrorBanner msg={error} />}

          {/* Add another for a friend */}
          {!showMore ? (
            <button
              onClick={() => setShowMore(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-sm font-semibold transition-colors hover:bg-purple-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add coupon for a friend
            </button>
          ) : (
            <FriendForm
              name={friendName} setName={setFriendName}
              email={friendEmail} setEmail={setFriendEmail}
              phone={friendPhone} setPhone={setFriendPhone}
              loading={addingMore}
              onCancel={() => { setShowMore(false); setFriendName(''); setFriendEmail(''); setFriendPhone(''); setError(''); }}
              onSubmit={() => { if (!friendName.trim()) { setError("Please enter your friend's name."); return; } generate(friendName.trim()); }}
            />
          )}

          {/* ── Extended Stay — unlocked after getting coupon ── */}
          {hotel.roomTypes.length > 0 && (
            <div className="mt-2 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">Now Available</span>
                <span className="text-xs font-semibold text-gray-700">Request Extended Stay</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                You have a coupon — lock in your dates with a 25% deposit and the hotel will confirm within 48h.
              </p>
              {stayRequestSuccess ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Request sent! Hotel reviews within 48h.
                  </div>
                  <p className="text-xs text-amber-700">Once approved, go to <strong>My Stay Requests</strong> to pay the deposit and lock your dates.</p>
                  <Link href="/my-stay-requests" className="block text-center text-xs font-semibold text-amber-800 underline hover:text-amber-900">
                    View My Requests & Pay →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => setShowStayRequest(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Request & Lock My Stay
                </button>
              )}
            </div>
          )}

          <Link href="/coupons" className="block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
            View all my coupons →
          </Link>
        </div>

        {/* Stay Request Modal — pre-filled with selected dates */}
        {showStayRequest && (
          <StayRequestForm
            hotelId={hotel.id}
            hotelName={hotelName}
            roomTypes={hotel.roomTypes}
            discountPercent={hotel.discountPercent}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            onClose={() => setShowStayRequest(false)}
            onSuccess={() => { setShowStayRequest(false); setStayRequestSuccess(true); }}
          />
        )}
      </>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => router.push('/register?next=' + encodeURIComponent(window.location.pathname))}
          className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-[#1B4D3E] hover:bg-[#2D6A4F] active:scale-[0.98] transition-all duration-200"
        >
          Sign Up to Get Coupon
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href={`/login?next=${encodeURIComponent(window.location.pathname)}`} className="text-emerald-700 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    );
  }

  // ── Logged in, no subscription ───────────────────────────────────────────────
  if (session && subState !== 'active') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => router.push('/subscribe?hotel=' + hotelId)}
          className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-[#1B4D3E] hover:bg-[#2D6A4F] active:scale-[0.98] transition-all duration-200"
        >
          Subscribe to Get Coupon
        </button>
        <p className="text-center text-sm text-gray-400 text-xs">Unlock exclusive hotel discounts from {effectiveDiscount}% off</p>
      </div>
    );
  }

  // ── Step: Initial CTA ────────────────────────────────────────────────────────
  if (step === 'cta') {
    return (
      <button
        onClick={handleGetCouponClick}
        className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-[#1B4D3E] hover:bg-[#2D6A4F] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
          <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
        </svg>
        Get My Coupon
      </button>
    );
  }

  // ── Step: Date Selection ─────────────────────────────────────────────────────
  if (step === 'dates') {
    const totalSavings = nights > 0 && savings ? savings * nights : null;
    return (
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <span className="text-xs font-semibold text-emerald-700">Select Dates</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-1 opacity-40">
            <span className="w-5 h-5 rounded-full bg-gray-300 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            <span className="text-xs text-gray-400">Coupon</span>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Select your <strong>check-in and check-out</strong> dates. Your coupon will be valid only for this period.
        </p>

        {/* Date inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Check-in</label>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); setError(''); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Check-out</label>
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={e => { setCheckOut(e.target.value); setError(''); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Live savings preview */}
        {nights > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-medium">{nights} night{nights !== 1 ? 's' : ''}</p>
              {totalSavings && (
                <p className="text-sm font-bold text-emerald-800">You save {totalSavings > 0 ? `$${totalSavings}` : ''} total</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600">Coupon valid</p>
              <p className="text-xs font-semibold text-emerald-800">
                {new Date(checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                {' – '}
                {new Date(checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        )}

        {error && <ErrorBanner msg={error} />}

        <button
          onClick={handleDatesConfirm}
          disabled={!checkIn || !checkOut || nights < 1}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#1B4D3E] hover:bg-[#2D6A4F] disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-200"
        >
          {nights > 0 ? `Continue — ${nights} night${nights !== 1 ? 's' : ''}` : 'Select dates to continue'}
        </button>
        <button onClick={() => { setStep('cta'); setError(''); }} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  // ── Step: Recipient Selection ────────────────────────────────────────────────
  if (step === 'recipient') {
    return (
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold flex items-center justify-center">✓</span>
            <span className="text-xs text-emerald-600">Dates set</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            <span className="text-xs font-semibold text-emerald-700">Coupon</span>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-700">Who is this coupon for?</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleRecipientSelect('me')}
            disabled={loading}
            className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 text-center transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <div>
              <p className="text-sm font-semibold">For Me</p>
              <p className="text-xs text-gray-400 mt-0.5">My account</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRecipientSelect('friend')}
            disabled={loading}
            className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50 text-center transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <div>
              <p className="text-sm font-semibold">For a Friend</p>
              <p className="text-xs text-gray-400 mt-0.5">Gift to someone</p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-3 gap-2">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Generating coupon...</span>
          </div>
        )}

        {error && <ErrorBanner msg={error} />}

        <button onClick={() => { setStep('dates'); setError(''); }} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  // ── Step: Friend Details Form ────────────────────────────────────────────────
  if (step === 'friend-form') {
    return (
      <div className="space-y-4">
        <FriendForm
          name={friendName} setName={setFriendName}
          email={friendEmail} setEmail={setFriendEmail}
          phone={friendPhone} setPhone={setFriendPhone}
          loading={loading}
          onCancel={() => { setStep('recipient'); setError(''); }}
          onSubmit={handleFriendSubmit}
        />
        {error && <ErrorBanner msg={error} />}
      </div>
    );
  }

  return null;
}

// ── Friend details form ────────────────────────────────────────────────────────
function FriendForm({
  name, setName, email, setEmail, phone, setPhone, loading, onCancel, onSubmit,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  loading: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  return (
    <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <p className="text-sm font-semibold text-purple-700">Friend&apos;s Details</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Smith" autoFocus
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="friend@example.com"
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+255 712 000 000"
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none" />
      </div>
      {onCancel && onSubmit && (
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button type="button" onClick={onSubmit} disabled={loading || !name.trim()}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Generate Coupon'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Generated coupon result card ──────────────────────────────────────────────
function CouponResultCard({ coupon, hotelName, idx, friendEmail, friendPhone, copied, onCopy }: {
  coupon: Coupon; hotelName: string; idx: number;
  friendEmail?: string; friendPhone?: string;
  copied: boolean; onCopy: () => void;
}) {
  const isMine = idx === 0 && !coupon.guestName;
  const bgGradient = isMine ? 'from-emerald-50 to-teal-50' : 'from-purple-50 to-fuchsia-50';
  const borderColor = isMine ? 'border-emerald-200' : 'border-purple-200';
  const headerBg = isMine ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-purple-600 to-fuchsia-600';
  const accentText = isMine ? 'text-emerald-700' : 'text-purple-700';

  const validFrom = coupon.startTime ? new Date(coupon.startTime) : null;
  const validUntil = coupon.endTime ? new Date(coupon.endTime) : new Date(coupon.expiresAt);

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-xl border ${borderColor} overflow-hidden`}>
      <div className={`${headerBg} px-4 py-2.5 text-white text-sm font-semibold flex items-center gap-2`}>
        <span>{isMine ? '✓' : '🎁'}</span>
        <span className="flex-1 truncate">
          {isMine ? `Your coupon — ${hotelName}` : `Coupon for ${coupon.guestName} · ${hotelName}`}
        </span>
      </div>

      <div className="p-5 space-y-4">
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
              <p className="font-mono text-lg font-semibold tracking-wider text-gray-800 truncate">{coupon.code}</p>
            </div>
            <button onClick={onCopy}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {copied
                ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Copied</>
                : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>}
            </button>
          </div>
        </div>

        {/* Discount & valid dates */}
        <div className="flex items-start justify-between text-sm gap-3">
          <span className={`font-bold text-base ${accentText}`}>{coupon.discountPercent}% OFF</span>
          <div className="text-right">
            {validFrom ? (
              <p className="text-xs text-gray-600 font-semibold">
                {validFrom.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                {' – '}
                {validUntil.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-xs text-gray-500">Expires {validUntil.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">Show QR at reception</p>
          </div>
        </div>

        {/* Share for friend coupons */}
        {coupon.guestName && (friendEmail || friendPhone) && (
          <div className="pt-3 border-t border-gray-200/50 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Share with friend</p>
            <div className="flex flex-wrap gap-2">
              {friendEmail && (
                <a href={`mailto:${friendEmail}?subject=Your ${coupon.discountPercent}% off coupon for ${hotelName}&body=Hi ${coupon.guestName},%0A%0AHere is your BusyBeds coupon!%0A%0ACoupon Code: ${coupon.code}%0ADiscount: ${coupon.discountPercent}% OFF%0AHotel: ${hotelName}%0AValid: ${validFrom ? validFrom.toLocaleDateString() + ' – ' : ''}${validUntil.toLocaleDateString()}%0A%0APresent QR code at hotel reception.`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 text-xs font-medium hover:bg-purple-50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Email
                </a>
              )}
              {friendPhone && (
                <a href={`https://wa.me/${friendPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${coupon.guestName}! 🎁 Your BusyBeds discount coupon for ${hotelName}:\n\nCode: ${coupon.code}\nDiscount: ${coupon.discountPercent}% OFF${validFrom ? `\nValid: ${validFrom.toLocaleDateString()} – ${validUntil.toLocaleDateString()}` : ''}\n\nPresent QR code at check-in.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 text-xs font-medium hover:bg-purple-50 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </div>
  );
}
