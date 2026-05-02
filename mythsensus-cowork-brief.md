# MYTHSENSUS — MASTER PROJECT BRIEF
## For: Claude Cowork Handoff
## Prepared by: Pattrick Chen
## Date: 29 March 2026

---

## 1. OVERVIEW

**Brand Name:** Mythsensus
**Origin of name:** Myriad + Mythical + Consensus
**Tagline:** *"Where myriad myths reach consensus — about you."*
**Status:** Pre-launch. Soft launch with beta testers imminent.
**Domain to register:** mythsensus.com (confirmed available, not yet registered)
**Tech Stack:** Vercel + Railway + Supabase + Lemon Squeezy + Resend + Claude API + Swiss Ephemeris + Puppeteer/wkhtmltopdf

---

## 2. WHAT IS MYTHSENSUS

Mythsensus is the world's first platform to synthesize **10 ancient wisdom systems** from 4 continents into a single, unified birth chart report — producing one **Cosmic Score (1–1,000)** that reflects the consensus of every tradition about who a person truly is.

**Core belief:** No single wisdom system has the complete picture. When 10 independent systems — developed over thousands of years across different cultures — reach consensus about the same person, that consensus is worth paying attention to.

**Pain points it solves:**
1. Astrology/divination information is scattered across 10+ different platforms
2. Users don't know which system to trust — but if 10 agree, that's signal
3. Most horoscope content is generic (written for 1/12 of humanity)
4. Premium consultations cost ฿3,000–15,000 per session

---

## 3. THE 10 SYSTEMS

| # | System | Origin | Age |
|---|--------|--------|-----|
| 1 | Western Astrology | Greece/Rome | 2,500 yrs |
| 2 | BaZi Four Pillars | China | 1,400 yrs |
| 3 | Vedic Jyotish | India | 3,000 yrs |
| 4 | Nine Star Ki | Japan | 1,200 yrs |
| 5 | Human Design | Modern synthesis | 35 yrs |
| 6 | Thai Numerology (7 numbers) | Thailand | 700 yrs |
| 7 | Pythagorean Numerology | Greece | 2,500 yrs |
| 8 | Thai Brahmin Astrology | Thailand | 800 yrs |
| 9 | Mayan Tzolk'in | Maya | 2,000 yrs |
| 10 | Celtic Tree Astrology | Celtic/Druid | 2,000 yrs |

**Input required:** Name, Date of birth, Time of birth (optional but improves accuracy), Place of birth, Gender
**Note:** Time of birth affects 4/10 systems (Western houses, Human Design, BaZi Hour Pillar, Thai Brahmin). All 10 systems still run without birth time.

---

## 4. PRODUCT ARCHITECTURE

### FREE TIER
- Random God Blessing (1x daily) — 200 gods, 7 rarity tiers
- 108 Organum (5 questions/day) — 108 gods vote to reach consensus
- Cosmic Score preview only
- 7-day divination history
- Frequency alerts (current only, no history)
- God collection grid (Pokédex style)
- Streak tracking

### ONE-TIME PURCHASE — $19
- Full Report: 25-page A4 PDF covering all 10 systems
- Cosmic Score 1–1,000
- Divine Mirror (included): Primary/Secondary/Tertiary gods + Cosmic Entity + Gods that resemble you
- Cover page
- Grand Convergence summary
- In-depth reading per system
- Decade by Decade forecast
- Colors + lucky elements
- Historical figures with similar chart
- Health & Finance Coaching
- Activation Plan
- Monthly + 10-year forecast
- 5 Pain Points analysis
- Compatible pet
- Weekly plan
- Final summary

### ADD-ONS (sold separately)
| Add-on | Price |
|--------|-------|
| Cosmic Companions | $7 |
| Exercise Plan | $7 |
| Food & Diet | $7 |
| Product Personality | $5 |
| Compatible Pet | $5 |
| Compatibility Report | $9 |

### SUBSCRIPTION — $5/month ($4/month annual)
- Daily Star Chart (5 tabs: Career / Finance / Love / Health / Growth)
- Each tab shows relevant planets, what they represent, where they're heading
- NO "good" or "bad" — only "this planet = this theme, moving toward X"
- Unlimited 108 Organum
- Full divination history + pattern history
- Monthly Cosmic Brief
- God collection stats + full streak history
- Frequency Alert history
- Early access to new add-ons

