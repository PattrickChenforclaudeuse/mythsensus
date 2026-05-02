---
name: cosmic-blueprint
description: |
  สร้างรายงานดวงชะตาครบ 10 ศาสตร์ ภาษาไทย พร้อม PDF Premium 25 หน้า สำหรับบุคคลใดก็ได้
  โดยรับข้อมูล ชื่อ วันเกิด เวลาเกิด สถานที่เกิด และเพศ แล้วออก PDF รายงานดวงชะตาภาษาไทยแบบสมบูรณ์

  ใช้ skill นี้ทุกครั้งที่ผู้ใช้พูดถึง: "ดูดวง", "อ่านดวง", "ดวงชะตา", "horoscope", "birth chart",
  "natal chart", "cosmic", "BaZi", "สี่เสา", "เลข ๗ ตัว", "Human Design", "Vedic", "Nine Star Ki",
  "ดูดวงให้คนอื่น", "ส่งรายงานดวง", "สร้างรายงานดวง" หรือเมื่อผู้ใช้บอกวันเดือนปีเกิด + เวลา แล้วขอการวิเคราะห์

  ครอบคลุม 10 ศาสตร์:
  1. Western Astrology
  2. BaZi Four Pillars (สี่เสา)
  3. Vedic Jyotish
  4. Nine Star Ki (九星気学) — นิยมในญี่ปุ่นและเกาหลี
  5. เลข ๗ ตัว ๙ ฐาน (อยู่ใน P11 ไทยพราหมณ์)
  6. Pythagorean Numerology (Life Path + Personal Year — P12)
  7. Human Design
  8. ไทยพราหมณ์
  9. มายัน Tzolk'in
  10. เซลติก Tree Astrology

  Output: Premium PDF ภาษาไทย 25 หน้า A4
---

# Cosmic Blueprint Skill — Premium Edition

## Premium Pack Standard (25 หน้า A4)

ทุก PDF ต้องมีครบทุก section ต่อไปนี้ตามลำดับ (page map ตรงกับ `cosmic-blueprint-offline.html` engine):

| P# | Section | เนื้อหา |
|----|---------|---------|
| 1 | Cover + Score Banner | คะแนนจักรวาล tier สี นาม Ben Ming Nian box |
| 2 | Cosmic Score 10 ศาสตร์ | score bars breakdown ทุกศาสตร์พร้อม finding |
| 3 | **Grand Convergence + THE VERDICT** | 5–6 themes priority hierarchy + THE VERDICT half-page |
| 4 | Western Astrology | Sun Moon ASC Jupiter Saturn transit |
| 5 | BaZi สี่เสา | 4 pillars grid + โครงสร้างพิเศษ + element analysis |
| 6 | Nine Star Ki (นิยมในญี่ปุ่น–เกาหลี) | Star number ทิศมงคล สี 2026 analysis |
| 7 | Vedic Jyotish | Lagna Nakshatra Mahadasha Yogas |
| 8 | Human Design | Energy Type Strategy Profile Authority |
| 9 | มายัน Tzolk'in | Solar Seal Kin Tone |
| 10 | เซลติก Tree Calendar | Celtic tree sign planet gem |
| 11 | **ไทยพราหมณ์ + เลข ๗ ตัว ๙ ฐาน** | วันเกิด ดาว อัญมณี mantra + grid 7 ตำแหน่ง |
| 12 | **เลขศาสตร์ตะวันตก — Life Path & Personal Year** | LP ไม่เปลี่ยน / PY เปลี่ยนทุกปี / LP×PY convergence |
| 13 | BaZi Luck Pillars | 8 เสา ตาราง ageStart–ageEnd LP star type |
| 14 | Health Coaching | 5–6 actions priority-tiered + science note |
| 15 | Finance Coaching | การลงทุน≠การพนัน แผน 3 ขั้น + disclaimer |
| 16 | **Activation Plan — 3 Tiers** | 🔴ทำเลย / 🟡Habit / 🟢เสริม พร้อม pts |
| 17 | Weekly Plan | ตาราง 7 วัน พลังงานรายวัน |
| 18 | พยากรณ์รายเดือน 2026 | 12 เดือน Nine Star Month compatibility |
| 19 | **Decade by Decade** | LP Star Type ต่อ decade + Vedic sub + PY |
| 20 | สีและการแต่งตัว | 5 สีมงคล 2 หลีกเลี่ยง ผ้า เครื่องประดับ |
| 21 | พยากรณ์ 10 ปี 2026–2035 | PY + Vedic sub + คำแนะนำรายปี |
| 22 | บุคคลในประวัติศาสตร์ | 4 คน พร้อม score เหตุผล traits |
| 23 | 5 Pain Points | ความรัก การงาน สุขภาพ ตัดสินใจ รู้จักตัวเอง |
| 24 | Relationship Compatibility | เข้ากันได้กับ 12 ราศี / BaZi element |
| 25 | สรุปภาพรวมและคำส่งท้าย | tier จุดแข็ง ความท้าทาย ช่วงทอง |

