'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AffiliateTab from './AffiliateTab';

interface RoomType { id: string; name: string; description: string; pricePerNight: number; maxOccupancy: number; }
interface AffiliateLink { id: string; platform: string; url: string; isActive: boolean; }
interface Hotel {
  id: string; name: string; city: string; country: string; starRating: number;
  category: string;
  descriptionShort: string; descriptionLong: string; amenities: string[];
  discountPercent: number; couponValidDays: number; websiteUrl?: string;
  coverImage?: string; roomTypes: RoomType[]; affiliateLinks?: AffiliateLink[];
}

type Tab = 'overview' | 'rooms' | 'discount' | 'photos' | 'affiliates';

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
    } catch (error) {
      console.error('Error downloading report:', error);
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
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'rooms',    label: 'Rooms',    icon: '🛏' },
    { id: 'discount', label: 'Discount', icon: '🎫' },
    { id: 'photos',   label: 'Photos',   icon: '📷' },
    { id: 'affiliates', label: 'Affiliate Links', icon: '🔗' },
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
            {saved && <span className="text-green-600 text-sm font-medium">{saved}</span>}
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <button
              onClick={downloadReport}
              disabled={downloadingReport}
              className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {downloadingReport ? '...' : '📥 Download Report'}
            </button>
            <Link href={`/hotels/${hotel.id}`} target="_blank" className="text-xs text-teal-600 hover:underline">View listing ↗</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stat row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Coupons', value: Object.values(stats).reduce((a, b) => a + b, 0), color: 'bg-gray-50' },
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
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <OverviewTab hotel={hotel} saving={saving} onSave={saveHotel} />
        )}

        {/* ── Rooms Tab ── */}
        {tab === 'rooms' && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Room Types</h2>
            {hotel.roomTypes.map(room => (
              <div key={room.id} className="card p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{room.name}</div>
                  <div className="text-sm text-gray-500">{room.description}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Up to {room.maxOccupancy} guests</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ color: '#1A3C5E' }}>${room.pricePerNight}</div>
                    <div className="text-xs text-gray-400">/night</div>
                  </div>
                  <button onClick={() => deleteRoom(room.id)} className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">✕</button>
                </div>
              </div>
            ))}

            {/* Add room form */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Add Room Type</h3>
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
              <button onClick={addRoom} disabled={addingRoom || !roomForm.name || !roomForm.pricePerNight}
                className="mt-4 btn-primary w-full disabled:opacity-50">
                {addingRoom ? 'Adding...' : '+ Add Room'}
              </button>
            </div>
          </div>
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

function DiscountTab({ hotel, saving, onSave }: { hotel: Hotel; saving: boolean; onSave: (u: Partial<Hotel>) => void }) {
  const [discount, setDiscount] = useState(hotel.discountPercent);
  const [validDays, setValidDays] = useState(hotel.couponValidDays);

  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>Coupon Offer Settings</h2>
      <div className="bg-teal-50 rounded-2xl p-5 text-center mb-2">
        <div className="text-5xl font-extrabold text-teal-600">{discount}%</div>
        <div className="text-teal-700 font-medium mt-1">Current discount shown to travelers</div>
      </div>
      <div>
        <label className="label">Discount Percentage: <strong>{discount}%</strong></label>
        <input type="range" min="1" max="80" value={discount} onChange={e => setDiscount(Number(e.target.value))}
          className="w-full accent-teal-500 mt-2" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1%</span><span>80%</span></div>
      </div>
      <div>
        <label className="label">Coupon Valid For: <strong>{validDays} days</strong></label>
        <input type="range" min="7" max="90" value={validDays} onChange={e => setValidDays(Number(e.target.value))}
          className="w-full accent-teal-500 mt-2" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>7 days</span><span>90 days</span></div>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <strong>Note:</strong> Changes apply to <em>new coupons only</em>. Already-generated coupons keep their original discount.
      </div>
      <button onClick={() => onSave({ discountPercent: discount, couponValidDays: validDays })}
        disabled={saving} className="w-full btn-primary disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Discount Settings'}
      </button>
    </div>
  );
}

function PhotoTab({ hotel, saving, onSave }: { hotel: Hotel; saving: boolean; onSave: (u: Partial<Hotel>) => void }) {
  const [coverUrl, setCoverUrl]     = useState(hotel.coverImage || '');
  const [photos, setPhotos]         = useState<Array<{ id: string; url: string; displayOrder: number }>>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/portal/photos')
      .then(r => r.json())
      .then(d => { setPhotos(d.photos || []); setLoadingPhotos(false); })
      .catch(() => setLoadingPhotos(false));
  }, []);

  const uploadFile = async (file: File, forCover = false) => {
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

        {/* File upload for cover */}
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadCoverFile(f); e.target.value = ''; }} />

        <div className="flex gap-2 mb-2">
          <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border-2 border-dashed border-gray-300 hover:border-[#E8395A] hover:bg-red-50 transition-colors disabled:opacity-50">
            {uploadingCover
              ? <><div className="w-3.5 h-3.5 border-2 border-[#E8395A] border-t-transparent rounded-full animate-spin" /> Uploading…</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg> Upload from device</>
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
          <span className="text-xs text-gray-400">{photos.length}/10</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">These appear in the hotel page carousel. Drag &amp; drop multiple images at once.</p>

        {/* Drag & drop zone */}
        {photos.length < 10 && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${dragOver ? 'border-[#E8395A] bg-red-50' : 'border-gray-200 hover:border-[#E8395A] hover:bg-gray-50'}`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { Array.from(e.target.files || []).forEach(f => addPhotoFile(f)); e.target.value = ''; }} />
            {addingPhoto
              ? <div className="flex items-center justify-center gap-2 text-sm text-gray-500"><div className="w-4 h-4 border-2 border-[#E8395A] border-t-transparent rounded-full animate-spin" /> Uploading…</div>
              : <>
                  <svg className="mx-auto mb-2 text-gray-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
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
              <div key={p.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl">
                <img src={p.url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{p.url}</p>
                  <p className="text-xs text-gray-400">Photo {idx + 1}</p>
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