---

## 5. KEY FEATURES (DETAILED)

### 5.1 Daily Star Chart
- Uses Swiss Ephemeris (open source) for real-time planetary positions
- Personalized overlay of current transits on each user's unique birth chart
- 5 tabs: Career, Finance, Love, Health, Growth
- Each planet shows: what it represents, current house, where it's heading, Retrograde status if applicable
- Philosophy: inform, never prescribe. No "good day" or "bad day"
- Changes every day — core subscription retention hook

### 5.2 Random God Blessing
- 200 gods from 8 mythologies: Greek/Roman, Norse, Egyptian, Hindu, Chinese, Japanese, Mayan, Celtic
- 7 rarity tiers:
  - Common 40% | Uncommon 28% | Rare 18% | Epic 9% | Legendary 4% | Mythic 0.9% | ??? 0.1%
- ??? tier = "YOUR DESTINY HAS CHANGED" — no name, no image, black screen, dramatic text only
- Shareable card per tier (Gacha mechanic, like Spotify Wrapped)
- God collection grid unlocks as user draws more

### 5.3 108 Organum
- Ask any life question
- 108 gods from all mythologies "vote" and reach consensus
- Answer is delivered as the consensus of the 108
- Free: 5/day | Subscribers: unlimited

### 5.4 Divine Mirror ($9 add-on, included in Full Report)
- Primary God: most aligned with Day Master + elements
- Secondary God: secondary alignment
- Tertiary God: tertiary alignment
- Cosmic Entity: higher being that resonates with the full chart
- Gods that resemble the user's personality
- Each includes: origin, resonance explanation, Shadow warning
- Example (Yang Fire 丙): Apollo (Primary), Odin (Secondary), Thoth (Tertiary)
- Cosmic Entity example: "The Lighthouse at the Edge of Everything"

### 5.5 Cosmic Companions ($7 add-on)
- Mythical creature for current period (based on transits)
- Chanting/Mantra + instructions + alternative for non-Sanskrit speakers
- Music playlist: Morning / Work / Evening / Special (based on active houses)
- Sacred Places:
  - LIFETIME (static, based on birth chart) — 3 locations from different traditions
  - THIS PERIOD (dynamic, based on current transits) — 3 local/accessible options included

### 5.6 Frequency Alert System
- Tracks all divination activity across god blessings, 108 Organum, and daily chart
- Flags when a god, planet, or house appears more frequently than statistically expected
- Format: "Saturn appeared 5 times in 10 days. Saturn = Structure / Time / Accountability."
- NO interpretation given — only observation. User draws own meaning.
- Thresholds: God 3+ in 7 days | Planet 10+ consecutive days | House 5+ in 14 days | Same 108 question topic 3+
- Free: alert only | Subscribers: full history + weekly pattern summary

### 5.7 Gamification & Stats
- God collection grid (Pokédex style) — see all gods, which discovered, which locked
- Rarity statistics: "You've pulled Legendary 2x — luckier than 94% of users"
- "YOUR DESTINY HAS CHANGED" logged permanently, never deletable
- Streak system with visual pip bar
- Free: 7-day history | Subscribers: full history

### 5.8 Multi-Profile System
- One account can have multiple profiles (self + others)
- Each profile: Name, Birth data, Relationship label
- Buying a report = $19 per profile
- Compatibility reports = $9 per profile pair
- Subscription Daily Chart covers all profiles in account
- Profile Switcher in nav bar — all features switch instantly

### 5.9 Cosmic Alias Generator
- Privacy feature: create a shareable name without revealing real identity
- Generated from: BaZi Day Master + Celtic Tree Month + Birth Hour Animal + Region of birth
- Gender-sensitive: Masculine / Feminine / Neutral name forms
- Surname: Regional particle (von/de/di/van/no) + sacred root from that culture
- GACHA mechanic: 10 free draws, then paywall ($2 for 5 more, $5 unlimited lifetime)
- 7 alias tiers matching god blessing rarity system
- History grid shows all 10 draws, clickable to preview
- Save multiple aliases, shareable copy text

---

## 6. AUTH & ONBOARDING

**Sign-up channels:**
- Google Login (primary)
- Facebook Login
- LINE Login (Thai market)
- Apple Sign In (if iOS app later)
- WhatsApp = delivery channel only, NOT auth

**Tech:** Supabase Auth (free to 50K users)

