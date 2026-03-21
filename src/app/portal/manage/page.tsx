'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AffiliateTab from './AffiliateTab';

interface RoomType { id: string; name: string; description: string; pricePerNight: number; maxOccupancy: number; displayOrder: number; }
interface Photo { id: string; url: string; displayOrder: number; isPrimary?: boolean; }
interface AffiliateLink { id: string; platform: string; url: string; isActive: boolean; }
interface Hotel {
  id: string; name: string; city: string; country: string; starRating: number;
  category: string;
  descriptionShort: string; descriptionLong: string; amenities: string[];
  discountPercent: number; couponValidDays: number; websiteUrl?: string;
  coverImage?: string; roomTypes: RoomType[]; affiliateLinks?: AffiliateLink[];
  email?: string; whatsapp?: string; address?: string;
  socialFacebook?: string; socialInstagram?: string; socialTwitter?: string; socialTiktok?: string;
  latitude?: number; longitude?: number;
  isFeatured?: boolean; featuredUntil?: string;
}

type Tab = 'overview' | 'rooms' | 'discount' | 'photos' | 'contact' | 'promos' | 'staff' | 'affiliates';

export default function ManageHotelPage() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Room form
  const [roomForm, setRoomForm] = useState({ name: '', description: '', pricePerNight: '', maxOccupancy: '2' });
  const [addingRoom, setAddingRoom] = useState(false);

  useEffect(() => {
    fetch('/api/portal/hotel')
      .then(r => r.json())
      .then(d => {
        setHotel(d.hotel);
        const s: Record<string, number> = {};
        (d.stats || []).forEach((row: { status: string; _count: number }) => { s[row.status] = row._count; });
        setStats(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveHotel = async (updates: Partial<Hotel>) => {
    setSaving(true); setError(''); setSaved('');
    try {
      const res = await fetch('/api/portal/hotel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      setHotel(prev => prev ? { ...prev, ...updates } : prev);
      setSaved('Saved!');
      setTimeout(() => setSaved(''), 2000);
    } finally { setSaving(false); }
  };

  const downloadReport = async () => {
    setDownloadingReport(true);
    try {
      const res = await fetch('/api/portal/report');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coupons-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Error downloading report:', e);
    } finally {
      setDownloadingReport(false);
    }
  };

  const addRoom = async () => {
    setAddingRoom(true);
    try {
      const res = await fetch('/api/portal/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomForm, pricePerNight: Number(roomForm.pricePerNight), maxOccupancy: Number(roomForm.maxOccupancy) }),
      });
      const data = await res.json();
      if (res.ok) {
        setHotel(prev => prev ? { ...prev, roomTypes: [...prev.roomTypes, data.room] } : prev);
        setRoomForm({ name: '', description: '', pricePerNight: '', maxOccupancy: '2' });
      }
    } finally { setAddingRoom(false); }
  };

  const deleteRoom = async (roomId: string) => {
    await fetch('/api/portal/rooms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) });
    setHotel(prev => prev ? { ...prev, roomTypes: prev.roomTypes.filter(r => r.id !== roomId) } : prev);
  };

  const updateRoom = async (roomId: string, updates: Partial<RoomType>) => {
    const res = await fetch('/api/portal/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, ...updates }),
    });
    const data = await res.json();
    if (res.ok) {
      setHotel(prev => prev ? { ...prev, roomTypes: prev.roomTypes.map(r => r.id === roomId ? { ...r, ...data.room } : r) } : prev);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <div className="text-5xl mb-4">🏨</div>
        <h2 className="font-bold text-xl text-gray-800 mb-2">No hotel assigned yet</h2>
        <p className="text-gray-500 mb-4">Your KYC may still be pending, or you haven't been assigned to a hotel.</p>
        <Link href="/apply/status" className="btn-primary text-sm">Check KYC Status</Link>
      </div>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview',  icon: '📋' },
    { id: 'rooms',    label: 'Rooms',     icon: '🛏' },
    { id: 'discount', label: 'Discount',  icon: '🎫' },
    { id: 'photos',   label: 'Photos',    icon: '📷' },
    { id: 'contact',  label: 'Contact',   icon: '📞' },
    { id: 'promos',   label: 'Promotions', icon: '⚡' },
    { id: 'staff', label: 'Staff', icon: '👥' },
    { id: 'affiliates', label: 'Affiliates', icon: '🔗' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="text-gray-400 hover:text-gray-600">←</Link>
            <div>
              <span className="font-bold text-sm" style={{ color: '#1A3C5E' }}>{hotel.name}</span>
              <span className="text-gray-400 text-xs ml-2">Management</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/portal" className="text-sm font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100">🎫 Scanner</Link>
            <Link href="/portal/analytics" className="text-sm font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100">📊 Analytics</Link>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-green-600 text-sm font-medium animate-pulse">{saved}</span>}
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <button
              onClick={downloadReport}
              disabled={downloadingReport}
              className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {downloadingReport ? '...' : '📥 Report'}
            </button>
            <Link href={`/hotels/${hotel.id}`} target="_blank" className="text-xs text-teal-600 hover:underline">View ↗</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stat row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Coupons', value: Object.values(stats).reduce((a, b) => a + b, 0), color: 'bg-white' },
            { label: 'Active',   value: stats.active   || 0, color: 'bg-green-50 text-green-700' },
            { label: 'Redeemed', value: stats.redeemed || 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Expired',  value: stats.expired  || 0, color: 'bg-gray-50 text-gray-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`card p-3 text-center ${color}`}>
              <div className="text-2xl font-extrabold">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <OverviewTab hotel={hotel} saving={saving} onSave={saveHotel} />
        )}

        {/* ── Rooms Tab ── */}
        {tab === 'rooms' && (
          <RoomsTab
            hotel={hotel}
            roomForm={roomForm}
            setRoomForm={setRoomForm}
            addingRoom={addingRoom}
            onAdd={addRoom}
            onDelete={deleteRoom}
            onUpdate={updateRoom}
          />
        )}

        {/* ── Discount Tab ── */}
        {tab === 'discount' && (
          <DiscountTab hotel={hotel} saving={saving} onSave={saveHotel} />
        )}

        {/* ── Photos Tab ── */}
        {tab === 'photos' && (
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-6" style={{ color: '#1A3C5E' }}>Photo Management</h3>
            <PhotoTab hotel={hotel} saving={saving} onSave={saveHotel} />
          </div>
        )}

        {/* ── Contact Tab ── */}
        {tab === 'contact' && (
          <ContactTab hotel={hotel} saving={saving} onSave={saveHotel} />
        )}

        {/* ── Promotions Tab ── */}
        {tab === 'promos' && (
          <PromotionsTab hotel={hotel} onSave={saveHotel} />
        )}

        {/* ── Staff Tab ── */}
        {tab === 'staff' && (
          <StaffTab hotelId={hotel.id} />
        )}

        {/* ── Affiliates Tab ── */}
        {tab === 'affiliates' && (
          <div className="card p-6">
            <AffiliateTab hotelId={hotel.id} initialLinks={hotel.affiliateLinks || []} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function OverviewTab({ hotel, saving, onSave }: {
  hotel: Hotel;
  saving: boolean;
  onSave: (u: Partial<Hotel>) => void;
}) {
  const [form, setForm] = useState({
    name: hotel.name,
    category: hotel.category || 'Hotel',
    descriptionShort: hotel.descriptionShort,
    descriptionLong: hotel.descriptionLong,
    starRating: hotel.starRating,
    websiteUrl: hotel.websiteUrl || '',
    amenities: hotel.amenities as string[],
  });
  const [masterAmenities, setMasterAmenities] = useState<Array<{ id: string; name: string; icon: string; category: string }>>([]);
  const [hotelTypes, setHotelTypes] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch('/api/amenities')
      .then(r => r.json())
      .then(d => setMasterAmenities(d.amenities || []))
      .catch(() => {});
    fetch('/api/hotel-types')
      .then(r => r.json())
      .then(d => setHotelTypes(d.types || []))
      .catch(() => {});
  }, []);

  const toggleAmenity = (name: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(name)
        ? prev.amenities.filter(a => a !== name)
        : [...prev.amenities, name],
    }));
  };

  const byCategory = masterAmenities.reduce((acc: Record<string, typeof masterAmenities>, a) => {
    const cat = a.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Hotel Details</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Hotel Name</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Hotel Type / Category</label>
          <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {hotelTypes.length > 0
              ? hotelTypes.map(ht => <option key={ht.id} value={ht.name}>{ht.name}</option>)
              : ['Hotel', 'Villa', 'Apartment', 'B&B', 'Lodge', 'Resort', 'Hostel', 'Guesthouse', 'Boutique', 'Motel', 'Camping', 'Beachfront'].map(t => <option key={t} value={t}>{t}</option>)
            }
          </select>
        </div>
      </div>
      <div>
        <label className="label">Short Description</label>
        <input className="input" value={form.descriptionShort} onChange={e => setForm({ ...form, descriptionShort: e.target.value })} />
      </div>
      <div>
        <label className="label">Full Description</label>
        <textarea className="input" rows={4} value={form.descriptionLong} onChange={e => setForm({ ...form, descriptionLong: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Star Rating</label>
          <select className="input" value={form.starRating} onChange={e => setForm({ ...form, starRating: Number(e.target.value) })}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
          </select>
        </div>
        <div>
          <label className="label">Website URL</label>
          <input className="input" type="url" placeholder="https://..." value={form.websiteUrl}
            onChange={e => setForm({ ...form, websiteUrl: e.target.value })} />
        </div>
      </div>
      {/* Amenities selector */}
      <div>
        <label className="label">Amenities</label>
        {masterAmenities.length === 0 ? (
          <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded-xl">No amenities in master list yet. Ask admin to add amenities first.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(a => {
                    const selected = form.amenities.includes(a.name);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenity(a.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          selected
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                        }`}
                      >
                        <span>{a.icon}</span>
                        <span>{a.name}</span>
                        {selected && <span className="text-teal-500">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {form.amenities.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">{form.amenities.length} selected: {form.amenities.join(', ')}</p>
        )}
      </div>
      <button
        onClick={() => onSave({ ...form, amenities: form.amenities })}
        disabled={saving} className="w-full btn-primary disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

/* ── Rooms Tab with inline editing ─── */
function RoomsTab({ hotel, roomForm, setRoomForm, addingRoom, onAdd, onDelete, onUpdate }: {
  hotel: Hotel;
  roomForm: { name: string; description: string; pricePerNight: string; maxOccupancy: string };
  setRoomForm: (f: any) => void;
  addingRoom: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string; pricePerNight: string; maxOccupancy: string }>({
    name: '', description: '', pricePerNight: '', maxOccupancy: '2',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (room: RoomType) => {
    setEditingId(room.id);
    setEditForm({
      name: room.name,
      description: room.description,
      pricePerNight: String(room.pricePerNight),
      maxOccupancy: String(room.maxOccupancy),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    await onUpdate(editingId, {
      name: editForm.name,
      description: editForm.description,
      pricePerNight: Number(editForm.pricePerNight),
      maxOccupancy: Number(editForm.maxOccupancy),
    });
    setSavingEdit(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Room Types</h2>
        <span className="text-sm text-gray-400">{hotel.roomTypes.length} rooms</span>
      </div>

      {hotel.roomTypes.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-2">🛏</div>
          <p className="text-sm">No room types yet. Add your first room below.</p>
        </div>
      )}

      {hotel.roomTypes.map(room => (
        <div key={room.id} className="card p-4">
          {editingId === room.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Room Name</label>
                  <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <input className="input" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div>
                  <label className="label">Price / Night ($)</label>
                  <input className="input" type="number" min="1" value={editForm.pricePerNight}
                    onChange={e => setEditForm({ ...editForm, pricePerNight: e.target.value })} />
                </div>
                <div>
                  <label className="label">Max Guests</label>
                  <input className="input" type="number" min="1" max="10" value={editForm.maxOccupancy}
                    onChange={e => setEditForm({ ...editForm, maxOccupancy: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={savingEdit}
                  className="btn-primary text-sm px-4 disabled:opacity-50">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditingId(null)}
                  className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{room.name}</div>
                <div className="text-sm text-gray-500">{room.description}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">👥 Up to {room.maxOccupancy} guests</span>
                  <span className="text-xs font-bold text-teal-600">${room.pricePerNight}/night</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => startEdit(room)}
                  className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                  ✏️ Edit
                </button>
                <button onClick={() => onDelete(room.id)}
                  className="text-red-400 hover:text-red-600 text-sm px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add room form */}
      <div className="card p-5 border-2 border-dashed border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">➕ Add New Room Type</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Room Name</label>
            <input className="input" placeholder="e.g. Deluxe King" value={roomForm.name}
              onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <input className="input" placeholder="Brief room description" value={roomForm.description}
              onChange={e => setRoomForm({ ...roomForm, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Price / Night ($)</label>
            <input className="input" type="number" min="1" placeholder="150" value={roomForm.pricePerNight}
              onChange={e => setRoomForm({ ...roomForm, pricePerNight: e.target.value })} />
          </div>
          <div>
            <label className="label">Max Guests</label>
            <input className="input" type="number" min="1" max="10" value={roomForm.maxOccupancy}
              onChange={e => setRoomForm({ ...roomForm, maxOccupancy: e.target.value })} />
          </div>
        </div>
        <button onClick={onAdd} disabled={addingRoom || !roomForm.name || !roomForm.pricePerNight}
          className="mt-4 btn-primary w-full disabled:opacity-50">
          {addingRoom ? 'Adding...' : '+ Add Room'}
        </button>
      </div>
    </div>
  );
}

function DiscountTab({ hotel, saving, onSave }: { hotel: Hotel; saving: boolean; onSave: (u: Partial<Hotel>) => void }) {
  const [discount, setDiscount] = useState(hotel.discountPercent);
  const [validDays, setValidDays] = useState(hotel.couponValidDays);

  const presets = [10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Coupon Offer Settings</h2>
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-5 text-center">
        <div className="text-6xl font-extrabold text-teal-600">{discount}%</div>
        <div className="text-teal-700 font-medium mt-1">Current discount shown to travelers</div>
        <div className="text-teal-500 text-sm mt-0.5">Coupons valid for {validDays} days</div>
      </div>

      <div>
        <label className="label">Discount Percentage: <strong>{discount}%</strong></label>
        <input type="range" min="1" max="80" value={discount} onChange={e => setDiscount(Number(e.target.value))}
          className="w-full accent-teal-500 mt-2" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1%</span><span>80%</span></div>
        <div className="flex gap-1.5 flex-wrap mt-3">
          {presets.map(p => (
            <button key={p} onClick={() => setDiscount(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${discount === p ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-teal-50'}`}>
              {p}%
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Coupon Valid For: <strong>{validDays} days</strong></label>
        <input type="range" min="7" max="90" value={validDays} onChange={e => setValidDays(Number(e.target.value))}
          className="w-full accent-teal-500 mt-2" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>7 days</span><span>90 days</span></div>
        <div className="flex gap-1.5 mt-3">
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setValidDays(d)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${validDays === d ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-teal-50'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700 border border-amber-200">
        <strong>💡 Tip:</strong> Changes apply to <em>new coupons only</em>. Already-generated coupons keep their original discount.
      </div>
      <button onClick={() => onSave({ discountPercent: discount, couponValidDays: validDays })}
        disabled={saving} className="w-full btn-primary disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Discount Settings'}
      </button>
    </div>
  );
}

/* ── Contact & Social Tab ─── */
function ContactTab({ hotel, saving, onSave }: { hotel: Hotel; saving: boolean; onSave: (u: Partial<Hotel>) => void }) {
  const [form, setForm] = useState({
    email: hotel.email || '',
    whatsapp: hotel.whatsapp || '',
    address: hotel.address || '',
    socialFacebook: hotel.socialFacebook || '',
    socialInstagram: hotel.socialInstagram || '',
    socialTwitter: hotel.socialTwitter || '',
    socialTiktok: hotel.socialTiktok || '',
    latitude: hotel.latitude ? String(hotel.latitude) : '',
    longitude: hotel.longitude ? String(hotel.longitude) : '',
  });

  return (
    <div className="space-y-5">
      {/* Contact info */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>📞 Contact Information</h2>
        <p className="text-sm text-gray-500">This info may appear on your hotel page and help guests contact you.</p>

        <div>
          <label className="label">Business Email</label>
          <input className="input" type="email" placeholder="hotel@example.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">WhatsApp Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+</span>
            <input className="input pl-6" type="tel" placeholder="1 555 123 4567 (with country code)" value={form.whatsapp}
              onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Include country code without + (e.g. 1555123456)</p>
        </div>
        <div>
          <label className="label">Full Address</label>
          <textarea className="input" rows={2} placeholder="123 Main Street, City, Country" value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>

        {/* Map coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Latitude</label>
            <input className="input" type="number" step="any" placeholder="e.g. -1.2921" value={form.latitude}
              onChange={e => setForm({ ...form, latitude: e.target.value })} />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input className="input" type="number" step="any" placeholder="e.g. 36.8219" value={form.longitude}
              onChange={e => setForm({ ...form, longitude: e.target.value })} />
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          💡 Find your coordinates at <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Maps</a> — right-click your property and copy the lat/lng.
        </div>

        <button
          onClick={() => onSave({
            email: form.email,
            whatsapp: form.whatsapp,
            address: form.address,
            latitude: form.latitude ? parseFloat(form.latitude) : undefined,
            longitude: form.longitude ? parseFloat(form.longitude) : undefined,
          })}
          disabled={saving}
          className="w-full btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Contact Info'}
        </button>
      </div>

      {/* Social media */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>📱 Social Media</h2>
        <p className="text-sm text-gray-500">Add your social profiles to boost trust and discoverability.</p>

        {[
          { key: 'socialFacebook', label: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/yourhotel' },
          { key: 'socialInstagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/yourhotel' },
          { key: 'socialTwitter', label: 'Twitter / X', icon: '𝕏', placeholder: 'https://twitter.com/yourhotel' },
          { key: 'socialTiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@yourhotel' },
        ].map(({ key, label, icon, placeholder }) => (
          <div key={key}>
            <label className="label">{icon} {label}</label>
            <input className="input" type="url" placeholder={placeholder}
              value={(form as any)[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}

        <button
          onClick={() => onSave({
            socialFacebook: form.socialFacebook,
            socialInstagram: form.socialInstagram,
            socialTwitter: form.socialTwitter,
            socialTiktok: form.socialTiktok,
          })}
          disabled={saving}
          className="w-full btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Social Links'}
        </button>
      </div>
    </div>
  );
}

function PhotoTab({ hotel, saving, onSave }: { hotel: Hotel; saving: boolean; onSave: (u: Partial<Hotel>) => void }) {
  const [coverUrl, setCoverUrl]     = useState(hotel.coverImage || '');
  const [photos, setPhotos]         = useState<Photo[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/portal/photos')
      .then(r => r.json())
      .then(d => { setPhotos(d.photos || []); setLoadingPhotos(false); })
      .catch(() => setLoadingPhotos(false));
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Only image files allowed'); return null; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('File too large (max 5 MB)'); return null; }
    setUploadError('');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/portal/photos`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) { setUploadError(data.error || 'Upload failed'); return null; }
    return data.photo;
  };

  const uploadCoverFile = async (file: File) => {
    setUploadingCover(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload?folder=covers', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || 'Upload failed'); return; }
      setCoverUrl(data.url);
      await onSave({ coverImage: data.url });
    } finally { setUploadingCover(false); }
  };

  const addPhotoFile = async (file: File) => {
    if (photos.length >= 10) { setUploadError('Maximum 10 photos reached'); return; }
    setAddingPhoto(true);
    try {
      const photo = await uploadFile(file);
      if (photo) setPhotos(prev => [...prev, photo]);
    } finally { setAddingPhoto(false); }
  };

  const addPhotoUrl = async () => {
    if (!newPhotoUrl.trim()) return;
    setAddingPhoto(true);
    try {
      const res = await fetch('/api/portal/photos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newPhotoUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setPhotos(prev => [...prev, data.photo]); setNewPhotoUrl(''); }
      else setUploadError(data.error || 'Failed to add photo');
    } finally { setAddingPhoto(false); }
  };

  const deletePhoto = async (photoId: string) => {
    await fetch('/api/portal/photos', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.slice(0, 10 - photos.length).forEach(f => addPhotoFile(f));
  };

  // Drag-to-reorder
  const handlePhotoDragStart = (idx: number) => setDraggingIdx(idx);
  const handlePhotoDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(draggingIdx, 1);
    reordered.splice(idx, 0, moved);
    setPhotos(reordered);
    setDraggingIdx(idx);
  };
  const handlePhotoDragEnd = async () => {
    setDraggingIdx(null);
    setSavingOrder(true);
    try {
      await Promise.all(photos.map((p, i) =>
        fetch('/api/portal/photos', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId: p.id, displayOrder: i }),
        })
      ));
    } finally { setSavingOrder(false); }
  };

  return (
    <div className="space-y-6 text-left">
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span>⚠️</span> {uploadError}
          <button onClick={() => setUploadError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Cover Image */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Cover Photo</h3>
        {coverUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200 h-48 mb-3 relative group">
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => coverInputRef.current?.click()}
                className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100">
                Replace
              </button>
            </div>
          </div>
        )}

        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadCoverFile(f); e.target.value = ''; }} />

        <div className="flex gap-2 mb-2">
          <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50 transition-colors disabled:opacity-50">
            {uploadingCover
              ? <><div className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /> Uploading…</>
              : <>📤 Upload from device</>
            }
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-2">Or paste a URL:</p>
        <div className="flex gap-2">
          <input className="input flex-1" type="url" placeholder="https://images.unsplash.com/..." value={coverUrl}
            onChange={e => setCoverUrl(e.target.value)} />
          <button onClick={() => onSave({ coverImage: coverUrl })} disabled={saving}
            className="btn-primary text-sm px-4 disabled:opacity-50 flex-shrink-0">
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="h-px bg-gray-200" />

      {/* Gallery Photos */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-800">Gallery Photos</h3>
          <div className="flex items-center gap-2">
            {savingOrder && <span className="text-xs text-teal-600 animate-pulse">Saving order…</span>}
            <span className="text-xs text-gray-400">{photos.length}/10</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">Drag photos to reorder them. Drop multiple images at once to upload.</p>

        {/* Drag & drop zone */}
        {photos.length < 10 && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${dragOver ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-400 hover:bg-gray-50'}`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { Array.from(e.target.files || []).forEach(f => addPhotoFile(f)); e.target.value = ''; }} />
            {addingPhoto
              ? <div className="flex items-center justify-center gap-2 text-sm text-gray-500"><div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> Uploading…</div>
              : <>
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-sm font-medium text-gray-600">Drop photos here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 5 MB each</p>
                </>
            }
          </div>
        )}

        {loadingPhotos ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-2 mb-4">
            {photos.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-xl">No gallery photos yet.</p>
            )}
            {photos.map((p, idx) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handlePhotoDragStart(idx)}
                onDragOver={e => handlePhotoDragOver(e, idx)}
                onDragEnd={handlePhotoDragEnd}
                className={`flex items-center gap-3 p-2 border rounded-xl transition-all cursor-grab active:cursor-grabbing ${draggingIdx === idx ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-gray-200'}`}
              >
                {/* Drag handle */}
                <div className="text-gray-300 hover:text-gray-500 flex-shrink-0 select-none">⠿⠿</div>
                {/* Order badge */}
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                <img src={p.url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{p.url}</p>
                  {idx === 0 && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">Main Photo</span>}
                </div>
                <button onClick={() => deletePhoto(p.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-lg flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        )}

        {/* URL fallback */}
        {photos.length < 10 && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Or add by URL:</p>
            <div className="flex gap-2">
              <input className="input flex-1" type="url" placeholder="https://images.unsplash.com/..."
                value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPhotoUrl()} />
              <button onClick={addPhotoUrl} disabled={addingPhoto || !newPhotoUrl.trim()}
                className="btn-primary text-sm px-4 disabled:opacity-50 flex-shrink-0">
                {addingPhoto ? '…' : '+ Add'}
              </button>
            </div>
          </div>
        )}
        {photos.length >= 10 && <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">Maximum 10 gallery photos reached.</p>}
      </div>
    </div>
  );
}

/* ── Promotions / Flash Sale Tab ─── */
function PromotionsTab({ hotel, onSave }: { hotel: Hotel; onSave: (u: Partial<Hotel>) => void }) {
  const [flashDiscount, setFlashDiscount] = useState(hotel.discountPercent + 10);
  const [flashLabel, setFlashLabel] = useState('Flash Sale');
  const [flashHours, setFlashHours] = useState(24);
  const [launching, setLaunching] = useState(false);
  const [activeFlash, setActiveFlash] = useState<{ discount: number; endsAt: string; bannerId?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [ending, setEnding] = useState(false);

  // Check localStorage for active flash sale
  useEffect(() => {
    const stored = localStorage.getItem(`flash_${hotel.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (new Date(parsed.endsAt) > new Date()) {
        setActiveFlash(parsed);
      } else {
        localStorage.removeItem(`flash_${hotel.id}`);
      }
    }
  }, [hotel.id]);

  // Countdown timer
  useEffect(() => {
    if (!activeFlash) return;
    const tick = () => {
      const diff = new Date(activeFlash.endsAt).getTime() - Date.now();
      if (diff <= 0) { setActiveFlash(null); localStorage.removeItem(`flash_${hotel.id}`); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeFlash, hotel.id]);

  const launchFlash = async () => {
    setLaunching(true);
    try {
      const endsAt = new Date(Date.now() + flashHours * 3600 * 1000).toISOString();
      const res = await fetch('/api/portal/flash-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountPercent: flashDiscount, endsAt, label: flashLabel }),
      });
      const data = await res.json();
      if (res.ok) {
        const flash = { discount: flashDiscount, endsAt, bannerId: data.bannerId };
        setActiveFlash(flash);
        localStorage.setItem(`flash_${hotel.id}`, JSON.stringify(flash));
        onSave({ discountPercent: flashDiscount });
      }
    } finally { setLaunching(false); }
  };

  const endFlash = async () => {
    if (!activeFlash) return;
    setEnding(true);
    try {
      await fetch('/api/portal/flash-sale', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalDiscount: hotel.discountPercent - 10, bannerId: activeFlash.bannerId }),
      });
      setActiveFlash(null);
      localStorage.removeItem(`flash_${hotel.id}`);
      onSave({ discountPercent: hotel.discountPercent - 10 < 5 ? 15 : hotel.discountPercent - 10 });
    } finally { setEnding(false); }
  };

  return (
    <div className="space-y-5">
      {/* Active Flash Sale Banner */}
      {activeFlash && (
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #E8395A, #C0263D)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-black text-xl">🔥 Flash Sale LIVE!</div>
              <div className="text-pink-100 text-sm mt-1">{activeFlash.discount}% discount active</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-2xl font-mono">{timeLeft}</div>
              <div className="text-pink-200 text-xs">remaining</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-white/80 text-sm">Ends: {new Date(activeFlash.endsAt).toLocaleString()}</div>
            <button onClick={endFlash} disabled={ending}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
              {ending ? 'Ending…' : 'End Sale Early'}
            </button>
          </div>
        </div>
      )}

      {/* Flash Sale Setup */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Flash Sale</h2>
            <p className="text-sm text-gray-500">Boost your discount for a limited time to drive urgent bookings</p>
          </div>
        </div>

        <div>
          <label className="label">Flash Sale Label</label>
          <input className="input" placeholder="e.g. Weekend Deal, Early Bird, Summer Special" value={flashLabel}
            onChange={e => setFlashLabel(e.target.value)} />
        </div>

        <div>
          <label className="label">Flash Discount: <strong className="text-teal-600">{flashDiscount}%</strong></label>
          <input type="range" min={hotel.discountPercent + 1} max="80" value={flashDiscount}
            onChange={e => setFlashDiscount(Number(e.target.value))}
            className="w-full accent-red-500 mt-2" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Current: {hotel.discountPercent}%</span><span>Max: 80%</span>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {[hotel.discountPercent + 5, hotel.discountPercent + 10, hotel.discountPercent + 15, hotel.discountPercent + 20].filter(d => d <= 80).map(d => (
              <button key={d} onClick={() => setFlashDiscount(d)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${flashDiscount === d ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}>
                +{d - hotel.discountPercent}% → {d}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Duration</label>
          <div className="flex gap-2 flex-wrap">
            {[2, 6, 12, 24, 48, 72].map(h => (
              <button key={h} onClick={() => setFlashHours(h)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${flashHours === h ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-teal-50'}`}>
                {h < 24 ? `${h}h` : `${h/24}d`}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-bold text-gray-800">{flashDiscount}%</div>
              <div className="text-xs text-gray-400">Flash Discount</div>
            </div>
            <div>
              <div className="font-bold text-gray-800">{flashHours < 24 ? `${flashHours}h` : `${flashHours/24}d`}</div>
              <div className="text-xs text-gray-400">Duration</div>
            </div>
            <div>
              <div className="font-bold text-gray-800">{new Date(Date.now() + flashHours * 3600 * 1000).toLocaleDateString()}</div>
              <div className="text-xs text-gray-400">Ends On</div>
            </div>
          </div>
        </div>

        <button
          onClick={launchFlash}
          disabled={launching || !!activeFlash}
          className="w-full py-3 rounded-xl font-bold text-white text-base transition-all hover:scale-[1.01] disabled:opacity-50 disabled:transform-none"
          style={{ background: activeFlash ? '#9CA3AF' : 'linear-gradient(135deg, #E8395A, #C0263D)' }}
        >
          {launching ? '⚡ Launching…' : activeFlash ? '⚡ Flash Sale Already Active' : `⚡ Launch ${flashLabel}!`}
        </button>
      </div>

      {/* Featured listing */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⭐</span>
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Featured Listing</h2>
            <p className="text-sm text-gray-500">Get your hotel shown at the top of search results</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${hotel.isFeatured ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
          {hotel.isFeatured ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-semibold text-yellow-800">Your hotel is currently featured!</div>
                <div className="text-sm text-yellow-600">
                  {hotel.featuredUntil
                    ? `Featured until ${new Date(hotel.featuredUntil).toLocaleDateString()}`
                    : 'Featured indefinitely by admin'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="text-gray-400 text-sm mb-3">Your hotel is not currently featured</div>
              <Link href="/subscribe"
                className="inline-block btn-primary text-sm px-6">
                🚀 Upgrade to Get Featured
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Staff Management Tab ─── */
function StaffTab({ hotelId }: { hotelId: string }) {
  const [managers, setManagers] = useState<Array<{ id: string; isActive: boolean; assignedAt: string; user: { id: string; fullName: string; email: string; avatar?: string } }>>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/portal/staff')
      .then(r => r.json())
      .then(d => { setManagers(d.managers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addManager = async () => {
    if (!email.trim()) return;
    setAdding(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/portal/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add'); return; }
      setManagers(prev => [data.manager, ...prev]);
      setEmail('');
      setSuccess('Staff member added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } finally { setAdding(false); }
  };

  const removeManager = async (managerId: string) => {
    await fetch('/api/portal/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId }),
    });
    setManagers(prev => prev.filter(m => m.id !== managerId));
  };

  const activeManagers = managers.filter(m => m.isActive);

  return (
    <div className="space-y-5">
      {/* Add staff */}
      <div className="card p-5">
        <h2 className="font-bold text-lg mb-1" style={{ color: '#1A3C5E' }}>👥 Staff Management</h2>
        <p className="text-sm text-gray-500 mb-4">Add managers who can access the hotel portal, scan coupons, and manage your listing.</p>

        {error && <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
        {success && <div className="mb-3 p-3 bg-green-50 text-green-600 text-sm rounded-xl">✓ {success}</div>}

        <div className="flex gap-2">
          <input
            className="input flex-1"
            type="email"
            placeholder="staff@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManager()}
          />
          <button
            onClick={addManager}
            disabled={adding || !email.trim()}
            className="btn-primary px-5 disabled:opacity-50"
          >
            {adding ? '…' : '+ Add'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          💡 The person must already have a BusyBeds account. They'll get access after you add them.
        </p>
      </div>

      {/* Active staff list */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Active Staff
          <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">{activeManagers.length}</span>
        </h3>

        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : activeManagers.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <div className="text-3xl mb-2">👤</div>
            <p className="text-sm">No staff members yet. Add their email address above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeManagers.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                {m.user.avatar ? (
                  <img src={m.user.avatar} alt={m.user.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                    {m.user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800">{m.user.fullName}</div>
                  <div className="text-xs text-gray-500">{m.user.email}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">
                    Added {new Date(m.assignedAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => removeManager(m.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium mt-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions info */}
      <div className="card p-4 bg-blue-50 border border-blue-100">
        <h4 className="font-semibold text-blue-800 text-sm mb-2">ℹ️ Staff Permissions</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>✓ Scan and validate guest coupons</li>
          <li>✓ View hotel analytics and stats</li>
          <li>✓ Edit hotel details and photos</li>
          <li>✗ Cannot remove other staff</li>
          <li>✗ Cannot change subscription or billing</li>
        </ul>
      </div>
    </div>
  );
}
