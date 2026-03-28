'use client';
import { useState, useEffect, useCallback } from 'react';

interface SMSLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  provider: string;
  createdAt: string;
  sentAt?: string;
  userId?: string;
}

interface Stats { total: number; sent: number; pending: number; failed: number; }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent:    'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    failed:  'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

const QUICK_TEMPLATES = [
  { label: 'New Deal Alert', text: 'We have new hotel deals up to 40% off! Check BusyBeds for the latest discounts.' },
  { label: 'Welcome Back', text: 'We miss you! Log in to BusyBeds and discover new hotel discounts available now.' },
  { label: 'Coupon Reminder', text: 'Reminder: You have an unused hotel discount coupon expiring soon. Use it today!' },
  { label: 'Feature Update', text: 'BusyBeds has exciting new features! Log in to explore corporate plans and loyalty rewards.' },
];

function SendSMSPanel({ onSent }: { onSent: () => void }) {
  const [target, setTarget] = useState<'single' | 'users_with_phone' | 'all_users' | 'custom'>('single');
  const [phone, setPhone] = useState('');
  const [customPhones, setCustomPhones] = useState('');
  const [message, setMessage] = useState('');
  const [senderId, setSenderId] = useState('BusyBeds');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  const charCount = message.length;
  const parts = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  const handleSend = async () => {
    if (!message.trim()) { setResult({ success: false, msg: 'Message is required' }); return; }
    if (target === 'single' && !phone.trim()) { setResult({ success: false, msg: 'Phone number is required' }); return; }
    if (target === 'custom' && !customPhones.trim()) { setResult({ success: false, msg: 'Enter at least one phone number' }); return; }

    const phones = target === 'single'
      ? [phone.trim()]
      : target === 'custom'
        ? customPhones.split(/[\n,]+/).map((p: string) => p.trim()).filter(Boolean)
        : undefined;

    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, phones, message, senderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, msg: data.message });
        setMessage('');
        setPhone('');
        setCustomPhones('');
        onSent();
      } else {
        setResult({ success: false, msg: data.error || 'Failed to send' });
      }
    } catch {
      setResult({ success: false, msg: 'Network error' });
    } finally { setSending(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
        Send SMS
      </h2>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'single', label: 'Single Number', icon: '📱' },
            { value: 'users_with_phone', label: 'Users (opt-in)', icon: '👥' },
            { value: 'all_users', label: 'All Users', icon: '📣' },
            { value: 'custom', label: 'Custom List', icon: '📋' },
          ].map(t => (
            <button key={t.value} onClick={() => setTarget(t.value as typeof target)}
              className={`p-3 rounded-xl border text-sm font-medium text-center transition ${
                target === t.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              <span className="text-lg block mb-1">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {target === 'single' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="tel" placeholder="+255712345678" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      )}

      {target === 'custom' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Numbers (one per line or comma-separated)</label>
          <textarea rows={4} placeholder="+255712345678&#10;+255787654321" value={customPhones} onChange={e => setCustomPhones(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      )}

      {(target === 'all_users' || target === 'users_with_phone') && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          {target === 'all_users'
            ? '⚠️ This will send to ALL registered users who have a phone number, regardless of SMS preferences.'
            : '⚠️ This will send to users who have a phone number and have not opted out of SMS alerts.'}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID <span className="text-gray-400">(max 11 chars)</span></label>
        <input type="text" maxLength={11} value={senderId} onChange={e => setSenderId(e.target.value.slice(0, 11))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Message</label>
          <span className={`text-xs ${charCount > 160 ? 'text-amber-600' : 'text-gray-400'}`}>
            {charCount} chars · {parts} SMS part{parts !== 1 ? 's' : ''}
          </span>
        </div>
        <textarea rows={4} placeholder="Type your SMS message…" value={message} onChange={e => setMessage(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="mb-5">
        <p className="text-xs font-medium text-gray-500 mb-2">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map(t => (
            <button key={t.label} onClick={() => setMessage(t.text)}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-200 transition">
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? '✓ ' : '✗ '}{result.msg}
        </div>
      )}

      <button onClick={handleSend} disabled={sending}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
        {sending ? 'Sending…' : '📤 Send SMS'}
      </button>
    </div>
  );
}

function SMSLogsPanel({ refreshKey }: { refreshKey: number }) {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/sms?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || null);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } finally { setLoading(false); }
  }, [page, statusFilter, search, refreshKey]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          SMS History <span className="text-gray-400 font-normal text-sm">({total})</span>
        </h2>
        {stats && (
          <div className="flex gap-3 text-sm">
            <span className="text-emerald-600 font-semibold">✓ {stats.sent} sent</span>
            <span className="text-red-500 font-semibold">✗ {stats.failed} failed</span>
            <span className="text-gray-400">{stats.pending} pending</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Search phone or message…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-10 text-center text-gray-400">No SMS messages yet</div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                <div className="mt-0.5"><StatusBadge status={log.status} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-gray-800">{log.phone}</span>
                    <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminSMSPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">SMS Management</h1>
        <p className="text-gray-500 mt-1">Send via SDASMS · Automated reminders run daily via Vercel Cron</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: '🎟️', title: 'Coupon Generated', desc: 'Traveler gets SMS with coupon code + expiry' },
          { icon: '✅', title: 'Subscription Active', desc: 'User gets SMS confirming their plan is live' },
          { icon: '⏰', title: 'Expiry Reminders', desc: 'Daily cron sends SMS 2-3 days before expiry' },
        ].map(i => (
          <div key={i.title} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-100 p-4">
            <div className="text-2xl mb-2">{i.icon}</div>
            <p className="text-sm font-semibold text-gray-800">{i.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{i.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SendSMSPanel onSent={() => setRefreshKey(k => k + 1)} />
        <SMSLogsPanel refreshKey={refreshKey} />
      </div>
    </div>
  );
}
