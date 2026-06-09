# BaZi Oracle — บทที่ 1: หน้าที่ปี (Year Pillar)

**Reference framework for the `/api/oracle/bazi/origin` endpoint.**
This document is the source of truth for *what* the chapter covers.
The system prompt enforces *how* it is delivered.

---

## Scope

หน้าที่ปี (年柱 Year Pillar) = เสาที่ 1 ของ 4 เสาในวิชา BaZi (จีนคลาสสิค)
- ตีนต้นทุนชีวิต — ครอบครัวต้นกำเนิด, ปู่ย่าตายาย, สภาพแวดล้อมก่อนอายุ 16
- ภาพ "โลกที่คุณเกิดมา" ที่กำหนด baseline ก่อนตัวคุณจะเริ่มเขียนเรื่องเอง
- เป็น "ทิวทัศน์" ที่ Day Master (ตัวคุณ) ยืนอยู่ตอนเริ่มต้น

---

## Inputs (จาก engine — engine = source of truth)

```
year_stem       1 ตัวจาก 10 Heavenly Stems (天干): 甲乙丙丁戊己庚辛壬癸
year_branch     1 ตัวจาก 12 Earthly Branches (地支): 子丑寅卯辰巳午未申酉戌亥
day_master      Day stem (สำหรับคำนวณ Ten Gods relation)
na_yin          1 ใน 60 Na Yin elements (納音五行) — sound element ของ pillar
year_pillar_combo   year_stem + year_branch (e.g. 庚午)
```

Engine ยังควรส่ง derived:
```
ten_god_of_year_stem   relation ของ year_stem ต่อ day_master
                       (七殺/正官/偏印/正印/比肩/劫財/食神/傷官/偏財/正財)
hidden_stems_of_year_branch   1-3 stems ที่ซ่อนใน year_branch
year_branch_element    1 ใน 5 elements (Wood/Fire/Earth/Metal/Water)
```

**ห้าม render claim ที่ไม่ใช้ field ใน inputs ข้างต้น** (= QA-1 violation)

---

## Output structure (3 sections in 1 page)

### Section 1: เปิดประตู (1 ย่อหน้า, 2-3 ประโยค)
Hook ที่ tie กับ year pillar combo + Day Master
- ใช้ภาพ metaphor (ภูเขา, แม่น้ำ, ตะวันรุ่ง, ทะเลทราย ฯลฯ)
- ห้าม Barnum — ต้องตรงกับธาตุของ year pillar

### Section 2: ราชวงศ์ของคุณ (ครอบครัวต้นกำเนิด, 2-3 ย่อหน้า)
ตีความ year_stem + year_branch ในเชิง 六親 (Six Relatives)
- Year stem = ปู่ (paternal grandfather), authority อันดับสูงสุดในตระกูล
- Year branch = ย่า (paternal grandmother), aura ของบ้านเกิด
- ใช้ Ten God relation ของ year_stem ต่อ Day Master:
  - 七殺 (Seven Killings): บรรยากาศมีอำนาจ/วินัย, ปู่ย่าหรือผู้ใหญ่ที่เข้มงวด
  - 正官 (Proper Officer): order/ethics, ครอบครัวที่ยึดกฎ
  - 偏印/正印 (Indirect/Direct Resource): มี mentor figure ในตระกูล, ความรู้/ศาสนา
  - 比肩/劫財 (Sibling/Rob): พี่น้อง/สาย collateral มีอิทธิพล
  - 食神/傷官 (Eating/Hurting Output): บรรยากาศศิลปะ/แสดงออก
  - 偏財/正財 (Indirect/Direct Wealth): ครอบครัวค้าขาย/มี wealth tradition

### Section 3: ตีนต้นทุน — 納音 ของคุณ (1-2 ย่อหน้า + cliffhanger)
ตีความ na_yin ของ year pillar (60 ค่า, ตัวอย่าง):
- 庚午 / 辛未 = 路旁土 (Lu Pang Tu, Road-Side Earth) — foundation ที่รองรับนักเดินทาง
- 戊辰 / 己巳 = 大林木 (Da Lin Mu, Forest Wood) — ระบบนิเวศใหญ่
- 丙寅 / 丁卯 = 爐中火 (Lu Zhong Huo, Furnace Fire) — ไฟในเตาหลอม
- ... (ดู Na Yin table ครบ 60 ใน na_yin_table.json)

ปิดด้วย **cliffhanger** → "แต่นี่ยังแค่ทิวทัศน์... ตัวคุณเอง (Day Master) เริ่มเล่นบทไหนในทิวทัศน์นี้?
อ่านต่อในบทที่ 2 — เสาแห่งตัวตน"

---

## Voice & length

- Voice: **Oracle** (2nd person `คุณ`, dramatic, Chinese vocab untranslated)
- Length: **450-550 Thai words** (hard cap 600)
- Page count: **1 page**
- ห้าม:
  - ตัวเลขปี/อายุที่ engine ไม่ได้ส่ง
  - ทำนายเหตุการณ์อนาคต (chapter นี้ = origin, ไม่ใช่ timing)
  - Generic Barnum ("คุณเป็นคนพิเศษ", "คุณมีพรสวรรค์")

## Cross-sell

ปลายบทมี link → บทที่ 2 (Day Master) เป็น default cross-sell
ระบุใน schema field `cross_sell_next: "bazi.day-master"`

---

## Anti-Sajutight checklist

จากรีวิว Sajutight 690฿ — ห้ามทำผิดแบบเขา:

| Pitfall | Mitigation |
|---|---|
| Thai typo จาก MT | เขียน Thai native ด้วย Sonnet 4.6, ห้ามใช้ Haiku |
| Generic dramatic claim | ทุก claim ต้อง trace กลับ engine field (`engine_refs` array) |
| Year-specific prediction ผิดหน้า | บทนี้ = origin, ไม่ใช่ timing → ห้ามทำนายปี |
| Engine mistake | ใช้ engine จริงของ Mythsensus (26-system) ไม่ใช่ Sajutight |
| ไม่มี cross-sell | บังคับมี `cross_sell_next` ใน schema |

---

## References (สำหรับ future engineer)

- 干支历 (Stems & Branches calendar): Wikipedia + Sterling Liu's "Four Pillars of Destiny"
- 納音五行 60 table: Joseph Yu's "BaZi: The Four Pillars of Destiny" Appendix A
- 六親 (Six Relatives): Raymond Lo "BaZi 100" Ch.4
- Engine source: `lib/calc.ts` BaZi section
