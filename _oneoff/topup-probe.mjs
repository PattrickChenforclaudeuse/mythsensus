import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
require('../build/ms26-bundle.js')
const { buildGridPayload } = await import('../api/oracle/_grid.js')

const env = Object.fromEntries(
  readFileSync('.env.woam','utf8').split(String.fromCharCode(10)).map(l=>l.trim()).filter(l=>l.includes('='))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]}))

const chart = MS26.calculate({year:1991,month:2,day:3,hour:5,minute:6,lat:13.75,lon:100.5,timezone:7,name:'x',gender:'ชาย',lang:'th'})
const payload = buildGridPayload(chart)
const sys = Object.keys(payload).slice(0, 23)
const sub = {}; for (const k of sys) sub[k] = payload[k]

const shape = '{"' + sys[0] + '":{"B2":"<คำตอบ>"}, ...}'
const systemPrompt = [
  'อ่านดวงหนึ่งใบด้วยศาสตร์ ' + sys.length + ' สายนี้เท่านั้น',
  '',
  'คำถามข้อเดียว: B2 บทบาทแบบไหนที่ฉันจะพัง',
  '',
  'รูปแบบคำตอบ: ' + shape,
  '',
  'กติกา',
  '- ⛔ ต้องมีคีย์ครบทั้ง ' + sys.length + ' ตัวนี้พอดี ห้ามขาด ห้ามเกิน:',
  '  ' + sys.join(', '),
  '- ห้ามหยุดก่อนครบ ' + sys.length + ' คีย์ · ห้ามเพิ่มศาสตร์ที่ไม่อยู่ในรายชื่อ',
  '- คำตอบไม่เกิน 26 คำ · ตอบเป็น JSON ล้วน',
].join(String.fromCharCode(10))

const r = await fetch('https://api.anthropic.com/v1/messages', {
  method:'POST',
  headers:{'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
  body: JSON.stringify({ model:'claude-sonnet-5', max_tokens: sys.length*150+900, thinking:{type:'disabled'},
    system: systemPrompt,
    messages:[{role:'user',content:'ข้อมูลดวงของแต่ละศาสตร์:' + String.fromCharCode(10) + JSON.stringify(sub)}] }),
})
const j = await r.json()
const text = (j.content||[]).map(x=>x.text||'').join('')
console.log('stop:', j.stop_reason, '· out', j.usage && j.usage.output_tokens, 'tok')
console.log('ขึ้นต้นด้วย:', text.slice(0,140).split(String.fromCharCode(10)).join(' '))
try {
  const o = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}')+1))
  const keys = Object.keys(o)
  console.log('คีย์ชั้นนอก', keys.length, 'ตัว:', keys.slice(0,6).join(' '))
  const first = o[keys[0]]
  console.log('ชั้นในของคีย์แรก:', typeof first === 'object' ? Object.keys(first).slice(0,6).join(' ') : String(first).slice(0,60))
  console.log('รูปทรง:', keys.every(k=>k.length<=3 && k===k.toUpperCase()) ? 'สลับแกน (คำถามอยู่ชั้นนอก)' : 'ปกติ (ศาสตร์อยู่ชั้นนอก)')
} catch(e) { console.log('JSON พัง:', e.message) }
