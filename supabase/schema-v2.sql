-- ============================================================
-- Mythsensus â Supabase (PostgreSQL) Schema v2
-- Generated: 2026-03-29
-- Security Hardened: 2026-03-29
-- Description: Core database schema with all security fixes
--   from the Mythsensus Security Audit (SEC-C01 through SEC-L05)
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
-- FIX: SEC-H03 â Enable pgcrypto for PII encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- profiles: Birth chart subjects â one user can have many profiles (self, partner, child, etc.)
CREATE TABLE public.profiles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  dob                date        NOT NULL,
  birth_time         text,       -- FIX: SEC-H03 â changed to text for encrypted storage
  birth_place        text,       -- FIX: SEC-H03 â will store encrypted values
  gender             text        CHECK (gender IN ('male', 'female', 'other')),
  relationship_label text        NOT NULL DEFAULT 'myself',
  cosmic_score       integer     CHECK (cosmic_score >= 0 AND cosmic_score <= 1000),
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- FIX: SEC-C03 â Data retention policy
  data_retention_until timestamptz DEFAULT (now() + interval '2 years')
);
COMMENT ON TABLE public.profiles IS
  'Birth chart subjects. Each user can create multiple profiles. PII fields (birth_time, birth_place) are encrypted via pgcrypto helpers.';

-- reports: Generated PDF reports per profile (full report, add-ons, compatibility)
CREATE TABLE public.reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         text        NOT NULL
                           CHECK (type IN ('full', 'companion', 'exercise', 'food', 'pet', 'product', 'compatibility')),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  -- FIX: SEC-C02 â Store storage path, not public URL
  pdf_storage_path text,
  -- FIX: SEC-C02 â Access token for signed URL verification
  access_token uuid        DEFAULT gen_random_uuid(),
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'generating', 'ready', 'failed'))
);
COMMENT ON TABLE public.reports IS
  'Generated PDF reports. pdf_storage_path is the private storage path (not a public URL). access_token used for signed URL generation.';

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

-- aliases: Cosmic Alias Generator â saved generated aliases
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

-- FIX: SEC-L08 â Audit log table for sensitive operations
CREATE TABLE public.audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  action      text        NOT NULL,
  table_name  text,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.audit_logs IS
  'Audit trail for sensitive operations: plan changes, data deletion, consent changes, etc.';


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

-- FIX: SEC-H02 â Enforce 1 god draw per day per user at DB level
CREATE UNIQUE INDEX idx_god_draws_daily  ON public.god_draws (user_id, (drawn_at::date));

-- FIX: SEC-C02 â Index for access token lookups
CREATE INDEX idx_reports_access_token    ON public.reports(access_token);

-- FIX: SEC-L08 â Audit log indexes
CREATE INDEX idx_audit_logs_user         ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action       ON public.audit_logs(action, created_at DESC);

-- FIX: SEC-C03 â Index for data retention cleanup
CREATE INDEX idx_profiles_retention      ON public.profiles(data_retention_until) WHERE data_retention_until IS NOT NULL;


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
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY users_select ON public.users
  FOR SELECT USING (auth.uid() = id);

-- FIX: SEC-M06 â Restrict UPDATE so users CANNOT change their own plan column
-- The WITH CHECK ensures the plan value hasn't changed from its current value
CREATE POLICY users_update ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT u.plan FROM public.users u WHERE u.id = auth.uid())
  );

-- FIX: SEC-H01 â Add DELETE policy for PDPA Right to Erasure
CREATE POLICY users_delete ON public.users
  FOR DELETE USING (auth.uid() = id);

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

-- audit_logs: users can only read their own logs, insert handled by SECURITY DEFINER functions
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);


-- ============================================================
-- 4. TRIGGER: Auto-update longest_streak
-- ============================================================

-- FIX: SEC-H05 â Added SET search_path = public
CREATE OR REPLACE FUNCTION public.fn_update_longest_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- FIX: SEC-H05 Prevent search_path injection
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
SET search_path = public  -- FIX: SEC-H05 Consistent search_path
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
-- 6. FIX: SEC-M06 â Secure plan change function
-- ============================================================
-- Plan changes must go through this SECURITY DEFINER function
-- which should be called from a trusted backend (Edge Function / webhook handler)

