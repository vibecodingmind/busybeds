'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Hotel {
  name: string; city: string; country: string; slug: string;
  descriptionShort: string; descriptionLong: string; address: string | null;
  email: string | null; whatsapp: string | null; websiteUrl: string | null;
  coverImage: string | null;
  socialFacebook: string | null; socialInstagram: string | null;
  socialTwitter: string | null; socialTiktok: string | null;
}

export default function OwnerEditHotelPage() {
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [kycStatus, setKycStatus] = useState('');
  const [form, setForm] = useState<Partial<Hotel>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/owner/hotel')
      .then(r => r.json())
      .then(d => {
        setHotel(d.hotel);
        setKycStatus(d.kycStatus);
        setForm({
          descriptionShort: d.hotel?.descriptionShort || '',
          descriptionLong:  d.hotel?.descriptionLong || '',
          address:          d.hotel?.address || '',
          email:            d.hotel?.email || '',
          whatsapp:         d.hotel?.whatsapp || '',
          websiteUrl:       d.hotel?.websiteUrl || '',
          coverImage:       d.hotel?.coverImage || '',
          socialFacebook:   d.hotel?.socialFacebook || '',
          socialInstagram:      d.hotel?.socialInstagram || '',
          socialTwitter:        d.hotel?.socialTwitter || '',
          socialTiktok:         d.hotel?.socialTiktok || '',
        });
        setLoading(false);
      })
      .catch(() => { setError('Failed to load hotel'); setLoading(false); });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/owner/hotel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to save'); setSaving(false); return; }
    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const field = (key: keyof Hotel, label: string, type: 'text' | 'textarea' | 'url' = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea rows={4} value={(form[key] as string) || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] resize-none" />
      ) : (
        <input type={type} value={(form[key] as string) || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/owner" className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Hotel Details</h1>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : !hotel ? (
          <p className="text-red-600">{error || 'No hotel found.'}</p>
        ) : kycStatus !== 'approved' ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <p className="text-yellow-800 font-semibold">KYC Not Yet Approved</p>
            <p className="text-yellow-700 text-sm mt-1">You can edit hotel details once your KYC is approved by admin.</p>
            <Link href="/owner" className="mt-4 inline-block text-sm text-[#0E7C7B] hover:underline">← Back to Dashboard</Link>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Basic Info <span className="text-gray-400 font-normal text-sm">(name, city, country managed by admin)</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('descriptionShort', 'Short Description')}
                {field('coverImage', 'Cover Image URL', 'url')}
                {field('address', 'Address')}
              </div>
              <div className="mt-4">{field('descriptionLong', 'Full Description', 'textarea')}</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Contact Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('email', 'Contact Email')}
                {field('whatsapp', 'WhatsApp Number')}
                {field('websiteUrl', 'Website URL', 'url')}
              </div>

            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Social Media</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('socialFacebook', 'Facebook URL', 'url')}
                {field('socialInstagram', 'Instagram URL', 'url')}
                {field('socialTwitter', 'X / Twitter URL', 'url')}
                {field('socialTiktok', 'TikTok URL', 'url')}
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm font-semibold">✓ Changes saved successfully!</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-[#0E7C7B] hover:bg-[#0a6160] disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href="/owner" className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
