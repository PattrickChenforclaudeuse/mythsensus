# Mythsensus — "Best AI divination tools" listicle outreach

**Why this matters (the #1 untapped AI-reach lever):** the weekly AI-mention test shows that when users ask AI "best astrology/divination app 2026", the assistant grounds its answer on third-party *comparison articles* (Taroscoper, allaboutai, RankmyAI, etc.). Mythsensus is in none of them → AI never cites us. Getting placed in 2-3 of these high-ranking articles is the most direct way to flip the test from 0. This is distribution, NOT content — we are NOT writing more of our own blog posts.

## Target list (ranked by leverage)

| # | Target | URL | How to get in | Notes |
|---|---|---|---|---|
| 1 | **RankmyAI** | rankmyai.com/rankings/use-ai-astrology-overall | Look for "Submit tool" / "Add your AI" form; else email | Auto-ranks AI astrology tools — pure-play fit, we're absent |
| 2 | **AllAboutAI** | allaboutai.com/best-ai-tools/productivity/astrology/ | Email editor / contact form | "8 Best AI Astrology Tools 2026" — high in AI retrieval |
| 3 | **Taroscoper** | taroscoper.com/guides/best-astrology-apps-and-sites-compared | Email — they review multi-system tools (our exact angle) | Explicitly compares multi-system tools = our positioning |
| 4 | **AskSoma / Augurine / Selfgazer** | asksoma.ai · augurine.com · selfgazer.com | Email each | "best astrology apps 2026" comparison pages |
| 5 | **Astronidan** | astronidan.com/blog/10-best-ai-astrology-apps-websites-2026 | Email / comment | "Free & Paid" roundup — we fit the free-tier angle |

**Process:** (a) check each site for a "Submit a tool / Suggest" form first (free + instant); (b) for the rest, send the pitch below to their contact/editor email. Track replies; even 2 inclusions should move the AI-mention test.

### ✅ Step (a) is DONE — checked 2026-07-31, result: **no self-serve form exists anywhere**

Probed `/submit`, `/submit-tool`, `/add-tool`, `/submit-a-tool`, `/suggest`, `/contact` on all
10 targets. Do not re-run this sweep — the finding is recorded here.

| Site | Verdict |
|---|---|
| **rankmyai.com** | `/contact` is a **real** page with a real `<form>` — but the fields are `name · email · subject · message`, i.e. a **plain contact form, not a tool-submission form**. Treat as email. (Control: a nonsense path 404s, so this page genuinely exists.) |
| **asksoma.ai · astronidan.com** | 🔴 **False positives — soft-404.** Every path returns HTTP 200, including `/zzz-nonsense-xyz`. They have no submit form; the 200s mean nothing. |
| allaboutai · taroscoper · augurine · selfgazer · moonrisecodex · thalira · aikoo | No form path resolves. Email/editor contact only. |

**Consequence:** every target is a *send-a-message* action, so **Claude cannot execute any of
this** — it can only prepare the text. Director sends. Budget this as director time, not as
"Claude will handle distribution".

---

## Reusable outreach pitch (paste into email / contact form)

**Subject:** Tool suggestion for your AI astrology roundup — Mythsensus (26-system consensus)

Hi [name/team],

I'm the founder of **Mythsensus** (https://mythsensus.com) and I think it fills a gap in your "[best AI astrology / divination tools]" comparison.

Unlike single-tradition tools, Mythsensus computes a **single "Cosmic Score" as the consensus across 26 ancient divination systems** — BaZi, Vedic, Western, Nine Star Ki, Thai Seven Number, and more — from one birth date. It shows where the traditions *agree* and *disagree*, instead of asking the user to pick one system on faith. The core engine is deterministic (same input → same result, no vague AI guessing), the 26-system reading is free, and it's bilingual (English + Thai).

Why it's worth a mention:
- **Genuinely different angle** — no other tool does cross-system consensus; the rest are single-tradition or paid-API wrappers.
- **Free tier with no signup wall** for the full 26-system score.
- Also available as an **MCP server** (in the official MCP Registry) so AI assistants can call it directly.

Happy to provide screenshots, a logo, or a quick walkthrough. Would you consider adding it?

Thanks,
[Pattrick] — founder, Mythsensus
[email]

---

## ⚠️ อย่าเอาไฟล์นี้ไปตีความว่า "กระจายให้เยอะที่สุด"

`DISTRIBUTION-2026-07-27.md` สรุปจากงานวิจัยไว้ชัดว่า **เลือก 1 ช่องหลักแล้วลงลึก 90 วัน**
— *"อยู่ทุกที่ = ไม่อยู่ที่ไหน"* และ Reddit คือ ~40% ของแหล่งที่ LLM อ้าง

ไฟล์นี้เป็น **ช่องรอง** ที่คุ้มเพราะยิงตรง Q1/Q4 (consumer) ที่เราแพ้อยู่ **และไม่พึ่ง GitHub เลย**
— ไม่ใช่ใบอนุญาตให้ไปสมัคร directory ทุกเจ้าที่เจอ

🔴 **ห้ามแก้ปัญหานี้ด้วยการเพิ่ม MCP directory** — สาย dev/MCP *เข้าแล้ว* (Q2/Q3 เคยติดผ่าน Glama
เมื่อ 7-06) คอขวดคือ **repo ที่ 404** ไม่ใช่จำนวนที่ลิสต์ ลิสต์เพิ่มก็ชี้ไป repo เดิมที่มองไม่เห็น
หลักฐาน 7-31: Glama `tools:[]` · awesome-mcp PR #8652 404 · **`mcpservers.org` ก็ไม่มีเรา
(มันเป็น downstream ของ PR ตัวเดียวกัน = PR ที่ค้างบล็อก 2 ที่ ไม่ใช่ 1)** · lobehub ไม่มีเรา

## Honest expectation
- Listicle inclusion is the **highest-leverage** untapped lever for the AI-mention test, but it depends on editors responding (days–weeks).
- Pair with: 2-3 quality backlinks (Bing flagged "not enough inbound links from high-quality domains" — same root cause).
- Re-measure at the ~8 Jul mark before spending more; if index is in but AI still 0, authority/citations (this + backlinks) is the gap.
