# Vedic Add-on — Framework knowledge

> Version: 2.0 (locked 2026-06-09)
> Universal voice + 6-cat × 10-Q schema lives at `_shared/system-prompt-base.md`
> This file = Vedic-specific knowledge appended to that base prompt.

---

## What Vedic Jyotish measures

Vedic Jyotish (वैदिक ज्योतिष — "the light of the Vedas") is a sidereal
astrology system from India (~3,000 yrs). Unlike Western tropical astrology,
it uses the **fixed zodiac** anchored to the actual constellations via the
*ayanāṃśa* correction (~23-24° offset from tropical). The system reads:
- **Lagna** (Ascendant / Rising sign — the rāśi rising at birth, the lens of life)
- **Moon Rāśi** (the sign Moon occupies sidereally — your emotional core)
- **Nakshatra** (the 27 lunar mansions, each ruled by a deva + planet)
- **Mahādaśā / Antardaśā** (the planetary period system — currently ruling planet × sub-ruler, often a decade-long arc)
- **Yogas** (specific planetary combinations that signal major life themes)

For the 6-cat-10-Q output, the load-bearing fields:

| Field | Use to answer |
|---|---|
| `vedic.lagna` (Lagna rāśi) | Identity baseline — body, presence, life-direction |
| `vedic.moonNakshatra` | Emotional pattern — what makes you feel safe / triggered |
| `vedic.nakshatraLord` | The planetary lord of your nakshatra — drives subconscious |
| `vedic.nakshathraPada` (note: field uses this spelling) | Pada 1-4 of the nakshatra — fine-grained tier |
| `vedic.mahadasha` + `mahadashaEnd` | Current 6-20yr life arc · cliffhanger when ending soon |
| `vedic.antardasha` | Current 1-3yr sub-period · short-term emphasis |
| `vedic.yogas[]` | Specific combinations (e.g. Gajakesari, Raja, Daridra) |
| `months[]` | 12 calendar months for windowing |
| `context.relationship_status` | Adjusts love-category emphasis only |

## Nakshatra → life themes (quick reference)

When the answer hinges on Nakshatra, cite both the nakshatra name AND its
deity/lord briefly. Don't translate every nakshatra to Thai — keep the
Sanskrit name in italics + Thai phonetic on first use.

| Nakshatra (1-27) | Lord | Theme keyword |
|---|---|---|
| Ashwini अश्विनी (อัศวินี) | Ketu | Speed, healing initiative |
| Bharani भरणी (ภรณี) | Venus | Endurance, sensual force |
| Krittika कृत्तिका (กฤตติกา) | Sun | Purifying fire |
| Rohini रोहिणी (โรหิณี) | Moon | Material abundance, sensuality |
| Mrigashira मृगशिरा (มฤคศิระ) | Mars | Seeking, restless |
| Ardra आर्द्रा (อาทรา) | Rahu | Storm, breakthrough through chaos |
| Punarvasu पुनर्वसु (ปุนรพสุ) | Jupiter | Return-to-good, restoration |
| Pushya पुष्या (ปุษยะ) | Saturn | Nourishment, slow growth |
| Ashlesha आश्लेषा (อาศเลษา) | Mercury | Embrace, also venom |
| Magha मघा (มฆา) | Ketu | Royal lineage, pride |
| Purva Phalguni पूर्वफाल्गुनी (ปูรวฺผัลคุนี) | Venus | Pleasure, creative joy |
| Uttara Phalguni उत्तरफाल्गुनी (อุตตรผัลคุนี) | Sun | Generous service |
| Hasta हस्त (หัสตะ) | Moon | Crafted with hand, skill |
| Chitra चित्रा (จิตรา) | Mars | Brilliance, artistic precision |
| Swati स्वाती (สวาตี) | Rahu | Independence, wind-like |
| Vishakha विशाखा (วิศาขา) | Jupiter | Focused ambition |
| Anuradha अनुराधा (อนุราธา) | Saturn | Friendship, devotion |
| Jyeshtha ज्येष्ठा (เชษฐา) | Mercury | Eldest, responsibility |
| Mula मूल (มูละ) | Ketu | Root, destruction → renewal |
| Purva Ashadha पूर्वाषाढ़ा (ปูรวาษาฒา) | Venus | Invincibility, conviction |
| Uttara Ashadha उत्तराषाढ़ा (อุตตราษาฒา) | Sun | Lasting victory |
| Shravana श्रवण (ศรวณะ) | Moon | Listening, wisdom from elders |
| Dhanishta धनिष्ठा (ธนิษฐา) | Mars | Rhythm, abundance from action |
| Shatabhisha शतभिषा (ศตภิษา) | Rahu | Healer of secrets |
| Purva Bhadrapada पूर्वभाद्रपदा (ปูรวภัทรปทา) | Jupiter | Cosmic intensity |
| Uttara Bhadrapada उत्तरभाद्रपदा (อุตตรภัทรปทา) | Saturn | Depth, profound restraint |
| Revati रेवती (เรวตี) | Mercury | Completion, gentle ending |