---

## ข้อมูลที่ต้องการ

| ข้อมูล | ตัวอย่าง | หมายเหตุ |
|--------|---------|---------|
| ชื่อ/เพศ | หญิง A | ใช้แสดงในรายงาน ไม่อ้างถึงบุคคลอื่น |
| วันเกิด | 3 กุมภาพันธ์ 2534 | ต้องการปี ค.ศ. |
| เวลาเกิด | 06:05 น. | ถ้าไม่รู้ให้ใช้ 12:00 |
| สถานที่เกิด | Bangkok, Thailand | |
| เพศ | ชาย / หญิง | |

---

## การคำนวณ Nine Star Ki (สำคัญมาก)

```
Anchor: 2024 = Star 2 (二黒土星)
Stars ลดลงทุกปี: 2024=2, 2025=1, 2026=9, 2027=8 ...
                  2016=1, 2015=2, 2014=3, ..., 1990=9, 1991=8

Rule: เกิดก่อน Risshun (立春 ~4 ก.พ.) → ใช้ปีก่อนหน้า
ตัวอย่าง: เกิด 3 ก.พ. 1991 ก่อน Risshun 4 ก.พ. → ใช้ปี 1990 → Star 9

Star Names:
1 = 一白水星 White Water (Kan 坎) — ทิศเหนือ — ขาว
2 = 二黒土星 Black Earth (Kun 坤) — ทิศตะวันตกเฉียงใต้ — ดำ/น้ำตาล
3 = 三碧木星 Green Wood (Zhen 震) — ทิศตะวันออก — เขียวฟ้า
4 = 四緑木星 Green Wood (Xun 巽) — ทิศตะวันออกเฉียงใต้ — เขียว
5 = 五黄土星 Yellow Earth (Center) — ศูนย์กลาง — เหลือง
6 = 六白金星 White Metal (Qian 乾) — ทิศตะวันตกเฉียงเหนือ — ขาว/เงิน
7 = 七赤金星 Red Metal (Dui 兑) — ทิศตะวันตก — แดง
8 = 八白土星 White Earth (Gen 艮) — ทิศตะวันออกเฉียงเหนือ — ขาว/เบจ
9 = 九紫火星 Purple Fire (Li 離) — ทิศใต้ — ม่วง/แดง

2026 Year Star = 9 (九紫火星)
Star 9 person in Star 9 Year = Honmei-sei Kaiki 本命星回帰
```

---

## การคำนวณ BaZi (สำคัญมาก)

```
Year Pillar: เกิดก่อน Li Chun (~4 ก.พ.) → ใช้ปีก่อนหน้า
Month Pillar: ใช้ Solar terms ไม่ใช่ปฏิทินเกรกอเรียน
  → July 1 ก่อน Xiao Shu ~Jul 7 = Month 午 ไม่ใช่ 未
  → November ก่อน Li Dong ~Nov 7 = Month ก่อนหน้า

Hour Branches:
  子(23-01) 丑(01-03) 寅(03-05) 卯(05-07) 辰(07-09) 巳(09-11)
  午(11-13) 未(13-15) 申(15-17) 酉(17-19) 戌(19-21) 亥(21-23)

Ben Ming Nian 2026: คนที่เกิดปีม้า (1930/42/54/66/78/90/2002)
  ตรวจด้วย Li Chun ไม่ใช่ตรุษจีน
```

---

## P3 — THE VERDICT Structure (ครึ่งหน้า)

THE VERDICT ต้องมี 5 ส่วนนี้ ห้ามย่อให้สั้นกว่านี้:

