'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useMemo } from 'react';

type LoyaltyRow = {
  id: string; points: number; lifetime: number;
  user: { id: string; fullName: string; email: string; avatar: string | null };
};
type Stats = { totalUsers: number; totalActivePoints: number; totalLifetimePoints: number };

const TIERS = [
  { label: 'Bronze',   min: 0,    max: 499,  color: '#92400E', bg: '#FEF3C7' },
  { label: 'Silver',   min: 500,  max: 1499, color: '#475569', bg: '#F1F5F9' },
  { label: 'Gold',     min: 1500, max: 4999, color: '#B45309', bg: '#FFFBEB' },
  { label: 'Platinum', min: 5000, max: Infinity, color: '#5B21B6', bg: '#F5F3FF' },
];

function getTier(lifetime: number) {
  return TIERS.find(t => lifetime >= t.min && lifetime <= t.max) ?? TIERS[0];
}

export default function AdminLoyaltyPage() {
  const [rows, setRows]     = useState<LoyaltyRow[]>([]);
  const [stats, setStats]   = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState('');

  // Manual award modal
  const [modal, setModal]   = useState<{ userId: string; name: string } | null>(null);
  const [pts, setPts]       = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/loyalty');
      const data = await res.json();
      setRows(data.rows || []);
      setStats(data.stats || null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.user.fullName.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleAward = async () => {
    if (!modal || !pts || !reason) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: modal.userId, points: parseInt(pts), reason }),
      });
      if (!res.ok) throw new Error();
      showToast(`Points adjusted for ${modal.name}`);
      setModal(null); setPts(''); setReason('');
      load();
    } catch { showToast('Failed to adjust points'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Loyalty Points</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor user points, tiers, and manually adjust balances</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Members with Points', value: stats.totalUsers.toLocaleString(), color: 'text-gray-900' },
            { label: 'Total Active Points', value: stats.totalActivePoints.toLocaleString(), color: 'text-[#E8395A]' },
            { label: 'Lifetime Points Earned', value: stats.totalLifetimePoints.toLocaleString(), color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tier legend */}
      <div className="flex gap-2 flex-wrap">
        {TIERS.map(t => (
          <span key={t.label} className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: t.bg, color: t.color }}>
            {t.label}: {t.min === 0 ? '0' : t.min.toLocaleString()}–{t.max === Infinity ? '∞' : t.max.toLocaleString()} pts
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-64">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder="Search user…" value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] bg-white w-full" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No loyalty data found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Tier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Active Points</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">Lifetime Earned</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => {
                  const tier = getTier(r.lifetime);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {r.user.avatar ? (
                            <img src={r.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}>
                              {r.user.fullName?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{r.user.fullName}</p>
                            <p className="text-xs text-gray-400">{r.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: tier.bg, color: tier.color }}>
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">{r.points.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-gray-500">{r.lifetime.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setModal({ userId: r.user.id, name: r.user.fullName })}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
                          Adjust Points
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual adjustment modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">Adjust Points</h3>
            <p className="text-sm text-gray-500 mb-4">Manually award or deduct points for <strong>{modal.name}</strong>.</p>
            <input
              type="number"
              value={pts}
              onChange={e => setPts(e.target.value)}
              placeholder="Points (e.g. 100 or -50)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 mb-3"
            />
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason (e.g. Compensation for issue)"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setModal(null); setPts(''); setReason(''); }}
                className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">Cancel</button>
              <button onClick={handleAward} disabled={saving || !pts || !reason}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-60"
                style={{ background: '#7C3AED' }}>
                {saving ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
