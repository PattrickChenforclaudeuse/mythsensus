// เพิ่มเนื้อหาให้ "ดูดวงน้อง" (ของที่ขาย ฿250) — 12 ก.ย. 69
// director: "น้อยไปไหมกับราคาที่เขาจ่าย น่าจะเพิ่มเนื้อหา" — ของเดิมที่จ่ายแล้วได้คือการ์ดเดียว 6 แถว
// และแถวแรก (นิสัยเด่น) ซ้ำกับ "นิสัยน้อง" ที่เห็นฟรีอยู่แล้ว
//
// ⛔ ทุกบล็อกมาจากค่าที่เอนจินคำนวณให้แล้ว — ไม่มีตัวเลข/คำทำนายที่เขียนขึ้นเอง
//    (calcForecast · taksa.kalakiniTh · bazi.missingElement · ninestar.year2026Analysis · _PET_EL เดิม)
// ⛔ ปฏิทินน้องตัดด้าน การงาน/การเงิน/โอกาส ทิ้ง — สัตว์เลี้ยงไม่มีเรื่องพวกนี้ เอามาแปะ = แต่ง
// ⛔ ห้ามตรวจไฟล์นี้ด้วย `node --check` (repo เป็น ESM → ฟ้อง duplicate function ลวง) ใช้ `node build-check.cjs`
// รันซ้ำได้ · หลังรันต้อง node _tools/extract-app.cjs เพื่อ bump ?v=
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', 'build', 'app.js');
let s = fs.readFileSync(F, 'utf8');
if (s.includes('_petWeeksBlock')) { console.log('already patched'); process.exit(0); }
// ⛔ ไฟล์นี้สลับ LF/CRLF ได้ตาม git autocrlf — ตัวจับต้องยอมรับทั้งสองแบบ ไม่งั้น anchor miss ลวง
const rep = (a, b) => {
  const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n'), 'g');
  const n = (s.match(re) || []).length;
  if (n !== 1) { console.error('ANCHOR MISS/DUP (' + n + '): ' + a.slice(0, 90)); process.exit(1); }
  s = s.replace(re, () => b);
};

