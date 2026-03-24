'use client';
import { useState, useEffect, useMemo } from 'react';

interface Amenity { id: string; name: string; icon: string; category: string; isActive: boolean; sortOrder: number; }

const CATEGORIES = ['Services', 'Facilities', 'Dining', 'Recreation', 'Transportation', 'Room Features', 'General'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Services:       { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  Facilities:     { bg: 'bg-teal-50',   text: 'text-teal-700',   dot: 'bg-teal-400' },
  Dining:         { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  Recreation:     { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400' },
  Transportation: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  'Room Features':{ bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  General:        { bg: 'bg-gray-50',   text: 'text-gray-700',   dot: 'bg-gray-400' },
};

const PRESET_AMENITIES = [
  { name: 'Free WiFi',        icon: '📶', category: 'Services' },
  { name: 'Air Conditioning', icon: '❄️', category: 'Room Features' },
  { name: 'Swimming Pool',    icon: '🏊', category: 'Recreation' },
  { name: 'Gym / Fitness',    icon: '💪', category: 'Recreation' },
  { name: 'Spa & Wellness',   icon: '🧖', category: 'Recreation' },
  { name: 'Restaurant',       icon: '🍽️', category: 'Dining' },
  { name: 'Bar / Lounge',     icon: '🍹', category: 'Dining' },
  { name: 'Room Service',     icon: '🛎️', category: 'Services' },
  { name: 'Free Breakfast',   icon: '🍳', category: 'Dining' },
  { name: 'Airport Shuttle',  icon: '🚌', category: 'Transportation' },
  { name: 'Free Parking',     icon: '🅿️', category: 'Transportation' },
  { name: 'Beach Access',     icon: '🏖️', category: 'Facilities' },
  { name: 'Conference Room',  icon: '👔', category: 'Facilities' },
  { name: 'Laundry Service',  icon: '👕', category: 'Services' },
  { name: '24h Reception',    icon: '🕐', category: 'Services' },
  { name: 'Security / CCTV', icon: '🔒', category: 'Facilities' },
  { name: 'Kids Play Area',   icon: '🎮', category: 'Recreation' },
  { name: 'Rooftop Terrace',  icon: '🌇', category: 'Facilities' },
  { name: 'Garden / Outdoor', icon: '🌿', category: 'Facilities' },
  { name: 'EV Charging',      icon: '⚡', category: 'Transportation' },
];

const COMMON_EMOJIS = ['📶','❄️','🏊','💪','🧖','🍽️','🍹','🛎️','🍳','🚌','🅿️','🏖️','👔','👕','🕐','🔒','🎮','🌇','🌿','⚡','🔥','💎','🌊','🎭','🎵','📚','🚿','🛁','🖥️','🏋️','🎾','🎱','☕','🍸','🌺','🛡️','🚗','✈️','🎪','🎨'];

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities]   = useState<Amenity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [seeding, setSeeding]       = useState(false);
  const [toast, setToast]           = useState('');
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [showAdd, setShowAdd]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [editItem, setEditItem]     = useState<Amenity | null>(null);
  const [form, setForm]             = useState({ name: '', icon: '✓', category: 'General' });

  useEffect(() => { fetchAmenities(); }, []);

  const fetchAmenities = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/amenities');
    const d   = await res.json();
    setAmenities(d.amenities || []);
    setLoading(false);
  };

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const filtered = useMemo(() => amenities.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'all' || a.category === catFilter;
    return matchSearch && matchCat;
  }), [amenities, search, catFilter]);

  const byCategory = useMemo(() => {
    return filtered.reduce((acc: Record<string, Amenity[]>, a) => {
      const cat = a.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {});
  }, [filtered]);

  const saveAmenity = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        const res = await fetch('/api/admin/amenities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, name: form.name, icon: form.icon, category: form.category }) });
        if (!res.ok) throw new Error('Failed');
        setAmenities(prev => prev.map(a => a.id === editItem.id ? { ...a, ...form } : a));
        flash('Amenity updated');
      } else {
        const res = await fetch('/api/admin/amenities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        const d = await res.json();
        setAmenities(prev => [...prev, d.amenity]);
        flash('Amenity added');
      }
      setShowAdd(false); setEditItem(null); setForm({ name: '', icon: '✓', category: 'General' });
    } catch (e: any) { flash('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const deleteAmenity = async (id: string) => {
    if (!confirm('Delete this amenity?')) return;
    await fetch('/api/admin/amenities', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setAmenities(prev => prev.filter(a => a.id !== id));
    flash('Deleted');
  };

  const toggleActive = async (a: Amenity) => {
    const res = await fetch('/api/admin/amenities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, isActive: !a.isActive }) });
    if (res.ok) setAmenities(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x));
  };

  const openEdit = (a: Amenity) => { setEditItem(a); setForm({ name: a.name, icon: a.icon, category: a.category }); setShowAdd(true); };

  const seedPresets = async () => {
    setSeeding(true);
    const existing = new Set(amenities.map(a => a.name));
    const toAdd = PRESET_AMENITIES.filter(p => !existing.has(p.name));
    for (const p of toAdd) {
      const res = await fetch('/api/admin/amenities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
      if (res.ok) { const d = await res.json(); setAmenities(prev => [...prev, d.amenity]); }
    }
    flash(`Seeded ${toAdd.length} preset${toAdd.length !== 1 ? 's' : ''}`);
    setSeeding(false);
  };

  const totalActive = amenities.filter(a => a.isActive).length;

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Amenities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{amenities.length} total · {totalActive} active</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seedPresets} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60">
            {seeding ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : '⚡'}
            {seeding ? 'Seeding…' : 'Seed Presets'}
          </button>
          <button onClick={() => { setEditItem(null); setForm({ name: '', icon: '✓', category: 'General' }); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 transition-all"
            style={{ background: '#E8395A' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Amenity
          </button>
        </div>
      </div>

      {/* Category stats */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCatFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${catFilter === 'all' ? 'text-white border-transparent shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          style={catFilter === 'all' ? { background: '#E8395A' } : {}}>
          All ({amenities.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = amenities.filter(a => a.category === cat).length;
          if (count === 0) return null;
          const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;
          return (
            <button key={cat} onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${catFilter === cat ? col.bg + ' ' + col.text + ' border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${col.dot}`} />
              {cat} ({count})
            </button>
          );
        })}
        <div className="ml-auto relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search amenities…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A] bg-white w-44" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8395A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : amenities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="font-bold text-gray-900 mb-1">No amenities yet</h3>
          <p className="text-sm text-gray-400 mb-4">Start with 20 preset amenities</p>
          <button onClick={seedPresets} disabled={seeding} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60" style={{ background: '#E8395A' }}>
            {seeding ? 'Seeding…' : 'Add 20 Presets'}
          </button>
        </div>
      ) : Object.entries(byCategory).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-sm text-gray-400">No results found</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([cat, items]) => {
            const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;
            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Category header */}
                <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${col.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className={`text-sm font-bold ${col.text}`}>{cat}</h3>
                    <span className={`text-xs font-medium ${col.text} opacity-70`}>({items.length})</span>
                  </div>
                  <span className="text-xs text-gray-400">{items.filter(a => a.isActive).length} active</span>
                </div>

                {/* Amenity cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 p-4">
                  {items.map(a => (
                    <div key={a.id} className={`group relative rounded-xl border p-3 flex items-center gap-2.5 transition-all ${a.isActive ? 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white' : 'border-dashed border-gray-200 bg-white opacity-50'}`}>
                      <span className="text-xl flex-shrink-0">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${a.isActive ? 'text-gray-900' : 'text-gray-400'}`}>{a.name}</p>
                        {!a.isActive && <span className="text-[10px] text-gray-400">hidden</span>}
                      </div>

                      {/* Hover actions */}
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(a)} title="Edit"
                          className="w-5 h-5 rounded-md bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-700">
                          <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={() => toggleActive(a)} title={a.isActive ? 'Hide' : 'Show'}
                          className={`w-5 h-5 rounded-md border shadow-sm flex items-center justify-center ${a.isActive ? 'bg-orange-50 border-orange-200 text-orange-500 hover:bg-orange-100' : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'}`}>
                          {a.isActive ? (
                            <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                          ) : (
                            <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          )}
                        </button>
                        <button onClick={() => deleteAmenity(a.id)} title="Delete"
                          className="w-5 h-5 rounded-md bg-red-50 border border-red-200 shadow-sm flex items-center justify-center text-red-400 hover:bg-red-100">
                          <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900">{editItem ? 'Edit Amenity' : 'Add Amenity'}</h3>
              <button onClick={() => { setShowAdd(false); setEditItem(null); }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" placeholder="e.g. Rooftop Bar, Tennis Court" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => {
                    const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS.General;
                    return (
                      <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 ${form.category === cat ? col.bg + ' ' + col.text + ' border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Icon (emoji)</label>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-3xl">{form.icon}</span>
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" placeholder="Paste any emoji…" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm({ ...form, icon: e })}
                      className={`text-lg w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:scale-110 ${form.icon === e ? 'border-[#E8395A] bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowAdd(false); setEditItem(null); }} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={saveAmenity} disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ background: '#E8395A' }}>
                {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Amenity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
