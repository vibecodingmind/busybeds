'use client';
import { useState } from 'react';
import Link from 'next/link';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/initials/svg?seed=';

interface Props {
  user: { id: string; email: string; fullName: string; role: string; createdAt: string | Date; avatar?: string | null };
  subscription: { packageName: string; expiresAt: string } | null;
  stats: { total: number; redeemed: number };
}
type Tab = 'profile' | 'security' | 'subscription';

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function IconCreditCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function IconEye({ open }: { open: boolean }) {
  if (open) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function ProfileClient({ user, subscription, stats }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const avatarUrl = user.avatar ||
    `${DEFAULT_AVATAR}${encodeURIComponent(user.fullName)}&backgroundColor=1A3C5E&color=ffffff&fontSize=40`;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  const initials = user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const TABS = [
    { id: 'profile' as Tab,      label: 'Profile',         icon: <IconUser /> },
    { id: 'security' as Tab,     label: 'Security',        icon: <IconLock /> },
    { id: 'subscription' as Tab, label: 'Subscription',    icon: <IconCreditCard /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3C5E 0%, #0E5C5B 60%, #0E7C7B 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: 'white' }} />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-[0.06]" style={{ background: 'white' }} />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full opacity-[0.04]" style={{ background: 'white' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0 self-start sm:self-end">
              {user.avatar ? (
                <img
                  src={avatarUrl}
                  alt={user.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-[3px] shadow-xl"
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                  onError={e => { (e.target as HTMLImageElement).src = `${DEFAULT_AVATAR}${encodeURIComponent(user.fullName)}&backgroundColor=1A3C5E&color=ffffff`; }}
                />
              ) : (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white border-[3px] shadow-xl"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  {initials}
                </div>
              )}
              {/* Online dot */}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-md" />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight truncate">{user.fullName}</h1>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
                >
                  {user.role.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-white/60 text-sm truncate">{user.email}</p>
              <p className="text-white/40 text-xs mt-1">Member since {memberSince}</p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 sm:pb-1 flex-shrink-0">
              <Link
                href="/coupons"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white/90 border transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
              >
                🎫 My Coupons
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                🏨 Browse Hotels
              </Link>
            </div>
          </div>

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: '🎫', value: stats.total,           label: 'Total Coupons' },
              { icon: '✅', value: stats.redeemed,        label: 'Redeemed' },
              { icon: '💳', value: subscription ? subscription.packageName : 'No plan', label: 'Active Plan' },
              { icon: '⏳', value: subscription ? `${daysLeft}d left` : '—', label: 'Plan Expires' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-white font-extrabold text-sm truncate">{s.value}</span>
                </div>
                <p className="text-white/50 text-[10px] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <div className="lg:w-56 flex-shrink-0">

            {/* Nav card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Settings</p>
              </div>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left border-l-[3px] ${
                    tab === t.id
                      ? 'border-[#0E7C7B] text-[#0E7C7B] bg-teal-50/60'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={tab === t.id ? 'text-[#0E7C7B]' : 'text-gray-400'}>{t.icon}</span>
                  {t.label}
                  {tab === t.id && (
                    <span className="ml-auto text-[#0E7C7B]"><IconCheck /></span>
                  )}
                </button>
              ))}

              <div className="border-t border-gray-100 px-4 py-3 space-y-0.5">
                <Link href="/coupons" className="flex items-center gap-2 py-2 px-1 text-xs text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors">
                  🎫 <span>My Coupons</span>
                </Link>
                <Link href="/favorites" className="flex items-center gap-2 py-2 px-1 text-xs text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors">
                  ❤️ <span>Saved Hotels</span>
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 py-2 px-1 text-xs text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors">
                  📊 <span>Dashboard</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  onClick={async () => { await fetch('/api/auth/me', { method: 'DELETE' }); window.location.href = '/login'; }}
                  className="w-full flex items-center gap-2 py-2 px-1 text-xs text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <IconLogOut />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Mini subscription card */}
            {subscription && (
              <div
                className="mt-3 rounded-2xl p-4 text-white"
                style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💎</span>
                  <div>
                    <p className="text-xs font-bold leading-tight">{subscription.packageName}</p>
                    <p className="text-white/50 text-[10px]">Active plan</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 mb-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(4, (daysLeft / 30) * 100))}%`,
                      background: daysLeft <= 5 ? '#FCA5A5' : '#4ADE80',
                    }}
                  />
                </div>
                <p className="text-white/60 text-[10px]">{daysLeft} days remaining</p>
                {daysLeft <= 7 && (
                  <p className="text-yellow-300 text-[10px] font-medium mt-1">⚠️ Expiring soon</p>
                )}
              </div>
            )}
          </div>

          {/* ── Right content panel ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {tab === 'profile'      && <ProfileSection user={user} avatarUrl={avatarUrl} />}
              {tab === 'security'     && <SecuritySection />}
              {tab === 'subscription' && <SubscriptionSection subscription={subscription} />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Profile Section
══════════════════════════════════════════════════════════════════════════════ */
function ProfileSection({ user, avatarUrl }: { user: Props['user']; avatarUrl: string }) {
  const [form, setForm]       = useState({ fullName: user.fullName, email: user.email, avatar: user.avatar || '' });
  const [preview, setPreview] = useState(avatarUrl);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [k]: val }));
    if (k === 'avatar') setPreview(val || avatarUrl);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, email: form.email, avatar: form.avatar || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Update failed');
      setMsg({ type: 'ok', text: 'Profile updated successfully!' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Update failed' });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={save}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 className="text-base font-extrabold text-gray-900">Profile Information</h2>
        <p className="text-xs text-gray-400 mt-0.5">Update your name, email address, and profile photo</p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {msg && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
            msg.type === 'ok'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span>{msg.type === 'ok' ? '✅' : '⚠️'}</span>
            {msg.text}
          </div>
        )}

        {/* Avatar section */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100" style={{ background: '#F7F8FA' }}>
          <div className="relative flex-shrink-0">
            <img
              src={preview}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.fullName)}&backgroundColor=1A3C5E&color=ffffff`;
              }}
            />
            <button
              type="button"
              onClick={() => setShowAvatarEdit(v => !v)}
              className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
            >
              <IconEdit />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Profile Photo</p>
            <p className="text-xs text-gray-400 mt-0.5">Shown on your coupons and bookings</p>
            {showAvatarEdit && (
              <div className="mt-2.5">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={form.avatar}
                  onChange={set('avatar')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0E7C7B] focus:ring-1 focus:ring-teal-100 transition-all bg-white"
                />
                <p className="text-[10px] text-gray-400 mt-1">Paste a public image URL. Leave blank for auto-generated avatar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Full Name */}
        <FormField label="Full Name" required>
          <input
            type="text"
            value={form.fullName}
            onChange={set('fullName')}
            required
            minLength={2}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0E7C7B] focus:ring-2 focus:ring-teal-50 transition-all"
          />
        </FormField>

        {/* Email */}
        <FormField label="Email Address" required>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0E7C7B] focus:ring-2 focus:ring-teal-50 transition-all"
          />
        </FormField>

        {/* Role (read-only) */}
        <FormField label="Account Role">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 text-sm capitalize" style={{ background: '#F7F8FA' }}>
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
            >
              {user.role[0].toUpperCase()}
            </span>
            <span className="text-gray-700 flex-1">{user.role.replace(/_/g, ' ')}</span>
            <span className="text-[11px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Read-only</span>
          </div>
        </FormField>
      </div>

      {/* Footer with save button */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3" style={{ background: '#FAFAFA' }}>
        <p className="text-xs text-gray-400">Changes are saved immediately</p>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
            : <><IconCheck />Save Changes</>
          }
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Security Section
══════════════════════════════════════════════════════════════════════════════ */
function SecuritySection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ currentPassword: false, newPassword: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const strength = (() => {
    const p = form.newPassword;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { label: 'Weak',   color: '#EF4444', w: '25%',  bg: 'bg-red-500'   };
    if (s === 2) return { label: 'Fair',  color: '#F59E0B', w: '50%',  bg: 'bg-yellow-400' };
    if (s === 3) return { label: 'Good',  color: '#3B82F6', w: '75%',  bg: 'bg-blue-500'  };
    return           { label: 'Strong', color: '#22C55E', w: '100%', bg: 'bg-green-500'  };
  })();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setMsg({ type: 'err', text: 'Passwords do not match' }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed');
      setMsg({ type: 'ok', text: 'Password changed successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed' });
    } finally { setSaving(false); }
  }

  const PwdField = ({
    field, label, placeholder, required: req,
  }: { field: keyof typeof form; label: string; placeholder: string; required?: boolean }) => (
    <FormField label={label} required={req}>
      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          value={form[field]}
          onChange={set(field)}
          required={req}
          placeholder={placeholder}
          minLength={field !== 'currentPassword' ? 8 : undefined}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0E7C7B] focus:ring-2 focus:ring-teal-50 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <IconEye open={show[field]} />
        </button>
      </div>
    </FormField>
  );

  return (
    <form onSubmit={save}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 className="text-base font-extrabold text-gray-900">Password & Security</h2>
        <p className="text-xs text-gray-400 mt-0.5">Keep your account safe with a strong, unique password</p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {msg && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
            msg.type === 'ok'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span>{msg.type === 'ok' ? '✅' : '⚠️'}</span>
            {msg.text}
          </div>
        )}

        {/* Tips card */}
        <div className="flex gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50">
          <div className="text-blue-500 flex-shrink-0 text-lg mt-0.5">🛡️</div>
          <div>
            <p className="text-xs font-bold text-blue-800 mb-1">Strong password tips</p>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li>• At least 8 characters long</li>
              <li>• Mix uppercase, numbers &amp; symbols</li>
              <li>• Avoid common words or repeated patterns</li>
            </ul>
          </div>
        </div>

        <PwdField field="currentPassword" label="Current Password"    placeholder="Enter your current password" required />

        <div>
          <PwdField field="newPassword" label="New Password" placeholder="At least 8 characters" required />
          {strength && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1.5">
                {[25, 50, 75, 100].map(threshold => (
                  <div
                    key={threshold}
                    className="flex-1 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: parseInt(strength.w) >= threshold ? strength.color : '#E5E7EB',
                    }}
                  />
                ))}
                <span className="text-[11px] font-bold ml-1 flex-shrink-0" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <PwdField field="confirm" label="Confirm New Password" placeholder="Repeat your new password" required />
          {form.confirm && form.newPassword !== form.confirm && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <span>⚠️</span> Passwords do not match
            </p>
          )}
          {form.confirm && form.newPassword === form.confirm && form.newPassword && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <span>✅</span> Passwords match
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3" style={{ background: '#FAFAFA' }}>
        <p className="text-xs text-gray-400">You&apos;ll remain signed in after changing</p>
        <button
          type="submit"
          disabled={saving || (!!form.confirm && form.newPassword !== form.confirm)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
        >
          {saving
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating…</>
            : <><IconLock />Update Password</>
          }
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Subscription Section
══════════════════════════════════════════════════════════════════════════════ */
function SubscriptionSection({ subscription }: Pick<Props, 'subscription'>) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelled,  setCancelled]  = useState(false);
  const [err, setErr]               = useState('');
  const [confirm, setConfirm]       = useState(false);

  async function cancel() {
    setCancelling(true); setErr('');
    try {
      const res = await fetch('/api/subscriptions', { method: 'DELETE' });
      if (!res.ok) throw new Error('Cancellation failed');
      setCancelled(true);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed'); }
    finally { setCancelling(false); setConfirm(false); }
  }

  // Header always rendered
  const Header = () => (
    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
      <h2 className="text-base font-extrabold text-gray-900">Subscription</h2>
      <p className="text-xs text-gray-400 mt-0.5">Manage your BusyBeds membership plan</p>
    </div>
  );

  if (cancelled) return (
    <>
      <Header />
      <div className="px-6 py-12 text-center space-y-4">
        <div className="text-5xl">😔</div>
        <h3 className="font-extrabold text-gray-900 text-lg">Subscription Cancelled</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">You retain access until the end of your current billing period.</p>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
        >
          🎉 Re-subscribe
        </Link>
      </div>
    </>
  );

  if (!subscription) return (
    <>
      <Header />
      <div className="px-6 py-12 text-center space-y-4">
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' }}
        >
          💎
        </div>
        <h3 className="font-extrabold text-gray-900 text-lg">No Active Subscription</h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Subscribe to unlock exclusive hotel discount coupons and save on every booking.
        </p>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
        >
          View Plans &amp; Pricing →
        </Link>
      </div>
    </>
  );

  const expiresDate = new Date(subscription.expiresAt);
  const daysLeft    = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / 86400000));
  const progressPct = Math.min(100, Math.max(3, (daysLeft / 30) * 100));
  const progressColor = daysLeft <= 5 ? '#EF4444' : daysLeft <= 10 ? '#F59E0B' : '#22C55E';

  return (
    <>
      <Header />
      <div className="px-6 py-5 space-y-5">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            ⚠️ {err}
          </div>
        )}

        {/* Active plan card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
        >
          {/* Card header */}
          <div className="px-5 py-4 flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
            >
              💎
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-white leading-tight">{subscription.packageName}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-400 text-white flex-shrink-0">
                  ACTIVE
                </span>
              </div>
              <p className="text-white/60 text-xs mt-1">
                Renews on {expiresDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-5">
            <div className="flex justify-between text-[11px] text-white/60 mb-2">
              <span>{daysLeft} days remaining</span>
              <span>Expires {expiresDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="h-2 rounded-full bg-white/20">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: progressColor }}
              />
            </div>
            {daysLeft <= 7 && (
              <p className="text-yellow-300 text-[11px] font-medium mt-2">⚠️ Your plan expires soon — consider renewing</p>
            )}
          </div>
        </div>

        {/* Plan benefits */}
        <div className="rounded-2xl border border-gray-100 p-4" style={{ background: '#FAFAFA' }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Plan Benefits</p>
          <div className="space-y-2">
            {[
              '🎫 Generate discount coupons for any hotel',
              '🔖 Save unlimited favorite hotels',
              '🎁 Access referral & bonus rewards',
              '🛎️ Priority customer support',
            ].map(benefit => (
              <div key={benefit} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-green-600 bg-green-50">
                  <IconCheck />
                </span>
                {benefit.substring(3)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-gray-100 space-y-3" style={{ background: '#FAFAFA' }}>
        <div className="flex gap-3">
          <Link
            href="/subscribe"
            className="flex-1 text-center py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #1A3C5E, #0E7C7B)' }}
          >
            Upgrade Plan
          </Link>

          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-medium hover:border-red-200 hover:text-red-500 transition-colors"
            >
              Cancel Plan
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={cancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          )}
        </div>
        {confirm && (
          <p className="text-[11px] text-center text-gray-400">
            Cancellation takes effect at the end of your current billing period.
          </p>
        )}
      </div>
    </>
  );
}

/* ── Shared form field ────────────────────────────────────────────────────── */
function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
