// Mythsensus service worker v2.
// Strategy:
//   - HTML documents: NETWORK-FIRST (so deploys show up immediately, fall back
//     to cache only when offline)
//   - Static assets (SVG/CSS/JS/fonts/JSON): stale-while-revalidate
// This fixes the v1 bug where cache-first HTML served stale app forever until
// reload, making it look like "sign-in doesn't remember" after deploys.
// v3: app moved from /beta/ to / on 2026-05-02. New cache name forces clients
// to re-fetch; old /beta/ entry removed because the route now 301-redirects.
// v4: 2026-05-07 — bump after Daily Pulse + multi-profile + nav-toggle removal
// shipped together. Several users were stuck on v3-cached HTML where addon
// sub-tabs landed on stale panel IDs (deep → sky, compat → no-op). Bumping
// the cache name forces every client to re-fetch fresh assets on next load.
// v7: 2026-05-26 — auth/payment migration. Portal moved to Supabase Auth and
// pricing forms now POST to LemonSqueezy. Bump to evict stale portal HTML.
// v8: 2026-05-28 — Gumroad payment + subscription gating live (premium check
// via /api/me/plan). Bump to evict the old all-unlocked beta HTML.
const CACHE = 'mythsensus-v8';
const PRECACHE = [
  '/',
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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isDoc = req.mode === 'navigate' ||
                req.destination === 'document' ||
                req.headers.get('Accept')?.includes('text/html');

  if (isDoc) {
    // Network-first for HTML. Always try to serve a fresh document; fall back
    // to cache if the network is unavailable (true offline).
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return resp;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((resp) => {
            if (resp && resp.ok && resp.type === 'basic') cache.put(req, resp.clone());
            return resp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
