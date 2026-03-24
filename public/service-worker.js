const CACHE_NAME = 'busybeds-v2'; // Incremented version to force cache clear
const STATIC_URLS = [
  '/',
  '/offline.html',
];

// Paths that should NEVER be cached (dynamic data)
const NEVER_CACHE_PATHS = [
  '/api/',           // All API routes
  '/dashboard',      // User dashboard (dynamic)
  '/coupons',        // User coupons (dynamic)
  '/portal',         // Hotel portal (dynamic)
  '/admin',          // Admin panel (dynamic)
  '/profile',        // User profile (dynamic)
  '/favorites',      // User favorites (dynamic)
  '/referral',       // Referral data (dynamic)
  '/notifications',  // Notifications (dynamic)
  '/messages',       // Messages (dynamic)
  '/loyalty',        // Loyalty points (dynamic)
  '/gift-cards',     // Gift cards (dynamic)
  '/coupon-history', // Coupon history (dynamic)
  '/invoices',       // Invoices (dynamic)
  '/owner',          // Owner pages (dynamic)
];

// Install service worker and cache static assets only
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete ALL old caches to force fresh start
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Check if URL should be cached
function shouldCache(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // Never cache non-GET requests
  // Never cache API routes
  // Never cache dynamic user-specific pages
  for (const path of NEVER_CACHE_PATHS) {
    if (pathname.startsWith(path)) {
      return false;
    }
  }
  
  // Don't cache URLs with query parameters (usually dynamic)
  if (urlObj.search && urlObj.search.length > 0) {
    return false;
  }
  
  // Don't cache hotel detail pages (they have dynamic coupon data)
  if (pathname.startsWith('/hotels/') && pathname !== '/hotels') {
    return false;
  }
  
  // Don't cache location pages (dynamic hotel lists)
  if (pathname.startsWith('/locations/')) {
    return false;
  }
  
  return true;
}

// Fetch strategy: Network first for dynamic content, cache first for static
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;
  const shouldUseCache = shouldCache(url);

  // For dynamic content: Network only (no caching)
  if (!shouldUseCache) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          // If offline and it's a navigation request, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // For static content: Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // Clone and cache successful responses for static content only
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache or offline page
        return caches.match(event.request)
          .then(response => response || caches.match('/offline.html'));
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Busy Beds', body: 'You have a new notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
