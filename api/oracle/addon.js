// ============================================================
//  POST /api/oracle/addon
//
//  Generates a 6-category × 10-question deep reading for ONE
//  system using Sonnet 4.6. Caches per
//  (chart_hash, system, lang, relationship_status, prompt_version)
//  in public.myth_addon_reading (woam).
//
//  Voice mode: 'oracle' — Modern Mystic Coach.
//  The 'engineer' voice is the existing static `c.<sys>.reading`
//  emitted by the engine bundle; this endpoint does not serve it.
//
//  Pricing & cap:
//    - Sonnet 4.6 · target $0.08-0.15 per render
//    - Daily soft budget cap via env ORACLE_DAILY_BUDGET_CENTS
//    - Per-user (chart_hash) cap via env ORACLE_USER_DAILY_RENDERS
//
//  Cache key: (chart_hash, system, lang, relationship_status, prompt_version)
//    prompt_version = sha256 of (base prompt + framework + schema version)
//    Cache hit → return instantly, cost = 0
//
//  Author: locked 2026-06-09. See _shared/system-prompt-base.md
//          and <system>/framework.md for spec details.
// ============================================================

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const SYSTEMS = [
  'bazi', 'vedic', 'western', 'ninestar', 'numerology',
  'humandesign', 'mayan', 'thai', 'saju', 'celtic',
  'tibetan', 'ziwei', 'onmyodo', 'hellenistic', 'norseRune',
  'ogham', 'arabicParts', 'kabbalistic', 'zoroastrian', 'aztec',
  'nativeAmerican', 'ifaYoruba', 'aboriginal', 'biorhythm',
  'vedicMahadasha', 'taksa',
]

const SCHEMA_VERSION = '2.0'
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 4000
const RENDER_TIMEOUT_MS = 25_000
const DEFAULT_DAILY_BUDGET_CENTS = 3000
const DEFAULT_USER_DAILY_RENDERS = 10

// Lazy-loaded prompt + framework, keyed by system
const _promptCache = new Map()

function loadBasePrompt() {
  if (_promptCache.has('__base__')) return _promptCache.get('__base__')
  const path = join(process.cwd(), 'Mythsensus/report-engine/lib/oracle/_shared/system-prompt-base.md')
  const txt = readFileSync(path, 'utf-8')
  _promptCache.set('__base__', txt)
  return txt
}

function loadSystemFramework(system) {
  if (_promptCache.has(system)) return _promptCache.get(system)
  const path = join(process.cwd(), `Mythsensus/report-engine/lib/oracle/${system}/addon/framework.md`)
  if (!existsSync(path)) {
    // Graceful fallback — use a generic framework so users can still request
    // an oracle reading for systems without dedicated framework.md yet.
    // Reading will be less system-specific but still passes schema validation.
    const fallback = join(process.cwd(), 'Mythsensus/report-engine/lib/oracle/_shared/framework-generic.md')
    if (!existsSync(fallback)) {
      throw new Error(`framework.md not found for system ${system}, and no generic fallback at: ${fallback}`)
    }
    const txt = readFileSync(fallback, 'utf-8')
    _promptCache.set(system, txt)
    return txt
  }
  const txt = readFileSync(path, 'utf-8')
  _promptCache.set(system, txt)
  return txt
}

function computePromptVersion(system) {
  const base = loadBasePrompt()
  const framework = loadSystemFramework(system)
  const concat = `${SCHEMA_VERSION}|${base}|${framework}`
  return createHash('sha256').update(concat).digest('hex').slice(0, 16)
}

function buildSystemPrompt(system) {
  const base = loadBasePrompt()
  const framework = loadSystemFramework(system)
  return `${base}\n\n---\n\n${framework}`
}

// Format the user payload exactly as the prompt expects: chart + months + context.
function buildUserMessage(body) {
  return JSON.stringify({
    system: body.system,
    lang: body.lang,
    year: body.year,
    chart: body.chart,
    months: body.months || [],
    context: body.context || {},
  }, null, 2)
}

