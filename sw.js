const CACHE_NAME = 'golanaliz-v11';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pwa.js',
  './data.js',
  './advanced_stats.js',
  './local_logo_map.js',
  './fontawesome.min.css',
  './html2canvas.min.js',
  './auth.js',
  './manifest.json',
  './favicon.ico',
  './icons/apple-touch-icon.png',
  './icons/favicon-32x32.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stale-While-Revalidate Strategy:
// Instant 0ms load from cache (so opening from browser history or bookmark is instant)
// Background fetch keeps assets fresh without making the user wait.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache API calls, non-http, or sync endpoints
  if (url.pathname.startsWith('/api/') || !url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // Fetch fresh version in the background to update cache
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => null);

      // If available in cache, return IMMEDIATELY for 0ms instant display!
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache (first visit), wait for network
      return fetchPromise.then((networkResponse) => {
        if (networkResponse) return networkResponse;

        // Fallback for navigation requests if offline and not in cache
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html', { ignoreSearch: true });
        }
      });
    })
  );
});