```
┌─────────────────────────────────────────────────────┐
│ ❖ THE VERDICT ❖                                     │
│                                                     │
│ [1] Identity Portrait (2–3 ประโยค)                 │
│   Sun ☉ ราศี[X] + ดวงจันทร์ ราศี[Y] +             │
│   Life Path [N] "[ชื่อ]" → [mission]               │
│   HD Type → [hdTypeDesc]                           │
│   BaZi ยืนยันซ้ำ: [elPersona]                     │
│                                                     │
│ [2] กล่องสีทอง "สิ่งที่ 10 ศาสตร์เห็นตรงกัน"     │
│   [top themes] + BaZi + NSK + Vedic Nakshatra      │
│   3 อารยธรรมที่ไม่รู้จักกันชี้มาที่จุดเดียว       │
│                                                     │
│ [3] 2-column grid                                   │
│   ✦ จุดแข็งหลัก (เขียว) | ⚠ ต้องระวัง (แดง)      │
│   ตาม Day Master element                           │
│                                                     │
│ [4] กล่องน้ำเงิน "หน้าต่างเวลา 2026"              │
│   BaZi LP [stems] = [LP Star Type]                │
│   Vedic Mahadasha [X] ถึง [year]                  │
│   PY [N] — [action เฉพาะ PY นั้น]                │
│                                                     │
│ [5] Score + closing line                           │
│   Score [total]/999 tier [tier]                   │
│   [scoreInterp] — max [max]/999                   │
└─────────────────────────────────────────────────────┘
```

**LP Star Types** (สำหรับ Luck Pillar analysis):
- `PROD[lpEl] === dmEl` → Resource Star (印) — ฟ้าเปิด LP ที่ดีที่สุด
- `PROD[dmEl] === lpEl` → Output Star (食伤) — ช่วงสร้างสรรค์ แสดงออก
- `CTRL[dmEl] === lpEl` → Wealth Star (财) — เหมาะทำเงิน ลงทุน
- `CTRL[lpEl] === dmEl` → Officer Star (官) — ท้าทาย ต้องพิสูจน์ตัวเอง
- `lpEl === dmEl` → Sibling Star (比) — สร้าง network ระวังการแข่งขัน

Element cycles:
- Production: ไม้→ไฟ→ดิน→โลหะ→น้ำ→ไม้
- Control: ไม้克ดิน, ไฟ克โลหะ, ดิน克น้ำ, โลหะ克ไม้, น้ำ克ไฟ

---

## P11 — ไทยพราหมณ์ + เลข ๗ ตัว ๙ ฐาน

**เลข ๗ ตัว อยู่ในหน้าเดียวกับไทยพราหมณ์** — เหตุผล: ทั้งสองมีรากวัฒนธรรมไทย/อินเดีย จึงรวมกัน

7 ตำแหน่ง คำนวณจาก d, m, y (เลขไทย 9 ฐาน):
```
[0] reduce(d)         → เลขตัวตน    บุคลิกภาพและพลังงานแท้จากวันเกิด
[1] reduce(m)         → เลขอาชีพ    เส้นทางการงานและความสามารถโดดเด่น
[2] reduce(y%100)     → เลขกรรม     บทเรียนชีวิตและกรรมเก่าที่ต้องสะสาง
[3] reduce(d+m)       → เลขสัมพันธ์ รูปแบบความสัมพันธ์และการเชื่อมต่อ
[4] reduce(d+(y%10))  → เลขทรัพย์   พลังงานด้านการเงินและทรัพย์สิน
[5] reduce(sum digits)→ เลขชีวิต   ผลลัพธ์รวมของเส้นทางชีวิต
[6] reduce(m+y%100)   → เลขสังคม   อิทธิพลต่อสังคมและมรดกที่ทิ้งไว้
```

แสดงผลเป็น 2-column grid: แต่ละช่องมี ตัวเลข (ใหญ่/ทอง) + label + desc + meaning

---

## P12 — เลขศาสตร์ตะวันตก (Life Path & Personal Year เท่านั้น)

**ไม่มีเลข ๗ ตัว** ในหน้านี้ — ย้ายไป P11 แล้ว

