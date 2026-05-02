# Mythsensus Security Fixes Changelog

**Date:** 2026-03-29
**Audit Reference:** mythsensus-security-audit.html
**Security Score Before:** 56/100
**Estimated Score After:** ~85/100

---

## Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `mythsensus-schema-v2.sql` | Modified | Original schema + all SQL security fixes |
| `mythsensus-interactive-v2.html` | Modified | Original interactive page + all frontend fixes |
| `mythsensus-glitch-event-v2.html` | Modified | Glitch event + comment removal, audio cleanup, CSP |
| `mythsensus-pdpa-consent.sql` | New | PDPA consent management tables and functions |
| `mythsensus-privacy-policy-th.html` | New | Thai privacy policy (PDPA compliant) |
| `mythsensus-vercel-headers.json` | New | Security headers config for Vercel deployment |
| `mythsensus-supabase-config.sql` | New | Supabase security hardening instructions |

---

## BATCH 1 — SQL Security Fixes (`mythsensus-schema-v2.sql`)

### 1. SEC-M06 [CRITICAL] — User Can Self-Upgrade Plan

**Before:**
```sql
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

**After:**
```sql
CREATE POLICY users_update ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT u.plan FROM public.users u WHERE u.id = auth.uid())
  );
```
Plus added `fn_update_user_plan()` SECURITY DEFINER function for trusted backend plan changes with audit logging.

---

### 2. SEC-H01 [HIGH] — Missing Users DELETE Policy

**Before:** No DELETE policy on `users` table.

**After:**
```sql
CREATE POLICY users_delete ON public.users
  FOR DELETE USING (auth.uid() = id);
```
Plus added `fn_delete_my_account()` SECURITY DEFINER function for cascading account deletion.

---

### 3. SEC-H05 [HIGH] — SECURITY DEFINER Missing search_path

**Before:**
```sql
CREATE OR REPLACE FUNCTION public.fn_update_longest_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
```

**After:**
```sql
CREATE OR REPLACE FUNCTION public.fn_update_longest_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- FIX: SEC-H05
AS $$
```
Applied `SET search_path = public` to ALL SECURITY DEFINER functions.

---

### 4. SEC-C03 [CRITICAL] — No Data Retention Policy

**Before:** No TTL, no auto-deletion, no lifecycle management.

**After:**
- Added `data_retention_until` column to `profiles` table (default 2 years)
- Created `fn_cleanup_expired_data()` function for scheduled cleanup
- Cleans up expired profiles, old frequency_alerts (90 days), old audit logs (1 year)

---

### 5. SEC-H02 [HIGH] — No Rate Limiting

**Before:** No constraints on god_draws or organum_sessions frequency.

**After:**
- Added `UNIQUE INDEX idx_god_draws_daily` enforcing 1 draw/day at DB level
- Created `fn_check_god_draw_limit()` trigger: 1/day free, 3/day subscriber
- Created `fn_check_organum_limit()` trigger: 5/day free, unlimited subscriber

---

### 6. SEC-C02 [CRITICAL] — PDF URL Access Control

**Before:**
```sql
pdf_url text,  -- Plain public URL, no access control
```

**After:**
```sql
pdf_storage_path text,   -- Private storage path (not public URL)
access_token uuid DEFAULT gen_random_uuid(),  -- For signed URL verification
```
Plus added `fn_get_report_if_authorized()` function to verify ownership before URL generation.

---

### 7. SEC-H03 [HIGH] — PII Encryption

**Before:** All PII stored as plaintext.

**After:**
- Enabled `pgcrypto` extension
- Changed `birth_time` column to `text` type for encrypted storage
- Created `fn_encrypt_pii()` and `fn_decrypt_pii()` helper functions using PGP symmetric encryption
- Encryption key should be stored in Supabase Vault

---

### 8. SEC-L08 [LOW] — Audit Log Table

**Before:** No audit trail for sensitive operations.

**After:**
- Created `audit_logs` table with: user_id, action, table_name, record_id, old_data, new_data, ip_address
- RLS policy: users can only read their own logs
- Integrated with plan change, account deletion, and data retention functions

---

## BATCH 2 — HTML/Frontend Fixes

### 9. SEC-C04 [CRITICAL] — innerHTML Without Sanitization (`interactive-v2.html`)

**Before:** 6+ sections using `container.innerHTML += \`...\``

