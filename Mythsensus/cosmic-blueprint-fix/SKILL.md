---
name: cosmic-blueprint
description: |
  สร้างรายงานดวงชะตาครบ 10 ศาสตร์ ภาษาไทย พร้อม PDF Premium 25 หน้า สำหรับบุคคลใดก็ได้
  โดยรับข้อมูล ชื่อ วันเกิด เวลาเกิด สถานที่เกิด และเพศ แล้วออก PDF รายงานดวงชะตาภาษาไทยแบบสมบูรณ์

  ใช้ skill นี้ทุกครั้งที่ผู้ใช้พูดถึง: "ดูดวง", "อ่านดวง", "ดวงชะตา", "horoscope", "birth chart",
  "natal chart", "cosmic", "BaZi", "สี่เสา", "เลข ๗ ตัว", "Human Design", "Vedic", "Nine Star Ki",
  "ดูดวงให้คนอื่น", "ส่งรายงานดวง", "สร้างรายงานดวง" หรือเมื่อผู้ใช้บอกวันเดือนปีเกิด + เวลา แล้วขอการวิเคราะห์

  ครอบคลุม 10 ศาสตร์ (ลำดับที่ถูกต้อง):
  1. Western Astrology
  2. BaZi Four Pillars (สี่เสา)
  3. Vedic Jyotish
  4. Nine Star Ki (九星気学) — นิยมในญี่ปุ่นและเกาหลี
  5. เลข ๗ ตัว ๙ ฐาน
  6. Pythagorean Numerology
  7. ระบบประเภทพลังงาน (Human Design) ← ใช้ชื่อนี้เสมอ ไม่ใช้ "Human Design" โดดๆ
  8. ไทยพราหมณ์
  9. มายัน Tzolk'in
  10. เซลติก Tree Astrology

  Output: Premium PDF ภาษาไทย 25 หน้า A4
---

# Cosmic Blueprint Skill — Premium Edition

## Premium Pack Standard (25 หน้า A4)

ทุก PDF ต้องมีครบทุก section ต่อไปนี้ตามลำดับ:

| # | Section | เนื้อหา |
|---|---------|---------|
| 1 | Cover + Score Banner | คะแนนจักรวาล tier สี นาม Ben Ming Nian box |
| 2 | Cosmic Score 10 ศาสตร์ | score bars breakdown ทุกศาสตร์พร้อม finding |
| 3 | Grand Convergence | 5–6 จุดที่ทุกศาสตร์เห็นตรงกัน พร้อมจำนวนศาสตร์ |
| 4 | Western Astrology | Sun Moon ASC Venus Saturn transit |
| 5 | BaZi สี่เสา | 4 pillars grid + โครงสร้างพิเศษ + Luck Pillars |
| 6 | Nine Star Ki (นิยมในญี่ปุ่น-เกาหลี) | Star number ทิศมงคล สี 2026 analysis |
| 7 | Vedic Jyotish | Lagna Nakshatra Mahadasha Yogas |
| 8 | ระบบพลังงาน + LP + ศาสตร์อื่น | ระบบประเภทพลังงาน Life Path มายัน Celtic ไทย |
| 9 | Western Deep Analysis | Sun/Moon/ASC/Venus/Saturn เชิงลึก |
| 10 | BaZi Deep Analysis | Day Master element wealth officer เชิงลึก |
| 11 | Vedic + NSK + ระบบพลังงาน Deep | Lagna Mahadasha NSK Star ระบบพลังงาน Profile เชิงลึก |
| 12 | เลข ๗ ตัว + LP + ศาสตร์อื่น เชิงลึก | ตำแหน่งดาว Life Path อธิบายเชิงลึก |
| 13 | Decade by Decade | 25–34 / 35–44 / 45–54 / 55–64 / 65+ ทุก phase |
| 14 | สีและการแต่งตัว | 5 สีมงคล 2 หลีกเลี่ยง ผ้า เครื่องประดับ ชุดตามโอกาส |
| 15 | บุคคลประวัติศาสตร์ | 4 คน พร้อม score เหตุผล traits |
| 16 | Health Coaching | 5–6 actions จาก 10 ศาสตร์ + science note |
| 17 | Finance Coaching | การลงทุน≠การพนัน แผน 3 ขั้น สิ่งที่หลีกเลี่ยง + disclaimer |
| 18 | Activation Plan | 6–8 actions เรียงตาม pts + 3–4 warnings |
| 19 | สัตว์เลี้ยง | 3–4 ตัว พร้อมเหตุผลจากดวง |
| 20 | Weekly Plan | ตาราง 7 วัน |
| 21 | พยากรณ์รายเดือน 2026 | 12 เดือน Nine Star Month |
| 22 | พยากรณ์ 10 ปี | 2569–2578 PY + Vedic sub + คำแนะนำ |
| 23 | 5 Pain Points | ความรัก การงาน สุขภาพ ตัดสินใจ รู้จักตัวเอง |
| 24 | สรุปภาพรวม | tier ความหมาย จุดแข็ง ความท้าทาย ช่วงทอง + คำส่งท้าย |
| 25 | (overflow) | content ล้นจาก sections ก่อนหน้า |

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

