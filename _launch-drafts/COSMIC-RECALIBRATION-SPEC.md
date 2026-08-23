# Cosmic Score Recalibration — implementation spec (2026-07-01)

Ready-to-apply spec. calc.ts is now UNLOCKED (strengthTh fix committed). This is an
ATOMIC change: engine + tiers + copy + regenerated scores + rebuilt bundles + smoke
test all in ONE PR. Approved direction (Director "ลุย"): the AGREEMENT model, which
restores the original public promise ("when systems agree, score is high").

## The 3-lens model (final)
| Lens | Was | Becomes | Formula |
|---|---|---|---|
| **Cosmic Score** | median (central tendency — meaningless, corr≈0 with consensus) | **AGREEMENT** | percentile-normalize the INVERSE dispersion (MAD) of the 25 voting systems → 300–999. Low spread (systems cluster) = high; wide spread = low. |
| **Soul Frequency** | = total (redundant alias) | **central archetype level** | percentile-normalize the MEDIAN of the 25 systems → 300–999. Now a genuinely distinct 2nd axis. |
| **Path Resonance** | separate life/career-fit metric | unchanged | keep as-is, independent lens. |

Two axes = "what you are (Soul Freq) × how clearly the cosmos agrees (Cosmic Score)".

## Engine change (calc.ts `calcScore`, ~line 3527–3541)
Replace `total = Math.min(999, Math.max(400, median))` block with:
```ts
// votingScores = the 25 scoring:true system scores (existing)
const mad = _mad(votingScores);                 // median abs deviation (dispersion)
const median = _median(votingScores);           // existing central value
// frozen reference CDFs (baked constants, computed once — see COSMIC_CDF below)
const cosmicPct = 1 - _pctInCdf(COSMIC_CDF, mad);   // low spread => high agreement
const soulPct   = _pctInCdf(SOUL_CDF, median);
const total        = _bucket(300 + 699 * cosmicPct);   // Cosmic Score = AGREEMENT
const soulFrequency = _bucket(300 + 699 * soulPct);     // distinct 2nd metric
// _bucket(s)= Math.round(s/10)*10 ; _pctInCdf = interpolated percentile in the 101-pt quantile array
```
- Set `soulFrequency: soulFrequency` in the return (no longer `= total`).
- `maxAchievable` / star/mid/warn counts: recompute against the new `total` semantics (or keep as breakdown-derived; verify).
- **DO NOT** change any per-system `.score` or `.weight` (weights stay display-only; that's fine).

## Frozen CDFs
Bake `_launch-drafts/cosmic-cdf-v2-agreement.json` into the engine as a versioned const
(`COSMIC_CDF` = MAD quantiles[101], `SOUL_CDF` = median quantiles[101], `version:'cdf_v2_agreement'`,
tag with an engine-hash). Committed + immutable — NO auto-refit (drift guard). Regenerate only
on a deliberate v-bump. (Reference sample used: 20k fully-random charts.)

## TIERS (rewrite ~calc.ts:3378 → constants) — Set B, percentile cuts
| Tier (TH · EN) | percentile ≥ | Cosmic min (approx) |
|---|---|---|
| อรุณ · Dawn | 0% | 300 |
| แสวง · Seeking | 10% | 370 |
| ปฐพี · Earth | 25% | 470 |
| **ดุลย์ · Balance** (median) | 50% | 650 |
| ประกาย · Glimmer | 70% | 790 |
| รัศมี · Radiance | 85% | 890 |
| ทิพย์ · Divine | 97% | 980 |
Cut by PERCENTILE of the frozen CDF (not raw numbers) → "Top X%" labels become TRUE for the first time.
Low tiers framed positive ("ดวงหลายมิติ / I contain multitudes"), never "bad luck".

## Verified numbers (offline, mean-input prototype → use MAD build)
Distribution spreads 300–1000 (p5≈330, p50≈670, p95≈960). Two lenses genuinely independent, e.g.
Marie Curie Cosmic 930 / SoulFreq 380 ; Katherine Johnson Cosmic 320 / SoulFreq 990.

## Copy updates (same PR)
- cosmic-score/index.html + how-it-works: DROP "weighted median" (weights are dead + median≠consensus).
  Replace with the agreement explanation. The "when systems agree → high" line ALREADY on the page
  becomes literally true — lean into it.
- Add the honest inline framing near the score: "วัดว่า 26 ศาสตร์เห็นตรงกันแค่ไหน — ไม่ใช่ดวงดี/ร้าย"
  + low-tier positive copy. Keep the legal disclaimer.

## Regenerate ALL displayed scores (same PR — else online/offline/marketing mismatch)
sample-report/sunthorn-phu (43-page), blog cosmic-score-3-icons + icons-vol2 (recompute the 6 figures),
the 8-figure entry rotation, llms.txt ("score 730-760" line), any hardcoded score in copy.

## Build + ship
1. `npm run build:engine` → tsc → `build/ms26-bundle.js` (+ Mythsensus/build). index.html loads it as EXTERNAL script (per ms26 pipeline memory).
2. Offline app = NOT maintained (Director) — skip unless shipping a downloadable build.
3. Bump `sw.js` CACHE + `?v=` on the bundle so clients evict.
4. Deploy via throwaway-worktree (prod = CLI-only; avoid shipping other sessions' uncommitted work).

## Smoke test (add)
Assert: over N random charts, tier populations ≈ the percentile bands (Dawn~10%, …, Divine~3%) —
catches any silent re-collapse.

## ⚠️ Quality dependency (Director's point — important)
The 26 systems use INCOMPATIBLE time/element bases (BaZi 五行+jiéqì, Vedic sidereal+tattva, Western
4-element+tropical, Mayan Tzolk'in, Thai lunar+ทักษา…). Agreement is only trustworthy if each system
computes its OWN time/elements correctly. Known approximations that inject input noise (from the
calibration page): **BaZi jiéqì is month-boundary approximate; Vedic ayanamsa fixed at 24° (drifts).**
Garbage-in → agreement noise. For agreement to be the product's core, per-system time/element accuracy
should be on the roadmap (not just normalization).

## Stability = a FEATURE, not a bug (Director confirmed)
Sensitivity to birth time (even to the minute) is CORRECT astrological fidelity (ascendant moves ~1°/4min;
each system shifts its own basis at its own cadence). Require/emphasise accurate birth time. The only thing
to guard: don't let percentile-mapping AMPLIFY noise beyond the real astrological signal near the dense
middle (bucket-10 helps; widen middle band or coarser bucket if a 1-min change over-jumps tiers).
