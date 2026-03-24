'use client';
import { useState, useEffect } from 'react';

interface Hotel { id: string; name: string; slug: string }
interface FlashDeal {
  id: string; hotelId: string; title: string; discountPercent: number;
  startsAt: string; endsAt: string; isActive: boolean;
  hotel: { name: string; slug: string };
}

export default function FlashDealsPage() {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ hotelId: '', title: '', discountPercent: 20, startsAt: '', endsAt: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [d, h] = await Promise.all([
      fetch('/api/admin/flash-deals').then(r => r.json()),
      fetch('/api/hotels?limit=200').then(r => r.json()),
    ]);
    setDeals(d.deals || []);
    setHotels((h.hotels || []).map((ho: any) => ({ id: ho.id, name: ho.name, slug: ho.slug })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    const res = await fetch('/api/admin/flash-deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed'); setCreating(false); return; }
    setForm({ hotelId: '', title: '', discountPercent: 20, startsAt: '', endsAt: '' });
    setCreating(false);
    load();
  };

  const toggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/flash-deals?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this flash deal?')) return;
    await fetch(`/api/admin/flash-deals?id=${id}`, { method: 'DELETE' });
    load();
  };

  const now = new Date();
  const isLive = (d: FlashDeal) => d.isActive && new Date(d.startsAt) <= now && new Date(d.endsAt) > now;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">⚡ Flash Deals</h1>

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Create Flash Deal</h2>
        <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
            <select required value={form.hotelId} onChange={e => setForm(f => ({ ...f, hotelId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]">
              <option value="">Select hotel…</option>
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Title</label>
            <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Weekend Flash 30% Off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
            <input required type="number" min={1} max={90} value={form.discountPercent}
              onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
          <div className="hidden sm:block" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
            <input required type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
            <input required type="datetime-local" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
          {error && <p className="text-red-600 text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={creating}
              className="bg-[#0E7C7B] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a6160] disabled:opacity-50 transition-colors">
              {creating ? 'Creating…' : '+ Create Flash Deal'}
            </button>
          </div>
        </form>
      </div>

      {/* Deals table */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : deals.length === 0 ? (
        <p className="text-gray-400 text-sm">No flash deals yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Hotel</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Window</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{deal.hotel.name}</td>
                  <td className="px-4 py-3">{deal.title}</td>
                  <td className="px-4 py-3">
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-xs">
                      {deal.discountPercent}% off
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(deal.startsAt).toLocaleString()} →<br />
                    {new Date(deal.endsAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {isLive(deal) ? (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Live</span>
                    ) : deal.isActive ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">Scheduled</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => toggle(deal.id, deal.isActive)}
                      className="text-xs text-blue-600 hover:underline">
                      {deal.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => del(deal.id)}
                      className="text-xs text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
