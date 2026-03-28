'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useMemo } from 'react';

type GiftCard = {
  id: string; code: string; amount: number; balance: number;
  isActive: boolean; expiresAt: string; purchasedAt: string; redeemedAt: string | null;
  recipientName: string | null; recipientEmail: string | null; message: string | null;
  purchasedBy: { fullName: string; email: string } | null;
  redeemedBy:  { fullName: string; email: string } | null;
};

type Stats = { total: number; active: number; redeemed: number; expired: number; totalValue: number; redeemedValue: number };

export default function AdminGiftCardsPage() {
  const [cards, setCards]   = useState<GiftCard[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gift-cards?status=${filter}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setCards(data.cards || []);
      setStats(data.stats || null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const filtered = useMemo(() => {
    if (!search) return cards;
    const q = search.toLowerCase();
    return cards.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.purchasedBy?.email?.toLowerCase().includes(q) ||
      c.purchasedBy?.fullName?.toLowerCase().includes(q) ||
      c.recipientEmail?.toLowerCase().includes(q)
    );
  }, [cards, search]);

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/gift-cards', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    });
    if (res.ok) {
      setCards(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
      showToast(current ? 'Gift card deactivated' : 'Gift card activated');
    }
  };

  const now = new Date();

  const getStatus = (c: GiftCard) => {
    if (c.redeemedBy) return { label: 'Redeemed', cls: 'bg-blue-50 text-blue-600 border-blue-200' };
    if (!c.isActive)  return { label: 'Inactive',  cls: 'bg-gray-50 text-gray-500 border-gray-200' };
    if (new Date(c.expiresAt) < now) return { label: 'Expired', cls: 'bg-red-50 text-red-500 border-red-200' };
    return { label: 'Active', cls: 'bg-green-50 text-green-600 border-green-200' };
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Gift Cards</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor and manage all gift cards on the platform</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Issued', value: stats.total, sub: `$${stats.totalValue.toFixed(0)} total value`, color: 'text-gray-900' },
            { label: 'Active', value: stats.active, sub: 'Ready to redeem', color: 'text-green-600' },
            { label: 'Redeemed', value: stats.redeemed, sub: `$${stats.redeemedValue.toFixed(0)} redeemed`, color: 'text-blue-600' },
            { label: 'Expired', value: stats.expired, sub: 'Never redeemed', color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        {['all', 'active', 'redeemed', 'expired'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${filter === f ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={filter === f ? { background: '#E8395A', borderColor: '#E8395A' } : {}}>
            {f}
          </button>
        ))}
        <div className="ml-auto relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search code, email…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] bg-white w-56" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No gift cards found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Purchased By</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Recipient</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Redeemed By</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Expires</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => {
                  const st = getStatus(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-gray-800 text-xs tracking-wider">{c.code}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">${c.amount}</td>
                      <td className="px-4 py-3.5">
                        {c.purchasedBy ? (
                          <div><p className="font-medium text-gray-800">{c.purchasedBy.fullName}</p><p className="text-gray-400 text-xs">{c.purchasedBy.email}</p></div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.recipientName || c.recipientEmail ? (
                          <div><p className="text-gray-700">{c.recipientName || '—'}</p><p className="text-gray-400 text-xs">{c.recipientEmail || ''}</p></div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.redeemedBy ? (
                          <div><p className="font-medium text-gray-800">{c.redeemedBy.fullName}</p><p className="text-gray-400 text-xs">{c.redeemedAt ? new Date(c.redeemedAt).toLocaleDateString() : ''}</p></div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{new Date(c.expiresAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {!c.redeemedBy && (
                          <button onClick={() => toggleActive(c.id, c.isActive)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${c.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
