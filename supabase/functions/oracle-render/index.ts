// supabase/functions/oracle-render  (woam) — long-running Oracle render worker.
//
// WHY THIS EXISTS: the Deep Reading render takes ~100s on Sonnet 4.6, over Vercel
// Hobby's 60s function ceiling. Instead of Vercel Pro or a fragile 4-way parallel
// split, we decouple: the Vercel endpoint does auth/entitlement/cost-guard + builds
// the prompt, then fires this worker. Supabase Edge Functions allow 150s wall-clock
// (free) — plenty for ONE clean Sonnet call. The worker renders in the background
// (EdgeRuntime.waitUntil), validates, and upserts public.myth_addon_reading. The
// browser polls the Vercel endpoint (cache read) until the row appears.
//
// SECURITY: server-to-server only — caller must present the shared ORACLE_RENDER_SECRET.
// No user auth here (entitlement was already checked on the Vercel side). Deployed
// with --no-verify-jwt. DB access via the auto-injected service role + PostgREST.
//
// Secrets to set: ORACLE_RENDER_SECRET, ANTHROPIC_API_KEY
// (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform.)

// jsonrepair recovers the occasional malformed JSON (an unescaped quote inside a
// Thai string) — we can't re-render within the 150s ceiling, so repair instead.
import { jsonrepair } from 'https://esm.sh/jsonrepair@3'

const SECRET = Deno.env.get('ORACLE_RENDER_SECRET') ?? ''
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const REST = SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1'
const DEFAULT_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 5500
const RENDER_TIMEOUT_MS = 140_000 // margin under the 150s wall-clock ceiling

const sbHeaders = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' }

async function upsertJob(jobKey: string, status: string, error?: string | null) {
  await fetch(`${REST}/oracle_render_jobs?on_conflict=job_key`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ job_key: jobKey, status, error: error ?? null, updated_at: new Date().toISOString() }),
  }).catch(() => {})
}

async function upsertCache(ck: any, oracle: any, costCents: number, model: string) {
  const r = await fetch(`${REST}/myth_addon_reading?on_conflict=chart_hash,system,lang,relationship_status,prompt_version`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      chart_hash: ck.chart_hash, system: ck.system, lang: ck.lang,
      relationship_status: ck.relationship_status, prompt_version: ck.prompt_version,
      oracle_json: oracle, cost_cents: costCents, model, generated_at_iso: new Date().toISOString(),
    }),
  })
  if (!r.ok) throw new Error('cache upsert ' + r.status + ': ' + (await r.text()).slice(0, 160))
}

// Mirrors validateOracleOutput() in api/oracle/addon.js (4 sections / 8 answers,
// tag caps 4, word_count 500-1300). Never cache an invalid reading.
function validateOracleOutput(out: any): string | null {
  if (!out || typeof out !== 'object') return 'not an object'
  if (!out.title || !out.hero_statement) return 'missing title/hero_statement'
  if (!Array.isArray(out.sections) || out.sections.length !== 4) {
    return `sections must be exactly 4, got ${out.sections ? out.sections.length : 0}`
  }
  const VALID_CATEGORIES = ['work', 'money', 'love', 'warning']
  const VALID_TAGS = ['peak', 'caution', 'open', 'consolidate', 'neutral']
  const VALID_Q_KEYS: Record<string, string[]> = {
    work: ['work_energy_direction', 'work_boldest_move_window'],
    money: ['money_flow_direction', 'money_leak_or_windfall'],
    love: ['love_energy_state', 'love_timing_windows'],
    warning: ['warning_high_risk_window', 'warning_specific'],
  }
  const seen = new Set<string>()
  let total = 0
  const tags: Record<string, number> = { peak: 0, caution: 0, open: 0, consolidate: 0, neutral: 0 }
  for (const sec of out.sections) {
    if (!VALID_CATEGORIES.includes(sec.category)) return `unknown category: ${sec.category}`
    if (seen.has(sec.category)) return `duplicate category: ${sec.category}`
    seen.add(sec.category)
    if (!sec.opening || !sec.closing || !sec.framing) return `section ${sec.category} missing opening/framing/closing`
    if (!Array.isArray(sec.questions)) return `section ${sec.category} missing questions`
    const allowed = VALID_Q_KEYS[sec.category]
    for (const a of sec.questions) {
      if (!allowed.includes(a.q_key)) return `q_key ${a.q_key} not allowed in ${sec.category}`
      if (!a.headline || !a.body) return `answer ${a.q_key} missing headline/body`
      if (!Array.isArray(a.engine_refs) || a.engine_refs.length === 0) return `answer ${a.q_key} needs engine_refs`
      if (!VALID_TAGS.includes(a.tag)) return `answer ${a.q_key} invalid tag: ${a.tag}`
      tags[a.tag]++
      total++
    }
  }
  if (total !== 8) return `must have exactly 8 answers, got ${total}`
  if (tags.peak > 4) return `peak ${tags.peak} > cap 4`
  if (tags.caution > 4) return `caution ${tags.caution} > cap 4`
  const wc = Number(out.word_count) || 0
  if (wc < 500 || wc > 1300) return `word_count ${wc} out of bounds`
  return null
}

