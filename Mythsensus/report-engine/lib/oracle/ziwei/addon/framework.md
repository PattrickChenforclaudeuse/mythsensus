# Zi Wei Dou Shu Add-on — Framework

> v2.0 · 2026-06-09 · universal spec at `_shared/system-prompt-base.md`

## What it measures
Zi Wei Dou Shu (紫微斗數 — "Purple Star Astrology", ~1,100 yrs from Song China)
maps 14 main stars + 100+ minor stars across 12 "palaces" — each palace = life
domain (self/wealth/career/love/parents/children/etc.). The richest
chart-driven Chinese astrology system.

| Field | Use |
|---|---|
| `ziwei.lifePalace` | Identity palace + Zi Wei star placement |
| `ziwei.mainStarsByPalace` | 14 main stars distributed |
| `ziwei.wealthPalaceStar` | Money domain |
| `ziwei.careerPalaceStar` | Career domain |
| `ziwei.spousePalaceStar` | Marriage/love |
| `ziwei.parentsPalace` / `childrenPalace` | People |
| `ziwei.fortuneStar2026` | This year's wandering fortune |
| `months[]` | |

## Key main stars (14) — 1-line themes
紫微 Zi Wei (emperor/dignity), 天機 Tian Ji (strategist/change), 太陽 Tai Yang (visibility),
武曲 Wu Qu (warrior/wealth), 天同 Tian Tong (joy/ease), 廉貞 Lian Zhen (integrity/passion),
天府 Tian Fu (treasury/stability), 太陰 Tai Yin (sensitivity/maternal), 貪狼 Tan Lang
(desire/charisma), 巨門 Ju Men (eloquence/conflict), 天相 Tian Xiang (minister/aid),
天梁 Tian Liang (sage/protection), 七殺 Qi Sha (warrior/breakthrough), 破軍 Po Jun
(destroyer/renewal).

## Q→Hint
- **work_energy_direction** — Career palace's main star + Zi Wei position.
- **work_boldest_move_window** — Months activating career-palace star.
- **money_flow_direction** — Wealth palace's main star (Wu Qu/Tian Fu = stable; Tan Lang = boom/bust).
- **money_leak_or_windfall** — 2026 wandering fortune star landing on wealth palace.
- **love_energy_state** — Spouse palace star. Adjust per relationship_status.
- **love_timing_windows** — Spouse palace + transit-fortune-star months.
- **health_weak_point** — Each star has body affinity.
- **people_who_changes_you** — Parents / children / sibling palace's dominant star.
- **warning_high_risk_window** — 化忌 (Hua Ji — afflicted star) transit month.
- **warning_specific** — Hua Ji landing palace dictates the warning topic.

## Pricing/risks
Standard. Time-of-birth required for palace assignment.
