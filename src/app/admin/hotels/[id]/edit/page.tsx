'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/locations';

interface Amenity { id: string; name: string; icon: string; category: string; }
interface HotelType { id: string; name: string; }
interface RoomType { id: string; name: string; description: string; pricePerNight: number; maxOccupancy: number; displayOrder: number; }

const PLATFORMS = [
  { key: 'booking_com',  label: 'Booking.com',  placeholder: 'https://www.booking.com/hotel/...', color: '#003580' },
  { key: 'airbnb',       label: 'Airbnb',        placeholder: 'https://www.airbnb.com/rooms/...', color: '#FF5A5F' },
  { key: 'expedia',      label: 'Expedia',        placeholder: 'https://www.expedia.com/...', color: '#00355F' },
  { key: 'agoda',        label: 'Agoda',          placeholder: 'https://www.agoda.com/...', color: '#5392CE' },
  { key: 'tripadvisor',  label: 'TripAdvisor',    placeholder: 'https://www.tripadvisor.com/Hotel_Review-...', color: '#00A680' },
];

const STATUSES = ['active', 'inactive', 'pending'] as const;

export default function EditHotelPage() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.id as string;

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [hotelName, setHotelName] = useState('');

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${hotelName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/hotels');
      } else {
        const d = await res.json();
        setError(d.error || 'Delete failed');
        setDeleting(false);
      }
    } catch {
      setError('Network error');
      setDeleting(false);
    }
  };

  const [amenities, setAmenities]       = useState<Amenity[]>([]);
  const [hotelTypes, setHotelTypes]     = useState<HotelType[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [photos, setPhotos]             = useState<string[]>(['']);
  const [affiliateLinks, setAffiliateLinks] = useState<Record<string, string>>(
    Object.fromEntries(PLATFORMS.map(p => [p.key, '']))
  );
  const [rooms, setRooms]               = useState<RoomType[]>([]);
  const [newRoom, setNewRoom]           = useState({ name: '', description: '', pricePerNight: '', maxOccupancy: '2' });
  const [addingRoom, setAddingRoom]     = useState(false);
  const [roomError, setRoomError]       = useState('');

  const [form, setForm] = useState({
    name: '', country: 'Tanzania', city: '', address: '', category: 'Hotel',
    starRating: 4, discountPercent: 15, couponValidDays: 30,
    descriptionShort: '', descriptionLong: '', coverImage: '',
    websiteUrl: '', email: '', whatsapp: '',
    status: 'active' as typeof STATUSES[number],
    isFeatured: false, latitude: '', longitude: '',
  });

  const cities = CITIES_BY_COUNTRY[form.country] || [];
  const f = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // ── Load hotel data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [hotelRes, amenRes, typesRes] = await Promise.all([
          fetch(`/api/hotels/${hotelId}`),
          fetch('/api/amenities'),
          fetch('/api/hotel-types'),
        ]);
        const [hotelData, amenData, typesData] = await Promise.all([
          hotelRes.json(),
          amenRes.json(),
          typesRes.json(),
        ]);

        setAmenities(amenData.amenities || []);
        setHotelTypes(typesData.types || []);

        if (hotelData) {
          setHotelName(hotelData.name);
          setForm({
            name: hotelData.name || '',
            country: hotelData.country || 'Tanzania',
            city: hotelData.city || '',
            address: hotelData.address || '',
            category: hotelData.category || 'Hotel',
            starRating: hotelData.starRating || 4,
            discountPercent: hotelData.discountPercent || 15,
            couponValidDays: hotelData.couponValidDays || 30,
            descriptionShort: hotelData.descriptionShort || '',
            descriptionLong: hotelData.descriptionLong || '',
            coverImage: hotelData.coverImage || '',
            websiteUrl: hotelData.websiteUrl || '',
            email: hotelData.email || '',
            whatsapp: hotelData.whatsapp || '',
            status: hotelData.status || 'active',
            isFeatured: hotelData.isFeatured || false,
            latitude: hotelData.latitude != null ? String(hotelData.latitude) : '',
            longitude: hotelData.longitude != null ? String(hotelData.longitude) : '',
          });

          // Amenities
          const ams = Array.isArray(hotelData.amenities) ? hotelData.amenities : [];
          setSelectedAmenities(ams);

          // Photos
          const photoUrls = (hotelData.photos || []).map((p: { url: string }) => p.url).filter(Boolean);
          setPhotos(photoUrls.length > 0 ? photoUrls : ['']);

          // Affiliate links
          const linksMap: Record<string, string> = Object.fromEntries(PLATFORMS.map(p => [p.key, '']));
          for (const l of hotelData.affiliateLinks || []) {
            if (linksMap[l.platform] !== undefined) linksMap[l.platform] = l.url;
          }
          setAffiliateLinks(linksMap);

          // Room types
          setRooms(hotelData.roomTypes || []);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load hotel data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hotelId]);

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const validLinks = PLATFORMS
        .filter(p => affiliateLinks[p.key]?.trim())
        .map(p => ({ platform: p.key, url: affiliateLinks[p.key].trim() }));
      const validPhotos = photos.filter(p => p.trim());

      const res = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          starRating: Number(form.starRating),
          discountPercent: Number(form.discountPercent),
          couponValidDays: Number(form.couponValidDays),
          amenities: selectedAmenities,
          photos: validPhotos,
          affiliateLinks: validLinks,
          coverImage: form.coverImage || null,
          websiteUrl: form.websiteUrl || null,
          email: form.email || null,
          whatsapp: form.whatsapp || null,
          address: form.address || null,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      setSuccess('Hotel saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Room type management ─────────────────────────────────────────────────
  const addRoom = async () => {
    if (!newRoom.name || !newRoom.pricePerNight) { setRoomError('Name and price required'); return; }
    setAddingRoom(true); setRoomError('');
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoom.name,
          description: newRoom.description,
          pricePerNight: Number(newRoom.pricePerNight),
          maxOccupancy: Number(newRoom.maxOccupancy) || 2,
          displayOrder: rooms.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setRoomError(data.error || 'Failed to add room'); return; }
      setRooms(prev => [...prev, data.room]);
      setNewRoom({ name: '', description: '', pricePerNight: '', maxOccupancy: '2' });
    } catch { setRoomError('Network error'); }
    finally { setAddingRoom(false); }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Delete this room type?')) return;
    const res = await fetch(`/api/admin/hotels/${hotelId}/rooms`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    });
    if (res.ok) setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const updateRoom = async (roomId: string, field: string, value: string | number) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, [field]: value } : r));
    await fetch(`/api/admin/hotels/${hotelId}/rooms`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, [field]: typeof value === 'string' ? value : Number(value) }),
    });
  };

  // ── Photo helpers ─────────────────────────────────────────────────────────
  const addPhotoRow    = () => setPhotos(prev => [...prev, '']);
  const removePhotoRow = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i));
  const updatePhoto    = (i: number, val: string) => setPhotos(prev => prev.map((p, idx) => idx === i ? val : p));
  const toggleAmenity  = (name: string) =>
    setSelectedAmenities(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
  const byCategory     = amenities.reduce((acc: Record<string, Amenity[]>, a) => {
    const cat = a.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 mb-6 px-6 py-5 flex items-center gap-4">
        <Link href="/admin/hotels"
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">Edit: {hotelName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update hotel details, rooms, photos and more</p>
        </div>
        <a href={`/hotels/${hotelId}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg px-3 py-2">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View live
        </a>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || saving}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors border border-red-200 rounded-lg px-3 py-2 disabled:opacity-40">
          {deleting ? (
            <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          )}
          {deleting ? 'Deleting…' : 'Delete Hotel'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {error   && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>}
        {success && <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium flex items-center gap-2"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{success}</div>}

        {/* ── Basic Info ── */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Label required>Hotel Name</Label>
              <input required value={form.name} onChange={e => f('name', e.target.value)}
                placeholder="e.g. The Grand Serengeti Lodge" className={inp} />
            </div>

            <div>
              <Label required>Country</Label>
              <select value={form.country}
                onChange={e => setForm(p => ({ ...p, country: e.target.value, city: '' }))}
                className={inp}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <Label required>City / Region</Label>
              {cities.length > 0 ? (
                <select required value={form.city} onChange={e => f('city', e.target.value)} className={inp}>
                  <option value="">Select city…</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input required value={form.city} onChange={e => f('city', e.target.value)}
                  placeholder="Enter city name" className={inp} />
              )}
            </div>

            <div className="sm:col-span-2">
              <Label>Street Address</Label>
              <input value={form.address} onChange={e => f('address', e.target.value)}
                placeholder="e.g. Plot 12, Dodoma Road, Arusha" className={inp} />
            </div>

            <div>
              <Label>Latitude</Label>
              <input type="number" step="any" min="-90" max="90"
                value={form.latitude} onChange={e => f('latitude', e.target.value)}
                placeholder="e.g. -3.386925" className={inp} />
              <p className="text-[11px] text-gray-400 mt-1">Decimal degrees · used for Near Me</p>
            </div>
            <div>
              <Label>Longitude</Label>
              <input type="number" step="any" min="-180" max="180"
                value={form.longitude} onChange={e => f('longitude', e.target.value)}
                placeholder="e.g. 36.682339" className={inp} />
              <p className="text-[11px] text-gray-400 mt-1">Decimal degrees · used for Near Me</p>
            </div>

            <div>
              <Label>Hotel Type</Label>
              <select value={form.category} onChange={e => f('category', e.target.value)} className={inp}>
                {hotelTypes.length > 0
                  ? hotelTypes.map(ht => <option key={ht.id} value={ht.name}>{ht.name}</option>)
                  : ['Hotel','Villa','Apartment','B&B','Lodge','Resort','Hostel','Guesthouse','Boutique','Motel','Camping','Beachfront'].map(t =>
                      <option key={t} value={t}>{t}</option>
                    )
                }
              </select>
            </div>

            <div>
              <Label>Star Rating</Label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => f('starRating', n)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      form.starRating === n
                        ? 'border-rose-400 bg-rose-50 text-rose-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {n}★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <select value={form.status} onChange={e => f('status', e.target.value as typeof STATUSES[number])} className={inp}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Descriptions ── */}
        <Section title="Descriptions">
          <div className="space-y-5">
            <div>
              <Label required>Short Description</Label>
              <input required value={form.descriptionShort} onChange={e => f('descriptionShort', e.target.value)}
                placeholder="A brief one-line summary shown on the hotel card" className={inp} />
            </div>
            <div>
              <Label>Full Description</Label>
              <textarea rows={5} value={form.descriptionLong} onChange={e => f('descriptionLong', e.target.value)}
                placeholder="Detailed description…" className={`${inp} resize-none`} />
            </div>
          </div>
        </Section>

        {/* ── Pricing & Coupon ── */}
        <Section title="Pricing & Coupon">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label required>Discount %</Label>
              <div className="relative">
                <input required type="number" min={1} max={80} value={form.discountPercent}
                  onChange={e => f('discountPercent', Number(e.target.value))}
                  className={`${inp} pr-10`} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <Label required>Coupon Valid For</Label>
              <div className="relative">
                <input required type="number" min={1} max={365} value={form.couponValidDays}
                  onChange={e => f('couponValidDays', Number(e.target.value))}
                  className={`${inp} pr-16`} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">days</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Room Types ── */}
        <Section title="Room Types" badge={rooms.length > 0 ? `${rooms.length} rooms` : undefined}>
          <div className="space-y-3 mb-5">
            {rooms.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No room types yet. Add one below.</p>
            )}
            {rooms.map(room => (
              <div key={room.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 items-center">
                <div className="min-w-0">
                  <input value={room.name}
                    onChange={e => updateRoom(room.id, 'name', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-rose-300 mb-1"
                    placeholder="Room name" />
                  <input value={room.description}
                    onChange={e => updateRoom(room.id, 'description', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-300"
                    placeholder="Optional description" />
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <label className="text-[10px] text-gray-400 font-medium">PRICE/NIGHT</label>
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" min={1} value={room.pricePerNight}
                      onChange={e => updateRoom(room.id, 'pricePerNight', Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-rose-300" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <label className="text-[10px] text-gray-400 font-medium">GUESTS</label>
                  <input type="number" min={1} max={20} value={room.maxOccupancy}
                    onChange={e => updateRoom(room.id, 'maxOccupancy', Number(e.target.value))}
                    className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-rose-300" />
                </div>
                <button type="button" onClick={() => deleteRoom(room.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add new room */}
          {roomError && <p className="text-xs text-red-500 mb-3">{roomError}</p>}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">Add New Room Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2 sm:col-span-2">
                <input value={newRoom.name}
                  onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))}
                  placeholder="Room name (e.g. Deluxe Suite)"
                  className={inp} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min={1} value={newRoom.pricePerNight}
                  onChange={e => setNewRoom(p => ({ ...p, pricePerNight: e.target.value }))}
                  placeholder="Price/night"
                  className={`${inp} pl-7`} />
              </div>
              <div>
                <input type="number" min={1} max={20} value={newRoom.maxOccupancy}
                  onChange={e => setNewRoom(p => ({ ...p, maxOccupancy: e.target.value }))}
                  placeholder="Max guests"
                  className={inp} />
              </div>
            </div>
            <div className="mb-3">
              <input value={newRoom.description}
                onChange={e => setNewRoom(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
                className={inp} />
            </div>
            <button type="button" onClick={addRoom} disabled={addingRoom}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {addingRoom
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Adding…</>
                : <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Room</>
              }
            </button>
          </div>
        </Section>

        {/* ── Contact Info ── */}
        <Section title="Contact Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Hotel Email</Label>
              <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                placeholder="info@myhotel.com" className={inp} />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <input type="tel" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)}
                placeholder="+255 712 345 678" className={inp} />
            </div>
            <div className="sm:col-span-2">
              <Label>Hotel Website</Label>
              <input type="url" value={form.websiteUrl} onChange={e => f('websiteUrl', e.target.value)}
                placeholder="https://www.myhotel.com" className={inp} />
            </div>
          </div>
        </Section>

        {/* ── Affiliate Links ── */}
        <Section title="Booking Platform Links">
          <div className="space-y-3">
            {PLATFORMS.map(p => (
              <div key={p.key} className="flex items-center gap-3">
                <div className="w-28 flex-shrink-0 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-sm font-medium text-gray-700">{p.label}</span>
                </div>
                <input type="url" value={affiliateLinks[p.key] || ''} placeholder={p.placeholder}
                  onChange={e => setAffiliateLinks(prev => ({ ...prev, [p.key]: e.target.value }))}
                  className={`${inp} flex-1`} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Photos ── */}
        <Section title="Hotel Photos">
          <p className="text-sm text-gray-500 mb-4">First photo becomes the main cover image.</p>
          <div className="space-y-3">
            {photos.map((url, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">{i + 1}</span>
                  <input type="url" value={url} onChange={e => updatePhoto(i, e.target.value)}
                    placeholder={i === 0 ? 'https://… (main cover photo)' : 'https://… (gallery photo)'}
                    className={inp} />
                  <button type="button" onClick={() => removePhotoRow(i)} disabled={photos.length === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {url && (
                  <div className="ml-8 h-24 w-36 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addPhotoRow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-colors w-full justify-center">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add another photo
            </button>
          </div>
        </Section>

        {/* ── Cover Image ── */}
        <Section title="Cover Image URL">
          <p className="text-sm text-gray-500 mb-3">Optional override. If blank, first gallery photo is used.</p>
          <input type="url" value={form.coverImage} onChange={e => f('coverImage', e.target.value)}
            placeholder="https://images.unsplash.com/…" className={inp} />
          {form.coverImage && (
            <div className="mt-3 h-40 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
            </div>
          )}
        </Section>

        {/* ── Amenities ── */}
        <Section title="Amenities" badge={selectedAmenities.length > 0 ? `${selectedAmenities.length} selected` : undefined}>
          {amenities.length === 0 ? (
            <p className="text-sm text-gray-400">No amenities yet. <Link href="/admin/amenities" className="text-rose-500 hover:underline">Add amenities first →</Link></p>
          ) : (
            <div className="space-y-5">
              {Object.entries(byCategory).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(a => {
                      const selected = selectedAmenities.includes(a.name);
                      return (
                        <button key={a.id} type="button" onClick={() => toggleAmenity(a.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            selected ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}>
                          <span>{a.icon}</span><span>{a.name}</span>
                          {selected && <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Settings ── */}
        <Section title="Settings">
          <label className="flex items-center gap-4 cursor-pointer">
            <div onClick={() => f('isFeatured', !form.isFeatured)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center cursor-pointer ${form.isFeatured ? 'bg-rose-500' : 'bg-gray-200'}`}>
              <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${form.isFeatured ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Featured Hotel</p>
              <p className="text-xs text-gray-400">Featured hotels appear at the top with a badge</p>
            </div>
          </label>

        </Section>

        {/* Submit */}
        <div className="flex items-center gap-4 pb-12">
          <button type="submit" disabled={saving}
            className="flex-1 py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#E8395A' }}>
            {saving ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Saving…</>
            ) : <>💾 Save Changes</>}
          </button>
          <Link href="/admin/hotels"
            className="px-8 py-3.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const inp = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent bg-white';

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {badge && <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">{badge}</span>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
