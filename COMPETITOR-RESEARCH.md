# Mythsensus — Competitive Landscape Research
**Date:** 2026-05-02
**Goal:** Inform pricing, scope, and positioning vs. competitors in astrology / Human Design / BaZi report space.

---

## TL;DR — How Mythsensus stacks up

| Dimension | Mythsensus (current) | Industry median | Premium tier |
|---|---|---|---|
| Systems covered | **26** | 1–3 | 5–8 |
| Report length | **42 pages** | 5–15 pages | 15–35 pages |
| One-time price | **$19** (~฿650) | $5–25 | $30–80 |
| Subscription | **$5/mo** (~฿180) | $10–15/mo | $15–25/mo |
| Add-ons | **6 × $5–9** | rarely separated | rare |
| Languages | **TH + EN** | EN only | EN+local |

**Mythsensus's defensible position:** *more systems, more pages, lower price* — i.e., the "comprehensive" niche at a value price. Most premium players sell ONE system deeply ($30–80); Mythsensus sells 26 systems at $19. The 42-page output already exceeds most paid PDFs in the Thai market.

---

## Western / Global apps

### Co-Star ([source](https://www.costarastrology.com/))
- **Free:** daily horoscope, full birth chart display, friend compatibility
- **Premium:** ~$15/mo — deep interpretations, transit history, "Ask the stars" Q&A
- **Format:** mobile-first interactive chart, AI-personalised daily push notifications
- **Systems:** 1 (Western only)
- **Strength:** real-time transits via NASA data, viral social compatibility
- **Weakness:** doesn't go deep into report; no PDF export

### The Pattern ([source](https://thepattern.zendesk.com/hc/en-us/articles/360055659311))
- **Free:** birth chart, basic readings
- **Go Deeper+ Subscription:** $14.99/mo (also quarterly / annual)
- **Connect+:** quarterly only (relationship readings)
- **Format:** narrative blocks, no PDF
- **Systems:** 1 (Western, with proprietary "Pattern" framework)

### Sanctuary ([source](https://www.sanctuaryworld.co/faq.html))
- **Free:** app + daily reading
- **Live psychic readings:** $2.99/min, sold in 10/15/20/30-min increments
- **Astrologer chat sessions:** $20–60+/session
- **Systems:** 1 (Western) + tarot
- **Strength:** human astrologer access on demand
- **Weakness:** per-minute pricing; cost scales with depth

### Cafe Astrology / Astro-Seek ([source](https://astro.cafeastrology.com/))
- **Free** — fully free natal chart with interpretations
- No PDF export, browser-rendered text reports
- Western-only, encyclopedic but un-personalised tone

---

## Thai market — Human Design / BaZi specialists

