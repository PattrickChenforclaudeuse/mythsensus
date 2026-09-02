// เรนเดอร์คำอ่านรายศาสตร์ฉบับเรียบเรียง (ชั้นที่ 2) → หน้าเดียวกับเล่มใหญ่
//
// ⛔ ห้ามพิมพ์คำถามเป็นข้อๆ — ชุด 45 ข้อคือวัตถุดิบสำหรับ consensus
//    ไม่ใช่รูปร่างของสิ่งที่ลูกค้าอ่าน (director 2 ก.ย.)
// ⛔ ห้ามเขียน CSS ชุดใหม่ — ยืม <style> จากเล่มจริง
// ⛔ ห้ามใช้อีโมจิ (director 2 ก.ย.)
//
// ภาพประกอบ: หนึ่งบทหนึ่งภาพ และภาพต้องเป็นของที่บทนั้นพูดถึงจริง
// ไม่ใช่ของประดับ — ทุกภาพวาดจาก payload ของเอนจิน ไม่ใช่จากสิ่งที่โมเดลพิมพ์
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { calculate } = require(path.join(ROOT, 'Mythsensus/build/calc.js'));
const { generateReport } = require(path.join(ROOT, 'Mythsensus/build/report.js'));
const V = require('./visuals.cjs');

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = (generateReport(calculate({
  name: 'x', gender: 'ชาย', year: 1991, month: 2, day: 3,
  hour: 5, minute: 6, lat: 13.75, lon: 100.5, timezone: 7,
})).match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];

// รับเป็น <systemKey> แล้วประกอบชื่อไฟล์เอง — เดิมผูกกับ payload-bazi.json ตายตัว
const SYS = process.argv[2] || 'bazi';
const d = JSON.parse(fs.readFileSync(path.join(__dirname, process.argv[3] || `compose-${SYS}.json`), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(__dirname, `payload-${SYS}.json`), 'utf8'));
const TITLE = P.systemTh;
const traits = P['แกนนิสัยที่ศาสตร์นี้ให้คะแนนเอง'] || [];
const months = P['เดือนข้างหน้า12เดือน'];

// ภาพประจำบท — เลือกจากเรื่องที่บทนั้นพูด ไม่ใช่สลับไปเรื่อย
const CHAPTER_VISUAL = [
  () => V.traitBars(traits),                                      // 1 โครงดวง
  () => V.monthBars(months, ['career']),                          // 2 งาน
  () => V.monthBars(months, ['money', 'chance']),                 // 3 เงิน
  () => V.monthBars(months, ['love', 'allies', 'family']),        // 4 คน
  () => V.monthBars(months, ['health', 'learning']),              // 5 ร่างกาย/เรียนรู้
  () => P.chart.luckPillars
        ? V.luckStrip(P.chart.luckPillars.map(l => `${l.ageStart}-${l.ageEnd} ${l.stem}${l.branch} ${l.stemTh} ${l.branchTh} (${l.period})`), P.context.ageNow)
        : V.monthBars(months, ['chance', 'career']),                // 6 จังหวะ (ศาสตร์ที่ไม่มีเสาโชคใช้ 12 เดือนแทน)
];

let pageNum = 0;
const pages = [];
const totalPages = 1 + d.chapters.length + 1;

function page(title, body) {
  pageNum++;
  pages.push(`
<div class="page">
  <div class="page-header">
    <span class="page-icon" style="color:#c8a45a;font-size:13px">&#10022;</span>
    <span class="page-title">${esc(title)}</span>
    <span class="page-num">หน้า ${pageNum} / ${totalPages}</span>
  </div>
  <div class="page-body">${body}</div>
  ${pageNum >= totalPages - 1 ? '<div class="page-footer">MYTHSENSUS &#183; คำอ่านรายศาสตร์ สร้างโดย AI บนค่าที่คำนวณจากดวงจริง เพื่อการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ</div>' : ''}
</div>`);
}