const json = (obj: unknown, status: number) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'bad json' }, 400) }
  if (!SECRET || body?.secret !== SECRET) return json({ error: 'forbidden' }, 403)

  const ck = body.cache_key || {}
  for (const k of ['chart_hash', 'system', 'lang', 'relationship_status', 'prompt_version']) {
    if (!ck[k]) return json({ error: 'missing cache_key.' + k }, 400)
  }
  if (!body.systemPrompt || !body.userMessage) return json({ error: 'missing prompt' }, 400)
  const jobKey = [ck.chart_hash, ck.system, ck.lang, ck.relationship_status, ck.prompt_version].join('|')

  // Mark running (the Vercel side already gated duplicate triggers via job freshness).
  await upsertJob(jobKey, 'running')

  const render = (async () => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS)
      let resp: Response
      try {
        resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({
            model: body.model || DEFAULT_MODEL,
            max_tokens: MAX_TOKENS,
            system: body.systemPrompt,
            messages: [{ role: 'user', content: body.userMessage }],
          }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }
      if (!resp.ok) throw new Error('anthropic ' + resp.status + ': ' + (await resp.text()).slice(0, 200))
      const data = await resp.json()
      let txt = (data.content?.[0]?.text || '').trim()
      if (txt.startsWith('```')) txt = txt.replace(/^```(?:json)?\n?/i, '').replace(/```\s*$/, '').trim()
      let oracle: any
      try {
        oracle = JSON.parse(txt)
      } catch (_) {
        oracle = JSON.parse(jsonrepair(txt)) // recover an unescaped quote etc.
      }
      oracle.system = ck.system
      oracle.lang = ck.lang
      oracle.year = ck.year
      oracle.prompt_version = ck.prompt_version
      const verr = validateOracleOutput(oracle)
      if (verr) throw new Error('validation: ' + verr)

      const usage = data.usage || {}
      // cost_cents is an INTEGER column → round UP to whole cents (PostgREST rejects floats).
      const costCents = Math.ceil((usage.input_tokens || 0) * 0.0003 + (usage.output_tokens || 0) * 0.0015)
      await upsertCache(ck, oracle, costCents, body.model || DEFAULT_MODEL)
      await upsertJob(jobKey, 'done')
    } catch (e) {
      await upsertJob(jobKey, 'error', String(e).slice(0, 300))
    }
  })()

  // Keep the instance alive for the background render after returning 202.
  // @ts-ignore EdgeRuntime is provided by the Supabase Edge runtime.
  EdgeRuntime.waitUntil(render)
  return json({ status: 'started' }, 202)
})
