'use client';

import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  hotelId: string;
  status: string;
  billingCycle: string;
  startsAt: string;
  currentPeriodEnd: string;
  isComped: boolean;
  compedReason: string | null;
  flashDealsUsed: number;
  promoEmailsUsed: number;
  tier: {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    flashDealsPerMonth: number;
    promotionalEmails: number;
  };
  hotel: {
    id: string;
    name: string;
    city: string;
    country: string;
    coverImage: string | null;
  };
}

interface Tier {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-amber-100 text-amber-700',
  canceled: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-700',
};

export default function HotelSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [granting, setGranting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, tierRes] = await Promise.all([
        fetch(`/api/admin/hotel-subscriptions?status=${filter}&search=${search}`),
        fetch('/api/admin/hotel-subscription-tiers'),
      ]);
      const subData = await subRes.json();
      const tierData = await tierRes.json();
      setSubscriptions(subData.subscriptions || []);
      setTiers(tierData.tiers || []);
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      const res = await fetch(`/api/admin/hotel-subscriptions?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (e) {
      console.error('Failed to cancel', e);
    }
  };

  const handleGrant = async (data: { hotelId: string; tierId: string; durationMonths: number; compedReason: string }) => {
    setGranting(true);
    try {
      const res = await fetch('/api/admin/hotel-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: data.hotelId,
          tierId: data.tierId,
          durationMonths: data.durationMonths,
          isComped: true,
          compedReason: data.compedReason,
          billingCycle: 'monthly',
        }),
      });
      if (res.ok) {
        loadData();
        setShowGrantModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to grant subscription');
      }
    } catch (e) {
      console.error('Failed to grant', e);
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage hotel premium subscriptions and grant complimentary access</p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
          style={{ background: '#E8395A' }}
        >
          + Grant Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex gap-2">
          {['all', 'active', 'past_due', 'canceled', 'expired'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search hotels..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadData()}
          className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm flex-1 max-w-xs focus:outline-none focus:border-gray-400"
        />
      </div>

      {loading && <div className="text-gray-400 text-sm">Loading…</div>}

      {!loading && subscriptions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No subscriptions found.
        </div>
      )}

      <div className="space-y-3">
        {subscriptions.map(sub => (
          <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {sub.hotel.coverImage && (
                  <img 
                    src={sub.hotel.coverImage} 
                    alt={sub.hotel.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{sub.hotel.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-600'}`}>
                      {sub.status.replace('_', ' ')}
                    </span>
                    {sub.isComped && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Complimentary</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{sub.hotel.city}, {sub.hotel.country}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold" style={{ color: '#1A3C5E' }}>{sub.tier.displayName}</div>
                <div className="text-xs text-gray-400">
                  {sub.tier.priceMonthly > 0 ? `$${sub.tier.priceMonthly}/mo` : 'Free'}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-sm">
              <div className="flex gap-6 text-gray-500">
                <div>
                  <span className="text-xs block text-gray-400">Period End</span>
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-xs block text-gray-400">Flash Deals</span>
                  {sub.flashDealsUsed}/{sub.tier.flashDealsPerMonth >= 999 ? '∞' : sub.tier.flashDealsPerMonth}
                </div>
                <div>
                  <span className="text-xs block text-gray-400">Promo Emails</span>
                  {sub.promoEmailsUsed}/{sub.tier.promotionalEmails >= 999 ? '∞' : sub.tier.promotionalEmails}
                </div>
                {sub.compedReason && (
                  <div>
                    <span className="text-xs block text-gray-400">Reason</span>
                    {sub.compedReason}
                  </div>
                )}
              </div>
              {sub.status === 'active' && (
                <button
                  onClick={() => handleCancel(sub.id)}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grant Modal */}
      {showGrantModal && (
        <GrantSubscriptionModal
          tiers={tiers}
          onGrant={handleGrant}
          onClose={() => setShowGrantModal(false)}
          saving={granting}
        />
      )}
    </div>
  );
}

function GrantSubscriptionModal({ tiers, onGrant, onClose, saving }: {
  tiers: Tier[];
  onGrant: (data: { hotelId: string; tierId: string; durationMonths: number; compedReason: string }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [hotelId, setHotelId] = useState('');
  const [tierId, setTierId] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [compedReason, setCompedReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [hotels, setHotels] = useState<{ id: string; name: string; city: string }[]>([]);

  const searchHotels = async (q: string) => {
    if (!q || q.length < 2) { setHotels([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/hotels?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setHotels(data.hotels || []);
    } catch (e) {
      console.error('Failed to search hotels', e);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !tierId) return;
    onGrant({ hotelId, tierId, durationMonths, compedReason });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Grant Complimentary Subscription</h2>
            <p className="text-sm text-gray-500 mt-1">Give a hotel free premium access</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Hotel Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Hotel</label>
              <input
                type="text"
                placeholder="Search hotels..."
                onChange={e => searchHotels(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
              />
              {hotels.length > 0 && (
                <div className="mt-2 border border-gray-100 rounded-xl max-h-40 overflow-y-auto">
                  {hotels.map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => { setHotelId(h.id); setHotels([]); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {h.name} <span className="text-gray-400">– {h.city}</span>
                    </button>
                  ))}
                </div>
              )}
              {hotelId && (
                <div className="mt-2 text-sm text-green-600">✓ Hotel selected</div>
              )}
            </div>

            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
              <select
                value={tierId}
                onChange={e => setTierId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                required
              >
                <option value="">Select a tier...</option>
                {tiers.filter(t => t.priceMonthly > 0).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.displayName} – ${t.priceMonthly}/mo
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
              <select
                value={durationMonths}
                onChange={e => setDurationMonths(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                <option value={1}>1 month</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input
                type="text"
                placeholder="e.g., Partnership agreement"
                value={compedReason}
                onChange={e => setCompedReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
              />
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
              disabled={saving || !hotelId || !tierId}
              className="px-6 py-2 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50"
              style={{ background: '#E8395A' }}
            >
              {saving ? 'Granting…' : 'Grant Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
