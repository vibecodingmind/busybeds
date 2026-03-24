import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Routes that require a logged-in user
const PROTECTED = ['/dashboard', '/coupons', '/subscribe', '/apply', '/profile', '/favorites', '/referral'];
// Routes that require specific roles
const ROLE_PROTECTED: Record<string, string[]> = {
  '/admin': ['admin'],
  '/portal': ['hotel_owner', 'hotel_manager', 'admin'],
};

// Paths that should NEVER be cached (dynamic/user-specific content)
const NO_CACHE_PATHS = [
  '/api/',
  '/dashboard',
  '/coupons',
  '/subscribe',
  '/profile',
  '/favorites',
  '/referral',
  '/notifications',
  '/messages',
  '/loyalty',
  '/gift-cards',
  '/coupon-history',
  '/invoices',
  '/owner',
  '/admin',
  '/portal',
  '/apply',
  '/settings',
  '/map',
];

// Add cache-control headers to prevent browser caching of dynamic content
function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if this path should have no-cache headers
  const shouldNoCache = NO_CACHE_PATHS.some(path => pathname.startsWith(path));
  
  // Also no-cache for hotel detail pages (dynamic coupon data)
  const isHotelDetail = pathname.startsWith('/hotels/') && pathname !== '/hotels';
  
  // Also no-cache for location pages (dynamic hotel lists)
  const isLocationPage = pathname.startsWith('/locations/');

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
      const response = NextResponse.next();
      return addNoCacheHeaders(response);
    }
  }

  // Enforce login-only routes
  for (const path of PROTECTED) {
    if (pathname.startsWith(path)) {
      if (!session) return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
      const response = NextResponse.next();
      return addNoCacheHeaders(response);
    }
  }

  // Add no-cache headers for dynamic pages
  if (shouldNoCache || isHotelDetail || isLocationPage) {
    const response = NextResponse.next();
    return addNoCacheHeaders(response);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|icon|manifest.json|sw.js|service-worker.js|offline.html|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};
