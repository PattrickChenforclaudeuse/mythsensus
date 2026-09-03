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
  'nativeAmerican', 'ifaYoruba', 'aboriginal',
  'vedicMahadasha', 'taksa',
]
// ⛔ ถอด 'biorhythm' ออก 2 ก.ย. 69 (director สั่ง) —
//    ไบโอริทึมไม่ได้อยู่ใน 26 ศาสตร์ที่เราประกาศขายตั้งแต่ 6 มิ.ย. 69 (ทักษาเข้าแทน)
//    แต่ยังค้างอยู่ในลิสต์นี้ ⇒ ขาย Deep Reading ของศาสตร์ที่ไม่ได้อยู่ในสินค้าได้
//    ตรวจก่อนถอด: myth_addon_reading มี 3 แถวทั้งหมด (numerology×2 · bazi×1)
//    ไม่มีใครเคย render ไบโอริทึม และคีย์ซื้อเป็น 'deep' รวม ไม่ได้แยกรายศาสตร์ ⇒ ไม่กระทบใคร
//    ไบโอริทึมยังอยู่ในแอปเป็นชั้นรายวัน (scoring:false) เหมือนเดิม แค่ไม่ใช่ของที่ขาย
//
// ⚠️ ยังไม่ใส่ 'thaiSeven' แทน แม้มันจะเป็นศาสตร์ที่ 26 จริง —
//    เพราะสูตรฐานของเราน่าจะผิดตั้งแต่ฐาน 4 (ดูคอมเมนต์ที่ calcThaiSeven ใน calc.ts)
//    ขายคำอ่านบนสูตรที่ยังสงสัยไม่ได้ · ปลดล็อกเมื่อยืนยันสูตรกับตำราแล้ว

// 3 ก.ย. 69: 2.1 (6 หมวด x 10 คำถาม ยิงครั้งเดียว) -> 3.0 (45 ข้อ + เรียบเรียง 6 บท)
// prompt_version คำนวณจากค่านี้ ⇒ แถวแคชเก่าไม่ชนกับใหม่ ถอยกลับได้ด้วยการเปลี่ยนค่านี้กลับ
const SCHEMA_VERSION = '3.0'
// ── Decoupled render (2026-06-23) ────────────────────────────────────────────
// The Deep Reading takes ~100s on Sonnet 4.6 (whose Thai is native, unlike Haiku's
// translationese). That's over Vercel Hobby's 60s function ceiling, so this
// endpoint does NOT render. It checks the cache + enforces auth/cost guards, then
// fires a Supabase Edge Function on woam (oracle-render, 150s ceiling) that does
// ONE Sonnet call and writes the cache. The browser polls this endpoint until the
// cached row appears. See supabase/functions/oracle-render/index.ts.
// 3 ก.ย. 69: 4-6 -> 5 · ถูกกว่า ($2/$10 เทียบ $3/$15 ต่อล้านโทเคน) และใหม่กว่า
// ⛔ ห้ามเปลี่ยนเป็น Haiku — ทดสอบแล้วภาษาไทยไม่ผ่าน (แปลแข็ง) เห็นใน CLAUDE.md
const RENDER_MODEL = 'claude-sonnet-5'
const ORACLE_RENDER_URL = process.env.ORACLE_RENDER_URL || 'https://woamqrhifuxsscnihqco.supabase.co/functions/v1/oracle-render'
const JOB_FRESH_MS = 3 * 60 * 1000 // a 'running' job newer than this is not re-triggered
const DEFAULT_DAILY_BUDGET_CENTS = 3000
const DEFAULT_USER_DAILY_RENDERS = 10
// เพดานของฟรีต่อ 1 อีเมลตลอดชีพ — กันคนเปลี่ยนวันเกิดไปเรื่อยๆ เพื่อรูดของฟรี
const FREE_DEEP_MAX_PER_EMAIL = Number(process.env.ORACLE_FREE_DEEP_MAX) || 3

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
  const v3 = loadV3()
  // ⛔ ต้องรวมไฟล์ v3 เข้าไปด้วย ไม่งั้นแก้คำถาม/กฎแล้วลูกค้ายังได้ของเก่าจากแคช
  const concat = `${SCHEMA_VERSION}|${base}|${framework}|${v3.answersBase}|${v3.composeBase}|${JSON.stringify(v3.questions)}`
  return createHash('sha256').update(concat).digest('hex').slice(0, 16)
}

