# Mythsensus repo notes

Quick orientation for Claude/agent sessions that enter this folder directly.

## Stack snapshot

- **Frontend:** single-page `index.html` (~2.5 MB inline), no build step. App logic written directly in script tags; engine code lives in `Mythsensus/report-engine/lib/{calc,report}.ts` and is compiled + bundled into `Mythsensus/build/ms26-bundle.js`, then injected back into `index.html` by `Mythsensus/tests/inject-bundle-root.cjs`.
- **Auth:** Supabase Auth (Google + Facebook native, LINE via server bridge in `api/auth/line/callback.js`, email magic link native). Portal page (`portal/index.html`) loads `@supabase/supabase-js` from CDN, reads `window.__MYTH_ENV__` (populated by `/api/public-env.js`), and uses `supabase.auth.signInWithOAuth` / `signInWithOtp` / `getSession`.
- **Payment:** Gumroad (current). `_GUMROAD_SUBSCRIBE_URL` at index.html ~L4787 points at the active product. Buyer flow opens Gumroad checkout, Gumroad sends a webhook to `/api/gumroad/webhook` which writes the order to `myth_orders` + (for subscriptions) `myth_subscriptions`. The `/api/me/plan` endpoint reads `myth_subscriptions.status === 'active'` for the logged-in user. Migration arc: Stripe (rejected — Thai entity) → LemonSqueezy (briefly live mid-2026-05) → Gumroad (2026-05-28+, current). Old `api/lemonsqueezy/*` endpoints may still exist as historical files but are no longer called.
- **Backend:** Vercel serverless functions under `api/`. Active endpoints:
  - `api/auth/line/callback.js`        — LINE OAuth bridge → Supabase magic link
  - `api/gumroad/webhook.js`            — Gumroad webhook → writes myth_orders / myth_subscriptions
  - `api/me/plan.js`                    — Returns the logged-in user's plan (active/inactive) for client gating
  - (Historical, no longer called) `api/lemonsqueezy/*` from the brief LS era
  - `api/public-env.js`                — emits `window.__MYTH_ENV__` for the browser
- **Database:** Supabase project **`woamqrhifuxsscnihqco`** (woam). Personal/Mythsensus project — DO NOT confuse with Yoohui's `jahxcwqwajrzjeiaaozo` (jah). Mythsensus reads/writes via Data API + `SUPABASE_SERVICE_ROLE_KEY`. Tables: `myth_profiles`, `myth_subscriptions`, `myth_orders` (all RLS-on).

  **Project ownership note:** woam is a separate Supabase organization from Yoohui's "Yoohui AI Ecosystem" org. The workspace-level `SB_MGMT_TOKEN` (in `D:/Claude works here/.env`) does NOT have Management API access to woam — schema changes must be applied via the Supabase dashboard SQL editor at https://supabase.com/dashboard/project/woamqrhifuxsscnihqco/sql/new, not via `mcp__supabase__apply_migration`.

## Auth + Payment migration history (2026-05-26)

Old setup (now in `_legacy/`):
- `_legacy/auth/{google,facebook,magic}/` — custom OAuth callbacks that wrote to `public.users` (table never existed → all writes were silent no-ops → all sessions had `user_id: null`). Note: these wrote to whatever `SUPABASE_URL` env var pointed at, which has been woam in production all along.
- `_legacy/stripe/create-checkout-session.js` — Stripe Checkout (account rejected — Thai entity limitation).

New setup:
- Supabase Auth handles Google/Facebook/email natively (Supabase Auth was already in production use on woam before the rewrite — emails like `chaiyapat.c@yoohui.co.th` and `garsell@hotmail.com` already had accounts).
- Schema migration `migrations/001_auth_payment_schema.sql` applied to **woam** via the dashboard SQL editor on 2026-05-26 (not via MCP — see ownership note above).
- LINE Login keeps the existing channel — server callback bridges into Supabase via the admin `generate_link` API so users still end up with a real Supabase session.
- Gumroad is the current Merchant of Record → handles card processing, VAT/tax, refunds, chargebacks. No Thai business entity required. (Earlier brief LemonSqueezy era already swapped to Gumroad as of 2026-05-28 — see sw.js v8 changelog.)
- Portal writes a legacy-shaped `ms_token` to `localStorage` whenever the Supabase session changes, so the unrefactored 2.5MB `index.html` keeps working without changes.

