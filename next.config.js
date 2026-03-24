/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
  },
  serverExternalPackages: ['bcryptjs'],
  
  // Add headers to prevent caching of API routes and dynamic pages
  async headers() {
    return [
      {
        // Match all API routes - never cache
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        // Match dynamic user pages - never cache
        source: '/(dashboard|coupons|profile|favorites|referral|notifications|messages|loyalty|gift-cards|coupon-history|invoices|owner|admin|portal|apply|settings|map)(:path*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        // Hotel detail pages - short cache, must revalidate
        source: '/hotels/:slug',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // Location pages - no cache
        source: '/locations/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // Home page with query params - no cache
        source: '/',
        has: [
          { type: 'query', key: 'search' },
        ],
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
