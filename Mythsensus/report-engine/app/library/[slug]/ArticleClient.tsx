'use client'
import { useState } from 'react'

interface Props {
  htmlEn: string | null
  htmlTh: string | null
  hasEn: boolean
  hasTh: boolean
}

export default function ArticleClient({ htmlEn, htmlTh, hasEn, hasTh }: Props) {
  const [lang, setLang] = useState<'en' | 'th'>(hasTh ? 'th' : 'en')
  const html = lang === 'th' ? htmlTh : htmlEn

  return (
    <>
      {/* Scoped article styles */}
      <style>{`
        .mythsensus-article h1 { display: none; }
        .mythsensus-article h2 {
          font-family: 'Cinzel', serif;
          font-size: 18px;
          color: #d4aa50;
          margin: 36px 0 14px;
          padding-bottom: 8px;
          border-bottom: 1px solid #1a1510;
          letter-spacing: 0.5px;
        }
        .mythsensus-article h3 {
          font-family: 'Cinzel', serif;
          font-size: 14px;
          color: #c8a840;
          margin: 24px 0 10px;
          letter-spacing: 0.5px;
        }
        .mythsensus-article p { margin: 0 0 18px; }
        .mythsensus-article strong { color: #f0e8d0; font-weight: 600; }
        .mythsensus-article em { color: #b8a888; font-style: italic; }
        .mythsensus-article hr {
          border: none;
          border-top: 1px solid #1a1510;
          margin: 32px 0;
        }
        .mythsensus-article blockquote {
          border-left: 3px solid #d4aa50;
          padding: 4px 0 4px 18px;
          margin: 20px 0;
          color: #9a8a72;
          font-style: italic;
        }
        .mythsensus-article ul {
          margin: 0 0 18px 22px;
          color: #9a8a72;
        }
        .mythsensus-article li { margin-bottom: 7px; line-height: 1.7; }
        .mythsensus-article a { color: #d4aa50; text-decoration: none; }
        .mythsensus-article a:hover { text-decoration: underline; }
        .mythsensus-article code {
          background: #1a1510;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          color: #c8a840;
          font-family: monospace;
        }
        .mythsensus-article br { display: none; }
      `}</style>

      {/* Lang toggle */}
      {hasEn && hasTh && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {(['th', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: lang === l ? '#d4aa50' : '#2a2010',
                background: lang === l ? '#1a1510' : 'transparent',
                color: lang === l ? '#d4aa50' : '#4a3a2a',
                fontSize: 11,
                letterSpacing: 2,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {l === 'th' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      )}

      {/* Article body — rendered once */}
      <div
        className="mythsensus-article"
        dangerouslySetInnerHTML={{ __html: html ?? '' }}
        style={{
          color: '#c8c0a8',
          lineHeight: 1.85,
          fontSize: 15,
        }}
      />
    </>
  )
}
