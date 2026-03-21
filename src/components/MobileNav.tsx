'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, User, Heart } from './Icons';

const items = [
  { href: '/',          icon: Home,   label: 'Hotels'    },
  { href: '/coupons',   icon: Ticket, label: 'Coupons'   },
  { href: '/favorites', icon: Heart,  label: 'Saved'     },
  { href: '/dashboard', icon: User,   label: 'Account'   },
];

export default function MobileNav() {
  const pathname = usePathname();
  const hide = ['/admin', '/portal', '/login', '/register', '/apply', '/forgot-password', '/reset-password'];
  if (hide.some(p => pathname.startsWith(p))) return null;

  return (
    <nav className="mobile-bottom-bar sm:hidden">
      {items.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all">
            <span className={`transition-colors ${active ? 'text-teal-600' : 'text-gray-400'}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            </span>
            <span className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? 'text-teal-600' : 'text-gray-400'}`}>
              {label}
            </span>
            {active && (
              <span className="absolute -bottom-0 w-6 h-0.5 rounded-full bg-teal-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