function validateInput(body) {
  if (!body || typeof body !== 'object') return 'body must be JSON object'
  if (!body.system || !SYSTEMS.includes(body.system)) {
    return `system must be one of: ${SYSTEMS.join(', ')}`
  }
  if (body.lang !== 'th' && body.lang !== 'en') return 'lang must be "th" or "en"'
  if (!body.chart_hash || typeof body.chart_hash !== 'string') return 'chart_hash required'
  if (!body.chart || typeof body.chart !== 'object') return 'chart required (system-specific shape)'
  if (typeof body.year !== 'number' || body.year < 1900 || body.year > 2200) {
    return 'year required (1900-2200)'
  }
  return null
}

// Output validation — mirrors _shared/schema.ts validateOutput() inline.
// Kept inline (not imported) because Vercel functions don't easily import TS.
function validateOracleOutput(out) {
  if (!out || typeof out !== 'object') return 'oracle output not an object'
  if (!out.title || !out.hero_statement) return 'missing title/hero_statement'
  if (!Array.isArray(out.sections) || out.sections.length !== 6) {
    return `sections must be exactly 6, got ${out.sections ? out.sections.length : 0}`
  }
  const VALID_CATEGORIES = ['work', 'money', 'love', 'health', 'people', 'warning']
  const VALID_TAGS = ['peak', 'caution', 'open', 'consolidate', 'neutral']
  const VALID_Q_KEYS_BY_CATEGORY = {
    work:    ['work_energy_direction', 'work_boldest_move_window'],
    money:   ['money_flow_direction', 'money_leak_or_windfall'],
    love:    ['love_energy_state', 'love_timing_windows'],
    health:  ['health_weak_point'],
    people:  ['people_who_changes_you'],
    warning: ['warning_high_risk_window', 'warning_specific'],
  }
  const seenCategories = new Set()
  let totalAnswers = 0
  const tagCounts = { peak: 0, caution: 0, open: 0, consolidate: 0, neutral: 0 }
  for (const sec of out.sections) {
    if (!VALID_CATEGORIES.includes(sec.category)) return `unknown category: ${sec.category}`
    if (seenCategories.has(sec.category)) return `duplicate category: ${sec.category}`
    seenCategories.add(sec.category)
    if (!sec.opening || !sec.closing || !sec.framing) {
      return `section ${sec.category} missing opening/framing/closing`
    }
    if (!Array.isArray(sec.questions)) return `section ${sec.category} missing questions`
    const allowedQs = VALID_Q_KEYS_BY_CATEGORY[sec.category]
    for (const a of sec.questions) {
      if (!allowedQs.includes(a.q_key)) {
        return `q_key ${a.q_key} not allowed in category ${sec.category}`
      }
      if (!a.headline || !a.body) return `answer ${a.q_key} missing headline/body`
      if (!Array.isArray(a.engine_refs) || a.engine_refs.length === 0) {
        return `answer ${a.q_key} must cite >=1 engine_refs`
      }
      if (!VALID_TAGS.includes(a.tag)) return `answer ${a.q_key} invalid tag: ${a.tag}`
      tagCounts[a.tag]++
      totalAnswers++
    }
  }
  if (totalAnswers !== 10) return `must have exactly 10 answers, got ${totalAnswers}`
  if (tagCounts.peak > 4) return `peak ${tagCounts.peak} > cap 4`
  if (tagCounts.caution > 4) return `caution ${tagCounts.caution} > cap 4`
  const wc = Number(out.word_count) || 0
  if (wc < 1200 || wc > 4000) return `word_count ${wc} out of bounds`
  return null
}

// ─── Anthropic API call (raw fetch — no SDK dependency) ───
async function callAnthropic(systemPrompt, userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in env')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS)
  let resp
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '<no body>')
    throw new Error(`Anthropic ${resp.status}: ${errText.slice(0, 300)}`)
  }
  const data = await resp.json()
  const content = data.content?.[0]?.text || ''
  const usage = data.usage || {}
  // Sonnet 4.6 pricing (Jan 2026 reference) — input $3/MTok, output $15/MTok
  const inputTokens = usage.input_tokens || 0
  const outputTokens = usage.output_tokens || 0
  const costCents = Math.ceil((inputTokens * 0.0003 + outputTokens * 0.0015) * 100) / 100
  return { text: content, costCents, inputTokens, outputTokens }
}

