// api/og.js — dynamic per-god OG image (added 2026-06-16).
//
// WHY: api/b.js already serves per-god OG *text* (deity name + blessing) for all
// 1069 gods, but a per-god OG *image* only existed for the 217 Epic+ gods that
// have hand-drawn artwork (static /assets/god-og/<slug>.jpg). The 852 lower-tier
// gods fell back to the generic banner — so sharing them looked identical and
// lost the deity identity in the social preview card.
//
// This route renders a branded card (deity symbol + name + tier + mythology +
// tagline) as a PNG on demand via @vercel/og, so EVERY shared god gets a unique,
// on-brand preview. b.js points its og:image here for non-art-tier gods and keeps
// the richer hand-drawn JPG for Epic+.
//
// PURE FROM QUERY PARAMS: b.js (which already loaded gods.json) passes g/t/s/myth,
// so this function needs no data file — tiny edge bundle, hard-cached forever.
// Params are reflected into an IMAGE (not HTML), so there is no XSS surface; we
// still clamp lengths. No birth data or blessing text is ever passed here.
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const TIER_COLOR = {
  Common: '#7b8a9a', Uncommon: '#3fae6e', Rare: '#6a78e0',
  Epic: '#b06ad0', Legendary: '#e0a93a', Mythic: '#e05a5a',
}
const el = (type, style, children) => ({ type, props: { style, children } })

export default function handler(req) {
  const { searchParams } = new URL(req.url)
  const name = (searchParams.get('g') || 'Mythsensus').slice(0, 40)
  const tier = (searchParams.get('t') || '').slice(0, 20)
  const symbol = (searchParams.get('s') || '🔮').slice(0, 8)
  const mythology = (searchParams.get('myth') || '').slice(0, 40)
  const tierColor = TIER_COLOR[tier] || '#7b8a9a'

  const tree = el('div', {
    display: 'flex', flexDirection: 'column', width: '1200px', height: '630px',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    backgroundColor: '#0b0b12',
    backgroundImage: 'radial-gradient(circle at 50% 28%, #241a3a 0%, #0b0b12 60%)',
    color: '#e8e0c9', padding: '0 80px',
  }, [
    el('div', {
      position: 'absolute', top: '46px', display: 'flex', alignItems: 'center',
      fontSize: '26px', letterSpacing: '8px', color: '#c8a45a', fontWeight: 700,
    }, 'M Y T H S E N S U S'),
    el('div', { display: 'flex', fontSize: '150px', lineHeight: '150px', marginBottom: '20px' }, symbol),
    el('div', {
      display: 'flex', fontSize: '92px', fontWeight: 700, color: '#e9d9a8',
      textAlign: 'center', lineHeight: '96px',
    }, name),
    el('div', { display: 'flex', alignItems: 'center', marginTop: '30px' },
      [
        el('div', {
          display: 'flex', backgroundColor: tierColor, color: '#0b0b12',
          fontSize: '28px', fontWeight: 700, padding: '8px 24px', borderRadius: '999px',
          letterSpacing: '1px',
        }, tier || 'Deity'),
      ].concat(mythology
        ? [el('div', { display: 'flex', fontSize: '30px', color: '#9a8a72', marginLeft: '22px' }, mythology)]
        : [])),
    el('div', {
      position: 'absolute', bottom: '48px', display: 'flex',
      fontSize: '28px', color: '#8a7a5a', letterSpacing: '2px',
    }, '26 ancient systems · one cosmic score'),
  ])

  return new ImageResponse(tree, {
    width: 1200, height: 630,
    headers: { 'cache-control': 'public, max-age=31536000, immutable' },
  })
}
