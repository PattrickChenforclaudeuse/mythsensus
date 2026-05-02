// ============================================================
//  lib/stripe.ts — Stripe client + product catalogue
//  SERVER-SIDE ONLY. Never import in 'use client' components.
// ============================================================
import Stripe from 'stripe'
import { PRICE_CENTS, PLAN } from './constants'

// Pin the API version here — update intentionally when Stripe releases breaking changes
const STRIPE_API_VERSION = '2024-06-20' as const

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: STRIPE_API_VERSION,
  typescript: true,
})

// ── Product catalogue ─────────────────────────────────────────
// price_id values come from .env.local — never hardcode them.
// Add new products here; update STRIPE_PRICE_* env vars to match.
export const PRODUCTS = {
  premium_report: {
    price_id:    process.env.STRIPE_PRICE_PREMIUM_REPORT!,
    mode:        'payment'      as const,
    amount:      PRICE_CENTS.PREMIUM_REPORT,
    label:       'Premium Report',
    description: 'One-time full cosmic blueprint — $49',
  },
  subscription: {
    price_id:    process.env.STRIPE_PRICE_SUBSCRIPTION!,
    mode:        'subscription' as const,
    amount:      PRICE_CENTS.SUBSCRIPTION,
    label:       'Monthly Subscription',
    description: 'Unlimited oracle + daily gods + full transits — $9/mo',
  },
  addon_mirror: {
    price_id:    process.env.STRIPE_PRICE_ADDON_MIRROR!,
    mode:        'payment' as const,
    amount:      900,
    label:       'Divine Mirror',
    description: 'Famous person comparison — $9',
  },
  addon_compat: {
    price_id:    process.env.STRIPE_PRICE_ADDON_COMPAT!,
    mode:        'payment' as const,
    amount:      1200,
    label:       'Compatibility Report',
    description: 'Relationship cosmic match — $12',
  },
  addon_names: {
    price_id:    process.env.STRIPE_PRICE_ADDON_NAMES!,
    mode:        'payment' as const,
    amount:      500,
    label:       'Alias Unlock',
    description: 'Unlimited alternate name reading — $5',
  },
  addon_stars: {
    price_id:    process.env.STRIPE_PRICE_ADDON_STARS!,
    mode:        'payment' as const,
    amount:      900,
    label:       'Star Companions',
    description: 'Cosmic companions pack — $9',
  },
  addon_flow: {
    price_id:    process.env.STRIPE_PRICE_ADDON_FLOW!,
    mode:        'payment' as const,
    amount:      900,
    label:       'Element Flow',
    description: 'Element flow analysis — $9',
  },
  addon_boost: {
    price_id:    process.env.STRIPE_PRICE_ADDON_BOOST!,
    mode:        'payment' as const,
    amount:      900,
    label:       'Ritual Boost',
    description: 'Daily ritual recommendations — $9',
  },
} as const

export type ProductKey = keyof typeof PRODUCTS
export type Product    = typeof PRODUCTS[ProductKey]

// ── Tier mapping — Stripe product → Supabase subscription tier ─
const PRODUCT_TIER_MAP: Partial<Record<ProductKey, string>> = {
  premium_report: PLAN.PREMIUM,
  subscription:   PLAN.SUBSCRIPTION,
}

export function tierFromProduct(key: ProductKey): string {
  return PRODUCT_TIER_MAP[key] ?? key   // addons keep their key as tier
}

// ── Price ID lookup (for webhook event metadata validation) ───
export function productFromPriceId(priceId: string): ProductKey | null {
  const entry = Object.entries(PRODUCTS).find(
    ([, v]) => v.price_id === priceId
  )
  return entry ? (entry[0] as ProductKey) : null
}