**After:** All sections converted to safe DOM API:
- `document.createElement()` + `textContent` for text content
- `DOMPurify.sanitize()` only for FEATURES body field (which contains styling HTML)
- Added DOMPurify CDN script

---

### 10. SEC-H04 [HIGH] — Google Fonts Without SRI (`interactive-v2.html`)

**Before:**
```html
<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet">
```

**After:**
```html
<!-- FIX: SEC-H04 — crossorigin added. SRI not practical for Google Fonts (dynamic CSS) -->
<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" crossorigin="anonymous">
```

---

### 11. SEC-H06 [HIGH] — No CSP Meta Tag (`interactive-v2.html`, `glitch-event-v2.html`)

**Before:** No Content-Security-Policy defined.

**After:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co;">
```

---

### 12. SEC-M01 [MEDIUM] — Promo Code No Validation (`interactive-v2.html`)

**Before:** Accepts any non-empty string, shows "Code Activated!" regardless.

**After:**
- Regex validation: `/^[A-Z0-9-]{4,20}$/`
- Auto-uppercase conversion
- Error message display for invalid codes
- Character sanitization

---

### 13. SEC-L02 [LOW] — Developer Comments (`glitch-event-v2.html`)

**Before:** Comment revealing probability (0.000001), Supabase flag name, design intent.

**After:** Minimal production comment with no internal details.

---

### 14. SEC-M07 [MEDIUM] — Web Audio Cleanup (`glitch-event-v2.html`)

**Before:** No cleanup on page unload, possible orphaned AudioContext.

**After:**
- Added `window.addEventListener('beforeunload', killHum)`
- Guard to reuse existing AudioContext
- Replaced `innerHTML = ''` with `removeChild` loops

---

## BATCH 3 — PDPA Compliance

### 15. SEC-C01 [CRITICAL] — PDPA Consent (`mythsensus-pdpa-consent.sql`)

**Before:** No consent mechanism, no consent tracking.

**After:** Complete PDPA consent management:
- `data_processing_purposes` table with 5 default purposes (Thai/English)
- `consent_records` table with version tracking
- `consent_logs` immutable audit trail
- `data_deletion_requests` for Right to Erasure tracking
- `fn_record_consent()` helper function
- `fn_check_required_consents()` validation function
- Full RLS policies

---

### 16. Privacy Policy (`mythsensus-privacy-policy-th.html`)

**New file:** Complete Thai-language privacy policy covering:
- Data collected (general + sensitive under Section 26)
- Legal basis for processing
- Data retention (2 years)
- Security measures
- Data sharing disclosures
- User rights (8 PDPA rights)
- Cookies
- International transfer
- Contact (DPO email)

---

## BATCH 4 — Infrastructure Config

### 17. Security Headers (`mythsensus-vercel-headers.json`)

**New file:** Vercel deployment config with:
- CSP (script-src, style-src, font-src, img-src, connect-src, frame-ancestors)
- HSTS (2 years, includeSubDomains, preload)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (camera, microphone, geolocation disabled)
- CORS for API routes (mythsensus.com only)
- Cache-Control for static assets

---

### 18. Supabase Hardening (`mythsensus-supabase-config.sql`)

**New file:** Supabase security configuration:
- Revoke public schema from anonymous role
- Restrict authenticated role permissions
- Lock down audit_logs and consent_logs tables
- Instructions for Dashboard settings:
  - Email verification (SEC-M05)
  - Rate limiting
  - Private storage bucket for PDFs (SEC-C02)
  - CORS restriction (SEC-L03)
  - JWT expiration
  - Connection pooling
  - pg_cron for data cleanup (SEC-C03)

---

## Findings Not Addressed (Out of Scope)

| ID | Finding | Reason |
|----|---------|--------|
| SEC-M02 | Python f-string template injection | Requires changes to `mythsensus-render-fixed.py` (not in scope) |
| SEC-M03 | God blessing JSON stored XSS | Mitigated by innerHTML→textContent fix in interactive-v2 |
| SEC-M04 | Payment webhook verification | Requires Edge Function code (not yet implemented) |
| SEC-L03 | CORS documentation | Addressed via supabase-config.sql instructions |
| SEC-L05 | Python stack trace exposure | Requires changes to `mythsensus-render-fixed.py` (not in scope) |
