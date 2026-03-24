'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/app/admin/AdminSidebar';

interface Payout {
  id: string;
  userId: string;
  amount: number;
  paypalEmail: string;
  status: string;
  adminNotes: string | null;
  requestedAt: string;
  processedAt: string | null;
  user: { fullName: string; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  requested:  'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  paid:       'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
};

export default function ReferralPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('requested');
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/referral-payouts?status=${filter}`)
      .then(r => r.json())
      .then(d => setPayouts(d.payouts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const update = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/referral-payouts?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes[id] }),
      });
      if (res.ok) {
        setPayouts(prev => prev.filter(p => p.id !== id));
      }
    } finally { setUpdating(null); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Referral Payouts</h1>
          <p className="text-gray-500 text-sm mb-6">Review and process payout requests from affiliates.</p>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {['requested', 'processing', 'paid', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading && <div className="text-gray-400 text-sm">Loading…</div>}

          {!loading && payouts.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No {filter} payouts.
            </div>
          )}

          <div className="space-y-4">
            {payouts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-bold text-gray-900">{p.user.fullName}</div>
                    <div className="text-sm text-gray-500">{p.user.email}</div>
                    <div className="text-xs text-gray-400 mt-1">PayPal: <span className="font-mono">{p.paypalEmail}</span></div>
                    <div className="text-xs text-gray-400">Requested: {new Date(p.requestedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900">${p.amount.toFixed(2)}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>

                {(p.status === 'requested' || p.status === 'processing') && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={notes[p.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Admin notes (optional)"
                      rows={2}
                      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => update(p.id, 'processing')}
                        disabled={updating === p.id}
                        className="flex-1 py-2 text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        Mark Processing
                      </button>
                      <button
                        onClick={() => update(p.id, 'paid')}
                        disabled={updating === p.id}
                        className="flex-1 py-2 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50"
                        style={{ background: '#16a34a' }}
                      >
                        {updating === p.id ? 'Updating…' : '✓ Mark Paid'}
                      </button>
                      <button
                        onClick={() => update(p.id, 'rejected')}
                        disabled={updating === p.id}
                        className="flex-1 py-2 text-sm font-semibold bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {p.adminNotes && (
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                    Notes: {p.adminNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
