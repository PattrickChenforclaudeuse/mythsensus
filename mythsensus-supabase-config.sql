-- ============================================================
-- Mythsensus — Supabase Security Hardening Config
-- FIX: SEC-H06, SEC-L03, SEC-M05 — Infrastructure security
-- Generated: 2026-03-29
-- ============================================================
-- NOTE: Some settings below require Supabase Dashboard access
-- and cannot be applied via SQL alone. Those are marked with
-- [DASHBOARD] and include instructions.
-- ============================================================


-- ============================================================
-- 1. Revoke public schema access from anonymous role
-- ============================================================
-- FIX: Prevent unauthenticated access to public schema

REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Grant minimal read access to anon for public-facing data only
-- (e.g., data_processing_purposes for consent form)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.data_processing_purposes TO anon;


-- ============================================================
-- 2. Restrict authenticated role to RLS-protected operations
-- ============================================================

-- Ensure authenticated users go through RLS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Explicitly deny direct access to audit_logs INSERT/UPDATE/DELETE
-- (only SECURITY DEFINER functions should write to audit_logs)
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

-- Explicitly deny direct INSERT on consent_logs (immutable, managed by fn_record_consent)
REVOKE INSERT, UPDATE, DELETE ON public.consent_logs FROM authenticated;


-- ============================================================
-- 3. Secure SECURITY DEFINER functions
-- ============================================================
-- FIX: SEC-H05 — All SECURITY DEFINER functions must have:
--   1. SET search_path = public
--   2. Minimal permissions
--   3. Proper input validation

-- Verify all SECURITY DEFINER functions have search_path set
-- Run this query to audit:
-- SELECT proname, prosecdef, proconfig
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND prosecdef = true;


-- ============================================================
-- 4. [DASHBOARD] Auth Settings — Email Verification
-- ============================================================
-- FIX: SEC-M05 — Require email verification
--
-- Go to: Supabase Dashboard > Authentication > Settings
-- Enable: "Confirm email" toggle
-- Set: "Minimum password length" to 8
-- Enable: "Enable leaked password protection"
-- Disable: "Enable anonymous sign-ins" (unless needed)
--
-- Mailer settings:
-- - Enable custom SMTP (SendGrid, Postmark, etc.)
-- - Set From address: noreply@mythsensus.com
-- - Customize email templates with Mythsensus branding


-- ============================================================
-- 5. [DASHBOARD] Rate Limiting Settings
-- ============================================================
-- FIX: SEC-H02 — Additional API-level rate limiting
--
-- Go to: Supabase Dashboard > Settings > API
-- Recommended limits:
-- - Auth: Max 30 requests/min per IP
-- - REST API: Max 100 requests/min per user
-- - Storage: Max 20 uploads/min per user
--
-- For Edge Functions, add rate limiting middleware:
-- import { Ratelimit } from "@upstash/ratelimit";


-- ============================================================
-- 6. [DASHBOARD] Storage Bucket Security
-- ============================================================
-- FIX: SEC-C02 — PDF reports must be in private bucket
--
-- Go to: Supabase Dashboard > Storage
-- 1. Create bucket: "reports" (set to PRIVATE, not public)
-- 2. Add RLS policy:

-- Storage RLS: Only profile owner can access their report files
-- This policy should be applied via the Storage dashboard
-- Bucket: reports
-- Policy name: owner_access_only
-- Target roles: authenticated
-- Definition:
--   SELECT: (storage.foldername(name))[1] = auth.uid()::text
--   INSERT: (storage.foldername(name))[1] = auth.uid()::text


-- ============================================================
-- 7. [DASHBOARD] CORS Configuration
-- ============================================================
-- FIX: SEC-L03 — Restrict CORS origins
--
-- Go to: Supabase Dashboard > Settings > API
-- Additional allowed origins:
-- - https://mythsensus.com
-- - https://www.mythsensus.com
-- - http://localhost:3000 (development only, remove for production)
--
-- Remove any wildcard (*) origins


-- ============================================================
-- 8. JWT Expiration & Refresh
-- ============================================================
-- [DASHBOARD] Go to: Supabase Dashboard > Settings > API
-- Set JWT expiry to: 3600 (1 hour)
-- Enable: Refresh token rotation
-- Set: Refresh token reuse interval to 10 seconds


-- ============================================================
-- 9. Database Connection Pooling
-- ============================================================
-- [DASHBOARD] Go to: Supabase Dashboard > Settings > Database
-- Enable: Connection pooling (PgBouncer)
-- Mode: Transaction
-- Pool size: Based on your plan (free: 15, pro: 25)


-- ============================================================
-- 10. Scheduled Jobs (pg_cron) for Data Cleanup
-- ============================================================
-- FIX: SEC-C03, SEC-L04 — Automated data retention

-- Enable pg_cron extension (requires Supabase Pro plan)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 3 AM UTC
-- SELECT cron.schedule(
--   'mythsensus-data-cleanup',
--   '0 3 * * *',
--   'SELECT public.fn_cleanup_expired_data()'
-- );

-- For free plan: Use Supabase Edge Function with cron trigger
-- or an external scheduler (Railway cron, GitHub Actions)


-- ============================================================
-- Done. Apply SQL statements, then configure Dashboard settings.
-- ============================================================
