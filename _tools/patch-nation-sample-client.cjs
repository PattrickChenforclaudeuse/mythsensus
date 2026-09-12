// ฝั่ง client: _entryFillCity ลอง fetch /api/nation-sample ก่อนคำนวณเอง (12 ก.ย. 69) — รันครั้งเดียว (idempotent)
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', 'build', 'app.js'); let s = fs.readFileSync(f, 'utf8');
if (s.includes('_nationSampleMem')) { console.log('already patched'); process.exit(0); }
const anchor = `  try { const hit = localStorage.getItem(key); if (hit) d = JSON.parse(hit); } catch (_) {}
  if (!d) {
    try {`;
if (s.split(anchor).length !== 2) { console.error('anchor miss'); process.exit(1); }
const inject = `  // ── 12 ก.ย. 69: ขอผลจากเซิร์ฟเวอร์ก่อน (ดวงประเทศเหมือนกันทุกคนในวันเดียวกัน) ──
  // โปรไฟล์ CPU ตอนบูตพบว่า calcForecast ตรงนี้ = งานยาว 1.7+2.3 วิบนมือถือช้า (กวาดดาราศาสตร์ทั้งปีทำ baseline)
  // ไฟล์สถิต data/nation-sample/<วัน>/<ประเทศ>-<ภาษา>.json สร้างล่วงหน้า 14 วันด้วยเอนจินตัวเดียวกัน (_tools/gen-nation-samples.cjs ใน predeploy)
  // ไม่มีไฟล์/ล้ม/ช้าเกิน 2 วิ → คำนวณในเครื่องเหมือนเดิม (Vercel Hobby เต็ม 12 ฟังก์ชัน จึงไม่ทำเป็น API)
  // ⛔ เฉพาะดวงประเทศเท่านั้น — ดวงผู้ใช้ยังคำนวณในเครื่องเสมอ (วันเกิดไม่ออกจากเครื่อง)
  window._nationSampleMem = window._nationSampleMem || {};
  window._nationSampleState = window._nationSampleState || {};   // key → 'pending' | 'failed'
  if (!d && window._nationSampleMem[key]) d = window._nationSampleMem[key];
  if (!d && window._nationSampleState[key] !== 'failed') {
    if (window._nationSampleState[key] !== 'pending') {
      window._nationSampleState[key] = 'pending';
      const dl = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const timer = setTimeout(function () { try { ctl && ctl.abort(); } catch (_) {} }, 2000);
      fetch('/data/nation-sample/' + dl + '/' + encodeURIComponent(_entryNationKey()) + '-' + (isTh ? 'th' : 'en') + '.json', ctl ? { signal: ctl.signal } : {})
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (j) {
          if (!j || !j.rows || typeof j.voting !== 'number') throw new Error('bad shape');
          const picked = { voting: j.voting, abstain: j.abstain, total: j.total, daily: !!j.daily, rows: {} };
          MS26.FORECAST_DOMAINS_FREE.forEach(function (k) { const v = j.rows[k]; if (v) picked.rows[k] = { up: v.up, mid: v.mid, down: v.down, n: v.n }; });
          window._nationSampleMem[key] = picked;
          try { localStorage.setItem(key, JSON.stringify(picked)); } catch (_) {}
          window._nationSampleState[key] = 'done';
        })
        .catch(function () { window._nationSampleState[key] = 'failed'; })
        .then(function () { clearTimeout(timer); try { _entryFillCity(0); } catch (_) {} });
    }
    return;   // จะถูกเรียกซ้ำเมื่อผลมาถึง (สำเร็จ → ใช้ผล · ล้ม → คำนวณในเครื่องด้านล่าง)
  }
`;
s = s.replace(anchor, inject + anchor);
fs.writeFileSync(f, s); console.log('client patched: server-first nation sample with local fallback');
