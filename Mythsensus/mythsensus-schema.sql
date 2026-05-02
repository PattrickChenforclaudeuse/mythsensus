-- ============================================================
-- Mythsensus — Supabase (PostgreSQL) Schema
-- Generated: 2026-03-29
-- Description: Core database schema for the Mythsensus platform
--   synthesizing 10 ancient wisdom systems into unified
--   birth chart reports with Cosmic Score.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- users: Core user account, linked to Supabase Auth (auth.users)
CREATE TABLE public.users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        UNIQUE NOT NULL,
  display_name text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  plan        text        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'one_time', 'subscriber'))
);
COMMENT ON TABLE public.users IS
  'Core user account. id should match auth.users.id for RLS. plan tracks current subscription tier.';

-- profiles: Birth chart subjects — one user can have many profiles (self, partner, child, etc.)
CREATE TABLE public.profiles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  dob                date        NOT NULL,
  birth_time         time,
  birth_place        text,
  gender             text        CHECK (gender IN ('male', 'female', 'other')),
  relationship_label text        NOT NULL DEFAULT 'myself',
  cosmic_score       integer     CHECK (cosmic_score >= 0 AND cosmic_score <= 1000),
  created_at         timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS
  'Birth chart subjects. Each user can create multiple profiles (myself, partner, child, friend, etc.).';

-- reports: Generated PDF reports per profile (full report, add-ons, compatibility)
CREATE TABLE public.reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         text        NOT NULL
                           CHECK (type IN ('full', 'companion', 'exercise', 'food', 'pet', 'product', 'compatibility')),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  pdf_url      text,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'generating', 'ready', 'failed'))
);
COMMENT ON TABLE public.reports IS
  'Generated PDF reports. Linked to a profile. status tracks the async generation pipeline.';

-- god_draws: Daily Random God Blessing results (200 gods across 7 rarity tiers)
CREATE TABLE public.god_draws (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  god_id   text        NOT NULL,
  tier     text        NOT NULL,
  drawn_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.god_draws IS
  'Random God Blessing draw history. god_id references the god catalog; tier is the rarity tier.';

-- organum_sessions: 108 Organum Q&A oracle sessions
CREATE TABLE public.organum_sessions (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question text        NOT NULL,
  answer   text        NOT NULL,
  asked_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.organum_sessions IS
  '108 Organum oracle sessions. Each row is one question-answer pair.';

-- frequency_alerts: Notifies users when a symbol/pattern appears repeatedly
CREATE TABLE public.frequency_alerts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol_type text        NOT NULL,
  symbol_id   text        NOT NULL,
  count       integer     NOT NULL,
  period_days integer     NOT NULL,
  alerted_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.frequency_alerts IS
  'Frequency Alert System. Fires when a cosmic symbol appears N times within a rolling period.';

-- streaks: Tracks daily engagement streaks per user (one row per user)
CREATE TABLE public.streaks (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak     integer NOT NULL DEFAULT 0,
  longest_streak     integer NOT NULL DEFAULT 0,
  last_activity_date date,
  CONSTRAINT streaks_user_unique UNIQUE (user_id)
);
COMMENT ON TABLE public.streaks IS
  'Daily engagement streaks. Exactly one row per user. longest_streak auto-updates via trigger.';

-- aliases: Cosmic Alias Generator — saved generated aliases
CREATE TABLE public.aliases (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alias_name text        NOT NULL,
  tier       text,
  day_master text,
  region     text,
  saved_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.aliases IS
  'Cosmic Alias Generator results. Stores generated mystical names with their astrological context.';


-- ============================================================
-- 2. INDEXES
-- ============================================================

-- Foreign key indexes (PostgreSQL doesn't auto-index FK columns)
CREATE INDEX idx_profiles_user_id        ON public.profiles(user_id);
CREATE INDEX idx_reports_profile_id      ON public.reports(profile_id);
CREATE INDEX idx_god_draws_user_drawn    ON public.god_draws(user_id, drawn_at DESC);
CREATE INDEX idx_organum_user_asked      ON public.organum_sessions(user_id, asked_at DESC);
CREATE INDEX idx_frequency_alerts_user   ON public.frequency_alerts(user_id);
CREATE INDEX idx_aliases_user_id         ON public.aliases(user_id);

-- Query-pattern indexes
CREATE INDEX idx_reports_status          ON public.reports(status) WHERE status != 'ready';
CREATE INDEX idx_god_draws_god_tier      ON public.god_draws(god_id, tier);
CREATE INDEX idx_frequency_alerts_symbol ON public.frequency_alerts(symbol_type, symbol_id);


-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.god_draws         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organum_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequency_alerts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aliases           ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY users_select ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- profiles: own data only
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- reports: access via profile ownership
CREATE POLICY reports_select ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = reports.profile_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY reports_insert ON public.reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = reports.profile_id AND p.user_id = auth.uid()
    )
  );

-- god_draws: own data only
CREATE POLICY god_draws_select ON public.god_draws
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY god_draws_insert ON public.god_draws
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- organum_sessions: own data only
CREATE POLICY organum_select ON public.organum_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY organum_insert ON public.organum_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- frequency_alerts: own data only
CREATE POLICY freq_alerts_select ON public.frequency_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY freq_alerts_insert ON public.frequency_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- streaks: own data only
CREATE POLICY streaks_select ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY streaks_insert ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY streaks_update ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- aliases: own data only
CREATE POLICY aliases_select ON public.aliases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY aliases_insert ON public.aliases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY aliases_delete ON public.aliases
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 4. TRIGGER: Auto-update longest_streak
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_update_longest_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When current_streak increases beyond longest_streak, update it
  IF NEW.current_streak > NEW.longest_streak THEN
    NEW.longest_streak := NEW.current_streak;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_longest_streak
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW
  WHEN (NEW.current_streak IS DISTINCT FROM OLD.current_streak)
  EXECUTE FUNCTION public.fn_update_longest_streak();

COMMENT ON FUNCTION public.fn_update_longest_streak() IS
  'Auto-sets longest_streak = current_streak whenever current_streak exceeds the previous longest.';


-- ============================================================
-- 5. HELPER: Insert user row on signup (Supabase Auth hook)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_handle_new_user();

COMMENT ON FUNCTION public.fn_handle_new_user() IS
  'Automatically creates a public.users row when a new auth.users record is created via Supabase Auth.';


-- ============================================================
-- Done. Run this file in Supabase SQL Editor or via psql.
-- ============================================================
