// ============================================================
//  POST /api/oracle/bazi/origin
//  Renders บทที่ 1 (Year Pillar) in Oracle voice
//  Phase 0 — version 0.1
//
//  Pricing: bundled with Deep Reading ($9 oziji) or subscription tier.
//  Voice toggle: same chart, Oracle voice (vs Analyst already in main report).
//
//  QA-1: All astrological values from caller-supplied `chart` (computed by calc())
//  QA-6: Prompt stays small — only Year Pillar fields, no full 26-system payload
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { BadRequestError, withErrorHandler } from '@/lib/errors'
import type {
  BaZiOriginChart,
  BaZiOriginOracleOutput,
  BaZiOriginResponse,
} from '@/lib/oracle/bazi/origin/schema'
import { ACCEPTANCE } from '@/lib/oracle/bazi/origin/schema'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Lazy-load system prompt — markdown file co-located with framework doc
let SYSTEM_PROMPT: string | null = null
function loadSystemPrompt(): string {
  if (SYSTEM_PROMPT) return SYSTEM_PROMPT
  const p = join(process.cwd(), 'lib/oracle/bazi/origin/system-prompt.md')
  SYSTEM_PROMPT = readFileSync(p, 'utf-8')
  return SYSTEM_PROMPT
}

// ── Input validation ──────────────────────────────────────────
function validateChart(chart: unknown): asserts chart is BaZiOriginChart {
  if (!chart || typeof chart !== 'object') {
    throw new BadRequestError('chart object required')
  }
  const c = chart as Partial<BaZiOriginChart>
  const required: (keyof BaZiOriginChart)[] = [
    'year_stem', 'year_branch', 'year_branch_element',
    'na_yin', 'day_master', 'ten_god_of_year_stem',
    'birth_iso', 'gender',
  ]
  for (const field of required) {
    if (!c[field]) throw new BadRequestError(`chart.${field} required`)
  }
  if (!Array.isArray(c.hidden_stems_of_year_branch)) {
    throw new BadRequestError('chart.hidden_stems_of_year_branch must be array')
  }
}

// ── Chart hash (cache key) ────────────────────────────────────
function chartHash(chart: BaZiOriginChart): string {
  const canonical = JSON.stringify({
    y: chart.year_stem + chart.year_branch,
    n: chart.na_yin,
    d: chart.day_master,
    t: chart.ten_god_of_year_stem,
    g: chart.gender,
  })
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16)
}

// ── Output validation ─────────────────────────────────────────
function validateOutput(out: unknown): asserts out is BaZiOriginOracleOutput {
  if (!out || typeof out !== 'object') {
    throw new Error('oracle output not an object')
  }
  const o = out as Partial<BaZiOriginOracleOutput>
  if (!o.title || !o.opening || !o.ancestry || !o.foundation) {
    throw new Error('oracle output missing required sections')
  }
  if (!Array.isArray(o.engine_refs) || o.engine_refs.length < ACCEPTANCE.MIN_ENGINE_REFS) {
    throw new Error(`engine_refs must reference ≥${ACCEPTANCE.MIN_ENGINE_REFS} fields`)
  }
  const wc = o.word_count ?? 0
  if (wc < ACCEPTANCE.MIN_WORDS || wc > ACCEPTANCE.MAX_WORDS) {
    throw new Error(`word_count ${wc} outside [${ACCEPTANCE.MIN_WORDS}, ${ACCEPTANCE.MAX_WORDS}]`)
  }
}

// ── Build user message (the only place chart is exposed to LLM) ──
function buildUserMessage(chart: BaZiOriginChart): string {
  return `Chart input for the reader:

\`\`\`json
${JSON.stringify(chart, null, 2)}
\`\`\`

Render บทที่ 1: หน้าที่ปี for this chart.
Return JSON matching the schema in your instructions. No markdown fence, no preamble.`
}

// ── Main handler ──────────────────────────────────────────────
async function handler(req: NextRequest): Promise<NextResponse> {
  const t0 = Date.now()
  const body = await req.json()
  validateChart(body.chart)

  const chart = body.chart
  const hash = chartHash(chart)

  // Phase 0: no DB cache. Phase 1: check (chart_hash, voice='oracle') from cache table.

  const sys = loadSystemPrompt()
  const userMsg = buildUserMessage(chart)

  const message = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    system:     sys,
    messages:   [{ role: 'user', content: userMsg }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const clean = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')

  let oracle: BaZiOriginOracleOutput
  try {
    oracle = JSON.parse(clean) as BaZiOriginOracleOutput
    validateOutput(oracle)
  } catch (err) {
    throw new Error(`Oracle output validation failed: ${(err as Error).message}\nRaw: ${clean.slice(0, 500)}`)
  }

  const elapsed = Date.now() - t0
  if (elapsed > ACCEPTANCE.MAX_GENERATE_MS) {
    console.warn(`[oracle/bazi/origin] slow render ${elapsed}ms (cap ${ACCEPTANCE.MAX_GENERATE_MS}ms)`)
  }

  const response: BaZiOriginResponse = {
    oracle,
    audit: {
      passed: true,  // Phase 0: skip post-render audit. Phase 1: add 4-persona Sonnet panel
      scores: {
        engineer_skeptic: 0,
        barnum_hunter:    0,
        thai_native:      0,
        mystic_believer:  0,
      },
      notes: ['Phase 0 — audit deferred'],
    },
    generated_ms: elapsed,
    chart_hash:   hash,
  }

  return NextResponse.json(response)
}

export const POST = withErrorHandler(handler)
