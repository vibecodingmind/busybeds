'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const BENEFITS = [
  { icon: '🎟️', title: 'Exclusive Coupon System', desc: 'Your guests get unique, verified discount coupons — proven to drive direct bookings.' },
  { icon: '📍', title: 'Listed on BusyBeds', desc: 'Appear in our growing directory of hotels. Travellers searching your city will find you.' },
  { icon: '📊', title: 'Owner Dashboard', desc: 'Track coupon usage, guest activity, and affiliate clicks — all in one place.' },
  { icon: '🌐', title: 'Booking Platform Links', desc: 'We link to your Booking.com, Agoda, or direct website so guests can book easily.' },
  { icon: '⭐', title: 'Review Collection', desc: 'Collect and display verified guest reviews that build trust with future travellers.' },
  { icon: '🚀', title: 'Premium Visibility', desc: 'Upgrade to appear at the top of search results, featured on the homepage, and more.' },
];

const STEPS = [
  { num: '1', title: 'Submit your application', desc: 'Fill in your hotel details below. Takes less than 2 minutes.' },
  { num: '2', title: 'We review & contact you', desc: 'Our team reviews your application within 24–48 hours and reaches out to confirm details.' },
  { num: '3', title: 'Go live on BusyBeds', desc: "Your hotel is published, your owner account is set up, and guests can start discovering you." },
];

const HOTEL_TYPES = ['Hotel', 'Resort', 'Boutique Hotel', 'Guesthouse', 'Hostel', 'Serviced Apartments', 'Lodge', 'Other'];

type FormState = {
  hotelName: string;
  hotelType: string;
  city: string;
  country: string;
  starRating: string;
  websiteUrl: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  discountPercent: string;
  notes: string;
};

const INIT: FormState = {
  hotelName: '',
  hotelType: 'Hotel',
  city: '',
  country: '',
  starRating: '3',
  websiteUrl: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  whatsapp: '',
  discountPercent: '15',
  notes: '',
};

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>(INIT);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [refId, setRefId] = useState('');

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setRefId(data.refId || '');
      setStatus('success');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Application Received!</h1>
          <p className="text-gray-500 mb-2">
            Thanks for applying to list <span className="font-semibold text-gray-800">{form.hotelName}</span> on BusyBeds.
          </p>
          <p className="text-gray-500 mb-6">
            Our team will review your application and reach out to <span className="font-semibold text-gray-800">{form.contactEmail}</span> within 24–48 hours.
          </p>
          {refId && (
            <div className="inline-block bg-white border border-gray-200 rounded-xl px-5 py-3 mb-8">
              <p className="text-xs text-gray-400 mb-1">Reference number</p>
              <p className="font-mono font-bold text-[#0E7C7B]">{refId}</p>
            </div>
          )}
          <div className="space-y-3">
            <Link href="/" className="block w-full py-3 rounded-xl font-semibold text-white text-center"
              style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }} className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            🏨 Partner Programme
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            List Your Hotel on BusyBeds
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Join our growing network of partner hotels. Give travellers exclusive coupons and watch your direct bookings grow.
          </p>
          <a href="#apply-form" className="inline-block bg-white text-[#1A3C5E] font-bold px-8 py-3 rounded-2xl hover:bg-gray-100 transition-colors shadow-lg">
            Apply Now — It&apos;s Free
          </a>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Partner with BusyBeds?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map(b => (
            <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
              <p className="text-sm text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}>
                  {s.num}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div id="apply-form" className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Partner Application</h2>
            <p className="text-sm text-gray-500">Free to apply. No commitment required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Hotel Info Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Hotel Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={form.hotelName}
                    onChange={set('hotelName')}
                    placeholder="e.g. Grand Palace Hotel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Type</label>
                    <select
                      value={form.hotelType}
                      onChange={set('hotelType')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                    >
                      {HOTEL_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                    <select
                      value={form.starRating}
                      onChange={set('starRating')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={set('city')}
                      placeholder="e.g. Nairobi"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={form.country}
                      onChange={set('country')}
                      placeholder="e.g. Kenya"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Website or Booking Page</label>
                  <input
                    type="url"
                    value={form.websiteUrl}
                    onChange={set('websiteUrl')}
                    placeholder="https://yourhotel.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Discount You&apos;d Like to Offer
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={form.discountPercent}
                      onChange={set('discountPercent')}
                      className="flex-1 accent-[#0E7C7B]"
                    />
                    <span className="text-lg font-bold text-[#FF385C] w-14 text-right">{form.discountPercent}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This is the exclusive discount BusyBeds guests will receive. Minimum 5%.</p>
                </div>
              </div>
            </div>

            {/* Contact Info Section */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Contact Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={form.contactName}
                    onChange={set('contactName')}
                    placeholder="Hotel owner or manager name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.contactEmail}
                    onChange={set('contactEmail')}
                    placeholder="you@hotel.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={set('contactPhone')}
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (optional)</label>
                    <input
                      type="tel"
                      value={form.whatsapp}
                      onChange={set('whatsapp')}
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anything else you&apos;d like us to know?</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={set('notes')}
                    placeholder="Tell us a bit about your hotel, special offers, or questions you have..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Submitting...
                </span>
              ) : 'Submit Application →'}
            </button>

            <p className="text-center text-xs text-gray-400">
              By submitting, you agree to our{' '}
              <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
              {' '}and{' '}
              <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
              We&apos;ll never share your details with third parties.
            </p>
          </form>
        </div>

        {/* Already have an account? */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already a BusyBeds partner?{' '}
            <Link href="/owner" className="font-semibold text-[#0E7C7B] hover:underline">Go to your dashboard →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