โครงสร้าง P12:
```
[2-card grid]
  ┌──────────────────┐  ┌──────────────────┐
  │ Life Path [N]    │  │ Personal Year [N] │
  │ ไม่เปลี่ยน       │  │ เปลี่ยนทุกปี      │
  │ "[LP Name]"      │  │ "[PY Name]"       │
  └──────────────────┘  └──────────────────┘

[box สีทอง] Life Path [N] — คืออะไร / คำนวณจาก / mission
[box สีน้ำเงิน] Personal Year [N] 2026 — คืออะไร / ธีมปีนี้ / action

[box Convergence]
  ถ้า LP === PY → "จุด Convergence หายาก — พลังงานซ้อนทับ"
  ถ้า LP ≠ PY  → "LP × PY — ความสัมพันธ์สองพลังงาน"
```

**Personal Year Actions** (เฉพาะตาม PY):
- PY1: ลงมือทำสิ่งที่ตั้งใจมานาน หน้าต่างเปิดแค่ปีนี้
- PY2: สร้างพันธมิตร รอผลในปี 3–4
- PY3: แสดงออก สร้างชื่อเสียง คนพร้อมรับ
- PY4: ลงทุนรากฐาน ผลออกช้าแต่มั่นคง
- PY5: รับโอกาสเร็ว อย่ารีรอ
- PY6: ดูแลความสัมพันธ์ ลงทุนกับคนใกล้ชิด
- PY7: ฟังภายใน อย่าฝืนสิ่งที่ไม่ไหล
- PY8: เก็บเกี่ยวผลของ 7 ปีที่ผ่านมา
- PY9: ปิดบทเก่า เคลียร์พื้นที่สำหรับปีหน้า

---

## P16 — Activation Plan (3 Tiers)

**ไม่ใช่ flat list** — ต้องแบ่ง priority tier 3 ระดับ:

```
🔴 Tier 1 — ทำเลย (ใช้แรงน้อย Impact สูงสุด)
  border: #7a2020, bg: #1a0a0a
  items: NSK สี, ทิศนอน, น้ำ/ออกกำลังกาย (~3 ข้อ)

🟡 Tier 2 — สร้าง Habit (ผล Compound)
  border: #6a5010, bg: #141008
  items: 24hr rule, Journal, พัฒนา expertise (~3 ข้อ)

🟢 Tier 3 — เสริมพลัง (ทำได้ก็ดี)
  border: #206020, bg: #081408
  items: ทำบุญ/mantra, นอนก่อน 23:00 (~2 ข้อ)
```

แต่ละ item ต้องมี pts และ cite ที่มาจากศาสตร์ใด

---

## P19 — Decade by Decade

**ต้องคำนวณ LP Star Type ต่อ decade จาก age จริง** ไม่ใช่ index 0–4:

```javascript
lpIdx = floor((bandAge - 8) / 10)  // map age → LP array index
// ไม่ใช่: LP[bandIndex] ← ผิด
```

แต่ละ decade block ต้องมี:
- LP element vs DM element → Star Type (Resource/Output/Wealth/Officer/Sibling)
- ธีมคำแนะนำที่ต่างกันแต่ละ decade (ห้าม copy-paste เหมือนกัน)
- Phase action set ที่ distinct:
  - 25–34: สร้าง expertise และ foundation
  - 35–44: ขยายผล สร้าง leverage
  - 45–54: ผู้นำ transfer ความรู้
  - 55–64: passive income, mentor, estate planning
  - 65+: ทำสิ่งมีความหมาย, memoir, joy

---

## หลักการ Framing — BaZi vs Western (สำคัญ)

**Western/Life Path นำ → BaZi ยืนยัน** ไม่ใช่ BaZi นำทุกอย่าง:

| ส่วน | ลำดับการพูดถึง |
|------|---------------|
| THE VERDICT (Para 1) | Sun ☉ ราศี → LP → BaZi ยืนยัน |
| Grand Convergence Theme 1 | Western ☉ → LP → NSK → BaZi ยืนยัน |
| Grand Convergence Theme 5 (Career) | LP career → HD Strategy → BaZi ยืนยัน |
| Theme 4 (Timing) | BaZi LP นำได้ — เป็นระบบ timing ชัดที่สุด |
| P12 | Western เท่านั้น — ไม่เอา BaZi มาปน |

เหตุผล: ผู้ใช้ไทยคุ้นเคย Western มากกว่า BaZi, LP เป็น universal, BaZi เป็น confirmation ชั้นสอง

---

