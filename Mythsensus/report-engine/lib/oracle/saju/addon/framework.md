# Korean Saju Add-on — Framework knowledge

> Version: 2.0 (locked 2026-06-09)

## What Saju measures

Saju (사주팔자 — "four pillars, eight characters") is the Korean lineage of
Chinese BaZi. Same eight characters; Korean schools emphasize **십신 Sip-shin**
(Ten Gods) relationships + **유신 Yong-shin** (favorable element) with more
psychological framing than mainland BaZi. Heavy use of **대운 Dae-un**
(10-year fortune pillar) and **세운 Se-un** (yearly fortune).

| Field | Use to answer |
|---|---|
| `saju.dayMaster` (일주) | Identity core — same as BaZi day stem |
| `saju.tenGodsThisYear` (십신) | Year's pressure type |
| `saju.daeUn` (대운) | Current 10-year fortune lord |
| `saju.seUn` (세운) | This year's specific fortune |
| `saju.yongShin` (용신) | Element to strengthen |
| `saju.gishin` (기신) | Element to avoid |
| `months[]` | Calendar months |

## Korean phonetic table (use first occurrence)

| Term | Korean | Korean phonetic |
|---|---|---|
| 일주 | 일주 | il-ju (day pillar) |
| 십신 | 십신 | sip-shin (ten gods) |
| 용신 | 용신 | yong-shin (favorable god) |
| 기신 | 기신 | gi-shin (avoidance god) |
| 대운 | 대운 | dae-un (great fortune) |
| 세운 | 세운 | se-un (year fortune) |
| 정관 | 정관 | jeong-gwan (proper officer) |
| 편관 | 편관 | pyeon-gwan (eccentric officer / 7 killings) |
| 정재 | 정재 | jeong-jae (proper wealth) |
| 편재 | 편재 | pyeon-jae (eccentric wealth) |

## How Saju answers the 10 universal questions

- **work_energy_direction** — Year's ten-god vs day master decides. 정관 year on Wood DM = visibility/promotion. 편관 = pressure/trial.
- **work_boldest_move_window** — Months where the year's ten-god aligns with favorable yong-shin element.
- **money_flow_direction** — 정재 active = stable inflow. 편재 active = surge-and-dip. 비겁 active = leak via partners.
- **money_leak_or_windfall** — Gi-shin in the wealth field this year + the month it activates.
- **love_energy_state** — For women: 정관/편관 placements. For men: 정재/편재. Adjust per relationship_status.
- **love_timing_windows** — Months where the year's love-star transit favorable months.
- **health_weak_point** — Excess yong-shin element → its body system overloads.
- **people_who_changes_you** — Use 인성 (Insŏng, parent figure) field — describe the supportive person's archetype.
- **warning_high_risk_window** — 편관 in the wrong month + sade-sati-like Saturn pass.
- **warning_specific** — Map by gi-shin element:
  - 토 gi-shin → "อย่าหวังพึ่งของเก่า / ที่ดิน"
  - 금 gi-shin → "อย่าเซ็นเอกสาร / คมๆ"

## Pricing & cost
Same as base. Risks: Solar-term boundary affects month pillar (same as BaZi). ±5% of DOBs flagged via `saju.month_uncertain`.
