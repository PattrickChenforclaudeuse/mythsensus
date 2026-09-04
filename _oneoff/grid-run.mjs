// ยิงตารางจริง 1 รอบ ด้วยรุ่นเดียวกับ production (claude-sonnet-5) แล้ววัดผล
//
// ⛔ สคริปต์ทดลอง — ไม่ได้แตะ edge function ที่ให้บริการอยู่ (Rule #2)
//    edge fn ตรวจ phase แบบตายตัว (ชั้น 1 ต้องได้ 45 ข้อ · ชั้น 2 ต้องได้ 6 บท)
//    ตารางไม่เข้าเงื่อนไขทั้งสอง ⇒ ถ้าจะใช้จริงต้องเพิ่ม branch ใหม่ใน edge fn ทีหลัง
//
// ⛔ ยิง paid API ตรง — มีเพดานกันพลาดทั้งจำนวนก้อนและเงิน
//    subscription-first: ใช้ paid ที่นี่เพราะต้องวัดด้วย "รุ่นเดียวกับ prod" ไม่ใช่รุ่นของ CLI
// ⛔ ลบ .env.woam ทิ้งหลังใช้ทุกครั้ง (มี secret ของ Mythsensus)

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('../build/ms26-bundle.js')
const { buildGridCalls, estimateGrid } = await import('../api/oracle/_grid.js')
const { checkCell } = require('../Mythsensus/tests/grid-answer-hygiene.cjs')

const MODEL = 'claude-sonnet-5'
const PRICE = { in: 200 / 1e6, out: 1000 / 1e6 }   // เซนต์ต่อ token (ตรงกับ edge fn)
const MAX_CALLS = 12
const MAX_CENTS = 300                               // เพดานกันพลาด $3

const env = Object.fromEntries(
  readFileSync('.env.woam', 'utf8').split(/\r?\n/).filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)
const KEY = env.ANTHROPIC_API_KEY
if (!KEY) { console.error('ไม่มี ANTHROPIC_API_KEY ใน .env.woam'); process.exit(1) }

const chart = MS26.calculate({
  year: 1991, month: 2, day: 3, hour: 5, minute: 6,
  lat: 13.75, lon: 100.5, timezone: 7, name: 'ผู้อ่าน', gender: 'ชาย', lang: 'th',
})

const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7)
const OUT = ONLY ? `_qa-blind/grid-${ONLY}.json` : '_qa-blind/grid-real.json'
const allCalls = buildGridCalls(chart, 'th')
// ⛔ หมวดที่ถูกซอยจะได้ key เป็น A1 A2 A3 — ไม่ใช่รหัสคำถาม อย่าสับสน
//    รับได้ทั้งชื่อหมวด (A = ทุกก้อนของ A) และ key ของก้อนตรงๆ (A2 = ก้อนเดียว)
const calls = ONLY ? allCalls.filter(c => c.key === ONLY || String(c.key).replace(/\d+$/, '') === ONLY) : allCalls
if (ONLY && !calls.length) { console.error('ไม่พบหมวด', ONLY, '· มี:', allCalls.map(c => c.key).join(' ')); process.exit(1) }
const est = estimateGrid(chart)
console.log('ประมาณการก่อนยิง:', JSON.stringify(est))
console.log('การเรียก:', calls.length, '· รุ่น:', MODEL)
if (calls.length > MAX_CALLS) { console.error('เกินเพดานการเรียก'); process.exit(1) }
if (est.usd * 100 > MAX_CENTS) { console.error('ประมาณการเกินเพดานเงิน'); process.exit(1) }

async function one(c) {
  const t0 = Date.now()
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: c.maxTokens,
      // ⛔ ต้องปิด thinking — Sonnet 5 เปิด adaptive thinking เองถ้าไม่สั่ง
      //    แล้ว thinking กิน max_tokens จนไม่เหลือให้คำตอบ (เจอมาแล้ว 3 ก.ย.)
      thinking: { type: 'disabled' },
      system: c.systemPrompt,
      messages: [{ role: 'user', content: c.userMessage }],
    }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(c.key + ': ' + JSON.stringify(j).slice(0, 200))
  const text = (j.content || []).map(x => x.text || '').join('')
  const span = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  let obj = null, parseErr = null
  try { obj = JSON.parse(span) } catch (e) { parseErr = e.message.slice(0, 90) }
  return {
    key: c.key, obj, parseErr, ms: Date.now() - t0,
    inTok: j.usage?.input_tokens || 0, outTok: j.usage?.output_tokens || 0,
    stop: j.stop_reason, raw: text,
  }
}

const t0 = Date.now()
const results = await Promise.all(calls.map(c => one(c).catch(e => ({ key: c.key, error: String(e).slice(0, 160) }))))
const wall = Date.now() - t0

let cents = 0, cells = 0, dash = 0, lens = []
const grid = {}
for (const r of results) {
  if (r.error) { console.log('  ✗', r.key, r.error); continue }
  cents += r.inTok * PRICE.in + r.outTok * PRICE.out
  if (r.parseErr) { console.log('  ✗', r.key, 'JSON พัง:', r.parseErr, '· stop:', r.stop); continue }
  for (const [sys, ans] of Object.entries(r.obj)) {
    grid[sys] = grid[sys] || {}
    for (const [q, v] of Object.entries(ans)) {
      grid[sys][q] = v; cells++
      const t = String(v).trim()
      if (t === '—' || t === '-') dash++; else lens.push(t.length)
    }
  }
}

