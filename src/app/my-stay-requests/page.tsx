'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface StayRequest {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  roomPricePerNight: number;
  totalStayCost: number;
  depositAmount: number;
  hotelReceives: number;
  discountPercent: number;
  travelerNotes: string | null;
  declineReason: string | null;
  refundAmount: number | null;
  createdAt: string;
  hotel: { id: string; name: string; slug: string; coverImage: string | null; city: string; country: string };
  roomType: { name: string; pricePerNight: number };
  coupon: { id: string; code: string; status: string; qrDataUrl: string | null; expiresAt: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  pending_approval: { label: 'Awaiting Hotel Review', color: 'bg-amber-100 text-amber-800', icon: '⏳' },
  approved:         { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  pending_payment:  { label: 'Payment Required', color: 'bg-orange-100 text-orange-800', icon: '💳' },
  paid:             { label: 'Confirmed — Check-in Ready', color: 'bg-emerald-100 text-emerald-800', icon: '🎉' },
  confirmed:        { label: 'Checked In', color: 'bg-emerald-100 text-emerald-800', icon: '🏨' },
  completed:        { label: 'Completed', color: 'bg-gray-100 text-gray-600', icon: '✓' },
  declined:         { label: 'Declined', color: 'bg-red-100 text-red-700', icon: '✗' },
  cancelled:        { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: '✗' },
  no_show:          { label: 'No Show', color: 'bg-red-100 text-red-700', icon: '✗' },
};

export default function MyStayRequestsPage() {
  const [requests, setRequests] = useState<StayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'pesapal'>('stripe');
  const [showPayModal, setShowPayModal] = useState<StayRequest | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [banner, setBanner] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const paid = searchParams.get('paid');
    const cancelled = searchParams.get('cancelled');
    const error = searchParams.get('error');
    if (paid) setBanner('Payment successful! Your QR coupon is ready below.');
    if (cancelled) setBanner('Payment was cancelled. Your request is still active.');
    if (error) setBanner('Payment failed. Please try again.');
  }, [searchParams]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/stay-requests');
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function cancelRequest(id: string) {
    if (!confirm('Are you sure you want to cancel this stay request? Refund eligibility depends on days remaining before check-in.')) return;
    setCancellingId(id);
    const res = await fetch(`/api/stay-requests/${id}/cancel`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setBanner(data.message || 'Request cancelled.');
    }
    await fetchRequests();
    setCancellingId(null);
  }

  async function initiatePayment(req: StayRequest) {
    setPayingId(req.id);
    const res = await fetch(`/api/stay-requests/${req.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setBanner(data.error || 'Payment failed. Please try again.');
      setPayingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Stay Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Track your extended stay bookings</p>
          </div>
          <Link href="/" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Browse Hotels
          </Link>
        </div>

        {/* Banner */}
        {banner && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center justify-between gap-3">
            <span>{banner}</span>
            <button onClick={() => setBanner('')} className="text-blue-400 hover:text-blue-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="mx-auto mb-4 text-gray-300">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="font-semibold text-gray-700 mb-1">No stay requests yet</p>
            <p className="text-sm text-gray-400 mb-4">Find a hotel you love and submit an extended stay request.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors">
              Browse Hotels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => {
              const statusInfo = STATUS_LABELS[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-600', icon: '•' };
              const img = req.hotel.coverImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
              const canPay = req.status === 'pending_payment';
              const canCancel = ['pending_approval', 'approved', 'pending_payment', 'paid', 'confirmed'].includes(req.status);

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Hotel image */}
                    <Link href={`/hotels/${req.hotel.slug}`} className="sm:w-40 h-40 sm:h-auto flex-shrink-0">
                      <img src={img} alt={req.hotel.name} className="w-full h-full object-cover" />
                    </Link>

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                              {statusInfo.icon} {statusInfo.label}
                            </span>
                          </div>
                          <Link href={`/hotels/${req.hotel.slug}`} className="font-bold text-gray-900 hover:text-emerald-700 transition-colors">
                            {req.hotel.name}
                          </Link>
                          <p className="text-sm text-gray-500">{req.hotel.city}, {req.hotel.country}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Check-in</p>
                          <p className="font-semibold text-gray-800">{new Date(req.checkIn).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Check-out</p>
                          <p className="font-semibold text-gray-800">{new Date(req.checkOut).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Room</p>
                          <p className="font-semibold text-gray-800">{req.roomType.name}</p>
                          <p className="text-xs text-gray-400">{req.nights} nights · {req.guests} guest{req.guests !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Deposit</p>
                          <p className="font-bold text-gray-900">${req.depositAmount.toFixed(2)}</p>
                          <p className="text-xs text-emerald-600">{req.discountPercent}% discount</p>
                        </div>
                      </div>

                      {/* Decline reason */}
                      {req.status === 'declined' && req.declineReason && (
                        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-700">
                          Decline reason: {req.declineReason}
                        </div>
                      )}

                      {/* Refund info */}
                      {req.status === 'cancelled' && req.refundAmount !== null && (
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-700">
                          {req.refundAmount > 0
                            ? `Refund of $${req.refundAmount.toFixed(2)} has been initiated.`
                            : 'No refund — cancelled within 3 days of check-in.'}
                        </div>
                      )}

                      {/* QR code (when paid/confirmed) */}
                      {req.coupon && ['paid', 'confirmed'].includes(req.status) && (
                        <div className="mt-3 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          {req.coupon.qrDataUrl && (
                            <img
                              src={req.coupon.qrDataUrl}
                              alt="QR coupon"
                              className="w-14 h-14 rounded-lg cursor-pointer border border-emerald-200"
                              onClick={() => setShowQR(req.coupon!.qrDataUrl)}
                            />
                          )}
                          <div>
                            <p className="text-sm font-bold text-emerald-800">Your Coupon is Ready</p>
                            <p className="text-xs text-emerald-600 font-mono tracking-wider">{req.coupon.code}</p>
                            <p className="text-xs text-emerald-600">Show this QR code at hotel reception</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {canPay && (
                          <button
                            onClick={() => setShowPayModal(req)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            Pay Deposit (${req.depositAmount.toFixed(2)})
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => cancelRequest(req.id)}
                            disabled={cancellingId === req.id}
                            className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
                          >
                            {cancellingId === req.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment method modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pay Deposit</h3>
              <button onClick={() => setShowPayModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm">
              <p className="font-semibold text-gray-800 mb-1">{showPayModal.hotel.name}</p>
              <p className="text-gray-500">{showPayModal.nights} nights · {showPayModal.roomType.name}</p>
              <div className="flex justify-between mt-3 font-bold text-base text-gray-900">
                <span>Deposit (25%)</span>
                <span>${showPayModal.depositAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Non-refundable within 3 days of check-in</p>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">Select payment method</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(['stripe', 'paypal', 'pesapal'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    paymentMethod === m ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m === 'stripe' ? '💳 Card' : m === 'paypal' ? 'PayPal' : 'Pesapal'}
                </button>
              ))}
            </div>

            <button
              onClick={() => { initiatePayment(showPayModal); setShowPayModal(null); }}
              disabled={!!payingId}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {payingId ? 'Redirecting...' : `Pay $${showPayModal.depositAmount.toFixed(2)} with ${paymentMethod === 'stripe' ? 'Card' : paymentMethod === 'paypal' ? 'PayPal' : 'Pesapal'}`}
            </button>
          </div>
        </div>
      )}

      {/* QR fullscreen */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowQR(null)}>
          <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full">
            <h3 className="font-bold text-gray-900 mb-4">Show at Reception</h3>
            <img src={showQR} alt="QR code" className="w-full rounded-xl" />
            <p className="text-xs text-gray-400 mt-3">Tap anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
