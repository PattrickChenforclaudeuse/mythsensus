// ยิง render จริงผ่าน oracle-render ด้วยคำสั่งชุดเดียวกับที่ production สร้าง
//
//   node Mythsensus/tests/oracle-v3-e2e.mjs <systemKey>
//
// ⛔ ตัวนี้เสียเงินจริง (ยิง Anthropic ผ่าน paid API เหมือนลูกค้าคนหนึ่ง)
//    ใช้ตอนตรวจหลัง deploy เท่านั้น ไม่ใช่ด่านที่รันทุกครั้ง
// ⛔ ต้อง import ตัวสร้างคำสั่งจาก api/oracle/addon.js ห้ามเขียนเลียนแบบ
//    ไม่งั้นจะทดสอบของที่ไม่ใช่ตัวที่ลูกค้าได้
import 'dotenv/config'
import { createRequire } from 'node:module'
import { buildAnswerCalls, buildComposeCalls } from '../../api/oracle/addon.js'

const require = createRequire(import.meta.url)
const M = require('../build/calc.js')

const SYS = process.argv[2] || 'bazi'
const URL_ = process.env.ORACLE_RENDER_URL || 'https://woamqrhifuxsscnihqco.supabase.co/functions/v1/oracle-render'
const SECRET = process.env.ORACLE_RENDER_SECRET
const SB = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SECRET || !SB || !KEY) { console.error('ขาด ORACLE_RENDER_SECRET / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const INPUT = { name: 'ทดสอบ', gender: 'ชาย', year: 1991, month: 2, day: 3, hour: 5, minute: 6, lat: 13.7563, lon: 100.5018, timezone: 7 }
const chart = M.calculate(INPUT)
const f = M.calcForecast(chart, new Date(), { weeks: 0, months: 12 })

const body = {
  system: SYS,
  lang: 'th',
  year: 2026,
  chart: chart[SYS],
  months: f.months.map(m => ({ label: m.labelTh, dom: Object.fromEntries(Object.entries(m.domains).map(([k, v]) => [k, v.score])) })),
  context: { name: INPUT.name, gender: INPUT.gender, relationship_status: 'unknown' },
}

const ck = {
  chart_hash: 'e2e-' + SYS + '-' + new Date().toISOString().slice(0, 10),
  system: SYS, lang: 'th', relationship_status: 'unknown',
  prompt_version: 'e2e2-' + Date.now().toString(36),
}

const sbGet = async (q) => {
  const r = await fetch(`${SB}/rest/v1/myth_addon_reading?${q}`, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
  return r.ok ? r.json() : []
}
const rowQuery = `chart_hash=eq.${ck.chart_hash}&system=eq.${ck.system}&prompt_version=eq.${ck.prompt_version}&select=phase,cost_cents,model,answers_json,oracle_json`

async function fire(phase, calls) {
  const t0 = Date.now()
  const r = await fetch(URL_, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: SECRET, cache_key: ck, phase, calls, model: 'claude-sonnet-5' }),
  })
  console.log(`  ยิง ${phase}: ${r.status} · ${calls.length} ก้อน · ${JSON.stringify(await r.json())}`)
  // รอผลลงตาราง — ตัวงานวิ่งเบื้องหลังหลังตอบ 202
  for (let i = 0; i < 60; i++) {
    await new Promise(s => setTimeout(s, 5000))
    const rows = await sbGet(rowQuery)
    const row = rows[0]
    const want = phase === 'answers' ? 'answers' : 'done'
    if (row && row.phase === want) {
      console.log(`  ✓ ${phase} เสร็จใน ${Math.round((Date.now() - t0) / 1000)} วิ · ${row.cost_cents} เซนต์ · ${row.model}`)
      return row
    }
    process.stdout.write('.')
  }
  throw new Error(`${phase} ไม่เสร็จใน 5 นาที — ดู oracle_render_jobs`)
}

console.log(`ทดสอบจริง: ${SYS} · chart_hash=${ck.chart_hash}`)
const a = buildAnswerCalls(body)
const rowA = await fire('answers', a)
const nAns = Object.values(rowA.answers_json).reduce((s, g) => s + (g.answers || []).length, 0)
const noAns = Object.values(rowA.answers_json).flatMap(g => (g.answers || []).filter(x => x.answerable === false)).length
console.log(`  คำตอบ ${nAns}/45 · ตอบไม่ได้ ${noAns} ข้อ`)

const c = buildComposeCalls(body, rowA.answers_json)
const rowB = await fire('compose', c)
const ch = rowB.oracle_json.chapters
const blocks = Object.values(ch).reduce((s, x) => s + (x.blocks || []).length, 0)
const text = Object.values(ch).flatMap(x => (x.blocks || []).map(b => b.text)).join(' ')
console.log(`  บท ${Object.keys(ch).length} · ย่อหน้า ${blocks}`)
console.log(`  สรรพนาม: คุณ ${(text.match(/คุณ/g) || []).length} · เขา ${(text.match(/เขา(?!ใจ|ตร|มา|ต)/g) || []).length}`)
console.log(`  ตัวอย่างย่อหน้าแรก: ${Object.values(ch)[0].blocks[0].text.slice(0, 120)}…`)
console.log(`\nรวมค่าใช้จ่ายรอบนี้ ~${rowA.cost_cents + rowB.cost_cents} เซนต์`)
