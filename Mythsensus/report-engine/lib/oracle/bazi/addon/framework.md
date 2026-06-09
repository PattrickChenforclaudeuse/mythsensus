# BaZi Add-on — Framework knowledge (system-specific)

> Version: 2.0 (locked 2026-06-09 — replaces v1.0 3-section format)
> Universal voice + 6-cat × 10-Q schema lives at `_shared/system-prompt-base.md`
> This file = the BaZi-specific knowledge layer appended to that base prompt.

---

## What BaZi measures

BaZi (八字 — "eight characters" — also Four Pillars of Destiny) maps a birth moment to **4 stem-branch pairs** (year / month / day / hour), each a wood/fire/earth/metal/water combination. The DAY STEM is your "Day Master" (日主) — the elemental archetype you are. The interplay of the 8 characters reveals strengths, blind spots, favorable elements (用神 *yòng shén*), and the 10-year Luck Pillars (大運 *dà yùn*) that flow over a lifetime.

For the 6-cat-10-Q output, the most load-bearing fields are:

| Field | Use it to answer |
|---|---|
| `bazi.day_master` (天干 of day) | Identity baseline · drives almost every answer's emphasis |
| `bazi.day_master_element` | Element balance · which year-pillars support/clash |
| `bazi.yong_shin[]` | "ธาตุเสริม" → which months/decisions are favored |
| `bazi.avoid_element` (or `element_counts` skew) | "ธาตุระวัง" → which months/decisions risk |
| `bazi.element_counts` | Imbalance signal · over-strong = arrogance/burnout; missing = blind spot |
| `bazi.current_lp.pillar` + `ten_god_vs_dm` | 10-year arc context · why "this year" inside "this decade" |
| `bazi.current_lp.iso_end` | "อีกกี่ปี LP เปลี่ยน" — cliffhanger material |
| `year_pillar` + `liu_nian_ten_god` | THIS YEAR's energy lens — what the year asks of you |
| `months[i].pillar` + `ten_god` + `clash_or_combo` | Which month is peak/caution/open/consolidate |
| `context.work_country` + `context.domain` | Path Resonance — which work environment amplifies your chart |
| `context.relationship_status` | Adjust love-category emphasis only |

## Mandarin Thai phonetic table (mandatory whenever Chinese char appears)

Use 干支 / Ten God / Na Yin in raw Chinese characters in the prose. Add Thai phonetic in brackets the FIRST time each term appears in the reading. Never invent phonetics.

| Term | Pinyin | Thai phonetic |
|---|---|---|
| 甲 | jiǎ | เจี่ย |
| 乙 | yǐ | อี่ |
| 丙 | bǐng | ปิ่ง |
| 丁 | dīng | ติง |
| 戊 | wù | อู้ |
| 己 | jǐ | จี่ |
| 庚 | gēng | เกิง |
| 辛 | xīn | ซิน |
| 壬 | rén | เหริน |
| 癸 | guǐ | กุ่ย |
| 子 | zǐ | จื่อ |
| 丑 | chǒu | โฉ่ว |
| 寅 | yín | หยิน |
| 卯 | mǎo | เหม่า |
| 辰 | chén | เฉิน |
| 巳 | sì | ซื่อ |
| 午 | wǔ | อู่ |
| 未 | wèi | เว่ย |
| 申 | shēn | เซิน |
| 酉 | yǒu | โหย่ว |
| 戌 | xū | ซวี |
| 亥 | hài | ไฮ่ |
| 七殺 | qī shā | ชี ซา |
| 正官 | zhèng guān | เจิ้ง กวน |
| 食神 | shí shén | สือ เสิน |
| 傷官 | shāng guān | ซาง กวน |
| 偏財 | piān cái | เพียน ไฉ |
| 正財 | zhèng cái | เจิ้ง ไฉ |
| 偏印 | piān yìn | เพียน ยิ่น |
| 正印 | zhèng yìn | เจิ้ง ยิ่น |
| 比肩 | bǐ jiān | ปี่ เจียน |
| 劫財 | jié cái | เจี๋ย ไฉ |
| 用神 | yòng shén | ย่ง เสิน |
| 大運 | dà yùn | ต้า ยุ่น |
| 流年 | liú nián | หลิว เหนียน |
| 沖 | chōng | ชง |
| 合 | hé | เหอ |

## How BaZi answers each of the 10 universal questions

These are **HINTS** — guidance for how a BaZi reading should ground each universal question. Not templates; the LLM still writes prose anchored to the actual chart.

### `work_energy_direction` (การงาน · pattern)
Anchor: `liu_nian_ten_god` vs `bazi.day_master`. A 食神 *(สือ เสิน)* year on a 甲 *(เจี่ย)* Day Master = output / creative / present-yourself energy. A 偏官 / 七殺 *(ชี ซา)* year = pressure / discipline / "trial by fire". Frame the answer as which of `ขึ้น / นิ่ง / ลด / แปลงร่าง` fits the relationship.

