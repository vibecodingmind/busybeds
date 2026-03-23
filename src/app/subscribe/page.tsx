'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Package {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual?: number;
  couponLimitPerPeriod: number;
  durationDays: number;
  tier?: string;
}

type PaymentMethod = 'stripe' | 'paypal' | 'pesapal';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { id: 'stripe',  label: 'Card',    icon: '💳', desc: 'Visa, Mastercard, Amex' },
  { id: 'paypal',  label: 'PayPal',  icon: '🅿️', desc: 'Pay with your PayPal account' },
  { id: 'pesapal', label: 'Pesapal', icon: '🌍', desc: 'M-Pesa, Airtel, Cards (Africa)' },
];

export default function SubscribePage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/subscriptions/packages')
      .then(r => r.json())
      .then(d => setPackages(d.packages || []))
      .finally(() => setLoadingPackages(false));
  }, []);

  const subscribe = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      // Determine endpoint based on payment method
      const endpoint =
        paymentMethod === 'paypal'  ? '/api/payments/paypal' :
        paymentMethod === 'pesapal' ? '/api/payments/pesapal' :
        '/api/subscriptions';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selected }),
      });

      if (res.status === 401) {
        router.push('/login?next=/subscribe');
        return;
      }

      let data: { error?: string; mode?: string; url?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) {
        setError(data.error || `Error ${res.status} — please try again.`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 2500);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '🎫', text: 'Unique QR coupons per hotel' },
    { icon: '✅', text: 'Verified by hotel staff' },
    { icon: '🔒', text: 'Single-use — fraud-proof' },
    { icon: '♾️', text: 'Cancel anytime' },
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)' }}>
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md mx-4">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">You&apos;re subscribed!</h1>
          <p className="text-gray-500 mb-2">Welcome to Busy Beds. Your discount coupons are ready.</p>
          <p className="text-sm text-gray-400">Redirecting to your dashboard...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      {/* ── Hero ── */}
      <div className="text-center py-14 px-4" style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0f6b6b 100%)' }}>
        <div className="inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
          Simple pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          Choose your plan
        </h1>
        <p className="text-lg text-white/70 max-w-md mx-auto">
          Unlock hotel discount coupons at hundreds of verified hotels. Pay once, save every trip.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* ── Packages ── */}
        {loadingPackages ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg font-semibold text-gray-600">No plans available yet</p>
            <p className="text-sm mt-1">Check back soon — plans are being set up.</p>
          </div>
        ) : (
          <div className={`grid gap-6 mb-10 ${packages.length === 1 ? 'max-w-sm mx-auto' : packages.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
            {packages.map((pkg, i) => {
              const isPopular  = packages.length >= 3 && i === 1;
              const isPremium  = pkg.tier === 'premium';
              const isSelected = selected === pkg.id;
              const premiumPerks = ['Flash deal early access', 'Priority in search results', 'Premium support'];
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelected(pkg.id)}
                  className="relative text-left rounded-2xl border-2 transition-all duration-200 overflow-visible"
                  style={{
                    borderColor: isSelected ? '#0f6b6b' : isPremium ? '#7C3AED' : isPopular ? '#1A3C5E' : '#e5e7eb',
                    background: isSelected ? '#f0fafa' : 'white',
                    boxShadow: isSelected ? '0 8px 30px rgba(15,107,107,0.15)' : isPremium ? '0 4px 20px rgba(124,58,237,0.12)' : isPopular ? '0 4px 20px rgba(26,60,94,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                  }}
                >
                  {isPremium && !isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 text-white text-xs font-bold px-4 py-1 rounded-full shadow" style={{ background: 'linear-gradient(135deg, #6D28D9, #7C3AED)' }}>
                      ⭐ Premium
                    </div>
                  )}
                  {isPopular && !isPremium && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 text-white text-xs font-bold px-4 py-1 rounded-full shadow" style={{ background: '#1A3C5E' }}>
                      ⭐ Most Popular
                    </div>
                  )}
                  <div className="p-7">
                    <div className="font-bold text-xl mb-1" style={{ color: isPremium ? '#6D28D9' : '#1A3C5E' }}>{pkg.name}</div>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-4xl font-extrabold text-gray-900">${pkg.priceMonthly}</span>
                      <span className="text-gray-400 text-sm font-medium">/month</span>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                        <span><strong className="text-gray-800">{pkg.couponLimitPerPeriod}</strong> coupons per period</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                        <span><strong className="text-gray-800">{pkg.durationDays}-day</strong> access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                        <span>All hotels included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                        <span>Cancel anytime</span>
                      </div>
                      {isPremium && premiumPerks.map(perk => (
                        <div key={perk} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#EDE9FE', color: '#7C3AED' }}>✓</span>
                          <span className="font-medium" style={{ color: '#6D28D9' }}>{perk}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <div
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all ${isSelected ? 'text-white' : 'text-gray-700 border border-gray-200'}`}
                        style={{ background: isSelected ? (isPremium ? 'linear-gradient(135deg, #6D28D9, #7C3AED)' : '#0f6b6b') : 'transparent' }}
                      >
                        {isSelected ? '✓ Selected' : 'Select plan'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Payment Method ── */}
        {packages.length > 0 && (
          <div className="max-w-md mx-auto mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Choose payment method</p>
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map(({ id, label, icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center"
                  style={{
                    borderColor: paymentMethod === id ? '#0f6b6b' : '#e5e7eb',
                    background: paymentMethod === id ? '#f0fafa' : 'white',
                  }}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-bold text-gray-800">{label}</span>
                  <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── CTA ── */}
        {packages.length > 0 && (
          <div className="flex flex-col items-center gap-4 mb-12">
            <button
              onClick={subscribe}
              disabled={!selected || loading}
              className="w-full max-w-sm py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: selected ? 'linear-gradient(135deg, #1A3C5E, #0f6b6b)' : '#9ca3af' }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>Start Subscription →</>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Secure checkout · Cancel anytime · No hidden fees
            </p>
          </div>
        )}

        {/* ── Features strip ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {features.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                <span className="text-sm text-gray-600 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-teal-600 transition-colors">← Back to hotels</Link>
        </div>
      </div>
    </div>
  );
}
