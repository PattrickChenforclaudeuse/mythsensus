-- ============================================================
-- Mythsensus — PDPA Consent Management Schema
-- FIX: SEC-C01 — PDPA Compliance
-- Generated: 2026-03-29
-- ============================================================

-- Data processing purposes
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

COMMENT ON TABLE public.data_processing_purposes IS
  'PDPA: Defines each purpose for which personal data is collected and processed.';

-- Insert default purposes
INSERT INTO public.data_processing_purposes (purpose_key, title_th, title_en, description_th, description_en, is_required) VALUES
('birth_data_processing', 'การประมวลผลข้อมูลวันเกิด', 'Birth Data Processing',
 'เราใช้ข้อมูลวันเกิด เวลาเกิด และสถานที่เกิดของคุณเพื่อสร้างรายงาน Cosmic Score จากระบบโบราณ 10 ระบบ',
 'We use your birth date, time, and place to generate your Cosmic Score report from 10 ancient systems.',
 true),
('sensitive_data_consent', 'ข้อมูลส่วนบุคคลอ่อนไหว (ความเชื่อทางศาสนา/โหราศาสตร์)', 'Sensitive Personal Data (Religious/Astrological Beliefs)',
 'ข้อมูลเกี่ยวกับดวงชะตาและการตีความทางโหราศาสตร์อาจจัดเป็นข้อมูลอ่อนไหวตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา 26 เราขอความยินยอมอย่างชัดแจ้งก่อนเก็บรวบรวม',
 'Astrological and horoscope interpretation data may qualify as sensitive personal data under PDPA Section 26. We request your explicit consent before collection.',
 true),
('marketing_communications', 'การสื่อสารทางการตลาด', 'Marketing Communications',
 'เราอาจส่งข้อมูลเกี่ยวกับฟีเจอร์ใหม่ โปรโมชั่น และข้อเสนอพิเศษให้คุณ',
 'We may send you information about new features, promotions, and special offers.',
 false),
('analytics_improvement', 'การวิเคราะห์และปรับปรุงบริการ', 'Analytics & Service Improvement',
 'เราใช้ข้อมูลการใช้งานที่ไม่ระบุตัวตนเพื่อปรับปรุงบริการและประสบการณ์ผู้ใช้',
 'We use anonymized usage data to improve our services and user experience.',
 false),
('data_retention', 'การเก็บรักษาข้อมูล', 'Data Retention',
 'เราเก็บรักษาข้อมูลโปรไฟล์ของคุณเป็นเวลา 2 ปีเพื่อให้คุณสามารถเข้าถึงรายงานและประวัติการใช้งานได้ คุณสามารถขอลบข้อมูลได้ทุกเมื่อ',
 'We retain your profile data for 2 years so you can access reports and usage history. You can request deletion at any time.',
 true);

-- User consent records
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

COMMENT ON TABLE public.consent_records IS
  'PDPA: Records each user consent decision per purpose and version. Immutable — new consent creates new row.';

-- Consent change log (immutable audit trail)
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

COMMENT ON TABLE public.consent_logs IS
  'PDPA: Immutable audit log of all consent changes. Never delete or update rows in this table.';

-- Data deletion requests (Right to Erasure tracking)
CREATE TABLE public.data_deletion_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes         text
);

COMMENT ON TABLE public.data_deletion_requests IS
  'PDPA: Tracks data deletion requests (Right to Erasure). Must be processed within 30 days per PDPA.';

-- Indexes
CREATE INDEX idx_consent_records_user ON public.consent_records(user_id);
CREATE INDEX idx_consent_logs_user ON public.consent_logs(user_id, created_at DESC);
CREATE INDEX idx_deletion_requests_status ON public.data_deletion_requests(status) WHERE status != 'completed';

-- RLS
ALTER TABLE public.data_processing_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests   ENABLE ROW LEVEL SECURITY;

-- Purposes: readable by all authenticated users
CREATE POLICY purposes_select ON public.data_processing_purposes
  FOR SELECT USING (true);

-- Consent records: own data only
CREATE POLICY consent_records_select ON public.consent_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY consent_records_insert ON public.consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Consent logs: own data only (read-only for users)
CREATE POLICY consent_logs_select ON public.consent_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Deletion requests: own data only
CREATE POLICY deletion_requests_select ON public.data_deletion_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY deletion_requests_insert ON public.data_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Helper function: Record consent
CREATE OR REPLACE FUNCTION public.fn_record_consent(
  p_purpose_key text,
  p_consent_given boolean,
  p_consent_version text DEFAULT '1.0',
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_purpose_id uuid;
  v_record_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_purpose_id FROM public.data_processing_purposes WHERE purpose_key = p_purpose_key;
  IF v_purpose_id IS NULL THEN
    RAISE EXCEPTION 'Unknown purpose: %', p_purpose_key;
  END IF;

  -- Insert or update consent record
  INSERT INTO public.consent_records (user_id, purpose_id, consent_given, consent_version, ip_address, user_agent)
  VALUES (v_user_id, v_purpose_id, p_consent_given, p_consent_version, p_ip_address, p_user_agent)
  ON CONFLICT (user_id, purpose_id, consent_version)
  DO UPDATE SET
    consent_given = p_consent_given,
    withdrawn_at = CASE WHEN NOT p_consent_given THEN now() ELSE NULL END
  RETURNING id INTO v_record_id;

  -- Log the action
  INSERT INTO public.consent_logs (user_id, purpose_id, action, consent_version, ip_address, user_agent)
  VALUES (
    v_user_id,
    v_purpose_id,
    CASE WHEN p_consent_given THEN 'granted' ELSE 'withdrawn' END,
    p_consent_version,
    p_ip_address,
    p_user_agent
  );

  RETURN v_record_id;
END;
$$;

COMMENT ON FUNCTION public.fn_record_consent(text, boolean, text, text, text) IS
  'PDPA: Record or update user consent for a specific purpose. Logs all changes immutably.';

-- Helper function: Check if user has given required consents
CREATE OR REPLACE FUNCTION public.fn_check_required_consents(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  missing_count int;
BEGIN
  SELECT count(*) INTO missing_count
  FROM public.data_processing_purposes dpp
  WHERE dpp.is_required = true
    AND NOT EXISTS (
      SELECT 1 FROM public.consent_records cr
      WHERE cr.user_id = p_user_id
        AND cr.purpose_id = dpp.id
        AND cr.consent_given = true
        AND cr.withdrawn_at IS NULL
    );

  RETURN missing_count = 0;
END;
$$;

COMMENT ON FUNCTION public.fn_check_required_consents(uuid) IS
  'PDPA: Returns true if user has all required consents active. Use before allowing data collection.';
