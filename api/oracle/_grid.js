// ชั้นตาราง — ถาม 45 ข้อ กับทุกศาสตร์พร้อมกัน แล้วได้ตารางคำตอบมาทำฉันทามติ
//
// ทำไมต้องมี (วัดจริง 4 ก.ย. 69):
//   ท่อเดิมยิงศาสตร์ละรอบ ⇒ ส่งข้อมูลดวง + framework + prompt ฐาน เข้าไปใหม่ ~416 ครั้ง
//   ต่อรายงานหนึ่งฉบับ (26 ศาสตร์ × 16 การเรียก) ⇒ ~$10.40/ฉบับ
//   ชั้นนี้ส่งดวงครั้งเดียวต่อหมวด แล้วให้ตอบทุกศาสตร์ในรอบเดียว ⇒ ~$1.00/ฉบับ
//   ⇒ ที่ประหยัดคือ "การเล่าเรื่องเดิมซ้ำ" ไม่ใช่การคิด — จำนวนคำตอบเท่าเดิม
//
// ⛔ วัดแล้ว 83 token/ช่อง ไม่ใช่ 30 ที่เคยประมาณ — ถ้าจะเปลี่ยนความยาวคำตอบ
//    ต้องวัดใหม่ทุกครั้ง ตัวเลขนี้เป็นตัวกำหนดทั้งราคาและเวลา
// ⛔ หนึ่งหมวด = หนึ่งการเรียก ⇒ 10 การเรียกขนาน (edge fn รับสูงสุด 12)
//    ห้ามยัด 45 ข้อในการเรียกเดียว — ทดลองแล้วรันเกิน 10 นาทีไม่จบ
// ⛔ ห้ามใส่ reading/deepReading ลง payload — ตัดออกแล้วดวงทั้ง 25 ศาสตร์เหลือ ~9,400 ตัวอักษร
//    ไม่ตัด payload จะบวมจนกินทั้งเพดาน

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const V3_DIR = join(process.cwd(), 'Mythsensus', 'report-engine', 'lib', 'oracle', '_v3')

let _cache = null
function loadQuestions() {
  if (_cache) return _cache
  const p = join(V3_DIR, 'questions.json')
  if (!existsSync(p)) throw new Error('questions.json not found at ' + p)
  _cache = JSON.parse(readFileSync(p, 'utf8'))
  return _cache
}

// ชื่อศาสตร์ที่ใช้เป็นคีย์ในตาราง — ต้องคงที่ ห้ามเปลี่ยนตามภาษา
// ⛔ เปลี่ยนคีย์เมื่อไหร่ ตารางเก่าที่แคชไว้อ่านไม่ได้ทั้งชุด
export const GRID_SYSTEMS = {
  western: 'western', bazi: 'bazi', ninestar: 'ninestar', numerology: 'numerology',
  vedic: 'vedic', humandesign: 'humandesign', mayan: 'mayan', celtic: 'celtic',
  thai: 'thai', taksa: 'taksa', saju: 'saju', tibetan: 'tibetan', ziwei: 'ziwei',
  onmyodo: 'onmyodo', hellenistic: 'hellenistic', norseRune: 'norseRune',
  ogham: 'ogham', arabicParts: 'arabicParts', kabbalistic: 'kabbalistic',
  zoroastrian: 'zoroastrian', aztec: 'aztec', nativeAmerican: 'nativeAmerican',
  ifaYoruba: 'ifaYoruba', aboriginal: 'aboriginal', vedicMahadasha: 'vedicMahadasha',
}

// ⛔ ต้องตัดแบบเดียวกับ leanChart ใน addon.js — ถ้าสองที่ตัดคนละเกณฑ์
//    ราคาที่วัดไว้จะไม่ตรงกับของจริง
function leanSystem(o) {
  const out = {}
  for (const k of Object.keys(o || {})) {
    const v = o[k]
    if (k === 'reading' || k === 'deepReading' || k === 'traitSrc' || k === 'traitSrcTh') continue
    if (typeof v === 'string' && v.length > 400) continue
    out[k] = v
  }
  return out
}

export function buildGridPayload(chart) {
  const charts = {}
  for (const key of Object.keys(GRID_SYSTEMS)) {
    if (chart && chart[key]) charts[GRID_SYSTEMS[key]] = leanSystem(chart[key])
  }
  return charts
}

/**
 * หนึ่งหมวด = หนึ่งการเรียก · แต่ละการเรียกได้คำตอบของทุกศาสตร์ในหมวดนั้น
 *
 * ⛔ maxTokens คิดจาก 83 token/ช่อง ที่วัดจริง × จำนวนศาสตร์ × ข้อในหมวด + เผื่อโครง JSON
 *    ตั้งต่ำกว่านี้แล้วคำตอบจะถูกตัดกลาง ซึ่งทำให้ JSON พังทั้งก้อน
 * ⛔ เพดานของ edge fn คือ 16,000 ⇒ หมวดใหญ่สุด (9 ข้อ × 25 ศาสตร์) ต้องไม่เกิน
 */