function buildSystemPrompt(system) {
  const base = loadBasePrompt()
  const framework = loadSystemFramework(system)
  return `${base}\n\n---\n\n${framework}`
}

// Format the user payload exactly as the prompt expects: chart + months + context.
// The edge fn renders all 6 categories in one call — the split / partial-render
// protocol was dropped when the render was decoupled (2026-06-23).
// ตัดร้อยแก้วเก่าออกจาก chart ก่อนส่ง
// ⛔ chart.deepReading คือคำอ่านฉบับเดิม ยาว ~27,000 ไบต์ = 84% ของ payload ทั้งก้อน
//    ชั้นใหม่ต้องอ่านจาก "ค่า" ไม่ใช่ลอกคำอ่านเดิมมาเรียบเรียง ⇒ ส่งไปก็ผิดวัตถุประสงค์
//    และเราส่ง payload เดียวกันซ้ำ 10 ก้อน ⇒ จ่ายค่า input ของมัน 10 รอบเปล่าๆ
//    วัดจริง 3 ก.ย. 69: input 27,486 tokens ต่อก้อน x 10 ก้อน
const CHART_DROP = new Set(['reading', 'deepReading', 'traitSrc', 'traitSrcTh'])
function leanChart(chart) {
  if (!chart || typeof chart !== 'object') return chart
  const out = {}
  for (const [k, v] of Object.entries(chart)) {
    if (CHART_DROP.has(k)) continue
    if (typeof v === 'string' && v.length > 400) continue
    out[k] = v
  }
  return out
}

function buildUserMessage(body) {
  const payload = {
    system: body.system,
    lang: body.lang,
    year: body.year,
    chart: leanChart(body.chart),
    months: body.months || [],
    context: body.context || {},
  }
  return JSON.stringify(payload, null, 2)
}

// ══ ท่อสองชั้น (v3) ═══════════════════════════════════════════════════════
//
// ชั้น 1  คำตอบคำถามบังคับ 45 ข้อ → เก็บใน answers_json = วัตถุดิบทำ consensus ข้ามศาสตร์
// ชั้น 2  เรียบเรียงเป็นความเรียง 6 บท → oracle_json = สิ่งที่ลูกค้าอ่าน
//
// director 2 ก.ย. 69: "เขาไม่ได้ต้องการการตอบเป็นข้อๆ เราได้คำตอบมา engine ต้องมีหน้าที่
// เรียบเรียงต่อด้วย ส่วนที่เป็นข้อๆเอาไว้สำหรับทำ consensus"
//
// ⛔ ทำไมต้องแตกเป็นหลายก้อน ไม่ใช่ยิงทีเดียว — วัดแล้วทั้งสองชั้นเกินเพดานของที่มี:
//    ชั้น 1 ทั้งชุด ~22,000 tokens · ชั้น 2 ~12,000 · เพดานต่อครั้งคือ 7,000
//    และเวลาเขียนรวดเดียวเกิน 150 วินาทีที่ Supabase Edge ให้
//    ⇒ ชั้น 1 แตกตามหมวด 10 ก้อน · ชั้น 2 แตกตามบท 6 ก้อน ยิงขนานทั้งคู่
//    แต่ละก้อนลงใต้เพดานสบาย และเวลารวมเท่ากับก้อนที่ช้าที่สุด ไม่ใช่ผลรวม
const V3_DIR = join(process.cwd(), 'Mythsensus/report-engine/lib/oracle/_v3')
let _v3 = null
function loadV3() {
  if (_v3) return _v3
  _v3 = {
    questions: JSON.parse(readFileSync(join(V3_DIR, 'questions.json'), 'utf-8')),
    answersBase: readFileSync(join(V3_DIR, 'answers-base.md'), 'utf-8'),
    composeBase: readFileSync(join(V3_DIR, 'compose-base.md'), 'utf-8'),
  }
  return _v3
}

