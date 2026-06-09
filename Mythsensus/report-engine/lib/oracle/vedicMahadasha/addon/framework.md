# Vedic Mahadasha (Vimshottari) Add-on — Framework

> v2.0 · 2026-06-09

## What it measures
Vimshottari Mahādaśā is the primary Vedic timing system — your life unfolds
through 120-year cycle of 9 planetary lords each ruling a fixed duration:
Sun (6yr), Moon (10), Mars (7), Rāhu (18), Jupiter (16), Saturn (19),
Mercury (17), Ketu (7), Venus (20). Within each Mahā, sub-periods
(Antara, Pratyantara) refine timing.

| Field | Use |
|---|---|
| `vedicMahadasha.currentMahaLord` (planet) | Current 6-20yr lord |
| `vedicMahadasha.currentMahaEnd` | When current Maha ends |
| `vedicMahadasha.currentAntara` | Sub-period |
| `vedicMahadasha.nextMahaLord` | Upcoming chapter |
| `vedicMahadasha.balanceAtBirth` | First Maha that ran from birth |
| `months[]` | |

## Maha Lord 1-line lens (use this year's lord as the year's lens)

- **Sun** (~6yr) — visibility, exposure, ego-burnishing
- **Moon** (~10yr) — emotional learning, public connections
- **Mars** (~7yr) — drive, conflict, physical action
- **Rāhu** (~18yr) — unconventional, desire, foreign, illusion
- **Jupiter** (~16yr) — expansion, teaching, wealth, spirituality
- **Saturn** (~19yr) — discipline, karma, structure, slow ripening
- **Mercury** (~17yr) — communication, business, learning
- **Ketu** (~7yr) — detachment, mystical, dissolution
- **Venus** (~20yr) — pleasure, relationships, art, comfort

## Q→Hint
- **work_energy_direction** — Maha lord's nature dictates this whole chapter.
- **work_boldest_move_window** — Months where Antara lord favors action + good house transit.
- **money_flow_direction** — Maha lord vs your 2nd/11th house lord.
- **money_leak_or_windfall** — Antara dispositor's house.
- **love_energy_state** — Venus or Moon antara within Maha. Adjust per status.
- **love_timing_windows** — Venus antara months.
- **health_weak_point** — Maha lord's body affinity + transit affliction.
- **people_who_changes_you** — Maha lord's "agent" archetype (e.g. Jupiter Maha = teacher figure).
- **warning_high_risk_window** — End of Maha (sandhi — transition months).
- **warning_specific** — By Maha lord:
  - Saturn → "ทำงานหนัก แต่ไม่ฝืนกฎ"
  - Rahu → "อย่าถูกล่อด้วยลัด"

## Pricing/risks
Standard. Mahā calculation depends on accurate Moon Nakshatra at birth (needs time).
