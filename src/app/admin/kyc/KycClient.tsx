'use client';
import { useState, useMemo } from 'react';

type Application = {
  id: string; kycStatus: string; kycSubmittedAt: string; kycReviewedAt: string | null; kycRejectionReason: string | null;
  user: { fullName: string; email: string; avatar: string | null; createdAt: string };
  hotel: { name: string; city: string; country: string; starRating: number; coverImage: string | null };
};

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-orange-50 text-orange-600 border-orange-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

export default function KycClient({ initialApplications }: { initialApplications: Application[] }) {
  const [apps, setApps]       = useState<Application[]>(initialApplications);
  const [filter, setFilter]   = useState('pending');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast]     = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: string; hotelName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = useMemo(() => apps.filter(a => {
    const matchFilter = filter === 'all' || a.kycStatus === filter;
    const matchSearch = !search || a.user.fullName.toLowerCase().includes(search.toLowerCase()) || a.hotel.name.toLowerCase().includes(search.toLowerCase()) || a.user.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }), [apps, filter, search]);

  const act = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setLoading(id);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error('Failed');
      setApps(prev => prev.map(a => a.id === id ? { ...a, kycStatus: action === 'approve' ? 'approved' : 'rejected', kycReviewedAt: new Date().toISOString(), kycRejectionReason: reason || null } : a));
      showToast(`Application ${action}d`);
      setRejectModal(null);
      setRejectReason('');
    } catch { showToast('Action failed'); }
    finally { setLoading(null); }
  };

  const counts = { all: apps.length, pending: apps.filter(a => a.kycStatus === 'pending').length, approved: apps.filter(a => a.kycStatus === 'approved').length, rejected: apps.filter(a => a.kycStatus === 'rejected').length };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Claims & KYC</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review property management claims from hotel representatives</p>
      </div>

      {/* Stat chips */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === s.key ? 'text-white border-transparent shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={filter === s.key ? { background: '#E8395A', borderColor: '#E8395A' } : {}}>
            {s.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === s.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts[s.key as keyof typeof counts]}</span>
          </button>
        ))}
        <div className="ml-auto relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] bg-white w-52" />
        </div>
      </div>

      {/* Applications list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={1.5}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-gray-400 font-medium">No {filter !== 'all' ? filter : ''} applications</p>
          </div>
        )}
        {filtered.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl border p-5 transition-all ${a.kycStatus === 'pending' ? 'border-orange-100' : 'border-gray-100'}`}>
            <div className="flex items-start gap-4">
              {/* Hotel image */}
              {a.hotel.coverImage ? (
                <img src={a.hotel.coverImage} alt="" className="w-16 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-14 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0D9488" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{a.hotel.name}</h3>
                    <p className="text-sm text-gray-500">{a.hotel.city}, {a.hotel.country} · {'⭐'.repeat(a.hotel.starRating)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex-shrink-0 ${STATUS_COLORS[a.kycStatus]}`}>
                    {a.kycStatus}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2.5">
                  {a.user.avatar ? (
                    <img src={a.user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1A3C5E, #2563EB)' }}>
                      {a.user.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{a.user.fullName}</span>
                    <span className="text-xs text-gray-400 ml-2">{a.user.email}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">
                    Submitted {a.kycSubmittedAt ? new Date(a.kycSubmittedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {a.kycRejectionReason && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                    Rejection reason: {a.kycRejectionReason}
                  </div>
                )}
              </div>

              {/* Actions */}
              {a.kycStatus === 'pending' && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => act(a.id, 'approve')}
                    disabled={loading === a.id}
                    className="px-4 py-2 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors disabled:opacity-60">
                    {loading === a.id ? '…' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: a.id, hotelName: a.hotel.name })}
                    disabled={loading === a.id}
                    className="px-4 py-2 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors disabled:opacity-60">
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">Reject Application</h3>
            <p className="text-sm text-gray-500 mb-4">Rejecting claim for <strong>{rejectModal.hotelName}</strong>. Optionally provide a reason.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="Reason for rejection (optional)…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl">Cancel</button>
              <button onClick={() => act(rejectModal.id, 'reject', rejectReason)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