**Data collection:**
- Sign up: Email/Social + display name only
- For report: Name, DOB, Time (optional), Place, Gender — collected at order time, not sign up

**Onboarding Flow (3 steps):**
1. Fill birth data (name, DOB, place, gender, time optional)
2. See Cosmic Score preview with 10-system bar chart animated
3. Draw first God Blessing
→ Complete screen with summary card

---

## 7. BUSINESS MODEL & PRICING

| Tier | Price | Type |
|------|-------|------|
| Free | $0 | Acquisition |
| Full Report | $19 | One-time per profile |
| Subscription | $5/mo ($4 annual) | Recurring |
| Add-ons | $5–$9 each | One-time |
| Alias Unlimited | $5 | One-time |
| Alias 5-pack | $2 | One-time |

**Revenue projections (Base Case):**
- Year 1: ฿20,000/month net
- Year 2: ฿60,000/month net
- Year 3: ฿120,000/month net

**Gross margin:** 82–85% (COGS = Claude API ~฿25/report + hosting)

**LTV per account example:**
- 3 profiles × $19 = $57
- 3 compatibility pairs × $9 = $27
- Subscription 12 months × $5 = $60
- 2 add-ons × $6 = $12
- **Total LTV = $156 per engaged account**

---

## 8. MARKETING STRATEGY

**No paid ads. Organic only.**

1. **Shareable Cosmic Score Card** — Spotify Wrapped mechanic. Free tier generates image card. People share naturally.
2. **God Blessing Share Cards** — Tier-colored cards optimized for LINE/IG Story
3. **Custom GPT on ChatGPT Store** — Free mini reading, upsell to $19 report
4. **MCP Connector for Claude** — AI community distribution
5. **LINE OA** — Thai market. Bot sends daily blessing reminder + frequency alerts
6. **SEO Content (Thai)** — ฿3,000/month. Articles on BaZi, Human Design, multi-system astrology
7. **Reddit/Discord** — r/astrology, r/BaZi, r/HumanDesign, AI Discord servers
8. **AI Newsletter Sponsorship** — ฿7,500/occasion when budget allows

**LINE OA Notifications:**
- 08:00 daily: God Blessing reminder + daily transit note
- When triggered: Frequency alert
- Profile birthdays/special transits
- 1st of month: Monthly Cosmic Brief (subscribers)

---

## 9. SEO KEYWORDS

**Thai (high priority, low competition):**
- ดูดวงหลายศาสตร์, ดูดวงครบทุกศาสตร์
- ดูดวง BaZi ภาษาไทย, ดูดวง Human Design ไทย
- เปรียบเทียบดวงชะตา, Cosmic Score ดวงชะตา

**English (global, medium competition):**
- multi system astrology report
- BaZi Human Design combined reading
- 10 system birth chart
- most comprehensive astrology report

**Programmatic SEO pages:**
- mythsensus.com/systems/bazi
- mythsensus.com/systems/human-design
- mythsensus.com/compare/bazi-vs-western
- mythsensus.com/blog/[topic]

---

## 10. ROADMAP

| Phase | Timeline | Key deliverables |
|-------|----------|-----------------|
| Launch | Now – Q2 2026 | mythsensus.com live, Full Report, God Blessing, LINE OA, SEO |
| Engagement | Q3 2026 | Daily Star Chart, Subscription, 108 Organum, Multi-profile, Custom GPT |
| Scale | Q4 2026 | WhatsApp global, Chrome Extension, Add-on library, Frequency alerts |
| Platform | 2027+ | Mobile app, API for developers, B2B wellness, Mythsensus Academy |

---

## 11. DISCLAIMER (ALL 3 VERSIONS — READY TO USE)

**Footer (short):**
Mythsensus reports are generated by artificial intelligence, synthesizing interpretations from ten ancient wisdom traditions. All readings are intended for entertainment, self-reflection, and personal exploration only. They do not constitute professional advice of any kind — medical, psychological, financial, or legal. The stars may illuminate the path. The steps remain yours alone.

**Pre-purchase (medium):**
Before you continue, a note of honesty. Everything you are about to receive has been generated by artificial intelligence trained on ten ancient wisdom systems. Mythsensus is designed for entertainment, self-reflection, and personal exploration. It is not a substitute for professional guidance. What we offer is a mirror. What you do with what you see in it is entirely, and always, up to you.

