'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Notification = {
  id: string;
  type: 'kyc' | 'user';
  title: string;
  body: string;
  time: string;
};

type AdminUser = {
  fullName: string;
  email: string;
  avatar: string | null;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminHeader({ notifications, adminUser }: { notifications: Notification[]; adminUser: AdminUser | null }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unread = notifications.filter(n => !read.has(n.id)).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotif = () => {
    setNotifOpen(v => !v);
    setAvatarOpen(false);
    if (!notifOpen) setRead(new Set(notifications.map(n => n.id)));
  };

  const openAvatar = () => {
    setAvatarOpen(v => !v);
    setNotifOpen(false);
  };

  const logout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    router.push('/login');
  };

  const initials = adminUser?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A';

  return (
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-8 flex-shrink-0 z-40">
      {/* Left Side - Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-400">Welcome back, {adminUser?.fullName?.split(' ')[0] || 'Admin'}</p>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-pink-200 to-violet-200 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl group-focus-within:border-pink-300 transition-colors">
            <svg className="absolute left-4 text-slate-400" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              placeholder="Search hotels, users, coupons..." 
              className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-700 placeholder-slate-400 text-sm focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex mr-4 px-2 py-1 text-[10px] font-medium text-slate-400 bg-slate-100 rounded-lg border border-slate-200">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <Link
          href="/admin/hotels/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Hotel
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotif}
            className="relative w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 17H20L18.5 15.5V11A6.5 6.5 0 005.5 11V15.5L4 17H9M15 17A3 3 0 119 17"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 min-w-[20px] flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-lg shadow-pink-500/30">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-96 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <p className="text-xs text-slate-400">{unread} unread</p>
                </div>
                <button className="text-xs text-pink-500 font-medium hover:text-pink-600">Mark all read</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="1.5">
                        <path strokeLinecap="round" d="M15 17H20L18.5 15.5V11A6.5 6.5 0 005.5 11V15.5L4 17H9M15 17A3 3 0 119 17"/>
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-1">No new notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <Link
                      key={n.id}
                      href={n.type === 'kyc' ? '/admin/kyc' : '/admin/users'}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'kyc' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                        {n.type === 'kyc' ? (
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2">
                            <path strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth="2">
                            <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{n.body}</p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(n.time)}</span>
                    </Link>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
                  <Link href="/admin/kyc" onClick={() => setNotifOpen(false)} className="text-sm font-semibold text-pink-500 hover:text-pink-600">
                    View all notifications →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={openAvatar}
            className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white"
          >
            {adminUser?.avatar ? (
              <img src={adminUser.avatar} alt="" className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-400 via-pink-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-pink-500/20">
                {initials}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{adminUser?.fullName || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 leading-tight">Administrator</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform ${avatarOpen ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {/* User Dropdown */}
          {avatarOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-50">
              {/* User Info Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {adminUser?.avatar ? (
                    <img src={adminUser.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 via-pink-500 to-violet-500 flex items-center justify-center text-lg font-bold text-white">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800">{adminUser?.fullName || 'Admin'}</p>
                    <p className="text-xs text-slate-400 truncate">{adminUser?.email}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold bg-gradient-to-r from-rose-50 to-pink-50 text-pink-600 px-2.5 py-1 rounded-full border border-pink-100">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  ADMIN
                </span>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link href="/admin" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  Dashboard
                </Link>
                <Link href="/profile" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/></svg>
                  My Profile
                </Link>
                <Link href="/admin/settings" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                  Settings
                </Link>
                <Link href="/" onClick={() => setAvatarOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  View Site
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 py-2">
                <button onClick={logout} className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
