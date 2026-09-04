// ตรวจว่า edge fn รับ phase:'grid' และเก็บลงตารางได้จริง
//
// ⛔ ยิงจริงแต่ให้เล็กที่สุด — 1 ก้อน 2 ศาสตร์ 1 คำถาม ราคาไม่ถึงเซนต์
//    จุดประสงค์คือพิสูจน์เส้นทาง ไม่ใช่ผลิตตาราง
// ⛔ ใช้ chart_hash ที่ขึ้นต้นด้วย _selftest_ เพื่อไม่ปนกับของลูกค้า และลบทิ้งได้
//
// ใช้: node _oneoff/edge-grid-check.mjs [--phase=grid]

import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.woam', 'utf8').split(String.fromCharCode(10)).map(l => l.trim()).filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)
const URL_ = env.ORACLE_RENDER_URL || 'https://woamqrhifuxsscnihqco.supabase.co/functions/v1/oracle-render'
const SECRET = env.ORACLE_RENDER_SECRET
const REST = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1'
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
if (!SECRET) { console.error('ไม่มี ORACLE_RENDER_SECRET ใน .env.woam'); process.exit(1) }

const phase = (process.argv.find(a => a.startsWith('--phase=')) || '--phase=grid').slice(8)
const expect = Number((process.argv.find(a => a.startsWith('--expect=')) || '--expect=2').slice(9))
const hash = '_selftest_grid_' + Date.now()

const call = {
  key: 'T',
  maxTokens: 400,
  systemPrompt: 'ตอบเป็น JSON ล้วน {"western":{"Q1":"<คำตอบ>"},"bazi":{"Q1":"<คำตอบ>"}} ไม่เกิน 12 คำต่อช่อง',
  userMessage: 'คำถาม Q1: ธาตุเด่นของคนนี้คืออะไร · ข้อมูล: {"western":{"sun":"Aquarius"},"bazi":{"dayMaster":"ไม้หยาง"}}',
}

const r = await fetch(URL_, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    secret: SECRET, phase, calls: [call], expectCells: expect,
    cache_key: { chart_hash: hash, system: '_grid', lang: 'th', relationship_status: 'single', prompt_version: 'selftest' },
  }),
})
const j = await r.json().catch(() => ({}))
console.log('ตอบกลับ', r.status, JSON.stringify(j))
if (r.status !== 202) { console.log(phase === 'grid' ? 'branch grid ไม่ถูกรับ' : 'ถูกปฏิเสธตามคาด'); process.exit(r.status === 400 ? 0 : 1) }

// รอผล แล้วอ่านแถวที่ควรถูกเขียน
const sb = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE }
for (let i = 0; i < 30; i++) {
  await new Promise(s => setTimeout(s, 3000))
  const q = await fetch(REST + '/myth_addon_reading?chart_hash=eq.' + hash + '&select=phase,cost_cents,oracle_json', { headers: sb })
  const rows = await q.json()
  if (rows.length) {
    const g = rows[0].oracle_json
    console.log('')
    console.log('เก็บลงตารางแล้ว · phase =', rows[0].phase, '· ค่าใช้จ่าย', rows[0].cost_cents, 'เซนต์')
    console.log('schema =', g?.schema, '· ช่อง =', g?.cells, '· ศาสตร์ =', Object.keys(g?.grid || {}).join(' '))
    console.log('ตัวอย่างคำตอบ:', JSON.stringify(g?.grid).slice(0, 160))
    const okShape = g?.schema === 'grid-1.0' && g?.cells >= 2 && Object.keys(g?.grid || {}).length >= 2
    console.log('')
    console.log(okShape ? 'ผ่าน — branch grid รับงาน รวมก้อน ตรวจครบ และเก็บลง myth_addon_reading ได้'
                        : 'ไม่ผ่าน — รูปร่างข้อมูลไม่ถูก')
    // เก็บกวาดแถวทดสอบ ไม่ให้ปนกับของจริง
    await fetch(REST + '/myth_addon_reading?chart_hash=eq.' + hash, { method: 'DELETE', headers: sb })
    console.log('ลบแถวทดสอบแล้ว')
    process.exit(okShape ? 0 : 1)
  }
  const jr = await fetch(REST + '/oracle_render_jobs?job_key=like.' + hash + '*&select=status,error', { headers: sb })
  const jobs = await jr.json()
  if (jobs[0]?.status === 'error') {
    // ตั้งใจให้ตกเมื่อสั่ง --expect สูงเกินจริง = พิสูจน์ว่าด่านกันตารางไม่ครบทำงาน
    const wanted = expect > 2
    console.log((wanted ? 'ด่านตกตามที่ตั้งใจ: ' : 'งานล้ม: ') + jobs[0].error)
    if (wanted) console.log('ผ่าน — ตารางไม่ครบถูกปฏิเสธ ไม่ถูกเก็บลงตาราง')
    process.exit(wanted ? 0 : 1)
  }
}
console.log('หมดเวลารอ 90 วินาที')
process.exit(1)
