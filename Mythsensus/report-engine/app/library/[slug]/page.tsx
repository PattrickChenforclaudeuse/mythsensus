import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getArticleMarkdown,
  getSystemBySlug,
  markdownToHtml,
  LIBRARY_SYSTEMS,
} from '@/lib/library'
import ArticleClient from './ArticleClient'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return LIBRARY_SYSTEMS.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sys = getSystemBySlug(params.slug)
  if (!sys) return {}
  return {
    title: `${sys.nameEn} — Origins, Legend & Philosophy | Mythsensus Cosmic Library`,
    description: sys.tagline + `. Explore the ancient history, mythology, and philosophy of ${sys.nameEn} — one of 26 wisdom systems in the Mythsensus Cosmic Score.`,
    keywords: `${sys.nameEn}, ${sys.nameTh}, astrology history, ${sys.origin}, cosmic library`,
    openGraph: {
      title: `${sys.nameEn} — ${sys.tagline}`,
      description: `Origins, legends, and core philosophy of ${sys.nameEn}, one of 26 ancient systems synthesized by Mythsensus.`,
    },
  }
}

export default function ArticlePage({ params }: Props) {
  const sys = getSystemBySlug(params.slug)
  if (!sys) notFound()

  const mdEn = getArticleMarkdown(params.slug, 'en')
  const mdTh = getArticleMarkdown(params.slug, 'th')

  if (!mdEn && !mdTh) notFound()

  const htmlEn = mdEn ? markdownToHtml(mdEn) : null
  const htmlTh = mdTh ? markdownToHtml(mdTh) : null

  // Find prev/next for navigation
  const idx = LIBRARY_SYSTEMS.findIndex(s => s.slug === params.slug)
  const prev = idx > 0 ? LIBRARY_SYSTEMS[idx - 1] : null
  const next = idx < LIBRARY_SYSTEMS.length - 1 ? LIBRARY_SYSTEMS[idx + 1] : null

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4a3a2a' }}>
        <Link href="/" style={{ color: '#4a3a2a', textDecoration: 'none' }}>Mythsensus</Link>
        <span>›</span>
        <Link href="/library" style={{ color: '#4a3a2a', textDecoration: 'none' }}>Cosmic Library</Link>
        <span>›</span>
        <span style={{ color: '#6a5a42' }}>{sys.nameEn}</span>
      </div>

      {/* System header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{sys.icon}</div>
        <div style={{ fontSize: 10, letterSpacing: 4, color: '#6a5a42', marginBottom: 8, textTransform: 'uppercase' }}>
          System {sys.id} of 26 · {sys.region}
        </div>
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(22px, 4vw, 34px)',
          color: '#d4aa50',
          lineHeight: 1.2,
          marginBottom: 8,
        }}>
          {sys.nameEn}
        </h1>
        <div style={{ color: '#6a5a42', fontSize: 14, marginBottom: 14 }}>{sys.nameTh}</div>
        <p style={{ color: '#9a8a72', fontSize: 14, fontStyle: 'italic', marginBottom: 18, lineHeight: 1.6 }}>
          {sys.tagline}
        </p>

        {/* Meta badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'ORIGIN', val: sys.origin },
            { label: 'AGE', val: sys.age },
            { label: 'REGION', val: sys.region },
          ].map(b => (
            <div key={b.label} style={{
              background: '#1a1510',
              border: '1px solid #2a2010',
              borderRadius: 6,
              padding: '6px 12px',
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a3a2a', marginBottom: 2 }}>{b.label}</div>
              <div style={{ fontSize: 12, color: '#c8c0a8' }}>{b.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Article with lang toggle */}
      <ArticleClient
        htmlEn={htmlEn}
        htmlTh={htmlTh}
        hasEn={!!mdEn}
        hasTh={!!mdTh}
      />

      {/* Divider */}
      <hr style={{ borderColor: '#1a1510', margin: '48px 0' }} />

      {/* CTA box */}
      <div style={{
        background: '#0d0b08',
        border: '1px solid #2a2010',
        borderRadius: 12,
        padding: '28px 28px',
        textAlign: 'center',
        marginBottom: 48,
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: '#d4aa50', marginBottom: 10 }}>
          See What {sys.nameEn} Reveals About You
        </div>
        <p style={{ color: '#9a8a72', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Your Mythsensus Cosmic Score synthesizes {sys.nameEn} together with 25 other
          ancient wisdom systems into one unified reading — 42 pages of consensus.
        </p>
        <Link href="/" style={{
          display: 'inline-block',
          background: '#d4aa50',
          color: '#050403',
          fontFamily: "'Cinzel', serif",
          fontSize: 12,
          letterSpacing: 2,
          padding: '11px 24px',
          borderRadius: 8,
          textDecoration: 'none',
        }}>
          GET YOUR COSMIC SCORE — $19
        </Link>
      </div>

      {/* Prev / Next navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        {prev ? (
          <Link href={`/library/${prev.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <div style={{
              background: '#0d0b08', border: '1px solid #1a1510', borderRadius: 10,
              padding: '16px 18px', fontSize: 12,
            }}>
              <div style={{ color: '#4a3a2a', marginBottom: 4, fontSize: 10, letterSpacing: 2 }}>← PREV</div>
              <div style={{ color: '#c8c0a8' }}>{prev.icon} {prev.nameEn}</div>
            </div>
          </Link>
        ) : <div style={{ flex: 1 }} />}

        {next ? (
          <Link href={`/library/${next.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <div style={{
              background: '#0d0b08', border: '1px solid #1a1510', borderRadius: 10,
              padding: '16px 18px', fontSize: 12, textAlign: 'right',
            }}>
              <div style={{ color: '#4a3a2a', marginBottom: 4, fontSize: 10, letterSpacing: 2 }}>NEXT →</div>
              <div style={{ color: '#c8c0a8' }}>{next.icon} {next.nameEn}</div>
            </div>
          </Link>
        ) : <div style={{ flex: 1 }} />}
      </div>

      {/* Back to library */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/library" style={{
          fontSize: 12, color: '#6a5a42', textDecoration: 'none', letterSpacing: 2,
        }}>
          ← BACK TO COSMIC LIBRARY
        </Link>
      </div>

    </div>
  )
}
