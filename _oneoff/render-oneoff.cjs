// เรนเดอร์คำอ่านรายศาสตร์ (one-off) จาก JSON 45 ข้อ → หน้าเดียวกับเล่มใหญ่
//
// ⛔ ห้ามเขียน CSS ชุดใหม่ — ดึง <style> จากเล่มจริงมาใช้ ไม่งั้นสองที่จะเพี้ยนกัน
//    (บทเรียน: สูตรที่ก๊อปไว้ในหน้าเว็บจะเพี้ยนจากเอนจินเสมอ)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { calculate } = require(path.join(ROOT, 'Mythsensus/build/calc.js'));
const { generateReport } = require(path.join(ROOT, 'Mythsensus/build/report.js'));

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── CSS: ยืมจากเล่มจริง ──────────────────────────────────────────────────
const sample = generateReport(calculate({
  name: 'x', gender: 'ชาย', year: 1991, month: 2, day: 3,
  hour: 5, minute: 6, lat: 13.75, lon: 100.5, timezone: 7,
}));
const CSS = (sample.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];

const data = JSON.parse(fs.readFileSync(path.join(__dirname, process.argv[2] || 'out-bazi.json'), 'utf8'));
// ชื่อศาสตร์มาจาก payload ที่เราคุมเอง ไม่ใช่จากสิ่งที่โมเดลพิมพ์กลับมา
const TITLE = JSON.parse(fs.readFileSync(path.join(__dirname, 'payload-bazi.json'), 'utf8')).systemTh || data.system;

// จำนวนหน้าไม่ได้ตั้งไว้ล่วงหน้า — นับจากจำนวนหมวดที่มีจริง
let pageNum = 0;
const pages = [];
const totalPages = 1 + data.groups.length + 1;

function page(title, body) {
  pageNum++;
  pages.push(`
<div class="page">
  <div class="page-header">
    <span class="page-icon" style="color:#c8a45a;font-size:13px">✦</span>
    <span class="page-title">${esc(title)}</span>
    <span class="page-num">หน้า ${pageNum} / ${totalPages}</span>
  </div>
  <div class="page-body">${body}</div>
  ${pageNum >= totalPages - 1 ? '<div class="page-footer">✦ MYTHSENSUS ✦ คำอ่านรายศาสตร์ สร้างโดย AI บนค่าที่คำนวณจากดวงจริง เพื่อการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ ✦</div>' : ''}
</div>`);
}

// ── หน้าเปิด ─────────────────────────────────────────────────────────────
const answered = data.groups.flatMap(g => g.answers);
const canAnswer = answered.filter(a => a.answerable !== false).length;
page(`${TITLE} — อ่านดวงคุณด้วยศาสตร์นี้ศาสตร์เดียว`, `
  <div style="font-size:17px;color:#e8c87a;line-height:1.7;margin:6px 0 16px;padding:12px 14px;background:#0f0d15;border-left:3px solid #c8a45a;border-radius:0 8px 8px 0">${esc(data.hero)}</div>
  <h2>ศาสตร์นี้อ่านคนจากอะไร</h2>
  <p style="line-height:1.75">${esc(data.lens)}</p>
  <h2>คำถามที่บังคับให้ศาสตร์นี้ตอบ</h2>
  <p style="line-height:1.75">คำถามชุดเดียวกันนี้ถูกถามกับทุกศาสตร์ — ${answered.length} ข้อ ${data.groups.length} หมวด
  ศาสตร์นี้ตอบได้ตามตำรา <strong style="color:#9ac86a">${canAnswer} ข้อ</strong>
  และไม่มีวิธีตอบ <strong style="color:#c88a6a">${answered.length - canAnswer} ข้อ</strong>
  ข้อที่ตอบไม่ได้เราบอกตรงๆ ว่าไม่มี ไม่เดาให้ครบ</p>
  <table>
    <thead><tr><th>หมวด</th><th>คำถาม</th><th>ศาสตร์นี้ตอบได้</th></tr></thead>
    <tbody>${data.groups.map(g => {
      const ok = g.answers.filter(a => a.answerable !== false).length;
      return `<tr><td>${esc(g.title)}</td><td>${g.answers.length}</td><td style="color:${ok === g.answers.length ? '#9ac86a' : '#c8b06a'}">${ok}</td></tr>`;
    }).join('')}</tbody>
  </table>`);

// ── หน้าคำตอบ หมวดละหน้า ─────────────────────────────────────────────────
for (const g of data.groups) {
  const body = `
    <p style="line-height:1.75;color:#c8b890;margin-bottom:12px">${esc(g.intro)}</p>
    ${g.answers.map(a => {
      const off = a.answerable === false;
      return `
      <div style="margin:0 0 16px;padding-left:12px;border-left:2px solid ${off ? '#4a4038' : '#c8a45a'}">
        <div style="font-size:12.5px;color:#a08a66;margin-bottom:2px">${esc(a.q)} · ${esc(a.question)}</div>
        <div style="font-size:15.5px;font-weight:700;color:${off ? '#9a8f80' : '#e8c87a'};line-height:1.5;margin-bottom:5px">${esc(a.headline)}</div>
        <div style="line-height:1.72">${esc(a.body)}</div>
        ${a.months && a.months.length ? `<div style="font-size:12.5px;color:#9ac86a;margin-top:4px">ช่วงเวลา: ${esc(a.months.join(' · '))}</div>` : ''}
        ${a.refs && a.refs.length ? `<div style="font-size:12px;color:#8a7a62;margin-top:3px">อ่านจาก: ${esc(a.refs.join(' · '))}</div>` : ''}
      </div>`;
    }).join('')}`;
  page(`${esc(g.key)} · ${esc(g.title)}`, body);
}

// ── หน้าปิด ──────────────────────────────────────────────────────────────
const gaps = answered.filter(a => a.answerable === false);
page('อ่านจบแล้วทำอะไรต่อ', `
  <p style="line-height:1.75">${esc(data.closing)}</p>
  ${gaps.length ? `<h2>ข้อที่ศาสตร์นี้ตอบไม่ได้ (${gaps.length} ข้อ)</h2>
  <p style="line-height:1.75;color:#c8b890">ไม่ใช่ข้อบกพร่องของดวงคุณ — เป็นขอบเขตของวิชา ข้อเหล่านี้ต้องอ่านจากศาสตร์อื่น</p>
  <table><thead><tr><th>ข้อ</th><th>คำถาม</th></tr></thead><tbody>
  ${gaps.map(a => `<tr><td style="white-space:nowrap">${esc(a.q)}</td><td>${esc(a.question)}</td></tr>`).join('')}
  </tbody></table>` : ''}`);

const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<title>${esc(TITLE)} — คำอ่านรายศาสตร์</title><style>${CSS}</style></head>
<body>${pages.join('\n')}</body></html>`;

const out = path.join(__dirname, (process.argv[3] || 'oneoff-bazi.html'));
fs.writeFileSync(out, html);
console.log(`เขียน ${out}\n  หน้า ${pageNum} · คำถาม ${answered.length} · ตอบได้ ${canAnswer} · ตอบไม่ได้ ${answered.length - canAnswer}`);