### `work_boldest_move_window` (การงาน · timing)
Find the month(s) where `months[i].ten_god` is favorable AND `clash_or_combo` is not 沖. Highlight as peak. If the chart has a current 大運 transition this year, mention it.

### `money_flow_direction` (การเงิน · pattern)
Anchor: 正財 / 偏財 *(เจิ้ง ไฉ / เพียน ไฉ)* presence and strength vs Day Master strength. Over-strong DM with weak 財 = "ออก > เข้า"; balanced DM with active 財 stem in year/month = "เข้า > ออก". State the WHY with both halves citing engine fields.

### `money_leak_or_windfall` (การเงิน · pattern + timing)
A "rule rua" (รูรั่ว) → 比劫 *(บี้ เจี๋ย)* presence (siblings element that competes for 財). A "ก้อนทอง" → month with 財 star transit aligning to favorable 用神 element. Always reference specific months.

### `love_energy_state` (ความรัก · pattern)
Anchor: 正官 / 七殺 for women, 正財 / 偏財 for men (relationship-star convention). When `context.relationship_status` is set, adjust emphasis per the base prompt's section 6.

### `love_timing_windows` (ความรัก · timing)
Map `months[]` by relationship-star activation. Tag each window as เริ่ม / พัฒนา / ตัดสินใจ / ปล่อย.

### `health_weak_point` (สุขภาพ · pattern + timing)
Anchor: `bazi.missing_element` + `bazi.element_counts` skew. Each element maps to body system (Wood = liver/eye, Fire = heart/circulation, Earth = digestion/spleen, Metal = lung/skin, Water = kidney/ear). Cite the specific month when the deficient element gets sharpest.

### `people_who_changes_you` (ครอบครัว/คนใกล้ตัว · pattern)
Anchor: 印 *(ยิ่น)* presence (mother/mentor figures), 比 *(ปี่)* presence (siblings/peers), 官 (authority figures), 食 (children/output recipients). Don't name a generic "important person" — describe the function the chart predicts.

### `warning_high_risk_window` (สิ่งที่ต้องระวัง · timing)
Find month(s) with 沖 / 害 with the day pillar, or where 七殺 strikes a weak DM. Be honest about the WHY.

### `warning_specific` (สิ่งที่ต้องระวัง · pattern)
Map the warning type from the engine signal:
- Strong 劫財 in year → "อย่ายืม/ค้ำประกัน" (peer betrayal)
- 七殺 unmoderated → "อย่าเซ็นสัญญาเร่งรีบ"
- 印 over-active → "อย่าเชื่อข้อมูลจาก one-source"

---

## Pricing & access

- **One-off:** $9 per ศาสตร์ per chart input (= ~320฿; aligned to Sajutight benchmark 690฿ that covers 4 chapters; Mythsensus = 6 categories ÷ ~1.5× more depth)
- **Subscriber:** 2 free ศาสตร์ / เดือน · $4 per additional
- **Cache:** keyed by `(chart_hash, system, lang, relationship_status, prompt_version)` — invalidates on framework change

## Cost & timing targets

- Sonnet 4.6 · max output 4000 tokens
- Target render: 1500-3500 words → $0.08-0.15
- Hard timeout: 25s
- Daily soft cap: $30 (configurable via env)

## Risks specific to BaZi v1 engine

⚠ **Month-pillar boundary:** BaZi months don't align to calendar months — they shift at solar terms (jiéqì). The v1 engine uses approximate boundaries which fail for ~5% of DOBs within ±48h of a term. Engine v2 (precise jiéqì) is in shadow observation until 2026-06-15.

Affected answers: `work_boldest_move_window`, `money_leak_or_windfall`, `love_timing_windows`, `warning_high_risk_window` — the month references in these can be ±1 month wrong near solar terms. Surface as a soft caveat in `body` when the chart's birth date is within 48h of a jiéqì (engine sets `bazi.month_pillar_uncertain: true` when this happens).

---

## Future system parallel (reference for replicating to 25 systems)

Each of the other 25 systems gets its own `<system>/framework.md` following this same shape:
1. "What this system measures" — 2 paragraphs
2. Field-to-question routing table — which engine fields to cite for which q_key
3. System-specific terminology glossary (phonetic for non-Latin scripts)
4. Per-question answer hints (≤1 line each)
5. Pricing/cache/cost note (same as above — shared)
6. Risks specific to this system

The shared prompt at `_shared/system-prompt-base.md` carries the voice rules + 6-cat-10-Q output schema. Frameworks supply only the domain knowledge.
