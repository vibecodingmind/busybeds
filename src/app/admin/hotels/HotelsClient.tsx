'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/locations';

type Hotel = {
  id: string; name: string; slug: string; city: string; country: string;
  starRating: number; status: string; isFeatured: boolean; discountPercent: number;
  coverImage: string | null; createdAt: string; category: string;
  latitude: number | null; longitude: number | null;
  _count: { coupons: number; roomTypes: number };
};

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending:  'bg-yellow-50 text-yellow-700',
};

export default function HotelsClient({ initialHotels }: { initialHotels: Hotel[] }) {
  const [hotels, setHotels]   = useState<Hotel[]>(initialHotels);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editHotel, setEditHotel]       = useState<Hotel | null>(null);
  const [loading, setLoading]           = useState(false);
  const [toast, setToast]               = useState('');

  // Edit form state
  const [form, setForm] = useState({
    name: '', city: '', country: 'Tanzania',
    starRating: 3, discountPercent: 15,
    status: 'active', isFeatured: false,
    coverImage: '', category: 'Hotel',
    latitude: '', longitude: '',
  });

  const cities = CITIES_BY_COUNTRY[form.country] || [];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = useMemo(() => hotels.filter(h => {
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase()) || h.country.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchSearch && matchStatus;
  }), [hotels, search, statusFilter]);

  const openEdit = (h: Hotel) => {
    setEditHotel(h);
    setForm({
      name: h.name, city: h.city, country: h.country,
      starRating: h.starRating, discountPercent: h.discountPercent,
      status: h.status, isFeatured: h.isFeatured,
      coverImage: h.coverImage || '', category: h.category,
      latitude:  h.latitude  != null ? String(h.latitude)  : '',
      longitude: h.longitude != null ? String(h.longitude) : '',
    });
  };

  const handleCountryChange = (country: string) => {
    setForm(prev => ({ ...prev, country, city: '' }));
  };

  const closeModal = () => { setEditHotel(null); };

  const saveHotel = async () => {
    if (!form.name || !form.city || !form.country) { showToast('Name, city, and country are required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      const res = await fetch(`/api/admin/hotels/${editHotel!.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      setHotels(prev => prev.map(h => h.id === editHotel!.id ? { ...h, ...payload } : h));
      showToast('Hotel updated');
      closeModal();
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  const deleteHotel = async (id: string) => {
    if (!confirm('Delete this hotel? All coupons will also be removed.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/hotels/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      setHotels(prev => prev.filter(h => h.id !== id));
      showToast('Hotel deleted');
    } catch (e: any) { showToast('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (h: Hotel) => {
    const newStatus = h.status === 'active' ? 'inactive' : 'active';
    try {
      await fetch(`/api/admin/hotels/${h.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setHotels(prev => prev.map(x => x.id === h.id ? { ...x, status: newStatus } : x));
      showToast(`Hotel ${newStatus}`);
    } catch { showToast('Failed'); }
  };

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hotels</h1>
          <p className="text-sm text-gray-500 mt-0.5">{hotels.length} properties</p>
        </div>
        <Link href="/admin/hotels/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
          style={{ background: '#E8395A' }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Hotel
        </Link>
      </div>

      {/* Stats mini row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active',   value: hotels.filter(h => h.status === 'active').length,   color: 'text-green-700 bg-green-50' },
          { label: 'Featured', value: hotels.filter(h => h.isFeatured).length,            color: 'text-purple-700 bg-purple-50' },
          { label: 'Inactive', value: hotels.filter(h => h.status !== 'active').length,   color: 'text-gray-600 bg-gray-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <span className={`text-2xl font-extrabold ${s.color.split(' ')[0]}`}>{s.value}</span>
            <span className="text-sm text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-2xl border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search hotels, city, country…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E8395A]">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
        <span className="flex items-center text-xs text-gray-400">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Hotel</th>
                <th className="px-5 py-3 font-semibold">Stars</th>
                <th className="px-5 py-3 font-semibold">Discount</th>
                <th className="px-5 py-3 font-semibold">Coupons</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(h => (
                <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {h.coverImage ? (
                        <img src={h.coverImage} alt="" className="w-10 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0D9488" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate max-w-[180px]">{h.name}</p>
                        <p className="text-xs text-gray-400">{h.city}, {h.country}</p>
                      </div>
                      {h.isFeatured && <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Featured</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">{'⭐'.repeat(h.starRating)}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{h.discountPercent}% off</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{h._count.coupons}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-500'}`}>{h.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/hotels/${h.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" title="View live page">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </Link>
                      <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Edit">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={() => toggleStatus(h)} className={`p-1.5 rounded-lg transition-colors ${h.status === 'active' ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-green-50 text-green-600'}`} title={h.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/>{h.status === 'active' ? <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/> : <polyline points="9 11 12 14 22 4"/>}</svg>
                      </button>
                      <button onClick={() => deleteHotel(h.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Delete">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/><path strokeLinecap="round" d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🏨</div>
              <p className="text-sm">No hotels found</p>
              <Link href="/admin/hotels/new" className="mt-3 inline-block text-sm font-semibold text-[#E8395A] hover:underline">
                + Add your first hotel
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal (country+city dropdowns) */}
      {editHotel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900">Edit Hotel</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editHotel.name}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">

              {/* Hotel Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Hotel Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                  placeholder="e.g. Grand Hyatt Nairobi" />
              </div>

              {/* Country (dropdown) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Country</label>
                <select value={form.country} onChange={e => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E8395A]">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* City — dropdown if country has presets, else text input */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  City / Region
                </label>
                {cities.length > 0 ? (
                  <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E8395A]">
                    <option value="">Select city…</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Enter city name"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
                )}
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Cover Image URL</label>
                <input value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                  placeholder="https://…" />
                {form.coverImage && (
                  <img src={form.coverImage} alt="" className="mt-2 h-20 w-full object-cover rounded-xl border border-gray-100"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Star Rating</label>
                  <select value={form.starRating} onChange={e => setForm({ ...form, starRating: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E8395A]">
                    {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} Star{s>1?'s':''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Discount %</label>
                  <input type="number" min={1} max={100} value={form.discountPercent}
                    onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E8395A]">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#E8395A]" />
                    <span className="text-sm font-medium text-gray-700">Featured hotel</span>
                  </label>
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  📍 GPS Coordinates <span className="font-normal normal-case text-gray-400">(for Near Me feature)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number" step="any" min="-90" max="90"
                    value={form.latitude}
                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                    placeholder="Latitude e.g. -3.3869"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                  />
                  <input
                    type="number" step="any" min="-180" max="180"
                    value={form.longitude}
                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                    placeholder="Longitude e.g. 36.6823"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Find coordinates on{' '}
                  <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="underline hover:text-gray-700">Google Maps</a>
                  {' '}→ right-click on the hotel location → copy lat, lng
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeModal} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={saveHotel} disabled={loading}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                style={{ background: '#E8395A' }}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
