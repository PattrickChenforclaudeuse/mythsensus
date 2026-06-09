# Nine Star Ki Add-on — Framework knowledge

> Version: 2.0 (locked 2026-06-09)
> Universal voice + 6-cat × 10-Q schema lives at `_shared/system-prompt-base.md`

---

## What Nine Star Ki measures

Nine Star Ki (九星気学 — *kyūsei kigaku*) is a Japanese/Korean adaptation of
Chinese Feng Shui's 9 Stars system (~1,200 yrs). Maps your birth year to one
of nine "stars" — each star = element + color + cardinal direction. Used for:
- **Yearly fortune** (which star is in which "palace" this year)
- **Compatibility** (your star vs another's)
- **Auspicious direction** (best direction to face for sleep, work, travel)

It's lighter than BaZi but very practical for direction-based decisions.

For the 6-cat-10-Q output:

| Field | Use to answer |
|---|---|
| `ninestar.star` (1-9) | Identity baseline |
| `ninestar.starName` / `starChinese` | Display + naming |
| `ninestar.starElement` (Water/Earth/Wood/Metal/Fire) | Element archetype |
| `ninestar.starColor` (e.g. White, Red, Black) | Vibrational palette |
| `ninestar.starDirection` | Auspicious primary direction for the year |
| `ninestar.directionSleep` | Best sleep direction (head pointing this way) |
| `ninestar.year2026Analysis` | Engine-pre-computed yearly snapshot |
| `ninestar.auspicious2026` | List of favored months/zones |
| `months[]` | Calendar months for windowing |

## The 9 Stars — at-a-glance

| # | Name (Chi) | Thai phonetic | Element | Color | Personality |
|---|---|---|---|---|---|
| 1 | 一白水星 (อิหฺเป๋ย์ฉุยซิง) | White Water | Water | White | Adaptable, deep, mysterious |
| 2 | 二黒土星 (เอ้อร์เฮ้ยทู่ซิง) | Black Earth | Earth | Black | Patient, supportive, grounded |
| 3 | 三碧木星 (ซานปี่มู่ซิง) | Jade Wood | Wood | Bright green | Energetic, expressive, youthful |
| 4 | 四緑木星 (ซื่อลวี่มู่ซิง) | Green Wood | Wood | Green | Diplomatic, communicative |
| 5 | 五黄土星 (อู่ฮวงทู่ซิง) | Yellow Earth | Earth | Yellow | Centered, magnetic, intense |
| 6 | 六白金星 (ลิ่วเป๋ย์จินซิง) | White Metal | Metal | White | Disciplined, leader, fair |
| 7 | 七赤金星 (ชีฉื่อจินซิง) | Red Metal | Metal | Red | Charismatic, playful, social |
| 8 | 八白土星 (ปาเป๋ย์ทู่ซิง) | White Earth | Earth | White | Tenacious, wealth-builder |
| 9 | 九紫火星 (จิ๋วจึ๋ฮั่วซิง) | Purple Fire | Fire | Purple | Brilliant, visible, transformative |

## Star × Year — yearly palace cycle

Each year, the 9 stars rotate through 9 "palaces" of the magic-square chart.
Your "house position" this year determines your year-arc:

- Palace 5 (center) — high stress / transformation year
- Palace 1 (north) — quiet reflection / new beginnings
- Palace 2/8 (NE/SW corners) — earth-stable consolidation
- Palace 3/4 (E/SE) — outward expansion
- Palace 6/7 (NW/W) — fruition + reaping
- Palace 9 (south) — visibility, public exposure

Use `ninestar.year2026Analysis` to know your 2026 palace.

## How NSK answers each of the 10 universal questions

### `work_energy_direction`
Anchor: your `star` × current palace position. Palace 5 = "transformation" (ขึ้น+ลง+แปลงร่าง simultaneously). Palace 9 = "rising visibility" (ขึ้น).

### `work_boldest_move_window`
Use `ninestar.auspicious2026` months + the auspicious direction. Recommend
moving in the favored direction during the favored month.

### `money_flow_direction`
Star 8 (White Earth) and 6 (White Metal) are traditionally wealth-builders.
For other stars, look at whether this year's palace activates wealth (palace 8).

### `money_leak_or_windfall`
Palace 5 = chaos, watch for leaks. Use the cautious direction (opposite of `starDirection`) as the "where leak comes from" metaphor.

### `love_energy_state`
Star compatibility chart: complementary elements (Wood-Water, Fire-Wood, Earth-Fire, Metal-Earth, Water-Metal). State the chemistry pattern.

### `love_timing_windows`
Months when your star sits in palace 4 (relationships) or 7 (joy).

### `health_weak_point`
Element → body system mapping:
- Wood → liver, eye, sinew
- Fire → heart, blood, small intestine
- Earth → spleen, stomach, mouth
- Metal → lung, skin, large intestine
- Water → kidney, ear, bone

### `people_who_changes_you`
NSK names the "ki" (energy) of who matches you. Describe the type by element:
e.g. a Fire star = mentor who pushes visibility; an Earth star = stable supporter.

### `warning_high_risk_window`
Months when your star is in palace 5 (center) or palace 7 with malefic
combinations. Use `ninestar.auspicious2026` inversely.

### `warning_specific`
Map by element + direction:
- Avoid your "obstacle direction" (opposite of `starDirection`) for new moves
- Star 5 year = avoid construction/big decisions
- Star in palace 7 = avoid arguments (palace 7 = mouth/conflict)

---

## Pricing & access · Cost & timing
Same as base.

## Risks specific to NSK

NSK is calendar-year based (lunar new year boundary). DOBs in January/early
February can shift by 1 star if you cross the calendar boundary. Engine uses
the approximate Feb 4 cutoff. Flag if `ninestar.year_boundary_uncertain`.
