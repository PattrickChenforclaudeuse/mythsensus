# Generic Oracle Framework — fallback for systems without dedicated framework.md

> Version: 1.0 (locked 2026-06-09)
> Used when `<system>/addon/framework.md` does not yet exist.
> When the LLM is given this fallback, it relies on the chart sub-tree
> as-is and the universal question set from `_shared/system-prompt-base.md`.

---

## What this fallback is for

Some of the 26 Mythsensus systems do not yet have a dedicated framework
written — they ship with this generic guide instead. The reading will be
LESS system-specific but will still:
- Pass schema validation (6 categories × 10 questions)
- Cite engine fields from the `chart` payload
- Follow the Modern Mystic Coach voice rules

## Universal field-to-question routing

The `chart` payload always contains a system-specific sub-tree. Inspect
top-level keys to find what's available, then cite them in `engine_refs`.

For ANY system, these question hints apply:

### `work_energy_direction` (การงาน · pattern)
Look for fields about strength/affinity/dominant trait. If the system has
"element" or "type" or "polarity", use it to argue the energy direction.

### `work_boldest_move_window` (การงาน · timing)
Use the `months[]` array. Identify the month(s) where the system's marker
shifts state (transit, retrograde end, ruling-planet change). Highlight
1-2 months as peak.

### `money_flow_direction` (การเงิน · pattern)
Look for "wealth", "lucky", "abundance", "accumulation" fields. If absent,
infer from element/polarity balance.

### `money_leak_or_windfall` (การเงิน · pattern + timing)
Look for warnings, shadows, or imbalance signals. Cross with `months[]`
for windfall timing.

### `love_energy_state` (ความรัก · pattern)
Look for "love", "relationship", "partner", "moon", "venus" fields.
When `context.relationship_status` is provided, adjust emphasis per
the base prompt's section 6.

### `love_timing_windows` (ความรัก · timing)
Use `months[]`. Map at least 2 windows: one opening, one decision.

### `health_weak_point` (สุขภาพ · pattern + timing)
Look for "weak", "shadow", "deficient", "missing" fields. Map to body
system if the system has a body-mapping (e.g. Vedic ayurveda doshas,
BaZi elements → organs, Tibetan rlung/tripa/peken). Otherwise stay
general but specific to which months.

### `people_who_changes_you` (ครอบครัว/คนใกล้ตัว · pattern)
Look for "mentor", "ally", "shadow", "partner-type" signals. Describe
the FUNCTION the chart predicts, not a generic "important person".

### `warning_high_risk_window` (สิ่งที่ต้องระวัง · timing)
Use `months[]`. Map 1-2 months as caution, anchored to a specific signal.

### `warning_specific` (สิ่งที่ต้องระวัง · pattern)
Look for "shadow", "warning", "challenge", "karma" fields. Be specific
about WHAT to avoid (people / contracts / decisions / objects).

## Pricing & access

- One-off: $9 per ศาสตร์ per chart input
- Subscriber: 2 free / month · $4 per additional
- Cache key: (chart_hash, system, lang, relationship_status, prompt_version)
  — invalidates automatically on framework change

## Cost & timing

- Sonnet 4.6 · max output 4000 tokens
- Target: 1500-3500 words · $0.08-0.15
- Hard timeout: 25s

## Risk note

⚠ This fallback framework is intentionally generic. The reading WILL pass
schema validation, but answers will be less system-specific than a dedicated
framework. Surface this as a soft note in the closing of one section if the
LLM cannot find strong engine signals.

System-specific framework.md files (`vedic`, `western`, `ninestar`, ...) take
precedence when present and should be written ASAP for systems with high
chart-data richness.
