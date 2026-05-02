# Mythsensus — Code Structure Guide

> For any engineer picking this up. Read this before touching anything.

---

## Directory Map

```
report-engine/
├── app/                   ← Next.js App Router (pages + API routes)
│   ├── api/               ← Server-side API handlers (no UI)
│   │   ├── checkout/      ← POST /api/checkout — Stripe checkout
│   │   ├── generate/      ← POST /api/generate — 26-system calc + report
│   │   ├── gods/draw/     ← POST /api/gods/draw — daily god blessing
│   │   ├── organum/       ← POST /api/organum — 108-god oracle (Claude)
│   │   ├── report/[uuid]/ ← GET  /api/report/:uuid — fetch report HTML
│   │   ├── sky/           ← GET  /api/sky — planetary transits
│   │   └── webhook/stripe/← POST /api/webhook/stripe — Stripe events
│   ├── portal/            ← Authenticated portal pages
│   │   ├── layout.tsx     ← Sidebar shell (shared by all /portal/* pages)
│   │   ├── page.tsx       ← Dashboard
│   │   ├── gods/          ← Daily god draw page
│   │   ├── sky/           ← Today's sky / transits
│   │   ├── organum/       ← 108-god oracle UI
│   │   ├── profiles/      ← Manage birth profiles
│   │   └── billing/       ← Plans + upgrade
│   ├── report/[uuid]/     ← Public report viewer (no auth required)
│   ├── onboarding/        ← 3-step birth data + payment flow
│   ├── layout.tsx         ← Root layout (fonts, meta, global styles)
│   ├── page.tsx           ← Landing page (marketing + auth modal)
│   └── globals.css        ← CSS reset + animations + print styles
│
├── components/
│   └── ui/                ← Shared presentational components
│       ├── Card.tsx       ← Card, UpgradeCard, SectionLabel
│       ├── Button.tsx     ← Button (variants), LinkButton
│       ├── StatCard.tsx   ← StatCard, TierBadge
│       ├── PageHeader.tsx ← Portal page header (eyebrow + h1 + subtitle)
│       └── index.ts       ← Barrel export — import { Card } from '@/components/ui'
│
├── hooks/                 ← Shared React hooks ('use client' only)
│   ├── useAuth.ts         ← User + subscription plan state
│   └── useDailyLimit.ts   ← Daily usage count for gods/organum
│
├── lib/                   ← Server + shared utilities
│   ├── constants.ts       ← ALL magic numbers, string enums, table names
│   ├── types.ts           ← ALL shared TypeScript interfaces
│   ├── theme.ts           ← Design tokens (colors, spacing, fonts)
│   ├── env.ts             ← Validated environment variables
│   ├── errors.ts          ← AppError classes + withErrorHandler()
│   ├── supabase.ts        ← Three Supabase clients (server/browser/admin)
│   ├── stripe.ts          ← Stripe client + product catalogue
│   ├── calc.ts            ← 26-system calculation engine (48K lines, pure)
│   └── report.ts          ← HTML report generator
│
├── data/                  ← Static JSON data files
│   ├── gods.json          ← 999 gods with tier/blessing/element
│   ├── countries.json     ← Countries → Wuxing element mapping
│   └── domains.json       ← Job domains → Wuxing element mapping
│
├── supabase/              ← Database migrations
│   ├── migration.sql      ← Initial schema
│   └── migration_patch.sql← ALTER TABLE patches (add missing columns)
│
├── middleware.ts           ← Session refresh + /portal auth guard
├── next.config.mjs        ← Next.js config (JSON imports, etc.)
└── .env.local.example     ← Copy → .env.local, fill in all keys
```

---

## Rules (read before writing code)

### 1. One source of truth per concern

| What | Where |
|------|-------|
| Magic numbers, limits, table names | `lib/constants.ts` |
| TypeScript interfaces | `lib/types.ts` |
| Colors, spacing, fonts | `lib/theme.ts` |
| Environment variables | `lib/env.ts` (validated at startup) |
| Stripe products + prices | `lib/stripe.ts` |
| DB table names | `TABLES` constant in `lib/constants.ts` |

Never hardcode `'profiles'`, `'#d4aa50'`, `5` (daily limit), etc. in a page or route file.

### 2. API routes use `withErrorHandler`

```typescript
// Good ✓
async function handler(req: NextRequest): Promise<NextResponse> {
  // throw AppError subclasses instead of returning NextResponse directly
  if (!user) throw new UnauthorizedError()
  ...
  return NextResponse.json(result)
}
export const POST = withErrorHandler(handler)

// Bad ✗
export async function POST(req: NextRequest) {
  try { ... } catch (err) { return NextResponse.json({ error: '...' }, { status: 500 }) }
}
```

### 3. Portal pages use shared components

```typescript
// Good ✓
import { PageHeader, Card, StatCard } from '@/components/ui'
<PageHeader eyebrow="DAILY TRANSIT" title="Today Sky" />
<Card><StatCard label="Soul Frequency" value={732} /></Card>

// Bad ✗
<div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42' }}>DAILY TRANSIT</div>
<h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>Today Sky</h1>
```

### 4. Colors come from `lib/theme.ts`

```typescript
// Good ✓
import { COLORS } from '@/lib/theme'
style={{ color: COLORS.gold.bright }}

// Bad ✗
style={{ color: '#d4aa50' }}
```

### 5. Hooks abstract repetitive data fetching

```typescript
// Good ✓
const { user, plan, loading } = useAuth()
const { count } = useDailyLimit(TABLES.ORGANUM_SESSIONS, user?.id)

// Bad ✗
// Copy-pasting supabase.auth.getUser() + subscriptions query in every page
```

### 6. DB table names come from `TABLES` constant

```typescript
import { TABLES } from '@/lib/constants'
supabase.from(TABLES.PROFILES)        // ✓
supabase.from('profiles')             // ✗
supabase.from('user_profiles')        // ✗ (old name, wrong)
```

---

## Adding a new feature

### New portal page

1. Create `app/portal/your-feature/page.tsx`
2. Add route to `PORTAL_PATHS` in `lib/constants.ts`
3. Add nav item to `NAV` array in `app/portal/layout.tsx`
4. Use `PageHeader` + `Card` from `@/components/ui`
5. Use `useAuth()` hook for user/plan state

### New API route

1. Create `app/api/your-route/route.ts`
2. Add path to `API_ROUTES` in `lib/constants.ts`
3. Wrap handler with `withErrorHandler()`
4. Throw typed errors: `UnauthorizedError`, `BadRequestError`, etc.
5. Add any new DB table names to `TABLES` constant

### New design color/spacing

1. Add to `lib/theme.ts` (TypeScript constant)
2. Add matching CSS variable to `app/globals.css` if needed for animations/print

---

## Environment variables

All required: copy `.env.local.example` → `.env.local`, fill in:
- Supabase: URL + anon key + service role key
- Stripe: secret key + webhook secret + 8 price IDs
- Anthropic: API key
- Optional: Resend (email), Cloudflare R2 (PDF storage)

`lib/env.ts` will throw a clear error at startup if any required var is missing.

---

## QA constraints (never violate)

| Code | Rule |
|------|------|
| QA-1 | All astrological values from `calc()` only — never hardcode |
| QA-2 | ??? overflow event: log `draw_overflow_flag:true` only — never name it |
| QA-3 | Today Sky: never say "good day" or "bad day" — positions only |
| QA-5 | God draw seed = `birthTimestamp XOR dayEpoch` — deterministic |
| QA-6 | COGS < $0.15/report — keep Claude prompts small, no full chart in prompt |
| QA-7 | Always verify Stripe webhook signature — never skip |
