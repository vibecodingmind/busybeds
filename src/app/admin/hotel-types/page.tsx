'use client';
import { useState, useEffect } from 'react';

interface HotelType { id: string; name: string; icon: string; sortOrder: number; isActive: boolean; createdAt: string; }

const PRESETS = [
  { name: 'Hotel',      icon: 'hotel' },      { name: 'Villa',      icon: 'villa' },
  { name: 'Apartment',  icon: 'apartment' },  { name: 'B&B',        icon: 'bnb' },
  { name: 'Lodge',      icon: 'lodge' },      { name: 'Resort',     icon: 'resort' },
  { name: 'Hostel',     icon: 'hostel' },     { name: 'Guesthouse', icon: 'guesthouse' },
  { name: 'Boutique',   icon: 'boutique' },   { name: 'Motel',      icon: 'motel' },
  { name: 'Camping',    icon: 'camping' },    { name: 'Beachfront', icon: 'beach' },
];

const ICON_OPTIONS = ['hotel','villa','apartment','bnb','lodge','resort','hostel','guesthouse','boutique','motel','camping','beach'];

function TypeIcon({ icon, size = 20, color = 'currentColor' }: { icon: string; size?: number; color?: string }) {
  const s = size; const sw = 1.8;
  const p = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'hotel':      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M9 15h6"/></svg>;
    case 'villa':      return <svg {...p}><path d="M3 12L12 4l9 8"/><rect x="5" y="12" width="14" height="9"/><rect x="9" y="16" width="3" height="5"/><rect x="14" y="14" width="3" height="3"/></svg>;
    case 'apartment':  return <svg {...p}><rect x="2" y="3" width="12" height="19"/><path d="M14 8h6v14H14"/><path d="M6 8v1M6 12v1M6 16v1M10 8v1M10 12v1M10 16v1M17 12v1M17 16v1"/></svg>;
    case 'bnb':        return <svg {...p}><path d="M2 20v-8l10-8 10 8v8"/><path d="M2 20h20"/><rect x="7" y="14" width="4" height="6"/><path d="M15 10h4v4h-4z"/></svg>;
    case 'lodge':      return <svg {...p}><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21V12h6v9"/><path d="M2 10l10-7 10 7"/></svg>;
    case 'resort':     return <svg {...p}><path d="M9 2.2A7 7 0 0 1 19 9c0 3.5-2 5.5-5 7H10c-3-1.5-5-3.5-5-7a7 7 0 0 1 4-6.3"/><path d="M12 2v7"/><path d="M2 22h20"/><path d="M5 22c0-3 3-5 7-5s7 2 7 5"/></svg>;
    case 'hostel':     return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M7 4v6M17 4v6M7 14h4M7 17h4M13 14h4M13 17h4"/></svg>;
    case 'guesthouse': return <svg {...p}><path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18"/><path d="M10 21v-7h4v7"/><path d="M2 8l10-6 10 6"/><circle cx="12" cy="11" r="1.5"/></svg>;
    case 'boutique':   return <svg {...p}><path d="M3 22V9l9-6 9 6v13"/><path d="M3 22h18"/><path d="M9 22v-6h6v6"/><path d="M12 3l1.5 3h3L14 8l1 3-3-2-3 2 1-3-2.5-2h3z"/></svg>;
    case 'motel':      return <svg {...p}><rect x="2" y="6" width="20" height="13" rx="1"/><path d="M2 10h20"/><path d="M6 6V4m4 2V4m4 2V4m4 2V4"/><path d="M5 14h2M9 14h2M13 14h2M17 14h2"/></svg>;
    case 'camping':    return <svg {...p}><path d="M12 2L2 20h20L12 2z"/><path d="M12 2v18"/><path d="M2 20h20"/><circle cx="12" cy="10" r="2"/></svg>;
    case 'beach':      return <svg {...p}><path d="M12 2C8 2 4 5 4 9c0 2 .8 3.7 2 5l6 8 6-8c1.2-1.3 2-3 2-5 0-4-4-7-8-7z"/><circle cx="12" cy="9" r="2.5"/><path d="M2 22h20"/></svg>;
    default:           return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>;
  }
}

