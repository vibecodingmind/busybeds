'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface BookingRequest {
  id: string; name: string; email: string; guests: number;
  checkIn?: string; checkOut?: string; message: string;
  status: string; hotelNotes?: string; createdAt: string;
  hotel: { name: string; slug: string; coverImage: string | null; city: string };
}

const STATUS_PILL: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  declined:  'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_ICON: Record<string, string> = {
  pending: '⏳', confirmed: '✅', declined: '❌', cancelled: '🚫',
};

export default function MyBookingsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/booking-requests')
      .then(r => {
        if (r.status === 401) { router.push('/login?next=/my-bookings'); return null; }
        return r.json();
      })
      .then(d => { if (d) { setRequests(d.requests || []); setLoading(false); } })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📩 My Booking Requests</h1>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">No booking requests yet</p>
            <p className="text-gray-400 text-sm mt-1">Find a hotel and send a booking request to get started.</p>
            <Link href="/" className="mt-4 inline-block bg-[#0E7C7B] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a6160] transition-colors">
              Browse Hotels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex gap-4 p-5">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {r.hotel.coverImage
                      ? <img src={r.hotel.coverImage} alt={r.hotel.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🏨</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={`/hotels/${r.hotel.slug}`} className="font-bold text-gray-900 hover:text-[#0E7C7B] transition-colors truncate">
                        {r.hotel.name}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0 ${STATUS_PILL[r.status] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_ICON[r.status]} {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{r.hotel.city}</p>
                    {(r.checkIn || r.checkOut) && (
                      <p className="text-xs text-gray-600">
                        📅 {r.checkIn ? new Date(r.checkIn).toLocaleDateString() : '?'}
                        {r.checkOut ? ` → ${new Date(r.checkOut).toLocaleDateString()}` : ''}
                        {' · '}{r.guests} guest{r.guests !== 1 ? 's' : ''}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Sent {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {r.hotelNotes && (
                  <div className="bg-blue-50 border-t border-blue-100 px-5 py-3">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Hotel Response</p>
                    <p className="text-sm text-blue-800">{r.hotelNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
