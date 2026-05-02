'use client'
// ============================================================
//  components/ui/PageHeader.tsx — Consistent portal page header
//  Every portal page starts with the same header pattern.
// ============================================================
import { ReactNode } from 'react'
import { COLORS, FONTS, SPACE, FONT_SIZE } from '@/lib/theme'

interface PageHeaderProps {
  eyebrow:  string    // e.g. "DIVINE ORACLE"
  title:    string    // e.g. "108 Organum"
  subtitle?: string
  extra?:   ReactNode // optional badge / counter on the right
}

export function PageHeader({ eyebrow, title, subtitle, extra }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: SPACE['8'], display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: FONT_SIZE.xs, letterSpacing: 4, color: COLORS.text.faint, marginBottom: SPACE['1'] }}>
          {eyebrow}
        </div>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: FONT_SIZE['3xl'], color: COLORS.gold.bright, margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: FONT_SIZE.base, color: COLORS.text.faint, marginTop: SPACE['2'], marginBottom: 0 }}>
            {subtitle}
          </p>
        )}
      </div>
      {extra && <div>{extra}</div>}
    </div>
  )
}
