// ============================================================
//  lib/theme.ts — Design tokens (colors, spacing, fonts)
//  Change a color here → changes everywhere.
//  Import in both server components and 'use client' components.
// ============================================================

// ── Color palette ──────────────────────────────────────────────
export const COLORS = {
  // Base backgrounds
  bg: {
    page:    '#050403',
    surface: '#0a0806',
    raised:  '#111009',
    card:    '#1a1510',
    overlay: '#1a1510ee',
  },

  // Borders
  border: {
    subtle:  '#1a1510',
    default: '#2a2010',
    strong:  '#3a3020',
    focus:   '#6a5a42',
  },

  // Brand gold
  gold: {
    bright: '#d4aa50',
    mid:    '#b89040',
    dim:    '#9a7830',
    muted:  '#6a5a42',
    dark:   '#4a3a2a',
    deeper: '#2a1a0a',
  },

  // Text
  text: {
    primary:   '#f0e8d0',
    secondary: '#c8c0a8',
    muted:     '#9a8a72',
    faint:     '#6a5a42',
    disabled:  '#4a3a2a',
  },

  // Status
  status: {
    agree:   '#4aaa4a',
    warn:    '#f0a080',
    neutral: '#aaaa4a',
    error:   '#aa5a4a',
    info:    '#4090c0',
  },

  // Tier colors — indexed by English tier name (lowercase)
  tier: {
    celestial: '#d4aa50',
    radiant:   '#9a8a72',
    luminous:  '#6a8a4a',
    resonant:  '#4a6a9a',
    grounded:  '#6a5a42',
    seeking:   '#7a5a42',
    emerging:  '#4a3a2a',
    // fallback
    default:   '#3a3020',
  } as Record<string, string>,

  // Upgrade / subscribe prompt
  upgrade: {
    bg:     '#0a0f14',
    border: '#204060',
    text:   '#4090c0',
    button: 'linear-gradient(135deg,#0a3050,#1060a0)',
  },
} as const

// ── Spacing scale (px) ────────────────────────────────────────
export const SPACE = {
  '1':  4,
  '2':  8,
  '3':  12,
  '4':  16,
  '5':  20,
  '6':  24,
  '8':  32,
  '10': 40,
  '12': 48,
} as const

// ── Border radius ─────────────────────────────────────────────
export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   14,
  pill: 20,
} as const

// ── Typography ────────────────────────────────────────────────
export const FONTS = {
  body:    "'Sarabun','Noto Sans Thai',sans-serif",
  heading: "'Cinzel',serif",
  mono:    "'Courier New',monospace",
} as const

export const FONT_SIZE = {
  xs:   11,
  sm:   12,
  base: 13,
  md:   14,
  lg:   15,
  xl:   16,
  '2xl':20,
  '3xl':22,
  '4xl':28,
} as const

// ── Layout ────────────────────────────────────────────────────
export const LAYOUT = {
  SIDEBAR_WIDTH:     200,
  CONTENT_MAX_WIDTH: 900,
  PORTAL_PADDING:    32,
} as const

// ── Helper: get tier color ────────────────────────────────────
export function tierColor(tier?: string | null): string {
  if (!tier) return COLORS.tier.default
  return COLORS.tier[tier.toLowerCase()] ?? COLORS.tier.default
}

// ── Helper: gradient buttons ──────────────────────────────────
export const GRADIENTS = {
  gold:    'linear-gradient(135deg,#8a6010,#d4aa50)',
  upgrade: 'linear-gradient(135deg,#0a3050,#1060a0)',
  warn:    'linear-gradient(135deg,#501010,#a04040)',
} as const