// ฐานของเล่ม — คำนวณจาก payload ฝั่งเรา ไม่ใช่ให้โมเดลคิด
// ⛔ ต้อง deterministic เพราะทั้ง 6 บทเขียนขนานกัน ไม่มีบทไหนเห็นของบทอื่น
//    ถ้าปล่อยให้แต่ละบทสรุปฐานเอง ลูกค้าจะได้อ่านฐานเดิมหกรอบ และอาจไม่ตรงกันด้วย
export function buildBasis(body) {
  const c = body.chart || {}
  const lines = []
  const put = (k, v) => { if (v !== undefined && v !== null && v !== '') lines.push(`${k}: ${v}`) }
  put('ธาตุประจำตัว', c.dayMasterElement)
  put('ธาตุที่ล้นในดวง', c.dominantElement)
  put('ธาตุที่ไม่มีในดวง', c.missingElement)
  put('ธาตุที่เสริมแล้วดี', c.luckyElement)
  put('ธาตุที่เจอแล้วหนัก', c.avoidElement)
  put('ช่วงชีวิตปัจจุบัน', c.currentLuckPillarTh || c.currentLuckPillar)
  // ศาสตร์ที่ไม่ใช่ดวงจีนไม่มีฟิลด์พวกนี้ — ใช้ค่าเด่นที่มีแทน ไม่ปล่อยว่าง
  if (!lines.length) {
    for (const k of Object.keys(c).slice(0, 6)) {
      const v = c[k]
      if (typeof v === 'string' || typeof v === 'number') put(k, v)
    }
  }
  return lines
}

export function buildAnswerCalls(body) {
  const { questions, answersBase } = loadV3()
  const framework = loadSystemFramework(body.system)
  const payload = buildUserMessage(body)
  return questions.groups.map(g => ({
    key: g.key,
    // ⛔ ห้ามตั้งเป็นค่าคงที่ — หมวดใหญ่สุด (A) มี 9 ข้อ เล็กสุด (H) มี 2 ข้อ ต่างกัน 4.5 เท่า
    //    3 ก.ย. 69 ตั้ง 4000 เท่ากันหมด แล้วตัดกลางครบทั้ง 10 ก้อน ไม่มีก้อนไหนรอด
    //    วัดจากรอบที่ทำสำเร็จในเครื่อง: ชั้น 1 ทั้งชุด ~22,000 tokens / 45 ข้อ ≈ 490 ต่อข้อ
    //    เผื่อขึ้นเป็น 700 ต่อข้อ + 800 สำหรับ intro/โครง JSON
    maxTokens: 1600 + g.questions.length * 1100,
    systemPrompt: `${answersBase}\n\n---\n\n## วิธีอ่านของศาสตร์นี้\n\n${framework}\n\n---\n\n` +
      `## หมวดที่ต้องตอบในก้อนนี้: ${g.key} · ${g.title} (${g.questions.length} ข้อ)\n\n` +
      g.questions.map(q => `- ${q.q} ${q.text}`).join('\n'),
    userMessage: payload,
  }))
}

