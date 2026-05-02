// ============================================================
//  POST /api/organum â€” 108 Gods Consensus Oracle
//  Free: 5 questions/day  |  Subscriber: unlimited
//  QA-6: keep prompt small â€” no full 26-system chart
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase'
import {
  TABLES,
  PLAN,
  ORGANUM_FREE_DAILY_LIMIT,
  ORGANUM_MAX_TOKENS,
  DEFAULTS,
} from '@/lib/constants'
import { UnauthorizedError, RateLimitError, BadRequestError, withErrorHandler } from '@/lib/errors'
import type { OrganumRequest, OrganumResponse } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// â”€â”€ Fallback when Claude doesn't return clean JSON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fallbackResponse(raw: string): OrganumResponse {
  return {
    spokesperson:   'The Council',
    origin:         'All Mythologies',
    agree_count:    54,
    warn_count:     27,
    neutral_count:  27,
    message:        raw,
    consensus_note: 'The council deliberated.',
  }
}

// â”€â”€ Main handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function handler(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  // Parse + validate request
  const { question, profile_id }: OrganumRequest = await req.json()
  if (!question || typeof question !== 'string' || question.trim().length < 3) {
    throw new BadRequestError('question must be at least 3 characters')
  }

  const admin = createSupabaseAdmin()

  // Check subscription tier
  const { data: sub } = await admin
    .from(TABLES.SUBSCRIPTIONS)
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const isSub = sub?.tier === PLAN.SUBSCRIPTION

  // Enforce free daily limit
  if (!isSub) {
    const today = new Date().toISOString().split('T')[0]
    const { count } = await admin
      .from(TABLES.ORGANUM_SESSIONS)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00.000Z`)

    if ((count ?? 0) >= ORGANUM_FREE_DAILY_LIMIT) {
      throw new RateLimitError(
        `Daily limit of ${ORGANUM_FREE_DAILY_LIMIT} questions reached. Subscribe for unlimited.`,
        { limit_reached: true },
      )
    }
  }

  // Fetch user's Day Master element for context (minimal payload â€” QA-6)
  let dmElement = DEFAULTS.DM_ELEMENT
  if (profile_id) {
    const { data: profile } = await admin
      .from(TABLES.PROFILES)
      .select('dm_element')
      .eq('id', profile_id)
      .maybeSingle()
    if (profile?.dm_element) dmElement = profile.dm_element
  }

  // â”€â”€ Call Claude â€” 108-god voting consensus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const message = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: ORGANUM_MAX_TOKENS,
    system: `You are 108 divine beings from all world mythologies â€” Hindu, Greek, Norse, Egyptian,
Chinese, Japanese, Mayan, Celtic, African, and more â€” collectively voting on a question.

The questioner's Day Master element is ${dmElement}.

Rules:
1. Show a consensus spread: how many of the 108 agree, how many warn, how many are neutral/silent.
2. Choose ONE god as spokesperson for the majority view. Use their actual mythological character â€” real myths, real domain.
3. The message must reflect what that specific deity would truly say based on their mythology.
4. Trickster gods (Loki, Coyote, Anansi) give twisted truths. Primordial gods speak in vast concepts.
5. NEVER say "this is a good/bad day". Only perspectives and patterns.
6. Response format (JSON only, no markdown):
{
  "spokesperson": "god name",
  "origin": "mythology",
  "agree_count": number,
  "warn_count": number,
  "neutral_count": number,
  "message": "what the spokesperson says (2-4 sentences, in character)",
  "consensus_note": "one sentence summarizing the 108-god split"
}`,
    messages: [{
      role:    'user',
      content: `Question: ${question.trim()}`,
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()

  // Parse JSON â€” strip accidental markdown fences
  let parsed: OrganumResponse
  try {
    const clean = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    parsed = JSON.parse(clean) as OrganumResponse
  } catch {
    parsed = fallbackResponse(raw)
  }

  // Persist session
  await admin.from(TABLES.ORGANUM_SESSIONS).insert({
    user_id:    user.id,
    profile_id: profile_id ?? null,
    question:   question.trim(),
    response:   parsed,
  })

  return NextResponse.json(parsed)
}

export const POST = withErrorHandler(handler)


