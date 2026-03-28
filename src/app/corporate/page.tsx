'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Member {
  id: string;
  fullName: string;
  email: string;
}

interface CorporateAccount {
  id: string;
  companyName: string;
  industry?: string;
  country: string;
  contactEmail: string;
  contactPhone?: string;
  maxSeats: number;
  status: string;
  notes?: string;
  createdAt: string;
  adminUser: { id: string; fullName: string; email: string };
  members: Member[];
  subscriptions: Array<{
    id: string;
    expiresAt: string;
    package: { name: string; couponLimitPerPeriod: number };
  }>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ApplyForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    companyName: '', industry: '', country: 'Tanzania',
    contactEmail: '', contactPhone: '', maxSeats: '10', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxSeats: Number(form.maxSeats) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); return; }
      onCreated();
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Apply for a Corporate Account</h2>
          <p className="text-sm text-gray-500">Give your whole team access to hotel discounts</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Tourism, Finance, NGO"
              value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+255 ..."
              value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Seats *</label>
            <input type="number" min="2" max="500" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.maxSeats} onChange={e => setForm(f => ({ ...f, maxSeats: e.target.value }))} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about your company's travel needs..."
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
          <strong>What happens next?</strong> Our team will review your application within 24 hours. Once approved, you can subscribe to a plan that covers all your seats and invite team members.
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}

function CorporateDashboard({ account, isAdmin, onRefresh }: {
  account: CorporateAccount;
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const activeSub = account.subscriptions[0];
  const seatsFilled = account.members.length;
  const seatsTotal = account.maxSeats;
  const seatsPct = Math.min(100, Math.round((seatsFilled / seatsTotal) * 100));

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg('');
    try {
      const res = await fetch('/api/corporate/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteMsg(data.error || 'Error'); return; }
      setInviteMsg(data.registered ? `${inviteEmail} has been added!` : `Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      onRefresh();
    } catch { setInviteMsg('Network error'); }
    finally { setInviteLoading(false); }
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the corporate account?')) return;
    await fetch('/api/corporate/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    onRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Corporate Account</p>
            <h2 className="text-2xl font-bold">{account.companyName}</h2>
            {account.industry && <p className="text-blue-200 text-sm mt-1">{account.industry} · {account.country}</p>}
          </div>
          <StatusBadge status={account.status} />
        </div>

        {account.status === 'pending' && (
          <div className="mt-4 bg-white/10 rounded-xl p-3 text-sm">
            ⏳ Your application is under review. We'll notify you by email once approved (usually within 24 hours).
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{seatsFilled}</p>
            <p className="text-xs text-blue-100">Members</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{seatsTotal}</p>
            <p className="text-xs text-blue-100">Total Seats</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{activeSub ? '✓' : '✗'}</p>
            <p className="text-xs text-blue-100">Active Plan</p>
          </div>
        </div>

        {/* Seat usage bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-blue-100 mb-1">
            <span>Seat usage</span>
            <span>{seatsFilled}/{seatsTotal}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${seatsPct}%` }} />
          </div>
        </div>
      </div>

      {/* Active Subscription */}
      {activeSub ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Active Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{activeSub.package.name}</p>
              <p className="text-sm text-gray-500">{activeSub.package.couponLimitPerPeriod} coupons/period per member</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Expires</p>
              <p className="font-medium text-gray-800">{new Date(activeSub.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : account.status === 'active' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4">
          <div className="text-3xl">⚠️</div>
          <div>
            <p className="font-semibold text-amber-900">No active subscription</p>
            <p className="text-sm text-amber-700">Subscribe to give your team access to hotel discounts.</p>
            <Link href="/subscribe" className="inline-block mt-2 bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition">
              Choose a Plan →
            </Link>
          </div>
        </div>
      ) : null}

      {/* Invite member (admin only, account active) */}
      {isAdmin && account.status === 'active' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Invite Team Members</h3>
          <form onSubmit={invite} className="flex gap-3">
            <input type="email" placeholder="colleague@company.com" required
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={inviteLoading}
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 whitespace-nowrap">
              {inviteLoading ? 'Sending…' : 'Invite'}
            </button>
          </form>
          {inviteMsg && (
            <p className={`mt-2 text-sm ${inviteMsg.includes('Error') || inviteMsg.includes('error') ? 'text-red-600' : 'text-emerald-600'}`}>{inviteMsg}</p>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Team Members ({account.members.length})</h3>
        <div className="space-y-2">
          {account.members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {m.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.fullName}
                    {m.id === account.adminUser.id && (
                      <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
              </div>
              {isAdmin && m.id !== account.adminUser.id && (
                <button onClick={() => removeMember(m.id)}
                  className="text-xs text-red-500 hover:text-red-700 transition">Remove</button>
              )}
            </div>
          ))}
          {account.members.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No members yet. Invite your team above.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CorporatePage() {
  const [account, setAccount] = useState<CorporateAccount | null | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, meRes] = await Promise.all([
        fetch('/api/corporate'),
        fetch('/api/auth/me'),
      ]);
      const accData = await accRes.json();
      setAccount(accData.corporate || null);
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserId(meData.user?.id || null);
      }
    } catch { setAccount(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Corporate &amp; Group Plans</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Give your entire team access to exclusive hotel discounts. One subscription, everyone benefits.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : account === null ? (
          <>
            {/* Benefits section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: '👥', title: 'Team Coverage', desc: 'All employees get the same benefits under one plan.' },
                { icon: '💰', title: 'Volume Savings', desc: 'Corporate pricing is cheaper per seat than individual plans.' },
                { icon: '📊', title: 'Usage Tracking', desc: 'Monitor how your team uses their hotel discounts.' },
              ].map(b => (
                <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
                  <div className="text-3xl mb-3">{b.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-500">{b.desc}</p>
                </div>
              ))}
            </div>
            <ApplyForm onCreated={fetchAccount} />
          </>
        ) : account ? (
          <CorporateDashboard
            account={account}
            isAdmin={userId === account.adminUser.id}
            onRefresh={fetchAccount}
          />
        ) : null}
      </div>
    </div>
  );
}
