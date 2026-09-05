// เฝ้ากระทู้ใหม่ในแท็กดูดวง — คัดเฉพาะอันที่ถามเรื่อง "หลายที่ไม่ตรงกัน / อันไหนแม่น"
//
// ⛔ อ่านอย่างเดียว ไม่โพสต์ ไม่คอมเมนต์ — การโพสต์เป็นงานของ director
// ⛔ ที่มา 5 ก.ย.: เว็บอายุ 89 วัน ไม่มี backlink ⇒ SEO ยังไม่ให้อะไรอีกหลายเดือน
//    แต่แท็ก ดูดวง มีกระทู้ใหม่ 15-20 อัน/วัน และมีคนถามคำถามของเราตรงๆ
//
// ⛔ อ่านจาก __NEXT_DATA__ ไม่ใช่แกะ markup — รอบแรกเขียนด้วย regex บน HTML แล้วอ่านได้ 0 กระทู้
//    เพราะ href เป็น URL เต็ม และมีไอคอนคั่นก่อนชื่อ · แล้วมันรายงานว่า "ไม่มีอะไรน่าโพสต์"
//    ซึ่งอ่านเหมือนผลลัพธ์ปกติ = เครื่องมือที่ไม่มีวันแดง
// ⛔ ต้องแยก "ไม่เจอที่ตรง" ออกจาก "อ่านไม่ออกเลย" เสมอ — อ่านได้ 0 กระทู้ = ออกด้วยรหัสผิดพลาด
//
// ใช้: node _oneoff/pantip-watch.mjs [--all] [--hours=48]

const TAG = 'ดูดวง'
const args = process.argv.slice(2)
const SHOW_ALL = args.includes('--all')
const MAX_HOURS = Number((args.find(a => a.startsWith('--hours=')) || '--hours=48').slice(8))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'

// คำที่บอกว่าเจ้าของกระทู้เจอ pain เดียวกับที่สินค้าเราแก้
// ⛔ ให้คะแนนตามความตรง ไม่ใช่แค่เจอคำ
const SIGNALS = [
  { re: /ไม่ตรงกัน|ไม่เหมือนกัน|คนละอย่าง|ขัดกัน|คนละแบบ/, w: 5, why: 'พูดถึงคำตอบที่ไม่ตรงกัน' },
  { re: /อันไหนแม่น|ศาสตร์ไหน|แบบไหนแม่น|ตำราไหน|วิชาไหน|อันไหนถูก|เชื่ออันไหน|อันไหนดี/, w: 5, why: 'ถามว่าอันไหนน่าเชื่อกว่า' },
  { re: /ลัคนา|ราศี/, w: 1, why: 'เรื่องลัคนา/ราศี' },
  { re: /หลายที่|หลายคน|หลายหมอ|ดูมาหลาย|หลายเจ้า/, w: 4, why: 'ดูมาหลายที่แล้ว' },
  { re: /ลาหิรี|นิรายนะ|สุริยยาตร์|ทรอปิคอล|sidereal|tropical/i, w: 4, why: 'ชนเรื่องระบบราศีคนละแบบ' },
  { re: /โปรแกรม|เว็บไซต์|แอป|เครื่องคำนวณ|เว็บดูดวง/, w: 2, why: 'ใช้เครื่องมือออนไลน์อยู่' },
  { re: /แม่นไหม|เชื่อได้|เชื่อไหม|จริงไหม|แม่นจริง/, w: 2, why: 'ตั้งคำถามกับความแม่น' },
]
// กระทู้ขอให้คนช่วยดูดวงให้ / หมอดูเปิดคิว = ไม่ใช่คนที่มี pain ของเรา
const NOT_FOR_US = /ดูให้หน่อย|ดูดวงให้|รบกวนดู|ช่วยดู|ขอคำทำนาย|รับดูดวง|เปิดคิว|ทักมา|inbox|ดูฟรี|แจกดวง|อ่านไพ่ให้/

async function tagTopics() {
  const r = await fetch('https://pantip.com/tag/' + encodeURIComponent(TAG), {
    headers: { 'user-agent': UA, 'accept-language': 'th,en' },
  })
  if (!r.ok) throw new Error('pantip ตอบ ' + r.status)
  const html = await r.text()
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) throw new Error('ไม่เจอ __NEXT_DATA__ — หน้าเปลี่ยนโครง ต้องแก้ตัวอ่าน')
  const walk = (o, d = 0) => {
    if (d > 6 || !o || typeof o !== 'object') return null
    if (Array.isArray(o) && o.length && o[0] && o[0].topic_id) return o
    for (const k of Object.keys(o)) { const v = walk(o[k], d + 1); if (v) return v }
    return null
  }
  const list = walk(JSON.parse(m[1]).props)
  if (!list || !list.length) throw new Error('อ่านรายการกระทู้ไม่ได้ — โครงข้อมูลเปลี่ยน')
  return list
}

function score(title) {
  if (NOT_FOR_US.test(title)) return { pts: 0, why: [] }
  let pts = 0; const why = []
  for (const s of SIGNALS) if (s.re.test(title)) { pts += s.w; why.push(s.why) }
  return { pts, why }
}

let topics
try { topics = await tagTopics() }
catch (e) { console.error('✗ ' + e.message); process.exit(1) }   // ⛔ อ่านไม่ออก = ผิดพลาด ไม่ใช่ "ไม่มีอะไร"

const now = Date.now()
const rows = topics.map(t => {
  const hours = t.created_time ? (now - new Date(t.created_time)) / 36e5 : null
  return { id: t.topic_id, title: String(t.title || ''), hours, c: t.comments_count, v: t.views_count, ...score(String(t.title || '')) }
})
const fresh = rows.filter(t => t.hours !== null && t.hours <= MAX_HOURS)
const hits = rows.filter(t => t.pts >= 5).sort((a, b) => b.pts - a.pts || a.hours - b.hours)

console.log('แท็ก ' + TAG + ' · อ่านได้ ' + rows.length + ' กระทู้ · ใหม่กว่า ' + MAX_HOURS + ' ชม.: ' + fresh.length)
const age = h => h === null ? '?' : h < 1 ? Math.round(h * 60) + ' นาที' : h < 48 ? Math.round(h) + ' ชม.' : Math.round(h / 24) + ' วัน'
console.log('')
if (!hits.length) {
  console.log('รอบนี้ไม่มีกระทู้ที่ถามเรื่อง "หลายที่ไม่ตรงกัน / อันไหนแม่น"')
  console.log('(อ่านครบ ' + rows.length + ' กระทู้แล้ว — ไม่มีที่ตรง ไม่ใช่อ่านไม่ออก)')
} else {
  console.log('=== กระทู้ที่ตรงกับสิ่งที่เราแก้ให้เขาได้ ===')
  for (const t of hits) {
    console.log('  [' + t.pts + '] ' + t.title.slice(0, 76))
    console.log('       https://pantip.com/topic/' + t.id + '  · ' + age(t.hours) + 'ที่แล้ว · คห. ' + t.c + ' · อ่าน ' + t.v)
    console.log('       ตรงเพราะ: ' + t.why.join(' · '))
  }
}
if (SHOW_ALL) {
  console.log('')
  console.log('=== ทั้งหมดที่อ่านได้รอบนี้ (เรียงตามคะแนน) ===')
  rows.slice().sort((a, b) => b.pts - a.pts).forEach(t =>
    console.log('  [' + String(t.pts).padStart(2) + '] ' + age(t.hours).padStart(8) + ' · ' + t.title.slice(0, 66)))
}
