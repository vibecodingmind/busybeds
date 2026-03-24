'use client';

import { useState, useEffect } from 'react';

interface Tier {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceAnnual: number | null;
  isActive: boolean;
  sortOrder: number;
  featuredOnHomepage: boolean;
  featuredPriority: number;
  searchBoost: number;
  flashDealsPerMonth: number;
  showVerifiedBadge: boolean;
  promotionalEmails: number;
  customBookingLink: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  analyticsLevel: string;
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  _count?: { subscriptions: number };
}

const FEATURE_OPTIONS = [
  { key: 'featuredOnHomepage', label: 'Featured on Homepage' },
  { key: 'showVerifiedBadge', label: 'Verified Badge' },
  { key: 'customBookingLink', label: 'Custom Booking Link' },
  { key: 'prioritySupport', label: 'Priority Support' },
  { key: 'apiAccess', label: 'API Access' },
];

export default function HotelSubscriptionTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hotel-subscription-tiers');
      const data = await res.json();
      setTiers(data.tiers || []);
    } catch (e) {
      console.error('Failed to load tiers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const handleSave = async (tier: Partial<Tier>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hotel-subscription-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tier),
      });
      if (res.ok) {
        await loadTiers();
        setShowForm(false);
        setEditingTier(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save tier');
      }
    } catch (e) {
      console.error('Failed to save tier', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;
    try {
      const res = await fetch(`/api/admin/hotel-subscription-tiers?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadTiers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete tier');
      }
    } catch (e) {
      console.error('Failed to delete tier', e);
    }
  };

  const emptyTier: Partial<Tier> = {
    name: '',
    displayName: '',
    priceMonthly: 0,
    priceAnnual: null,
    isActive: true,
    sortOrder: 0,
    featuredOnHomepage: false,
    featuredPriority: 0,
    searchBoost: 0,
    flashDealsPerMonth: 0,
    showVerifiedBadge: false,
    promotionalEmails: 0,
    customBookingLink: false,
    prioritySupport: false,
    apiAccess: false,
    analyticsLevel: 'basic',
    stripePriceIdMonthly: null,
    stripePriceIdAnnual: null,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel Subscription Tiers</h1>
          <p className="text-gray-500 text-sm mt-1">Configure pricing and features for hotel premium subscriptions</p>
        </div>
        <button
          onClick={() => { setEditingTier(emptyTier as Tier); setShowForm(true); }}
          className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
          style={{ background: '#E8395A' }}
        >
          + Add Tier
        </button>
      </div>

      {loading && <div className="text-gray-400 text-sm">Loading…</div>}

      <div className="grid gap-4">
        {tiers.map((tier) => (
          <div key={tier.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: tier.isActive ? '#1A3C5E' : '#9CA3AF' }}
                >
                  {tier.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{tier.displayName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {tier._count && (
                      <span className="text-xs text-gray-400">{tier._count.subscriptions} subscribers</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    ${tier.priceMonthly}/mo {tier.priceAnnual && `· $${tier.priceAnnual}/yr`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingTier(tier); setShowForm(true); }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
                {!tier._count?.subscriptions && (
                  <button
                    onClick={() => handleDelete(tier.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Features grid */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Homepage Featured</div>
                <div className="font-semibold text-gray-900 mt-0.5">
                  {tier.featuredOnHomepage ? `Yes (Priority ${tier.featuredPriority})` : 'No'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Search Boost</div>
                <div className="font-semibold text-gray-900 mt-0.5">+{tier.searchBoost}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Flash Deals/Month</div>
                <div className="font-semibold text-gray-900 mt-0.5">
                  {tier.flashDealsPerMonth >= 999 ? 'Unlimited' : tier.flashDealsPerMonth}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">Promo Emails/Month</div>
                <div className="font-semibold text-gray-900 mt-0.5">
                  {tier.promotionalEmails >= 999 ? 'Unlimited' : tier.promotionalEmails || 'None'}
                </div>
              </div>
            </div>

            {/* Feature badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map(opt => (
                tier[opt.key as keyof Tier] ? (
                  <span key={opt.key} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {opt.label}
                  </span>
                ) : null
              ))}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {tier.analyticsLevel.charAt(0).toUpperCase() + tier.analyticsLevel.slice(1)} Analytics
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {showForm && editingTier && (
        <TierFormModal
          tier={editingTier}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTier(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}

function TierFormModal({ tier, onSave, onClose, saving }: { 
  tier: Tier; 
  onSave: (t: Partial<Tier>) => void; 
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(tier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {tier.id ? 'Edit Tier' : 'Create New Tier'}
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., starter"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  placeholder="e.g., Starter"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  value={form.priceMonthly}
                  onChange={e => setForm({ ...form, priceMonthly: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price ($)</label>
                <input
                  type="number"
                  value={form.priceAnnual || ''}
                  onChange={e => setForm({ ...form, priceAnnual: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  min="0"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active (available for purchase)</label>
            </div>

            {/* Feature Settings */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-gray-900 mb-3">Homepage & Visibility</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featuredOnHomepage"
                    checked={form.featuredOnHomepage}
                    onChange={e => setForm({ ...form, featuredOnHomepage: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="featuredOnHomepage" className="text-sm text-gray-700">Featured on Homepage</label>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Featured Priority</label>
                  <input
                    type="number"
                    value={form.featuredPriority}
                    onChange={e => setForm({ ...form, featuredPriority: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm text-gray-700 mb-1">Search Ranking Boost (+%)</label>
                <input
                  type="number"
                  value={form.searchBoost}
                  onChange={e => setForm({ ...form, searchBoost: parseInt(e.target.value) || 0 })}
                  className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Perks & Limits */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-gray-900 mb-3">Perks & Limits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Flash Deals per Month</label>
                  <input
                    type="number"
                    value={form.flashDealsPerMonth}
                    onChange={e => setForm({ ...form, flashDealsPerMonth: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                    min="0"
                    placeholder="999 for unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Promotional Emails per Month</label>
                  <input
                    type="number"
                    value={form.promotionalEmails}
                    onChange={e => setForm({ ...form, promotionalEmails: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                    min="0"
                    placeholder="999 for unlimited"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {FEATURE_OPTIONS.map(opt => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={opt.key}
                      checked={form[opt.key as keyof Tier] as boolean}
                      onChange={e => setForm({ ...form, [opt.key]: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor={opt.key} className="text-sm text-gray-700">{opt.label}</label>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm text-gray-700 mb-1">Analytics Level</label>
                <select
                  value={form.analyticsLevel}
                  onChange={e => setForm({ ...form, analyticsLevel: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="basic">Basic</option>
                  <option value="enhanced">Enhanced</option>
                  <option value="full">Full Suite</option>
                </select>
              </div>
            </div>

            {/* Stripe Integration */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-gray-900 mb-3">Stripe Integration (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Stripe Price ID (Monthly)</label>
                  <input
                    type="text"
                    value={form.stripePriceIdMonthly || ''}
                    onChange={e => setForm({ ...form, stripePriceIdMonthly: e.target.value || null })}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm font-mono"
                    placeholder="price_xxx"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Stripe Price ID (Annual)</label>
                  <input
                    type="text"
                    value={form.stripePriceIdAnnual || ''}
                    onChange={e => setForm({ ...form, stripePriceIdAnnual: e.target.value || null })}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm font-mono"
                    placeholder="price_xxx"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50"
              style={{ background: '#E8395A' }}
            >
              {saving ? 'Saving…' : 'Save Tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
