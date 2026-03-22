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
      { href: '/admin/reviews',   label: 'Reviews',    icon: ReviewIcon },
      { href: '/admin/kyc',              label: 'Claims / KYC',    icon: KycIcon, badge: true },
      { href: '/admin/broadcast',        label: 'Broadcast',        icon: BroadcastIcon },
      { href: '/admin/analytics',        label: 'Analytics',        icon: AnalyticsIcon },
    ],
  },
  {
    label: 'Admin Superpowers',
    items: [
      { href: '/admin/revenue',           label: 'Revenue & Growth',  icon: RevenueIcon },
      { href: '/admin/health',            label: 'System Health',     icon: HealthIcon },
      { href: '/admin/fraud',             label: 'Fraud Detection',   icon: FraudIcon },
      { href: '/admin/flash-deals',       label: 'Flash Deals',       icon: FlashIcon },
      { href: '/admin/affiliate-clicks',  label: 'Affiliate Clicks',  icon: LinkIcon },
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
function RevenueIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>;
}
function HealthIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function FraudIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M12 1l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z"/></svg>;
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
function ReviewIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
}
function FlashIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function LinkIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? 'white' : 'currentColor'} strokeWidth={2} strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>;
}
