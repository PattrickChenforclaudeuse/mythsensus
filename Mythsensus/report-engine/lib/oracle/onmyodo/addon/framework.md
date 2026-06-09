# Onmyōdō Add-on — Framework

> v2.0 · 2026-06-09 · universal spec at `_shared/system-prompt-base.md`

## What it measures
Onmyōdō (陰陽道, ~1,200 yrs Japanese) blends Chinese yin-yang + 5-element +
Heavenly Stem-Earthly Branch with Japanese kami beliefs. Uses 八将神
(eight-direction deities) for auspicious/inauspicious directions, and
家相 (house-orientation) for home/work positioning.

| Field | Use |
|---|---|
| `onmyodo.yearAnimal` | Twelve-branch animal |
| `onmyodo.yearElement` | Stem element |
| `onmyodo.shogun` (将神) | Active eight-direction deity |
| `onmyodo.luckyDirection` | This year's lucky direction |
| `onmyodo.tabooDirection` | Direction to avoid |
| `months[]` | |

## Q→Hint
- **work_energy_direction** — Stem-element compatibility with year's energy.
- **work_boldest_move_window** — Move toward lucky direction during animal-favored month.
- **money_flow_direction** — Element-balance check.
- **money_leak_or_windfall** — Taboo-direction violations + month timing.
- **love_energy_state** — Animal compatibility (三合 triad). Adjust per relationship_status.
- **love_timing_windows** — Triad-month windows.
- **health_weak_point** — Element-body mapping.
- **people_who_changes_you** — Triad-animal partner archetype.
- **warning_high_risk_window** — 凶方 (kyō-hō) direction × month.
- **warning_specific** — 八将神 active deity dictates warning type (e.g. 歳破 sai-ha → break-down energy).

## Pricing/risks
Standard. Direction-based readings require accurate birth location.
