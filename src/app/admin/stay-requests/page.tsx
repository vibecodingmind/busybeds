'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface StayRequest {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalStayCost: number;
  depositAmount: number;
  platformFeeAmount: number;
  hotelReceives: number;
  discountPercent: number;
  createdAt: string;
  hotel: { id: string; name: string; city: string; country: string };
  roomType: { name: string; pricePerNight: number };
  traveler: { id: string; fullName: string; email: string };
  coupon: { code: string; status: string } | null;
}

interface Stats {
  totalRequests: number;
  totalDeposits: number;
  platformRevenue: number;
  hotelPayouts: number;
  totalStayValue: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending_approval: 'bg-amber-100 text-amber-800',
  pending_payment:  'bg-blue-100 text-blue-800',
  paid:             'bg-emerald-100 text-emerald-800',
  confirmed:        'bg-emerald-100 text-emerald-800',
  completed:        'bg-gray-100 text-gray-600',
  declined:         'bg-red-100 text-red-700',
  cancelled:        'bg-gray-100 text-gray-600',
  no_show:          'bg-red-100 text-red-700',
};

export default function AdminStayRequestsPage() {
  const [requests, setRequests] = useState<StayRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFee, setPlatformFee] = useState('5');
  const [savingFee, setSavingFee] = useState(false);
  const [feeSaved, setFeeSaved] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    const res = await fetch(`/api/admin/stay-requests${params}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setStats(data.stats || null);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load current platform fee
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.values?.stay_request_platform_fee_percent) {
          setPlatformFee(d.values.stay_request_platform_fee_percent);
        }
      });
  }, []);

  async function savePlatformFee() {
    setSavingFee(true);
    const val = parseFloat(platformFee);
    if (isNaN(val) || val < 0 || val > 50) {
      alert('Fee must be between 0 and 50.');
      setSavingFee(false);
      return;
    }
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: { stay_request_platform_fee_percent: String(val) } }),
    });
    setFeeSaved(true);
    setTimeout(() => setFeeSaved(false), 2000);
    setSavingFee(false);
  }

  const statuses = ['', 'pending_approval', 'pending_payment', 'paid', 'confirmed', 'completed', 'declined', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stay Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all extended stay requests and deposits</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Admin
          </Link>
        </div>

        {/* Platform fee setting */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">Platform Fee</h2>
          <p className="text-sm text-gray-500 mb-4">Percentage BusyBeds takes from each deposit. Applied to all new stay requests.</p>
          <div className="flex items-center gap-3">
            <div className="relative w-32">
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={platformFee}
                onChange={e => setPlatformFee(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            <button
              onClick={savePlatformFee}
              disabled={savingFee}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {feeSaved ? '✓ Saved' : savingFee ? 'Saving...' : 'Save'}
            </button>
            <p className="text-xs text-gray-400">Current: hotel receives {Math.round((100 - parseFloat(platformFee || '5')))}% of deposit</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Requests', value: stats.totalRequests, prefix: '' },
              { label: 'Total Deposits', value: `$${stats.totalDeposits.toFixed(0)}`, prefix: '' },
              { label: 'Platform Revenue', value: `$${stats.platformRevenue.toFixed(2)}`, prefix: '' },
              { label: 'Hotel Payouts', value: `$${stats.hotelPayouts.toFixed(0)}`, prefix: '' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-emerald-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No stay requests found.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Hotel', 'Traveler', 'Dates', 'Room', 'Deposit', 'Platform Fee', 'Status', 'Created'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, i) => (
                    <tr key={req.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{req.hotel.name}</p>
                        <p className="text-xs text-gray-400">{req.hotel.city}, {req.hotel.country}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{req.traveler.fullName}</p>
                        <p className="text-xs text-gray-400">{req.traveler.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {new Date(req.checkIn).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {new Date(req.checkOut).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-gray-400">{req.nights} nights</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{req.roomType.name}</p>
                        <p className="text-xs text-gray-400">{req.guests} guests</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">${req.depositAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">of ${req.totalStayCost.toFixed(0)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-emerald-700">${req.platformFeeAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">hotel: ${req.hotelReceives.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
