'use client';
import { useState, useEffect } from 'react';

interface BookingRequest {
  id: string; name: string; email: string; phone?: string;
  checkIn?: string; checkOut?: string; guests: number;
  message: string; status: string; hotelNotes?: string;
  createdAt: string;
  hotel: { name: string; slug: string; city: string };
  user?: { fullName: string; email: string };
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'declined', 'cancelled'];
const STATUS_PILL: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  declined:  'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function AdminBookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<BookingRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (status = filterStatus) => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    const data = await fetch(`/api/admin/booking-requests${qs}`).then(r => r.json());
    setRequests(data.requests || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const applyFilter = (s: string) => { setFilterStatus(s); load(s); };

  const update = async (id: string, status: string, hotelNotes?: string) => {
    setSaving(true);
    await fetch(`/api/admin/booking-requests?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(hotelNotes !== undefined ? { hotelNotes } : {}) }),
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📩 Booking Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => applyFilter('')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filterStatus === '' ? 'bg-[#0E7C7B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </button>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => applyFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors capitalize ${filterStatus === s ? 'bg-[#0E7C7B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No booking requests{filterStatus ? ` with status "${filterStatus}"` : ''}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Guest</th>
                <th className="px-4 py-3 text-left">Hotel</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.email}</div>
                    {r.phone && <div className="text-xs text-gray-400">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.hotel.name}</div>
                    <div className="text-xs text-gray-400">{r.hotel.city}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.checkIn ? (
                      <>
                        {new Date(r.checkIn).toLocaleDateString()} →<br />
                        {r.checkOut ? new Date(r.checkOut).toLocaleDateString() : '?'}
                        <div className="text-gray-400">{r.guests} guest{r.guests !== 1 ? 's' : ''}</div>
                      </>
                    ) : <span className="text-gray-400">No dates</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_PILL[r.status] || 'bg-gray-100 text-gray-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setSelected(r); setNotes(r.hotelNotes || ''); }}
                      className="text-xs text-[#0E7C7B] hover:underline">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                <div><span className="text-gray-500">Hotel:</span> <strong>{selected.hotel.name}</strong></div>
                {selected.checkIn && <div><span className="text-gray-500">Check-in:</span> {new Date(selected.checkIn).toLocaleDateString()} → {selected.checkOut ? new Date(selected.checkOut).toLocaleDateString() : '?'}</div>}
                <div><span className="text-gray-500">Guests:</span> {selected.guests}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">Guest Message</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase">Hotel Notes (internal)</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] resize-none"
                  placeholder="Add internal notes…" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => update(selected.id, s, notes)} disabled={saving}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors disabled:opacity-50 ${selected.status === s ? 'bg-[#0E7C7B] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
