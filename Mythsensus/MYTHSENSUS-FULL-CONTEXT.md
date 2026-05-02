# MYTHSENSUS — FULL PROJECT CONTEXT
## For: Claude in Chrome Extension Handoff
## Updated: 30 March 2026

---

## QUICK SUMMARY

**Mythsensus** = World's first platform synthesizing **10 ancient wisdom systems** into one **Cosmic Score (1–1,000)** + 25-page PDF report.

- **Domain:** mythsensus.com (just purchased on Cloudflare, 30 March 2026)
- **Founder:** Pattrick Chen (solo builder, side project alongside Yoohui Interior)
- **Tagline:** "Where myriad myths reach consensus — about you."
- **Status:** Pre-launch → soft launch with beta testers this week

---

## TECH STACK

| Component | Service | Status |
|-----------|---------|--------|
| Frontend/Hosting | **Vercel** | Not yet deployed |
| Database + Auth | **Supabase** | Not yet set up |
| Payment | **Lemon Squeezy** | Not yet configured |
| Email | **Resend** | Not yet set up |
| AI/Content | **Claude API** | Working (generates PDF content) |
| Ephemeris | **Swiss Ephemeris** | Working |
| PDF Render | **WeasyPrint** (was wkhtmltopdf) | Fixed 29 March |
| Domain/DNS | **Cloudflare** | Domain purchased 30 March |
| LINE Bot | **n8n** | Not yet built |

---

## THE 10 SYSTEMS

1. Western Astrology (Greece, 2500 yrs)
2. BaZi Four Pillars (China, 1400 yrs)
3. Vedic Jyotish (India, 3000 yrs)
4. Nine Star Ki (Japan/Korea, 1200 yrs) — ห้ามใช้คำว่า "ใหม่" ใช้ "นิยมในญี่ปุ่นและเกาหลี"
5. เลข ๗ ตัว ๙ ฐาน — Thai Numerology (Thailand, 700 yrs)
6. Pythagorean Numerology (Greece, 2500 yrs)
7. ระบบประเภทพลังงาน — Energy Type System (Modern, 35 yrs) ← ห้ามใช้ "Human Design" โดดๆ (ลิขสิทธิ์)
8. ไทยพราหมณ์ — Thai Brahmin (Thailand, 800 yrs)
9. Mayan Tzolk'in (Maya, 2000 yrs)
10. Celtic Tree Astrology (Celtic, 2000 yrs)

**Input:** Name, DOB, Time of birth (optional), Place of birth, Gender

---

## PRODUCT & PRICING

| Tier | Price | Description |
|------|-------|-------------|
| Free | $0 | God Blessing (1x daily), 108 Organum (5/day), Cosmic Score preview, Alias 10 gen/day |
| Full Report | $19 one-time | 25-page PDF + **1x use of ALL add-ons** (Divine Mirror, Pet, Companions, Exercise, Food, Product, Compatibility) |
| Subscription | $5/mo ($4 annual) | Daily Star Chart + **unlimited ALL add-ons** until cancelled |
| Add-ons (standalone) | $5–$9 each | For users without Full Report. Included free (1x) in Full Report. Unlimited with Sub. |
| Cosmic Alias extra draws | $2 (5-pack) / $5 (unlimited lifetime) | Beyond free 10/day (member 50/day) |

**Pricing rule (single source of truth — resolved Apr 2026):**
- **No account** → Free features only, nothing saved (God Blessing, Organum 5/day, Alias 10/day, Score preview)
- **Standalone add-on** → Requires account. Unlocks that feature for **30 days unlimited** from payment
- **Full Report $19** → Requires account. PDF + **1x use of every add-on** (not 30 days — one use each)
- **Subscription $5/mo** → Requires account. **Unlimited all add-ons** + full history while active

Recommendation: Subscribe first — system tracks all purchases, history, and readings across sessions.

