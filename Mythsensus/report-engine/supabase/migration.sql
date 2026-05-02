-- ============================================================
--  MYTHSENSUS — Supabase Schema
--  Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--  Safe to run multiple times (CREATE TABLE IF NOT EXISTS)
-- ============================================================

-- ── EXTENSIONS ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── user_profiles ────────────────────────────────────────────────
-- One user can have multiple profiles (self, family, etc.)
CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name     TEXT,
  dob              DATE NOT NULL,
  birth_time       TIME,
  birth_place      TEXT NOT NULL,
  birth_lat        NUMERIC(9,6),
  birth_lon        NUMERIC(9,6),
  birth_tz         NUMERIC(4,1),
  birth_country    TEXT,
  work_country     TEXT,
  career_level     TEXT,
  domain           TEXT,
  industry         TEXT,
  gender           CHAR(1) DEFAULT 'M' CHECK (gender IN ('M','F','X')),
  -- Computed score fields (denormalized for fast reads)
  cosmic_score     INTEGER CHECK (cosmic_score BETWEEN 1 AND 1000),
  soul_freq        INTEGER,
  life_terrain     INTEGER,
  path_resonance   INTEGER,
  tier             TEXT,
  dm_element       TEXT,
  nsk_star         INTEGER CHECK (nsk_star BETWEEN 1 AND 9),
  life_path        INTEGER,
  systems_json     JSONB,  -- full 26-system ChartData
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- ── reports ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  report_uuid      TEXT UNIQUE NOT NULL,  -- public share token
  report_type      TEXT NOT NULL DEFAULT 'premium',
  html_content     TEXT,                  -- full report HTML
  pdf_url          TEXT,                  -- R2 storage URL (Sprint 3)
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ           -- NULL = permanent
);

CREATE INDEX IF NOT EXISTS reports_profile_id_idx  ON reports(profile_id);
CREATE INDEX IF NOT EXISTS reports_report_uuid_idx ON reports(report_uuid);

-- ── god_draws ────────────────────────────────────────────────────
-- QA-2: draw_overflow_flag = true means ??? event — NEVER label it otherwise
CREATE TABLE IF NOT EXISTS god_draws (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  god_id              TEXT NOT NULL,
  god_name            TEXT NOT NULL,
  tier                TEXT NOT NULL,
  blessing            TEXT NOT NULL DEFAULT '',
  origin              TEXT NOT NULL DEFAULT '',
  element             TEXT NOT NULL DEFAULT '',
  draw_date           DATE NOT NULL,
  draw_overflow_flag  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS god_draws_user_id_idx   ON god_draws(user_id);
CREATE INDEX IF NOT EXISTS god_draws_draw_date_idx ON god_draws(draw_date);
-- Enforce free tier: one draw per user per day
CREATE UNIQUE INDEX IF NOT EXISTS god_draws_one_per_day_idx ON god_draws(user_id, draw_date)
  WHERE draw_overflow_flag = FALSE;

-- ── subscriptions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  tier                     TEXT NOT NULL DEFAULT 'free',
  status                   TEXT NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','cancelled','past_due','trialing')),
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── organum_queries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organum_queries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  response    JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organum_queries_user_id_idx    ON organum_queries(user_id);
CREATE INDEX IF NOT EXISTS organum_queries_created_at_idx ON organum_queries(created_at);

-- ── RLS (Row Level Security) ──────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE god_draws        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE organum_queries  ENABLE ROW LEVEL SECURITY;

-- user_profiles: users can only see/edit their own profiles
-- (service role bypasses RLS for server-side operations)
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- reports: public read by UUID (no auth check), write by service role only
DROP POLICY IF EXISTS "reports_select_public" ON reports;
CREATE POLICY "reports_select_public" ON reports
  FOR SELECT USING (true);  -- UUID is the access control

-- god_draws: users see only their own
DROP POLICY IF EXISTS "god_draws_select_own" ON god_draws;
CREATE POLICY "god_draws_select_own" ON god_draws
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "god_draws_insert_own" ON god_draws;
CREATE POLICY "god_draws_insert_own" ON god_draws
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- subscriptions: users see only their own
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- organum_queries: users see only their own
DROP POLICY IF EXISTS "organum_queries_select_own" ON organum_queries;
CREATE POLICY "organum_queries_select_own" ON organum_queries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "organum_queries_insert_own" ON organum_queries;
CREATE POLICY "organum_queries_insert_own" ON organum_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── auto-update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Done ─────────────────────────────────────────────────────────
-- After running this migration:
-- 1. Enable Google OAuth in Supabase Dashboard → Authentication → Providers
-- 2. Add your site URL to Supabase → Authentication → URL Configuration
-- 3. Copy your SUPABASE_URL and keys to .env.local
