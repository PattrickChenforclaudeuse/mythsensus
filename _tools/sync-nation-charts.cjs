// ดึงตาราง _NATION_CHARTS จาก build/app.js → api/_data/nation-charts.json (12 ก.ย. 69)
// เหตุ: /api/nation-sample คำนวณ "ตัวอย่างดวงประเทศ" บนเซิร์ฟเวอร์แทนเครื่องผู้ใช้ ต้องใช้ตารางเดียวกันเป๊ะ
// ⛔ ต้นทางคือ build/app.js — แก้ที่นั่นแล้วรันไฟล์นี้ ห้ามแก้ JSON มือ
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'build', 'app.js'), 'utf8');
const i = src.indexOf('const _NATION_CHARTS = {'); if (i < 0) throw new Error('_NATION_CHARTS not found');
const j = src.indexOf('\n};', i); const snippet = src.slice(i, j + 3).replace('const _NATION_CHARTS', 'globalThis.__N');
const sb = {}; vm.createContext(sb); vm.runInContext(snippet, sb);
const out = {}; for (const [k, v] of Object.entries(sb.__N)) out[k] = { en: v.en, th: v.th, exact: !!v.exact, b: v.b };
fs.writeFileSync(path.join(ROOT, 'api', '_data', 'nation-charts.json'), JSON.stringify(out));
console.log('nation-charts.json:', Object.keys(out).length, 'nations');
