# Mythsensus Oracle Deep Reading — Deploy & Verify Guide

> Locked & built 2026-06-09. Director action items to ship to production.
> Spec details: `Mythsensus/report-engine/lib/oracle/_shared/{schema.ts, system-prompt-base.md}`

---

## What was built (8 of 9 tasks complete)

| # | Status | Component |
|---|---|---|
| 1 | ✅ | Shared schema (`_shared/schema.ts`) + system-prompt base (`_shared/system-prompt-base.md`) |
| 2 | ✅ | Old BaZi v0.2 spec archived to `_archive/bazi-addon-v01/` |
| 3 | ✅ | Vercel function `api/oracle/addon.js` (cache + cost guard + validation) |
| 4 | ✅ | Migration `migrations/003_addon_reading.sql` (needs apply to woam) |
| 5 | ✅ | `relationship_status` field on Profile · saved as `mth_relationship_status` |
| 6 | ✅ | Frontend mode toggle (🛠 Engineer ⇄ ✦ Oracle) in `renderDeepReadings` + `_showDeep` |
| 7 | ✅ | `_oracleBuildMonths()` — 12-month BaZi pillar + calendar timeline helper |
| 8 | ✅ | 26/26 framework.md files (per-system knowledge for the LLM) |
| 9 | ⏳ | End-to-end verify (requires deploy + migration + env vars) |

---

## Director action items (do these in order)

### 1. Apply Supabase migration to woam

```
File: migrations/003_addon_reading.sql
URL:  https://supabase.com/dashboard/project/woamqrhifuxsscnihqco/sql/new
```

Paste the SQL into the editor → Run. Creates `public.myth_addon_reading` cache table with proper grants + indexes.

Verify:
```sql
SELECT count(*) FROM public.myth_addon_reading;
-- Should return 0 (table exists, no rows yet)
```

### 2. Set Vercel env vars

Vercel dashboard → mythsensus project → Settings → Environment Variables. Add:

| Variable | Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | (your Anthropic key) | The Vercel function calls Sonnet 4.6 via this |
| `SUPABASE_MGMT_TOKEN` | (Personal Access Token with woam scope) | Server-side cache read/write via Management API |
| `ORACLE_DAILY_BUDGET_CENTS` | `3000` (default, $30/day) | Soft cap on total daily render cost |
| `ORACLE_USER_DAILY_RENDERS` | `10` (default) | Per-chart-hash daily render cap |

⚠ The `SUPABASE_MGMT_TOKEN` is the same pattern as Yoohui's `SB_MGMT_TOKEN` but scoped to woam — generate fresh at https://supabase.com/dashboard/account/tokens (your account, NOT the project) with woam selected. Do NOT reuse the Yoohui-only PAT (it doesn't have woam scope).

### 3. Deploy

```bash
cd "D:\Claude works here\Mythsensus"
npm run deploy
```

This runs `git push origin main && vercel --yes --prod`.

### 4. End-to-end verify on mythsensus.com

1. Sign in or use `?dev=1` for owner mode
2. Set Profile → Me with DOB + relationship status
3. Go to Add-ons → 26 ศาสตร์ (Deep Readings)
4. Click any unlocked system (e.g. BaZi)
5. Click the **✦ Oracle BETA** mode pill
6. **Expected:**
   - Loading skeleton appears
   - After 10-25s: 6 category sections render with 10 question cards
   - Each answer has headline (bold italic gold) + body + tag color
   - 2nd click on same system = instant (cache hit)
7. Switch to a different system, repeat — confirms the dispatcher works
8. Switch language to EN, click Oracle again — separate cache entry, new render
9. Try with `relationship_status = single` then change to `married` — Oracle re-fetches with different emphasis on love questions

### 5. Daily cost check (after first 24h of usage)

Run this query in the woam SQL editor to see spend:

