'use client';

import { useState, useEffect } from 'react';

interface PriceAlertButtonProps {
  hotelId: string;
  hotelName: string;
  discountPercent: number;
}

export default function PriceAlertButton({ hotelId, hotelName, discountPercent }: PriceAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [minDiscount, setMinDiscount] = useState(discountPercent);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [alertId, setAlertId] = useState<string | null>(null);

  // Check for existing alert on mount
  useEffect(() => {
    const checkAlert = async () => {
      try {
        const res = await fetch('/api/price-alerts');
        if (!res.ok) return;
        const data = await res.json();
        const existing = data.alerts?.find((a: { hotelId: string; id: string; minDiscount: number; email: string }) => a.hotelId === hotelId);
        if (existing) {
          setIsSubscribed(true);
          setAlertId(existing.id);
          setMinDiscount(existing.minDiscount);
          setEmail(existing.email);
        }
      } catch {
        // Not logged in or no alerts — silent
      }
    };
    checkAlert();
  }, [hotelId]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    const prefill = async () => {
      try {
        const res = await fetch('/api/subscription-status');
        if (!res.ok) return;
        const data = await res.json();
        if (data.email && !email) setEmail(data.email);
      } catch { /* ignore */ }
    };
    prefill();
  }, [email]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, email: email.trim(), minDiscount }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus('success');
        setIsSubscribed(true);
        setAlertId(data.alert?.id ?? null);
        setMessage(`You'll be notified when ${hotelName} offers ${minDiscount}% or more off.`);
        setTimeout(() => setIsOpen(false), 2500);
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.error || 'Failed to set alert. Try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleUnsubscribe = async () => {
    if (!alertId && !hotelId) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/price-alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId }),
      });

      if (res.ok) {
        setIsSubscribed(false);
        setAlertId(null);
        setStatus('idle');
        setMessage('');
        setIsOpen(false);
      } else {
        setStatus('error');
        setMessage('Failed to remove alert.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error.');
    }
  };

  return (
    <>
      {/* Bell trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        title={isSubscribed ? 'Manage price alert' : 'Get notified about deals'}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all"
        style={
          isSubscribed
            ? { borderColor: '#0E7C7B', color: '#0E7C7B', background: '#F0FAFA' }
            : { borderColor: '#e5e7eb', color: '#374151', background: '#fff' }
        }>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={isSubscribed ? '#0E7C7B' : 'none'}
          stroke={isSubscribed ? '#0E7C7B' : 'currentColor'} strokeWidth={2}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {isSubscribed ? 'Alert On' : 'Price Alert'}
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#F0FAFA' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#0E7C7B" strokeWidth={2.2}>
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">Price Alert</h3>
                <p className="text-xs text-gray-500">{hotelName}</p>
              </div>
            </div>

            {isSubscribed ? (
              /* Already subscribed state */
              <div>
                <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                  style={{ background: '#F0FAFA', border: '1px solid #CCF2F1' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E7C7B" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: '#0E7C7B' }}>Alert active — {minDiscount}%+ off</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  We'll email <strong>{email}</strong> when this hotel offers {minDiscount}% or more off.
                </p>
                {message && status === 'error' && (
                  <p className="text-xs text-red-600 mb-3">{message}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSubscribed(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 font-medium hover:border-gray-400 transition-colors">
                    Edit Alert
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={status === 'loading'}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                    style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                    {status === 'loading' ? 'Removing...' : 'Remove Alert'}
                  </button>
                </div>
              </div>
            ) : (
              /* Subscribe form */
              <form onSubmit={handleSubscribe}>
                <p className="text-sm text-gray-600 mb-4">
                  Get an email the moment {hotelName} meets your discount threshold.
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': '#0E7C7B' } as React.CSSProperties}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Alert me when discount is at least
                    <span className="ml-1 font-bold" style={{ color: '#FF385C' }}>{minDiscount}%</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">5%</span>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={minDiscount}
                      onChange={e => setMinDiscount(Number(e.target.value))}
                      className="flex-1 accent-rose-500"
                    />
                    <span className="text-xs text-gray-400">50%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                    <span>Any deal</span>
                    <span>Best deals only</span>
                  </div>
                </div>

                {status === 'success' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                    style={{ background: '#F0FAFA', border: '1px solid #CCF2F1' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E7C7B" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-xs" style={{ color: '#0E7C7B' }}>{message}</span>
                  </div>
                )}

                {status === 'error' && (
                  <p className="text-xs text-red-600 mb-3">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#1A3C5E,#0E7C7B)' }}>
                  {status === 'loading' ? 'Setting alert…' : status === 'success' ? '✓ Alert set!' : 'Set Price Alert'}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  One email per deal. Unsubscribe any time.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