// ─── Supabase cache (Management API — raw SQL via PAT) ───
//
// We use the SAME pattern as the Yoohui n8n bot (per CLAUDE.md canonical):
// POST https://api.supabase.com/v1/projects/{ref}/database/query
// Auth: Bearer SUPABASE_MGMT_TOKEN (PAT)
// Body: { "query": "<raw SQL>" }
//
// For Mythsensus the project is woam (`woamqrhifuxsscnihqco`). The PAT must
// be set in env as SUPABASE_MGMT_TOKEN with woam scope.

const WOAM_PROJECT_REF = 'woamqrhifuxsscnihqco'

async function supabaseQuery(sql) {
  const token = process.env.SUPABASE_MGMT_TOKEN
  if (!token) throw new Error('SUPABASE_MGMT_TOKEN not set in env')
  const resp = await fetch(
    `https://api.supabase.com/v1/projects/${WOAM_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '<no body>')
    throw new Error(`Supabase ${resp.status}: ${errText.slice(0, 300)}`)
  }
  return await resp.json()
}

function sqlEscape(v) { return String(v).replace(/'/g, "''") }

async function readCache({ chart_hash, system, lang, relationship_status, prompt_version }) {
  try {
    const sql = `SELECT oracle_json, cost_cents, model, generated_at_iso
                 FROM public.myth_addon_reading
                 WHERE chart_hash = '${sqlEscape(chart_hash)}'
                   AND system = '${sqlEscape(system)}'
                   AND lang = '${sqlEscape(lang)}'
                   AND relationship_status = '${sqlEscape(relationship_status)}'
                   AND prompt_version = '${sqlEscape(prompt_version)}'
                 LIMIT 1`
    const rows = await supabaseQuery(sql)
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch (e) {
    // Cache failure should NOT block render — log and proceed to live render
    console.warn('[oracle/addon] cache read failed:', e.message)
    return null
  }
}

async function writeCache({ chart_hash, system, lang, relationship_status, prompt_version, oracle_json, cost_cents, model }) {
  try {
    const json = sqlEscape(JSON.stringify(oracle_json))
    const sql = `INSERT INTO public.myth_addon_reading
                   (chart_hash, system, lang, relationship_status, prompt_version,
                    oracle_json, cost_cents, model, generated_at_iso)
                 VALUES
                   ('${sqlEscape(chart_hash)}', '${sqlEscape(system)}', '${sqlEscape(lang)}',
                    '${sqlEscape(relationship_status)}', '${sqlEscape(prompt_version)}',
                    '${json}'::jsonb, ${Number(cost_cents)}, '${sqlEscape(model)}', NOW())
                 ON CONFLICT (chart_hash, system, lang, relationship_status, prompt_version)
                 DO UPDATE SET
                   oracle_json = EXCLUDED.oracle_json,
                   cost_cents = EXCLUDED.cost_cents,
                   model = EXCLUDED.model,
                   generated_at_iso = EXCLUDED.generated_at_iso`
    await supabaseQuery(sql)
  } catch (e) {
    console.warn('[oracle/addon] cache write failed:', e.message)
  }
}

async function readDailyCostCents() {
  try {
    const sql = `SELECT COALESCE(SUM(cost_cents), 0)::int AS total_cents
                 FROM public.myth_addon_reading
                 WHERE generated_at_iso >= NOW() - INTERVAL '24 hours'`
    const rows = await supabaseQuery(sql)
    return Array.isArray(rows) && rows[0] ? Number(rows[0].total_cents || 0) : 0
  } catch (_) {
    return 0
  }
}

async function readUserDailyRenders(chart_hash) {
  try {
    const sql = `SELECT COUNT(*)::int AS n
                 FROM public.myth_addon_reading
                 WHERE chart_hash = '${sqlEscape(chart_hash)}'
                   AND generated_at_iso >= NOW() - INTERVAL '24 hours'`
    const rows = await supabaseQuery(sql)
    return Array.isArray(rows) && rows[0] ? Number(rows[0].n || 0) : 0
  } catch (_) {
    return 0
  }
}

// ─── Handler ─────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS — same-origin only in production, allow any for dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  const t0 = Date.now()
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch (_) {
    return res.status(400).json({ error: 'invalid JSON body' })
  }

  const inputErr = validateInput(body)
  if (inputErr) return res.status(400).json({ error: inputErr })

  const relationship_status = body.context?.relationship_status || 'unknown'
  const cache_key = {
    chart_hash: body.chart_hash,
    system: body.system,
    lang: body.lang,
    relationship_status,
    prompt_version: computePromptVersion(body.system),
  }

  // 1. Cache lookup
  const cached = await readCache(cache_key)
  if (cached && cached.oracle_json) {
    return res.status(200).json({
      oracle: cached.oracle_json,
      cached: true,
      generated_ms: Date.now() - t0,
      cost_cents: 0,
      model: cached.model,
    })
  }

  // 2. Cost & rate guards (skip-able via env if needed)
  const dailyBudgetCents = Number(process.env.ORACLE_DAILY_BUDGET_CENTS) || DEFAULT_DAILY_BUDGET_CENTS
  const userDailyMax = Number(process.env.ORACLE_USER_DAILY_RENDERS) || DEFAULT_USER_DAILY_RENDERS
  const dailySpent = await readDailyCostCents()
  if (dailySpent >= dailyBudgetCents) {
    return res.status(429).json({
      error: 'daily_budget_exhausted',
      message: 'Mythsensus oracle daily budget reached — please try again tomorrow.',
      daily_spent_cents: dailySpent,
      daily_budget_cents: dailyBudgetCents,
    })
  }
  const userRenders = await readUserDailyRenders(body.chart_hash)
  if (userRenders >= userDailyMax) {
    return res.status(429).json({
      error: 'user_daily_limit',
      message: `Limit ${userDailyMax} readings per chart per 24h. Try again later.`,
      user_renders: userRenders,
    })
  }

  // 3. Live render
  let oracle, costCents
  try {
    const systemPrompt = buildSystemPrompt(body.system)
    const userMessage = buildUserMessage(body)
    const result = await callAnthropic(systemPrompt, userMessage)
    costCents = result.costCents

    // Parse JSON. Sonnet is told "no fence", but be lenient.
    let txt = result.text.trim()
    if (txt.startsWith('```')) {
      txt = txt.replace(/^```(?:json)?\n?/i, '').replace(/```\s*$/, '').trim()
    }
    try {
      oracle = JSON.parse(txt)
    } catch (parseErr) {
      return res.status(502).json({
        error: 'oracle_invalid_json',
        message: parseErr.message,
        sample: txt.slice(0, 200),
      })
    }

    // Ensure system + lang + prompt_version are stamped even if LLM forgets
    oracle.system = body.system
    oracle.lang = body.lang
    oracle.year = body.year
    oracle.prompt_version = cache_key.prompt_version

    const validErr = validateOracleOutput(oracle)
    if (validErr) {
      return res.status(502).json({
        error: 'oracle_validation_failed',
        message: validErr,
        partial: oracle,
      })
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      return res.status(504).json({ error: 'render_timeout', message: `> ${RENDER_TIMEOUT_MS}ms` })
    }
    return res.status(502).json({ error: 'oracle_render_failed', message: e.message })
  }

  // 4. Persist cache (fire-and-forget — don't block response)
  writeCache({
    ...cache_key,
    oracle_json: oracle,
    cost_cents: costCents,
    model: MODEL,
  }).catch(() => {})

  return res.status(200).json({
    oracle,
    cached: false,
    generated_ms: Date.now() - t0,
    cost_cents: costCents,
    model: MODEL,
  })
}
