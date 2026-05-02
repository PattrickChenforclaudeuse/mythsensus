# Mythsensus Launch Checklist
## Updated: 17 April 2026 (v3 — pricing + UX restructure)

> **v3 status note (17 Apr):** Offline app passes **88/88 E2E**. Pricing redesigned — 7 add-ons now **$1.99–$4.99** each, **$14.99 bundle** replaces old flat-$9 model. **10 primary + 16 secondary** system split applied. Onboarding overlay + Consensus Preview + AI hooks added. Landing page (`mythsensus-interactive-v2.html`) updated in repo; awaiting user `git push` to deploy. Payment integration **NOT touched** (per direction). See `brief/MASTER-BRIEF.md` v3 changelog for full details.

## Original update: 1 April 2026

---

## PHASE 1 — IMMEDIATE (30–31 March 2026)

### Domain & Infrastructure
- [x] Register mythsensus.com ✅ Done — Cloudflare (30 Mar)
- [ ] Point DNS to Vercel
- [ ] Set up Supabase project (Auth + DB)
- [ ] Configure Supabase Auth: Google, LINE, Facebook
- [ ] Set up Lemon Squeezy account + products ($19 report, add-ons, subscription)
- [ ] Set up Resend account + domain verification

### PDF Report
- [x] Fix font/page/color bugs in PDF template ✅ Done — WeasyPrint + Sarabun embedded (29 Mar)
- [x] Fix Nine Star Ki label ("นิยมในญี่ปุ่นและเกาหลี") ✅ Done
- [x] Fix dark color scheme (#040407 bg, #c8a45a gold) ✅ Done
- [ ] Merge fixed files into skill assets (cosmic-blueprint-fix/output/ → assets/)
- [ ] Test full 25-page report generation end-to-end with merged files
- [ ] Verify all 10 systems render + NSK in Score Chart
- [ ] Verify disclaimers appear (pre-purchase + inside PDF page 25)

### Deployment
- [ ] Connect HTML mockups to Vercel
- [ ] Deploy: Landing page (mythsensus-interactive-v2.html)
- [ ] Deploy: Early access page
- [ ] Deploy: Onboarding flow
- [ ] Deploy: Support page
- [ ] Deploy: Alias Gacha

---

## PHASE 2 — SOFT LAUNCH (Week of 31 March → April 2026)

### Pricing System (Lemon Squeezy config)
- [ ] $19 Full Report product (one-time, per profile)
- [ ] $5/mo Subscription product ($4/mo annual variant)
- [ ] Standalone add-ons with 30-day access flag:
  - Divine Mirror $9 / Pet $5 / Companions $7 / Exercise $7 / Food $7 / Product $5 / Compatibility $9
- [ ] Alias extra draws: $2 (5-pack) / $5 (unlimited lifetime)
- [ ] Promo code system: MYTH-BETA, MYTH-IX, MYTH-VIP, MYTH-FRIEND, MYTH-PRESS, MYTH-TEST

### Beta Program
- [ ] Recruit 10 beta testers
- [ ] Distribute MYTH-BETA codes
- [ ] Set up feedback collection (Google Form or in-app)

### LINE OA
- [ ] Create LINE Official Account
- [ ] Build n8n bot workflow
- [ ] Configure 08:00 daily God Blessing reminder
- [ ] Configure Frequency Alert notifications

### Content & SEO
- [x] SEO article 1: Multi-system astrology (TH + EN) ✅ Done — in articles/
- [x] SEO article 2: BaZi (TH + EN) ✅ Done — in articles/
- [x] SEO article 3: Human Design / ระบบพลังงาน (TH + EN) ✅ Done — in articles/
- [ ] Publish articles to live site
- [ ] Set up /systems/bazi, /systems/human-design pages
- [ ] Create /compare/bazi-vs-western page

---

## PHASE 3 — POST SOFT LAUNCH (April–May 2026)

### Iterate on Feedback
- [ ] Analyze beta feedback (5 focus questions)
- [ ] Fix top issues
- [ ] Optimize Cosmic Score presentation
- [ ] Refine God Blessing experience

### Distribution
- [ ] Submit Custom GPT to ChatGPT Store
- [ ] Build MCP Connector for Claude
- [ ] Post on r/astrology, r/BaZi, r/HumanDesign
- [ ] Join AI Discord servers

---

## LEGAL REMINDERS
- [ ] Swiss Ephemeris: AGPL OK for now. Buy $750 license once revenue confirmed
- [x] Energy Type System naming: Use "ระบบประเภทพลังงาน" everywhere ✅ Updated in all files (1 Apr)
- [ ] Register Mythsensus trademark once commercial use begins

---

## DECISIONS LOCKED (do not re-open)
- Score range: 300–999, nobody gets 1,000, 900+ = ตำนาน
- System order: Western/BaZi/Vedic/NSK/เลข๗/Pythagorean/ระบบพลังงาน/ไทยพราหมณ์/มายัน/Celtic
- NSK weight: 9% (score breakdown now has all 10 systems)
- Standalone pricing: 30 days unlimited per add-on from payment date
- Full Report: 1x each add-on (not 30 days)
- Subscription: unlimited all add-ons while active
- Free features: no account required, nothing saved
- Tech stack: Vercel + Supabase + Lemon Squeezy + Resend + Claude API + WeasyPrint (Railway dropped)