export function buildComposeCalls(body, answersJson) {
  const { questions, composeBase } = loadV3()
  const basis = buildBasis(body)
  return questions.chapters.map(ch => {
    const groups = ch.from.map(k => answersJson[k]).filter(Boolean)
    const unanswered = groups.flatMap(g => (g.answers || []).filter(a => a.answerable === false))
    return {
      key: ch.key,
      // 3-5 ย่อหน้า ย่อหน้าละ 55-85 คำไทย + limits ⇒ เผื่อไว้ 5,000
      // ⛔ ตัดกลางเมื่อไหร่ ทั้งเฟสถูกทิ้ง ไม่ใช่ได้บทสั้นๆ มา — เผื่อดีกว่าประหยัด
      maxTokens: 9000,
      systemPrompt: `${composeBase}\n\n---\n\n## บทที่ต้องเขียนในก้อนนี้\n\n` +
        `ชื่อบท: ${ch.title}\n` +
        `หลอมจากหมวด: ${ch.from.join(' + ')}\n` +
        `ข้อที่ศาสตร์นี้ตอบไม่ได้ในหมวดนี้: ${unanswered.length} ข้อ (ใส่ลง limits)
` +
        `รหัสข้อที่บทนี้ต้องกินเนื้อให้ครบ: ${groups.flatMap(g => (g.answers || []).map(a => a.q)).join(' ')}
` +
        `⛔ ใส่ \`covers\` เป็นอาร์เรย์ของรหัสข้อที่คุณเขียนถึงจริงในบทนี้ — ใช้ตรวจว่าไม่มีข้อไหนหล่น`,
      userMessage: JSON.stringify({
        basis,
        // ⛔ รายการคำที่ห้ามพิมพ์ซ้ำ — บอกเป็นหลักการอย่างเดียวไม่พอ
        //    3 ก.ย. 69 รันจริง: ทั้ง 6 บทเขียนขนานกัน ต่างคนต่างกางฐานใหม่
        //    ได้ 「เจี่ย ไม้หยาง」 ซ้ำ 3 บท · 「กุ้ย น้ำอ่อน มะเส็ง」 ซ้ำ 3 บท
        //    ให้ค่าที่ห้ามซ้ำเป็นสตริงตรงๆ ไปเลย จะบังคับได้จริงกว่าคำสั่งลอยๆ
        ห้ามพิมพ์คำเหล่านี้ซ้ำ_ผู้อ่านเห็นแล้วที่หน้าแรก: basis.map(l => l.split(':').slice(1).join(':').trim()).filter(Boolean),
        context: body.context || {},
        months: body.months || [],
        answers: groups,
      }, null, 1),
    }
  })
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

// NOTE: output validation lives in the woam edge fn (supabase/functions/
// oracle-render/index.ts) — it renders, validates, and caches. This endpoint
// only triggers it + polls the cache, so it does not validate output itself.
// (A dead 4-section mirror of the validator was removed here on 2026-06-23.)

// ─── Render worker trigger (woam edge function) ───
// Fire the long render OFF this request. We await only the worker's fast 202 ack;
// it marks the job 'running' then renders in its own 150s background task and
// writes the cache. The browser polls this endpoint until the cached row appears.
async function triggerRender(payload) {
  const secret = process.env.ORACLE_RENDER_SECRET
  if (!secret) throw new Error('ORACLE_RENDER_SECRET not set')
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  const r = await fetch(ORACLE_RENDER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: 'Bearer ' + anon },
    body: JSON.stringify({ secret, ...payload }),
  })
  if (!r.ok) throw new Error('worker ' + r.status + ': ' + (await r.text().catch(() => '')).slice(0, 160))
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
async function requireOracleAccess(req, body) {
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
  // แจกฟรี 1 ศาสตร์ต่อ 1 ดวง (director 2 ก.ย.) — ต้องลงชื่อเข้าใช้ก่อน
  //
  // ⛔ ต้องลงชื่อเข้าใช้ เพราะการเรนเดอร์ 1 ครั้งเป็นเงินจริง (~64 เซนต์)
  //    ถ้าแจกให้คนไม่มีตัวตน = เปิดรูให้ใครก็ได้รูดเงินเราทั้งวัน
  //    (โค้ดด้านบนเขียนกำกับไว้เองว่า "can never re-open the denial-of-wallet hole")
  // ⛔ ตัวแรกที่เขาขอ = ตัวที่ได้ เปลี่ยนใจไม่ได้ ไม่งั้นเปิดทีละตัวจนครบ 26 ฟรี
  // ⛔ เปลี่ยนวันเกิดได้ดวงใหม่ ⇒ ได้ของฟรีอีกใบ จึงต้องมีเพดานต่อคนด้วย
  const freeSystem = String((body && body.system) || '').trim()
  const freeHash = String((body && body.chart_hash) || '').trim()
  if (freeSystem && freeHash) {
    try {
      const rows = await supabaseQuery(
        `SELECT system FROM public.myth_free_deep WHERE email = '${sqlEscape(email)}' AND chart_hash = '${sqlEscape(freeHash)}' LIMIT 1`
      )
      if (Array.isArray(rows) && rows[0]) {
        if (rows[0].system === freeSystem) return { ok: true, userKey, via: 'free' }
        return { ok: false, status: 403, error: 'free_already_used', message: 'You already opened your free reading for this chart.' }
      }
      const used = await supabaseQuery(
        `SELECT count(*)::int AS n FROM public.myth_free_deep WHERE email = '${sqlEscape(email)}'`
      )
      const n = Array.isArray(used) && used[0] ? Number(used[0].n) : 0
      if (n >= FREE_DEEP_MAX_PER_EMAIL) {
        return { ok: false, status: 403, error: 'free_quota_reached', message: 'Deep Reading requires a Mythsensus subscription or purchase.' }
      }
      // จองสิทธิ์ก่อนเรนเดอร์ — ถ้าจองไม่ติด (ยิงซ้อนกันมา) ให้ถือว่าคนอื่นจองไปแล้ว แล้วอ่านซ้ำ
      await supabaseQuery(
        `INSERT INTO public.myth_free_deep (email, chart_hash, system)
         VALUES ('${sqlEscape(email)}', '${sqlEscape(freeHash)}', '${sqlEscape(freeSystem)}')
         ON CONFLICT (email, chart_hash) DO NOTHING`
      )
      const after = await supabaseQuery(
        `SELECT system FROM public.myth_free_deep WHERE email = '${sqlEscape(email)}' AND chart_hash = '${sqlEscape(freeHash)}' LIMIT 1`
      )
      if (Array.isArray(after) && after[0] && after[0].system === freeSystem) {
        return { ok: true, userKey, via: 'free' }
      }
    } catch (e) {
      // ⛔ ระบบแจกฟรีล่ม ห้ามกลายเป็นแจกฟรีไม่อั้น — ตกไปที่ปฏิเสธตามปกติ
      console.warn('[oracle/addon] free-deep check failed:', e.message)
    }
  }
  return { ok: false, status: 403, error: 'not_entitled', message: 'Deep Reading requires a Mythsensus subscription or purchase.' }
}

