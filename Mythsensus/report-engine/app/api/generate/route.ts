// ============================================================
//  POST /api/generate â€” Run 26 systems + store report
//  QA-1: All values from calculation functions, never hardcoded
//  QA-6: COGS must stay under $0.15/report (no Claude call here)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID }                from 'crypto'
import { calculate, BirthData }      from '@/lib/calc'
import { generateReport }            from '@/lib/report'
import { createSupabaseAdmin }       from '@/lib/supabase'
import { TABLES, REPORT_TYPES, REPORT_STATUS, DEFAULTS } from '@/lib/constants'
import { BadRequestError, withErrorHandler }              from '@/lib/errors'
import type { GenerateRequest, GenerateResponse }         from '@/lib/types'

// â”€â”€ Map gender codes â†’ DB enum values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function mapGender(g?: string): 'male' | 'female' | 'other' {
  if (g === 'F' || g === 'female' || g === 'à¸«à¸à¸´à¸‡') return 'female'
  if (g === 'X' || g === 'other') return 'other'
  return 'male'
}

// â”€â”€ Map gender codes â†’ Thai strings for calc engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// calc.ts BirthData.gender expects 'à¸Šà¸²à¸¢' | 'à¸«à¸à¸´à¸‡' (Thai)
function mapGenderTh(g?: string): 'à¸Šà¸²à¸¢' | 'à¸«à¸à¸´à¸‡' {
  if (g === 'F' || g === 'female' || g === 'à¸«à¸à¸´à¸‡') return 'à¸«à¸à¸´à¸‡'
  return 'à¸Šà¸²à¸¢'
}

// â”€â”€ Main handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function handler(req: NextRequest): Promise<NextResponse> {
  const body: GenerateRequest = await req.json()
  const {
    name, gender, dob, birth_time, birth_place,
    birth_lat, birth_lon, birth_tz,
    birth_country, work_country, career_level, domain, industry,
    profile_id,
    promo_code,
  } = body

  // Validate required fields
  if (!dob || !birth_place) {
    throw new BadRequestError('dob and birth_place are required')
  }

  const admin = createSupabaseAdmin()

  // Auth / subscription check (skip for promo_code or anonymous)
  if (!promo_code && profile_id) {
    const { data: sub } = await admin
      .from(TABLES.SUBSCRIPTIONS)
      .select('tier, status')
      .eq('user_id', (await admin.auth.getUser()).data.user?.id ?? '')
      .in('tier', ['premium', 'sub'])
      .eq('status', 'active')
      .maybeSingle()

    // Uncomment in production to enforce payment:
    // if (!sub) throw new PaymentRequiredError()
    void sub  // suppress unused variable warning
  }

  // â”€â”€ Parse birth data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [y, m, d]   = (dob as string).split('-').map(Number)
  const [h, min]    = (birth_time || `${DEFAULTS.HOUR}:${DEFAULTS.MINUTE}`).split(':').map(Number)

  const input: BirthData = {
    name:          name              || DEFAULTS.NAME,
    gender:        mapGenderTh(gender),   // calc.ts needs Thai: 'à¸Šà¸²à¸¢'|'à¸«à¸à¸´à¸‡'
    year: y, month: m, day: d,
    hour:          h            ?? DEFAULTS.HOUR,
    minute:        min          ?? DEFAULTS.MINUTE,
    lat:           birth_lat    ?? DEFAULTS.LAT,
    lon:           birth_lon    ?? DEFAULTS.LON,
    timezone:      birth_tz     ?? DEFAULTS.TIMEZONE,
    birthCountry:  birth_country,
    workCountry:   work_country,
    careerLevel:   career_level,
    domain,
    industry,
  }

  // â”€â”€ Calculate all 26 systems (pure, zero API calls) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // QA-1: calc() is the ONLY source of all astrological values
  const chart = calculate(input)

  // â”€â”€ Generate HTML report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const htmlContent = generateReport(chart)

  // â”€â”€ Upsert profile (if not pre-existing) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let finalProfileId = profile_id
  if (!finalProfileId) {
    const { data: prof } = await admin
      .from(TABLES.PROFILES)
      .insert({
        user_id:            null,              // anonymous until auth
        name:               input.name,
        dob,
        birth_time:         birth_time || null,
        birth_place:        birth_place || '',
        birth_lat,
        birth_lon,
        birth_tz,
        gender:             mapGender(gender),
        relationship_label: 'myself',
        birth_country,
        work_country,
        career_level,
        domain,
        industry,
        cosmic_score:       chart.score.total,
        soul_freq:          chart.score.soulFrequency,
        life_terrain:       chart.score.lifeTerrainScore,
        path_resonance:     chart.score.pathResonanceScore,
        tier:               chart.score.tierEn,
        dm_element:         chart.bazi.dayMasterElement,
        nsk_star:           chart.ninestar.star,
        life_path:          chart.numerology.lifePath,
        systems_json:       chart,
      })
      .select('id')
      .single()
    finalProfileId = prof?.id
  }

  // â”€â”€ Insert report row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const reportUuid = randomUUID()
  await admin.from(TABLES.REPORTS).insert({
    profile_id:   finalProfileId,
    report_uuid:  reportUuid,
    type:         REPORT_TYPES.FULL,
    html_content: htmlContent,
    status:       REPORT_STATUS.READY,
    purchased_at: new Date().toISOString(),
  })

  // â”€â”€ Return summary (not the full chart â€” client doesn't need it) â”€
  const response: GenerateResponse = {
    report_uuid:  reportUuid,
    cosmic_score: chart.score.total,
    tier:         chart.score.tierEn,
    tier_th:      chart.score.tier,
    percentile:   chart.score.percentile,
    star_count:   chart.score.starCount,
    mid_count:    chart.score.midCount,
    warn_count:   chart.score.warnCount,
    soul_freq:    chart.score.soulFrequency,
    dm_element:   chart.bazi.dayMasterElement,
    primary_god:  chart.score.primaryGod,
  }

  return NextResponse.json(response)
}

export const POST = withErrorHandler(handler)