**Why this CLAUDE.md previously said jah (corrected 2026-05-26):** earlier notes assumed Mythsensus shared Yoohui's jah project. Vercel env vars revealed it actually uses woam. Don't confuse the two — jah is Yoohui office DB (do not pollute with Mythsensus tables), woam is the personal/Mythsensus DB.

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
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only — never expose to the browser. Used by LINE callback + Gumroad webhook. |
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

### Gumroad
| Variable | Notes |
|----------|-------|
| `GUMROAD_ACCESS_TOKEN`   | Server-side API token from Gumroad → Settings → Advanced → Applications |
| `GUMROAD_WEBHOOK_SECRET` | Used to verify HMAC on incoming Gumroad webhooks |
| `GUMROAD_PRODUCT_ID`     | Permalink/ID of the subscription product (currently `tlkfx`) |

### Gumroad products checklist
The app paywall (`_purchasePaywall` in index.html ~L4910 + `_GUMROAD_PRODUCTS` map ~L4865)
expects ONE subscription product (currently live) + 9 one-time products. Until each
one-time `url` is filled in, the paywall's "Unlock $X" button falls back to the
subscription URL (still works, just bypasses the per-item flow).

| Product | Price | Type | `_GUMROAD_PRODUCTS` key | Permalink | Status |
|---|---:|---|---|---|---|
| Mythsensus Subscription — Monthly tier | $8.99/mo | Subscription | (subscribe url) | `tlkfx` ?recurrence=monthly | ⚠ Director must update Monthly tier price 499→899 cents via dashboard (API doesn't support tier price update for membership products — confirmed 2026-06-01) |
| Mythsensus Subscription — Annual tier | $89.99/yr | Subscription | (subscribe url) | `tlkfx` ?recurrence=yearly | ⚠ Director must update Annual tier price 4999→8999 cents via dashboard. **NOTE: same product `tlkfx`, just different recurrence tier** — no new product needed (Gumroad tiered-membership pattern) |
| Deep Reading (any system) | $9 | One-time | `deep` | `oziji` | ✓ created (draft) — review + publish |
| Divine Mirror | $9 | One-time | `mirror` | `luqkbx` | ✓ created (draft) — review + publish |
| Cosmic Pet | $5 | One-time | `pet` | `nxezj` | ✓ created (draft) — review + publish |
| Spirit Companions | $7 | One-time | `companions` | `wlgmbp` | ✓ created (draft) — review + publish |
| Cosmic Exercise | $7 | One-time | `exercise` | `intvj` | ✓ created (draft) — review + publish |
| Cosmic Food | $7 | One-time | `food` | `vwzkgz` | ✓ created (draft) — review + publish |
| Product Personality | $5 | One-time | `product` | `howzdo` | ✓ created (draft) — review + publish |
| Compatibility Check | $9 | One-time | `compat` | `mdjeln` | ✓ created (draft) — review + publish |
| Full Report (43-page PDF) | $19 | One-time | `full_report` | `mbkayz` | ✓ created (draft) — review + publish |

**Before launching:** open each draft product on Gumroad dashboard → review the
auto-generated description (currently English-only one-liner from
`_qa-out/gumroad-create-9.cjs`) → add a cover image + Thai copy if desired →
click **Publish**. The paywall already points to the correct URLs; once a
product is published the button works end-to-end.

**Webhook contract:** `api/gumroad/webhook.js` should read the incoming
`product_permalink` and grant the matching item — e.g. write
`mth_purchases[<itemKey>:<chartHash>] = true` (chart hash provided by the
buyer in a Gumroad custom field at checkout, or derived from the buyer email's
saved chart). For subscription pings (`tlkfx`) it should set `users.plan = 'premium'`
on the buyer email.

**To add a NEW product later (e.g. Tier-2 add-on):**
1. Run `node _qa-out/gumroad-create-9.cjs` after extending the `PRODUCTS` array.
2. The script defaults to `published: false` so nothing goes live by accident.
3. Paste the new entry into `_GUMROAD_PRODUCTS` in index.html — no rebuild needed.
4. Webhook handler picks it up from `product_permalink` automatically.

(Legacy — kept for reference, no longer required.)
LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET — drop from Vercel env vars.

### Other
| Variable | Notes |
|----------|-------|
| `SITE_URL` | `https://mythsensus.com` (fallback hardcoded) |
| `ANTHROPIC_API_KEY` | Reserved for future AI features (currently unused at runtime) |

### Webhook setup checklist
1. Gumroad dashboard → Settings → Advanced → Ping (webhooks) → Add
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
