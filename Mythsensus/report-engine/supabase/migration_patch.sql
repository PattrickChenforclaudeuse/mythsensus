-- ============================================================
--  MYTHSENSUS — Patch Migration
--  รันอันนี้ถ้า migration.sql แรกมี error
--  Safe to run multiple times
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── user_profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name     TEXT,
  dob              DATE NOT NULL,
  birth_time       TIME,
  birth_place      TEXT NOT NULL DEFAULT '',
  birth_lat        NUMERIC(9,6),
  birth_lon        NUMERIC(9,6),
  birth_tz         NUMERIC(4,1),
  birth_country    TEXT,
  work_country     TEXT,
  career_level     TEXT,
  domain           TEXT,
  industry         TEXT,
  gender           CHAR(1) DEFAULT 'M',
  cosmic_score     INTEGER,
  soul_freq        INTEGER,
  life_terrain     INTEGER,
  path_resonance   INTEGER,
  tier             TEXT,
  dm_element       TEXT,
  nsk_star         INTEGER,
  life_path        INTEGER,
  systems_json     JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- เพิ่ม column ที่ขาดใน user_profiles (ถ้ามีอยู่แล้วแต่ schema เก่า)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_lat        NUMERIC(9,6);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_lon        NUMERIC(9,6);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_tz         NUMERIC(4,1);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_country    TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS work_country     TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS career_level     TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS domain           TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS industry         TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cosmic_score     INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS soul_freq        INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS life_terrain     INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS path_resonance   INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tier             TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS dm_element       TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nsk_star         INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS life_path        INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS systems_json     JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- ── reports ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  report_uuid     TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  report_type     TEXT NOT NULL DEFAULT 'premium',
  html_content    TEXT,
  pdf_url         TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

-- เพิ่ม column ที่ขาดใน reports (ถ้า table มีอยู่แล้วแต่ schema เก่า)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_uuid    TEXT DEFAULT gen_random_uuid()::TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS html_content   TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS pdf_url        TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS expires_at     TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type    TEXT DEFAULT 'premium';

-- Unique constraint บน report_uuid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_report_uuid_key'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_report_uuid_key UNIQUE (report_uuid);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS reports_profile_id_idx  ON reports(profile_id);
CREATE INDEX IF NOT EXISTS reports_report_uuid_idx ON reports(report_uuid);

-- ── god_draws ──────────────────────────────────────────────
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

ALTER TABLE god_draws ADD COLUMN IF NOT EXISTS blessing   TEXT DEFAULT '';
ALTER TABLE god_draws ADD COLUMN IF NOT EXISTS origin     TEXT DEFAULT '';
ALTER TABLE god_draws ADD COLUMN IF NOT EXISTS element    TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS god_draws_user_id_idx   ON god_draws(user_id);
CREATE INDEX IF NOT EXISTS god_draws_draw_date_idx ON god_draws(draw_date);

-- ── subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  tier                     TEXT NOT NULL DEFAULT 'free',
  status                   TEXT NOT NULL DEFAULT 'active',
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end     TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- ── organum_queries ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organum_queries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  response    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organum_queries_user_id_idx    ON organum_queries(user_id);
CREATE INDEX IF NOT EXISTS organum_queries_created_at_idx ON organum_queries(created_at);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE god_draws       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE organum_queries ENABLE ROW LEVEL SECURITY;

-- user_profiles
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- reports — public read via UUID
DROP POLICY IF EXISTS "reports_select_public" ON reports;
CREATE POLICY "reports_select_public" ON reports
  FOR SELECT USING (true);

-- god_draws
DROP POLICY IF EXISTS "god_draws_select_own" ON god_draws;
CREATE POLICY "god_draws_select_own" ON god_draws
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "god_draws_insert_own" ON god_draws;
CREATE POLICY "god_draws_insert_own" ON god_draws
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- organum_queries
DROP POLICY IF EXISTS "organum_queries_select_own" ON organum_queries;
CREATE POLICY "organum_queries_select_own" ON organum_queries
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "organum_queries_insert_own" ON organum_queries;
CREATE POLICY "organum_queries_insert_own" ON organum_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── auto updated_at ────────────────────────────────────────
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

-- ── Done ───────────────────────────────────────────────────
SELECT 'Migration patch complete ✓' AS result;
