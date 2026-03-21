'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Package { id: string; name: string; priceMonthly: number; priceAnnual?: number; couponLimitPerPeriod: number; durationDays: number; }

export default function SubscribePage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/subscriptions/packages').then(r => r.json()).then(d => setPackages(d.packages || []));
  }, []);

  const subscribe = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selected }),
      });
      if (res.status === 401) { router.push('/login?next=/subscribe'); return; }
      if (res.ok) {
        const data = await res.json();
        if (data.mode === 'stripe' && data.url) {
          window.location.href = data.url; // redirect to Stripe checkout
        } else {
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    ['🎫', 'Unique QR coupons per hotel'],
    ['✅', 'Verified by hotel staff'],
    ['🔒', 'Single-use — fraud-proof'],
    ['♾️', 'Cancel anytime'],
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re subscribed!</h1>
          <p className="text-gray-500 mt-2">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1A3C5E' }}>
              <span className="text-white font-bold text-sm">BB</span>
            </div>
            <span className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Busy Beds</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">Choose your plan</h1>
          <p className="text-gray-500 mt-2">Unlock hotel discount coupons. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {packages.map((pkg, i) => {
            const isPopular = i === 1;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`card p-6 text-left transition-all relative ${selected === pkg.id ? 'ring-2 ring-teal-500 shadow-md' : 'hover:shadow-md'}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="font-bold text-lg mb-1" style={{ color: '#1A3C5E' }}>{pkg.name}</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-gray-900">${pkg.priceMonthly}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">✓</span>
                    <span><strong>{pkg.couponLimitPerPeriod}</strong> coupons per period</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>{pkg.durationDays}-day access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">✓</span>
                    <span>All hotels included</span>
                  </div>
                </div>
                {selected === pkg.id && (
                  <div className="mt-4 text-center text-teal-600 font-semibold text-sm">✓ Selected</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="card p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {highlights.map(([icon, text]) => (
              <div key={text as string} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-lg">{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={subscribe}
            disabled={!selected || loading}
            className="btn-primary w-full max-w-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Processing...</> : 'Start Subscription →'}
          </button>
          <p className="text-xs text-gray-400">Demo mode — no payment required. Stripe integration ready.</p>
          <Link href="/" className="text-sm text-gray-500 hover:text-teal-600">← Back to hotels</Link>
        </div>
      </div>
    </div>
  );
}