## กฎสำคัญ — ห้ามทำ

1. **ห้ามอ้างถึงบุคคลอื่น** ในรายงานส่วนตัว — บุคคลประวัติศาสตร์เท่านั้น
2. **ห้ามใช้คำว่า "ใหม่"** กับ Nine Star Ki — ใช้ "นิยมในญี่ปุ่นและเกาหลี" แทน
3. **ต้องมี disclaimer** ทุกครั้งที่พูดถึงการเงินและสุขภาพ
4. **ต้องมี Ben Ming Nian box** ถ้าคนนั้นมี Ben Ming Nian 2026
5. **สีและข้อมูลต้องไม่ปนกัน** ระหว่างคน — ตรวจสอบ Day Master ทุกครั้ง
6. **P12 ห้ามมีเลข ๗ ตัว** — ย้ายไป P11 แล้ว
7. **THE VERDICT ต้องครึ่งหน้า** — ห้ามย่อเหลือ 3 บรรทัด
8. **Activation Plan ต้องแบ่ง 3 tiers** — ห้ามเป็น flat list

---

## การคำนวณ Nine Star Ki (สำคัญมาก)

```
Anchor: 2024 = Star 2 (二黒土星)
Stars ลดลงทุกปี: 2024=2, 2025=1, 2026=9, 2027=8 ...
                  2016=1, 2015=2, 2014=3, ..., 1990=9, 1991=8

Rule: เกิดก่อน Risshun (立春 ~4 ก.พ.) → ใช้ปีก่อนหน้า
ตัวอย่าง: เกิด 3 ก.พ. 1991 ก่อน Risshun 4 ก.พ. → ใช้ปี 1990 → Star 9
```

---

## Nine Star Ki ทิศมงคลตาม Star

| Star | ทิศทำงาน | ทิศนอน | สีมงคล | ระวัง |
|------|---------|--------|--------|------|
| Star 1 | เหนือ | ใต้ | ขาว | Star 2/5/8 Year |
| Star 2 | ตะวันตกเฉียงใต้ | เหนือ | เหลือง/น้ำตาล | Star 3/4 Year |
| Star 3 | ตะวันออก | ตะวันตก | เขียวฟ้า | Star 7/6 Year |
| Star 4 | ตะวันออกเฉียงใต้ | ตะวันออก | เขียว/ฟ้าอ่อน | Star 9 Year (Fire burns Wood) |
| Star 5 | ศูนย์กลาง | ตามปี | เหลือง | ทุก Star เสี่ยงในปี Star 5 |
| Star 6 | ตะวันตกเฉียงเหนือ | ตะวันออก | ขาว/เงิน | Star 2/5/8 Year |
| Star 7 | ตะวันตก | ตะวันออก | แดง/ชมพู | Star 3/4 Year |
| Star 8 | ตะวันออกเฉียงเหนือ | ตะวันตก | ขาว/เบจ | Star 3/4 Year |
| Star 9 | ใต้ | เหนือ | ม่วง/แดง | Star 2/5/8 Year |

---

## Day Master → ธาตุที่ขาด → คำแนะนำ

| Day Master | ธาตุขาด | เสริมด้วย | ออกกำลังกาย |
|-----------|--------|---------|------------|
| 丙 Yang Fire | น้ำ | สีน้ำเงิน ตู้ปลา ว่ายน้ำ | ว่ายน้ำ |
| 丁 Yin Fire | น้ำ | น้ำพุ สีน้ำเงิน | ว่ายน้ำ โยคะ |
| 甲 Yang Wood | โลหะ | สีขาว เครื่องเงิน | ยิม Weight |
| 乙 Yin Wood | โลหะ | เครื่องประดับโลหะ | Pilates |
| 戊 Yang Earth | ไม้ | ต้นไม้ สีเขียว | เดินในป่า |
| 己 Yin Earth | ไม้ | ต้นไม้ใบเขียว | เดินชายหาด |
| 庚 Yang Metal | ไฟ | สีแดง เทียน | HIIT Hot yoga |
| 辛 Yin Metal | ไฟ | แสงเทียน สีส้ม | Dance yoga |
| 壬 Yang Water | ดิน | หินธรรมชาติ สีเหลือง | เดิน Pilates |
| 癸 Yin Water | ดิน | หิน สีเหลือง/น้ำตาล | Yoga Pilates |