const HELPERS = String.raw`
// ── เนื้อหาเพิ่มของ "ดูดวงน้อง" (12 ก.ย. 69) ───────────────────────────────
// ด้านที่ใช้กับสัตว์เลี้ยง: สุขภาพ · ความผูกพัน · ฝึก/เรียนรู้ · เข้าสังคม · บ้าน/อาณาเขต
// ⛔ ไม่เอา career/money/chance — สัตว์เลี้ยงไม่มีเรื่องพวกนั้น
const _PET_FC_DOMAINS = [
  { k:'health',   th:'สุขภาพ',        en:'Health',      emoji:'🩺' },
  { k:'love',     th:'ความผูกพัน',    en:'Bond',        emoji:'❤️' },
  { k:'learning', th:'ฝึก · เรียนรู้', en:'Training',    emoji:'🎓' },
  { k:'allies',   th:'เข้าสังคม',      en:'Socialising', emoji:'🤝' },
  { k:'family',   th:'บ้าน · อาณาเขต', en:'Home',        emoji:'🏠' },
];
// band → สิ่งที่เจ้าของทำได้จริง (ผูกกับ band ที่เอนจินให้ ไม่ใช่สุ่ม)
const _PET_FC_ACT = {
  health:   { up:'เหมาะพาไปตรวจ/ฉีดวัคซีน หรือเริ่มอาหารสูตรใหม่', mid:'ดูแลตามปกติ', down:'เลี่ยงเปลี่ยนอาหารหรือเดินทางไกล สังเกตอาการใกล้ชิด' },
  love:     { up:'เวลาเล่นด้วยกันจะได้ผลมากกว่าปกติ', mid:'รักษากิจวัตรเดิมไว้', down:'น้องอาจอยากอยู่เงียบๆ อย่าฝืนอุ้มหรือกอด' },
  learning: { up:'สัปดาห์ที่เหมาะเริ่มฝึกคำสั่งใหม่มากที่สุด', mid:'ทบทวนของเดิม ยังไม่ต้องเพิ่มของใหม่', down:'เลื่อนการฝึกของใหม่ออกไปก่อน' },
  allies:   { up:'เหมาะแนะนำให้เจอคนหรือสัตว์ตัวใหม่', mid:'พาเจอเท่าที่เคย', down:'เลี่ยงพาเข้าที่คนเยอะหรือเจอหน้าใหม่' },
  family:   { up:'เหมาะจัดที่นอนหรือย้ายมุมใหม่ในบ้าน', mid:'ไม่ต้องเปลี่ยนอะไร', down:'อย่าเพิ่งย้ายของหรือย้ายกรง น้องหวงที่' },
};
// ดาวกาลกิณี → วันที่ตำราสั่งให้เลี่ยง (ตามที่ taksa.reading ของเอนจินเขียนไว้เอง)
const _PET_KALAKINI_DAY = { 'อาทิตย์':'วันอาทิตย์','จันทร์':'วันจันทร์','อังคาร':'วันอังคาร','พุธ':'วันพุธ','พฤหัสบดี':'วันพฤหัสบดี','ศุกร์':'วันศุกร์','เสาร์':'วันเสาร์','ราหู':'วันพุธกลางคืน' };

function _petWeeksBlock(chart, isTh){
  var f = null;
  try { f = window.MS26 && MS26.calcForecast(chart, new Date(), { days:0, weeks:4, months:0 }); } catch(_) { return ''; }
  if (!f || !Array.isArray(f.weeks) || !f.weeks.length) return '';
  var rows = f.weeks.slice(0,4).map(function(w){
    var cells = _PET_FC_DOMAINS.map(function(d){
      var v = w.domains && w.domains[d.k];
      if (!v || !v.n) return '<td style="text-align:center;color:var(--muted)">—</td>';
      var c = v.score >= 4 ? '#4a9a40' : v.score <= 2 ? '#c06060' : 'var(--muted)';
      return '<td style="text-align:center;color:' + c + ';font-weight:600">' + v.score + '</td>';
    }).join('');
    return '<tr><td style="white-space:nowrap;color:var(--text);padding:3px 0">' + _esc(isTh ? w.labelTh : w.labelEn) + '</td>' + cells + '</tr>';
  }).join('');
  var scored = _PET_FC_DOMAINS.map(function(d){ return { d:d, v:(w0Get(f,d.k)) }; }).filter(function(x){ return x.v && x.v.n; });
  scored.sort(function(a,b){ return b.v.score - a.v.score; });
  var hi = scored[0], lo = scored[scored.length-1];
  var line = function(x, kind){
    if (!x) return '';
    return '<div style="font-size:12.5px;color:var(--text);line-height:1.7;margin-top:6px">' + x.d.emoji + ' <strong>' + (isTh?x.d.th:x.d.en) + '</strong> — ' + _esc(_PET_FC_ACT[x.d.k][kind]) + '</div>';
  };
  var head = isTh
    ? (f.votingCount + ' จาก ' + f.totalSystems + ' ศาสตร์ที่มีวิชาเดินเวลาออกเสียง · 1-5 เทียบกับปีของน้องเอง')
    : (f.votingCount + ' of ' + f.totalSystems + ' systems can speak to timing · 1-5 against this pet\'s own year');
  return '<div class="deep-sys-card" style="margin-top:12px">' +
    '<h3 class="deep-sys-title">📅 ' + (isTh ? 'ปฏิทินน้อง 4 สัปดาห์ข้างหน้า' : 'The next four weeks') + '</h3>' +
    '<div class="deep-sys-origin">' + head + '</div>' +
    '<div style="overflow-x:auto;margin-top:10px"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<tr><th></th>' + _PET_FC_DOMAINS.map(function(d){ return '<th style="font-size:15px;font-weight:400">' + d.emoji + '</th>'; }).join('') + '</tr>' +
    rows + '</table></div>' +
    line(hi, (hi && hi.v.score >= 4) ? 'up' : 'mid') + line(lo, (lo && lo.v.score <= 2) ? 'down' : 'mid') +
    '<div style="font-size:11px;color:var(--muted);margin-top:8px">' + (isTh ? '⛔ ไม่มีด้านการงาน/การเงิน — สัตว์เลี้ยงไม่มีเรื่องพวกนั้น เราจึงไม่คิดให้' : 'No career or money rows — pets have neither, so we do not invent them') + '</div>' +
  '</div>';
}
function w0Get(f, k){ var w = f.weeks[0]; return (w && w.domains && w.domains[k]) || null; }

// วันที่ตำราสั่งให้เลี่ยง — จากกาลกิณีในภูมิทักษาของน้องเอง
function _petAvoidDayBlock(chart, petName, isTh){
  var kl = chart.taksa && chart.taksa.kalakiniTh;
  var day = kl && _PET_KALAKINI_DAY[kl];
  if (!day) return '';
  var body = isTh
    ? ('กาลกิณีของ ' + _esc(petName) + ' คือ <strong>' + kl + '</strong> ⇒ <strong>' + day + '</strong> คือวันที่ตำราสั่งให้เลี่ยงเริ่มของใหม่ — ย้ายบ้าน ย้ายกรง เปลี่ยนอาหาร ผ่าตัด หรือรับน้องตัวใหม่เข้าบ้าน')
    : (_esc(petName) + '\'s Kalakini is <strong>' + kl + '</strong> ⇒ <strong>' + day + '</strong> is the day to avoid starting anything new — moving, changing food, surgery, or bringing another pet home');
  return '<div class="deep-sys-card" style="margin-top:12px">' +
    '<h3 class="deep-sys-title">⚠️ ' + (isTh ? 'วันที่ตำราสั่งให้เลี่ยง' : 'The day to avoid') + '</h3>' +
    '<div class="deep-sys-origin">' + (isTh ? 'ทักษา — กาลกิณีของน้อง' : 'Taksa — this pet\'s Kalakini') + '</div>' +
    '<div style="font-size:13px;color:var(--text);line-height:1.75;margin-top:8px">' + body + '</div></div>';
}

// ธาตุที่ขาด — BaZi บอกเอง · ของที่เสริมใช้ข้อมูลธาตุนั้นที่มีอยู่แล้วใน _PET_EL
function _petMissingElBlock(chart, petName, isTh){
  var miss = chart.bazi && chart.bazi.missingElement;
  var info = miss && _PET_EL[miss];
  if (!info) return '';
  var L = isTh ? info.th : info.en;
  var body = isTh
    ? ('ผังของ ' + _esc(petName) + ' <strong>ไม่มีธาตุ' + miss + '</strong> — ตำราให้เสริมจากของรอบตัว: สี <strong>' + info.color.th + '</strong> · ' + L.care)
    : (_esc(petName) + '\'s pillars carry <strong>no ' + miss + '</strong> — the tradition compensates through surroundings: colour <strong>' + info.color.en + '</strong> · ' + L.care);
  return '<div class="deep-sys-card" style="margin-top:12px">' +
    '<h3 class="deep-sys-title">🧩 ' + (isTh ? 'ธาตุที่น้องขาด' : 'The element this pet lacks') + '</h3>' +
    '<div class="deep-sys-origin">BaZi — ' + (isTh ? 'ธาตุที่ไม่มีในผังวันเกิด' : 'absent from the birth pillars') + '</div>' +
    '<div style="font-size:13px;color:var(--text);line-height:1.75;margin-top:8px">' + body + '</div></div>';
}

// ปีนี้ของน้อง — ข้อความของเอนจินเอง (Nine Star Ki)
function _petYearBlock(chart, isTh){
  var yr = chart.ninestar && chart.ninestar.year2026Analysis;
  if (!yr) return '';
  var txt = String(yr).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!txt) return '';
  return '<div class="deep-sys-card" style="margin-top:12px">' +
    '<h3 class="deep-sys-title">⭐ ' + (isTh ? 'ปีนี้ของน้อง' : 'This year for your pet') + '</h3>' +
    '<div class="deep-sys-origin">Nine Star Ki — ' + (isTh ? 'ดาวประจำตัวน้องในผังปีนี้' : 'the pet\'s natal star in this year\'s chart') + '</div>' +
    '<div style="font-size:13px;color:var(--text);line-height:1.75;margin-top:8px">' + _esc(txt) + '</div></div>';
}
`;
rep('function _petCareRow(icon, label, text){', HELPERS + '\nfunction _petCareRow(icon, label, text){');

rep(`        \${_petCareRow('🌀', isTh?'สัญลักษณ์มายัน':'Mayan day sign', isTh?\`\${mayan} — พลังประจำวันเกิด\`:\`\${mayan} — birth-day spirit\`)}
      </div>
    </div>\`;`,
`        \${_petCareRow('🌀', isTh?'สัญลักษณ์มายัน':'Mayan day sign', isTh?\`\${mayan} — พลังประจำวันเกิด\`:\`\${mayan} — birth-day spirit\`)}
      </div>
    </div>
    \${_petWeeksBlock(chart, isTh)}
    \${_petAvoidDayBlock(chart, pet.name, isTh)}
    \${_petMissingElBlock(chart, pet.name, isTh)}
    \${_petYearBlock(chart, isTh)}\`;`);

fs.writeFileSync(F, s);
console.log('pet reading: +4 blocks (ปฏิทิน 4 สัปดาห์ · วันต้องระวัง · ธาตุที่ขาด · ปีนี้)');
