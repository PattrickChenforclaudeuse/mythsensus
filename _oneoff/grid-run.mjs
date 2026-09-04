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

const calls = buildGridCalls(chart, 'th')
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

console.log('')
console.log('=== ผลจริง ===')
results.forEach(r => console.log('  ' + String(r.key).padEnd(4),
  r.error ? 'ERROR' : `${(r.ms / 1000).toFixed(0)}s · out ${r.outTok} · ${r.stop}${r.parseErr ? ' · JSON พัง' : ''}`))
console.log('')
console.log('เวลารวม (ขนาน):', (wall / 1000).toFixed(0), 'วินาที')
console.log('ต้นทุนจริง    : $' + (cents / 100).toFixed(3), '(ประมาณการไว้ $' + est.usd + ')')
console.log('ศาสตร์ที่ได้  :', Object.keys(grid).length, '/ 25')
console.log('ช่องที่ได้    :', cells, '/', est.cells)
console.log('ตอบ — ไม่มีวิชา:', dash, '(' + Math.round(dash / (cells || 1) * 100) + '%)')
console.log('ยาวเฉลี่ย     :', Math.round(lens.reduce((a, b) => a + b, 0) / (lens.length || 1)), 'ตัวอักษร')

writeFileSync('_qa-blind/grid-real.json', JSON.stringify({ grid, cents, wall, results: results.map(({ raw, ...r }) => r) }, null, 1))
console.log('\nเก็บไว้ที่ _qa-blind/grid-real.json')
