'use client'
// ============================================================
//  app/portal/layout.tsx — Portal shell (sidebar + main)
//  Shared by all /portal/* pages.
// ============================================================
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState }    from 'react'
import { createSupabaseBrowser }  from '@/lib/supabase'
import { PORTAL_PATHS, LAYOUT }   from '@/lib/constants'
import { COLORS, FONTS, FONT_SIZE, SPACE } from '@/lib/theme'

// ── Navigation definition ─────────────────────────────────────
// Add / reorder items here — never scatter nav items in multiple files
const NAV = [
  { href: PORTAL_PATHS.ROOT,     icon: '✦', label: 'Dashboard'   },
  { href: PORTAL_PATHS.GODS,     icon: '⚡', label: 'God Blessing' },
  { href: PORTAL_PATHS.SKY,      icon: '🪐', label: 'Today Sky'   },
  { href: PORTAL_PATHS.ORGANUM,  icon: '📿', label: '108 Organum' },
  { href: PORTAL_PATHS.PROFILES, icon: '👤', label: 'Profiles'    },
  { href: PORTAL_PATHS.BILLING,  icon: '💳', label: 'Billing'     },
] as const

// ── Sidebar component (extracted for readability) ─────────────
function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createSupabaseBrowser()

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
    } finally {
      // Navigate regardless of signOut result
      router.push('/')
    }
  }

  return (
    <aside style={{
      width:        LAYOUT.SIDEBAR_WIDTH,
      flexShrink:   0,
      background:   COLORS.bg.raised,
      borderRight:  `1px solid ${COLORS.border.subtle}`,
      display:      'flex',
      flexDirection:'column',
      padding:      `${SPACE['5']}px 0`,
    }}>

      {/* Brand */}
      <Link href="/" style={{
        fontFamily:    FONTS.heading,
        fontSize:      FONT_SIZE.md,
        color:         COLORS.gold.bright,
        letterSpacing: 3,
        textDecoration:'none',
        padding:       `0 ${SPACE['5']}px ${SPACE['5']}px`,
        borderBottom:  `1px solid ${COLORS.border.subtle}`,
        display:       'block',
      }}>
        MYTHSENSUS
      </Link>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: `${SPACE['3']}px 0` }}>
        {NAV.map(n => {
          // Exact match for root, prefix match for sub-routes
          const active = n.href === PORTAL_PATHS.ROOT
            ? pathname === n.href
            : pathname.startsWith(n.href)

          return (
            <Link key={n.href} href={n.href} style={{
              display:        'flex',
              alignItems:     'center',
              gap:            SPACE['2'],
              padding:        `${SPACE['2']}px ${SPACE['5']}px`,
              textDecoration: 'none',
              fontSize:       FONT_SIZE.md,
              background:     active ? COLORS.bg.card    : 'transparent',
              color:          active ? COLORS.gold.bright : COLORS.text.faint,
              borderLeft:     active ? `3px solid ${COLORS.gold.bright}` : '3px solid transparent',
              transition:     'background 0.15s',
            }}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div style={{ padding: `${SPACE['4']}px ${SPACE['5']}px`, borderTop: `1px solid ${COLORS.border.subtle}` }}>
        <div style={{
          marginBottom:  SPACE['2'],
          color:         COLORS.text.faint,
          fontSize:      FONT_SIZE.xs,
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>
          {userEmail || '…'}
        </div>
        <button onClick={handleSignOut} style={{
          background:   'transparent',
          border:       `1px solid ${COLORS.border.default}`,
          color:        COLORS.text.faint,
          padding:      `${SPACE['1']}px ${SPACE['3']}px`,
          borderRadius: 6,
          cursor:       'pointer',
          fontSize:     FONT_SIZE.xs,
          width:        '100%',
        }}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ── Layout wrapper ────────────────────────────────────────────
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const supabase = createSupabaseBrowser()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/?auth=1')
      } else {
        setEmail(data.user.email ?? '')
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      display:    'flex',
      minHeight:  '100vh',
      fontFamily: FONTS.body,
      background: COLORS.bg.page,
      color:      COLORS.text.primary,
    }}>
      <Sidebar userEmail={email} />

      <main style={{
        flex:      1,
        overflowY: 'auto',
        padding:   `${SPACE['8']}px ${LAYOUT.PORTAL_PADDING}px`,
        maxWidth:  LAYOUT.CONTENT_MAX_WIDTH,
      }}>
        {children}
      </main>
    </div>
  )
}
