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
// v21: 2026-05-30 — god category tags: with 1,069 deities, users had no cue
// what each god is "about". Added a domain→theme map (12 colour-coded themes:
// ❤️ love · 💰 wealth · ⚔️ power · 🧠 wisdom · 🛡️ protection · 🌿 nature ·
// ☀️ light · 🌙 night · 💀 death/rebirth · 🩺 healing · 🎨 art · 🌌 cosmos ·
// 🙏 faith) shown as Thai/EN chips on the blessing card, god-detail modal, and
// collection grid. 100% of gods get >=1 tag (80% via category, 20% fall back
// to their own first domains).
// v22: 2026-05-30 — MULTI-tag mythology categories baked into gods.json. A god
// can legitimately span several domains (Diana = night+nature+protect+power;
// Ishtar-type = love+power), so single-tag was lossy. All 852 Common+Uncommon+
// Rare deities now carry a curated `categories[]` array (1-6 keys) researched +
// cross-checked by parallel comparative-mythology agents with an accuracy audit
// (~97% Common/Uncommon, Rare re-run with reasoning agents + 9 audit fixes).
// 87% are multi-tagged (2-5 tags). _godCategories() prefers the baked array and
// falls back to represents-derived tags for the 217 Epic/Legendary/Mythic still
// pending. Chips on the card now show up to 4, god-detail modal up to 5. Bump to
// re-fetch the enlarged gods.json so visitors see the richer tags immediately.
// v23: 2026-05-31 — multi-tag categories now cover ALL 1,069 deities (100%).
// The final 217 Epic/Legendary/Mythic showcase gods (Zeus, Odin, Ra, Vishnu,
// Amaterasu, Quetzalcoatl, the Thai pantheon...) were tagged by reasoning agents
// + audit; 28 famous gods two failed batches dropped (Egyptian/Aztec/Mesopotamian/
// Thai) were hand-tagged from mythology; 5 audit fixes (Gaia, Venus, Durga, Indra,
// Hachiman). ~98% of top-tier carry 3-6 tags. Mythic/Legendary/Epic no longer fall
// back to represents — every god shows curated chips. (Also: the duplicate
// "Wakan Tanka" entry, Mythic + Legendary, now both tagged.) Bump to re-fetch.
// v24: 2026-05-31 — two fixes: (1) Cosmic Blueprint no longer shows the
// "dataset n=1,211" stat on the Soul Frequency page (it implied an empirical
// corpus that isn't surfaced; methodology line now just states "median of 26
// systems, equal weight"). Engine bundle rebuilt. (2) Gumroad post-purchase
// unlock: products redirect back to /?gr=1&sale_id=… → _handleGumroadReturn()
// verifies the sale server-side via new /api/gumroad/verify and grants the
// item locally (+ a manual "Already bought? Unlock with email" fallback on the
// paywall). Bump to ship the new engine + return-handler to existing visitors.
// v25: 2026-05-31 — add-on depth + a real bug fix: (BUG) _buildDeepAddon
// referenced `hdStrategy`, only defined in another function, so clicking
// "deep reading" on mirror/pet/companions/exercise/food/product threw a
// ReferenceError — the deep add-on generated NOTHING. Defined it in scope.
// (ENRICH) every add-on now opens with a 2-paragraph synthesis "reading" woven
// from the chart (element seam, HD strategy, life path), not just a table of
// system rows. (MONTHLY) the Monthly Brief gains a 12-month year-at-a-glance
// strip (verdict + score per month + peak/rest callouts). Bump to ship all.
// v26: 2026-05-31 — add-on polish: (1) the 4 thinnest Deep-Reading systems
// (Onmyōdō, Arabic Parts, Zoroastrian, Ifá) each gain a real 2nd stat
// (yin-yang polarity / fortune element / month Amesha / Odù theme) so every
// system shows ≥2 data points; (2) Compatibility now ends its verdict with an
// elemental-chemistry "reading" — interprets the 5-element relationship between
// the two charts (feeds / refines / mirrors / neutral) into concrete guidance,
// matching the depth of the other add-ons. Bump to ship.
// v27: 2026-05-31 — per-item purchases now persist server-side: the Gumroad
// webhook records every sale into public.myth_purchases (woam), a new
// /api/me/purchases endpoint returns a logged-in buyer's owned items, and
// _refreshPremium restores them on this device → one-time unlocks survive a
// cache-clear or a new device once you're signed in (no more re-redeem). All
// paths fail soft until the migration (migrations/002_purchases.sql) is applied.
// Also: garsell@hotmail.com added to OWNER_EMAILS. Bump to ship the client side.
// v28: 2026-05-31 — simpler first impression (feedback: "ใช้งานยาก ข้อมูลเยอะ").
// New visitors used to land on the full birth-data form. The entry overlay is
// now 2-step: a clean hero (value prop + one "✨ เริ่มดูดวงฟรี" button + explore/
// sign-in) → the birth-data form reveals only on click (entryShowForm). The
// returning-user fast path still skips the overlay entirely; a stale/forced
// re-entry with saved data jumps straight to the pre-filled form. Bump to ship.
// v29: 2026-05-31 — "My Unlocks" tab (was "Library") now opens with a clear
// 3-tier plan comparison (Free / one-time / subscription $4.99) so buyers stop
// wondering what the subscription includes vs a single buy, then lists what
// they own. Tab relabelled 📦 ที่ปลดล็อก / My Unlocks for discoverability.
const CACHE = 'mythsensus-v44';
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
