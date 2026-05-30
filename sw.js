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
// v9: 2026-05-28 — pre-launch polish: Vercel Analytics, homepage meta
// description, pricing copy → subscription model. Bump to refresh HTML.
// v10: 2026-05-28 — perf: externalized MS26 engine bundle (→/build/ms26-bundle.js)
// + GODS_FULL (→/data/gods.json), cut index.html ~1MB. Bump to refresh HTML.
// v11: 2026-05-28 — UX: Cosmic Library link in app header, clearer sign-in
// label (LINE+Email), prominent "Explore first" skip button. Bump to refresh.
// v12: 2026-05-30 — share-the-draw (per-card share button + deep-link),
// multi-blessing variety for 217 rare-tier gods, cover element emoji fix
// (Day Master no longer always 🔥), "10 ศาสตร์" → "26 ศาสตร์" in library doc,
// owner dev-mode (?dev=1). Bump to force every cached client to re-fetch.
// v13: 2026-05-30 — post-workflow-review fixes: clear mth_owner_dev on
// sign-out (paywall-leak), thread message+msgIdx into history (fixes wrong
// blessing text in history for all 217 enriched gods), re-key
// _ELEMENT_TRAITS_EN to English (fixes em-dashes in mirror/pet/companions),
// add the missing 26th DEEP_SYSTEM (Thai 7-Number System), deep-link race
// rescue in _bootAfterEntry, lang+msg encoded in share URL,
// _webShareText/_webShareCopy use in-memory LANG, Grand Convergence MVP
// (TL;DR + cross-cultural banner + variant perception + rarity signature),
// Element Consensus added to cover. Bump to evict stale clients.
// v14: 2026-05-30 — Gumroad per-item product wiring: _GUMROAD_PRODUCTS map
// for 9 paid items, _gumroadCheckout resolver, _purchaseSubscription split,
// _purchasePaywall dual-CTA (one-time + subscribe), product palette Thai/EN
// colour-name → hex map (palettes for ดิน/น้ำ/โลหะ profiles now render
// chips instead of empty rows). Bump so the dual-CTA paywall + colour
// chips reach existing visitors immediately.
// v15: 2026-05-30 — 9 one-time Gumroad products created via API and pasted
// into _GUMROAD_PRODUCTS. The "Unlock $X" paywall button now sends buyers
// to per-item one-time checkout (deep/mirror/pet/companions/exercise/food/
// product/compat/full_report) instead of the subscription fallback. The
// products remain `published:false` on Gumroad until Director publishes
// them, so during this brief window the buttons land on Gumroad's
// "product not found" page — bump cache so visitors get the correct URLs
// the moment the products go live.
// v16: 2026-05-30 — Grand Convergence Variant Perception now excludes
// time-variable systems (Biorhythm, Vedic Mahadasha) and requires score
// ≥50 below the chart's own median, so the "dissenting view" surfaces real
// identity-level dissent instead of today's biorhythm dip. Coherent charts
// (no real dissenters) render a "speaks with one voice" note instead.
// v17: 2026-05-30 — report ↔ add-on consistency: p24_pets now reads
// chart.addons.pet (was a parallel petMap → premium report and Pet add-on
// tab showed different animals); NEW Divine Mirror page (p_divineMirror)
// sourced from chart.addons.mirror so the Full Report includes it and
// matches the Mirror add-on exactly; report is now 43 pages (was 42),
// all "42 หน้า/42-page" copy bumped to 43 + Gumroad Full Report product
// renamed. Single source of truth for pet/mirror/companion across report
// and add-ons.
// v18: 2026-05-30 — three responsiveness/consistency fixes:
//  • 108 Organum now USES the question: pool is seeded from the question +
//    biased toward topic-relevant gods (TH/EN topic map) + consensus words
//    are IDF-weighted, so different questions give different, on-topic answers
//    (was always "sun/love/war" regardless of what you asked).
//  • Frequency Alerts rewritten from a raw key tally ("DAILY_PULSE 12×") into
//    recurring-deity + recurring-theme panels with an interpretation headline.
//  • Biorhythm no longer uses the current date anywhere: engine samples a
//    FIXED reference (2026-04-14, exposed as biorhythm.refDate) and the Deep
//    Reading tab reads it instead of new Date() — report + score are now
//    fully deterministic, a saved blueprint never drifts.
// v19: 2026-05-30 — review-2 follow-ups: (HIGH) EN Full Report pet card no
// longer beheads the animal name — p24_pets sources emoji+label from pet.main
// (emoji-prefixed in both langs) instead of pet.mainEn (no emoji), so EN shows
// "🐟 Fish in a tank — Betta / Koi" matching the add-on tab, not "F + ish".
// (MEDIUM) ADDON_COSMIC_BY_TIER rekeyed to the 7 real TIERS names — the Divine
// Mirror cosmic entity was wrong for Celestial/Radiant/Grounded/Emerging
// (all fell back to Tai Yi). (LOW) Organum tally lowercased to merge Healing/
// healing; Variant coherent-copy softened; renderFreqHistory escapes history
// strings (XSS defense); stale page-number comments fixed.
// v20: 2026-05-30 — UX fixes from user testing: (1) 108 Organum featured god
// cards now come from the WINNING-theme voters (vary per question + on-topic:
// money→Lakshmi/Caishen, love→Oshun, health→Apollo/Surya) instead of the same
// max-domain gods every time; (2) Monthly Brief gains a narrative paragraph
// per month (what the verdict means + a concrete move) — was just a score +
// chips; (3) Resonance "Generate Cosmic Blueprint now" button actually fires
// cb_generate so mobile lands on the finished report; (4) entry-overlay month
// is now a named dropdown (ม.ค./Jan…) to kill day/month confusion.
const CACHE = 'mythsensus-v20';
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
