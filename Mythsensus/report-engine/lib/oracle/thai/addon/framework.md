# Thai 7-Number (เลข ๗ ตัว) Add-on — Framework knowledge

> Version: 2.0 (locked 2026-06-09)
> Universal voice + 6-cat × 10-Q schema lives at `_shared/system-prompt-base.md`

---

## What Thai 7-Number measures

เลข ๗ ตัว ๙ ฐาน is a Thai-Brahmin numerology (~600+ yrs in Thai literature)
derived from Vedic graha calculations adapted to Thai cultural context.
From birth date + time, 7 number-graha are placed across 9 "fields" (ฐาน)
each governing a life domain: ตน (self), ทรัพย์ (wealth), กดุมพะ (family/labor),
สุข (joy/home), อายุ (life-force), เดช (power/authority), ศุภะ (luck/karma),
มนตรี (helper/protector), กาลกิณี (obstacle/curse).

| Field | Use to answer |
|---|---|
| `thai.lordOfDay` / `thaiBrahmin.dayLord` | The day-graha — colors the whole reading |
| `thai.fields.work` / `thai.gnan` (ฐาน work) | Career-related graha position |
| `thai.fields.wealth` | ทรัพย์ field — money matters |
| `thai.fields.love` | สุข or related — relationships |
| `thai.fields.kalakini` (กาลกิณี) | The single most-load-bearing warning field |
| `months[]` | Calendar months |

## The 7 grahas in Thai context

| # | Graha | Thai name | 1-line nature |
|---|---|---|---|
| 1 | Sun | อาทิตย์ | Visibility, kingship, vitality |
| 2 | Moon | จันทร์ | Emotion, mother, public mood |
| 3 | Mars | อังคาร | Action, conflict, courage |
| 4 | Mercury | พุธ | Speech, learning, trade |
| 5 | Jupiter | พฤหัสบดี | Wisdom, expansion, religion |
| 6 | Venus | ศุกร์ | Love, beauty, comfort |
| 7 | Saturn | เสาร์ | Discipline, delay, hard lesson |

(Rahu and Ketu sometimes appear as 8 and 0 in extended systems.)

## How Thai 7-Number answers the 10 universal questions

- **work_energy_direction** — The graha sitting in ตน + เดช tells visibility. Sun/Mars dominant → "ขึ้น"; Saturn → "นิ่ง/ลด"; Mercury → "แปลงร่าง".
- **work_boldest_move_window** — The graha in เดช activates on its weekday in months that match. Recommend the calendar month + day.
- **money_flow_direction** — ทรัพย์ field graha tells the story. Jupiter/Venus = inflow; Saturn/Rahu = managed outflow.
- **money_leak_or_windfall** — กาลกิณี field is the leak source. Identify and cite which life zone it touches.
- **love_energy_state** — Venus + Moon placements. Adjust per relationship_status.
- **love_timing_windows** — Venus-day + Moon-day months in 2026.
- **health_weak_point** — Each graha rules body parts (Sun=heart, Moon=stomach, Mars=blood/muscle, Mercury=nerves/skin, Jupiter=liver, Venus=reproductive/kidney, Saturn=bone/teeth).
- **people_who_changes_you** — Use มนตรี field graha — describe the type of helper that comes.
- **warning_high_risk_window** — กาลกิณี's weekday + its associated month → high-risk window.
- **warning_specific** — กาลกิณี graha → specific avoidance: e.g. Saturn กาลกิณี → "อย่าค้ำประกัน, อย่ารอเงินคืน"; Rahu → "อย่าตัดสินใจเร็วกับคนที่เพิ่งรู้จัก".

## Pricing & cost
Same as base. Risks: Thai 7-Number depends on accurate weekday of birth, which is deterministic from date. Flag if `thai.dayLord_uncertain`.
