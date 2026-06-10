const CACHE_NAME = 'mctv-offline-v1';

const PRE_CACHE_RESOURCES = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_RESOURCES);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch/Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // EXCLUDE list for stream chunks, feeds, live stream URLs and logs
  if (
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.mp4') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('youtu.be') ||
    url.hostname.includes('googlevideo.com') ||
    url.pathname.includes('/api/')
  ) {
    return; // Let the browser handle live feeds normally without cache
  }

  // Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.log('SW fetch failed, active offline mode: ', err);
          return cachedResponse;
        });

      // Return cached response instantly, or wait for network fetch
      return cachedResponse || fetchPromise;
    })
  );
});