// ── รอบซ่อม: ยิงซ้ำเฉพาะช่องที่ตกด่าน ──
//
// ⛔ ทำไมต้องมี: ปรับ prompt 6 รอบ ตัวเลขแกว่ง 0 → 11 → 0 → 13 → 11
//    ด้วยกติกาชุดเดียวกัน ⇒ ส่วนต่างเป็นความบังเอิญของรอบ ไม่ใช่คุณภาพของกติกา
//    ไล่ปรับ prompt ต่อ = แข่งกับ noise · ทางที่ได้ผลคือ วัด แล้วซ่อมเฉพาะช่องที่ตก
// ⛔ ซ่อมได้ไม่เกิน 2 รอบ ถ้ายังตกให้รายงาน ห้ามวนไม่รู้จบ
const questionText = {}
for (const g of JSON.parse(readFileSync('Mythsensus/report-engine/lib/oracle/_v3/questions.json', 'utf8')).groups)
  for (const q of g.questions) questionText[q.q] = q.text

const REPAIR_RULES = [
  'เขียนคำตอบใหม่ให้ช่องที่ระบุ ตอบเป็น JSON {"<ศาสตร์>":{"<รหัสข้อ>":"<คำตอบใหม่>"}}',
  '⛔ เขียนใหม่ทั้งประโยค ห้ามตัดคำที่ผิดออกแล้วส่งท่อนที่เหลือมา — จะได้ประโยคขาดวิ่นที่ยังผิดอยู่ดี',
  '⛔ ห้ามใช้: ชื่อฟิลด์ข้อมูล (traits/expression/structure/social/pace/focus) · ภาษาคะแนน (ติดลบ ค่าต่ำ ค่าสูง) · ตัวเลขคะแนนดิบ',
  '⛔ ห้ามมีอักษรจีน ญี่ปุ่น ฮีบรู อาหรับ · ศัพท໬ฝรั่งทุกคำต้องมีคำแปลไทยกำกับ',
  '⛔ ห้ามลอกถ้อยคำของคำถามมาไว้ในคำตอบ',
  'เก็บใจความเดิมไว้ เปลี่ยนเฉพาะวิธีเขียน · ไม่เกิน 26 คำ',
].join('\n')

async function repair(round) {
  const bad = []
  for (const [sys, ans] of Object.entries(grid))
    for (const [q, v] of Object.entries(ans)) {
      const ids = checkCell(v)
      if (ids.length) bad.push({ sys, q, ids, v })
    }
  if (!bad.length) return 0
  console.log('\nรอบซ่อม ' + round + ': ' + bad.length + ' ช่องตกด่าน')
  const user = bad.map(b => b.sys + ' / ' + b.q + ' (' + (questionText[b.q] || '') + ')'
    + '\n  ของเดิม: ' + b.v
    + '\n  ตกข้อ: ' + b.ids.join(', ')).join('\n')
  const r = await one({ key: 'repair' + round, maxTokens: Math.min(16000, bad.length * 160 + 900),
    systemPrompt: REPAIR_RULES, userMessage: user })
  if (!r.obj) { console.log('  ✗ ซ่อมไม่สำเร็จ:', r.parseErr || r.error); return bad.length }
  cents += r.inTok * PRICE.in + r.outTok * PRICE.out
  let fixed = 0
  for (const [s2, ans] of Object.entries(r.obj))
    for (const [q, v] of Object.entries(ans))
      if (grid[s2] && grid[s2][q] !== undefined && !checkCell(v).length) { grid[s2][q] = v; fixed++ }
  console.log('  ซ่อมผ่านด่าน ' + fixed + '/' + bad.length + ' ช่อง')
  return bad.length - fixed
}

let left = await repair(1)
if (left) left = await repair(2)
console.log(left ? '\n⚠ ยังเหลือ ' + left + ' ช่องที่ซ่อมไม่ผ่าน — ต้องดูด้วยตา' : '\n✓ ทุกช่องผ่านด่าน')

console.log('')
console.log('=== ผลจริง ===')
results.forEach(r => console.log('  ' + String(r.key).padEnd(4),
  r.error ? 'ERROR' : `${(r.ms / 1000).toFixed(0)}s · out ${r.outTok} · ${r.stop}${r.parseErr ? ' · JSON พัง' : ''}`))
console.log('')
console.log('เวลารวม (ขนาน):', (wall / 1000).toFixed(0), 'วินาที')
console.log('ต้นทุนจริง    : $' + (cents / 100).toFixed(3), '(ประมาณการไว้ $' + est.usd + ')')
console.log('ศาสตร์ที่ได้  :', Object.keys(grid).length, '/ 25')
console.log('ช่องที่ได้    :', cells, ONLY ? '(ยิงเฉพาะหมวด ' + ONLY + ')' : '/ ' + est.cells)
console.log('ตอบ — ไม่มีวิชา:', dash, '(' + Math.round(dash / (cells || 1) * 100) + '%)')
console.log('ยาวเฉลี่ย     :', Math.round(lens.reduce((a, b) => a + b, 0) / (lens.length || 1)), 'ตัวอักษร')

writeFileSync(OUT, JSON.stringify({ grid, cents, wall, results: results.map(({ raw, ...r }) => r) }, null, 1))
console.log('\nเก็บไว้ที่', OUT)
