// ============================================================
//  lib/env.ts — Environment variable validation
//  Validated ONCE at module load. Crashes early with a clear
//  message if a required var is missing — not silently at
//  runtime inside a request handler.
// ============================================================

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
      `Copy .env.local.example → .env.local and fill in all values.`
    )
  }
  return value
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

// ── Validated env object — use this everywhere ────────────────
// (Only imported server-side; never import in 'use client' files)
export const env = {
  // Supabase
  SUPABASE_URL:              requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY:         requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // Stripe
  STRIPE_SECRET_KEY:         requireEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET:     requireEnv('STRIPE_WEBHOOK_SECRET'),
  STRIPE_PRICE_PREMIUM:      requireEnv('STRIPE_PRICE_PREMIUM_REPORT'),
  STRIPE_PRICE_SUB:          requireEnv('STRIPE_PRICE_SUBSCRIPTION'),
  STRIPE_PRICE_ADDON_NAMES:  optionalEnv('STRIPE_PRICE_ADDON_NAMES'),
  STRIPE_PRICE_ADDON_STARS:  optionalEnv('STRIPE_PRICE_ADDON_STARS'),
  STRIPE_PRICE_ADDON_COMPAT: optionalEnv('STRIPE_PRICE_ADDON_COMPAT'),
  STRIPE_PRICE_ADDON_MIRROR: optionalEnv('STRIPE_PRICE_ADDON_MIRROR'),
  STRIPE_PRICE_ADDON_FLOW:   optionalEnv('STRIPE_PRICE_ADDON_FLOW'),
  STRIPE_PRICE_ADDON_BOOST:  optionalEnv('STRIPE_PRICE_ADDON_BOOST'),

  // Anthropic
  ANTHROPIC_API_KEY: requireEnv('ANTHROPIC_API_KEY'),

  // App
  SITE_URL: optionalEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),

  // Optional integrations
  RESEND_API_KEY:      optionalEnv('RESEND_API_KEY'),
  R2_ACCOUNT_ID:       optionalEnv('CLOUDFLARE_R2_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID:    optionalEnv('CLOUDFLARE_R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY:optionalEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_NAME:      optionalEnv('CLOUDFLARE_R2_BUCKET_NAME'),
  R2_PUBLIC_URL:       optionalEnv('CLOUDFLARE_R2_PUBLIC_URL'),
} as const

export type Env = typeof env
