'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Hotels',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#0E7C7B' : 'none'} stroke={active ? '#0E7C7B' : '#9CA3AF'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'Map',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#0E7C7B' : 'none'} stroke={active ? '#0E7C7B' : '#9CA3AF'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ),
  },
  {
    href: '/coupons',
    label: 'Coupons',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#0E7C7B' : 'none'} stroke={active ? '#0E7C7B' : '#9CA3AF'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
  {
    href: '/favorites',
    label: 'Saved',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#0E7C7B' : 'none'} stroke={active ? '#0E7C7B' : '#9CA3AF'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#0E7C7B' : 'none'} stroke={active ? '#0E7C7B' : '#9CA3AF'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  const hideOn = ['/admin', '/portal', '/login', '/register', '/forgot-password', '/reset-password', '/share'];
  if (hideOn.some(p => pathname.startsWith(p))) return null;

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div className="h-16 sm:hidden" aria-hidden="true" />

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch" style={{ height: '64px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-opacity active:opacity-70"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active top bar indicator */}
                {isActive && (
                  <span className="absolute top-0 inset-x-0 mx-auto w-8 h-[3px] rounded-b-full" style={{ background: '#0E7C7B' }} />
                )}

                <span className={`transition-transform duration-150 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {item.icon(isActive)}
                </span>

                <span className={`text-[10px] font-semibold leading-none transition-colors ${isActive ? 'text-teal-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* iOS safe area padding */}
        <div className="bg-white/95" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
    </>
  );
}
