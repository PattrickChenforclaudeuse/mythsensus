# Thai Taksa (ทักษา) Add-on — Framework

> v2.0 · 2026-06-09

## What it measures
Thai Taksa is the 8-house Thai-Brahmin astrological system used in
classical readings. The 7 planetary lords (Sun-Saturn) are placed across
8 "houses" of life domain in a fixed clockwise pattern from your birthday
(day of week). Each placement governs a life zone.

| Field | Use |
|---|---|
| `taksa.birthdayLord` | The graha lord of your weekday |
| `taksa.houseLords` (8-element map) | Each house's current graha |
| `taksa.kalagini` (กาลกิณี — house 8) | Critical warning house |
| `taksa.bariwara` (บริวาร) | Servant/labor house |
| `taksa.ayu` (อายุ) | Life-force house |
| `months[]` | |

## The 8 Taksa houses + meaning

1. **ตน** (Self) — birthday graha sits here = baseline self
2. **กดุมพะ** (Family/Labor) — siblings, daily work
3. **บริวาร** (Servants) — subordinates, employees, helpers
4. **อายุ** (Lifespan) — vitality, health-strength
5. **เดช** (Power/Authority) — reputation, influence
6. **ศุภะ** (Auspicious) — luck, blessings, karma
7. **มูละ** (Wealth) — money, accumulated property
8. **กาลกิณี** (Curse/Obstacle) — single most-load-bearing warning

## Q→Hint
- **work_energy_direction** — Graha in ตน + เดช tells visibility/authority.
- **work_boldest_move_window** — Graha in เดช + its weekday months activate visibility.
- **money_flow_direction** — Graha in มูละ; Jupiter/Venus there = inflow.
- **money_leak_or_windfall** — Graha in กาลกิณี dictates leak source.
- **love_energy_state** — Venus + Moon placements per Taksa house. Adjust per status.
- **love_timing_windows** — Venus weekday months.
- **health_weak_point** — Graha in อายุ + body affinity of that graha.
- **people_who_changes_you** — Graha in บริวาร describes the helper archetype.
- **warning_high_risk_window** — กาลกิณี graha's weekday + its month.
- **warning_specific** — Always anchor on กาลกิณี graha — it's the single sharpest warning in this system. E.g. Saturn กาลกิณี → "อย่าค้ำประกัน · อย่ารอเงินคืน"; Rahu → "อย่าตัดสินใจเร็วกับคนใหม่".

## Pricing/risks
Standard. Weekday-based, deterministic.