**Inside PDF (long):**
This report was created by an artificial intelligence system trained on ten ancient wisdom traditions. Read it as you would read any mirror — with curiosity, not as verdict. Mythsensus reports are intended for entertainment, personal exploration, and self-reflection only. They do not constitute and should never replace professional medical, psychological, financial, or legal advice. — The Mythsensus Team

---

## 12. LEGAL NOTES

- **Swiss Ephemeris:** GNU AGPL (free for current non-commercial use). Buy commercial license ($750 one-time) once revenue confirmed.
- **Human Design:** Name "Human Design" is trademarked by Jovian Archive. Use "Energy Type System" in marketing once scale requires it. Describing the concept/framework is fine.
- **Mythsensus trademark:** Common law trademark active from first commercial use. Register formally later.
- **All content:** Original, not copied. No copyright concerns on god descriptions, articles, disclaimers.

---

## 13. SOFT LAUNCH PLAN

**No payment required during soft launch.**
- Access via promo codes only
- 10 beta testers minimum
- Code format: MYTH-XXXX

**Promo codes (pre-set):**
| Code | For | Access | Days |
|------|-----|--------|------|
| MYTH-BETA | Beta testers | Full | 30 |
| MYTH-IX | Friend group IX | Full | 30 |
| MYTH-VIP | VIP | Full | 60 |
| MYTH-FRIEND | General friends | Full | 30 |
| MYTH-PRESS | Media/bloggers | Full | 30 |
| MYTH-TEST | Internal | Full | 7 |

**Soft launch feedback focus:**
1. Does the Cosmic Score feel meaningful?
2. Does the God Blessing feel surprising or satisfying?
3. Would you share your alias with friends?
4. What would make you pay $19?
5. What's missing?

---

## 14. FILES COMPLETED (HTML mockups ready)

| File | Description |
|------|-------------|
| mythsensus-interactive.html | Full 5-page website with all tabs |
| mythsensus-onepager.html | Investor/friend one-pager |
| mythsensus-earlyaccess.html | Promo code entry + success page |
| mythsensus-onboarding.html | 3-step onboarding flow |
| mythsensus-support.html | FAQ + My Reports + Email/Notifications |
| mythsensus-alias-gacha.html | Cosmic Alias Generator with Gacha + paywall |

---

## 15. MONDAY PRIORITIES (30 March 2026)

1. Register **mythsensus.com** at Namecheap or Cloudflare (~$10)
2. Fix PDF design template (font, page, color bugs from previous session)
3. Connect HTML mockups to actual Vercel deployment
4. Set up Supabase auth (Google + LINE + Facebook)
5. Configure Lemon Squeezy payment for $19 report
6. Set up Resend transactional emails (welcome + report delivery)
7. Build LINE OA bot with n8n
8. Recruit 10 beta testers, distribute MYTH-BETA codes

---

## 16. IMPORTANT CONTEXT — PATTRICK'S BIRTH CHART

Used as primary test case throughout development.

- **Name:** Pattrick Chen
- **Day Master:** 丙 Yang Fire (confirmed anchor: Jan 1, 1900 = 丙子)
- **Cosmic Score:** 847/1,000
- **Primary God:** Apollo
- **Secondary God:** Odin
- **Tertiary God:** Thoth
- **Cosmic Entity:** The Lighthouse at the Edge of Everything
- **Celtic Tree Month:** Oak
- **Personal Framework:** "The Dimmer Switch" — 90-day practice focusing on points 1, 4, 7

---

## 17. NOTES FOR COWORK

**Tone & Voice:**
- Mystical but honest. Never overclaims.
- Disclaimer visible but not disruptive.
- "We offer a mirror, not a verdict."
- No "good day / bad day" — only "this theme is active today"

**Design Aesthetic:**
- Dark cosmic: near-black background, gold accents, silver text
- Fonts: Cinzel Decorative (headings), Cormorant Garamond (body), Josefin Sans (labels/UI)
- All HTML files use these Google Fonts — load from CDN

**Key Non-negotiables:**
- Never tell users what to do — only what the cosmos observes
- All 10 systems must be represented in every full report
- Disclaimer must appear before purchase and inside PDF
- Birth data never stored beyond what's needed to generate report

---

*End of brief. All HTML files are in /mnt/user-data/outputs/ — ready to open and continue building.*