### Fastwork sellers (representative examples)
- **Celestial Synergy** — Western + Human Design analysis, **PDF report, ฿1,290** ([source](https://fastwork.co/user/celestialsynergy/horoscope-22766063))
  - Couples reading: ฿1,990
- **Mariya Poy** — Human Design rayabukkhon (per-person), full PDF including Type / Strategy / Authority / Profile / Not-Self Theme / Incarnation Cross ([source](https://fastwork.co/user/mariyapoy/horoscope-38366300))
- **Chakkapunt** — Human Design full personal — ranges ฿1,500–3,000 typical ([source](https://fastwork.co/user/chakkapunt/counseling-76021920))

### TAN TAROT
- **Human Design ฉบับสมบูรณ์ — ฿7,599** for **35-page** PDF including Money, Business, Family, Relationships chapters ([source](https://x.com/tarotbytan/status/2011016045004537881))
- This is the upper end of the Thai market for digital reports.

### Free Thai sites
- **myhora.com**, **payakorn.com**, **meemodel.com** — all free, browser-rendered Thai/Brahmin astrology tools, no PDF, no Human Design, no BaZi
- Audience expects deeper paid alternatives

---

## What competitors do NOT do (Mythsensus's gap to exploit)

1. **No competitor synthesises 10+ systems into a single report** — Pattrick's "consensus" framing is genuinely unique. The closest is Astro-Seek's tool sprawl, but each tool is a separate page with no unification.

2. **No competitor offers Thai language with breadth.** Thai sellers do single-system depth; Co-Star/Sanctuary/Pattern ignore Thai. Mythsensus's bilingual TH+EN at the same depth is a moat.

3. **No competitor has cross-system "tactical actions"** (the 7-day playbook we just added to add-ons). Reports stop at description; Mythsensus translates to behaviour.

4. **Add-ons sold separately is rare** in this space. Most apps bundle everything into a flat subscription. The à-la-carte $5–9 model could appeal to price-sensitive users who want only one specific add-on (e.g., compatibility for a single relationship).

5. **Cosmic Score** as a single 1–999 number is novel. The "Top X% of the world" framing borrows credibility from credit-score / IQ-test conventions and is highly shareable (Spotify Wrapped vibe).

---

## Pricing recommendations

Given the 42-page output + 26 systems already implemented, current pricing is **under-positioned vs. value delivered**:

| Tier | Current | Recommended | Rationale |
|---|---|---|---|
| Full Report | $19 / ฿650 | **Keep $19 for soft launch** | Anchors as "budget for comprehensive" — psychological gateway |
| Add-ons | $5–9 | $5–9 | Already correct — psychologically below "real money" |
| Subscription | $5/mo | $5/mo, **add $48/yr (= $4/mo)** | Yearly subscription standard discount; LTV-friendly |
| Premium "Coaching" upsell | (none) | **$49 — 3-month re-read** | Quarterly transit overlay on user's chart, fresh narrative. New SKU, very low marginal cost (one engine call), high margin |
| White-label / Group | (none) | **$199 — Family Pack of 5 charts** | One purchase = 5 profiles + cross-compatibility matrix. Targets families / wedding planners |

**Key constraint:** at $19 with 26 systems and 42 pages, Mythsensus must NOT race-to-bottom further on price. The right next move is to add a higher tier ($49 quarterly re-read) for engaged users, not to cut $19.

---

## Where Mythsensus needs to catch up

| Gap | Competitor doing it well | Action |
|---|---|---|
| **Live psychic / human astrologer** | Sanctuary | Long-term: certified BaZi readers can do follow-up consultations, $40 / 30-min |
| **Daily push notifications** | Co-Star | Already planned in roadmap (LINE OA bot) |
| **Social compatibility virality** | Co-Star | Cosmic Alias Generator already addresses this; needs share-card polish |
| **Real-time transits** | Co-Star (NASA data) | Subscription Daily Star Chart already does this; bumping accuracy needs Swiss Ephemeris commercial license at scale |
| **Mobile native app** | Co-Star, The Pattern | PWA workable for now; native iOS/Android in Phase 4 |
| **Onboarding tour** | Sanctuary, Pattern | Currently zero. 3-step onboarding spec exists in brief — should ship before public launch |

---

## Content depth recommendations (per add-on tab — addresses "ยังไม่ละเอียด")

After this session's `_buildDeepAddon` upgrade (7-day tactical block + avoid + mantra), each add-on tab now produces ~500–700 words of synthesised, actionable content. To bring it to TAN TAROT's 35-page level we'd need:

1. **Per-add-on visual chart** (radar / pentagram) showing strengths across 5 elements
2. **Cross-system contradiction callouts** ("BaZi and Mayan disagree on X — here's why")
3. **30-day journal prompts** (vs. current 7-day)
4. **Personalised case studies** ("Other LP-7 + Yang Fire individuals describe…")
5. **A monthly transit overlay** that refreshes the same add-on output with current date

Items 1, 2, 3 are doable in the existing engine. Item 5 requires a date-aware rendering pass.

---

*Sources gathered 2026-05-02. Pricing in source materials may have shifted; spot-check before quoting publicly.*