## กฎสำคัญ — ห้ามทำ

1. **ห้ามอ้างถึงบุคคลอื่น** ในรายงานส่วนตัว — บุคคลประวัติศาสตร์เท่านั้น
2. **ห้ามใช้คำว่า "ใหม่"** กับ Nine Star Ki — ใช้ "นิยมในญี่ปุ่นและเกาหลี" แทน
3. **ต้องมี disclaimer** ทุกครั้งที่พูดถึงการเงินและสุขภาพ
4. **ต้องมี Ben Ming Nian box** ถ้าคนนั้นมี Ben Ming Nian 2026
5. **สีและข้อมูลต้องไม่ปนกัน** ระหว่างคน — ตรวจสอบ Day Master ทุกครั้ง

---

## โครงสร้าง Build Script

```python
# วิธีสร้าง Premium PDF 25 หน้า
# 1. คำนวณ BaZi, NSK, LP, PY ทั้งหมดก่อน
# 2. เขียน HTML ด้วย CSS จาก render_report.py (template)
#    - ฟอนต์ Sarabun embed เป็น base64 woff2 ใน CSS (@font-face)
#    - ใช้ @page rules สำหรับ A4 sizing
#    - Dark theme: bg #040407, gold #c8a45a, text #e6e2d8
# 3. แปลงเป็น PDF ด้วย WeasyPrint (รองรับ Thai text rendering)

# WeasyPrint render:
from weasyprint import HTML
HTML(string=html_content).write_pdf('/path/to/output.pdf')

# ถ้าไม่มี WeasyPrint:
pip install weasyprint
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

## Decade by Decade — Structure

สำหรับแต่ละ decade ให้ระบุ:
- BaZi Luck Pillar ที่กำลังดำเนิน
- Vedic Mahadasha sub-period
- Numerology Personal Year ช่วงนั้น
- Nine Star Ki movement
- สิ่งที่ควรทำ / timing สำคัญ / สิ่งที่ระวัง

---

## ข้อผิดพลาดที่พบบ่อย

| ปัญหา | วิธีแก้ |
|-------|--------|
| ปีราศีจีนผิด | ตรวจ Li Chun ก่อน ไม่ใช่ตรุษจีน |
| Month Pillar ผิด | ตรวจ Solar term boundaries ทุกครั้ง |
| NSK ผิด | ใช้ anchor 2024=Star 2 นับย้อนหลัง |
| ข้อมูลปนกัน | อ่าน Day Master ทุกคนใหม่ทุกครั้ง |
| ฟอนต์ไทยไม่แสดง | ใช้ Sarabun embed base64 woff2 + fallback "Garuda","Loma" |
| PDF น้อยกว่า 25 หน้า | เพิ่ม font-size 10.5pt line-height 1.85 |
| เรียก "ใหม่" กับ Nine Star | เปลี่ยนเป็น "นิยมในญี่ปุ่นและเกาหลี" |

---

## ไฟล์ใน Skill

```
cosmic-blueprint/
├── SKILL.md                    ← คำสั่งหลัก (ไฟล์นี้)
├── assets/
│   ├── report-template.html   ← HTML template พื้นฐาน (dark theme, Sarabun embed)
│   ├── render_report.py       ← render pipeline (WeasyPrint)
│   └── sarabun-embedded.css   ← Sarabun font base64 woff2 (4 weights: 300,400,600,700)
├── references/
│   └── report-schema.md       ← JSON schema ครบ
└── modules/
    ├── coaching-schema.md     ← Health + Finance coaching schema
    ├── coaching-template.html ← Health coaching HTML template
    └── finance-template.html  ← Finance coaching HTML template
```

