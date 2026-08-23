# Mythsensus Report Redesign — Plan (2026-06-25)

> **สถานะ: PLANNING ONLY** — director สั่ง "เน้นวางแผน token จะหมด" → **ห้ามลงมือ code จนกว่าจะ session ใหม่ + director approve**
> **scope:** full report ($19 **paid** product) ปรับเป็น convergence-first + ยุบ per-system ซ้ำ
> **ตัดออก:** hook/form (#① ใน [_PARKING-ideas.md] — session อื่นทำแล้ว)
> **source:** `Mythsensus/report-engine/lib/report.ts` → `generateReport()` array `pages[]` :2600

## เป้าหมาย + rationale
- positioning = "ที่ซึ่ง 26 ศาสตร์มาบรรจบ" → **convergence = hero ต้องนำ** ไม่ใช่ตามหลัง raw scores
- ปัญหาปัจจุบัน (director): คนเจอ Score Breakdown (26 ตัวเลข) + per-system 25 หน้า **ก่อน**เจอ "แล้วมันแปลว่าอะไร" → ดูเยอะแล้วไม่เข้าใจ
- หลักฐาน (content scan 6-25): convergence #4 **พอตัวเองได้ ~100%** (มี per-system verdict table ครบ 26 :1042 + vote chips/theme :1055); per-system 25 หน้า = 58% ของ report แต่ narrative ต่ำ + ซ้ำ (Saju≈BaZi 80%, Aztec/Ogham บาง)
- **⚠️ paid $19 constraint:** ตัดสั้นเกิน = เสีย perceived value → กลยุทธ์ = **จัดลำดับ + ยุบซ้ำ ไม่ทิ้ง depth** (depth → ท้ายเป็น reference สำหรับคนอยากลึก)

## ปัจจุบัน 43 หน้า (report.ts:2600-2651)
- 1-4: ปก+Score · Soul Frequency · **Score Breakdown** · **🌐 Grand Convergence**
- 5-13: BaZi·NineStar·Western·Vedic·Numerology·EnergyType·Mayan·Celtic·ThaiBrahmin
- 14-29: 16 ศาสตร์ใหม่ (Saju…VedicMahadasha) หน้าละศาสตร์
- 30-35: LuckPillars·Decade·Monthly·10yr·Activation·Weekly
- 36-43: Health·Finance·Colors·Pets·Mirror·Historical·PainPoints·Summary

## โครงใหม่เสนอ (~25 หน้า — recommend)

**A. SYNTHESIS FIRST (hero · ~8 หน้า) — 🌐 convergence = 20-25% ของ report (director rule 6-25)**
1. ปก + Cosmic Score (3-score preview)
2. Soul Frequency (เก็บ/merge = decision #2; ถ้าเก็บ → แก้ narrative รถก่อน)
**🌐 Grand Convergence = 5-6 หน้า** (ขยายจาก 1 หน้าอัด ~1,100 คำ — แต่ละหน้าทำหน้าที่ต่างกัน ไม่ padding):
3. **Overview + Signature Chart:** TL;DR + **26-system radar/constellation visual** (spoke=ศาสตร์ · ยาว=score → เห็น "รูปร่างดวง" + จุดบรรจบเป็นภาพ; signature + shareable) + Cosmic Signature (rarity)
4. **Cross-cultural consensus:** 4 families ละเอียด (bars + แต่ละวัฒนธรรมเห็นอะไร) + score overview (ยุบ Score Breakdown เดิมมาเป็น visual)
5-6. **Themes — โครง 2 ชั้น (director 6-25 "หัวก่อน ลงลึกอีกที"):**
   - **① หัว/สรุป** = v3 (`_mock-convergence-v3.html`, chosen): **3-5 เรื่องเด่น** + ทักท้วง narrative · แต่ละแถว = icon + ชื่อเรื่อง + **ตัวเลขศาสตร์รวม** ("9 ศาสตร์") + `reading` 2-3 ประโยค · **❌ ห้าม list per-system แยก** (BaZi 842/NineStar 800/… = "คนไม่อยากดูคะแนนแยกศาสตร์เยอะๆ") — depth อยู่ที่ **ความหมาย** · 1 หน้า
   - **② ลงลึก** = แต่ละเรื่องขยาย reading เต็ม + "ทำอะไร" (`_mock-convergence-deep.html` style แต่ตัด per-system list ออก) · 2-3 หน้า
   - (v2 ที่ list ศาสตร์ทุกตัว = เยอะไป ตีตก)
7. **Verdicts + Variant:** per-system table 26 (visual) + เสียงข้างน้อยที่น่าสนใจ
8. **Synthesis "แล้วมันแปลว่าอะไรกับคุณ":** 3 จุดบรรจบแข็งสุด + 1 ขัดแย้ง + actionable takeaway (หน้าใหม่ มัดรวม)
- **chart visual (chosen A, 6-25):** = **8-theme convergence** — ธีมเรียงตามจำนวนศาสตร์เห็นตรง + bar X/26 + reading สั้น (อ่านง่าย+สื่อความหมาย+ธีมเด่นต่างคน) · mock `_mock-convergence-themes.html`. ❌ **radar 26-ก้าน ตีตก** (director 6-25: เรียงคะแนน=ก้นหอยเหมือนกันทุกคน + 26 ก้านคะแนนชิดกัน=อ่านไม่รู้เรื่อง; ราก=พยายาม viz คะแนนดิบ 26 ตัว ขัดหลัก "ลดคะแนน")
- **⚠️ guard padding:** ดวงที่ vote ไม่พอ 8 themes → ยุบหน้า 5-6 เป็น 1; ห้าม stretch theme thin (% ผูก total page — total ขยับเป็น ~26-27)

**B. CORE DEEP-DIVE (4 ศาสตร์ bespoke · หน้า 7-10)** — เก็บเต็มเพราะมี chart-specific ที่ convergence ไม่ครอบ
- BaZi 4-pillar · Western Sun/Moon/ASC (SIGN_TRAITS) · Energy Type/HD · Vedic Jyotish

**C. WORLD SYSTEMS — ครึ่งหน้า grid (director 6-25: "ลดเหลือครึ่งหน้าพอ")** — 22 ศาสตร์ที่เหลือ ย่อเป็น **ครึ่งหน้า** (คนไม่ดู per-system มาก)
- reuse `p_new16systems` :1081 (grid 2-col, icon+score+value+finding) → ขยายครอบ NineStar/Numerology/Mayan/Celtic/Thai + 16 ใหม่
- **ลบ p_saju หน้าเต็ม** (ซ้ำ BaZi 80%) → อยู่ใน grid

**D. LIFE GUIDANCE (multi-system synthesis · หน้า 13-18)** — เก็บ ลำดับเดิม
- LuckPillars·Decade·Monthly·10yr·Activation·Weekly

**E. LIFESTYLE + CLOSING (หน้า 19-25)** — เก็บ
- Health·Finance·Colors·Pets·Mirror·Historical·PainPoints·Summary

→ 43 → ~25 หน้า (ลด ~18 จากยุบ per-system 25 → 4 เต็ม + 2 grid)

## งานแก้ report.ts — steps (session หน้า)
1. **backup** `report.ts` → `_backups/2026-XX-report-redesign/`
2. **reorder** array :2600 ตามโครง A-E
3. **Score Breakdown** (`p02_scoreBreakdown` :546): ยุบเป็น visual block ใน Convergence① (ไม่ใช่หน้าเดี่ยวตัวเลขล้วน)
4. **expand** `p03_convergence` (:1019, ตอนนี้ ~1,100 คำ/1 หน้า) → split 4 sub-pages; expose per-system `reading` เข้าแต่ละ theme (ดึงจาก `b.reading`/calc.ts ไม่ใช่แค่ `finding`)
5. **per-system:** เก็บ `p05_bazi`/`p04_western`/`p08_energyType`/`p07_vedic` เต็ม; ที่เหลือ → activate + ขยาย `p_new16systems` grid
6. **ลบ** `p_saju` หน้าเต็ม (เข้า grid แทน)
7. guidance/lifestyle (#30-43): ลำดับเดิม → ท้าย

## reuse (ไม่ต้องเขียนใหม่ — Rule #8)
- `p_new16systems` :1081 (compact grid มีอยู่แล้ว ไม่ได้ใช้)
- `extractSignals(c,topic)` :2676 · `consensusRow()` :2744 · `narratives` :815 · `familyOf` :874 · `sc()` :628

## decision points (เคาะก่อน implement)
1. per-system เต็มหน้า = 4 (BaZi/Western/EnergyType/Vedic) พอ? หรือเพิ่ม Numerology/NineStar?
2. Soul Frequency (#2) เก็บต้น หรือ merge เข้า convergence?
3. target ~25 หน้า (paid-friendly depth) หรือบีบกว่า?
4. sync in-app preview (`index.html` p1-25 = คนละไฟล์) ให้แนวเดียวกันด้วยไหม หรือ report.ts ($19 PDF) ก่อน?

## narrative fix — "เรื่องรถ" (Cosmic Journey) + jargon LT/PR
director 6-25: "คนที่ไม่ได้ทำ life terrain / path resonance สงสัยเรื่องรถคืออะไร — เปลี่ยน narrative ตรงนั้นด้วย"
- **ที่มา:** `_renderCosmicJourney` (report.ts:427, อยู่ใน `p_threeScores` #2) = 3 การ์ด น้ำมัน(Soul Freq) / **พาหนะ-รถ(Life Terrain)** / เส้นทาง(Path Resonance)
- **ปัญหา:** LT (อาชีพ+ประเทศ) + PR (สายงาน) = optional → **คนส่วนใหญ่ไม่กรอก** → การ์ด 2/3 จาง (opacity .7 + "กรอกอาชีพ+ประเทศ") แต่ยังโชว์ icon 🚗 + ศัพท์ EN "Life Terrain/Path Resonance" → งงว่ารถ/ศัพท์เกี่ยวอะไรกับดูดวง (= first impression ของคนส่วนใหญ่บน paid report)
- **ทางแก้ (recommend = 1+3):**
  1. ไม่กรอก LT/PR → **ซ่อน Journey panel ทั้งอัน** (เหลือ Soul Frequency อย่างเดียว) แทนโชว์ 2 การ์ดว่าง
  2. (ถ้าเก็บ metaphor) เพิ่ม 1 บรรทัดอธิบาย: "ดวง = การเดินทาง · เชื้อเพลิง=พลังในตัว · รถ=สภาพแวดล้อม(อาชีพ/ที่อยู่) · ถนน=สายงาน"
  3. เปลี่ยนศัพท์ EN → ไทยที่สื่อ + บอกชัดว่ากรอกอะไรถึงปลดล็อก
- กระทบ decision point #2 (Soul Frequency เก็บ/merge) — ถ้าเก็บหน้านี้ต้องแก้ narrative นี้ก่อน

## test + deploy (หลัง implement)
- `npm run build:engine` → `node tests/inject-bundle-root.cjs` → `node tests/inject-bundle.cjs`
- `tests/fuzz-30-charts.cjs` + render 3 ดวง (เปล่า/TYD/PU) ครบ ไม่ broken
- ⚠️ ถ้า sample-report/sunthorn-phu = static HTML → ต้อง regenerate + redeploy
- deploy: `npm run deploy`; bump `sw.js` CACHE version

## ความเสี่ยง
- `report.ts` ใหญ่ (~2,900 บรรทัด) + `calc.ts` dependency (reading text)
- per-system ตัด → grep ref หลุด (ฟังก์ชันที่อื่นเรียก p_saju?)
- paid value perception (อย่าหั่นต่ำกว่า ~22 หน้า)