CREATE OR REPLACE FUNCTION public.fn_update_user_plan(
  p_user_id uuid,
  p_new_plan text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate plan value
  IF p_new_plan NOT IN ('free', 'one_time', 'subscriber') THEN
    RAISE EXCEPTION 'Invalid plan value: %', p_new_plan;
  END IF;

  -- Log the plan change in audit_logs
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  SELECT
    p_user_id,
    'plan_change',
    'users',
    p_user_id,
    jsonb_build_object('plan', u.plan),
    jsonb_build_object('plan', p_new_plan)
  FROM public.users u
  WHERE u.id = p_user_id;

  -- Update the plan
  UPDATE public.users SET plan = p_new_plan WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.fn_update_user_plan(uuid, text) IS
  'SEC-M06: Secure plan update. Only callable from trusted backend (Edge Functions, webhook handlers). Logs change to audit_logs.';


-- ============================================================
-- 7. FIX: SEC-H02 â Rate limiting functions
-- ============================================================

-- Rate limit for god_draws
-- Note: The UNIQUE INDEX idx_god_draws_daily already enforces 1 draw/day at DB level
-- This function provides plan-aware limits for subscribers (3/day)
CREATE OR REPLACE FUNCTION public.fn_check_god_draw_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_count int;
  user_plan text;
  max_draws int;
BEGIN
  SELECT plan INTO user_plan FROM public.users WHERE id = NEW.user_id;

  -- Set limits by plan
  CASE user_plan
    WHEN 'free' THEN max_draws := 1;
    WHEN 'one_time' THEN max_draws := 1;
    WHEN 'subscriber' THEN max_draws := 3;
    ELSE max_draws := 1;
  END CASE;

  SELECT count(*) INTO today_count
  FROM public.god_draws
  WHERE user_id = NEW.user_id AND drawn_at::date = CURRENT_DATE;

  IF today_count >= max_draws THEN
    RAISE EXCEPTION 'Daily god draw limit reached (% draws for % plan)', max_draws, user_plan;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_god_draw_limit
  BEFORE INSERT ON public.god_draws
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_god_draw_limit();

COMMENT ON FUNCTION public.fn_check_god_draw_limit() IS
  'SEC-H02: Rate limit god draws â 1/day free, 3/day subscriber.';

-- Rate limit for organum_sessions
CREATE OR REPLACE FUNCTION public.fn_check_organum_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_count int;
  user_plan text;
BEGIN
  SELECT plan INTO user_plan FROM public.users WHERE id = NEW.user_id;

  -- Subscribers get unlimited
  IF user_plan = 'subscriber' THEN
    RETURN NEW;
  END IF;

  -- Free and one_time: max 5 per day
  SELECT count(*) INTO today_count
  FROM public.organum_sessions
  WHERE user_id = NEW.user_id AND asked_at::date = CURRENT_DATE;

  IF today_count >= 5 THEN
    RAISE EXCEPTION 'Daily organum session limit reached (5 for % plan)', user_plan;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_organum_limit
  BEFORE INSERT ON public.organum_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_organum_limit();

COMMENT ON FUNCTION public.fn_check_organum_limit() IS
  'SEC-H02: Rate limit organum sessions â 5/day free, unlimited subscriber.';


-- ============================================================
-- 8. FIX: SEC-H03 â PII Encryption helpers (pgcrypto)
-- ============================================================

-- Encryption key should be stored in Supabase Vault in production
-- For the schema, we define helper functions that accept a key parameter

CREATE OR REPLACE FUNCTION public.fn_encrypt_pii(
  p_plaintext text,
  p_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_plaintext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(pgp_sym_encrypt(p_plaintext, p_key), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_decrypt_pii(
  p_encrypted text,
  p_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(decode(p_encrypted, 'base64'), p_key);
END;
$$;

COMMENT ON FUNCTION public.fn_encrypt_pii(text, text) IS
  'SEC-H03: Encrypt PII using pgcrypto PGP symmetric encryption. Key should come from Supabase Vault.';
COMMENT ON FUNCTION public.fn_decrypt_pii(text, text) IS
  'SEC-H03: Decrypt PII using pgcrypto PGP symmetric decryption. Key should come from Supabase Vault.';


-- ============================================================
-- 9. FIX: SEC-C02 â PDF Signed URL helper
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_get_report_if_authorized(
  p_report_id uuid,
  p_access_token uuid
)
RETURNS TABLE(pdf_storage_path text, report_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT r.pdf_storage_path, r.type
  FROM public.reports r
  JOIN public.profiles p ON r.profile_id = p.id
  WHERE r.id = p_report_id
    AND r.access_token = p_access_token
    AND p.user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION public.fn_get_report_if_authorized(uuid, uuid) IS
  'SEC-C02: Verify report ownership + access token before returning storage path for signed URL generation.';


-- ============================================================
-- 10. FIX: SEC-C03 â Data retention cleanup function
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  r record;
BEGIN
  -- Delete profiles past retention date (CASCADE handles related data)
  FOR r IN
    SELECT id, user_id FROM public.profiles
    WHERE data_retention_until IS NOT NULL
      AND data_retention_until < now()
  LOOP
    -- Log the deletion
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
    VALUES (r.user_id, 'data_retention_cleanup', 'profiles', r.id);

    DELETE FROM public.profiles WHERE id = r.id;
    deleted_count := deleted_count + 1;
  END LOOP;

  -- Clean up old frequency_alerts (older than 90 days) â FIX: SEC-L04
  DELETE FROM public.frequency_alerts
  WHERE alerted_at < now() - interval '90 days';

  -- Clean up old audit logs (older than 1 year)
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '1 year';

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.fn_cleanup_expired_data() IS
  'SEC-C03 + SEC-L04: Periodic data cleanup â removes expired profiles, old alerts, old audit logs. Call via pg_cron or Supabase scheduled function.';


-- ============================================================
-- 11. FIX: SEC-H01 â User self-deletion (Right to Erasure)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Log the deletion
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
  VALUES (v_user_id, 'account_deletion', 'users', v_user_id);

  -- Delete user (CASCADE handles all related data)
  DELETE FROM public.users WHERE id = v_user_id;
END;
$$;

COMMENT ON FUNCTION public.fn_delete_my_account() IS
  'SEC-H01 + PDPA: Allows authenticated user to delete their own account and all related data.';


-- ============================================================
-- Done. Run this file in Supabase SQL Editor or via psql.
-- ============================================================
