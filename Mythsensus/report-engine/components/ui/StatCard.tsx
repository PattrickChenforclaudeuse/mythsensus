'use client'
// ============================================================
//  components/ui/StatCard.tsx — Score stat display card
//  Used in portal dashboard and report preview.
// ============================================================
import { COLORS, SPACE, RADIUS, FONT_SIZE } from '@/lib/theme'

interface StatCardProps {
  label:   string
  value:   string | number
  sub?:    string
  color?:  string
}

export function StatCard({ label, value, sub, color = COLORS.gold.bright }: StatCardProps) {
  return (
    <div style={{
      background:   COLORS.bg.raised,
      border:       `1px solid ${COLORS.border.default}`,
      borderRadius: RADIUS.md,
      padding:      `${SPACE['4']}px ${SPACE['5']}px`,
      flex:         1,
      minWidth:     120,
    }}>
      <div style={{ fontSize: FONT_SIZE.xs, letterSpacing: 3, color: COLORS.text.faint, marginBottom: SPACE['1'] }}>
        {label}
      </div>
      <div style={{ fontSize: FONT_SIZE['2xl'], fontWeight: 700, color }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.text.disabled, marginTop: SPACE['1'] }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Tier badge ────────────────────────────────────────────────
import { tierColor } from '@/lib/theme'

export function TierBadge({ tier }: { tier?: string | null }) {
  return (
    <span style={{
      display:      'inline-block',
      padding:      `${SPACE['1']}px ${SPACE['3']}px`,
      borderRadius: RADIUS.pill,
      background:   COLORS.bg.raised,
      border:       `1px solid ${tierColor(tier)}`,
      color:        tierColor(tier),
      fontSize:     FONT_SIZE.xs,
      fontWeight:   700,
      letterSpacing:2,
    }}>
      {tier ?? '—'}
    </span>
  )
}
