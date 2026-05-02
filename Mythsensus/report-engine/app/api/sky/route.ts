// ============================================================
//  GET /api/sky?profile_id=xxx â€” Today Sky (Daily Transit)
//  QA-3: NEVER say good/bad â€” only planet + position + movement
//  Free: Sun position only  |  Sub: full personal transit (natal vs sky)
// ============================================================
import { NextRequest, NextResponse }          from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { TABLES, PLAN, DEFAULTS }             from '@/lib/constants'
import { UnauthorizedError, NotFoundError, withErrorHandler } from '@/lib/errors'
import type { PlanetEntry, SkyTab, SkyResponse } from '@/lib/types'

// â”€â”€ Julian Day calculation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const J2000 = 2451545.0

function julianDay(date: Date): number {
  const y  = date.getUTCFullYear()
  const m  = date.getUTCMonth() + 1
  const d  = date.getUTCDate()
  const h  = date.getUTCHours() + date.getUTCMinutes() / 60
  let yr = y, mo = m
  if (mo <= 2) { yr--; mo += 12 }
  const A = Math.floor(yr / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (yr + 4716)) + Math.floor(30.6001 * (mo + 1)) + d + h / 24 + B - 1524.5
}

// â”€â”€ Sign lookup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SIGNS_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const SIGNS_TH = ['à¹€à¸¡à¸©','à¸žà¸¤à¸©à¸ ','à¹€à¸¡à¸–à¸¸à¸™','à¸à¸£à¸à¸Ž','à¸ªà¸´à¸‡à¸«à¹Œ','à¸à¸±à¸™à¸¢à¹Œ','à¸•à¸¸à¸¥à¸¢à¹Œ','à¸žà¸´à¸ˆà¸´à¸','à¸˜à¸™à¸¹','à¸¡à¸à¸£','à¸à¸¸à¸¡à¸ à¹Œ','à¸¡à¸µà¸™']

function signFromDeg(deg: number): { en: string; th: string; deg: number } {
  const norm = ((deg % 360) + 360) % 360
  const idx  = Math.floor(norm / 30)
  return { en: SIGNS_EN[idx], th: SIGNS_TH[idx], deg: Math.round(norm % 30) }
}

// â”€â”€ Simplified VSOP87 first-order mean longitudes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// For production, replace with Swiss Ephemeris (WASM build).
interface PlanetPos { lon: number; isRetro: boolean }

function calcPlanets(jd: number): Record<string, PlanetPos> {
  const T = (jd - J2000) / 36525
  return {
    sun:     { lon: (280.46646 + 36000.76983 * T) % 360, isRetro: false },
    moon:    { lon: (218.3165  + 481267.8813 * T) % 360, isRetro: false },
    mercury: { lon: (252.25    + 149472.67   * T) % 360, isRetro: Math.sin((T * 4.09) * Math.PI / 180) < -0.3 },
    venus:   { lon: (181.97    + 58517.81    * T) % 360, isRetro: Math.sin((T * 1.60) * Math.PI / 180) < -0.4 },
    mars:    { lon: (355.45    + 19140.30    * T) % 360, isRetro: Math.sin((T * 0.52) * Math.PI / 180) < -0.45 },
    jupiter: { lon: (34.35     + 3034.90     * T) % 360, isRetro: Math.sin((T * 0.083) * Math.PI / 180) < -0.4 },
    saturn:  { lon: (50.08     + 1222.11     * T) % 360, isRetro: Math.sin((T * 0.034) * Math.PI / 180) < -0.4 },
    uranus:  { lon: (314.20    + 428.48      * T) % 360, isRetro: false },
    neptune: { lon: (304.35    + 218.46      * T) % 360, isRetro: false },
  }
}

// House (equal house from ASC reference)
function houseOf(planetLon: number, ascLon: number): number {
  const diff = ((planetLon - ascLon) % 360 + 360) % 360
  return Math.floor(diff / 30) + 1
}

