# Hellenistic Astrology Add-on — Framework

> v2.0 · 2026-06-09 · universal spec at `_shared/system-prompt-base.md`

## What it measures
Hellenistic astrology (~2,300 yrs Greek + Egyptian fusion) — the parent of
modern Western astrology, recovered through Project Hindsight since 1980s.
Uses **sect** (day/night chart), **planetary joys**, **time-lord systems**
(zodiacal releasing, profections, annual returns), and the **lots** (Arabic
Parts predecessor).

| Field | Use |
|---|---|
| `hellenistic.sect` (diurnal/nocturnal) | Day-chart vs night-chart inverts benefic/malefic emphasis |
| `hellenistic.profectedHouse` (1-12) | This year's primary house focus |
| `hellenistic.profectedLord` | Time-lord planet for this year |
| `hellenistic.lotFortune` / `lotSpirit` | Material vs vocational lots |
| `hellenistic.zr` | Zodiacal releasing period if applicable |
| `months[]` | |

## Q→Hint
- **work_energy_direction** — Profected house tells the year's life-area focus (e.g. 10th-house profection year = career exposure).
- **work_boldest_move_window** — Time-lord planet's transit months activating profected house.
- **money_flow_direction** — Lot of Fortune's domicile lord condition.
- **money_leak_or_windfall** — Malefic transit (per sect) to 2nd-house lord.
- **love_energy_state** — Lot of Eros (love); Venus condition by sect. Adjust per relationship_status.
- **love_timing_windows** — Profected to 7th house OR Venus return month.
- **health_weak_point** — Profected to 6th house OR Mars (per sect) afflicting Asc lord.
- **people_who_changes_you** — Lord of profected house describes the year's "guide" archetype.
- **warning_high_risk_window** — Out-of-sect malefic transit + profection clash.
- **warning_specific** — By sect:
  - Diurnal: Saturn = caution about loss/aging-stress
  - Nocturnal: Mars = caution about conflict/injury

## Pricing/risks
Standard. Sect determination requires accurate birth time + location (day/night).