**Cosmic Score range: 300–999** (ไม่มีใครได้ 1,000 / 900+ คือตำนาน)
**Revenue targets:** Y1: ฿20K/mo → Y2: ฿60K/mo → Y3: ฿120K/mo
**Gross margin:** 82–85%
**LTV per engaged account:** ~$156

**Revenue targets:** Y1: ฿20K/mo → Y2: ฿60K/mo → Y3: ฿120K/mo
**Gross margin:** 82–85%
**LTV per engaged account:** ~$156

---

## KEY FEATURES

### God Blessing (Free)
- 200 gods from 8 mythologies
- 7 rarity tiers: Common 40% → ??? 0.1%
- ??? tier = "YOUR DESTINY HAS CHANGED" — dramatic black screen
- Shareable cards (Gacha mechanic like Spotify Wrapped)

### 108 Organum (Free 5/day, Unlimited for subscribers)
- Ask life questions → 108 gods vote to reach consensus

### Daily Star Chart (Subscribers)
- Swiss Ephemeris real-time planetary positions
- 5 tabs: Career / Finance / Love / Health / Growth
- Philosophy: "inform, never prescribe"

### Divine Mirror (Included in $19 report)
- Primary/Secondary/Tertiary gods + Cosmic Entity

### Cosmic Alias Generator
- Privacy feature: BaZi + Celtic Tree + Birth Hour → shareable name
- 10 free draws, then paywall

### Frequency Alert System
- Flags statistically unusual patterns in divination activity
- "Saturn appeared 5 times in 10 days" — observation only, no interpretation

---

## BRAND VOICE & DESIGN

**Tone:** Mystical but honest. Never overclaims.
**Core philosophy:** "We offer a mirror, not a verdict."
**Rule:** No "good day / bad day" — only "this theme is active today"

