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
  const [notifOpen, setNotifOpen]   = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [read, setRead]             = useState<Set<string>>(new Set());
  const notifRef  = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const router    = useRouter();

  const unread = notifications.filter(n => !read.has(n.id)).length;

  // Close dropdowns on outside click
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
    // Mark all as read when opened
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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 z-40">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder="Search anything…" className="w-64 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8395A]/30 focus:border-[#E8395A]" />
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotif}
            className="relative w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M15 17H20L18.5 15.5V11A6.5 6.5 0 005.5 11V15.5L4 17H9M15 17A3 3 0 119 17"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-0.5 text-[10px] font-bold text-white rounded-full flex items-center justify-center" style={{ background: '#E8395A', fontSize: '10px', minWidth: '18px', height: '18px' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
                <span className="text-xs text-gray-400">{notifications.length} total</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-2">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={1.5}><path strokeLinecap="round" d="M15 17H20L18.5 15.5V11A6.5 6.5 0 005.5 11V15.5L4 17H9M15 17A3 3 0 119 17"/></svg>
                    </div>
                    <p className="text-sm text-gray-400">All caught up!</p>
                  </div>
                ) : notifications.map(n => (
                  <Link
                    key={n.id}
                    href={n.type === 'kyc' ? '/admin/kyc' : '/admin/users'}
                    onClick={() => setNotifOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.type === 'kyc' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                      {n.type === 'kyc' ? (
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#F97316" strokeWidth={2}><path strokeLinecap="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                      ) : (
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={2}><path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 mt-1">{timeAgo(n.time)}</span>
                  </Link>
                ))}
              </div>
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <Link href="/admin/kyc" onClick={() => setNotifOpen(false)} className="text-xs font-semibold" style={{ color: '#E8395A' }}>
                    View all KYC applications →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar + menu */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={openAvatar}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
          >
            {adminUser?.avatar ? (
              <img src={adminUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8395A, #BD1E59)' }}>
                {initials}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-900 leading-tight">{adminUser?.fullName || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 leading-tight truncate max-w-[100px]">{adminUser?.email}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`text-gray-400 transition-transform ${avatarOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" d="M19 9l-7 7-7-7"/></svg>
          </button>

          {/* Avatar dropdown */}
          {avatarOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-sm text-gray-900">{adminUser?.fullName || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{adminUser?.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">ADMIN</span>
              </div>
              <div className="py-1">
                <Link href="/admin" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  Dashboard
                </Link>
                <Link href="/profile" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/></svg>
                  My Profile
                </Link>
                <Link href="/admin/settings" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                  Settings
                </Link>
                <Link href="/" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  View Site
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
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
