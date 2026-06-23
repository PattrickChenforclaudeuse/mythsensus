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
// ── Model: Sonnet 4.6 via a PARALLEL PER-SECTION split (2026-06-23) ───────────
// Director feedback: Haiku 4.5's Thai reads as translationese (e.g. "คู่สัญญา"
// for spouse) — a model-level limitation the prompt can't fix. Sonnet 4.6's Thai
// is native/fluent, BUT a full 4-section reading takes ~100s, over Vercel Hobby's
// 60s function ceiling. Rather than pay for Vercel Pro (300s), we render the four
// sections CONCURRENTLY in one function (1 Sonnet call each), then merge.
// Promise.all wall-clock ≈ the slowest single section, not the sum.
// Why ONE section per call (not two): each call uses forced tool-use for
// guaranteed-valid JSON (Sonnet otherwise emits unescaped quotes in Thai bodies),
// and tool-use is ~20% slower — two sections/call measured ~65s (over ceiling),
// one section/call measures ~37s with comfortable margin. Merge → validate →
// cache the full reading under one key, so every later read is one instant hit.
const MODEL = 'claude-sonnet-4-6'
const PART_MAX_TOKENS = 2000          // per call (1 section ≈ 230 words ≈ 1400 tok;
                                       // 2000 leaves headroom without truncating).
const RENDER_TIMEOUT_MS = 56_000      // per call. All run in parallel, so the
                                       // function's total wall-clock ≈ one call, not
                                       // the sum — stays under Vercel's 60s ceiling.
// One render call per category, all fired in parallel. The 'work' call also
// carries the header (title/subtitle/hero); the rest omit it. Merge → 4 sections.
const RENDER_PARTS = [
  { categories: ['work'], includeHeader: true },
  { categories: ['money'], includeHeader: false },
  { categories: ['love'], includeHeader: false },
  { categories: ['warning'], includeHeader: false },
]
const DEFAULT_DAILY_BUDGET_CENTS = 3000
const DEFAULT_USER_DAILY_RENDERS = 10