---

## Health Coaching — 6 Actions มาตรฐาน

1. **กฎ 24 ชั่วโมง** — ก่อนตัดสินใจสำคัญ (ทุกชาร์ต)
2. **น้ำ 2.5L/วัน** + เสริมธาตุที่ขาด
3. **ออกกำลังกาย** ตามธาตุ 3×/สัปดาห์
4. **นอนก่อน 23:00** + ทิศนอนตาม Nine Star Ki
5. **Journal 5 นาที + Meditation** ทุกวัน
6. **Mantra/ทำบุญ** ตามดาวปกครองวันเกิด

Disclaimer บังคับ: "ถ้ากำลังเผชิญกับสุขภาพจิตหรือการติดสารเสพติด กรุณาติดต่อสายด่วน **1323**"

---

## Finance Coaching — Structure มาตรฐาน

1. Disclaimer (บังคับ ลบไม่ได้)
2. ตาราง การลงทุน ≠ การพนัน
3. ดวงบอกอะไรเกี่ยวกับการเงิน (เชื่อมธาตุ)
4. แผน 3 ขั้น: เงินสำรอง → 50/30/20 → DCA Index Fund
5. สิ่งที่ควรหลีกเลี่ยงเฉพาะชาร์ต

---

## Historical Figures — คำแนะนำ

- เลือก 4 คน ที่มี trait คล้ายชาร์ตนั้น
- อธิบายเหตุผลจาก BaZi/Western/LP/NSK
- **ห้ามใช้บุคคลเดิมซ้ำ** กับคนที่อยู่ในรายงาน
- Score similarity: 600–800 ขึ้นกับความคล้าย

---

## โครงสร้าง Build Script

```python
# วิธีสร้าง Premium PDF 25 หน้า
# 1. คำนวณ BaZi, NSK, LP, PY ทั้งหมดก่อน
# 2. เขียน HTML ด้วย CSS จาก premium_full_v2.py (template)
# 3. แปลงเป็น PDF ด้วย wkhtmltopdf

wkhtmltopdf \
  --encoding utf-8 --page-size A4 \
  --margin-top 10mm --margin-bottom 10mm \
  --margin-left 6mm --margin-right 6mm \
  --disable-javascript --quiet \
  /tmp/report.html \
  /mnt/user-data/outputs/cosmic-[name]-[date].pdf
```

---

## ข้อผิดพลาดที่พบบ่อย

| ปัญหา | วิธีแก้ |
|-------|--------|
| ปีราศีจีนผิด | ตรวจ Li Chun ก่อน ไม่ใช่ตรุษจีน |
| Month Pillar ผิด | ตรวจ Solar term boundaries ทุกครั้ง |
| NSK ผิด | ใช้ anchor 2024=Star 2 นับย้อนหลัง |
| ข้อมูลปนกัน | อ่าน Day Master ทุกคนใหม่ทุกครั้ง |
| ฟอนต์ไทยไม่แสดง | ใช้ "Garuda","Loma","TH Sarabun New" |
| PDF น้อยกว่า 25 หน้า | เพิ่ม font-size 10.5pt line-height 1.85 |
| เรียก "ใหม่" กับ Nine Star | เปลี่ยนเป็น "นิยมในญี่ปุ่นและเกาหลี" |
| THE VERDICT สั้นเกิน | ต้องมีครบ 5 ส่วนตาม structure ข้างต้น |
| Activation Plan flat list | แบ่ง 3 tiers: 🔴🟡🟢 พร้อม pts |
| LP index ใน Decade ผิด | ใช้ floor((age-8)/10) ไม่ใช่ bandIndex |
| เลข ๗ ตัว อยู่ใน P12 | ย้ายไป P11 แล้ว — P12 = Western เท่านั้น |

---

## ไฟล์ใน Skill

```
cosmic-blueprint/
├── SKILL.md                    ← คำสั่งหลัก (ไฟล์นี้)
├── assets/
│   ├── report-template.html   ← HTML template พื้นฐาน
│   └── render_report.py       ← render pipeline
├── references/
│   └── report-schema.md       ← JSON schema ครบ
└── modules/
    ├── coaching-schema.md     ← Health + Finance coaching schema
    ├── coaching-template.html ← Health coaching HTML template
    └── finance-template.html  ← Finance coaching HTML template
```

