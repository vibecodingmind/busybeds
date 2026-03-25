'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { COUNTRIES, CITIES_BY_COUNTRY } from '@/lib/locations';

interface Amenity { id: string; name: string; icon: string; category: string; }
interface HotelType { id: string; name: string; }

const PLATFORMS = [
  { key: 'booking_com',  label: 'Booking.com',  placeholder: 'https://www.booking.com/hotel/...', color: '#003580' },
  { key: 'airbnb',       label: 'Airbnb',        placeholder: 'https://www.airbnb.com/rooms/...', color: '#FF5A5F' },
  { key: 'expedia',      label: 'Expedia',        placeholder: 'https://www.expedia.com/...', color: '#00355F' },
  { key: 'agoda',        label: 'Agoda',          placeholder: 'https://www.agoda.com/...', color: '#5392CE' },
  { key: 'tripadvisor',  label: 'TripAdvisor',    placeholder: 'https://www.tripadvisor.com/Hotel_Review-...', color: '#00A680' },
];

export default function AddHotelPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [hotelTypes, setHotelTypes] = useState<HotelType[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Gallery photos (list of URLs)
  const [photos, setPhotos] = useState<string[]>(['']);

  // Affiliate links per platform
  const [affiliateLinks, setAffiliateLinks] = useState<Record<string, string>>(
    Object.fromEntries(PLATFORMS.map(p => [p.key, '']))
  );

  const [form, setForm] = useState({
    name: '',
    country: 'Tanzania',
    city: '',
    address: '',
    category: 'Hotel',
    starRating: 4,
    discountPercent: 15,
    couponValidDays: 30,
    pricePerNight: '',
    roomName: 'Standard Room',
    descriptionShort: '',
    descriptionLong: '',
    coverImage: '',
    websiteUrl: '',
    email: '',
    whatsapp: '',
    socialFacebook: '',
    socialInstagram: '',
    socialTwitter: '',
    socialTiktok: '',
    isFeatured: false,
    latitude: '',
    longitude: '',
  });

  const cities = CITIES_BY_COUNTRY[form.country] || [];

  useEffect(() => {
    fetch('/api/amenities').then(r => r.json()).then(d => setAmenities(d.amenities || [])).catch(() => {});
    fetch('/api/hotel-types').then(r => r.json()).then(d => setHotelTypes(d.types || [])).catch(() => {});
  }, []);

  // When country changes, reset city
  const handleCountryChange = (country: string) => {
    setForm(prev => ({ ...prev, country, city: '' }));
  };

  const toggleAmenity = (name: string) =>
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );

  const byCategory = amenities.reduce((acc: Record<string, Amenity[]>, a) => {
    const cat = a.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  const f = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const addPhotoRow = () => setPhotos(prev => [...prev, '']);
  const removePhotoRow = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i));
  const updatePhoto = (i: number, val: string) =>
    setPhotos(prev => prev.map((p, idx) => idx === i ? val : p));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Build valid affiliate links
      const validLinks = PLATFORMS
        .filter(p => affiliateLinks[p.key]?.trim())
        .map(p => ({ platform: p.key, url: affiliateLinks[p.key].trim() }));

      // Build valid photos
      const validPhotos = photos.filter(p => p.trim());

      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          starRating: Number(form.starRating),
          discountPercent: Number(form.discountPercent),
          couponValidDays: Number(form.couponValidDays),
          pricePerNight: form.pricePerNight ? Number(form.pricePerNight) : undefined,
          amenities: selectedAmenities,
          photos: validPhotos,
          affiliateLinks: validLinks,
          websiteUrl: form.websiteUrl || undefined,
          coverImage: form.coverImage || undefined,
          email: form.email || undefined,
          whatsapp: form.whatsapp || undefined,
          socialFacebook:  form.socialFacebook  || undefined,
          socialInstagram: form.socialInstagram || undefined,
          socialTwitter:   form.socialTwitter   || undefined,
          socialTiktok:    form.socialTiktok    || undefined,
          address:   form.address   || undefined,
          latitude:  form.latitude  ? parseFloat(form.latitude)  : undefined,
          longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to add hotel. Check all fields.');
        return;
      }
      router.push('/admin');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>


      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin" className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add New Hotel</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fill in all hotel details below</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">{error}</div>
        )}

        {/* ── Basic Info ── */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div className="sm:col-span-2">
              <Label required>Hotel Name</Label>
              <input required value={form.name} onChange={e => f('name', e.target.value)}
                placeholder="e.g. The Grand Serengeti Lodge"
                className={input} />
            </div>

            {/* Country first */}
            <div>
              <Label required>Country</Label>
              <select value={form.country} onChange={e => handleCountryChange(e.target.value)} className={input}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* City — dropdown if country has cities */}
            <div>
              <Label required>City / Region</Label>
              {cities.length > 0 ? (
                <select required value={form.city} onChange={e => f('city', e.target.value)} className={input}>
                  <option value="">Select city…</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input required value={form.city} onChange={e => f('city', e.target.value)}
                  placeholder="Enter city name" className={input} />
              )}
            </div>

            <div className="sm:col-span-2">
              <Label>Street Address</Label>
              <input value={form.address} onChange={e => f('address', e.target.value)}
                placeholder="e.g. Plot 12, Dodoma Road, Arusha" className={input} />
            </div>

            {/* Coordinates */}
            <div>
              <Label>Latitude</Label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                <input
                  type="number"
                  step="any"
                  min="-90" max="90"
                  value={form.latitude}
                  onChange={e => f('latitude', e.target.value)}
                  placeholder="e.g. -3.386925"
                  className={input}
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Decimal degrees · −90 to 90 · used for Near Me</p>
            </div>
            <div>
              <Label>Longitude</Label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                <input
                  type="number"
                  step="any"
                  min="-180" max="180"
                  value={form.longitude}
                  onChange={e => f('longitude', e.target.value)}
                  placeholder="e.g. 36.682339"
                  className={input}
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Decimal degrees · −180 to 180 · used for Near Me</p>
            </div>

            {/* Hotel Type */}
            <div>
              <Label>Hotel Type</Label>
              <select value={form.category} onChange={e => f('category', e.target.value)} className={input}>
                {hotelTypes.length > 0
                  ? hotelTypes.map(ht => <option key={ht.id} value={ht.name}>{ht.name}</option>)
                  : ['Hotel','Villa','Apartment','B&B','Lodge','Resort','Hostel','Guesthouse','Boutique','Motel','Camping','Beachfront'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))
                }
              </select>
            </div>

            {/* Star Rating */}
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
          </div>
        </Section>

        {/* ── Descriptions ── */}
        <Section title="Descriptions">
          <div className="space-y-5">
            <div>
              <Label required>Short Description</Label>
              <input required value={form.descriptionShort} onChange={e => f('descriptionShort', e.target.value)}
                placeholder="A brief one-line summary shown on the hotel card" className={input} />
            </div>
            <div>
              <Label required>Full Description</Label>
              <textarea required rows={5} value={form.descriptionLong} onChange={e => f('descriptionLong', e.target.value)}
                placeholder="Detailed description — facilities, nearby attractions, what makes this hotel special…"
                className={`${input} resize-none`} />
            </div>
          </div>
        </Section>

        {/* ── Pricing & Coupon ── */}
        <Section title="Pricing & Coupon">
          {/* Helpful tip */}
          <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-medium text-blue-800">Quick Start Tip</p>
              <p className="text-xs text-blue-600 mt-0.5">Add one room now to get started. You can add more room types (Deluxe, Suite, etc.) in the Edit page after saving.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Starting Price (per night)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input type="number" min={0} value={form.pricePerNight}
                  onChange={e => f('pricePerNight', e.target.value)}
                  placeholder="0"
                  className={`${input} pl-8`} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Creates a default room with this price</p>
            </div>

            <div>
              <Label>Room Name</Label>
              <input value={form.roomName} onChange={e => f('roomName', e.target.value)}
                placeholder="e.g. Standard Room, Deluxe, Suite" className={input} />
            </div>

            <div>
              <Label required>Discount %</Label>
              <div className="relative">
                <input required type="number" min={0} max={80} value={form.discountPercent}
                  onChange={e => f('discountPercent', e.target.value as unknown as number)}
                  className={`${input} pr-10`} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Set 0% for hotels without coupon discount</p>
            </div>

            <div>
              <Label required>Coupon Valid For</Label>
              <div className="relative">
                <input required type="number" min={1} max={365} value={form.couponValidDays}
                  onChange={e => f('couponValidDays', e.target.value as unknown as number)}
                  className={`${input} pr-16`} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">days</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Contact Info ── */}
        <Section title="Contact Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Hotel Email</Label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                  placeholder="info@myhotel.com" className={`${input} pl-10`} />
              </div>
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <input type="tel" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)}
                  placeholder="+255 712 345 678" className={`${input} pl-10`} />
              </div>
            </div>
            <div>
              <Label>Hotel Website</Label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                <input type="url" value={form.websiteUrl} onChange={e => f('websiteUrl', e.target.value)}
                  placeholder="https://www.myhotel.com" className={`${input} pl-10`} />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Social Media ── */}
        <Section title="Social Media">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { key: 'socialFacebook',  label: 'Facebook',  placeholder: 'https://facebook.com/myhotel', color: '#1877F2',
                icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/> },
              { key: 'socialInstagram', label: 'Instagram', placeholder: 'https://instagram.com/myhotel', color: '#E1306C',
                icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></> },
              { key: 'socialTwitter',   label: 'X (Twitter)', placeholder: 'https://x.com/myhotel', color: '#000000',
                icon: <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/> },
              { key: 'socialTiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@myhotel', color: '#000000',
                icon: <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/> },
            ].map(({ key, label, placeholder, color, icon }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                  <input type="url" value={form[key as keyof typeof form] as string}
                    onChange={e => f(key as keyof typeof form, e.target.value as never)}
                    placeholder={placeholder} className={`${input} pl-10`} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Affiliate Links ── */}
        <Section title="Booking Platform Links">
          <p className="text-sm text-gray-500 mb-4">Add links to this hotel on partner platforms. Subscribers can see these.</p>
          <div className="space-y-3">
            {PLATFORMS.map(p => (
              <div key={p.key} className="flex items-center gap-3">
                <div className="w-28 flex-shrink-0 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-sm font-medium text-gray-700">{p.label}</span>
                </div>
                <input type="url" value={affiliateLinks[p.key] || ''} placeholder={p.placeholder}
                  onChange={e => setAffiliateLinks(prev => ({ ...prev, [p.key]: e.target.value }))}
                  className={`${input} flex-1`} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Photos ── */}
        <Section title="Hotel Photos">
          <p className="text-sm text-gray-500 mb-4">Add photo URLs for the hotel gallery. First photo will be the main cover.</p>
          <div className="space-y-3">
            {photos.map((url, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                      {i + 1}
                    </span>
                    <input type="url" value={url} onChange={e => updatePhoto(i, e.target.value)}
                      placeholder={i === 0 ? 'https://… (main cover photo)' : 'https://… (gallery photo)'}
                      className={input} />
                    <button type="button" onClick={() => removePhotoRow(i)}
                      disabled={photos.length === 1}
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
              </div>
            ))}
            <button type="button" onClick={addPhotoRow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-colors w-full justify-center">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add another photo
            </button>
          </div>
        </Section>

        {/* ── Cover Image separate ── */}
        <Section title="Cover Image URL">
          <p className="text-sm text-gray-500 mb-3">Optional fallback cover. If left empty, the first gallery photo is used.</p>
          <input type="url" value={form.coverImage} onChange={e => f('coverImage', e.target.value)}
            placeholder="https://images.unsplash.com/…" className={input} />
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
            style={{ background: '#FF385C' }}>
            {saving ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Saving…</>
            ) : '+ Add Hotel'}
          </button>
          <Link href="/admin" className="px-8 py-3.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

// ── Reusable sub-components ──
const input = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent bg-white';

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
