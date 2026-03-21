'use client';
import { useState, useEffect } from 'react';

type Package = {
  id: string; name: string; priceMonthly: number; priceAnnual: number | null;
  durationDays: number; couponLimitPerPeriod: number; isActive: boolean;
  stripePriceIdMonthly: string | null; paypalPlanId?: string | null; createdAt: string;
  _count?: { subscriptions: number };
};

const emptyForm = { name: '', priceMonthly: '', priceAnnual: '', durationDays: '30', couponLimitPerPeriod: '5', isActive: true, stripePriceIdMonthly: '' };

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [syncing, setSyncing]   = useState(false);
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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

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
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed');
        let msg = 'Package created';
        if (d.stripeConnected) msg += ' · Stripe ✓';
        if (d.paypalConnected) msg += ' · PayPal ✓';
        showToast(msg);
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

  const syncPayPalPlans = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/packages/backfill-paypal', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      showToast(d.message || `PayPal sync complete: ${d.updated} updated`);
      await fetchPackages();
    } catch (e: any) { showToast('PayPal sync error: ' + e.message); }
    finally { setSyncing(false); }
  };

  const missingPayPal = packages.filter(p => !p.paypalPlanId).length;

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Packages & Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage subscription tiers shown to users</p>
        </div>
        <div className="flex items-center gap-2">
          {missingPayPal > 0 && (
            <button onClick={syncPayPalPlans} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-colors">
              {syncing ? (
                <><div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Syncing…</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Sync PayPal Plans ({missingPayPal})</>
              )}
            </button>
          )}
          <button onClick={() => { setShowAdd(true); setForm(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90"
            style={{ background: '#E8395A' }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Package
          </button>
        </div>
      </div>

      {/* PayPal sync notice */}
      {missingPayPal > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 shrink-0"><path strokeLinecap="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <span><strong>{missingPayPal} package{missingPayPal > 1 ? 's are' : ' is'} missing a PayPal plan.</strong> These were created before PayPal was configured. Click <strong>Sync PayPal Plans</strong> to automatically create PayPal billing plans for them.</span>
        </div>
      )}

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

                {/* Payment gateway indicators */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.stripePriceIdMonthly ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 font-medium px-2 py-0.5 rounded-full">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
                      Stripe
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-400 font-medium px-2 py-0.5 rounded-full">No Stripe</span>
                  )}
                  {p.paypalPlanId ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 00-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 00.554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 01.923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>
                      PayPal
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full">No PayPal</span>
                  )}
                </div>
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
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Stripe Price ID (optional — auto-created)</label>
                <input value={form.stripePriceIdMonthly} onChange={e => setForm({ ...form, stripePriceIdMonthly: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] font-mono" placeholder="price_1ABC… (leave blank to auto-create)" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#E8395A]" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to users)</label>
              </div>
              {!editPkg && (
                <p className="text-xs text-gray-400">Stripe and PayPal products/plans will be auto-created when you save, if those gateways are configured.</p>
              )}
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