// ── หน้าเปิด: แกนของเล่ม + สี่เสา + ธาตุ ─────────────────────────────────
page(`${TITLE} — คำอ่านเฉพาะศาสตร์นี้`, `
  <div style="font-size:17px;color:#e8c87a;line-height:1.72;margin:6px 0 16px;padding:13px 15px;background:#0f0d15;border-left:3px solid #c8a45a;border-radius:0 8px 8px 0">${esc(d.hero)}</div>
  ${P.chart.pillars ? V.fourPillars(P.chart.pillars) : ''}
  <p style="line-height:1.75;margin-bottom:14px">${esc(d.lens)}</p>
  <h2>${esc(d.basis.headline)}</h2>
  ${P.chart.elementCounts ? V.elementBalance(P.chart.elementCounts, P.chart.dayMasterElement, P.chart.luckyElement, P.chart.avoidElement) : ''}
  <p style="font-size:13px;color:#a08a66;line-height:1.7;margin-top:12px">${d.basis.lines && d.basis.lines.length ? esc(d.basis.lines.join(' · ')) : ''}</p>
  <p style="font-size:13px;color:#a08a66;line-height:1.7">นี่คือฐานของทั้งเล่ม — บทต่อจากนี้อ้างกลับมาที่นี่ ไม่กางใหม่ทุกบท</p>`);

// ── บท: ความเรียง + ภาพประจำบท + สิ่งที่ทำได้ ────────────────────────────
d.chapters.forEach((ch, i) => {
  const half = Math.ceil(ch.blocks.length / 2);
  const para = b => `${b.sub ? `<h2 style="margin-top:14px">${esc(b.sub)}</h2>` : ''}
      <p style="line-height:1.78;margin-bottom:11px">${esc(b.text)}</p>`;
  // ภาพวางกลางบท ไม่ใช่ท้ายบท — คนอ่านจะได้พักตาระหว่างทาง ไม่ใช่หลังอ่านจบแล้ว
  page(ch.title, `
    ${ch.blocks.slice(0, half).map(para).join('')}
    ${(CHAPTER_VISUAL[i] || (() => ''))()}
    ${ch.blocks.slice(half).map(para).join('')}
    ${ch.takeaway ? `<div style="margin-top:14px;padding:10px 13px;background:#0d1208;border-left:3px solid #6a9a4a;border-radius:0 8px 8px 0;line-height:1.7"><strong style="color:#9ac86a">ทำได้เลย</strong> &#8212; ${esc(ch.takeaway)}</div>` : ''}`);
});

// ── หน้าปิด ──────────────────────────────────────────────────────────────
page('อ่านจบแล้วทำอะไรต่อ', `
  <p style="line-height:1.78">${esc(d.closing)}</p>
  ${(d.limits || []).length ? `<h2>เรื่องที่ศาสตร์นี้อ่านไม่ได้</h2>
  <p style="line-height:1.75;color:#c8b890;margin-bottom:8px">ไม่ใช่ข้อบกพร่องของดวงคุณ — เป็นขอบเขตของวิชา</p>
  <table><thead><tr><th>เรื่อง</th><th>ทำไม</th><th>ควรไปดูจากไหน</th></tr></thead><tbody>
  ${d.limits.map(l => `<tr><td>${esc(l.topic)}</td><td>${esc(l.why)}</td><td style="color:#9ab0c8">${esc(l.whereInstead)}</td></tr>`).join('')}
  </tbody></table>` : ''}`);

const html = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<title>${esc(TITLE)} — คำอ่านรายศาสตร์</title><style>${CSS}</style></head>
<body>${pages.join('\n')}</body></html>`;

const out = path.join(__dirname, process.argv[4] || `oneoff-${SYS}.html`);
fs.writeFileSync(out, html);
const blocks = d.chapters.flatMap(c => c.blocks);
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(html.replace(/<style>[\s\S]*?<\/style>/, ''));
console.log(`เขียน ${out}
  หน้า ${pageNum} · บท ${d.chapters.length} · ย่อหน้า ${blocks.length} · ภาพ ${CHAPTER_VISUAL.length + 2} ชุด
  อีโมจิในหน้า: ${emoji ? 'พบ — ต้องเอาออก' : 'ไม่มี'}`);
