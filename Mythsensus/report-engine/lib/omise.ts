// ============================================================
//  lib/omise.ts — Omise payment client + product catalogue
//  SERVER-SIDE ONLY. Never import in 'use client' components.
//  Docs: https://www.omise.co/docs
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Omise = require('omise')

export const omise = Omise({
  publicKey:  process.env.OMISE_PUBLIC_KEY,
  secretKey:  process.env.OMISE_SECRET_KEY,
})

// ── Product catalogue ─────────────────────────────────────────
// amount = smallest currency unit (satang for THB, cents for USD)
// THB: $49 ≈ 1,750 THB | $9 ≈ 320 THB
export const OMISE_PRODUCTS = {
  premium_report: {
    amount:      175000,     // 1,750 THB (one-time)
    currency:    'thb',
    mode:        'one_time'  as const,
    label:       'Premium Report',
    description: 'Cosmic Blueprint รายงานครบ 26 ระบบ',
  },
  subscription: {
    amount:      32000,      // 320 THB/mo
    currency:    'thb',
    mode:        'recurring' as const,
    label:       'Monthly Subscription',
    description: 'Oracle + God Blessing + Today Sky ไม่จำกัด',
    plan_id:     process.env.OMISE_PLAN_ID_SUB ?? '',
  },
  addon_mirror: {
    amount:      32000,
    currency:    'thb',
    mode:        'one_time' as const,
    label:       'Divine Mirror',
    description: 'เปรียบเทียบกับบุคคลมีชื่อเสียง',
  },
  addon_compat: {
    amount:      42000,
    currency:    'thb',
    mode:        'one_time' as const,
    label:       'Compatibility Report',
    description: 'ความเข้ากันได้เชิงจักรวาล',
  },
  addon_names: {
    amount:      18000,
    currency:    'thb',
    mode:        'one_time' as const,
    label:       'Alias Unlock',
    description: 'อ่านชื่อเล่น / ชื่อธุรกิจไม่จำกัด',
  },
  addon_flow: {
    amount:      32000,
    currency:    'thb',
    mode:        'one_time' as const,
    label:       'Element Flow',
    description: 'วิเคราะห์การไหลของธาตุ',
  },
  addon_boost: {
    amount:      32000,
    currency:    'thb',
    mode:        'one_time' as const,
    label:       'Ritual Boost',
    description: 'พิธีกรรมเสริมพลังรายวัน',
  },
} as const

export type OmiseProductKey = keyof typeof OMISE_PRODUCTS
export type OmiseProduct    = typeof OMISE_PRODUCTS[OmiseProductKey]

// ── Plan / tier mapping ───────────────────────────────────────
export function tierFromOmiseProduct(key: OmiseProductKey): string {
  if (key === 'premium_report') return 'premium'
  if (key === 'subscription')   return 'sub'
  return key
}

// ── Format amount for display ─────────────────────────────────
export function formatOmiseAmount(amount: number, currency: string): string {
  const major = amount / 100
  if (currency === 'thb') return `฿${major.toLocaleString('th-TH')}`
  return `$${major.toFixed(2)}`
}
