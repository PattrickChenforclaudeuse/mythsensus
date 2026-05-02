'use client'
// ============================================================
//  components/ui/Card.tsx — Reusable card container
//  Use this everywhere instead of repeating the same inline
//  background/border/radius styles on every page.
// ============================================================
import { CSSProperties, ReactNode } from 'react'
import { COLORS, RADIUS, SPACE } from '@/lib/theme'

interface CardProps {
  children:    ReactNode
  padding?:    number
  radius?:     number
  borderColor?: string
  className?:  string
  style?:      CSSProperties
  /** onClick makes the card interactive (hover cursor) */
  onClick?:    () => void
}

export function Card({
  children,
  padding    = SPACE['6'],
  radius     = RADIUS.lg,
  borderColor = COLORS.border.default,
  style,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background:   COLORS.bg.card,
        border:       `1px solid ${borderColor}`,
        borderRadius: radius,
        padding,
        cursor:       onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── Variant: upgrade / upsell card ───────────────────────────
export function UpgradeCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Card
      borderColor={COLORS.upgrade.border}
      style={{ background: COLORS.upgrade.bg, textAlign: 'center', ...style }}
    >
      {children}
    </Card>
  )
}

// ── Variant: section header label ────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize:      11,
      letterSpacing: 4,
      color:         COLORS.text.faint,
      marginBottom:  SPACE['2'],
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  )
}