export function buildGridCalls(chart, lang = 'th') {
  const questions = loadQuestions()
  const charts = buildGridPayload(chart)
  const sysCount = Object.keys(charts).length
  const isTh = lang !== 'en'

  // ⛔ หมวดใหญ่ต้องแบ่ง — 9 ข้อ × 25 ศาสตร์ × 83 token = 18,700 ทะลุเพดาน 16,000 ของ edge fn
  //    ถูกตัดกลางเมื่อไหร่ JSON พังทั้งก้อน ไม่ใช่แค่ข้อท้ายหาย
  const CAP = 16000
  const PER_CELL = 95                       // 83 ที่วัดได้ + เผื่อ 15%
  const maxQPerCall = Math.max(1, Math.floor((CAP - 900) / (sysCount * PER_CELL)))
  const chunks = []
  for (const g of questions.groups) {
    for (let i = 0; i < g.questions.length; i += maxQPerCall) {
      const part = g.questions.slice(i, i + maxQPerCall)
      const nParts = Math.ceil(g.questions.length / maxQPerCall)
      chunks.push({
        key: nParts > 1 ? `${g.key}${Math.floor(i / maxQPerCall) + 1}` : g.key,
        title: g.title,
        questions: part,
      })
    }
  }
  if (chunks.length > 12) throw new Error(`grid needs ${chunks.length} calls, edge fn accepts 12`)

  return chunks.map(g => {
    const cells = sysCount * g.questions.length
    const maxTokens = Math.min(CAP, Math.round(cells * PER_CELL) + 900)

    const rules = isTh
      ? [
          '- ตอบทุกศาสตร์ที่อยู่ในข้อมูล ทุกข้อในหมวดนี้ ใช้รหัสข้อเป็นคีย์',
          '- ⛔ ศาสตร์ไหนไม่มีวิชาตอบข้อนั้นตามตำรา ให้ตอบ "—" เท่านั้น',
          '  ห้ามเดา ห้ามยืมคำตอบของศาสตร์อื่น ห้ามตอบกว้างๆ ที่ใช้กับใครก็ได้',
          '- ทุกคำตอบต้องอ้างค่าจากข้อมูลดวงของศาสตร์นั้นเอง (ชื่อดาว เสา เลข ธาตุ)',
          '- คำตอบไม่เกิน 20 คำ',
          '- ตอบเป็น JSON ล้วน ไม่มีข้อความอื่นก่อนหรือหลัง',
        ].join('\n')
      : [
          '- Answer for every system present in the data, for every question in this group; key by question code.',
          '- ⛔ If a tradition has no doctrinal technique for a question, answer exactly "—".',
          '  Do not guess, do not borrow another tradition\'s answer, do not write something that fits anyone.',
          '- Every answer must cite a value from that system\'s own chart data (star, pillar, number, element).',
          '- Maximum 20 words per answer.',
          '- Reply with JSON only, no text before or after.',
        ].join('\n')

    const head = isTh
      ? `อ่านดวงหนึ่งใบด้วยศาสตร์ ${sysCount} สายพร้อมกัน\n\nหมวด: ${g.key} · ${g.title}`
      : `Read one birth chart through ${sysCount} traditions at once\n\nGroup: ${g.key} · ${g.title}`

    const shape = '{"<system key>":{"' + g.questions[0].q + '":"<answer>", ...}}'

    return {
      key: g.key,
      maxTokens,
      systemPrompt:
        `${head}\n\n${isTh ? 'คำถามในหมวดนี้' : 'Questions in this group'} (${g.questions.length}):\n` +
        g.questions.map(q => `${q.q} ${q.text}`).join('\n') +
        `\n\n${isTh ? 'รูปแบบคำตอบ' : 'Answer shape'}: ${shape}\n\n${isTh ? 'กติกา' : 'Rules'}\n${rules}`,
      userMessage:
        (isTh
          ? 'ข้อมูลดวงของแต่ละศาสตร์ (คำนวณมาแล้ว ห้ามคำนวณใหม่ ห้ามเดาค่าที่ไม่มี):\n'
          : 'Per-system chart data (already computed — do not recompute, do not invent missing values):\n') +
        JSON.stringify(charts),
    }
  })
}

/** ประมาณการต้นทุน/เวลา จากตัวเลขที่วัดจริง — ไว้เตือนก่อนยิง ไม่ใช่ไว้เดา */
export function estimateGrid(chart) {
  const charts = buildGridPayload(chart)
  const questions = loadQuestions()
  const sysCount = Object.keys(charts).length
  const totalQ = questions.groups.reduce((n, g) => n + g.questions.length, 0)
  const cells = sysCount * totalQ
  const inTok = Math.round(JSON.stringify(charts).length / 3.2) * questions.groups.length
  const outTok = cells * 83                       // วัดจริง 4 ก.ย. 69
  return {
    systems: sysCount, questions: totalQ, cells, groups: questions.groups.length,
    inputTokens: inTok, outputTokens: outTok,
    usd: +(inTok * 2e-6 + outTok * 1e-5).toFixed(3),
  }
}
