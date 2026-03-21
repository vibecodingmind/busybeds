'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Coupon {
  code: string;
  qrDataUrl: string | null;
  discountPercent: number;
  expiresAt: string;
  guestName?: string | null;
}
interface Props { hotelId: string; hotelName: string; }

type Recipient = 'me' | 'friend';

export default function GetCouponButton({ hotelId, hotelName }: Props) {
  const [recipient, setRecipient] = useState<Recipient>('me');
  const [coupons, setCoupons]     = useState<Coupon[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Friend fields
  const [friendName,  setFriendName]  = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendPhone, setFriendPhone] = useState('');

  // Post-generation friend-add
  const [showMore, setShowMore]       = useState(false);
  const [addingMore, setAddingMore]   = useState(false);
  const [moreSuccess, setMoreSuccess] = useState('');

  const router = useRouter();

  async function generate(guestName?: string) {
    const isFriend = Boolean(guestName);
    if (isFriend) setAddingMore(true); else setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, ...(guestName ? { guestName } : {}) }),
      });
      const data = await res.json();
      if (res.status === 401) { router.push('/login?next=' + encodeURIComponent(window.location.pathname)); return; }
      if (res.status === 402 && data.code === 'NO_SUBSCRIPTION') { router.push('/subscribe?hotel=' + hotelId); return; }
      if (res.status === 429) { setError("You've reached your coupon limit for this period."); return; }
      if (!res.ok)            { setError(data.error || 'Something went wrong'); return; }
      setCoupons(prev => [...prev.filter(c => c.code !== data.coupon.code), data.coupon]);
      if (isFriend) { setMoreSuccess(`Coupon generated for ${guestName}!`); setShowMore(false); setFriendName(''); setFriendEmail(''); setFriendPhone(''); }
    } finally { setLoading(false); setAddingMore(false); }
  }

  function handleSubmit() {
    if (recipient === 'me') {
      generate();
    } else {
      if (!friendName.trim()) { setError('Please enter your friend\'s full name.'); return; }
      generate(friendName.trim());
    }
  }

  // ── Success state: coupon(s) already generated ────────────────────────────
  if (coupons.length > 0) {
    return (
      <div className="space-y-3">
        {coupons.map((c, idx) => (
          <CouponResult
            key={c.code}
            coupon={c}
            hotelName={hotelName}
            idx={idx}
            friendEmail={idx > 0 ? friendEmail : undefined}
            friendPhone={idx > 0 ? friendPhone : undefined}
          />
        ))}

        {moreSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-4 py-2.5 rounded-xl">
            <span>✅</span>{moreSuccess}
          </div>
        )}
        {error && <ErrorBanner msg={error} />}

        {/* Add another for a friend */}
        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:bg-purple-50"
            style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add coupon for another friend
          </button>
        ) : (
          <FriendForm
            name={friendName} setName={setFriendName}
            email={friendEmail} setEmail={setFriendEmail}
            phone={friendPhone} setPhone={setFriendPhone}
            loading={addingMore}
            onCancel={() => { setShowMore(false); setFriendName(''); setFriendEmail(''); setFriendPhone(''); }}
            onSubmit={() => { if (!friendName.trim()) { setError('Please enter your friend\'s name.'); return; } generate(friendName.trim()); }}
          />
        )}

        <a href="/coupons" className="block text-center text-sm font-semibold hover:underline" style={{ color: '#0E7C7B' }}>
          View all my coupons →
        </a>
      </div>
    );
  }

  // ── Initial state: choose recipient ───────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Recipient selector */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">Who is this coupon for?</p>
        <div className="grid grid-cols-2 gap-2.5">
          {/* For Me */}
          <button
            type="button"
            onClick={() => { setRecipient('me'); setError(''); }}
            className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 text-center transition-all"
            style={{
              borderColor: recipient === 'me' ? '#0E7C7B' : '#E5E7EB',
              background:  recipient === 'me' ? '#F0FDFA' : 'white',
            }}
          >
            {recipient === 'me' && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#0E7C7B' }}>
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            )}
            <span className="text-2xl">🧳</span>
            <div>
              <p className="text-sm font-extrabold" style={{ color: recipient === 'me' ? '#0E7C7B' : '#1A3C5E' }}>For Me</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">Coupon added<br/>to my account</p>
            </div>
          </button>

          {/* For a Friend */}
          <button
            type="button"
            onClick={() => { setRecipient('friend'); setError(''); }}
            className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 text-center transition-all"
            style={{
              borderColor: recipient === 'friend' ? '#7C3AED' : '#E5E7EB',
              background:  recipient === 'friend' ? '#F5F3FF' : 'white',
            }}
          >
            {recipient === 'friend' && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#7C3AED' }}>
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            )}
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-sm font-extrabold" style={{ color: recipient === 'friend' ? '#7C3AED' : '#1A3C5E' }}>For a Friend</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">Gift a coupon<br/>to someone else</p>
            </div>
          </button>
        </div>
      </div>

      {/* Friend details form */}
      {recipient === 'friend' && (
        <FriendForm
          name={friendName} setName={setFriendName}
          email={friendEmail} setEmail={setFriendEmail}
          phone={friendPhone} setPhone={setFriendPhone}
          loading={loading}
          inline
        />
      )}

      {error && <ErrorBanner msg={error} />}

      {/* Generate button */}
      <button
        onClick={handleSubmit}
        disabled={loading || (recipient === 'friend' && !friendName.trim())}
        className="w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        style={{
          background: recipient === 'friend'
            ? 'linear-gradient(135deg, #6D28D9, #7C3AED)'
            : 'linear-gradient(135deg, #1A3C5E, #0E7C7B)',
        }}
      >
        {loading
          ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Generating…</>
          : recipient === 'friend'
            ? <><span>🎁</span> Generate Friend&apos;s Coupon</>
            : <><span>🎫</span> Get My Coupon</>
        }
      </button>

      <p className="text-xs text-gray-400 text-center">Requires an active subscription</p>
    </div>
  );
}

