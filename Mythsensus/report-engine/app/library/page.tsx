import type { Metadata } from 'next'
import Link from 'next/link'
import { LIBRARY_SYSTEMS } from '@/lib/library'

export const metadata: Metadata = {
  title: 'Cosmic Library — 26 Ancient Wisdom Systems | Mythsensus',
  description: 'Explore the origins, legends, and philosophy of all 26 ancient wisdom systems synthesized by Mythsensus — from Western Astrology to Ifá, Norse Runes, BaZi, and Aboriginal Dreamtime.',
  keywords: 'astrology systems, BaZi history, Vedic astrology origin, Human Design legend, Norse runes mythology, cosmic library',
}

const REGION_COLORS: Record<string, string> = {
  'East Asia':        '#d4aa50',
  'South Asia':       '#c06040',
  'Europe / West':    '#6080d0',
  'Middle East':      '#a070c0',
  'Americas':         '#50a870',
  'Africa / Oceania': '#c08040',
  'Modern / Global':  '#40a0c0',
}

export default function LibraryIndex() {
  const regions = [
    'East Asia', 'South Asia', 'Europe / West',
    'Middle East', 'Americas', 'Africa / Oceania', 'Modern / Global',
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 11, letterSpacing: 5, color: '#6a5a42', marginBottom: 14 }}>
          MYTHSENSUS
        </div>
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(28px, 4vw, 44px)',
          color: '#d4aa50',
          lineHeight: 1.2,
          marginBottom: 20,
        }}>
          Cosmic Library
        </h1>
        <p style={{ color: '#9a8a72', fontSize: 15, maxWidth: 620, margin: '0 auto 12px', lineHeight: 1.7 }}>
          Every tradition on Earth has looked at the sky — and found you there.
          Explore the origins, legends, and philosophy of all 26 wisdom systems
          that form your Mythsensus Cosmic Score.
        </p>
        <div style={{ color: '#4a3a2a', fontSize: 12, letterSpacing: 2 }}>
          26 SYSTEMS · 6 CONTINENTS · 65,000 YEARS OF HUMAN WISDOM
        </div>
      </div>

      {/* By Region */}
      {regions.map(region => {
        const systems = LIBRARY_SYSTEMS.filter(s => s.region === region)
        if (!systems.length) return null
        const color = REGION_COLORS[region] || '#d4aa50'
        return (
          <div key={region} style={{ marginBottom: 48 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
            }}>
              <div style={{ width: 3, height: 20, background: color, borderRadius: 2 }} />
              <div style={{ fontSize: 11, letterSpacing: 3, color, textTransform: 'uppercase' }}>
                {region}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {systems.map(sys => (
                <Link
                  key={sys.slug}
                  href={`/library/${sys.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    background: '#0d0b08',
                    border: '1px solid #2a2010',
                    borderRadius: 12,
                    padding: '20px 22px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    height: '100%',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = color
                    ;(e.currentTarget as HTMLDivElement).style.background = '#111009'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2010'
                    ;(e.currentTarget as HTMLDivElement).style.background = '#0d0b08'
                  }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
                      <span style={{ fontSize: 26 }}>{sys.icon}</span>
                      <div>
                        <div style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: 13,
                          color: '#f0e8d0',
                          lineHeight: 1.3,
                          marginBottom: 3,
                        }}>
                          {sys.nameEn}
                        </div>
                        <div style={{ fontSize: 11, color: '#6a5a42' }}>
                          {sys.nameTh}
                        </div>
                      </div>
                    </div>
                    <p style={{
                      fontSize: 12,
                      color: '#9a8a72',
                      lineHeight: 1.6,
                      margin: '0 0 12px',
                    }}>
                      {sys.tagline}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, letterSpacing: 1,
                        color: '#4a3a2a',
                        background: '#1a1510',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}>
                        {sys.origin}
                      </span>
                      <span style={{
                        fontSize: 10, letterSpacing: 1,
                        color: color,
                        background: '#1a1510',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}>
                        {sys.age}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {/* Footer CTA */}
      <div style={{
        marginTop: 60,
        padding: '36px 32px',
        background: '#0d0b08',
        border: '1px solid #2a2010',
        borderRadius: 16,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 20,
          color: '#d4aa50',
          marginBottom: 12,
        }}>
          See What All 26 Systems Say About You
        </div>
        <p style={{ color: '#9a8a72', fontSize: 14, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
          Your Mythsensus Cosmic Score synthesizes every tradition above into a single consensus —
          42 pages that reveal where ancient wisdom agrees about who you are.
        </p>
        <Link href="/" style={{
          display: 'inline-block',
          background: '#d4aa50',
          color: '#050403',
          fontFamily: "'Cinzel', serif",
          fontSize: 13,
          letterSpacing: 2,
          padding: '12px 28px',
          borderRadius: 8,
          textDecoration: 'none',
        }}>
          GET YOUR COSMIC SCORE
        </Link>
      </div>

    </div>
  )
}