```sql
SELECT
  DATE_TRUNC('day', generated_at_iso) AS day,
  COUNT(*) AS renders,
  SUM(cost_cents) / 100.0 AS dollars_spent,
  COUNT(DISTINCT chart_hash) AS unique_charts
FROM public.myth_addon_reading
GROUP BY day
ORDER BY day DESC
LIMIT 14;
```

If `dollars_spent` exceeds your comfort level, raise `ORACLE_DAILY_BUDGET_CENTS` or LOWER it via Vercel env vars.

---

## Architecture summary (for next session reference)

```
User clicks ✦ Oracle pill in deep reading panel
         │
         ▼
Frontend _fetchOracle('bazi')
   builds {chart, months[12], context: {relationship_status, ...}}
         │
         ▼
POST /api/oracle/addon  (Vercel function)
         │
         ├─→ Cache hit? (cache key: chart_hash + system + lang + rel_status + prompt_version)
         │        │
         │        └─→ Return cached oracle_json (cost=0)
         │
         ├─→ Cost guard check (daily $30 cap + per-user 10/day)
         │
         ├─→ Build system prompt = _shared/system-prompt-base.md
         │                       + <system>/addon/framework.md
         │
         ├─→ Anthropic Sonnet 4.6 call (max 4000 tokens, 25s timeout)
         │
         ├─→ Validate output (6 sections × 10 answers, tag distribution, word count)
         │
         ├─→ Cache in public.myth_addon_reading (woam)
         │
         └─→ Return OracleAddonResponse
         │
         ▼
Frontend _renderOracleOutput()
   renders 6 sections + 10 colored question cards
```

## Key files reference

| File | Purpose |
|---|---|
| `lib/oracle/_shared/schema.ts` | TypeScript types + validateOutput() |
| `lib/oracle/_shared/system-prompt-base.md` | Universal voice + 6×10 questions + hard rules |
| `lib/oracle/_shared/framework-generic.md` | Fallback for systems if specific framework missing |
| `lib/oracle/<system>/addon/framework.md` | Per-system knowledge × 26 |
| `api/oracle/addon.js` | Vercel function — cache + cost guard + Anthropic call |
| `migrations/003_addon_reading.sql` | Cache table DDL |
| `index.html` (`_fetchOracle`, `_renderOracleOutput`, `_setDeepMode`) | Frontend rendering |

## Rollback (if oracle output disappoints)

The engineer mode (existing static `c.<sys>.reading`) is untouched. If oracle quality is bad, users simply leave the toggle on engineer — no degradation. To disable oracle entirely:

1. Vercel env var: `ORACLE_DAILY_BUDGET_CENTS=0` → all oracle calls return 429
2. Or remove the toggle pill: in `_showDeep`, set `showModeToggle = false`
3. Or `git revert` the commit that adds this feature

The migration table can stay (no harm) or drop with `DROP TABLE public.myth_addon_reading`.

## Known caveats (flag at launch copy if needed)

1. **BaZi/Saju month-pillar accuracy ~95%** — DOBs within ±48h of a solar term may have wrong month references in answers. Engine v2 (precise jiéqì, shadow obs through 6-15) fixes this. Affected answers: `work_boldest_move_window`, `money_leak_or_windfall`, `love_timing_windows`, `warning_high_risk_window`.

2. **Render cost ~$0.08-0.15 per system per chart** — at $30/day budget, ~200-375 renders/day cap. Aggressive cache means same chart can re-view for free. Cache invalidates only when you edit framework.md or schema.

3. **Quality variance across 26 systems** — Top 6 (BaZi, Vedic, Western, NineStar, Numerology, HumanDesign) have rich framework.md with field-to-question mapping tables. Other 20 have lean frameworks (~50-80 lines each) — readings may feel less system-specific. Iterate by expanding individual framework.md files based on user feedback.

4. **Aboriginal / Ifá / Native American** — Cultural-respect note in framework.md. Educational synthesis, not ritual.

5. **Biorhythm** — Documented as "behavioral pattern observation tool, no scientific predictive backing." Frame accordingly in copy.
