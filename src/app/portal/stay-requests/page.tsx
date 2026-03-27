'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  platformFeeAmount: number;
  discountPercent: number;
  travelerNotes: string | null;
  approvalDeadline: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  declineReason: string | null;
  createdAt: string;
  roomType: { name: string; pricePerNight: number };
  traveler: { id: string; fullName: string; email: string; phone: string | null };
  coupon: { code: string; status: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Awaiting Your Review', color: 'bg-amber-100 text-amber-800' },
  approved:         { label: 'Approved — Awaiting Payment', color: 'bg-blue-100 text-blue-800' },
  pending_payment:  { label: 'Awaiting Payment', color: 'bg-blue-100 text-blue-800' },
  paid:             { label: 'Paid — Confirm Check-in', color: 'bg-emerald-100 text-emerald-800' },
  confirmed:        { label: 'Checked In', color: 'bg-emerald-100 text-emerald-800' },
  completed:        { label: 'Completed', color: 'bg-gray-100 text-gray-600' },
  declined:         { label: 'Declined', color: 'bg-red-100 text-red-700' },
  cancelled:        { label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
  no_show:          { label: 'No Show', color: 'bg-red-100 text-red-700' },
};

export default function PortalStayRequestsPage() {
  const [requests, setRequests] = useState<StayRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('pending_approval');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<{ id: string } | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/portal/stay-requests');
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function approve(id: string) {
    setActionLoading(id + '-approve');
    await fetch(`/api/stay-requests/${id}/approve`, { method: 'POST' });
    await fetchRequests();
    setActionLoading(null);
  }

  async function decline(id: string, reason: string) {
    setActionLoading(id + '-decline');
    await fetch(`/api/stay-requests/${id}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setDeclineModal(null);
    setDeclineReason('');
    await fetchRequests();
    setActionLoading(null);
  }

  async function confirmCheckin(id: string) {
    setActionLoading(id + '-confirm');
    await fetch(`/api/stay-requests/${id}/confirm`, { method: 'POST' });
    await fetchRequests();
    setActionLoading(null);
  }

  const tabs = [
    { key: 'pending_approval', label: 'Pending Review' },
    { key: 'pending_payment', label: 'Awaiting Payment' },
    { key: 'paid', label: 'Confirmed' },
    { key: 'confirmed', label: 'Checked In' },
    { key: 'all', label: 'All' },
  ];

  const filtered = activeTab === 'all'
    ? requests
    : requests.filter(r => r.status === activeTab);

  const pendingCount = requests.filter(r => r.status === 'pending_approval').length;
  const paidCount = requests.filter(r => r.status === 'paid').length;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stay Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage traveler booking requests</p>
          </div>
          <Link href="/portal" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Portal
          </Link>
        </div>

        {/* Alert banners */}
        {pendingCount > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-amber-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0 text-amber-600">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><strong>{pendingCount} request{pendingCount !== 1 ? 's' : ''}</strong> awaiting your review. Please respond within 48 hours.</span>
          </div>
        )}
        {paidCount > 0 && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-emerald-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="flex-shrink-0 text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span><strong>{paidCount} confirmed booking{paidCount !== 1 ? 's' : ''}</strong> — confirm check-in when the traveler arrives.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const count = tab.key === 'all' ? requests.length : requests.filter(r => r.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-max px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="mx-auto mb-3 text-gray-300">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="font-medium">No requests in this category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => {
              const statusInfo = STATUS_LABELS[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-600' };
              const checkInDate = new Date(req.checkIn);
              const daysUntil = Math.round((checkInDate.getTime() - Date.now()) / 86400000);
              const isUrgent = req.status === 'pending_approval' && req.approvalDeadline
                ? new Date(req.approvalDeadline).getTime() - Date.now() < 6 * 3600000
                : false;

              return (
                <div key={req.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isUrgent ? 'border-amber-300' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      {/* Status + urgency */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                        {isUrgent && <span className="text-xs font-bold text-red-600 animate-pulse">⚡ Deadline soon</span>}
                      </div>

                      {/* Guest info */}
                      <h3 className="font-bold text-gray-900 text-base">{req.traveler.fullName}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          {req.traveler.email}
                        </span>
                        {req.traveler.phone && (
                          <span className="flex items-center gap-1">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                            {req.traveler.phone}
                          </span>
                        )}
                      </div>

                      {/* Stay details */}
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
                          <p className="font-semibold text-gray-800">{checkInDate.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          {daysUntil >= 0 && <p className="text-xs text-gray-400">{daysUntil === 0 ? 'Today!' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}</p>}
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
                          <p className="font-semibold text-gray-800">{new Date(req.checkOut).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-gray-400">{req.nights} night{req.nights !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-gray-400 mb-0.5">Room</p>
                          <p className="font-semibold text-gray-800">{req.roomType.name}</p>
                          <p className="text-xs text-gray-400">{req.guests} guest{req.guests !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-emerald-600 mb-0.5">You receive</p>
                          <p className="font-bold text-emerald-800 text-base">${req.hotelReceives.toFixed(2)}</p>
                          <p className="text-xs text-emerald-600">deposit</p>
                        </div>
                      </div>

                      {/* Traveler notes */}
                      {req.travelerNotes && (
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-700">
                          <span className="font-semibold">Guest note: </span>{req.travelerNotes}
                        </div>
                      )}

                      {/* Coupon code if paid */}
                      {req.coupon && (
                        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                          </svg>
                          Coupon code: <span className="font-bold tracking-wider">{req.coupon.code}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {req.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => approve(req.id)}
                            disabled={actionLoading === req.id + '-approve'}
                            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                          >
                            {actionLoading === req.id + '-approve' ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => setDeclineModal({ id: req.id })}
                            className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {req.status === 'paid' && (
                        <button
                          onClick={() => confirmCheckin(req.id)}
                          disabled={actionLoading === req.id + '-confirm'}
                          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                        >
                          {actionLoading === req.id + '-confirm' ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 13.5a19.79 19.79 0 01-1-5.45A2 2 0 014.11 6h3a2 2 0 012 1.72"/></svg>
                          )}
                          Confirm Check-in
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decline modal */}
      {declineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Decline Request</h3>
            <p className="text-sm text-gray-500 mb-4">Let the traveler know why you're declining (optional but helpful).</p>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              placeholder="e.g. Room not available on those dates, fully booked..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeclineModal(null); setDeclineReason(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => decline(declineModal.id, declineReason)}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
