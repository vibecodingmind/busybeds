'use client';
import { useState, useEffect } from 'react';

type Package = {
  id: string; name: string; priceMonthly: number; priceAnnual: number | null;
  durationDays: number; couponLimitPerPeriod: number; isActive: boolean;
  stripePriceIdMonthly: string | null; createdAt: string;
  _count?: { subscriptions: number };
};

const emptyForm = { name: '', priceMonthly: '', priceAnnual: '', durationDays: '30', couponLimitPerPeriod: '5', isActive: true, stripePriceIdMonthly: '' };

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editPkg, setEditPkg]   = useState<Package | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState<typeof emptyForm>(emptyForm);
  const [toast, setToast]       = useState('');

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/packages');
      const d = await res.json();
      setPackages(d.packages || []);
    } finally { setLoading(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const openEdit = (p: Package) => {
    setEditPkg(p);
    setForm({ name: p.name, priceMonthly: String(p.priceMonthly), priceAnnual: p.priceAnnual ? String(p.priceAnnual) : '', durationDays: String(p.durationDays), couponLimitPerPeriod: String(p.couponLimitPerPeriod), isActive: p.isActive, stripePriceIdMonthly: p.stripePriceIdMonthly || '' });
  };
  const closeModal = () => { setEditPkg(null); setShowAdd(false); setForm(emptyForm); };

  const savePkg = async () => {
    if (!form.name || !form.priceMonthly) { showToast('Name and price are required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, priceMonthly: Number(form.priceMonthly), priceAnnual: form.priceAnnual ? Number(form.priceAnnual) : null, durationDays: Number(form.durationDays), couponLimitPerPeriod: Number(form.couponLimitPerPeriod), isActive: form.isActive, stripePriceIdMonthly: form.stripePriceIdMonthly || null };
      if (editPkg) {
        const res = await fetch(`/api/admin/packages/${editPkg.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        showToast('Package updated');
      } else {
        const res = await fetch('/api/admin/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        showToast('Package created');
      }
      await fetchPackages();
      closeModal();
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const deletePkg = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setPackages(prev => prev.filter(p => p.id !== id));
      showToast('Package deleted');
    } catch (e: any) { showToast('Error: ' + e.message); }
  };

  const toggleActive = async (p: Package) => {
    await fetch(`/api/admin/packages/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !p.isActive }) });
    setPackages(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
    showToast(p.isActive ? 'Package deactivated' : 'Package activated');
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Packages & Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage subscription tiers shown to users</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90"
          style={{ background: '#E8395A' }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Package
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8395A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border p-6 relative transition-all ${p.isActive ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-70'}`}>
              {!p.isActive && (
                <div className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-500 font-semibold px-2.5 py-1 rounded-full">Inactive</div>
              )}
              {p.isActive && (
                <div className="absolute top-3 right-3 text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full">Active</div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-gray-900">{p.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold" style={{ color: '#E8395A' }}>${p.priceMonthly}</span>
                  <span className="text-sm text-gray-400">/mo</span>
                  {p.priceAnnual && <span className="text-xs text-gray-400 ml-2">${p.priceAnnual}/yr</span>}
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#E8395A" strokeWidth={2}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>{p.couponLimitPerPeriod} coupons per period</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#E8395A" strokeWidth={2}><path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>{p.durationDays}-day billing cycle</span>
                </div>
                {p._count && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                    <span>{p._count.subscriptions} active subscribers</span>
                  </div>
                )}
                {p.stripePriceIdMonthly && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-lg truncate">
                    <span>Stripe: {p.stripePriceIdMonthly}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="flex-1 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Edit</button>
                <button onClick={() => toggleActive(p)} className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-colors ${p.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                  {p.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => deletePkg(p.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/><path strokeLinecap="round" d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editPkg) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900">{editPkg ? 'Edit Package' : 'New Package'}</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Package Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" placeholder="e.g. Pro, Basic, Enterprise" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Monthly Price ($)</label>
                  <input type="number" min="0" step="0.01" value={form.priceMonthly} onChange={e => setForm({ ...form, priceMonthly: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" placeholder="9.99" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Annual Price ($)</label>
                  <input type="number" min="0" step="0.01" value={form.priceAnnual} onChange={e => setForm({ ...form, priceAnnual: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" placeholder="99.99 (optional)" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Duration (days)</label>
                  <input type="number" min="1" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Coupon Limit / Period</label>
                  <input type="number" min="1" value={form.couponLimitPerPeriod} onChange={e => setForm({ ...form, couponLimitPerPeriod: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Stripe Price ID (optional)</label>
                <input value={form.stripePriceIdMonthly} onChange={e => setForm({ ...form, stripePriceIdMonthly: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] font-mono" placeholder="price_1ABC..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#E8395A]" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to users)</label>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeModal} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={savePkg} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                style={{ background: '#E8395A' }}>
                {saving ? 'Saving…' : editPkg ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
