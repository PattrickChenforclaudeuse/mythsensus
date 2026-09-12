// api/nation-sample.js — "ตัวอย่าง · พื้นดวง <ประเทศ> วันนี้" บนจอ entry คำนวณบนเซิร์ฟเวอร์ (12 ก.ย. 69)
//
// ทำไม: โปรไฟล์ CPU ตอนบูต (_tools/profile-boot.cjs) พบว่างานยาว 1.7 + 2.3 วิ (มือถือช้า 4x) คือ
// calcForecast ของ "ดวงประเทศ" ที่โชว์บนจอ entry — กวาดดาราศาสตร์ทั้งปีเพื่อทำ baseline
// ทั้งที่ดวงนี้เหมือนกันทุกคนในวันเดียวกัน ⇒ คำนวณครั้งเดียวที่นี่ แคชที่ edge ต่อวัน/ประเทศ/ภาษา
// เครื่องผู้ใช้เหลือแค่ fetch ~1KB · ถ้า endpoint ล้ม ฝั่ง client ยังคำนวณเองได้เหมือนเดิม (fallback)
//
// ⛔ ขอบเขต: เฉพาะดวงประเทศจาก api/_data/nation-charts.json (whitelist) เท่านั้น —
//    ดวงของผู้ใช้ต้องคำนวณในเครื่องเสมอ (คำสัญญา "วันเกิดไม่ถูกส่งออก") ห้ามขยาย endpoint นี้รับวันเกิดอิสระ
// เอนจิน = api/_mcp/engine/calc.cjs ตัวเดียวกับที่ build:engine sync ให้ (ต้องเท่ากับ bundle ในเบราว์เซอร์)
export const config = { runtime: 'nodejs' };

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const engine = require('./_mcp/engine/calc.cjs');
const NATIONS = require('./_data/nation-charts.json');

// ให้ปฏิทินของ Date ในโปรเซสนี้เป็นเวลาไทย เหมือนเบราว์เซอร์ของผู้ใช้ส่วนใหญ่ (ตัวเลข "วันนี้" ตรงกับที่เครื่องเคยคำนวณ)
process.env.TZ = 'Asia/Bangkok';

const pad = (n) => String(n).padStart(2, '0');
const isoLocal = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

export default async function handler(req, res) {
  const q = req.query || {};
  const n = String(q.n || 'TH').toUpperCase().slice(0, 2);
  const lang = q.lang === 'en' ? 'en' : 'th';
  const cfg = NATIONS[n];
  if (!cfg) { res.setHeader('Cache-Control', 'public, s-maxage=3600'); return res.status(404).json({ ok: false, note: 'unknown nation' }); }

  // วันที่ (ปฏิทินท้องถิ่นของผู้ใช้) — รับเฉพาะ ±2 วันจากวันนี้ กันใช้เป็น cache-buster
  const now = new Date();
  let day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(q.d || ''))) {
    const [y, m, d] = String(q.d).split('-').map(Number);
    const cand = new Date(y, m - 1, d);
    if (Math.abs(cand - day) <= 2 * 86400000) day = cand;
  }

  try {
    const chart = engine.calculate(Object.assign({ name: cfg.en, gender: 'ชาย', lang }, cfg.b));   // ค่าเดียวกับ _entryNationChart() ฝั่ง client
    const f = engine.calcForecast(chart, day, { days: 1, weeks: 1, months: 0 });
    const d0 = Array.isArray(f.days) ? f.days[0] : null;
    const w = d0 || f.weeks[0];
    const rows = {};
    for (const k of engine.FORECAST_DOMAINS_ALL) {
      const v = w && w.domains && w.domains[k];
      if (v) rows[k] = { up: v.up, mid: v.mid, down: v.down, n: v.n };
    }
    const out = { voting: f.votingCount, abstain: f.abstainCount, total: f.totalSystems, daily: !!d0, rows, nation: n, date: isoLocal(day), lang };
    // แคชที่ edge หนึ่งวัน (key = URL รวม d/n/lang) · เบราว์เซอร์ 5 นาที · ของเก่าเสิร์ฟต่อได้ระหว่างคำนวณใหม่
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(out);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false, note: String(e && e.message || e).slice(0, 120) });
  }
}
