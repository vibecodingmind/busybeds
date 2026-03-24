'use client';
import { useState, useEffect } from 'react';

interface Props {
  hotelId: string;
  hotelName: string;
}

export default function PriceDropAlert({ hotelId, hotelName }: Props) {
  const [email, setEmail] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`price_alert_${hotelId}`);
    if (stored) setEnrolled(true);
  }, [hotelId]);

  const enroll = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, email }),
      });
      if (res.ok) {
        localStorage.setItem(`price_alert_${hotelId}`, email);
        setEnrolled(true);
        setShow(false);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (enrolled) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        Price drop alerts on
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        Notify me of price drops
      </button>
      {show && (
        <div className="mt-2 flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enroll()}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            onClick={enroll}
            disabled={loading}
            className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '…' : 'Alert me'}
          </button>
        </div>
      )}
    </div>
  );
}
