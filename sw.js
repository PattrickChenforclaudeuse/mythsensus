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
// 3-tier plan comparison (Free / one-time / subscription $8.99) so buyers stop
// wondering what the subscription includes vs a single buy, then lists what
// they own. Tab relabelled 📦 ที่ปลดล็อก / My Unlocks for discoverability.
// v65: 2026-06-04 — Lucky panel 7-day forecast strip (clickable day cards
// refocus detail view) + biorhythm refresh fix: Pet / Exercise / Identity
// Synthesis tabs now read TODAY's biorhythm via _liveBio(chart.input) instead
// of the engine's frozen BIORHYTHM_REF (2026-04-14) values. Aligns with the
// existing daily-refresh override that was scoped only to the Biorhythm
// Deep Reading tile since 2026-06-01.
// v66: 2026-06-04 — Divine Mirror tab now opens with a "2-axis summary"
// card pairing the element-based PRIMARY deity (e.g. Fire → Surya) with the
// tier-based COSMIC ENTITY (e.g. Resonant → Tai Yi) so users stop reading
// them as conflicting "your deity X" / "your deity Y". The detail cards
// below are now relabelled "AXIS 1 · PRIMARY ARCHETYPE" and "AXIS 2 ·
// COSMIC ENTITY" for the same clarity.
// v67: 2026-06-04 — Engine: biorhythm excluded from Cosmic Score median.
// Director feedback "biorhythm ไม่ควรอยู่ใน cosmic score สิถ้ามันไม่นิ่ง" —
// biorhythm is intentionally daily-changing, so including its score made
// the Cosmic Score (which should be a stable identity number) drift
// day-to-day. ScoreBreakdown now carries `scoring?: boolean`; biorhythm
// is set to `scoring:false`. Median is computed from the 25 voting
// systems, biorhythm is still shown in the breakdown but in a separate
// "Daily layer · not scoring" card with explanatory copy. /build/ms26-bundle.js
// regenerated.
// v94 — Audit residual finals (Option A polish):
// • A3: MCP repo prominent link in #aiHonest banner — "MCP server" now
//   hyperlinked to github.com/PattrickChenforclaudeuse/mythsensus-mcp +
//   inline `npx mythsensus-mcp` snippet. Closes P2 "Maybe star (no
//   GitHub found)" signal.
// • A1: Share URL privacy verified + documented — _webShareUrl audit
//   confirms zero birth-data leak. Added defensive privacy-invariant
//   comment in code + "Social Sharing" section in /privacy explicitly
//   stating shares never encode DOB/time/city/name/email.
// • A2: Age gate soft confirm — checkbox "ฉันอายุ 13+ / parental consent
//   for 13-17" in entry overlay form. Persists localStorage.mth_age_confirmed
//   so returning users skip. Closes P3 enforcement-gap signal.
// • A4: NEW blog /blog/calibration-methodology — open-book disclosure of
//   Astrodatabank AA-rated dataset, 3-criterion objective function, why
//   not supervised ML, why frozen, honest gap disclosure. Linked from
//   /how-it-works methodology section. Closes P2 HN-killer signal.
// • Sitemap updated with new blog URL + lastmod.
// v95: 2026-06-10 — Cosmic Blueprint fixes (Director feedback):
// • Reader mode: generated report now takes over the viewport as a fixed
//   full-screen reader (toolbar pinned, ONE scroll area, iframe expanded
//   to content height). Fixes report revealing below the fold ("nothing
//   happened" after Generate) + nested page/iframe scrolling that broke
//   touch scrolling entirely on mobile. All report paths (generate /
//   saved profile / famous chart) share _cbShowReport(); cb_goBack()
//   restores page scroll + rails.
// • Biorhythm fully split out of the 26: loading animation + cb-badge
//   strip + JSON-LD featureList now show Thai Taksa (8 Houses) instead.
//   Engine report: page 28 Biorhythm → new ทักษา ๘ บ้าน page (8-house
//   wheel, มูละ/กาลกิณี highlights); Grand Convergence votes/family bars/
//   dissent now use the 26 voting systems only (scoring:false excluded).
//   EN family map fragments added — EN reports previously dropped 6
//   systems from the cross-cultural bars.
// • Grand Convergence detail: new "Per-system verdicts" table (every
//   tradition's raw finding, grouped by cultural family, score-coded),
//   strong-system names under each family bar, theme chips now carry
//   per-system scores. Taksa added to wealth votes + finance/timing
//   signal pools. /build/ms26-bundle.js regenerated.
// v96: 2026-06-10 — audit P1/P2 follow-ups:
// • Mobile (≤520px) group-tab labels (e.g. "COSMIC BLUEPRINT") wrap to 2 lines
//   instead of overprinting the neighbouring tab.
// • Reader mode re-fits the report iframe height on resize/orientation (was
//   frozen at first load → clipped content after rotating). Swipe-to-tab and
//   pull-to-refresh disabled while the reader is open; #cb-report-wrap gets
//   overscroll-behavior:contain (no native pull-to-refresh / scroll chaining).
// • Consistency: Biorhythm reframed from "one of the 26 scoring systems" to the
//   27th daily layer (Thai Taksa is the 26th) across /cosmic-score FAQ+JSON-LD,
//   /blog/biorhythm (meta/FAQ/article/body EN+TH), /how-it-works (26 voting).
// • api/oracle/addon CORS locked to mythsensus.com origin(s) (was '*').
// • build:engine auto-copies bundle to served root /build; test SYS adds taksa.
//   Engine math unchanged — bundle still ?v=95.
// v97: 2026-06-10 — engine bundle CHANGED (now ?v=97):
// • Vedic Mahadasha TH scoring fix: calcVedicMahadasha looked up DASHA_QUALITY
//   with the localized planet name, so Thai reports silently fell to the 730
//   fallback — a wrong, EN-divergent Mahadasha score. Now keyed via canonical
//   English (tPlanet); currentDashaKey added; report.ts vote/colour checks use
//   it. Verified: EN scores 0/200 changed, TH 77/200 shift (max 21), and
//   TH==EN now 200/200 (was 123/200) — pure consistency fix, EN untouched.
// • Convergence sc() lookups now match systemEn → EN reports no longer render
//   "· 0" on Celtic/Western/Energy chips. Rarity number "1685,000"/"1685k" →
//   "1,684,800" / "1.7M". Garbled TH footer "จาก ลูกหลาน" → "เพียงลำพัง".
// • sample-report/sunthorn-phu regenerated from the live engine (Taksa page +
//   per-system verdicts; old Biorhythm page gone).
// v98: 2026-06-10 — God Collection cross-device sync fix:
// The Collection is derived from mth_full_history, which synced as a plain STRING
// key (last-write-wins) — a draw on the phone and a different draw on the PC never
// merged; whichever device pushed last clobbered the other's history, so the two
// collections diverged. mth_full_history is now union-merged across devices
// (_HISTORY_SYNC_KEYS + _mergeHistoryKey, dedup by type+ts+god, newest-first,
// capped) in _sbPush / _sbPullAndMerge, and explicitly skipped by the string-
// clobber paths (_sbPullStringsAndApply, _onSignIn). Collection + History panels
// auto-re-render after a pull. Engine/bundle unchanged (?v=97).
// v99: 2026-06-10 — same union-merge applied to the per-item purchase map
// (mth_purchased = { 'itemKey:chartHash': true }) so a $9 unlock bought on the
// phone and another on the PC can't overwrite each other in the local cache.
// (Purchases are already account-authoritative: subscription via app_metadata.plan
// + per-item via the server myth_purchases table, re-granted by _refreshPremium on
// every device — this is defence-in-depth for the localStorage cache.) Engine
// unchanged (?v=97).
// v100: 2026-06-10 — gift-code loophole fix. A gift code granted ONE free Deep
// Reading PER CHART HASH, so editing any input field (DOB/time/name/…) minted a
// fresh free $9 reading from the SAME code — unlimited until expiry. Now each
// code is one-shot: _markGiftCodeUsed / _isGiftCodeUsed gate redemption by code,
// not by hash (mth_gift_used_codes). Distinct codes still each grant one reading
// (plaintext codes intentionally shareable). Spend + consumed map now sync &
// union-merge cross-device (mth_gift_used_codes + mth_gift_consumed in
// _MAP_SYNC_KEYS) so the loophole can't reopen phone↔PC. Engine unchanged (?v=97).
// v101: 2026-06-10 — Cosmic Blueprint now PAID (Director decision: Full Report =
// Cosmic Blueprint = Cosmic Premium = one $19 product). cb_generate (and the
// viewMultiProfile path) now gate on _hasItemAccess('full_report'); owner /
// subscriber / one-time buyer of that chart see the full 43-page report, everyone
// else gets a free TEASER (Cosmic Score + the "X systems agree" Grand Convergence
// preview — our selling point) + the $19 paywall (#cb-paywall-wrap, parent-doc so
// purchase buttons work). _chartInputHash() now also hashes an explicit profile so
// a saved profile's entitlement is checked correctly. Famous-people charts stay
// free demos. Engine/bundle unchanged (?v=97).
// v102: 2026-06-10 — Biorhythm fully removed from the STATIC 43-page report. It's
// a daily-changing value (the engine computes it against a fixed reference, so it
// was a frozen, misleading number in a one-time report). Removed: the p02 daily
// card, the p_threeScores line, the "current biorhythm pulse" block, the health/
// finance/timing consensus signals, the activation/pain-point references, and the
// p18 Monthly forecast's Bio column (now NSK + Numerology). Top-5/Bottom-3 and
// the watch-list now filter scoring:false so Biorhythm can't slip back in.
// Biorhythm lives ONLY in the live Daily Pulse (computed against today). Engine
// bundle changed → ?v=102; sample-report regenerated.
const CACHE = 'mythsensus-v105';
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
