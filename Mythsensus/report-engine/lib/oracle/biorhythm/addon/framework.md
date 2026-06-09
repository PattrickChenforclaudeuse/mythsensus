# Biorhythm Add-on — Framework

> v2.0 · 2026-06-09

## What it measures
Biorhythm (~120 yrs old; popular pseudo-science since 1970s) tracks three
sinusoidal cycles starting from birth date:
- **Physical** (23 days) — strength, stamina, coordination
- **Emotional** (28 days) — mood, sensitivity, creativity
- **Intellectual** (33 days) — analytical reasoning, communication

Phase peaks/dips drive practical recommendations for action timing.

⚠ Note: biorhythm is **not scoring**-influential in Cosmic Score (the engine
excludes it from median). It refreshes daily.

| Field | Use |
|---|---|
| `biorhythm.phy` (-1.0 to 1.0) | Physical cycle phase |
| `biorhythm.emo` | Emotional cycle phase |
| `biorhythm.intel` | Intellectual cycle phase |
| `biorhythm.refDate` | Reference date (today by default) |
| `months[]` | |

## Q→Hint
- **work_energy_direction** — Today's intel cycle phase + projected weekly trend.
- **work_boldest_move_window** — Months where all three cycles peak together (rare = ~once/year).
- **money_flow_direction** — Intel + emo combo predicts decision-making clarity for money.
- **money_leak_or_windfall** — Critical-day months (cycle crossing zero) = avoid big transactions.
- **love_energy_state** — Emotional cycle position.
- **love_timing_windows** — Emo peaks within the year.
- **health_weak_point** — Physical cycle dips.
- **people_who_changes_you** — Biorhythm doesn't model relationships; cite chart's other systems instead via fallback.
- **warning_high_risk_window** — "Critical days" where any cycle crosses zero.
- **warning_specific** — Critical phy day → avoid risky physical activity; critical intel → don't sign contracts.

## Pricing/risks
Standard. Biorhythm has no scientific backing — frame as "behavioral pattern observation tool" not predictive truth.
