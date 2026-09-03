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
// 3 ก.ย. 69: 4-6 -> 5 · ถูกกว่าและใหม่กว่า · ถอยกลับ = แก้บรรทัดนี้กลับแล้ว deploy
const DEFAULT_MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 7000 // 6 cat × 10 Q — raised from 5500 when health + people returned (2026-06-23)
const RENDER_TIMEOUT_MS = 140_000 // abort early enough that the 'error' write lands
// before Supabase kills the instance at the 150s wall-clock ceiling — a slow render
// then flips to 'error' and auto-retries on the next poll, instead of sticking 'running'.

// ราคาต่อล้านโทเคน (input, output) เป็นเซนต์ — ⛔ ห้ามฝังเรตลงในสูตรคิดเงินอีก
// เคยฝังเรตของ Sonnet 4.6 ไว้ตรงๆ พอสลับเป็น Sonnet 5 ก็คิดเงินเกินจริง 1.5 เท่าเงียบๆ
// ⛔ ห้ามเขียนราคาจากความจำ — ค่าพวกนี้ลอกมาจากตารางราคาทางการ ตรวจซ้ำก่อนแก้เสมอ
const PRICE_CENTS_PER_MTOK: Record<string, [number, number]> = {
  'claude-sonnet-5': [200, 1000],
  'claude-sonnet-4-6': [300, 1500],
  'claude-haiku-4-5': [100, 500],
  'claude-opus-5': [500, 2500],
}
function centsFor(model: string, usage: any): number {
  const [pi, po] = PRICE_CENTS_PER_MTOK[model] || PRICE_CENTS_PER_MTOK['claude-sonnet-5']
  const inTok = (usage?.input_tokens || 0) + (usage?.cache_read_input_tokens || 0) * 0.1
  // cost_cents เป็น INTEGER → ปัดขึ้นเป็นเซนต์เต็ม (PostgREST ไม่รับทศนิยม)
  return Math.ceil((inTok / 1e6) * pi + ((usage?.output_tokens || 0) / 1e6) * po)
}

// ยิง Anthropic หนึ่งก้อน แล้วคืน JSON ที่ parse แล้ว + usage
// ⛔ ห้ามกลืน stop_reason — refusal กับ max_tokens ต้องโยน ไม่ใช่ปล่อยให้ jsonrepair
//    ซ่อมคำอ่านที่ขาดครึ่งให้กลายเป็น JSON ที่ถูกต้องแล้วแคชไว้ขายคน
async function callOnce(opts: {
  systemPrompt: string; userMessage: string; maxTokens: number; model: string; signal: AbortSignal
}): Promise<{ obj: any; usage: any }> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      // ⛔ Sonnet 5 เปิดโหมดคิดเองอัตโนมัติถ้าไม่สั่งอะไร และโทเคนที่ใช้คิด
      //    กินจาก max_tokens ก้อนเดียวกับคำตอบ
      //    3 ก.ย. 69 วัดของจริง: ก้อนเล็กสุด (2 คำถาม) ใช้ 2,200/2,200 ไปกับการคิด
      //    เหลือให้คำตอบ 0 ⇒ ตัน max_tokens ครบทั้ง 10 ก้อน
      //    งานนี้คือเขียนคำตอบตามรูปแบบที่กำหนด ไม่ใช่โจทย์ที่ต้องคิดยาว
      //    ปิดแล้วได้พฤติกรรมเดียวกับ Sonnet 4.6 ที่ของเดิมสร้างและทดสอบมาบนนั้น
      thinking: { type: 'disabled' },
      system: opts.systemPrompt,
      messages: [{ role: 'user', content: opts.userMessage }],
    }),
    signal: opts.signal,
  })
  if (!resp.ok) throw new Error('anthropic ' + resp.status + ': ' + (await resp.text()).slice(0, 200))
  const data = await resp.json()
  if (data.stop_reason === 'refusal') throw new Error('anthropic refused: ' + (data.stop_details?.category ?? 'unknown'))
  if (data.stop_reason === 'max_tokens') {
    const th = data.usage?.output_tokens_details?.thinking_tokens || 0
    throw new Error('anthropic hit max_tokens (' + opts.maxTokens + ')' +
      (th ? ` — ${th} tokens ไปกับการคิด เหลือให้คำตอบ ${(data.usage?.output_tokens || 0) - th}` : ' — truncated') + ', not caching')
  }
  let txt = (Array.isArray(data.content) ? data.content : [])
    .filter((b: any) => b?.type === 'text').map((b: any) => b.text || '').join('').trim()
  if (!txt) throw new Error('anthropic returned no text block (stop_reason=' + data.stop_reason + ')')
  // ⛔ ห้ามตัดแค่ fence ที่อยู่ต้นสตริง — 3 ก.ย. 69 มีก้อนหนึ่งใส่ backtick ไว้กลาง
  //    jsonrepair ซ่อมไม่ได้ ทั้งเฟสเลยถูกทิ้งทั้งที่อีก 9 ก้อนสำเร็จ
  //    จึงตัดเอาเฉพาะช่วงจาก { แรกถึง } สุดท้าย แทนการเดาจากหัวท้าย
  txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const _i = txt.indexOf('{'), _j = txt.lastIndexOf('}')
  if (_i >= 0 && _j > _i) txt = txt.slice(_i, _j + 1)
  let obj: any
  try { obj = JSON.parse(txt) } catch (_) { obj = JSON.parse(jsonrepair(txt)) }
  return { obj, usage: data.usage || {} }
}

