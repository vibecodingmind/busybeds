'use client';
import { useState } from 'react';

interface Props {
  hotelId: string;
  hotelName: string;
  roomTypes: Array<{ id: string; name: string; pricePerNight: number }>;
  prefillName?: string;
  prefillEmail?: string;
}

export default function BookingRequestForm({ hotelId, hotelName, roomTypes, prefillName = '', prefillEmail = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: prefillName, email: prefillEmail, phone: '', checkIn: '', checkOut: '', guests: 1, roomTypeId: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/booking-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, hotelId, guests: Number(form.guests) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to send request'); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#0E7C7B] text-[#0E7C7B] text-sm font-semibold hover:bg-[#0E7C7B]/5 transition-colors">
        📩 Send Booking Request
      </button>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-bold text-green-800">Request Sent!</p>
        <p className="text-sm text-green-600 mt-1">The hotel will contact you at <strong>{form.email}</strong> shortly.</p>
        <button onClick={() => { setOpen(false); setSuccess(false); }}
          className="mt-3 text-xs text-green-700 underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">📩 Booking Request</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
            <input type="date" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
            <input type="date" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
              min={form.checkIn || new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
            <input type="number" min={1} max={30} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]" />
          </div>
          {roomTypes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Room Type</label>
              <select value={form.roomTypeId} onChange={e => setForm(f => ({ ...f, roomTypeId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]">
                <option value="">Any room</option>
                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
          <textarea required rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder={`Hi, I'm interested in staying at ${hotelName}…`}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] resize-none" />
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-[#0E7C7B] hover:bg-[#0a6160] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
          {loading ? 'Sending…' : 'Send Request'}
        </button>
      </form>
    </div>
  );
}
