'use client'
// ============================================================
//  components/ui/Button.tsx — Reusable button variants
// ============================================================
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { COLORS, FONTS, RADIUS, SPACE, GRADIENTS } from '@/lib/theme'

type ButtonVariant = 'primary' | 'secondary' | 'upgrade' | 'danger' | 'ghost'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  children:  ReactNode
}

const VARIANT_STYLES: Record<ButtonVariant, { background: string; color: string; border: string }> = {
  primary:   { background: GRADIENTS.gold,    color: COLORS.bg.page,      border: 'none' },
  secondary: { background: COLORS.bg.raised,  color: COLORS.text.muted,   border: `1px solid ${COLORS.border.strong}` },
  upgrade:   { background: GRADIENTS.upgrade, color: COLORS.upgrade.text, border: 'none' },
  danger:    { background: GRADIENTS.warn,    color: COLORS.text.primary,  border: 'none' },
  ghost:     { background: 'transparent',     color: COLORS.text.muted,   border: `1px solid ${COLORS.border.default}` },
}

const SIZE_STYLES: Record<ButtonSize, { padding: string; fontSize: number; borderRadius: number }> = {
  sm: { padding: `${SPACE['1']}px ${SPACE['3']}px`, fontSize: 12, borderRadius: RADIUS.sm },
  md: { padding: `${SPACE['3']}px ${SPACE['5']}px`, fontSize: 14, borderRadius: RADIUS.sm },
  lg: { padding: `${SPACE['4']}px ${SPACE['8']}px`, fontSize: 15, borderRadius: RADIUS.md },
}

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  const v = VARIANT_STYLES[variant]
  const s = SIZE_STYLES[size]

  return (
    <button
      disabled={isDisabled}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        justifyContent:'center',
        gap:           SPACE['2'],
        fontFamily:    FONTS.body,
        fontWeight:    700,
        cursor:        isDisabled ? (loading ? 'wait' : 'not-allowed') : 'pointer',
        opacity:       isDisabled && !loading ? 0.4 : 1,
        transition:    'opacity 0.15s',
        border:        v.border,
        background:    isDisabled && !loading ? COLORS.bg.raised : v.background,
        color:         isDisabled && !loading ? COLORS.text.disabled : v.color,
        ...s,
        ...style,
      }}
      {...rest}
    >
      {loading ? '⏳ ' : ''}{children}
    </button>
  )
}

// ── Link-styled button (for navigating) ───────────────────────
interface LinkButtonProps {
  href:      string
  children:  ReactNode
  variant?:  ButtonVariant
  size?:     ButtonSize
  style?:    React.CSSProperties
}

export function LinkButton({ href, children, variant = 'upgrade', size = 'md', style }: LinkButtonProps) {
  const v = VARIANT_STYLES[variant]
  const s = SIZE_STYLES[size]
  return (
    <a
      href={href}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     FONTS.body,
        fontWeight:     700,
        textDecoration: 'none',
        border:         v.border,
        background:     v.background,
        color:          v.color,
        ...s,
        ...style,
      }}
    >
      {children}
    </a>
  )
}