async function readCache({ chart_hash, system, lang, relationship_status, prompt_version }) {
  try {
    const sql = `SELECT oracle_json, answers_json, phase, cost_cents, model, generated_at_iso
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

// Read the current render job for a cache key + whether it is still fresh (the
// freshness window is computed in SQL to avoid timestamp-format parsing). Lets the
// handler decide whether to (re)trigger the worker without double-firing a render.
async function readJob(jobKey) {
  try {
    const sql = `SELECT status, (updated_at > now() - interval '3 minutes') AS fresh
                 FROM public.oracle_render_jobs WHERE job_key = '${sqlEscape(jobKey)}' LIMIT 1`
    const rows = await supabaseQuery(sql)
    return Array.isArray(rows) && rows[0] ? rows[0] : null
  } catch (e) {
    console.warn('[oracle/addon] job read failed:', e.message)
    return null
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
  const access = await requireOracleAccess(req, body)
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
  // ⛔ เงื่อนไขต้องเป็น phase='done' ด้วย — แถวที่มีแค่คำตอบ 45 ข้อ
  //    ยังไม่มี oracle_json ถ้านับว่าเสร็จ ลูกค้าจะค้างคาอยู่ตรงนั้นตลอดไป
  if (cached && cached.oracle_json && cached.phase !== 'answers') {
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

  // 3. ยังไม่มีในแคช → เดินทีละเฟส แล้วให้เบราว์เซอร์ถามซ้ำ
  //
  //   ไม่มีแถว       → เฟส 1: คำตอบ 45 ข้อ (10 ก้อนขนาน)
  //   phase='answers' → เฟส 2: เรียบเรียง 6 บท (6 ก้อนขนาน)
  //   phase='done'    → คืนของจากแคชข้างบนไปแล้ว
  //
  // ⛔ ห้ามยิงเฟส 2 ก่อนเฟส 1 จะจบ — ชั้นเรียบเรียงอ่านจากคำตอบ ไม่ใช่จากดวงตรงๆ
  const jobKey = [cache_key.chart_hash, cache_key.system, cache_key.lang, cache_key.relationship_status, cache_key.prompt_version].join('|')
  const job = await readJob(jobKey)
  const jobBusy = !!(job && (job.status === 'running' || job.status === 'answers_ready') && job.fresh)

  if (!jobBusy) {
    const phase = cached && cached.phase === 'answers' && cached.answers_json ? 'compose' : 'answers'
    let calls
    try {
      calls = phase === 'answers'
        ? buildAnswerCalls(body)
        : buildComposeCalls(body, cached.answers_json)
    } catch (e) {
      console.error('[oracle/addon] build calls failed:', e.message)
      return res.status(500).json({ error: 'oracle_prompt_build_failed' })
    }
    try {
      await triggerRender({
        cache_key: { ...cache_key, year: body.year },
        phase,
        calls,
        model: RENDER_MODEL,
      })
    } catch (e) {
      return res.status(502).json({ error: 'oracle_trigger_failed' })
    }
    return res.status(202).json({ status: 'generating', phase, calls: calls.length, generated_ms: Date.now() - t0 })
  }

  return res.status(202).json({ status: 'generating', phase: job.status === 'answers_ready' ? 'compose' : 'answers', generated_ms: Date.now() - t0 })
}
