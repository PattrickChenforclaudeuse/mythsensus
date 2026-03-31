-- ============================================================
-- MYTHSENSUS â COMBINED SCHEMA (All 3 files in correct order)
-- Run this ENTIRE file in Supabase SQL Editor in ONE go
-- Generated: 30 March 2026
-- ============================================================
-- File 1: mythsensus-schema-v2.sql (Core schema)
-- File 2: mythsensus-pdpa-consent.sql (PDPA compliance)
-- File 3: mythsensus-supabase-config.sql (Security hardening)
-- ============================================================

-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
-- FILE 1: CORE SCHEMA (mythsensus-schema-v2.sql)
-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLES

CREATE TABLE public.users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        UNIQUE NOT NULL,
  display_name text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  plan        text        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'one_time', 'subscriber'))
);

CREATE TABLE public.profiles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  dob                date        NOT NULL,
  birth_time         text,
  birth_place        text,
  gender             text        CHECK (gender IN ('male', 'female', 'other')),
  relationship_label text        NOT NULL DEFAULT 'myself',
  cosmic_score       integer     CHECK (cosmic_score >= 0 AND cosmic_score <= 1000),
  created_at         timestamptz NOT NULL DEFAULT now(),
  data_retention_until timestamptz DEFAULT (now() + interval '2 years')
);

CREATE TABLE public.reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         text        NOT NULL
                           CHECK (type IN ('full', 'companion', 'exercise', 'food', 'pet', 'product', 'compatibility')),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  pdf_storage_path text,
  access_token uuid        DEFAULT gen_random_uuid(),
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'generating', 'ready', 'failed'))
);

CREATE TABLE public.god_draws (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  god_id   text        NOT NULL,
  tier     text        NOT NULL,
  drawn_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.organum_sessions (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question text        NOT NULL,
  answer   text        NOT NULL,
  asked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.frequency_alerts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol_type text        NOT NULL,
  symbol_id   text        NOT NULL,
  count       integer     NOT NULL,
  period_days integer     NOT NULL,
  alerted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.streaks (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak     integer NOT NULL DEFAULT 0,
  longest_streak     integer NOT NULL DEFAULT 0,
  last_activity_date date,
  CONSTRAINT streaks_user_unique UNIQUE (user_id)
);

CREATE TABLE public.aliases (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alias_name text        NOT NULL,
  tier       text,
  day_master text,
  region     text,
  saved_at   timestamptz NOT NULL DEFAULT now()
);

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

-- 2. INDEXES

CREATE INDEX idx_profiles_user_id        ON public.profiles(user_id);
CREATE INDEX idx_reports_profile_id      ON public.reports(profile_id);
CREATE INDEX idx_god_draws_user_drawn    ON public.god_draws(user_id, drawn_at DESC);
CREATE INDEX idx_organum_user_asked      ON public.organum_sessions(user_id, asked_at DESC);
CREATE INDEX idx_frequency_alerts_user   ON public.frequency_alerts(user_id);
CREATE INDEX idx_aliases_user_id         ON public.aliases(user_id);
CREATE INDEX idx_reports_status          ON public.reports(status) WHERE status != 'ready';
CREATE INDEX idx_god_draws_god_tier      ON public.god_draws(god_id, tier);
CREATE INDEX idx_frequency_alerts_symbol ON public.frequency_alerts(symbol_type, symbol_id);
CREATE UNIQUE INDEX idx_god_draws_daily  ON public.god_draws (user_id, (drawn_at::date));
CREATE INDEX idx_reports_access_token    ON public.reports(access_token);
CREATE INDEX idx_audit_logs_user         ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action       ON public.audit_logs(action, created_at DESC);
CREATE INDEX idx_profiles_retention      ON public.profiles(data_retention_until) WHERE data_retention_until IS NOT NULL;

-- 3. ROW LEVEL SECURITY

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.god_draws         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organum_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequency_alerts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aliases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND plan = (SELECT u.plan FROM public.users u WHERE u.id = auth.uid()));
CREATE POLICY users_delete ON public.users FOR DELETE USING (auth.uid() = id);

CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_insert ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY profiles_delete ON public.profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY reports_select ON public.reports FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = reports.profile_id AND p.user_id = auth.uid()));
CREATE POLICY reports_insert ON public.reports FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = reports.profile_id AND p.user_id = auth.uid()));

