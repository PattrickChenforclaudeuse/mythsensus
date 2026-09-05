// ยิงตารางเต็มผ่าน edge fn — เส้นทางเดียวกับที่ลูกค้ากดจริง
//
// ⛔ ความเสี่ยงที่ต้องพิสูจน์คือเพดาน 150 วินาทีของ edge fn กับ 15 ก้อนขนาน
//    ยิง paid API ตรงไม่ตอบคำถามนี้ เพราะไม่มีเพดานเวลาแบบเดียวกัน
// ⛔ ใช้ chart_hash จริงของดวง ไม่ใช่ _selftest — ผลจะถูกเก็บไว้ใช้จริง
// ⛔ ลบ .env.woam ทิ้งหลังใช้

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('../build/ms26-bundle.js')
const { buildGridCalls, estimateGrid, buildGridPayload } = await import('../api/oracle/_grid.js')
const { checkCell } = require('../Mythsensus/tests/grid-answer-hygiene.cjs')

const env = Object.fromEntries(
  readFileSync('.env.woam', 'utf8').split(String.fromCharCode(10)).map(l => l.trim()).filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)
const URL_ = env.ORACLE_RENDER_URL || 'https://woamqrhifuxsscnihqco.supabase.co/functions/v1/oracle-render'
const REST = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1'
const sb = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY }

const chart = MS26.calculate({
  year: 1991, month: 2, day: 3, hour: 5, minute: 6,
  lat: 13.75, lon: 100.5, timezone: 7, name: 'ชัยพัทธ์', gender: 'ชาย', lang: 'th',
})
const calls = buildGridCalls(chart, 'th')
const est = estimateGrid(chart)
const hash = 'director_1991_02_03_0506'
const ck = { chart_hash: hash, system: '_grid', lang: 'th', relationship_status: 'unknown', prompt_version: 'gridtest-20260905c' }

console.log('ก้อนที่จะยิง', calls.length, '· ช่องที่ต้องได้', est.cells, '· ประมาณการ $' + est.usd)
const t0 = Date.now()
const questions = []
for (const g of JSON.parse(readFileSync('Mythsensus/report-engine/lib/oracle/_v3/questions.json', 'utf8')).groups)
  for (const q of g.questions) questions.push(q)

const jobKey = [ck.chart_hash, ck.system, ck.lang, ck.relationship_status, ck.prompt_version].join('|')

async function rowNow() {
  const rows = await (await fetch(REST + '/myth_addon_reading?chart_hash=eq.' + hash
    + '&prompt_version=eq.' + encodeURIComponent(ck.prompt_version)
    + '&select=phase,cost_cents,oracle_json,generated_at_iso', { headers: sb })).json()
  return rows[0] || null
}

async function fire(callSet, label) {
  // ⛔ ต้องจำเวลาเขียนล่าสุดไว้ก่อน แล้วรอจนกว่าจะเปลี่ยน
  //    ไม่งั้นจะอ่านแถวของรอบก่อนกลับมาทันที แล้วรายงานว่าทำงานแล้วทั้งที่ยังไม่ได้ทำ
  const before = await rowNow()
  const stamp = before && before.generated_at_iso
  const r = await fetch(URL_, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.ORACLE_RENDER_SECRET, phase: 'grid', calls: callSet,
      model: 'claude-sonnet-5', expectCells: est.cells, cache_key: ck,
      expectSystems: Object.keys(buildGridPayload(chart)), expectQuestions: questions.map(q => q.q) }),
  })
  const j = await r.json().catch(() => ({}))
  console.log(label, '→', r.status, JSON.stringify(j))
  if (r.status !== 202) throw new Error('edge fn ปฏิเสธ')
  for (let i = 0; i < 45; i++) {
    await new Promise(s => setTimeout(s, 5000))
    const row = await rowNow()
    // ⛔ ต้องเป็นการเขียน "ครั้งใหม่" เท่านั้น ไม่ใช่แถวเดิมของรอบก่อน
    if (row && row.oracle_json && row.oracle_json.cells && row.generated_at_iso !== stamp) return row
    const jobs = await (await fetch(REST + '/oracle_render_jobs?job_key=eq.' + encodeURIComponent(jobKey) + '&select=status,error', { headers: sb })).json()
    if (jobs[0] && jobs[0].status === 'error') throw new Error(jobs[0].error)
    if (i % 6 === 5) console.log('   รอ...', Math.round((Date.now() - t0) / 1000), 'วินาที · สถานะ', jobs[0] ? jobs[0].status : '-')
  }
  throw new Error('หมดเวลารอ')
}

let row = await fire(calls, 'รอบที่ 1 · ' + calls.length + ' ก้อน')

