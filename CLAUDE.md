# Mythsensus repo notes

Quick orientation for Claude/agent sessions that enter this folder directly.

## Stack snapshot

- **Frontend:** single-page `index.html` (~2.5 MB inline), no build step. App logic written directly in script tags; engine code lives in `Mythsensus/report-engine/lib/{calc,report}.ts` and is compiled + bundled into `Mythsensus/build/ms26-bundle.js`, then injected back into `index.html` by `Mythsensus/tests/inject-bundle-root.cjs`.
- **Auth:** Supabase Auth (Google + Facebook native, LINE via server bridge in `api/auth/line/callback.js`, email magic link native). Portal page (`portal/index.html`) loads `@supabase/supabase-js` from CDN, reads `window.__MYTH_ENV__` (populated by `/api/public-env.js`), and uses `supabase.auth.signInWithOAuth` / `signInWithOtp` / `getSession`.
- **Payment:** LemonSqueezy (Merchant of Record). `api/lemonsqueezy/create-checkout.js` creates checkout session; `api/lemonsqueezy/webhook.js` handles subscription + order events. Replaced Stripe (which rejected the account — Thai entity limitation).
- **Backend:** Vercel serverless functions under `api/`. Active endpoints:
  - `api/auth/line/callback.js`        — LINE OAuth bridge → Supabase magic link
  - `api/lemonsqueezy/create-checkout.js`
  - `api/lemonsqueezy/webhook.js`
  - `api/public-env.js`                — emits `window.__MYTH_ENV__` for the browser
- **Database:** Supabase project **`jahxcwqwajrzjeiaaozo`** (jah). Mythsensus reads/writes via Data API + `SUPABASE_SERVICE_ROLE_KEY`. Tables: `myth_profiles`, `myth_subscriptions`, `myth_orders` (all RLS-on, prefixed to namespace from Yoohui tables).

## Auth + Payment migration history (2026-05-26)

Old setup (now in `_legacy/`):
- `_legacy/auth/{google,facebook,magic}/` — custom OAuth callbacks that wrote to `public.users` (table never existed → all writes were silent no-ops → all sessions had `user_id: null`)
- `_legacy/stripe/create-checkout-session.js` — Stripe Checkout (account rejected)

New setup:
- Supabase Auth handles Google/Facebook/email natively. Schema migration `migrations/001_auth_payment_schema.sql` was applied to jah on 2026-05-26.
- LINE Login keeps the existing channel — server callback bridges into Supabase via the admin `generate_link` API so users still end up with a real Supabase session.
- LemonSqueezy is Merchant of Record → they handle card processing, VAT/tax in 130+ countries, refunds, chargebacks. No Thai business entity required.
- Portal writes a legacy-shaped `ms_token` to `localStorage` whenever the Supabase session changes, so the unrefactored 2.5MB `index.html` keeps working without changes.

## ⚠️ Supabase Data API GRANT rule (effective 2026-10-30)

**Mythsensus IS affected** by Supabase's new-table default grant change. After 2026-10-30, new tables in `public` schema won't be exposed to the Data API by default — Mythsensus calls `${SUPABASE_URL}/rest/v1/...` which goes through PostgREST, so missing grants → 401/403.

**Every `CREATE TABLE` in `public` (created via migrations or Management API) MUST include:**

```sql
-- Mandatory: webhook handlers + LINE callback need this
grant select, insert, update, delete on public.<table> to service_role;

-- Optional: only if client-side (supabase-js with anon/auth) needs it
grant select on public.<table> to authenticated;

alter table public.<table> enable row level security;
-- + create policy ...  (required if anon/authenticated grant added)
```

**Why service_role still needs explicit GRANT:** `service_role` bypasses RLS but it's still a regular Postgres role from the GRANT perspective. The Data API change removes the auto-grant; the bypass-RLS behaviour is unchanged.

**Sister stack (n8n bot in workspace root):** NOT affected — uses Management API (`api.supabase.com/v1/projects/.../database/query` + PAT) which is superuser-equivalent.

## Deployment

- `npm run deploy` → `git push origin main && vercel --yes --prod`
- Live URL: https://mythsensus.com (Vercel)
- Service worker (`sw.js`) is network-first for HTML; bump the `CACHE` const version (currently `mythsensus-v7`) when shipping HTML/CSS that needs to evict client caches.

## Required env vars (Vercel project settings)

### Supabase (Auth + DB)
| Variable | Notes |
|----------|-------|
| `SUPABASE_URL` | jahxcwqwajrzjeiaaozo |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only — never expose to the browser. Used by LINE callback + LemonSqueezy webhook. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — emitted by `/api/public-env.js` to the browser |

### Supabase Auth providers (configure in Supabase dashboard → Authentication → Providers)
| Provider | Where | What to paste |
|----------|-------|---------------|
| Google   | Supabase dashboard | OAuth client ID + secret from Google Cloud Console; set Authorized redirect URI to `https://<project>.supabase.co/auth/v1/callback` |
| Facebook | Supabase dashboard | App ID + secret from Meta for Developers; same redirect URI pattern |
| Email    | Supabase dashboard | Built-in; optionally configure Resend as custom SMTP for higher volume |

### LINE (custom bridge — not via Supabase native provider)
| Variable | Notes |
|----------|-------|
| `LINE_LOGIN_CHANNEL_ID`     | Numeric channel ID (default 2009661365 hardcoded in portal) |
| `LINE_LOGIN_CHANNEL_SECRET` | From LINE Developers |
| `LINE_CALLBACK_URL`         | `https://mythsensus.com/api/auth/line/callback` |

### LemonSqueezy
| Variable | Notes |
|----------|-------|
| `LEMONSQUEEZY_API_KEY`        | Server-side API key from LS dashboard → Settings → API |
| `LEMONSQUEEZY_STORE_ID`       | Numeric store ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Set when creating webhook in LS dashboard (must match exactly) |
| `LS_VARIANT_SUBSCRIPTION_MONTHLY` | Variant ID for $4.99/mo |
| `LS_VARIANT_SUBSCRIPTION_ANNUAL`  | Variant ID for $49/yr |
| `LS_VARIANT_DEEP_READING`         | (optional) $9 per system |
| `LS_VARIANT_FULL_REPORT`          | (optional) $19 one-time |

### Other
| Variable | Notes |
|----------|-------|
| `SITE_URL` | `https://mythsensus.com` (fallback hardcoded) |
| `ANTHROPIC_API_KEY` | Reserved for future AI features (currently unused at runtime) |

### Webhook setup checklist
1. LemonSqueezy dashboard → Webhooks → Add webhook
2. URL: `https://mythsensus.com/api/lemonsqueezy/webhook`
3. Signing secret: same value as `LEMONSQUEEZY_WEBHOOK_SECRET` env var
4. Events: subscribe to all `subscription_*` and `order_*` events

## Tests

- `Mythsensus/tests/fuzz-30-charts.cjs` — random chart smoke test
- `Mythsensus/tests/fuzz-edge-cases.cjs` — calendar edge cases (Feb 29, etc.)
- `Mythsensus/tests/fuzz-bilingual-leak.cjs` — asserts no Thai chars in `lang:'en'` engine output
- `Mythsensus/tests/audit-bilingual.cjs` — Playwright sweep of every tab × lang
- `npm run qa` — `qa-scanner.js` (14 routes vs live)

After engine source changes, run:
```bash
npm run build:engine                                 # tsc → ms26-bundle.js
node Mythsensus/tests/inject-bundle-root.cjs         # inject into index.html
node Mythsensus/tests/inject-bundle.cjs              # inject into offline HTML
```