async function upsertPhase(ck: any, patch: Record<string, unknown>) {
  const r = await fetch(`${REST}/myth_addon_reading?on_conflict=chart_hash,system,lang,relationship_status,prompt_version`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      chart_hash: ck.chart_hash, system: ck.system, lang: ck.lang,
      relationship_status: ck.relationship_status, prompt_version: ck.prompt_version,
      generated_at_iso: new Date().toISOString(), ...patch,
    }),
  })
  if (!r.ok) throw new Error('phase upsert ' + r.status + ': ' + (await r.text()).slice(0, 160))
}

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

// Source-of-truth output validator (6 sections / 10 answers, tag caps 4,
// word_count 600-1800). Mirrors _shared/schema.ts. Never cache an invalid reading.
function validateOracleOutput(out: any): string | null {
  if (!out || typeof out !== 'object') return 'not an object'
  if (!out.title || !out.hero_statement) return 'missing title/hero_statement'
  if (!Array.isArray(out.sections) || out.sections.length !== 6) {
    return `sections must be exactly 6, got ${out.sections ? out.sections.length : 0}`
  }
  const VALID_CATEGORIES = ['work', 'money', 'love', 'health', 'people', 'warning']
  const VALID_TAGS = ['peak', 'caution', 'open', 'consolidate', 'neutral']
  const VALID_Q_KEYS: Record<string, string[]> = {
    work: ['work_energy_direction', 'work_boldest_move_window'],
    money: ['money_flow_direction', 'money_leak_or_windfall'],
    love: ['love_energy_state', 'love_timing_windows'],
    health: ['health_weak_point'],
    people: ['people_who_changes_you'],
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
  if (total !== 10) return `must have exactly 10 answers, got ${total}`
  if (tags.peak > 4) return `peak ${tags.peak} > cap 4`
  if (tags.caution > 4) return `caution ${tags.caution} > cap 4`
  const wc = Number(out.word_count) || 0
  if (wc < 600 || wc > 1800) return `word_count ${wc} out of bounds`
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
  const batch = Array.isArray(body.calls) && body.calls.length > 0
  if (!batch && (!body.systemPrompt || !body.userMessage)) return json({ error: 'missing prompt' }, 400)
  if (batch && !['answers', 'compose'].includes(body.phase)) return json({ error: 'batch needs phase answers|compose' }, 400)
  if (batch && body.calls.length > 12) return json({ error: 'too many calls (max 12)' }, 400)
  const jobKey = [ck.chart_hash, ck.system, ck.lang, ck.relationship_status, ck.prompt_version].join('|')

  // Mark running (the Vercel side already gated duplicate triggers via job freshness).
  await upsertJob(jobKey, 'running')

  // ── โหมดยิงขนาน — ชั้น 1 (คำตอบ 45 ข้อ) และชั้น 2 (เรียบเรียง) ─────────────
  //
  // ทำไมต้องแตกก้อน: เพดาน max_tokens ต่อครั้งคือ 7000 แต่ชั้น 1 ทั้งชุด ~22,000
  // และเวลาไล่เขียนทีเดียวเกิน 150 วินาทีที่ Supabase ให้ ⇒ ก้อนเล็กหลายก้อนขนานกัน
  // ทั้งลงใต้เพดานและเสร็จในเวลาของก้อนที่ช้าที่สุด ไม่ใช่ผลรวม
  //
  // ⛔ ก้อนไหนพังก้อนเดียว = ทั้งเฟสถือว่าพัง ห้ามแคชของที่ไม่ครบ
  //    คนจ่ายเงินแล้วได้คำอ่านที่หายไปสามหมวดคือของเสียที่มองไม่เห็น
  if (batch) {
    const runBatch = (async () => {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS)
        let settled: PromiseSettledResult<{ key: string; obj: any; usage: any }>[]
        try {
          settled = await Promise.allSettled(body.calls.map(async (c: any) => {
            const r = await callOnce({
              systemPrompt: c.systemPrompt, userMessage: c.userMessage,
              maxTokens: Math.min(Number(c.maxTokens) || 6000, 16000),
              model: body.model || DEFAULT_MODEL, signal: controller.signal,
            })
            return { key: String(c.key), obj: r.obj, usage: r.usage }
          }))
        } finally { clearTimeout(timer) }

        const failed = settled.filter(x => x.status === 'rejected')
        if (failed.length) {
          throw new Error(`${failed.length}/${body.calls.length} ก้อนพัง: ` +
            failed.map((f: any) => String(f.reason).slice(0, 90)).join(' | '))
        }
        const ok = settled.map((x: any) => x.value)
        const merged: Record<string, any> = {}
        let cents = 0
        for (const r of ok) { merged[r.key] = r.obj; cents += centsFor(body.model || DEFAULT_MODEL, r.usage) }

        if (body.phase === 'answers') {
          const n = Object.values(merged).reduce((a: number, g: any) => a + (Array.isArray(g?.answers) ? g.answers.length : 0), 0)
          if (n !== 45) throw new Error(`ชั้น 1 ต้องได้ 45 ข้อ ได้ ${n}`)
          await upsertPhase(ck, { answers_json: merged, phase: 'answers', cost_cents: cents, model: body.model || DEFAULT_MODEL })
        } else {
          const chapters = Object.keys(merged).length
          if (chapters !== 6) throw new Error(`ชั้น 2 ต้องได้ 6 บท ได้ ${chapters}`)
          for (const [k, v] of Object.entries(merged)) {
            if (!v?.title || !Array.isArray(v?.blocks) || !v.blocks.length) throw new Error(`บท ${k} ไม่มี title/blocks`)
          }
          await upsertPhase(ck, { oracle_json: { schema: '3.0-composed', system: ck.system, lang: ck.lang, chapters: merged }, phase: 'done', cost_cents: cents, model: body.model || DEFAULT_MODEL })
        }
        await upsertJob(jobKey, body.phase === 'answers' ? 'answers_ready' : 'done')
      } catch (e) {
        await upsertJob(jobKey, 'error', String(e).slice(0, 300))
      }
    })()
    // @ts-ignore EdgeRuntime is provided by the Supabase Edge runtime.
    EdgeRuntime.waitUntil(runBatch)
    return json({ status: 'started', phase: body.phase, calls: body.calls.length }, 202)
  }

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
      // A refusal returns HTTP 200 with an empty/partial `content`, and a
      // truncated answer returns whole JSON minus its tail. Both used to fall
      // through to jsonrepair, which would happily "fix" a half-reading into
      // valid JSON and cache it — a paying user then gets a silently truncated
      // deep reading. Fail loudly instead; the poller retries on the next call.
      if (data.stop_reason === 'refusal') throw new Error('anthropic refused: ' + (data.stop_details?.category ?? 'unknown'))
      if (data.stop_reason === 'max_tokens') throw new Error('anthropic hit max_tokens (' + MAX_TOKENS + ') — answer truncated, not caching')
      // Concatenate every text block instead of indexing content[0]. On models
      // that think (adaptive thinking is ON BY DEFAULT from Sonnet 5 onward
      // when `thinking` is omitted — it was OFF on Sonnet 4.6), content[0] is a
      // thinking block whose text is empty under the default display:"omitted",
      // so the old code read '' and every render failed at JSON.parse.
      let txt = (Array.isArray(data.content) ? data.content : [])
        .filter((b: any) => b?.type === 'text')
        .map((b: any) => b.text || '')
        .join('')
        .trim()
      if (!txt) throw new Error('anthropic returned no text block (stop_reason=' + data.stop_reason + ', blocks=' + (data.content || []).map((b: any) => b?.type).join(',') + ')')
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
      const costCents = centsFor(body.model || DEFAULT_MODEL, usage)
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