// QA-3: descriptions are position + movement ONLY â€” no good/bad language
const PLANET_MEANING: Record<string, string> = {
  sun:     'à¸•à¸±à¸§à¸•à¸™ Â· à¸žà¸¥à¸±à¸‡à¸‡à¸²à¸™ Â· à¸„à¸§à¸²à¸¡à¸¡à¸±à¹ˆà¸™à¹ƒà¸ˆ',
  moon:    'à¸­à¸²à¸£à¸¡à¸“à¹Œ Â· à¸ªà¸±à¸à¸Šà¸²à¸•à¸à¸²à¸“ Â· à¸„à¸§à¸²à¸¡à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸ à¸²à¸¢à¹ƒà¸™',
  mercury: 'à¸à¸²à¸£à¸ªà¸·à¹ˆà¸­à¸ªà¸²à¸£ Â· à¸„à¸§à¸²à¸¡à¸„à¸´à¸” Â· à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡à¸ªà¸±à¹‰à¸™',
  venus:   'à¸„à¸§à¸²à¸¡à¸ªà¸±à¸¡à¸žà¸±à¸™à¸˜à¹Œ Â· à¸„à¸¸à¸“à¸„à¹ˆà¸² Â· à¸„à¸§à¸²à¸¡à¸‡à¸²à¸¡',
  mars:    'à¸žà¸¥à¸±à¸‡à¸‡à¸²à¸™ Â· à¸à¸²à¸£à¸à¸£à¸°à¸—à¸³ Â· à¸„à¸§à¸²à¸¡à¸à¸¥à¹‰à¸²à¸«à¸²à¸',
  jupiter: 'à¸à¸²à¸£à¸‚à¸¢à¸²à¸¢ Â· à¹‚à¸­à¸à¸²à¸ª Â· à¸›à¸±à¸à¸à¸²',
  saturn:  'à¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡ Â· à¸‚à¹‰à¸­à¸ˆà¸³à¸à¸±à¸” Â· à¸„à¸§à¸²à¸¡à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸š',
  uranus:  'à¸à¸²à¸£à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¹à¸›à¸¥à¸‡ Â· à¸™à¸§à¸±à¸•à¸à¸£à¸£à¸¡ Â· à¸„à¸§à¸²à¸¡à¹„à¸¡à¹ˆà¸„à¸²à¸”à¸„à¸´à¸”',
  neptune: 'à¸ˆà¸´à¸™à¸•à¸™à¸²à¸à¸²à¸£ Â· à¸ˆà¸´à¸•à¸§à¸´à¸à¸à¸²à¸“ Â· à¸„à¸§à¸²à¸¡à¸à¸±à¸™',
}

// Which planets appear in each tab
const TAB_PLANETS: Record<SkyTab, string[]> = {
  career:  ['sun','mars','saturn','jupiter'],
  finance: ['venus','jupiter','saturn','sun'],
  love:    ['venus','moon','mars','sun'],
  health:  ['sun','moon','mars','saturn'],
  growth:  ['jupiter','saturn','uranus','neptune'],
}

// â”€â”€ Main handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function handler(req: NextRequest): Promise<NextResponse> {
  const profileId = req.nextUrl.searchParams.get('profile_id')

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const admin = createSupabaseAdmin()

  // Check subscription
  const { data: sub } = await admin
    .from(TABLES.SUBSCRIPTIONS)
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const isSub = sub?.tier === PLAN.SUBSCRIPTION

  const now     = new Date()
  const jd      = julianDay(now)
  const planets = calcPlanets(jd)
  const dateStr = now.toISOString().split('T')[0]

  // â”€â”€ Free tier: Sun position only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!isSub || !profileId) {
    const sun = signFromDeg(planets.sun.lon)
    const response: SkyResponse = {
      free_only: true,
      date:      dateStr,
      sun: {
        planet:        'Sun Â· à¸”à¸§à¸‡à¸­à¸²à¸—à¸´à¸•à¸¢à¹Œ',
        sign_en:       sun.en,
        sign_th:       sun.th,
        degree:        sun.deg,
        house:         0,
        movement:      'Direct',
        natal_sign_en: '',
        meaning:       PLANET_MEANING.sun,
      },
    }
    return NextResponse.json(response)
  }

  // â”€â”€ Subscriber: full personal natal vs transit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: profile } = await admin
    .from(TABLES.PROFILES)
    .select('dob, birth_time, birth_lat, birth_lon, birth_tz')
    .eq('id', profileId)
    .eq('user_id', user.id)   // ensure ownership
    .maybeSingle()

  if (!profile) throw new NotFoundError('Profile not found')

  const [by, bm, bd] = profile.dob.split('-').map(Number)
  const [bh, bmin]   = (profile.birth_time || `${DEFAULTS.HOUR}:00`).split(':').map(Number)
  const tz           = profile.birth_tz ?? DEFAULTS.TIMEZONE

  const birthJd      = julianDay(new Date(Date.UTC(by, bm - 1, bd, bh - tz, bmin)))
  const natalPlanets = calcPlanets(birthJd)
  const natalAscLon  = natalPlanets.sun.lon   // simplified ASC reference

  // Build 5 tabs
  const tabs: Record<SkyTab, PlanetEntry[]> = {} as Record<SkyTab, PlanetEntry[]>
  for (const [tab, planetList] of Object.entries(TAB_PLANETS) as [SkyTab, string[]][]) {
    tabs[tab] = planetList.map(pName => {
      const p       = planets[pName]
      const sign    = signFromDeg(p.lon)
      const natal   = signFromDeg(natalPlanets[pName]?.lon ?? p.lon)
      return {
        planet:        pName.charAt(0).toUpperCase() + pName.slice(1),
        sign_en:       sign.en,
        sign_th:       sign.th,
        degree:        sign.deg,
        house:         houseOf(p.lon, natalAscLon),
        movement:      p.isRetro ? 'Retrograde â„ž' : 'Direct',
        natal_sign_en: natal.en,
        meaning:       PLANET_MEANING[pName] ?? '',
      }
    })
  }

  const response: SkyResponse = { free_only: false, date: dateStr, tabs }
  return NextResponse.json(response)
}

export const GET = withErrorHandler(handler)


