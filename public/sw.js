const CACHE_NAME = 'busybeds-v2'; // Incremented version
const STATIC_ASSETS = ['/', '/offline.html'];

// Paths that should NEVER be cached (dynamic data)
const NEVER_CACHE_PATHS = [
  '/api/',
  '/dashboard',
  '/coupons',
  '/favorites',
  '/profile',
  '/referral',
  '/notifications',
  '/messages',
  '/loyalty',
  '/gift-cards',
  '/admin',
  '/portal',
  '/owner',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// Check if URL should be cached
function shouldCache(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // Never cache dynamic paths
  for (const path of NEVER_CACHE_PATHS) {
    if (pathname.startsWith(path)) {
      return false;
    }
  }
  
  // Don't cache hotel detail pages
  if (pathname.startsWith('/hotels/') && pathname !== '/hotels') {
    return false;
  }
  
  // Don't cache URLs with query parameters
  if (urlObj.search && urlObj.search.length > 0) {
    return false;
  }
  
  return true;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = event.request.url;
  const shouldUseCache = shouldCache(url);
  
  // Network only for dynamic content (no caching)
  if (!shouldUseCache) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
        })
    );
    return;
  }
  
  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      
      return fetch(event.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match('/offline.html'));
    })
  );
});

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'BusyBeds', {
      body: data.body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url ? { url: data.url } : {},
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
