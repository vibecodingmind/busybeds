'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useTripPlanner } from '@/hooks/useTripPlanner';

const FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

function nightsBetween(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

export default function TripPlannerPage() {
  const { plan, removeHotel, updateHotel, clearPlan } = useTripPlanner();
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Bulk coupon generation
  const [bulkState, setBulkState] = useState<'idle' | 'running' | 'done'>('idle');
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResults, setBulkResults] = useState<Array<{ name: string; ok: boolean; msg: string }>>([]);

  const handleBulkCoupons = async () => {
    setBulkState('running');
    setBulkProgress(0);
    setBulkResults([]);
    const results: typeof bulkResults = [];
    for (let i = 0; i < plan.length; i++) {
      const h = plan[i];
      try {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotelId: h.hotelId }),
        });
        const data = await res.json();
        if (res.status === 401) { window.location.href = '/login?next=/trip-planner'; return; }
        if (res.status === 402) { results.push({ name: h.name, ok: false, msg: 'No active subscription' }); }
        else if (!res.ok) { results.push({ name: h.name, ok: false, msg: data.error || 'Failed' }); }
        else { results.push({ name: h.name, ok: true, msg: data.existing ? 'Already had coupon' : 'Generated!' }); }
      } catch {
        results.push({ name: h.name, ok: false, msg: 'Network error' });
      }
      setBulkProgress(i + 1);
      setBulkResults([...results]);
    }
    setBulkState('done');
  };

  const totalNights = plan.reduce((sum, h) => sum + nightsBetween(h.checkIn, h.checkOut), 0);

  const handleExport = () => {
    if (typeof window === 'undefined') return;
    const lines = plan.map(h => {
      const dates = h.checkIn && h.checkOut
        ? `${h.checkIn} → ${h.checkOut} (${nightsBetween(h.checkIn, h.checkOut)} nights)`
        : 'Dates TBD';
      return `${h.name}\n  ${h.city}, ${h.country}  ★${h.starRating}\n  ${dates}${h.notes ? `\n  Notes: ${h.notes}` : ''}`;
    });
    const text = `My BusyBeds Trip Plan\n${'─'.repeat(30)}\n\n${lines.join('\n\n')}\n\n${'─'.repeat(30)}\n${plan.length} hotel${plan.length !== 1 ? 's' : ''} · ${totalNights} night${totalNights !== 1 ? 's' : ''} total\nbusybeds.com`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'busybeds-trip-plan.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trip Planner</h1>
            <p className="text-sm text-gray-500 mt-0.5">Save hotels and plan your itinerary</p>
          </div>
          {plan.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#FF385C' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
              <button
                onClick={() => { if (window.confirm('Clear your entire trip plan?')) clearPlan(); }}
                className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {plan.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,56,92,0.08)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF385C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Your trip plan is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Browse hotels and click the suitcase icon to add them here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#FF385C' }}
            >
              Browse Hotels
            </Link>
          </div>
        )}

        {/* Summary bar */}
        {plan.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{plan.length}</p>
              <p className="text-xs text-gray-500">hotel{plan.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalNights}</p>
              <p className="text-xs text-gray-500">night{totalNights !== 1 ? 's' : ''} total</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/" className="text-sm font-medium hover:underline" style={{ color: '#FF385C' }}>
                + Add more hotels
              </Link>
              {bulkState === 'idle' && (
                <button
                  onClick={handleBulkCoupons}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2} strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  Get All Coupons
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bulk coupon progress */}
        {bulkState !== 'idle' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">
                {bulkState === 'running' ? `Generating coupons… (${bulkProgress}/${plan.length})` : '✅ Done!'}
              </p>
              {bulkState === 'done' && (
                <div className="flex gap-2">
                  <a href="/coupons" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: '#0E7C7B' }}>
                    View Coupons →
                  </a>
                  <button onClick={() => setBulkState('idle')} className="text-xs text-gray-400 px-2">Dismiss</button>
                </div>
              )}
            </div>
            {bulkState === 'running' && (
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(bulkProgress / plan.length) * 100}%`, background: 'linear-gradient(90deg, #1A3C5E, #0E7C7B)' }}
                />
              </div>
            )}
            <div className="space-y-1.5">
              {bulkResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{r.ok ? '✅' : '❌'}</span>
                  <span className="font-medium text-gray-700 flex-1 truncate">{r.name}</span>
                  <span className={r.ok ? 'text-green-600' : 'text-red-500'}>{r.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotel list */}
        <div className="space-y-4">
          {plan.map((h, i) => (
            <div key={h.hotelId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex gap-4">
                {/* Hotel number + image */}
                <div className="flex items-start gap-3 flex-shrink-0">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-1"
                    style={{ background: '#FF385C' }}>
                    {i + 1}
                  </span>
                  <Link href={`/hotels/${h.slug}`}>
                    <img
                      src={imgErrors[h.hotelId] ? FALLBACK : (h.coverImage || FALLBACK)}
                      alt={h.name}
                      onError={() => setImgErrors(prev => ({ ...prev, [h.hotelId]: true }))}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 hover:opacity-90 transition-opacity"
                    />
                  </Link>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/hotels/${h.slug}`} className="font-semibold text-gray-900 text-sm hover:underline line-clamp-1">
                        {h.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {h.city}, {h.country}
                        {' · '}
                        {'★'.repeat(Math.round(h.starRating))}
                      </p>
                    </div>
                    <button
                      onClick={() => removeHotel(h.hotelId)}
                      title="Remove from plan"
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-medium text-gray-400">Check-in</label>
                      <input
                        type="date"
                        value={h.checkIn || ''}
                        onChange={e => updateHotel(h.hotelId, { checkIn: e.target.value })}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-medium text-gray-400">Check-out</label>
                      <input
                        type="date"
                        value={h.checkOut || ''}
                        min={h.checkIn || ''}
                        onChange={e => updateHotel(h.hotelId, { checkOut: e.target.value })}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-gray-400"
                      />
                    </div>
                    {nightsBetween(h.checkIn, h.checkOut) > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full text-white" style={{ background: '#FF385C' }}>
                        {nightsBetween(h.checkIn, h.checkOut)} night{nightsBetween(h.checkIn, h.checkOut) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  <textarea
                    value={h.notes || ''}
                    onChange={e => updateHotel(h.hotelId, { notes: e.target.value })}
                    placeholder="Add notes…"
                    rows={2}
                    className="w-full mt-2 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-300 resize-none bg-gray-50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