export default function AdminHotelTypesPage() {
  const [types, setTypes]   = useState<HotelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast]     = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('hotel');
  const [editId, setEditId]   = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/hotel-types');
    const data = await res.json();
    setTypes(data.types || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const addType = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/hotel-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), icon: newIcon, sortOrder: types.length }) });
    if (res.ok) { setNewName(''); setNewIcon('hotel'); setShowAdd(false); flash('Type added!'); load(); }
    else { flash((await res.json()).error || 'Error'); }
    setSaving(false);
  };

  const deleteType = async (id: string) => {
    if (!confirm('Delete this hotel type?')) return;
    await fetch('/api/admin/hotel-types', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    flash('Deleted'); load();
  };

  const toggleActive = async (t: HotelType) => {
    await fetch('/api/admin/hotel-types', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, isActive: !t.isActive }) });
    setTypes(prev => prev.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x));
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    await fetch('/api/admin/hotel-types', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, name: editName.trim(), icon: editIcon }) });
    setEditId(null); flash('Updated!'); load(); setSaving(false);
  };

  const seedPresets = async () => {
    setSeeding(true);
    let added = 0;
    for (let i = 0; i < PRESETS.length; i++) {
      const p = PRESETS[i];
      if (!types.find(t => t.name.toLowerCase() === p.name.toLowerCase())) {
        await fetch('/api/admin/hotel-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name, icon: p.icon, sortOrder: i }) });
        added++;
      }
    }
    flash(`Seeded ${added} preset type${added !== 1 ? 's' : ''}`);
    load(); setSeeding(false);
  };

  const moveSortOrder = async (id: string, dir: 'up' | 'down') => {
    const idx = types.findIndex(t => t.id === id);
    if (idx < 0) return;
    const other = dir === 'up' ? types[idx - 1] : types[idx + 1];
    if (!other) return;
    await Promise.all([
      fetch('/api/admin/hotel-types', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: types[idx].id, sortOrder: other.sortOrder }) }),
      fetch('/api/admin/hotel-types', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: other.id, sortOrder: types[idx].sortOrder }) }),
    ]);
    load();
  };

  const activeTypes   = types.filter(t => t.isActive);
  const inactiveTypes = types.filter(t => !t.isActive);

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hotel Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control categories shown in the homepage filter bar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seedPresets} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60">
            {seeding ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : '⚡'}
            {seeding ? 'Seeding…' : 'Seed Presets'}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 transition-all"
            style={{ background: '#E8395A' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Type
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Types', value: types.length, color: 'text-gray-900' },
          { label: 'Active',      value: activeTypes.length, color: 'text-green-700' },
          { label: 'Hidden',      value: inactiveTypes.length, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
            <span className="text-sm text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Homepage preview */}
      {activeTypes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Homepage Filter Preview</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {activeTypes.map(t => (
              <div key={t.id} className="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-900 flex-shrink-0 min-w-[72px] bg-gray-50">
                <TypeIcon icon={t.icon} size={22} />
                <span className="text-xs font-bold text-gray-900 whitespace-nowrap">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Types */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Active Types <span className="text-sm font-normal text-gray-400">({activeTypes.length})</span></h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#E8395A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-3 text-sm">No active types yet.</p>
            <button onClick={seedPresets} className="text-sm font-semibold" style={{ color: '#E8395A' }}>Seed 12 presets →</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 p-5">
            {activeTypes.map((t, idx) => (
              <div key={t.id} className="group relative bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-[#E8395A]/30 hover:bg-red-50/30 transition-all">
                {/* Sort arrows */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveSortOrder(t.id, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button onClick={() => moveSortOrder(t.id, 'down')} disabled={idx === activeTypes.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>

                {editId === t.id ? (
                  <div className="w-full space-y-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E8395A]" />
                    <select value={editIcon} onChange={e => setEditIcon(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                      {ICON_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <button onClick={saveEdit} disabled={saving} className="flex-1 py-1 text-xs font-bold text-white rounded-lg" style={{ background: '#E8395A' }}>Save</button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg">✕</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                      <TypeIcon icon={t.icon} size={24} color="#1A3C5E" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 text-center leading-tight">{t.name}</span>

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditId(t.id); setEditName(t.name); setEditIcon(t.icon); }}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 shadow-sm">
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </div>
                    <div className="flex gap-1.5 w-full">
                      <button onClick={() => toggleActive(t)}
                        className="flex-1 py-1 text-[10px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                        Hide
                      </button>
                      <button onClick={() => deleteType(t.id)}
                        className="w-6 py-1 text-[10px] font-semibold text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center">
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Types */}
      {inactiveTypes.length > 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-dashed border-gray-200">
            <h2 className="font-semibold text-sm text-gray-400">Hidden Types <span className="font-normal">({inactiveTypes.length})</span></h2>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {inactiveTypes.map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-3 py-2">
                <TypeIcon icon={t.icon} size={16} color="#9CA3AF" />
                <span className="text-xs text-gray-400 font-medium">{t.name}</span>
                <button onClick={() => toggleActive(t)} className="text-xs text-green-600 font-semibold hover:underline ml-1">Show</button>
                <button onClick={() => deleteType(t.id)} className="text-xs text-red-400 hover:text-red-600 ml-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Add Hotel Type</h3>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addType()}
                  placeholder="e.g. Treehouse, Riad…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Icon Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {ICON_OPTIONS.map(k => (
                    <button key={k} onClick={() => setNewIcon(k)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${newIcon === k ? 'border-[#E8395A] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <TypeIcon icon={k} size={18} color={newIcon === k ? '#E8395A' : '#6B7280'} />
                      <span className="text-[9px] text-gray-500 capitalize">{k}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={addType} disabled={saving || !newName.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ background: '#E8395A' }}>
                {saving ? 'Adding…' : 'Add Type'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