**Design:** Dark cosmic — near-black bg (#040407), gold accents (#c8a45a), silver/off-white text (#e6e2d8)
**Fonts:** Cinzel Decorative (headings), Cormorant Garamond (body), Josefin Sans (labels/UI)

**Non-negotiables:**
- Never tell users what to do
- All 10 systems in every report
- Disclaimer before purchase AND inside PDF
- Birth data never stored beyond generation needs

---

## PDF REPORT STATUS (25 pages)

### Fixed (29 March):
- ✅ Nine Star Ki label → "นิยมในญี่ปุ่นและเกาหลี"
- ✅ Dark color scheme (#040407 bg + #c8a45a gold)
- ✅ Sarabun font embedded (base64, no CDN dependency)
- ✅ WeasyPrint render pipeline (replaced wkhtmltopdf)
- ✅ 25 pages with correct page-breaks
- ✅ Demo PDF generated (183 KB)

### Still TODO:
- ⚠️ Render script hardcoded for test data — needs parameterization
- ⚠️ Fixed files not yet copied back into skill assets
- 💡 Font brand alignment (Sarabun OK for launch, Cinzel/Cormorant later)

### 25-Page Structure:
1. Cover + Cosmic Score
2. Score Breakdown (10 systems)
3. Grand Convergence
4. Western Astrology
5. BaZi Four Pillars
6. Nine Star Ki + Vedic
7. Human Design + Others
8. Western Deep Analysis
9. BaZi Deep Analysis
10. Vedic + NSK + HD Deep
11. Thai Numerology + LP Deep
12. Life Path + Mayan + Celtic Deep
13. Decade by Decade (5 decades)
14. Colors & Clothing
15. Historical Figures (4 people)
16. Health Coaching
17. Finance Coaching
18. Activation Plan
19. Pet Recommendations
20. Finance Deep + Weekly Plan
21. Weekly Plan Detailed
22. Monthly Forecast 2569
23. 10-Year Forecast
24. 5 Pain Points
25. Summary + Disclaimer

---

## HTML MOCKUPS (Completed)

| File | Description |
|------|-------------|
| mythsensus-interactive.html | Full 5-page website (all tabs) |
| mythsensus-interactive-v2.html | Updated version |
| mythsensus-glitch-event.html | Glitch event page |
| mythsensus-glitch-event-v2.html | Updated glitch event |
| mythsensus-earlyaccess.html* | Promo code entry (in brief, not in folder) |
| mythsensus-onboarding.html* | 3-step onboarding (in brief, not in folder) |
| mythsensus-support.html* | FAQ + My Reports (in brief, not in folder) |
| mythsensus-alias-gacha.html* | Cosmic Alias Generator (in brief, not in folder) |

*Some mockups referenced in brief may be from earlier sessions

---

## DATABASE (Supabase)

Schema files ready:
- `mythsensus-schema.sql` — Base schema
- `mythsensus-schema-v2.sql` — Updated schema with security
- `mythsensus-supabase-config.sql` — Supabase-specific config
- `mythsensus-pdpa-consent.sql` — PDPA compliance for Thai market

Security audit completed: `mythsensus-security-audit.html`
Security fixes: `mythsensus-security-fixes-changelog.md`
Privacy policy: `mythsensus-privacy-policy-th.html`
Vercel headers: `mythsensus-vercel-headers.json`

---

## SOFT LAUNCH PLAN

**No payment during soft launch** — promo codes only, 10+ beta testers

| Code | Audience | Duration |
|------|----------|----------|
| MYTH-BETA | Beta testers | 30 days |
| MYTH-IX | Friend group IX | 30 days |
| MYTH-VIP | VIP | 60 days |
| MYTH-FRIEND | General friends | 30 days |
| MYTH-PRESS | Media/bloggers | 30 days |
| MYTH-TEST | Internal | 7 days |

**Feedback focus:** Cosmic Score meaningful? God Blessing satisfying? Would pay $19? What's missing?

---

## MONDAY 30 MARCH — PRIORITIES

1. ~~Register mythsensus.com~~ ✅ Done (Cloudflare)
2. ~~Fix PDF template~~ ✅ Done (dark theme, Sarabun, WeasyPrint)
3. Point DNS to Vercel
4. Connect HTML mockups → Vercel deployment
5. Set up Supabase Auth (Google + LINE + Facebook)
6. Configure Lemon Squeezy payment ($19 report)
7. Set up Resend transactional emails
8. Build LINE OA bot with n8n
9. Recruit 10 beta testers + distribute codes

---

## MARKETING (Organic Only)

- Shareable Cosmic Score cards (Spotify Wrapped mechanic)
- God Blessing share cards (tier-colored)
- Custom GPT on ChatGPT Store
- MCP Connector for Claude
- LINE OA (Thai market)
- SEO content (Thai, ฿3K/mo)
- Reddit/Discord communities

---

## LEGAL

- Swiss Ephemeris: AGPL OK now, buy $750 license when revenue confirmed
- Human Design: Use "Energy Type System" at scale
- Mythsensus trademark: Register after commercial use begins
- PDPA: Consent system ready in SQL

---

## AUTH

- Google Login (primary)
- Facebook Login
- LINE Login (Thai market)
- All via Supabase Auth (free to 50K users)

---

## DISCLAIMERS (3 versions ready)

**Footer:** "The stars may illuminate the path. The steps remain yours alone."
**Pre-purchase:** "What we offer is a mirror. What you do with what you see in it is entirely, and always, up to you."
**Inside PDF:** "Read it as you would read any mirror — with curiosity, not as verdict."

---

## GODS DATA

- 200 gods from 8 mythologies in `mythsensus-gods.json` (331 KB)
- Greek/Roman, Norse, Egyptian, Hindu, Chinese, Japanese, Mayan, Celtic

---

## TEST CASE — Pattrick's Birth Chart

- Day Master: 丙 Yang Fire
- Cosmic Score: 847/1,000
- Gods: Apollo (Primary), Odin (Secondary), Thoth (Tertiary)
- Cosmic Entity: The Lighthouse at the Edge of Everything
- Celtic Tree: Oak
- Framework: "The Dimmer Switch" — 90-day practice

---

*End of context. Ready for extension handoff.*
