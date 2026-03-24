'use client';
import { useState, useEffect } from 'react';

type Tab = 'broadcast' | 'flashsale' | 'reminders' | 'push';

// ── In-app Broadcast ──────────────────────────────────────────────────────────
function BroadcastTab() {
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [type, setType]       = useState('system');
  const [link, setLink]       = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult('');
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type, link: link || undefined }),
      });
      if (res.ok) {
        setResult('✓ Broadcast sent to all users!');
        setTitle(''); setMessage(''); setLink('');
      } else {
        setResult('✗ Failed to send broadcast.');
      }
    } catch { setResult('✗ Network error.'); }
    setSending(false);
    setTimeout(() => setResult(''), 4000);
  };

  return (
    <form onSubmit={send} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
          placeholder="🔥 Flash Sale — 50% off this weekend!" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
          placeholder="Details about the announcement..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E8395A]">
            <option value="system">System</option>
            <option value="deal">Deal</option>
            <option value="coupon">Coupon</option>
            <option value="points">Points</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Link (optional)</label>
          <input value={link} onChange={e => setLink(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
            placeholder="/hotels" />
        </div>
      </div>
      {result && <p className={`text-sm font-semibold ${result.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{result}</p>}
      <button type="submit" disabled={sending}
        className="w-full py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ background: '#E8395A' }}>
        {sending ? 'Sending…' : 'Broadcast to All Users'}
      </button>
    </form>
  );
}

// ── Flash Sale Email ──────────────────────────────────────────────────────────
function FlashSaleTab() {
  const [hotels, setHotels]       = useState<{ id: string; name: string; slug: string }[]>([]);
  const [hotelId, setHotelId]     = useState('');
  const [discount, setDiscount]   = useState(30);
  const [endsAt, setEndsAt]       = useState('');
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState('');

  useEffect(() => {
    fetch('/api/admin/hotels?status=active&limit=100')
      .then(r => r.json())
      .then(d => setHotels((d.hotels || []).slice(0, 100)))
      .catch(() => {});

    // Default: 48h from now
    const dt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    setEndsAt(dt.toISOString().slice(0, 16));
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !endsAt) return;
    setSending(true); setResult('');
    try {
      const res = await fetch('/api/admin/flash-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, discount, endsAt: new Date(endsAt).toISOString() }),
      });
      const json = await res.json();
      setResult(res.ok ? `✓ ${json.message}` : `✗ ${json.error || 'Failed'}`);
    } catch { setResult('✗ Network error.'); }
    setSending(false);
    setTimeout(() => setResult(''), 6000);
  };

  return (
    <form onSubmit={send} className="space-y-4">
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
        <strong>📧 Email blast</strong> — sends the flash sale alert to all users with an active subscription.
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Hotel</label>
        <select value={hotelId} onChange={e => setHotelId(e.target.value)} required
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#E8395A]">
          <option value="">Select a hotel…</option>
          {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Discount %</label>
          <input type="number" min={1} max={100} value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Sale ends at</label>
          <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]" />
        </div>
      </div>
      {result && <p className={`text-sm font-semibold ${result.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{result}</p>}
      <button type="submit" disabled={sending || !hotelId}
        className="w-full py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #E8395A, #FF6B35)' }}>
        {sending ? 'Sending emails…' : '🔥 Send Flash Sale Emails'}
      </button>
    </form>
  );
}

// ── Reminders ─────────────────────────────────────────────────────────────────
function RemindersTab() {
  const [couponState, setCouponState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [couponMsg, setCouponMsg]     = useState('');
  const [subState, setSubState]       = useState<'idle' | 'loading' | 'done'>('idle');
  const [subMsg, setSubMsg]           = useState('');

  const triggerCouponReminders = async () => {
    setCouponState('loading'); setCouponMsg('');
    try {
      const res  = await fetch('/api/coupons/expiry-reminders', { method: 'POST' });
      const json = await res.json();
      setCouponMsg(res.ok ? `✓ ${json.message}` : `✗ ${json.error || 'Failed'}`);
    } catch { setCouponMsg('✗ Network error.'); }
    setCouponState('done');
  };

  const triggerSubReminders = async () => {
    setSubState('loading'); setSubMsg('');
    try {
      const res  = await fetch('/api/admin/send-reminders', { method: 'POST' });
      const json = await res.json();
      setSubMsg(res.ok ? `✓ ${json.message}` : `✗ ${json.error || 'Failed'}`);
    } catch { setSubMsg('✗ Network error.'); }
    setSubState('done');
  };

  const Card = ({ icon, title, desc, onClick, state, msg }: {
    icon: string; title: string; desc: string;
    onClick: () => void; state: string; msg: string;
  }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {msg && <p className={`text-sm font-semibold ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
      <button onClick={onClick} disabled={state === 'loading'}
        className="w-full py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
        style={{ background: '#1A3C5E' }}>
        {state === 'loading' ? 'Sending…' : state === 'done' ? 'Run again' : 'Send Now'}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        These send emails to relevant users. Safe to run once daily — coupon reminders target coupons expiring in 2–3 days.
      </div>
      <Card
        icon="🎫"
        title="Coupon Expiry Reminders"
        desc="Emails users whose active coupons expire in 2–3 days, with their coupon code and a share link."
        onClick={triggerCouponReminders}
        state={couponState}
        msg={couponMsg}
      />
      <Card
        icon="💳"
        title="Subscription Renewal Reminders"
        desc="Emails users whose active subscription expires within 3 days, with a renewal link."
        onClick={triggerSubReminders}
        state={subState}
        msg={subMsg}
      />
    </div>
  );
}

// ── Push Notification Tab ─────────────────────────────────────────────────────
function PushTab() {
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl]         = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult('');
    try {
      const res = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, url: url || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✓ Sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''}`);
        setTitle(''); setMessage(''); setUrl('');
      } else {
        setResult(`✗ ${data.error || 'Failed to send'}`);
      }
    } catch { setResult('✗ Network error.'); }
    setSending(false);
    setTimeout(() => setResult(''), 5000);
  };

  return (
    <form onSubmit={send} className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
        Sends a browser push notification to all users who have opted in via their dashboard.
        Requires <code className="bg-amber-100 px-1 rounded">VAPID_PUBLIC_KEY</code>, <code className="bg-amber-100 px-1 rounded">VAPID_PRIVATE_KEY</code>, and <code className="bg-amber-100 px-1 rounded">VAPID_SUBJECT</code> env vars.
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
          placeholder="🔥 New deal just dropped!" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
          placeholder="Up to 50% off at top hotels this weekend only..." />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Link (optional)</label>
        <input value={url} onChange={e => setUrl(e.target.value)} type="url"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#E8395A]"
          placeholder="https://busybeds.com/hotels/..." />
      </div>
      <button type="submit" disabled={sending}
        className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}>
        {sending ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</> : '🔔 Send Push to All Subscribers'}
      </button>
      {result && <p className={`text-sm font-medium ${result.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{result}</p>}
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BroadcastClient() {
  const [tab, setTab] = useState<Tab>('broadcast');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'broadcast', label: 'In-App Broadcast', icon: '📣' },
    { id: 'push',      label: 'Push Notification', icon: '🔔' },
    { id: 'flashsale', label: 'Flash Sale Email', icon: '🔥' },
    { id: 'reminders', label: 'Reminders',        icon: '⏰' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Broadcast</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send messages and emails to your users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-xl">
        {tab === 'broadcast' && <BroadcastTab />}
        {tab === 'push'      && <PushTab />}
        {tab === 'flashsale' && <FlashSaleTab />}
        {tab === 'reminders' && <RemindersTab />}
      </div>
    </div>
  );
}