CREATE POLICY god_draws_select ON public.god_draws FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY god_draws_insert ON public.god_draws FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY organum_select ON public.organum_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY organum_insert ON public.organum_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY freq_alerts_select ON public.frequency_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY freq_alerts_insert ON public.frequency_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY streaks_select ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY streaks_insert ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY streaks_update ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY aliases_select ON public.aliases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY aliases_insert ON public.aliases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY aliases_delete ON public.aliases FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- 4. TRIGGERS & FUNCTIONS

CREATE OR REPLACE FUNCTION public.fn_update_longest_streak()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.current_streak > NEW.longest_streak THEN
    NEW.longest_streak := NEW.current_streak;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_longest_streak
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW WHEN (NEW.current_streak IS DISTINCT FROM OLD.current_streak)
  EXECUTE FUNCTION public.fn_update_longest_streak();

CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

CREATE OR REPLACE FUNCTION public.fn_update_user_plan(p_user_id uuid, p_new_plan text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_new_plan NOT IN ('free', 'one_time', 'subscriber') THEN
    RAISE EXCEPTION 'Invalid plan value: %', p_new_plan;
  END IF;
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  SELECT p_user_id, 'plan_change', 'users', p_user_id, jsonb_build_object('plan', u.plan), jsonb_build_object('plan', p_new_plan)
  FROM public.users u WHERE u.id = p_user_id;
  UPDATE public.users SET plan = p_new_plan WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_check_god_draw_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  today_count int; user_plan text; max_draws int;
BEGIN
  SELECT plan INTO user_plan FROM public.users WHERE id = NEW.user_id;
  CASE user_plan WHEN 'free' THEN max_draws := 1; WHEN 'one_time' THEN max_draws := 1; WHEN 'subscriber' THEN max_draws := 3; ELSE max_draws := 1; END CASE;
  SELECT count(*) INTO today_count FROM public.god_draws WHERE user_id = NEW.user_id AND drawn_at::date = CURRENT_DATE;
  IF today_count >= max_draws THEN RAISE EXCEPTION 'Daily god draw limit reached (% draws for % plan)', max_draws, user_plan; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_god_draw_limit
  BEFORE INSERT ON public.god_draws FOR EACH ROW EXECUTE FUNCTION public.fn_check_god_draw_limit();

CREATE OR REPLACE FUNCTION public.fn_check_organum_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  today_count int; user_plan text;
BEGIN
  SELECT plan INTO user_plan FROM public.users WHERE id = NEW.user_id;
  IF user_plan = 'subscriber' THEN RETURN NEW; END IF;
  SELECT count(*) INTO today_count FROM public.organum_sessions WHERE user_id = NEW.user_id AND asked_at::date = CURRENT_DATE;
  IF today_count >= 5 THEN RAISE EXCEPTION 'Daily organum session limit reached (5 for % plan)', user_plan; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_organum_limit
  BEFORE INSERT ON public.organum_sessions FOR EACH ROW EXECUTE FUNCTION public.fn_check_organum_limit();

CREATE OR REPLACE FUNCTION public.fn_encrypt_pii(p_plaintext text, p_key text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_plaintext IS NULL THEN RETURN NULL; END IF;
  RETURN encode(pgp_sym_encrypt(p_plaintext, p_key), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_decrypt_pii(p_encrypted text, p_key text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_encrypted IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(decode(p_encrypted, 'base64'), p_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_get_report_if_authorized(p_report_id uuid, p_access_token uuid)
RETURNS TABLE(pdf_storage_path text, report_type text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY SELECT r.pdf_storage_path, r.type FROM public.reports r JOIN public.profiles p ON r.profile_id = p.id
  WHERE r.id = p_report_id AND r.access_token = p_access_token AND p.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_data()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted_count integer := 0; r record;
BEGIN
  FOR r IN SELECT id, user_id FROM public.profiles WHERE data_retention_until IS NOT NULL AND data_retention_until < now() LOOP
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id) VALUES (r.user_id, 'data_retention_cleanup', 'profiles', r.id);
    DELETE FROM public.profiles WHERE id = r.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  DELETE FROM public.frequency_alerts WHERE alerted_at < now() - interval '90 days';
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '1 year';
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id) VALUES (v_user_id, 'account_deletion', 'users', v_user_id);
  DELETE FROM public.users WHERE id = v_user_id;
END;
$$;


-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
-- FILE 2: PDPA CONSENT (mythsensus-pdpa-consent.sql)
-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

CREATE TABLE public.data_processing_purposes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose_key text        UNIQUE NOT NULL,
  title_th    text        NOT NULL,
  title_en    text        NOT NULL,
  description_th text     NOT NULL,
  description_en text     NOT NULL,
  is_required boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.data_processing_purposes (purpose_key, title_th, title_en, description_th, description_en, is_required) VALUES
('birth_data_processing', 'à¸à¸²à¸£à¸à¸£à¸°à¸¡à¸§à¸¥à¸à¸¥à¸à¹à¸­à¸¡à¸¹à¸¥à¸§à¸±à¸à¹à¸à¸´à¸', 'Birth Data Processing',
 'à¹à¸£à¸²à¹à¸à¹à¸à¹à¸­à¸¡à¸¹à¸¥à¸§à¸±à¸à¹à¸à¸´à¸ à¹à¸§à¸¥à¸²à¹à¸à¸´à¸ à¹à¸¥à¸°à¸ªà¸à¸²à¸à¸à¸µà¹à¹à¸à¸´à¸à¸à¸­à¸à¸à¸¸à¸à¹à¸à¸·à¹à¸­à¸ªà¸£à¹à¸²à¸à¸£à¸²à¸¢à¸à¸²à¸ Cosmic Score à¸à¸²à¸à¸£à¸°à¸à¸à¹à¸à¸£à¸²à¸ 10 à¸£à¸°à¸à¸',
 'We use your birth date, time, and place to generate your Cosmic Score report from 10 ancient systems.', true),
('sensitive_data_consent', 'à¸à¹à¸­à¸¡à¸¹à¸¥à¸ªà¹à¸§à¸à¸à¸¸à¸à¸à¸¥à¸­à¹à¸­à¸à¹à¸«à¸§ (à¸à¸§à¸²à¸¡à¹à¸à¸·à¹à¸­à¸à¸²à¸à¸¨à¸²à¸ªà¸à¸²/à¹à¸«à¸£à¸²à¸¨à¸²à¸ªà¸à¸£à¹)', 'Sensitive Personal Data (Religious/Astrological Beliefs)',
 'à¸à¹à¸­à¸¡à¸¹à¸¥à¹à¸à¸µà¹à¸¢à¸§à¸à¸±à¸à¸à¸§à¸à¸à¸°à¸à¸²à¹à¸¥à¸°à¸à¸²à¸£à¸à¸µà¸à¸§à¸²à¸¡à¸à¸²à¸à¹à¸«à¸£à¸²à¸¨à¸²à¸ªà¸à¸£à¹à¸­à¸²à¸à¸à¸±à¸à¹à¸à¹à¸à¸à¹à¸­à¸¡à¸¹à¸¥à¸­à¹à¸­à¸à¹à¸«à¸§à¸à¸²à¸¡ à¸.à¸£.à¸. à¸à¸¸à¹à¸¡à¸à¸£à¸­à¸à¸à¹à¸­à¸¡à¸¹à¸¥à¸ªà¹à¸§à¸à¸à¸¸à¸à¸à¸¥ à¸¡à¸²à¸à¸£à¸² 26 à¹à¸£à¸²à¸à¸­à¸à¸§à¸²à¸¡à¸¢à¸´à¸à¸¢à¸­à¸¡à¸­à¸¢à¹à¸²à¸à¸à¸±à¸à¹à¸à¹à¸à¸à¹à¸­à¸à¹à¸à¹à¸à¸£à¸§à¸à¸£à¸§à¸¡',
 'Astrological and horoscope interpretation data may qualify as sensitive personal data under PDPA Section 26. We request your explicit consent before collection.', true),
('marketing_communications', 'à¸à¸²à¸£à¸ªà¸·à¹à¸­à¸ªà¸²à¸£à¸à¸²à¸à¸à¸²à¸£à¸à¸¥à¸²à¸', 'Marketing Communications',
 'à¹à¸£à¸²à¸­à¸²à¸à¸ªà¹à¸à¸à¹à¸­à¸¡à¸¹à¸¥à¹à¸à¸µà¹à¸¢à¸§à¸à¸±à¸à¸à¸µà¹à¸à¸­à¸£à¹à¹à¸«à¸¡à¹ à¹à¸à¸£à¹à¸¡à¸à¸±à¹à¸ à¹à¸¥à¸°à¸à¹à¸­à¹à¸ªà¸à¸­à¸à¸´à¹à¸¨à¸©à¹à¸«à¹à¸à¸¸à¸',
 'We may send you information about new features, promotions, and special offers.', false),
('analytics_improvement', 'à¸à¸²à¸£à¸§à¸´à¹à¸à¸£à¸²à¸°à¸«à¹à¹à¸¥à¸°à¸à¸£à¸±à¸à¸à¸£à¸¸à¸à¸à¸£à¸´à¸à¸²à¸£', 'Analytics & Service Improvement',
 'à¹à¸£à¸²à¹à¸à¹à¸à¹à¸­à¸¡à¸¹à¸¥à¸à¸²à¸£à¹à¸à¹à¸à¸²à¸à¸à¸µà¹à¹à¸¡à¹à¸£à¸°à¸à¸¸à¸à¸±à¸§à¸à¸à¹à¸à¸·à¹à¸­à¸à¸£à¸±à¸à¸à¸£à¸¸à¸à¸à¸£à¸´à¸à¸²à¸£à¹à¸¥à¸°à¸à¸£à¸°à¸ªà¸à¸à¸²à¸£à¸à¹à¸à¸¹à¹à¹à¸à¹',
 'We use anonymized usage data to improve our services and user experience.', false),
('data_retention', 'à¸à¸²à¸£à¹à¸à¹à¸à¸£à¸±à¸à¸©à¸²à¸à¹à¸­à¸¡à¸¹à¸¥', 'Data Retention',
 'à¹à¸£à¸²à¹à¸à¹à¸à¸£à¸±à¸à¸©à¸²à¸à¹à¸­à¸¡à¸¹à¸¥à¹à¸à¸£à¹à¸à¸¥à¹à¸à¸­à¸à¸à¸¸à¸à¹à¸à¹à¸à¹à¸§à¸¥à¸² 2 à¸à¸µà¹à¸à¸·à¹à¸­à¹à¸«à¹à¸à¸¸à¸à¸ªà¸²à¸¡à¸²à¸£à¸à¹à¸à¹à¸²à¸à¸¶à¸à¸£à¸²à¸¢à¸à¸²à¸à¹à¸¥à¸°à¸à¸£à¸°à¸§à¸±à¸à¸´à¸à¸²à¸£à¹à¸à¹à¸à¸²à¸à¹à¸à¹ à¸à¸¸à¸à¸ªà¸²à¸¡à¸²à¸£à¸à¸à¸­à¸¥à¸à¸à¹à¸­à¸¡à¸¹à¸¥à¹à¸à¹à¸à¸¸à¸à¹à¸¡à¸·à¹à¸­',
 'We retain your profile data for 2 years so you can access reports and usage history. You can request deletion at any time.', true);

CREATE TABLE public.consent_records (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose_id    uuid        NOT NULL REFERENCES public.data_processing_purposes(id),
  consent_given boolean     NOT NULL,
  consent_version text      NOT NULL DEFAULT '1.0',
  given_at      timestamptz NOT NULL DEFAULT now(),
  withdrawn_at  timestamptz,
  ip_address    text,
  user_agent    text,
  UNIQUE(user_id, purpose_id, consent_version)
);

CREATE TABLE public.consent_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose_id    uuid        NOT NULL REFERENCES public.data_processing_purposes(id),
  action        text        NOT NULL CHECK (action IN ('granted', 'withdrawn', 'auto_expired')),
  consent_version text      NOT NULL,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.data_deletion_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes         text
);

CREATE INDEX idx_consent_records_user ON public.consent_records(user_id);
CREATE INDEX idx_consent_logs_user ON public.consent_logs(user_id, created_at DESC);
CREATE INDEX idx_deletion_requests_status ON public.data_deletion_requests(status) WHERE status != 'completed';

ALTER TABLE public.data_processing_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests   ENABLE ROW LEVEL SECURITY;

CREATE POLICY purposes_select ON public.data_processing_purposes FOR SELECT USING (true);
CREATE POLICY consent_records_select ON public.consent_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY consent_records_insert ON public.consent_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY consent_logs_select ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY deletion_requests_select ON public.data_deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY deletion_requests_insert ON public.data_deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.fn_record_consent(
  p_purpose_key text, p_consent_given boolean, p_consent_version text DEFAULT '1.0', p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_purpose_id uuid; v_record_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO v_purpose_id FROM public.data_processing_purposes WHERE purpose_key = p_purpose_key;
  IF v_purpose_id IS NULL THEN RAISE EXCEPTION 'Unknown purpose: %', p_purpose_key; END IF;
  INSERT INTO public.consent_records (user_id, purpose_id, consent_given, consent_version, ip_address, user_agent)
  VALUES (v_user_id, v_purpose_id, p_consent_given, p_consent_version, p_ip_address, p_user_agent)
  ON CONFLICT (user_id, purpose_id, consent_version)
  DO UPDATE SET consent_given = p_consent_given, withdrawn_at = CASE WHEN NOT p_consent_given THEN now() ELSE NULL END
  RETURNING id INTO v_record_id;
  INSERT INTO public.consent_logs (user_id, purpose_id, action, consent_version, ip_address, user_agent)
  VALUES (v_user_id, v_purpose_id, CASE WHEN p_consent_given THEN 'granted' ELSE 'withdrawn' END, p_consent_version, p_ip_address, p_user_agent);
  RETURN v_record_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_check_required_consents(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE missing_count int;
BEGIN
  SELECT count(*) INTO missing_count FROM public.data_processing_purposes dpp
  WHERE dpp.is_required = true AND NOT EXISTS (
    SELECT 1 FROM public.consent_records cr WHERE cr.user_id = p_user_id AND cr.purpose_id = dpp.id AND cr.consent_given = true AND cr.withdrawn_at IS NULL
  );
  RETURN missing_count = 0;
END;
$$;


-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
-- FILE 3: SECURITY HARDENING (mythsensus-supabase-config.sql)
-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.data_processing_purposes TO anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.consent_logs FROM authenticated;


-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
-- DONE! Now configure these in Supabase Dashboard manually:
-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
-- 1. Authentication > Settings: Enable "Confirm email", min password 8
-- 2. Authentication > Providers: Enable Google, Facebook, LINE
-- 3. Settings > API: CORS origins = https://mythsensus.com, https://www.mythsensus.com
-- 4. Settings > API: JWT expiry = 3600, enable refresh token rotation
-- 5. Storage: Create "reports" bucket (PRIVATE), add RLS policy
-- 6. Settings > Database: Enable connection pooling (Transaction mode)
-- ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