// ── Friend details form ────────────────────────────────────────────────────────
function FriendForm({
  name, setName, email, setEmail, phone, setPhone,
  loading, inline = false, onCancel, onSubmit,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  loading: boolean;
  inline?: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  return (
    <div
      className="rounded-2xl border space-y-3 p-4"
      style={{ background: '#F5F3FF', borderColor: '#DDD6FE' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">👥</span>
        <p className="text-xs font-bold text-purple-700">Friend&apos;s Details</p>
      </div>

      {/* Full name — required */}
      <div>
        <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          autoFocus={!inline}
          className="w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 bg-white transition-all"
          style={{ borderColor: '#C4B5FD', ['--tw-ring-color' as string]: '#EDE9FE' }}
        />
      </div>

      {/* Email — optional */}
      <div>
        <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">
          Email <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="friend@example.com"
          className="w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 bg-white transition-all"
          style={{ borderColor: '#C4B5FD', ['--tw-ring-color' as string]: '#EDE9FE' }}
        />
      </div>

      {/* Phone — optional */}
      <div>
        <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1">
          Phone <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          className="w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 bg-white transition-all"
          style={{ borderColor: '#C4B5FD', ['--tw-ring-color' as string]: '#EDE9FE' }}
        />
      </div>

      {/* Buttons — only shown when used in "add more" mode (not inline) */}
      {!inline && onSubmit && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !name.trim()}
            className="flex-1 py-2 text-sm font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #7C3AED)' }}
          >
            {loading
              ? <><span className="inline-block animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />Generating…</>
              : '🎫 Generate'
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── Generated coupon result card ───────────────────────────────────────────────
function CouponResult({ coupon, hotelName, idx, friendEmail, friendPhone }: {
  coupon: Coupon; hotelName: string; idx: number;
  friendEmail?: string; friendPhone?: string;
}) {
  const [copied, setCopied] = useState(false);
  const isMine = idx === 0 && !coupon.guestName;
  const color  = isMine ? '#0E7C7B' : '#7C3AED';
  const grad   = isMine
    ? 'linear-gradient(90deg, #1A3C5E, #0E7C7B)'
    : 'linear-gradient(90deg, #6D28D9, #7C3AED)';

  async function copyCode() {
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: color }}>

      {/* Header band */}
      <div className="px-4 py-2.5 text-white text-xs font-bold flex items-center gap-2" style={{ background: grad }}>
        <span>{isMine ? '✅' : '🎁'}</span>
        <span className="flex-1 truncate">
          {isMine ? `Your coupon for ${hotelName}` : `Coupon for ${coupon.guestName} · ${hotelName}`}
        </span>
      </div>

      {/* QR + code */}
      {coupon.qrDataUrl && (
        <div className="flex justify-center pt-4 pb-2 bg-white">
          <div className="p-2 rounded-xl border border-gray-100 shadow-sm">
            <img src={coupon.qrDataUrl} alt="QR" className="w-28 h-28" />
          </div>
        </div>
      )}

      <div className="bg-gray-50 mx-3 mb-3 mt-2 rounded-xl px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Coupon Code</p>
            <p className="font-mono text-sm font-extrabold tracking-widest text-gray-800 truncate">{coupon.code}</p>
          </div>
          <button
            onClick={copyCode}
            className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
            style={copied
              ? { background: '#D1FAE5', color: '#065F46' }
              : { background: '#F3F4F6', color: '#374151' }
            }
          >
            {copied
              ? <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>Copied</>
              : <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</>
            }
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">
          🎉 <span className="font-bold" style={{ color }}>{ coupon.discountPercent}% OFF</span>
          {' '}·{' '}
          Expires {new Date(coupon.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Friend contact info (if provided) */}
      {coupon.guestName && (friendEmail || friendPhone) && (
        <div className="mx-3 mb-3 rounded-xl px-3 py-2.5 space-y-1" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1.5">Share with friend</p>
          {friendEmail && (
            <a
              href={`mailto:${friendEmail}?subject=Your ${coupon.discountPercent}% off coupon for ${hotelName}&body=Hi ${coupon.guestName},%0A%0AHere is your BusyBeds coupon!%0A%0ACoupon Code: ${coupon.code}%0ADiscount: ${coupon.discountPercent}% OFF%0AHotel: ${hotelName}%0AExpires: ${new Date(coupon.expiresAt).toLocaleDateString()}%0A%0APresent this code at hotel reception.`}
              className="flex items-center gap-2 text-xs text-purple-700 hover:text-purple-900 font-medium"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <span className="truncate">Email to {friendEmail}</span>
            </a>
          )}
          {friendPhone && (
            <a
              href={`https://wa.me/${friendPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${coupon.guestName}! Here's your BusyBeds discount coupon for ${hotelName}:\n\nCode: ${coupon.code}\nDiscount: ${coupon.discountPercent}% OFF\nExpires: ${new Date(coupon.expiresAt).toLocaleDateString()}\n\nPresent this at hotel reception.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-purple-700 hover:text-purple-900 font-medium"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="truncate">WhatsApp {friendPhone}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Error banner ───────────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-2.5 rounded-xl">
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </div>
  );
}