// ⛔ รอบเก็บตก — ยิงเฉพาะช่องที่ขาด ไม่ยิงใหม่ทั้งตาราง
for (let round = 2; round <= 5; round++) {
  const g = row.oracle_json.grid || {}
  // ⛔ เก็บตก = เติมช่องที่ขาด + เขียนใหม่ช่องที่ตกด่านภาษา
  //    ทางที่ผ่าน edge fn ไม่มีรอบซ่อมแยก ⇒ ถ้าไม่ทำตรงนี้ ของเสียจะถึงลูกค้า
  const missing = []
  const dirty = []
  for (const sys of Object.keys(g)) for (const q of questions) {
    const v = g[sys][q.q]
    if (v === undefined) { missing.push({ sys, q }); continue }
    const bad = checkCell(v)
    if (bad.length) dirty.push({ sys, q, bad })
  }
  console.log('')
  console.log('ขาด ' + missing.length + ' ช่อง · ตกด่านภาษา ' + dirty.length + ' ช่อง')
  for (const d of dirty) missing.push(d)
  if (!missing.length) break

  // ⛔ ก้อนเก็บตกต้องส่งเฉพาะข้อมูลของศาสตร์ที่ขาด ไม่ใช่ทั้ง 25
  //    (รอบก่อนส่งครบแต่ตั้งเพดานโทเคนตามศาสตร์ที่ขาด ⇒ ถูกตัดกลางคัน 17/20 ก้อน)
  const payload = buildGridPayload(chart)
  const byQ = {}
  for (const m of missing) (byQ[m.q.q] = byQ[m.q.q] || { q: m.q, sys: [] }).sys.push(m.sys)
  const topUp = Object.values(byQ).slice(0, 20).map((e, i) => {
    const sub = {}
    for (const k of e.sys) if (payload[k]) sub[k] = payload[k]
    const shape = '{"' + e.sys[0] + '":{"' + e.q.q + '":"<คำตอบ>"}, ...}'
    const faults = [...new Set(missing.filter(m => m.q.q === e.q.q && m.bad).flatMap(m => m.bad))]
    return {
      key: 'top' + round + '_' + i,
      maxTokens: Math.min(16000, e.sys.length * 190 + 900),   // 1,530 tok / 23 ศาสตร์ = ~67/ศาสตร์ + เผื่อ
      systemPrompt: [
        'อ่านดวงหนึ่งใบด้วยศาสตร์ ' + e.sys.length + ' สายนี้เท่านั้น',
        '',
        'คำถามข้อเดียว: ' + e.q.q + ' ' + e.q.text,
        '',
        'รูปแบบคำตอบ: ' + shape,
        '',
        'กติกา',
        // ⛔ ต้องระบุรายชื่อคีย์ + จำนวน ไม่งั้นโมเดลตอบศาสตร์เดียวแล้วหยุด
        //    (วัดจริง 5 ก.ย.: สั่ง "ตอบให้ครบทุกศาสตร์" ได้ 123 โทเคน 1 ศาสตร์
        //     ระบุรายชื่อ+จำนวน ได้ 1,530 โทเคน ครบ 23 ศาสตร์)
        '- ⛔ ต้องมีคีย์ครบทั้ง ' + e.sys.length + ' ตัวนี้พอดี ห้ามขาด ห้ามเกิน:',
        '  ' + e.sys.join(', '),
        '- ห้ามหยุดก่อนครบ ' + e.sys.length + ' คีย์',
        '- ตำราที่มีวิชาใกล้เคียงพอโยงถึงได้ ให้ตอบ โดยบอกว่าอ่านจากค่าไหน',
        '  ⛔ ตอบ "—" เฉพาะตอนที่ตำรานั้นไม่มีวิชาแตะเรื่องนี้เลยจริงๆ',
        '- ⛔ ศัพท์เฉพาะทุกคำต้องมีคำอธิบายภาษาคนธรรมดาในวงเล็บ ห้ามใช้ตัวย่อที่ไม่ได้กาง',
        '- ⛔ ห้ามพิมพ์ชื่อช่องข้อมูล (traits/expression/structure/social/pace/focus) และห้ามใช้ภาษาคะแนน',
        '- ⛔ ห้ามมีอักษรจีน ญี่ปุ่น ฮีบรู อาหรับ',
        '- ⛔ ห้ามลอกถ้อยคำของคำถามมาไว้ในคำตอบ',
        '- คำตอบไม่เกิน 26 คำ · ตอบเป็น JSON ล้วน',
        ...(faults.length ? ['- ⛔ รอบก่อนตกข้อนี้: ' + faults.join(' / ') + ' — เขียนใหม่ทั้งประโยค ห้ามตัดคำที่ผิดออกเฉยๆ'] : []),
      ].join(String.fromCharCode(10)),
      userMessage: 'ข้อมูลดวงของแต่ละศาสตร์ (คำนวณมาแล้ว ห้ามคำนวณใหม่):' + String.fromCharCode(10) + JSON.stringify(sub),
    }
  })
  row = await fire(topUp, 'รอบเก็บตก ' + round + ' · ' + topUp.length + ' ก้อน')
}

console.log('')
if (row.phase === 'grid') {
  const g = row.oracle_json
  console.log('สำเร็จใน', Math.round((Date.now() - t0) / 1000), 'วินาที')
  console.log('  ช่องที่ได้', g.cells, '/', est.cells, '· ศาสตร์', Object.keys(g.grid || {}).length)
  console.log('  ค่าใช้จ่ายรวม $' + (row.cost_cents / 100).toFixed(3))
  writeGrid(g)
  process.exit(0)
}
console.log('ยังไม่ครบ:', row.oracle_json.cells, '/', est.cells, '— ต้องดูด้วยตา')
process.exit(1)

function writeGrid(g) {
  const fs = require('fs')
  fs.writeFileSync('_qa-blind/grid-via-edge.json', JSON.stringify({ grid: g.grid }, null, 1))
  console.log('  เก็บไว้ที่ _qa-blind/grid-via-edge.json')
}
