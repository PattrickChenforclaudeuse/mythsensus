# Tibetan Astrology Add-on — Framework

> v2.0 · 2026-06-09 · universal spec at `_shared/system-prompt-base.md`

## What it measures
Tibetan astrology (Tsi-pa, ~1,200 yrs) blends Chinese elemental, Indian Kalachakra,
and indigenous Bön traditions. Uses 12-animal × 5-element × birth-element pillars.
Strong focus on **rlung** (wind), **tripa** (bile), **peken** (phlegm) doshic
balance + protector deities.

| Field | Use |
|---|---|
| `tibetan.birthAnimal` | Identity baseline (rat-pig cycle) |
| `tibetan.birthElement` | Element pillar (Wood/Fire/Earth/Metal/Water) |
| `tibetan.protectorDeity` | Specific year/personal protector |
| `tibetan.doshaTendency` | rlung/tripa/peken constitutional balance |
| `months[]` | Calendar months |

## Q→Hint
- **work_energy_direction** — Element × this year's element compatibility.
- **work_boldest_move_window** — Animal's auspicious month per traditional calendar.
- **money_flow_direction** — Earth + Metal elements favor inflow; Water/Wood favor flow.
- **money_leak_or_windfall** — Doshic imbalance months (rlung high = impulsive spending).
- **love_energy_state** — Element compatibility + dosha. Adjust per relationship_status.
- **love_timing_windows** — Animal's opposite-pair month (relationship triggers).
- **health_weak_point** — Doshic excess body system.
- **people_who_changes_you** — Protector deity's archetype + a complement animal.
- **warning_high_risk_window** — "obstacle year" if animal sits in 7th opposite.
- **warning_specific** — Doshic-flare warning by month.

## Pricing/risks
Standard. Calendar boundary same as Chinese Lunar.
