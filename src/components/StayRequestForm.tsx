'use client';
import { useState } from 'react';
import Link from 'next/link';

interface RoomType {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxOccupancy: number;
}

interface Props {
  hotelId: string;
  hotelName: string;
  roomTypes: RoomType[];
  discountPercent: number;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StayRequestForm({ hotelId, hotelName, roomTypes, discountPercent, initialCheckIn, initialCheckOut, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(initialCheckIn || tomorrow);
  const [checkOut, setCheckOut] = useState(initialCheckOut || '');
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id || '');
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const selectedRoom = roomTypes.find(r => r.id === roomTypeId);
  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  const totalStayCost = selectedRoom ? selectedRoom.pricePerNight * nights : 0;
  const depositAmount = Math.round(totalStayCost * 0.25 * 100) / 100;
  const discountedTotal = selectedRoom
    ? Math.round(totalStayCost * (1 - discountPercent / 100) * 100) / 100
    : 0;
  const remainingAtHotel = discountedTotal - depositAmount > 0 ? discountedTotal - depositAmount : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!checkIn || !checkOut) { setError('Please select check-in and check-out dates.'); return; }
    if (nights < 1) { setError('Check-out must be after check-in.'); return; }
    if (!roomTypeId) { setError('Please select a room type.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/stay-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, roomTypeId, checkIn, checkOut, guests, travelerNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          setError('Stay Requests require a Premium subscription. Please upgrade your plan.');
        } else {
          setError(data.error || 'Failed to submit request.');
        }
        return;
      }
      setRequestId(data.stayRequest?.id || null);
      setSubmitted(true);
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Request a Stay</h2>
            <p className="text-sm text-gray-500">{hotelName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Success screen ── */}
        {submitted && (
          <div className="px-6 py-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.5} strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Request Sent!</h3>
              <p className="text-sm text-gray-500">{hotelName} will review your request within 48 hours.</p>
            </div>

            {/* Step-by-step next actions */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">What happens next</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-gray-700">Hotel reviews and approves your request <span className="font-semibold">(within 48h)</span></p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-gray-700">You pay the <span className="font-bold text-amber-800">${depositAmount > 0 ? depositAmount.toFixed(2) : '25%'} deposit</span> to lock your dates</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-gray-700">Your <span className="font-semibold">date-locked QR coupon</span> is issued — show it at check-in</p>
                </div>
              </div>
            </div>

            <Link
              href="/my-stay-requests"
              className="block w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors text-center"
            >
              View My Requests & Pay Deposit →
            </Link>
            <button
              onClick={onClose}
              className="block w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Form ── */}
        {!submitted && (
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Check-in</label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Check-out</label>
              <input
                type="date"
                min={checkIn || tomorrow}
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Room Type</label>
            <select
              value={roomTypeId}
              onChange={e => setRoomTypeId(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {roomTypes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} — ${r.pricePerNight.toFixed(0)}/night · Up to {r.maxOccupancy} guest{r.maxOccupancy !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Guests */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Guests</label>
            <select
              value={guests}
              onChange={e => setGuests(parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {Array.from({ length: selectedRoom?.maxOccupancy || 4 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} guest{n !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes to hotel (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Any special requests or questions..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Pricing summary */}
          {nights > 0 && selectedRoom && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="font-semibold text-gray-800 mb-3">Pricing Summary</div>
              <div className="flex justify-between text-gray-600">
                <span>${selectedRoom.pricePerNight.toFixed(0)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                <span>${totalStayCost.toFixed(0)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Your {discountPercent}% discount</span>
                  <span>−${(totalStayCost - discountedTotal).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-800 font-semibold border-t border-gray-200 pt-2">
                <span>Total after discount</span>
                <span>${discountedTotal.toFixed(0)}</span>
              </div>
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
                <div className="flex justify-between font-bold text-amber-800">
                  <span>Deposit required (25%)</span>
                  <span>${depositAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-amber-600">
                  <span>Paid to hotel at check-in</span>
                  <span>${remainingAtHotel.toFixed(2)}</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">Deposit is non-refundable within 3 days of check-in.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* How it works */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Hotel has 48 hours to approve or decline your request</p>
            <p>• After approval, pay the 25% deposit to confirm</p>
            <p>• Your date-locked QR coupon is generated instantly</p>
            <p>• Show QR at check-in to redeem your discount</p>
          </div>

          <button
            type="submit"
            disabled={loading || nights < 1}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              nights > 0
                ? `Submit Request · ${nights} night${nights !== 1 ? 's' : ''} · $${depositAmount.toFixed(2)} deposit`
                : 'Select dates to continue'
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
