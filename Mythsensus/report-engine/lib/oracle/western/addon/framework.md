# Western Astrology Add-on — Framework knowledge

> Version: 2.0 (locked 2026-06-09)
> Universal voice + 6-cat × 10-Q schema lives at `_shared/system-prompt-base.md`

---

## What Western Astrology measures

Western (tropical) astrology has Greek-Hellenistic roots (~2,500 yrs), refined
through the Renaissance and modern psychological astrology. Tropical zodiac
anchored to the seasons via the spring equinox (0° Aries = March 20-21).
It reads:
- **Sun sign** (your conscious identity)
- **Moon sign** (emotional rhythm)
- **Ascendant** (Asc / Rising — how you arrive in a room)
- **Planet positions** + **major aspects** (conjunction, opposition, trine, square, sextile)
- **Houses** (12 life-area divisions, anchored to Asc)
- **Transits** (current sky → your natal chart) — the timing engine

For the 6-cat-10-Q output:

| Field | Use to answer |
|---|---|
| `western.sunSign` / `sunSignTh` | Identity baseline |
| `western.moonSign` / `moonSignTh` | Emotional rhythm |
| `western.ascSign` / `ascSignTh` | Outer presentation, first-impression vehicle |
| `western.jupiterSign` | Year's expansion theme — bigger picture |
| `western.saturnSign` | Year's discipline theme — what to ripen |
| `western.transitNote2026` | 1-line synthesis the engine pre-computed |
| `months[]` | Calendar months for transit-window cites |
| `context.relationship_status` | Adjusts love-category emphasis |

## Sign → element + modality (always cite both for nuance)

| Sign | Element | Modality | 1-line theme |
|---|---|---|---|
| ♈ Aries (เมษ) | Fire | Cardinal | initiate, fight for self |
| ♉ Taurus (พฤษภ) | Earth | Fixed | embody, savor, hold |
| ♊ Gemini (มิถุน) | Air | Mutable | connect, switch, narrate |
| ♋ Cancer (กรกฎ) | Water | Cardinal | tend, protect, gather |
| ♌ Leo (สิงห์) | Fire | Fixed | radiate, claim, perform |
| ♍ Virgo (กันย์) | Earth | Mutable | refine, serve, perfect |
| ♎ Libra (ตุล) | Air | Cardinal | balance, partner, beauty |
| ♏ Scorpio (พิจิก) | Water | Fixed | transmute, depth, secrets |
| ♐ Sagittarius (ธนู) | Fire | Mutable | seek, expand, philosophy |
| ♑ Capricorn (มกร) | Earth | Cardinal | build, rule, mastery |
| ♒ Aquarius (กุมภ์) | Air | Fixed | innovate, community, future |
| ♓ Pisces (มีน) | Water | Mutable | dissolve, dream, compassion |

## Jupiter & Saturn in 2026 (the year's chapter markers)

Jupiter and Saturn are the slowest "visible" planets — their sign ingress
defines a year's mood. Use `western.jupiterSign` + `saturnSign` as the year-pillar
equivalent. Example synthesis: "Jupiter in Cancer + Saturn in Pisces = a year
where security + dissolution dance — guard your home (Cancer) while letting
old identities fade (Pisces 12th house)."

## How Western answers each of the 10 universal questions

### `work_energy_direction`
Anchor: Sun sign + 10th-house lord (career) + current Saturn transit angle to
natal Sun. Saturn squaring natal Sun = "ลด/แปลงร่าง". Jupiter trine natal Sun
= "ขึ้น". Cite the specific transit.

### `work_boldest_move_window`
Find month(s) where Mars transit aspects natal Sun or 10th-house cusp
favorably. Highlight 1-2 peak months from `months[]`.

### `money_flow_direction`
Anchor: 2nd house ruler + Jupiter transit to 2nd or 8th. Jupiter on 2nd = inflow.
Saturn on 8th = managed outflow. Cite both halves.

### `money_leak_or_windfall`
Look for Uranus transits (unexpected) + Pluto (deep transformations) to natal
money houses. Cite the month.

### `love_energy_state`
Venus sign + 7th-house lord. Cite `context.relationship_status` for emphasis.
Venus retrograde this year (if applicable) = transformative.

### `love_timing_windows`
Use Venus monthly transit + monthly Moon-to-Venus aspects. Map 2-3 windows.

### `health_weak_point`
Each Sun sign rules a body system (Aries-head, Taurus-throat, Gemini-lungs,
Cancer-stomach, Leo-heart, Virgo-intestine, Libra-kidney, Scorpio-reproductive,
Sagittarius-thigh, Capricorn-bone/knee, Aquarius-circulation, Pisces-foot).
Cross with Saturn transit to that body's sign for "ช่วงไหนต้องดูแลพิเศษ".

### `people_who_changes_you`
Anchor: Lunar node (Rāhu/Ketu — Dragon's Head/Tail) transits to natal Sun, Moon,
or Asc. Or major eclipse points this year. Describe the FUNCTION.

### `warning_high_risk_window`
Find months with Mars conjunct/square natal Saturn OR Pluto exact transit.
Saturn return windows (age 29 / 58 / 87) are also caution years.

### `warning_specific`
Map by transit type:
- Saturn 12th → "อย่ารับงานลับๆ · backstage drama"
- Pluto square Sun → "อย่าฝืน power-play · ปล่อยที่ไม่ใช่ของคุณ"
- Mars opposing Mercury → "อย่าเซ็นในขณะอารมณ์ร้อน"

---

## Pricing & access · Cost & timing
Same as base — $9 one-off, $0.08-0.15 per render, 25s timeout.

## Risks specific to Western v1

Western tropical zodiac is computationally well-established — no significant
v1/v2 boundary concerns. House cusps depend on the Placidus/Whole-Sign choice
(engine uses Whole-Sign by default). Birth-time-sensitive fields (Asc, MC,
houses) require accurate `time` input; flag if `western.asc_time_uncertain`.
