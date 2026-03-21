import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Routes that require a logged-in user
const PROTECTED = ['/dashboard', '/coupons', '/subscribe', '/apply', '/profile', '/favorites', '/referral'];
// Routes that require specific roles
const ROLE_PROTECTED: Record<string, string[]> = {
  '/admin': ['admin'],
  '/portal': ['hotel_owner', 'hotel_manager', 'admin'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get('bb_token')?.value;
  const session = token ? await verifyToken(token) : null;

  // Redirect logged-in users away from /login and /register
  if (session && (pathname === '/login' || pathname === '/register')) {
    const dest = session.role === 'admin' ? '/admin'
      : session.role === 'hotel_owner' || session.role === 'hotel_manager' ? '/portal'
      : '/dashboard';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Enforce role-protected routes
  for (const [path, roles] of Object.entries(ROLE_PROTECTED)) {
    if (pathname.startsWith(path)) {
      if (!session) return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
      if (!roles.includes(session.role)) return NextResponse.redirect(new URL('/dashboard', req.url));
      return NextResponse.next();
    }
  }

  // Enforce login-only routes
  for (const path of PROTECTED) {
    if (pathname.startsWith(path)) {
      if (!session) return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/coupons/:path*',
    '/subscribe/:path*',
    '/apply/:path*',
    '/admin/:path*',
    '/portal/:path*',
    '/login',
    '/register',
    '/profile',
    '/profile/:path*',
    '/favorites',
    '/favorites/:path*',
    '/referral',
    '/referral/:path*',
    '/favorites',
    '/referral',
  ],
};
