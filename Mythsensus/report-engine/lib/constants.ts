// ============================================================
//  lib/constants.ts — Single source of truth for all constants
//  Add a constant here, use it everywhere. Never hardcode.
// ============================================================

// ── Tier system ──────────────────────────────────────────────
export const TIERS = {
  CELESTIAL:  'Celestial',
  RADIANT:    'Radiant',
  LUMINOUS:   'Luminous',
  RESONANT:   'Resonant',
  GROUNDED:   'Grounded',
  SEEKING:    'Seeking',
  EMERGING:   'Emerging',
} as const

export type Tier = typeof TIERS[keyof typeof TIERS]

// ── Subscription / plan types ────────────────────────────────
export const PLAN = {
  FREE:         'free',
  PREMIUM:      'premium',
  SUBSCRIPTION: 'sub',
} as const

export type Plan = typeof PLAN[keyof typeof PLAN]

// ── God draw constants ───────────────────────────────────────
/** Weighted pool sizes for each rarity tier (total = 1000) */
export const TIER_WEIGHTS = {
  common:    400,
  uncommon:  270,
  rare:      180,
  epic:       90,
  legendary:  44,
  mythic:     16,
} as const

/** Probability of the ??? overflow event (1-in-1,000,000) */
export const OVERFLOW_PROBABILITY = 0.000001

/** Free users may draw once per calendar day */
export const DRAW_DAILY_LIMIT_FREE = 1

/** Seeded RNG constants (Mulberry32 parameters) */
export const RNG_SEED_MASK = 0xffffffff

// ── Organum (108 oracle) ─────────────────────────────────────
export const ORGANUM_FREE_DAILY_LIMIT = 5
export const ORGANUM_MAX_TOKENS = 400

// ── Cosmic score ─────────────────────────────────────────────
export const SCORE_WEIGHTS = {
  soulFrequency:    0.4,
  lifeTerrain:      0.3,
  pathResonance:    0.3,
} as const

// ── Pricing (USD, in cents for Stripe) ───────────────────────
export const PRICE_CENTS = {
  PREMIUM_REPORT: 4900,   // $49
  SUBSCRIPTION:    900,   // $9/mo
} as const

// ── Date / time utilities ─────────────────────────────────────
export const MS_PER_DAY       = 86_400_000
export const SECONDS_PER_DAY  = 86_400

// ── Report ───────────────────────────────────────────────────
export const REPORT_TYPES = {
  FULL:        'full',
  COMPANION:   'companion',
  ELEMENT:     'element',
} as const

export const REPORT_STATUS = {
  PENDING: 'pending',
  READY:   'ready',
  FAILED:  'failed',
} as const

// ── API route paths ───────────────────────────────────────────
export const API_ROUTES = {
  GENERATE:        '/api/generate',
  CHECKOUT:        '/api/checkout',
  WEBHOOK_STRIPE:  '/api/webhook/stripe',
  GODS_DRAW:       '/api/gods/draw',
  ORGANUM:         '/api/organum',
  SKY:             '/api/sky',
  REPORT:          '/api/report',
} as const

// ── Portal page paths ─────────────────────────────────────────
export const PORTAL_PATHS = {
  ROOT:      '/portal',
  GODS:      '/portal/gods',
  SKY:       '/portal/sky',
  ORGANUM:   '/portal/organum',
  PROFILES:  '/portal/profiles',
  BILLING:   '/portal/billing',
} as const

// ── Database table names ─────────────────────────────────────
export const TABLES = {
  PROFILES:         'profiles',
  REPORTS:          'reports',
  GOD_DRAWS:        'god_draws',
  ORGANUM_SESSIONS: 'organum_sessions',
  SUBSCRIPTIONS:    'subscriptions',
  PDF_RENDERS:      'pdf_renders',
  STREAKS:          'streaks',
  PROMO_CODES:      'promo_codes',
} as const

// ── Default fallbacks ─────────────────────────────────────────
export const DEFAULTS = {
  NAME:       'ผู้ใช้',
  GENDER:     'ชาย',
  HOUR:       12,
  MINUTE:     0,
  LAT:        13.75,    // Bangkok
  LON:        100.5,
  TIMEZONE:   7,
  DM_ELEMENT: 'Fire',
} as const

// -- Layout dimensions ------------------------------------------
export const LAYOUT = {
  SIDEBAR_WIDTH:      240,
  PORTAL_PADDING:     32,
  CONTENT_MAX_WIDTH:  1200,
} as const
