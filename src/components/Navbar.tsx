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
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    if (user.role === 'hotel_owner') return { href: '/owner', label: 'Owner Dashboard' };
    if (user.role === 'hotel_manager') return { href: '/portal', label: 'Hotel Portal' };
    return { href: '/dashboard', label: 'Dashboard' };
  };
  const dash = getDashboardLink();

  if (!mounted) return null;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'navbar-glass shadow-lg' : 'navbar-glass'
      }`}
    >
      <div className="max-w-[1760px] mx-auto px-5 sm:px-10 h-[70px] flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center flex-shrink-0 group">
          <Logo height={32} variant="dark" className="transition-all duration-300 group-hover:scale-[1.04] group-hover:opacity-90" />
        </Link>

        {/* ── Center — search bar ── */}
        <Suspense fallback={
          <div className="flex-1 search-bar max-w-xl w-full h-11">
            <svg className="ml-4 flex-shrink-0 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="flex-1 px-3 text-sm text-gray-400">Search hotels…</span>
            <span className="m-1.5 px-4 py-2 rounded-full text-white text-sm font-semibold flex-shrink-0 flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </span>
          </div>
        }>
          <NavbarSearch />
        </Suspense>

        {/* ── Right side ── */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Language */}
          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          {/* Currency */}
          <div className="hidden md:block">
            <CurrencyToggle />
          </div>

          {/* Notifications */}
          {user && <NotificationBell />}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-black/8 active:scale-90 transition-all duration-150 text-gray-600 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {dark ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>

          {/* ── User menu pill ── */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-2.5 rounded-full pl-3 pr-1.5 py-1.5 border transition-all duration-200 active:scale-95 ${
                menuOpen
                  ? 'border-gray-300 shadow-lg bg-white'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white/80'
              }`}
              aria-label="Open menu"
            >
              {/* Hamburger */}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
                <line x1="1.5" y1="3.5" x2="13.5" y2="3.5"/>
                <line x1="1.5" y1="7.5" x2="13.5" y2="7.5"/>
                <line x1="1.5" y1="11.5" x2="13.5" y2="11.5"/>
              </svg>
              {/* Avatar */}
              {user ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #E8395A 0%, #C41F40 100%)' }}
                >
                  {initials}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                </div>
              )}
            </button>

            {/* ── Dropdown menu ── */}
            {menuOpen && (
              <div 
                className="glass-panel absolute right-0 top-[calc(100%+12px)] w-64 z-50 animate-scale-in overflow-hidden"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.10)' }}
              >
                {user ? (
                  <>
                    {/* User header */}
                    <div className="px-4 py-4 border-b border-black/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(232,57,90,0.04) 0%, transparent 100%)' }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)' }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{user.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      {dash && (
                        <MenuItem href={dash.href} onClick={() => setMenuOpen(false)} icon={
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                        }>{dash.label}</MenuItem>
                      )}
                      <MenuItem href="/coupons" onClick={() => setMenuOpen(false)} icon={
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M7 7h.01M17 17h.01M3 12h1m16 0h1M12 3v1m0 16v1m-8.66-13.5.707.707m14.85 12.02.707.707M4.34 18.34l.707-.707m14.85-12.02.707-.707M7 7l10 10"/></svg>
                      }>My Coupons</MenuItem>
                      <MenuItem href="/my-stay-requests" onClick={() => setMenuOpen(false)} icon={
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      }>My Stay Requests</MenuItem>
                      <MenuItem href="/favorites" onClick={() => setMenuOpen(false)} icon={
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"/></svg>
                      }>Saved Hotels</MenuItem>
                      <MenuItem href="/gift-cards" onClick={() => setMenuOpen(false)} icon={
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>
                      }>Gift Cards</MenuItem>
                      <MenuItem href="/loyalty" onClick={() => setMenuOpen(false)} icon={
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      }>Loyalty Points</MenuItem>
                      <MenuItem href="/profile" onClick={() => setMenuOpen(false)} icon={
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/></svg>
                      }>Profile</MenuItem>

                      <div className="mx-3 my-1.5 border-t border-black/[0.06]" />

                      <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors rounded-xl mx-auto"
                        style={{ width: 'calc(100% - 16px)', marginLeft: 8, marginRight: 8 }}
                      >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-3">
                    <div className="px-4 pb-3 pt-1">
                      <p className="text-sm font-bold text-gray-900">Welcome to BusyBeds</p>
                      <p className="text-xs text-gray-500 mt-0.5">Sign in to unlock exclusive deals</p>
                    </div>
                    <div className="px-3 space-y-2 pb-2">
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #E8395A, #C41F40)', boxShadow: '0 4px 14px rgba(232,57,90,0.30)' }}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
                      >
                        Create Account
                      </Link>
                    </div>
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

/* ── Dropdown menu item ── */
function MenuItem({
  href, onClick, icon, children,
}: {
  href: string; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 mx-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-black/[0.04] active:bg-black/[0.06] rounded-xl transition-colors"
    >
      <span className="flex-shrink-0 text-gray-500">{icon}</span>
      {children}
    </Link>
  );
}
