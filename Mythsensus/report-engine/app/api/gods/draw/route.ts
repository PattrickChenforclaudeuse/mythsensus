// ============================================================
//  POST /api/gods/draw â€” Daily God Blessing Draw
//  Free: 1 draw/day  |  Subscriber: unlimited + shadow reading
//  QA-2: ??? event logged as draw_overflow_flag:true ONLY â€” never named
//  QA-5: seed = birthTimestamp XOR dayEpoch â€” deterministic per person per day
// ============================================================
import { NextRequest, NextResponse }          from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { TABLES, PLAN, TIER_WEIGHTS, OVERFLOW_PROBABILITY } from '@/lib/constants'
import { UnauthorizedError, RateLimitError, withErrorHandler } from '@/lib/errors'
import type { God, GodDrawRequest }           from '@/lib/types'
import godsData                               from '@/data/gods.json'

const gods = godsData as God[]

// â”€â”€ QA-5: Deterministic seeded RNG (LCG algorithm) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Same seed â†’ same god every time. Changes only when day changes.
function seededRng(seed: number) {
  let s = seed
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// â”€â”€ Tier-weighted god selection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function selectGod(seed: number): God {
  const rng = seededRng(seed)

  // Step 1: pick tier by weight
  const totalWeight = Object.values(TIER_WEIGHTS).reduce((a, b) => a + b, 0)
  let cursor = rng() * totalWeight
  let selectedTier = 'common'
  for (const [tier, weight] of Object.entries(TIER_WEIGHTS)) {
    cursor -= weight
    if (cursor <= 0) { selectedTier = tier; break }
  }

  // Step 2: pick god within that tier
  const tierPool = gods.filter(g => g.tier.toLowerCase() === selectedTier)
  if (tierPool.length === 0) return gods[0]   // safe fallback

  const rng2 = seededRng(seed ^ 0xdeadbeef)
  return tierPool[Math.floor(rng2() * tierPool.length)]
}

// â”€â”€ Main handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function handler(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const _body: GodDrawRequest = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
  const { profile_id } = _body

  const admin = createSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]   // YYYY-MM-DD

  // Check subscription
  const { data: sub } = await admin
    .from(TABLES.SUBSCRIPTIONS)
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const isSub = sub?.tier === PLAN.SUBSCRIPTION

  // Free users: one draw per calendar day
  if (!isSub) {
    const { data: existing } = await admin
      .from(TABLES.GOD_DRAWS)
      .select('id, god_name, tier, blessing, origin, element, draw_overflow_flag')
      .eq('user_id', user.id)
      .eq('draw_date', today)
      .maybeSingle()

    if (existing) {
      // Return cached draw instead of error â€” better UX
      if (existing.draw_overflow_flag) return NextResponse.json({ overflow: true })
      return NextResponse.json({
        cached:   true,
        god_id:   existing.id,
        name:     existing.god_name,
        origin:   existing.origin,
        tier:     existing.tier,
        blessing: existing.blessing,
        element:  existing.element,
        shadow:   null,
        is_sub:   false,
      })
    }
  }

  // Get profile's DOB for seed (QA-5)
  const profileQuery = admin
    .from(TABLES.PROFILES)
    .select('dob, birth_time')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const { data: profile } = await profileQuery.maybeSingle()

  // seed = birth epoch (seconds) XOR day number
  const birthSeed = profile?.dob
    ? new Date(profile.dob).getTime()
    : user.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
  const dayNumber = Math.floor(new Date(today).getTime() / 86_400_000)
  const seed = Math.floor(birthSeed / 1000) ^ dayNumber

  // QA-2: ??? overflow check â€” 1 in 1,000,000
  const overflowRng = seededRng(seed ^ 0xfeedface)
  if (overflowRng() < OVERFLOW_PROBABILITY) {
    // QA-2: log ONLY as flag â€” never name, describe, or display this event
    await admin.from(TABLES.GOD_DRAWS).insert({
      user_id:            user.id,
      profile_id:         profile_id ?? null,
      god_id:             '???',
      god_name:           '???',
      tier:               '???',
      blessing:           '',
      origin:             '',
      element:            '',
      draw_date:          today,
      draw_overflow_flag: true,
    })
    return NextResponse.json({ overflow: true })
  }

  // Normal draw
  const god = selectGod(seed)

  await admin.from(TABLES.GOD_DRAWS).insert({
    user_id:            user.id,
    profile_id:         profile_id ?? null,
    god_id:             god.id,
    god_name:           god.name,
    tier:               god.tier,
    blessing:           god.blessing,
    origin:             god.origin,
    element:            god.element,
    draw_date:          today,
    draw_overflow_flag: false,
  })

  return NextResponse.json({
    god_id:   god.id,
    name:     god.name,
    origin:   god.origin,
    tier:     god.tier,
    blessing: god.blessing,
    shadow:   isSub ? (god.shadow ?? null) : null,   // shadow only for subscribers
    element:  god.element,
    gender:   god.gender,
    is_sub:   isSub,
  })
}

export const POST = withErrorHandler(handler)


