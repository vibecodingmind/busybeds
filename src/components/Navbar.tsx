'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import CurrencyToggle from './CurrencyToggle';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import NavbarSearch from './NavbarSearch';
import Logo from './Logo';

interface UserSession { userId: string; email: string; role: string; fullName: string; }

export default function Navbar() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user || null)).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem('bb_theme');
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setUser(null); setMenuOpen(false);
    router.push('/'); router.refresh();
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('bb_theme', next ? 'dark' : 'light');
  };

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '';

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'admin') return { href: '/admin', label: 'Admin Panel' };
    if (user.role === 'hotel_owner' || user.role === 'hotel_manager') return { href: '/portal', label: 'Hotel Portal' };
    return { href: '/dashboard', label: 'Dashboard' };
  };
  const dash = getDashboardLink();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1760px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 group">
          <Logo height={34} className="transition-transform group-hover:scale-105" />
        </Link>

        {/* Center — wide search bar */}
        <Suspense fallback={
          <div className="flex-1 flex items-center border border-gray-200 rounded-full shadow-sm bg-white overflow-hidden max-w-2xl w-full">
            <svg className="ml-5 flex-shrink-0 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="flex-1 px-4 py-3.5 text-sm text-gray-400">Search by hotel name, address or near me…</span>
            <span className="m-1.5 px-5 py-2.5 rounded-full flex items-center gap-2 text-white text-sm font-semibold flex-shrink-0" style={{ background: '#FF385C' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </span>
          </div>
        }>
          <NavbarSearch />
        </Suspense>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/onboarding" className="hidden lg:flex items-center px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap">
            Become Host
          </Link>

          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          <div className="hidden md:block">
            <CurrencyToggle />
          </div>

          {user && <NotificationBell />}

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600">
            {dark ? (
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition-all duration-200 bg-white"
            >
              {/* Hamburger */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>
              </svg>
              {/* Avatar */}
              {user ? (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF385C, #BD1E59)' }}>
                  {initials}
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                </div>
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-up">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {dash && (
                        <Link href={dash.href} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                          {dash.label}
                        </Link>
                      )}
                      <Link href="/coupons" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M7 7h.01M17 17h.01M3 12h1m16 0h1M12 3v1m0 16v1m-8.66-13.5.707.707m14.85 12.02.707.707M4.34 18.34l.707-.707m14.85-12.02.707-.707M7 7l10 10"/></svg>
                        My Coupons
                      </Link>
                      <Link href="/favorites" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"/></svg>
                        Saved Hotels
                      </Link>
                      <Link href="/gift-cards" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>
                        Gift Cards
                      </Link>
                      <Link href="/loyalty" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Loyalty Points
                      </Link>
                                            <Link href="/profile" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/></svg>
                        Profile
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <Link href="/login" onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                      Sign in
                    </Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Create account
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <Link href="/onboarding" onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Become Host
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
