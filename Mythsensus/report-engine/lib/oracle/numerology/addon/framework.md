# Pythagorean Numerology Add-on — Framework knowledge

> Version: 2.0 (locked 2026-06-09)

---

## What Numerology measures

Pythagorean numerology (Greek, ~2,500 yrs) treats numbers as archetypes.
From birth date alone you derive:
- **Life Path** (sum of birth date) — your overarching theme
- **Destiny** (sum of name letters) — what you're here to accomplish
- **Personal Year** (current year cycle) — what THIS year asks of you
- **Personal Day/Month** — daily / monthly micro-cycles

Master numbers (11, 22, 33) carry amplified meaning.

For the 6-cat-10-Q output:

| Field | Use to answer |
|---|---|
| `numerology.lifePath` (1-9, 11, 22, 33) | Identity baseline |
| `numerology.destiny` | Name-derived purpose (may be blank without full legal name) |
| `numerology.personalYear2026` | THIS year's theme (1-9 cycle) |
| `numerology.personalMonth` (when available) | Monthly micro-cycle |
| `months[]` | Calendar months for windowing |

## Life Path 1-9 (+ master) — 1-line themes

| LP | Theme |
|---|---|
| 1 | Pioneer · stand alone · originate |
| 2 | Diplomat · partner · bridge |
| 3 | Communicator · joy · creative expression |
| 4 | Builder · system · long-term structure |
| 5 | Freedom · change · sensory experience |
| 6 | Caregiver · home · responsibility |
| 7 | Seeker · deep thinker · solitude |
| 8 | Authority · material power · cycles of gain-loss |
| 9 | Humanitarian · completion · release |
| 11 | Inspired teacher · high-frequency channel |
| 22 | Master builder · grand-scale structure |
| 33 | Master teacher · selfless service |

## Personal Year 1-9 cycle (load-bearing for THIS reading)

The personal year is **the primary timing lever** for numerology — it determines
the year's overall flavor, regardless of life path:

| PY | Year theme |
|---|---|
| 1 | New start, plant seeds, set direction |
| 2 | Patience, partnership, slow ripening |
| 3 | Creative output, social, joyful expression |
| 4 | Build foundation, hard work, structure |
| 5 | Change, freedom, expansive movement |
| 6 | Responsibility, family, caring work |
| 7 | Inner work, study, retreat, depth |
| 8 | Material reaping, authority, money cycles |
| 9 | Completion, release, full circle |

Use `numerology.personalYear2026` as the year-lens for every question.

## How Numerology answers each of the 10 universal questions

### `work_energy_direction`
Combine Life Path × Personal Year. PY 1 + LP 8 = "ขึ้น" with bold initiation.
PY 7 + LP 4 = "นิ่ง" with depth-building.

### `work_boldest_move_window`
Use personal months: PM 1 (within the year) = best for launching. PM 5 = best
for radical pivots. Identify the calendar month corresponding to PM 1 or PM 5.

### `money_flow_direction`
PY 8 = strongly cash-flow-positive year. PY 4 = build/reinvest. PY 9 = release.
PY 1/3/5 = uneven. PY 7 = quiet (income redirects to learning).

### `money_leak_or_windfall`
PM 8 within the year = windfall window. PM 9 = release (could be tax/family obligation = a "leak" with purpose). Specific months.

### `love_energy_state`
PY 2 / 6 = relationship-focused years. PY 7 = inward. PY 1 / 5 = independent.
Adjust per `context.relationship_status`.

### `love_timing_windows`
PM 2 / 6 within the year = relationship months. PM 9 = closure month.

### `health_weak_point`
LP 4 / 8 → joint/bone stress (overwork). LP 3 / 5 → throat/nervous-system.
LP 7 / 9 → digestion/emotional held in body. PY 9 = body releasing what year
held.

### `people_who_changes_you`
Use Destiny number if available. The person who matches your destiny's
complement: e.g. Destiny 1 attracts Destiny 2; Destiny 7 attracts Destiny 8.

### `warning_high_risk_window`
PY 9 (full year) is "release with grace" — risk of forced loss if resisted.
PM 5 within any PY = volatile month.

### `warning_specific`
Map by PY:
- PY 1 → don't try to please everyone; you'll lose direction
- PY 4 → don't take shortcuts; the foundation will crack
- PY 8 → watch for power-overreach; humility matters in money year
- PY 9 → don't start big new commitments late in the year

---

## Pricing & access · Cost & timing
Same as base.

## Risks

Numerology requires accurate birth date for Life Path + Personal Year. Name
spelling matters for Destiny (legal vs preferred). Flag if engine reports
`numerology.name_uncertain`.