// ─── Auth / entitlement (2026-06-10) ─────────────────────
// The Deep Reading is a paid product, but this endpoint shipped with NO
// server-side auth: a full audit confirmed any unauthenticated curl triggered
// a real (paid) Anthropic call — denial-of-wallet + free $9 readings. The
// client paywall (_hasItemAccess) is UI-only and trivially bypassed. This gate
// (director-approved 2026-06-10) requires a valid Supabase session AND an
// entitlement before any LLM/cache work. Owner emails always pass so the
// product owner can verify the paid path without a test purchase.
const OWNER_EMAILS = ['chaiyapat.c@yoohui.co.th', 'garsell@hotmail.com']
// myth_purchases item_keys that include Deep Reading access.
const DEEP_ENTITLEMENT_ITEMS = ['deep', 'full_report']

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
// When `half` is given, add the partial-render protocol fields so this call emits
// only that half's categories (see system-prompt-base.md "Partial-render protocol").
function buildUserMessage(body, half) {
  const payload = {
    system: body.system,
    lang: body.lang,
    year: body.year,
    chart: body.chart,
    months: body.months || [],
    context: body.context || {},
  }
  if (half) {
    payload.render_only = half.categories
    payload.include_header = half.includeHeader
  }
  return JSON.stringify(payload, null, 2)
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
  if (!Array.isArray(out.sections) || out.sections.length !== 4) {
    return `sections must be exactly 4, got ${out.sections ? out.sections.length : 0}`
  }
  const VALID_CATEGORIES = ['work', 'money', 'love', 'warning']
  const VALID_TAGS = ['peak', 'caution', 'open', 'consolidate', 'neutral']
  const VALID_Q_KEYS_BY_CATEGORY = {
    work:    ['work_energy_direction', 'work_boldest_move_window'],
    money:   ['money_flow_direction', 'money_leak_or_windfall'],
    love:    ['love_energy_state', 'love_timing_windows'],
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
  if (totalAnswers !== 8) return `must have exactly 8 answers, got ${totalAnswers}`
  // cap 4 (matches prompt "1-4"); each parallel half is told to use ≤2 each so the
  // merged reading lands ≤4 without the two halves having to coordinate tags.
  if (tagCounts.peak > 4) return `peak ${tagCounts.peak} > cap 4`
  if (tagCounts.caution > 4) return `caution ${tagCounts.caution} > cap 4`
  const wc = Number(out.word_count) || 0
  // Scope-reduced schema (2026-06-09): 4 sections × 2 Qs each. Bounds 500-1300 words.
  if (wc < 500 || wc > 1300) return `word_count ${wc} out of bounds`
  return null
}

// ─── Anthropic API call (raw fetch — no SDK dependency) ───
// FULLY-FLAT, SCALAR-ONLY tool schema (one section per call). Hard-won: Sonnet
// under forced tool-use intermittently emits ANY nested array/object field
// (sections[], then questions[], then even a named answer object) as a *malformed
// JSON string* — because the Thai text inside carries quotes the model fails to
// escape when it hand-stringifies. The cure is to leave NOTHING nested: every
// field is a plain string or number, so there is nothing for the model to
// stringify and the API guarantees each scalar string is correctly escaped.
// The two answers are split into a1_* / a2_* scalar fields; *_engine_refs and
// *_month_refs are comma-separated strings that the merge splits back to arrays.
const TAG_ENUM = ['peak', 'caution', 'open', 'consolidate', 'neutral']
const answerFields = (pre) => ({
  [`${pre}_q_key`]: { type: 'string', description: 'exact q_key from the prompt table' },
  [`${pre}_headline`]: { type: 'string' },
  [`${pre}_body`]: { type: 'string', description: '40-70 Thai words' },
  [`${pre}_tag`]: { type: 'string', enum: TAG_ENUM },
  [`${pre}_month_refs`]: { type: 'string', description: 'comma-separated month labels, e.g. "ม.ค., พ.ค.–มิ.ย." (may be empty)' },
  [`${pre}_engine_refs`]: { type: 'string', description: 'comma-separated input field names you used, e.g. "bazi.dayMaster, months[0].ten_god"' },
})
const ORACLE_TOOL = {
  name: 'emit_oracle_section',
  description: 'Return ONE section of the oracle reading for this chart, as flat scalar fields. The work call also fills the shared header (title/subtitle/hero_statement). Each section has exactly two answers: a1_* and a2_*.',
  input_schema: {
    type: 'object',
    properties: {
      // Shared header — only the call with include_header:true fills these.
      title: { type: 'string' },
      subtitle: { type: 'string' },
      hero_statement: { type: 'string' },
      // The one section this call renders.
      category: { type: 'string', enum: ['work', 'money', 'love', 'warning'] },
      opening: { type: 'string' },
      framing: { type: 'string' },
      closing: { type: 'string' },
      ...answerFields('a1'),
      ...answerFields('a2'),
      word_count: { type: 'number' },
    },
    required: [
      'category', 'opening', 'framing', 'closing', 'word_count',
      'a1_q_key', 'a1_headline', 'a1_body', 'a1_tag', 'a1_engine_refs',
      'a2_q_key', 'a2_headline', 'a2_body', 'a2_tag', 'a2_engine_refs',
    ],
  },
}

// Returns { data: <structured object>, costCents, ... }. `data` is already a
// parsed object (from the forced tool call) — no JSON.parse needed.
async function callAnthropic(systemPrompt, userMessage, maxTokens = PART_MAX_TOKENS) {
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
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: [ORACLE_TOOL],
        tool_choice: { type: 'tool', name: ORACLE_TOOL.name },
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
  const toolBlock = (data.content || []).find((b) => b.type === 'tool_use')
  if (!toolBlock || !toolBlock.input) {
    throw new Error('no tool_use block in response (stop_reason: ' + (data.stop_reason || '?') + ')')
  }
  const usage = data.usage || {}
  // Sonnet 4.6 pricing — input $3/MTok, output $15/MTok (2 parallel calls/render).
  const inputTokens = usage.input_tokens || 0
  const outputTokens = usage.output_tokens || 0
  const costCents = Math.ceil((inputTokens * 0.0003 + outputTokens * 0.0015) * 100) / 100
  return { data: toolBlock.input, costCents, inputTokens, outputTokens }
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

// Verify the caller is a signed-in, entitled user before any paid work.
// Returns { ok:true, userKey, via } or { ok:false, status, error, message }.
// Fails CLOSED on every uncertainty (misconfig, network, DB error) so a fault
// can never re-open the denial-of-wallet hole — owners/premium short-circuit
// before the DB query, so a purchase-table outage never blocks subscribers.
async function requireOracleAccess(req) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !ANON) {
    return { ok: false, status: 503, error: 'auth_unconfigured', message: 'Oracle is temporarily unavailable.' }
  }
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return { ok: false, status: 401, error: 'auth_required', message: 'Please sign in to use Deep Reading.' }
  }
  // 1. token → user (server-validated; returns current DB app_metadata)
  let user
  try {
    const r = await fetch(SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/user', {
      headers: { apikey: ANON, Authorization: 'Bearer ' + token },
    })
    if (!r.ok) return { ok: false, status: 401, error: 'invalid_token', message: 'Your session expired — please sign in again.' }
    user = await r.json()
  } catch (_) {
    return { ok: false, status: 503, error: 'auth_check_failed', message: 'Could not verify your session — please try again.' }
  }
  const email = (user && user.email || '').toLowerCase()
  const plan = (user && user.app_metadata && user.app_metadata.plan) || 'free'
  if (!email) return { ok: false, status: 403, error: 'no_email', message: 'Account email is missing.' }
  const userKey = 'u:' + email
  // 2. entitlement — owner (verification), premium subscriber, or deep purchase
  if (OWNER_EMAILS.includes(email)) return { ok: true, userKey, via: 'owner' }
  if (plan === 'premium') return { ok: true, userKey, via: 'premium' }
  try {
    const sql = `SELECT 1 FROM public.myth_purchases
                 WHERE lower(email) = '${sqlEscape(email)}'
                   AND refunded = false
                   AND item_key IN (${DEEP_ENTITLEMENT_ITEMS.map((k) => `'${sqlEscape(k)}'`).join(',')})
                 LIMIT 1`
    const rows = await supabaseQuery(sql)
    if (Array.isArray(rows) && rows.length > 0) return { ok: true, userKey, via: 'purchase' }
  } catch (_) {
    return { ok: false, status: 503, error: 'entitlement_check_failed', message: 'Could not verify your purchase — please try again.' }
  }
  return { ok: false, status: 403, error: 'not_entitled', message: 'Deep Reading requires a Mythsensus subscription or purchase.' }
}

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
  // CORS — lock to the Mythsensus origin(s) instead of '*' (2026-06-10).
  // Same-origin app calls don't need an ACAO header, so the real site is
  // unaffected; this only stops OTHER websites' browsers from invoking this
  // paid endpoint cross-origin. NOTE: CORS is browser-enforced only — it does
  // NOT stop curl/script abuse (that needs auth/rate-limiting, tracked
  // separately). Preview deploys (*.vercel.app) are reflected for QA.
  const origin = req.headers.origin || ''
  const allowed = origin === 'https://mythsensus.com'
    || origin === 'https://www.mythsensus.com'
    || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
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

  // AUTH GATE — before any cache read or LLM call. Cached reads are still paid
  // content, so unauthenticated/unentitled callers are blocked here too.
  const access = await requireOracleAccess(req)
  if (!access.ok) {
    return res.status(access.status).json({ error: access.error, message: access.message })
  }

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

  // 3. Live render — four sections IN PARALLEL (RENDER_PARTS), 1 Sonnet call each.
  //    Promise.all wall-clock ≈ the slowest single call, so the function stays
  //    under Vercel's 60s ceiling while keeping Sonnet's native Thai.
  let oracle, costCents
  try {
    const systemPrompt = buildSystemPrompt(body.system)
    const halves = await Promise.all(
      RENDER_PARTS.map((part) =>
        callAnthropic(systemPrompt, buildUserMessage(body, part), PART_MAX_TOKENS)
      )
    )
    costCents = halves.reduce((sum, h) => sum + (h.costCents || 0), 0)

    // Each call returns ONE flat section as scalar fields (forced tool-use). Build
    // the sections array ourselves. validateOracleOutput() below enforces the
    // 4-section / 8-answer whole (a part that returned nothing usable → <4 → 502).
    const parsed = halves.map((h) => h.data)
    // Every tool field is a scalar. Split the comma-separated *_refs back into
    // arrays and assemble each section's two answers from its a1_* / a2_* fields.
    const splitCsv = (s) => Array.isArray(s)
      ? s
      : (typeof s === 'string' ? s.split(',').map((x) => x.trim()).filter(Boolean) : [])
    const mkAnswer = (p, pre) => (p && p[`${pre}_q_key`]) ? {
      q_key: p[`${pre}_q_key`],
      headline: p[`${pre}_headline`],
      body: p[`${pre}_body`],
      tag: p[`${pre}_tag`],
      month_refs: splitCsv(p[`${pre}_month_refs`]),
      engine_refs: splitCsv(p[`${pre}_engine_refs`]),
    } : null

    // Merge: header from whichever part carried it, sections assembled in canonical
    // work→money→love→warning order, word_count summed. Validate the merged whole.
    const header = parsed.find((p) => p && p.hero_statement) || parsed[0] || {}
    const ORDER = { work: 0, money: 1, love: 2, warning: 3 }
    const allSections = parsed
      .filter((p) => p && p.category)
      .map((p) => ({
        category: p.category,
        opening: p.opening,
        framing: p.framing,
        closing: p.closing,
        questions: [mkAnswer(p, 'a1'), mkAnswer(p, 'a2')].filter(Boolean),
      }))
      .sort((a, b) => (ORDER[a.category] ?? 9) - (ORDER[b.category] ?? 9))
    oracle = {
      title: header.title || '',
      subtitle: header.subtitle || '',
      hero_statement: header.hero_statement || '',
      sections: allSections,
      word_count: parsed.reduce((sum, p) => sum + (Number(p && p.word_count) || 0), 0),
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
