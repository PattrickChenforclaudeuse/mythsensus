-- ============================================================
--  Mythsensus migration 003 — Oracle addon reading cache
--  Project: woamqrhifuxsscnihqco (woam)
--  Apply via: Supabase dashboard SQL editor
--           https://supabase.com/dashboard/project/woamqrhifuxsscnihqco/sql/new
--  Locked: 2026-06-09
-- ============================================================
--
--  Purpose:
--    Cache the oracle-mode deep reading (6 categories × 10 questions)
--    that /api/oracle/addon generates from Sonnet 4.6.
--
--    Key = (chart_hash, system, lang, relationship_status, prompt_version).
--    A cache HIT returns instantly with cost_cents = 0.
--    Cache invalidates automatically when prompt_version changes
--    (server hashes the system-prompt + framework + schema version).
--
--  Access:
--    service_role ONLY. The Vercel function uses Management API
--    (PAT) which is superuser-equivalent — the GRANTs below are
--    for future Data API clients (per 2026-10-30 grant rule).
--
--  No RLS policy for anon/authenticated — table is private to the
--  oracle pipeline.

CREATE TABLE IF NOT EXISTS public.myth_addon_reading (
  -- Cache key (composite PK)
  chart_hash           text        NOT NULL,
  system               text        NOT NULL,
  lang                 text        NOT NULL,
  relationship_status  text        NOT NULL DEFAULT 'unknown',
  prompt_version       text        NOT NULL,

  -- Payload
  oracle_json          jsonb       NOT NULL,

  -- Telemetry
  generated_at_iso     timestamptz NOT NULL DEFAULT NOW(),
  cost_cents           integer     NOT NULL DEFAULT 0,
  model                text        NOT NULL,

  PRIMARY KEY (chart_hash, system, lang, relationship_status, prompt_version)
);

-- Index for daily budget / per-user rate queries
CREATE INDEX IF NOT EXISTS idx_addon_reading_generated_at
  ON public.myth_addon_reading (generated_at_iso DESC);
CREATE INDEX IF NOT EXISTS idx_addon_reading_chart_hash_generated
  ON public.myth_addon_reading (chart_hash, generated_at_iso DESC);

-- Grants — service_role only (Vercel pipeline + future server-side reads)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.myth_addon_reading TO service_role;

-- RLS enabled, no public policies — server-side only.
ALTER TABLE public.myth_addon_reading ENABLE ROW LEVEL SECURITY;

-- Validation comment for the row shape
COMMENT ON TABLE public.myth_addon_reading IS
  'Mythsensus oracle-mode deep reading cache. Key = (chart_hash, system, lang, relationship_status, prompt_version). prompt_version is sha256[16] of base prompt + framework + schema version — cache auto-invalidates on prompt change. service_role only.';
COMMENT ON COLUMN public.myth_addon_reading.oracle_json IS
  'OracleAddonOutput per _shared/schema.ts — 6 sections, 10 answers total, validated server-side.';

-- ────────────────────────────────────────────────────────────
-- Optional housekeeping query (run manually to inspect daily spend)
-- ────────────────────────────────────────────────────────────
-- SELECT
--   DATE_TRUNC('day', generated_at_iso) AS day,
--   COUNT(*) AS renders,
--   SUM(cost_cents) / 100.0 AS dollars_spent,
--   COUNT(DISTINCT chart_hash) AS unique_charts
-- FROM public.myth_addon_reading
-- GROUP BY day
-- ORDER BY day DESC
-- LIMIT 14;