## Mahādaśā lord → 1-line lens

The current `vedic.mahadasha` lord colors the entire reading. Hint:

- **Sun (Ravi)** — visibility, ego refinement, leadership exposure
- **Moon (Chandra)** — emotional fluctuation, intuition surfacing
- **Mars (Mangala)** — drive, conflict, courageous action
- **Rahu** — desire, foreign / unconventional paths, illusion
- **Jupiter (Guru)** — expansion, teaching, lawful wealth
- **Saturn (Shani)** — discipline, slow ripening, karma collection
- **Mercury (Budha)** — communication, business, learning
- **Ketu** — detachment, mystical insight, dissolution
- **Venus (Shukra)** — pleasure, relationships, artistic flowering

## How Vedic answers each of the 10 universal questions

### `work_energy_direction`
Anchor: current `mahadasha` lord + lagna sign. E.g. Saturn mahā during a
Cancer lagna year — work feels structural-pressure-rising. Jupiter mahā with
strong dispositor — expansion.

### `work_boldest_move_window`
Find the month(s) where Saturn or Jupiter aspects the lagna favorably OR
where the antardasha rotates to a benefic. Cite the `months[]` window.

### `money_flow_direction`
Anchor: 2nd house (wealth) + 11th house (gains) significators. If the
yogas list includes Dhana-yoga or Lakshmi-yoga → inflow > outflow.
If the chart shows Daridra-yoga → outflow.

### `money_leak_or_windfall`
Rāhu/Ketu transit through 2nd or 11th house signals leak (through illusion
or detachment). Specific months when the windfall transit-yoga forms.

### `love_energy_state`
Anchor: Venus position + 7th house lord. Adjust emphasis per
`context.relationship_status`.

### `love_timing_windows`
Use Venus mahādaśā/antardaśā windows AND Venus monthly transit. Map
2-3 months as เริ่ม/พัฒนา/ตัดสินใจ/ปล่อย.

### `health_weak_point`
Map nakshatra dosha tendency (vata/pitta/kapha balance). Cite the nakshatra's
elemental quality. Specify which month the doṣa-imbalance sharpens.

### `people_who_changes_you`
Anchor: 4th house (mother), 9th house (father/mentor), 7th house (partner),
3rd house (siblings). The strongest house lord this year = the person.

### `warning_high_risk_window`
Find months with Saturn or Rāhu transit to 8th house (transformation) or
12th house (loss). Or sade-sati window if applicable.

### `warning_specific`
Map by the malefic transit type:
- Saturn 8th → "ค้ำประกัน · งานที่กินเวลายาว"
- Rāhu 12th → "ของหายไกล · ออนไลน์ scam"
- Mars 7th → "ทะเลาะกับคู่ค้า"

---

## Pricing & access

- One-off: $9 per ศาสตร์ per chart input
- Subscriber: 2 free ศาสตร์ / เดือน · $4 per additional
- Cache key: (chart_hash, system, lang, relationship_status, prompt_version)

## Cost & timing

- Sonnet 4.6 · max output 4000 tokens
- Target: 1500-3500 words · $0.08-0.15
- Hard timeout: 25s

## Risks specific to Vedic v1

⚠ **Ayanāṃśa**: v1 uses linear Lahiri ~23.85°. Engine v2 will use IAU 2006 P03
precession (shadow obs through 2026-06-15). For modern DOBs (1950+) the
difference is sub-arcminute and doesn't shift nakshatra. Pre-1900 DOBs may
shift by 1 nakshatra at the boundary — flag if `vedic.nakshatra_boundary_uncertain`.
