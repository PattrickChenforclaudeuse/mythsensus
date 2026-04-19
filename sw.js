// Mythsensus service worker — minimal offline-first cache for the core app.
// When the user visits once online, subsequent opens work without network.
const CACHE = 'mythsensus-v1';
const PRECACHE = [
  '/',
  '/beta/',
  '/beta/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/og-default.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for same-origin GET requests; network-first for others.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((resp) => {
            // Only cache successful, basic responses.
            if (resp && resp.ok && resp.type === 'basic') cache.put(req, resp.clone());
            return resp;
          })
          .catch(() => cached); // offline fallback
        return cached || fetchPromise;
      })
    )
  );
});
