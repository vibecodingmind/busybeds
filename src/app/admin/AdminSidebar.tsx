'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

const CORAL = '#E8395A';
const TEAL  = '#1A3C5E';

const navItems = [
  {
    label: 'Main',
    items: [
      { href: '/admin',           label: 'Home',       icon: HomeIcon },
      { href: '/admin/hotels',    label: 'Hotels',     icon: HotelIcon },
      { href: '/admin/users',     label: 'Users',      icon: UsersIcon },
      { href: '/admin/coupons',   label: 'Coupons',    icon: CouponIcon },
      { href: '/admin/kyc',       label: 'Claims / KYC', icon: KycIcon, badge: true },
      { href: '/admin/broadcast', label: 'Broadcast',  icon: BroadcastIcon },
      { href: '/admin/analytics', label: 'Analytics',  icon: AnalyticsIcon },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/packages',  label: 'Packages',   icon: PackageIcon },
      { href: '/admin/amenities', label: 'Amenities',  icon: AmenityIcon },
      { href: '/admin/hotel-types', label: 'Hotel Types', icon: TagIcon },
      { href: '/admin/settings',  label: 'API Settings', icon: SettingsIcon },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 flex-shrink-0">
        <Link href="/admin">
          <Logo height={28} />
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {navItems.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      style={active ? { background: CORAL } : {}}
                    >
                      <item.icon active={active} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom — go to site */}
      <div className="p-3 border-t border-gray-100">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          View Site
        </Link>
      </div>
    </aside>
  );
}

// Icons
function HomeIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
}
function HotelIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v4M8 12v4M16 12v4"/></svg>;
}
function UsersIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function CouponIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 14l2 2 4-4"/></svg>;
}
function KycIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>;
}
function AnalyticsIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function PackageIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8l-2 4h12l-2-4z"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
}
function AmenityIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
}
function TagIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
function SettingsIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}


function BroadcastIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M16 12L12 8M12 8L8 12M12 8v8"/></svg>;
}