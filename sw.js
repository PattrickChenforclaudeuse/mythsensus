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
// subscriber / one-time buyer of that chart see the full in-depth report, everyone
// else gets a free TEASER (Cosmic Score + the "X systems agree" Grand Convergence
// preview — our selling point) + the $19 paywall (#cb-paywall-wrap, parent-doc so
// purchase buttons work). _chartInputHash() now also hashes an explicit profile so
// a saved profile's entitlement is checked correctly. Famous-people charts stay
// free demos. Engine/bundle unchanged (?v=97).
// v102: 2026-06-10 — Biorhythm fully removed from the STATIC in-depth report. It's
// a daily-changing value (the engine computes it against a fixed reference, so it
// was a frozen, misleading number in a one-time report). Removed: the p02 daily
// card, the p_threeScores line, the "current biorhythm pulse" block, the health/
// finance/timing consensus signals, the activation/pain-point references, and the
// p18 Monthly forecast's Bio column (now NSK + Numerology). Top-5/Bottom-3 and
// the watch-list now filter scoring:false so Biorhythm can't slip back in.
// Biorhythm lives ONLY in the live Daily Pulse (computed against today). Engine
// bundle changed → ?v=102; sample-report regenerated.
// v112: 2026-06-11 — blessing DRAW card never showed the Epic+ pixel art.
// Root cause: drawBlessing() rendered #godSymbol via `textContent = god.symbol`
// (the emoji) and NEVER called _godArtInto, so the 216 portraits (v105) only
// ever appeared on shared deep-links + the god-detail modal — the primary draw
// flow always painted the bare emoji. For Caishen that emoji was ⚔️ (a war
// glyph wrong for the God of Wealth), so the gold-ingot caishen.webp (deployed,
// HTTP 200) was invisible and users saw "crossed swords". Fixes: (1) drawBlessing
// now calls _godArtInto on #godSymbol like _renderGodCard, so Epic+ draws show
// the webp (verified: an Epic draw renders <img src=/assets/god-art/…webp>,
// lower tiers still fall back to emoji); (2) Caishen gods.json symbol ⚔️→💰 so
// the fallback is wealth-appropriate too.
// Also v112 — Today's Sky language leak: toggling EN/TH only repainted the
// planet strip (renderSkyCards), never #skyTeaser, so the วันทอง / "Peak day"
// verdict card + glance cells (Moon Phase / Day's Deity / Nakshatra) stayed in
// the language they were first calc'd in (Thai content under an English UI).
// Extracted _renderSkyTeaser() and call it from both calcSky() and applyLang()
// so the teaser rebuilds under the current LANG on every toggle (verified: TH
// "วันทอง…" → EN "Peak day…").
// Also v112 — daily blessing quota is now tiered: free / guest = 1 draw/day,
// paying users (active subscriber or owner) = 3. MAX_DRAWS const → _maxDraws()
// (reads _IS_PREMIUM/_OWNER_MODE); updateBlessingStatus() now also drives the
// draw button so it re-enables when premium resolves async. Still a client-side
// soft cap (no server cost to a draw).
// Bump CACHE so clients re-fetch the corrected index.html + gods.json instead
// of serving the stale copies.
// v113: 2026-06-12 — buy buttons did nothing inside the installed PWA. The
// Cosmic Blueprint ($19) + all add-on checkouts called window.open(url,'_blank'),
// which silently fails in a standalone/iOS PWA (no browser chrome for a new tab)
// and is killed by popup blockers. New _openCheckout() detects standalone (and a
// null/blocked popup) and falls back to same-window navigation; Gumroad redirects
// back to /?gr=1 (_handleGumroadReturn) so the round-trip still unlocks. Product
// mbkayz confirmed PUBLISHED at $19 via Gumroad API — this was purely the opener.
// v114: 2026-06-12 — purchases bought while signed in via LINE (or any social
// login whose account email ≠ the email typed at Gumroad) never auto-unlocked:
// the webhook records myth_purchases under the Gumroad email, but
// /api/me/purchases looks up by the session email (LINE = a synthetic
// line_*@line.mythsensus.local). _withBuyerEmail() now prefills the checkout
// email with the signed-in account email (real emails only) so the sale is
// recorded under the same address the app queries → auto-restores. LINE
// pseudo-emails still use the manual "Unlock with email" / need LINE email scope.
// v115: 2026-06-12 — god tier colours corrected to the standard rarity ramp +
// the app's own --green/--blue/--red palette: Uncommon was blue / Rare was green
// (swapped) → Uncommon #4aba50 green, Rare #6090c0 blue; Mythic #ff9030 orange →
// #ff6060 red. Single TIERS source, so collection grid / blessing card / history
// all follow.
// v116: 2026-06-12 — Premium → My Reports cleanup. (1) Dates rendered from the
// stored locale STRING, so a report saved while the UI was English showed
// "May 1, 2026" among Thai พ.ศ. dates — now formatted from r.ts under the
// current LANG. (2) The same chart could appear twice (cross-device union +
// an engine change between saves → 757 vs 771 rows) — renderSavedReports now
// dedupes by normalized name+dob keeping the newest ts and persists the cleaned
// list, so re-opening matches the row shown.
// v117: 2026-06-12 — Secret "YOUR DESTINY HAS CHANGED" event (the 1-in-a-million
// Hidden "???" tier): every draw now plays a ~2.5s reveal spin so the rare pull
// can't be spotted by timing; the ??? roll branches to a glitch sequence
// (tremor → garbled murky signal → void → a presence types broken fragments
// that accumulate → the verdict, close-only), true 1-in-a-million odds, and a
// masked collection row that only appears once hit. Plus God Collection chip
// overflow fix + the ??? row stays hidden until drawn. Bump to evict stale HTML.
// v118: 2026-06-12 — first-party engagement tracking. Vercel Web Analytics
// can't measure a single-page app (everything happens on '/' → engaged users
// look like bounces, no dwell time). Added /api/track + a tiny client beacon
// that logs ACTIVE dwell time + draw/rare/destiny/paywall/checkout counts to
// public.myth_events on woam (PII-free, no AI cost). Bump to refresh HTML.
// v119: 2026-06-13 — disambiguate "ฟ้าวันนี้" (Today's Sky) vs "ดวงวันนี้"
// (Daily Pulse). The two tabs both end in "...วันนี้" and read as duplicates;
// users conflate them and miss the Pulse (a subscriber feature) → lost upsell.
// Reframed both subtitles to state their ROLE: Sky = the raw facts, not a
// verdict ("ข้อเท็จจริงล้วน ยังไม่ตีความ"); Pulse = Sky + 7-10 systems
// synthesised into one reading ("รวมฟ้าวันนี้ + 7-10 ศาสตร์ → คำอ่านเดียว").
// Copy-only (sky_dom_hint_all + pulse_hint, EN+TH + HTML fallbacks).
// v138: 2026-06-17 — engagement + error telemetry. (1) early <head> error buffer
// + flush via _msAnalytics → silent JS breakage on budget/in-app browsers stops
// looking like disinterest. (2) fire-once interacted/scrolled flags on the
// session beacon → splits silent non-drawers into "browsed" vs "cold bounce".
// Funnel dashboard surfaces both. Bump to evict stale HTML.
// v139: 2026-06-17 — new-vs-returning split. Durable `mth_seen_v1` marker → the
// session beacon carries meta.returning, so the funnel dashboard can split bounce
// /draw/engaged by first-time (saw the entry wall) vs returning (skipped it).
// v140: 2026-06-17 — entry hero opening line reworked from the abstract
// "หมอดูทั่วไปใช้ศาสตร์เดียว — เถียงได้" to a concrete, relatable pain:
// "ดูดวงไทยบอกอย่างนึง ดูดวงจีนบอกอีกอย่างนึง — แล้วเราจะเชื่ออะไรดี?" (sets up the 26-system payoff).
// v141: 2026-06-17 — entry hero made all-Thai: dropped the EN tagline + EN
// reinforcement sentence (rely on the in-app language toggle, no TH/EN stacking)
// + "agree" wording upgraded — "พูดตรงกัน"→"บรรจบ" (signature word), "เห็นพ้อง" kept.
// v142: 2026-06-17 — finish all-Thai entry: drop "/ Sign in" from the hero's
// sign-in link (Thai-only "ลงชื่อเข้าใช้ →").
// v143: 2026-06-17 — entry hero de-duplicated: "26 ศาสตร์/ชาติ" was stated 3×
// in the body; collapsed the two payoff lines into one ("ทุกศาสตร์บรรจบ → ฉันทามติ
// ของจักรวาล") and dropped "26" from the tagline, so the number lands once (headline).
// v144: 2026-06-17 — entry hero made language-reactive (was static Thai-only, so
// the EN toggle did nothing on the first screen). _refreshEntryHero() swaps TH/EN
// innerHTML per LANG via data-eh, hooked into applyLang(). Payoff → "ในเรื่องราวของคุณ".
// v146: 2026-06-19 — entry hook rework: primary CTA now the instant zero-form
// daily draw (entryDrawFirst), 26-system reading demoted to secondary; post-draw
// upsell card funnels draw → full reading; entry form's time/gender/city collapsed
// by default. Attacks 11.5s median / 1% birthday-fill / 0 shares.
// v180: 2026-07-03 — collection tier stability: renderCollection now guards on
// GODS_LOADED (re-renders when gods.json lands) so cards no longer flash the
// random per-draw rarity before snapping to the canonical tier.
const CACHE = 'mythsensus-v223';
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

  // Engine bundles (/build/ms26-bundle.js …) must NEVER be served stale — a
  // cached old bundle = wrong scores + old report/print CSS, invisible to the
  // user (2026-07-02: a stuck ?v=107 query + stale-while-revalidate kept the
  // Director on a pre-recalibration bundle across 4 deploys). Network-first
  // like HTML: always try fresh, fall back to cache only when truly offline.
  const isBundle = url.pathname.startsWith('/build/');

  if (isDoc || isBundle) {
    // Network-first. Always try to serve a fresh copy; fall back to cache if
    // the network is unavailable (true offline).
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
