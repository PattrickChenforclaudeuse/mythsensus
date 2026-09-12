// สร้างไฟล์สถิต "ตัวอย่าง · พื้นดวง <ประเทศ> วันนี้" ล่วงหน้า 14 วัน (12 ก.ย. 69)
//   data/nation-sample/<YYYY-MM-DD>/<NATION>-<th|en>.json  ← client fetch แทนการคำนวณเอง (fallback = คำนวณในเครื่องเหมือนเดิม)
//
// ทำไมเป็นไฟล์สถิต ไม่ใช่ serverless function: Vercel Hobby จำกัด 12 ฟังก์ชัน และเต็มแล้ว (ทุกตัวยังใช้งานอยู่)
// ทำไมต้องทำเลย: โปรไฟล์ CPU ตอนบูต (_tools/profile-boot.cjs) พบว่างานยาว 1.7+2.3 วิบนมือถือช้าคือ
//   calcForecast ของดวงประเทศบนจอ entry (กวาดดาราศาสตร์ทั้งปีทำ baseline) ทั้งที่ค่าเหมือนกันทุกคนในวันเดียวกัน
// เอนจิน = api/_mcp/engine/calc.cjs (build:engine sync ให้ = ตัวเดียวกับ bundle ในเบราว์เซอร์)
// ⛔ ต้องรันก่อน deploy ทุกครั้ง (อยู่ใน npm predeploy แล้ว) — ถ้าลืม ไฟล์หมดอายุใน 14 วัน แล้ว client จะกลับไปคำนวณเองเงียบๆ (ช้าแต่ไม่พัง)
// ⛔ เฉพาะดวงประเทศ (ตารางเดียวกับ _NATION_CHARTS ใน build/app.js) — ดวงผู้ใช้ไม่เคยถูกส่งออกจากเครื่อง
process.env.TZ = 'Asia/Bangkok';   // ปฏิทิน "วันนี้" ตรงกับเบราว์เซอร์ผู้ใช้ส่วนใหญ่ (ต้องมาก่อน require ที่แตะ Date)
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const engine = require(path.join(ROOT, 'api', '_mcp', 'engine', 'calc.cjs'));
const DAYS = Number(process.argv[2] || 14);

// ตาราง _NATION_CHARTS จาก build/app.js (ต้นทางเดียว)
const src = fs.readFileSync(path.join(ROOT, 'build', 'app.js'), 'utf8');
const i = src.indexOf('const _NATION_CHARTS = {'); if (i < 0) throw new Error('_NATION_CHARTS not found in build/app.js');
const j = src.indexOf('\n};', i); const sb = {}; vm.createContext(sb);
vm.runInContext(src.slice(i, j + 3).replace('const _NATION_CHARTS', 'globalThis.__N'), sb);
const NATIONS = sb.__N;

const pad = (n) => String(n).padStart(2, '0');
const iso = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const OUT = path.join(ROOT, 'data', 'nation-sample');
fs.mkdirSync(OUT, { recursive: true });

// ลบวันที่เก่ากว่าเมื่อวาน (กันกองไฟล์)
const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const keepFrom = iso(new Date(today.getTime() - 86400000));
for (const d of fs.readdirSync(OUT)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d < keepFrom) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });

let files = 0; const t0 = Date.now();
for (let k = 0; k < DAYS; k++) {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + k);
  const dir = path.join(OUT, iso(day)); fs.mkdirSync(dir, { recursive: true });
  for (const [n, cfg] of Object.entries(NATIONS)) {
    for (const lang of ['th', 'en']) {
      const f = path.join(dir, `${n}-${lang}.json`);
      if (fs.existsSync(f)) { files++; continue; }   // เคยสร้างแล้ว (เอนจินเดียวกัน) — ข้าม
      const chart = engine.calculate(Object.assign({ name: cfg.en, gender: 'ชาย', lang }, cfg.b));   // ค่าเดียวกับ _entryNationChart()
      const fc = engine.calcForecast(chart, day, { days: 1, weeks: 1, months: 0 });
      const d0 = Array.isArray(fc.days) ? fc.days[0] : null; const w = d0 || fc.weeks[0];
      const rows = {};
      for (const key of engine.FORECAST_DOMAINS_ALL) { const v = w && w.domains && w.domains[key]; if (v) rows[key] = { up: v.up, mid: v.mid, down: v.down, n: v.n }; }
      fs.writeFileSync(f, JSON.stringify({ voting: fc.votingCount, abstain: fc.abstainCount, total: fc.totalSystems, daily: !!d0, rows, nation: n, date: iso(day), lang, engine: 'ms26' }));
      files++;
    }
  }
}
console.log(`nation samples: ${files} files · ${DAYS} days from ${iso(today)} · ${Object.keys(NATIONS).length} nations × 2 langs · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
