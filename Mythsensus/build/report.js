"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = void 0;
// ============================================================
//  MYTHSENSUS — Report HTML Generator
//  Generates full 25-section report from ChartData.
//  Structure-first version: all sections with real calculated data.
//  Expand prose text per section in future iterations.
// ============================================================
const calc_1 = require("./calc");
// ── helpers ──────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Strip HTML tags + collapse whitespace. Use for fields whose templates contain
// <strong>/<div>/<br> markup before truncating with substring(): cutting through
// a tag boundary leaves a broken open tag that the page renders as raw text.
const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
// Truncate a string with an ellipsis when it actually overflows. Prefer this
// over bare .slice(0,N) for badge-style labels — bare slice silently drops
// the suffix (e.g. "เดือนความจริง-ไฟ" → "เดือนความจริง-ไ" looks broken).
const trunc = (s, n) => {
    const v = String(s ?? '');
    return v.length > n ? v.slice(0, Math.max(1, n - 1)) + '…' : v;
};
function bar(score, color) {
    const pct = Math.round((score - 300) / 7);
    return `<div style="background:#2a2010;border-radius:4px;height:10px;overflow:hidden;margin-top:4px">
    <div style="width:${pct}%;height:10px;border-radius:4px;background:${esc(color)}"></div></div>`;
}
function scoreColor(s) {
    if (s >= 850)
        return '#c8a45a';
    if (s >= 750)
        return '#1a8a3a';
    if (s >= 650)
        return '#3a5a80';
    return '#9a8a72';
}
function pill(text, bg = '#2a2010', color = '#c8a45a') {
    return `<span style="display:inline-block;background:${bg};color:${color};border-radius:20px;padding:2px 10px;font-size:11px;margin:2px">${esc(text)}</span>`;
}
// Auto-incrementing page counter (reset per report generation)
let _pageNum = 0;
let _totalPages = 29; // set from pageFns.length at render time — do not hand-edit
// Language for the currently-generating report. Set once by generateReport()
// from chart.input.lang so page headers/footers respect the user's choice.
let _lang = 'th';
// Translation helper. Use everywhere a Thai string is rendered into the
// report: tr('ดวงชะตา', 'destiny chart'). Returns Thai when _lang is 'th'
// (the default for the Thai-first market), English otherwise. Designed for
// inline use in template literals so the original Thai stays readable in
// source — translators / brand reviewers can still scan the English second
// argument without context-switching files.
const tr = (th, en) => _lang === 'en' ? en : th;
// ── Data-field translator ───────────────────────────────────────
// SLIM MAP after Phases A-B made the engine bilingual at the source.
// The remaining entries handle:
//   1. SCORE_WEIGHTS labels (system names baked into chart.score.breakdown
//      use Thai-mixed names like 'BaZi สี่เสา' / 'ไทยพราหมณ์' — these flow
//      directly to score-table renderers and need translation here).
//   2. Tier label aliases (chart.score.tier vs tierEn).
//   3. A handful of misc page-level fragments.
// All ~150 chart-data Thai entries (elements, directions, colours, days,
// stems, branches, totems, dreamings, aztec signs, celtic trees, ziwei
// stars, gods, profile descs, py meanings) are now handled at calc.ts
// via tPick/pEl/pDir/pColor/pDay — the chart object stores the
// language-correct value at calculate time, so trDF doesn't need them.
const _DF_MAP = {
    // SCORE_WEIGHTS system labels (mixed Thai-English in calc.ts:1188-1219)
    'โหราศาสตร์ตะวันตก': 'Western Astrology',
    'BaZi สี่เสา': 'BaZi · Four Pillars',
    'เลขศาสตร์ Pythagorean': 'Pythagorean Numerology',
    'เลข ๗ ตัว ๙ ฐาน': 'Thai 7-Number System',
    'ระบบประเภทพลังงาน': 'Human Design',
    'มายัน Tzolk\'in': 'Mayan Tzolk\'in',
    'เซลติก Tree': 'Celtic Tree',
    'ไทยพราหมณ์': 'Thai Brahmin',
    // Tier labels (chart.score.tier still ships Thai-prefixed when not en-only)
    'ทิพย์ — Divine': 'Divine',
    'รัศมี — Radiance': 'Radiance',
    'ประกาย — Glimmer': 'Glimmer',
    'ดุลย์ — Balance': 'Balance',
    'ปฐพี — Earth': 'Earth',
    'แสวง — Seeking': 'Seeking',
    'อรุณ — Dawn': 'Dawn',
    // Common short page-level fragments still surfacing in score breakdowns
    'เห็นด้วย': 'Agree', 'กลางๆ': 'Mixed', 'เสียงเตือน': 'Cautions',
    'ครบทุกธาตุ': 'all elements present',
};
// Translate a data-layer Thai string to English when in EN mode. Falls
// through unchanged when (a) lang is Thai or (b) the string isn\'t in the
// map — so untranslated strings remain visible (and traceable) instead of
// silently dropping.
const trDF = (s) => {
    if (_lang !== 'en' || !s)
        return s;
    return _DF_MAP[s] ?? s;
};
function section(_num, title, icon, content) {
    _pageNum++;
    const isEn = _lang === 'en';
    const pageLabel = isEn ? `Page ${_pageNum} / ${_totalPages}` : `หน้า ${_pageNum} / ${_totalPages}`;
    const footerText = isEn
        ? '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ AI-generated analysis of 26 ancient systems · for personal exploration, not professional advice ✦'
        : '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ รายงานสร้างโดย AI วิเคราะห์จาก 26 ศาสตร์โบราณ เพื่อการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ ✦';
    // No per-page bg override — body star-field shows through transparent .page
    return `
<div class="page">
  <div class="page-header">
    <span class="page-icon" style="color:#c8a45a;font-size:13px">✦</span>
    <span class="page-title">${esc(title)}</span>
    <span class="page-num">${pageLabel}</span>
  </div>
  <div class="page-body">
    ${content}
  </div>
  <div class="page-footer">${footerText}</div>
</div>`;
}
function row2(label, value) {
    return `<tr><td class="lbl">${esc(label)}</td><td>${esc(value)}</td></tr>`;
}
function box(title, body, type = 'gold') {
    const styles = {
        gold: 'background:#12101c;border:1px solid #c8a45a;border-radius:8px;padding:10px;margin:6px 0',
        green: 'background:#0a1a0e;border:1px solid #1a8a3a;border-radius:8px;padding:10px;margin:6px 0',
        red: 'background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:10px;margin:6px 0',
        dark: 'background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:10px;margin:6px 0',
        purple: 'background:#120a1a;border:1px solid #7a3aaa;border-radius:8px;padding:10px;margin:6px 0',
    };
    return `<div class="rbox" style="${styles[type]}"><div style="font-weight:bold;margin-bottom:8px;color:#c8a45a">${esc(title)}</div><div style="font-size:13px;line-height:1.8;color:#c8c0a8">${body}</div></div>`;
}
// ── CSS ───────────────────────────────────────────────────────
// Background uses a layered star-field via multiple radial-gradients
// (restored — previous version lost the starfield when bg was simplified
// to flat #040407). Pages no longer have a hard min-height constraint so
// long content flows onto a second/third page naturally instead of being
// clipped.
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:'Cormorant Garamond','Sarabun','Noto Sans Thai',serif;
  color:#e6e2d8;
  background-color:#040407;
  background-image:
    radial-gradient(1px 1px at 14% 22%, rgba(255,235,200,.85) 50%, transparent 55%),
    radial-gradient(1px 1px at 26% 72%, rgba(200,220,255,.70) 50%, transparent 55%),
    radial-gradient(1px 1px at 42% 34%, rgba(255,255,255,.80) 50%, transparent 55%),
    radial-gradient(1.3px 1.3px at 58% 18%, rgba(255,245,220,.95) 50%, transparent 55%),
    radial-gradient(1px 1px at 73% 64%, rgba(220,220,255,.75) 50%, transparent 55%),
    radial-gradient(1px 1px at 82% 30%, rgba(255,255,230,.85) 50%, transparent 55%),
    radial-gradient(1.5px 1.5px at 92% 78%, rgba(255,235,200,.95) 50%, transparent 55%),
    radial-gradient(0.8px 0.8px at 10% 88%, rgba(255,255,255,.60) 50%, transparent 55%),
    radial-gradient(0.8px 0.8px at 34% 8%,  rgba(200,220,255,.60) 50%, transparent 55%),
    radial-gradient(0.9px 0.9px at 65% 90%, rgba(255,245,220,.70) 50%, transparent 55%),
    radial-gradient(ellipse at center, #0a0a12 0%, #060610 55%, #040407 100%);
  background-size: 600px 800px, 700px 900px, 500px 700px, 800px 600px, 640px 750px, 720px 820px, 560px 680px, 900px 1000px, 820px 920px, 680px 860px, 100% 100%;
  background-attachment: fixed;
}
/* Each page uses transparent so the body star field shows through.
   min-height removed so content flows to next page when overflowing —
   UX first, hard pagination second. */
.page{padding:9mm 13mm 9mm;page-break-after:always;position:relative;background:transparent}
.page-header{display:flex;align-items:center;gap:10px;border-bottom:1px solid #3a3020;padding-bottom:6px;margin-bottom:11px}
.page-icon{font-size:22px}
.page-title{font-size:16px;font-weight:700;color:#c8a45a;flex:1;letter-spacing:1px}
.page-num{font-size:11px;color:#6a5a42}
.page-body{font-size:13px;line-height:1.5;color:#c8c0a8;padding-bottom:10px}
.page-footer{text-align:center;font-size:9px;color:#6a5a42;border-top:1px solid #2a2010;padding-top:5px;margin-top:10px}
h2{font-size:15px;color:#c8a45a;font-weight:700;margin:10px 0 5px;border-left:3px solid #c8a45a;padding-left:10px}
h3{font-size:13px;color:#c8a45a;font-weight:600;margin:12px 0 6px}
p{margin-bottom:5px;color:#c8c0a8}
table{width:100%;border-collapse:collapse;margin:10px 0}
th{background:#0d0d15;color:#c8a45a;padding:8px 10px;text-align:left;font-size:12px}
td{padding:7px 10px;border-bottom:1px solid #2a2010;font-size:12px;vertical-align:top}
.lbl{color:#9a8a72;font-weight:600;width:30%;background:#0a0a10}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:10px 0}
.stat-card{background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.stat-card .val{font-size:28px;font-weight:700;color:#c8a45a}
.stat-card .lbl{font-size:11px;color:#9a8a72;width:auto;background:transparent;padding:0;margin-top:4px}
.pillar{background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.pillar.dm{border-color:#c8a45a;background:#12101c}
.pillar .stem{font-size:32px;font-weight:700;color:#c8a45a}
.pillar .branch{font-size:22px;color:#c8a45a;margin-top:4px}
.pillar .sublabel{font-size:10px;color:#6a5a42;margin-top:2px}
.conv{border-left:3px solid #c8a45a;padding:8px 12px;margin:8px 0;background:#0d0d15}
.conv.med{border-left-color:#6a5a42;background:#0a0a10}
.warn{background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:12px;margin:8px 0;color:#f0c8b0}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px}
@media print{
  /* The report is a dark-theme design built almost entirely from INLINE
     dark backgrounds + light text. The previous half-baked light override
     (body→#fff, recolour ~6 selectors) left every inline-styled element +
     the light .page-body/p/h3 text invisible on white paper — the "saved
     PDF unreadable" bug (Director 2026-07-02). Fix: force the browser to
     print the colours/backgrounds faithfully so the PDF == the screen.
     print-color-adjust:exact overrides Chrome's "Background graphics: off"
     default, which was dropping every dark box background. */
  *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  html,body{ background:#040407 !important; background-image:none !important; color:#e6e2d8 !important; }
  .page{ page-break-after:always; min-height:0; background:#040407 !important; }
  /* Keep boxes/tables/cards from being cut across A4 sheet boundaries. A ~43
     logical-page report overflows to ~80+ physical sheets, and without this
     content splits mid-box → hard to read (Director 2026-07-02). break-inside
     :avoid is only a hint — an element taller than a page still breaks, so
     this can't create blank pages. */
  .rbox, table, tr, .stat-card, .pillar, .conv, .warn,
  .grid-2 > div, .grid-3 > div,
  div[style*="border-radius"]{ break-inside:avoid; page-break-inside:avoid; }
  .page-header{ break-inside:avoid; }
  h2, h3{ break-after:avoid; page-break-after:avoid; }
}`;
// ── PAGES ─────────────────────────────────────────────────────
// dd/mm/yyyy is ambiguous in international audiences (3/2 = March 2 or Feb 3?).
// Render with localized month name to remove the ambiguity.
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDob = (input) => {
    const months = input.lang === 'en' ? MONTHS_EN : MONTHS_TH;
    const m = months[Math.max(0, Math.min(11, input.month - 1))];
    return `${input.day} ${m} ${input.year}`;
};
function p01_cover(c) {
    const { score, bazi, western, ninestar, numerology, input } = c;
    const dobStr = formatDob({ ...input, lang: _lang });
    const timeStr = _lang === 'en'
        ? `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}`
        : `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')} น.`;
    // Current age — surfaced on the cover so readers immediately notice if
    // their birth-year was off by 10 (a common typo: 1985 vs 1995). Birthday
    // hasn't happened yet this year? subtract 1.
    const _now = new Date();
    let _age = _now.getFullYear() - input.year;
    const _birthdayThisYear = new Date(_now.getFullYear(), input.month - 1, input.day);
    if (_now < _birthdayThisYear)
        _age -= 1;
    const ageStr = _lang === 'en' ? `${_age} years old` : `อายุ ${_age} ปี`;
    const pctBar = Math.max(0, Math.min(100, Math.round((score.total - 300) / 6.99))); // 300–999 → 0–100, clamped (was (t-400)/6 → negative near the floor)
    // Tier label is only available in Thai from the engine. When rendering EN,
    // prefer score.tierEn (already English) and skip the secondary "TierEn ·"
    // line since it would duplicate. In TH we keep both to give the reader
    // both languages on the same row.
    const tierMain = _lang === 'en' ? esc(score.tierEn || score.tier) : esc(score.tier);
    // 910 and "87 of 100" were the same fact printed twice. One number, and the
    // sentence that says where it comes from.
    const _pct = Math.round(((score.total - 300) / 699) * 100);
    const tierSub = '';
    const scoreWhere = tr(`คะแนนนี้คือ <strong>ค่าเฉลี่ยคะแนนที่ 26 ศาสตร์ให้คุณ</strong> เทียบกับดวงสุ่ม 3,000 ดวงที่เราใช้ตั้งสเกล — ของคุณสูงกว่า <strong>${_pct}%</strong> ของดวงเหล่านั้น · สเกลเต็ม 1,000`, `This is the <strong>average of the scores the 26 traditions gave you</strong>, placed against 3,000 random charts used to set the scale — yours sits above <strong>${_pct}%</strong> of them. The scale runs to 1,000.`);
    return section(1, tr('Cosmic Blueprint — ภาพรวม', 'Cosmic Blueprint — Overview'), '✦', `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:10px;color:#6a5a42;letter-spacing:4px;margin-bottom:6px">✦ MYTHSENSUS — PREMIUM EDITION ✦</div>
      <div style="font-size:22px;font-weight:700;color:#c8a45a;margin-bottom:4px">Cosmic Blueprint · 26 Ancient Systems</div>
      <div style="font-size:12px;color:#9a8a72">${esc(input.gender)}${input.name ? ' ' + esc(input.name) : ''} · ${dobStr} · ${timeStr} · <strong style="color:#c8a45a">${ageStr}</strong></div>
      <div style="font-size:10.5px;color:#6a5a42;margin-top:4px;font-style:italic">${tr('ตรวจดูว่าวันเดือนปีถูก — ถ้าอายุไม่ตรง ให้กลับไปแก้ที่ Profile', 'Double-check the date — if the age is wrong, edit your profile')}</div>
    </div>

    <!-- Cosmic Score -->
    <div style="background:#0d0d15;border:2px solid #c8a45a;border-radius:14px;padding:20px;margin:12px 0">
      <div style="display:flex;gap:20px;align-items:center">
        <div style="text-align:center;min-width:90px">
          <div style="font-size:60px;font-weight:700;color:#c8a45a;line-height:1">${score.total}</div>
          <div style="font-size:10px;color:#6a5a42;letter-spacing:1px">COSMIC SCORE</div>
          <div style="font-size:8px;color:#6a5a42;letter-spacing:.5px;margin-top:2px">${tr('ระดับดวงเทียบ 26 ศาสตร์', 'your chart\'s level · vs 26 systems')}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:20px;font-weight:700;color:#e6e2d8">${tierMain}</div>
          <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tierSub}</div>
          <div style="background:#2a2010;border-radius:6px;height:10px;overflow:hidden">
            <div style="width:${pctBar}%;height:10px;background:linear-gradient(90deg,#5a3810,#c8a45a)"></div>
          </div>
          <div style="font-size:10px;color:#6a5a42;margin-top:4px">
            ${scoreWhere}
          </div>
        </div>
      </div>
      <!-- Consensus bar -->
      <div style="display:flex;gap:6px;margin-top:14px;align-items:center">
        <div style="font-size:11px;color:#9a8a72;min-width:60px">Consensus:</div>
        <div style="background:#1a3a10;border-radius:4px;padding:3px 10px;font-size:12px;font-weight:600;color:#4aaa4a">🌟 ${score.starCount}/26</div>
        <div style="background:#2a2a10;border-radius:4px;padding:3px 10px;font-size:12px;color:#aaa84a">〰 ${score.midCount}/26</div>
        <div style="background:#3a1510;border-radius:4px;padding:3px 10px;font-size:12px;color:#aa5a4a">⚠ ${score.warnCount}/26</div>
        <div style="flex:1;font-size:10px;color:#6a5a42;text-align:right">
          ${score.starCount >= 18 ? 'Strong consensus' : score.starCount >= 12 ? 'Moderate consensus' : score.starCount >= 8 ? 'Mixed signals' : 'Rare split chart'}
        </div>
      </div>
    </div>

    <!-- 3-Score Framework REMOVED from the cover (AI council 5/5, 2026-07-02):
         four same-scale numbers on the cover (flagship + SF/LT/PR) read as
         broken math since they don't sum. Cover now = flagship + consensus bar
         only; Soul Frequency / Life Terrain / Path Resonance keep their own
         deep-dive section (p_threeScores) further in the report. -->

    <!-- Key signals -->
    <div class="grid-3" style="margin:12px 0">
      ${(() => {
        // Match the emoji to the actual element so the visual cue agrees with
        // the label. Previously this was a hard-coded 🔥 next to all Day Masters
        // — Water-element users saw a fire emoji and assumed they were Fire.
        const elEmoji = {
            'ไม้': '🌳', 'ไฟ': '🔥', 'ดิน': '🌍', 'โลหะ': '⚔️', 'น้ำ': '🌊',
            'Wood': '🌳', 'Fire': '🔥', 'Earth': '🌍', 'Metal': '⚔️', 'Water': '🌊',
        };
        const dmE = elEmoji[bazi.dayMasterElement] || '✦';
        return [
            [`${dmE} ${tr('ธาตุประจำตัว (BaZi)', 'Primary Element (BaZi)')}`, `${bazi.dayStem} ${bazi.dayMasterElement}`],
            [tr('⭐ ดาวประจำตัว (NSK)', '⭐ Birth Star (NSK)'), ninestar.star + ' ' + ninestar.starName],
            [tr('☀️ Western', '☀️ Western Sun'), _lang === 'en' ? western.sunSign || western.sunSignTh : western.sunSignTh],
            ['🕉️ Vedic Lagna', c.vedic.lagnaSign],
            [tr('⚡ พลังงาน', '⚡ Energy Type'), _lang === 'en' ? c.humandesign.type || c.humandesign.typeTh : c.humandesign.typeTh],
            ['🔢 Life Path', `${numerology.lifePath}`],
        ].map(([l, v]) => `<div class="stat-card"><div class="lbl">${esc(l)}</div><div style="font-size:13px;font-weight:600;color:#c8a45a;margin-top:3px">${esc(v)}</div></div>`).join('');
    })()}
    </div>

    <!-- Element Consensus — answers "which element am I really?" by tallying
         all the birth-fixed element fields across the 26 systems. The BaZi
         Day Master is the East-Asian canonical "your element" but multiple
         systems contribute their own element-read; if a majority agree, the
         consensus is the "loudest" elemental signal. We exclude time-variable
         fields (vedicMahadasha.dashaElement changes with the current period). -->
    ${(() => {
        const ee = { 'ไม้': '🌳', 'ไฟ': '🔥', 'ดิน': '🌍', 'โลหะ': '⚔️', 'น้ำ': '🌊', 'Wood': '🌳', 'Fire': '🔥', 'Earth': '🌍', 'Metal': '⚔️', 'Water': '🌊' };
        const votes = {};
        const _v = (sys, el) => { if (!el)
            return; (votes[el] = votes[el] || []).push(sys); };
        // ONE VOTE PER SYSTEM. BaZi used to vote twice (Day Master + Dominant,
        // often on opposing elements — a system arguing with itself), and Tibetan
        // twice (Mewa + Parkha, always the same answer, so it counted double).
        // Six traditions, six votes.
        _v('BaZi Day Master', bazi.dayMasterElement);
        _v('Nine Star Ki', ninestar.starElement);
        _v('Celtic Tree', c.celtic.element);
        _v('Saju', c.saju.sajuElement);
        _v('Tibetan Mewa', c.tibetan.mewaElement);
        _v('Norse Rune', c.norseRune.runeElement);
        // ⛔ ห้ามใส่ Ogham กลับมา — โอแฮมกับปฏิทินต้นไม้เซลติกเป็นของชิ้นเดียวกัน
        //    (Graves 1948) และตั้งแต่ 1 ก.ย. 69 ธาตุของโอแฮมดึงจาก CELTIC_TREES ตรงๆ
        //    ⇒ ใส่ทั้งคู่ = เซลติกโหวตสองเสียง ซึ่งพอมันชนะ ปกจะไปขัดกับ Day Master
        //    ที่รายงานอีก 39 หน้ายืนอยู่บนนั้น · ด่าน report-invariants ตรึงไว้แล้ว
        //    (คอมเมนต์ข้างบนเขียนว่า "หกศาสตร์ หกเสียง" มาตลอด แต่โค้ดลิสต์เจ็ด)
        const total = Object.values(votes).reduce((s, a) => s + a.length, 0);
        if (total < 2)
            return '';
        // Tie-break: the BaZi Day Master wins. Without it the winner was decided
        // by Object.keys insertion order, i.e. by which system happened to be
        // listed first above.
        const sorted = Object.entries(votes).sort((a, b) => (b[1].length - a[1].length) ||
            ((b[0] === bazi.dayMasterElement ? 1 : 0) - (a[0] === bazi.dayMasterElement ? 1 : 0)));
        const [winEl, winSys] = sorted[0];
        const winEmoji = ee[winEl] || '✦';
        const matchBaZi = winEl === bazi.dayMasterElement;
        const minorityLines = sorted.slice(1).map(([el, sys]) => `${ee[el] || '·'} ${esc(el)} ${sys.length} (${esc(sys.join(', '))})`).join(' · ');
        return `
    <div style="background:linear-gradient(135deg,#0e1a2a,#1a2a3e);border:2px solid #5a8acc;border-radius:12px;padding:14px 18px;margin:12px 0">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="font-size:36px;line-height:1">${winEmoji}</div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:10px;color:#7aaae0;letter-spacing:2px;margin-bottom:3px">${tr('🤝 ฉันทามติธาตุ', '🤝 ELEMENT CONSENSUS')}</div>
          <div style="font-size:20px;font-weight:700;color:#aac8ff">${esc(winEl)}${matchBaZi ? '' : ` <span style="font-size:11px;color:#7a8aaa">(${tr('ต่างจาก BaZi', 'differs from BaZi')})</span>`}</div>
          <div style="font-size:11px;color:#90a8c8;margin-top:4px;line-height:1.6"><strong style="color:#aac8ff">${winSys.length}/${total}</strong> ${tr('ศาสตร์เห็นพ้อง', 'systems agree')} · ${esc(winSys.join(' · '))}</div>
          ${sorted.length > 1 ? `<div style="font-size:10.5px;color:#6a7a90;margin-top:4px">${tr('อีกฝั่งหนึ่ง', 'Other view')}: ${minorityLines}</div>` : ''}
        </div>
      </div>
      <!-- removed 2026-08-31: a lecture on method, on the cover, identical for every buyer -->`;
    })()}

    ${bazi.benMingNian2026 ? `
    <div class="warn">
      <strong>⚠️ ${tr('Ben Ming Nian 2569', 'Ben Ming Nian (2026)')}</strong> — ${tr('เกิดปีม้า ตรงปี 2569 = ทุกสิ่งขยายผล ต้องใส่สีแดง 1 ชิ้น/วัน', 'Year of the Horse coincides with 2026 — everything amplifies. Wear at least one red item per day to balance.')}
    </div>` : ''}

    <div style="background:#0e0a16;border:1px solid #5a3a8a;border-radius:8px;padding:12px;margin:10px 0;display:flex;gap:12px;align-items:center">
      <div style="font-size:24px">✨</div>
      <div>
        <div style="font-size:13px;color:#c0a0e0;font-weight:600">${esc(score.cosmicEntity)}</div>
        <div style="font-size:11px;color:#7a6a9a;margin-top:2px">${tr('ชื่อเรียกประจำดวง', 'A name for your chart')} · ${esc(score.primaryGod)} &amp; ${esc(score.secondaryGod)}</div>
        <div style="font-size:10px;color:#6a5a7a;margin-top:4px;line-height:1.6">${tr('ชื่อกับเทพคู่นี้เลือกจากคะแนนรวมและวันเดือนเกิด <strong>ไม่ใช่คำทำนาย</strong> และไม่มีศาสตร์ไหนออกเสียง — เป็นชื่อไว้เรียกและแชร์เท่านั้น', 'This name and its two deities are picked from your total score and birth date — <strong>not a reading</strong>, and no tradition votes on it. It is a label to name and share, nothing more.')}</div>
      </div>
    </div>
  `);
}
const JOURNEY_TIERS = [
    { min: 850, fuel: { th: 'เครื่องบินเจ็ท', en: 'Jet fuel' }, vehicle: { th: 'เครื่องบิน', en: 'Airplane', icon: '✈️' }, road: { th: 'ท้องฟ้าเปิด', en: 'Open sky', icon: '🌌' } },
    { min: 760, fuel: { th: 'เบนซิน 95+', en: '95+ premium' }, vehicle: { th: 'รถสปอร์ต', en: 'Sports car', icon: '🏎️' }, road: { th: 'ทางด่วน', en: 'Highway', icon: '🛣️' } },
    { min: 700, fuel: { th: 'เบนซิน 91', en: '91 regular' }, vehicle: { th: 'ซีดาน', en: 'Sedan', icon: '🚗' }, road: { th: 'ถนนหลัก', en: 'Main road', icon: '🛤️' } },
    { min: 0, fuel: { th: 'ดีเซล', en: 'Diesel' }, vehicle: { th: 'รถเก่า', en: 'Old car', icon: '🚙' }, road: { th: 'ทางลูกรัง', en: 'Dirt road', icon: '🪨' } },
];
// Resolve a score to its tier. Always returns a tier (last entry has min:0
// so any non-negative score lands somewhere). Caller is responsible for
// gating on score > 0 before calling — score=0 still maps to "Diesel/Old car"
// which would be misleading; we use it only as a typed fallback.
const _journeyTier = (score) => JOURNEY_TIERS.find(t => score >= t.min);
// Render the three-card Cosmic Journey panel. Cards 2-3 (Vehicle, Road) are
// gated on score > 0 — empty score means the user hasn't provided
// career/country/domain context, so we render the placeholder CTA instead of
// inventing a tier from default fallbacks (see review H1).
function _renderCosmicJourney(score) {
    const fuelTier = _journeyTier(score.soulFrequency);
    const ltFilled = score.lifeTerrainScore > 0;
    const prFilled = score.pathResonanceScore > 0;
    const ltTier = ltFilled ? _journeyTier(score.lifeTerrainScore) : null;
    const prTier = prFilled ? _journeyTier(score.pathResonanceScore) : null;
    return `
    <!-- Cosmic Journey analogy -->
    <div style="background:#120a06;border:1px solid #5a3010;border-radius:8px;padding:14px;margin-bottom:14px">
      <div style="font-size:12px;color:#9a6040;margin-bottom:8px;font-weight:600">🛢️ ${tr('ดวงเหมือนการเดินทาง', 'Cosmic Journey')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;font-size:11px">
        <div style="background:#1a0e06;border-radius:6px;padding:10px">
          <div style="font-size:20px;margin-bottom:4px">🛢️</div>
          <div style="color:#c8a45a;font-weight:600">${tr('น้ำมัน', 'Fuel')}</div>
          <div style="color:#7a5a40;margin-top:2px">Soul Frequency</div>
          <div style="color:#aa8050;font-size:12px;margin-top:4px">${score.soulFrequency} = ${tr(fuelTier.fuel.th, fuelTier.fuel.en)}</div>
        </div>
        <div style="background:#1a1206;border-radius:6px;padding:10px;opacity:${ltFilled ? '1' : '0.7'}">
          <div style="font-size:20px;margin-bottom:4px">${ltTier ? ltTier.vehicle.icon : '🚗'}</div>
          <div style="color:#aa8840;font-weight:600">${tr('พาหนะ', 'Vehicle')}</div>
          <div style="color:#7a6030;margin-top:2px">Life Terrain</div>
          <div style="color:${ltFilled ? '#d4a040' : '#7a6030'};font-size:12px;margin-top:4px;font-weight:${ltFilled ? '700' : '400'}">${ltTier ? `${score.lifeTerrainScore} = ${tr(ltTier.vehicle.th, ltTier.vehicle.en)}` : tr('กรอกอาชีพ+ประเทศ', 'Add career + country')}</div>
        </div>
        <div style="background:#0a1015;border-radius:6px;padding:10px;opacity:${prFilled ? '1' : '0.7'}">
          <div style="font-size:20px;margin-bottom:4px">${prTier ? prTier.road.icon : '🛣️'}</div>
          <div style="color:#408890;font-weight:600">${tr('เส้นทาง', 'Road')}</div>
          <div style="color:#306070;margin-top:2px">Path Resonance</div>
          <div style="color:${prFilled ? '#40c0a0' : '#306070'};font-size:12px;margin-top:4px;font-weight:${prFilled ? '700' : '400'}">${prTier ? `${score.pathResonanceScore} = ${tr(prTier.road.th, prTier.road.en)}` : tr('กรอกสายงาน', 'Add domain')}</div>
        </div>
      </div>
    </div>`;
}
// ── 3-SCORE DETAIL ─────────────────────────────────────────────
function p_threeScores(c) {
    const { bazi, score } = c;
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const EL_EN = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const dmElEn = EL_EN[bazi.dayMasterElement] ?? 'Fire';
    // Domain example: Interior BD (construction = Earth, BD = Fire domain → Fire creates Earth → DM_CREATES)
    const bdEl = 'ไฟ'; // BD domain = fire (persuasion, leadership)
    const industryEl = 'ดิน'; // interior/construction = earth
    const countryEl = 'ไม้'; // Thailand = Wood (tropical, agricultural)
    const feedsDm = SHENG[EL_EN[countryEl] ?? ''] === dmElEn;
    const domainFit = SHENG[EL_EN[bdEl] ?? ''] === EL_EN[industryEl] ? 'ธาตุงานเสริมกัน ✓' : 'ธาตุงานต่างกัน';
    // Prose character portrait — answers the page's "who you are" promise in
    // words, synthesising element + tier + the loudest and quietest systems.
    const dmEl = bazi.dayMasterElement;
    const sortedSys = score.breakdown.slice().filter(b => b.display !== false).sort((a, b) => b.score - a.score);
    const topSys = sortedSys[0], secondSys = sortedSys[1], lowSys = sortedSys[sortedSys.length - 1];
    const tierLabel = _lang === 'en' ? (score.tierEn || score.tier) : score.tier;
    const portrait = tr(`ถ้าจะสรุปคุณเป็นย่อหน้าเดียว: คุณคือพลังงานธาตุ${esc(dmEl)} ที่แกนกลางของดวงสั่นพ้องในระดับ "${esc(tierLabel)}" (${esc(score.percentile)}) · ศาสตร์ที่ขับตัวตนคุณออกมาชัดที่สุดคือ <strong style="color:#c0e080">${esc(trDF(topSys.system))}</strong> — ${esc(stripHtml(String(topSys.finding || '')))} เสริมด้วยเสียงของ ${esc(trDF(secondSys.system))} อีกแรง · ส่วน ${esc(trDF(lowSys.system))} ที่ให้คะแนนต่ำสุดไม่ได้แปลว่าคุณอ่อนด้านนั้น แต่คือมุมที่พลังงานของคุณเลือกไม่เดินเป็นทางหลัก — และความ "ไม่เท่ากันทุกด้าน" นี่เองที่ทำให้คุณเป็นคุณ ไม่ใช่ค่าเฉลี่ยของใคร`, `If we had to capture you in a single paragraph: you are ${esc(dmEl)}-element energy whose core resonates at the "${esc(tierLabel)}" level (${esc(score.percentile)}). The system that voices your identity most clearly is <strong style="color:#c0e080">${esc(trDF(topSys.system))}</strong> — ${esc(stripHtml(String(topSys.finding || '')))}, reinforced by ${esc(trDF(secondSys.system))}. Your lowest-scoring system, ${esc(trDF(lowSys.system))}, doesn't mean you're weak there — it's simply an angle your energy chooses not to travel as a main road. That very unevenness is what makes you <em>you</em>, not an average of anyone else.`);
    return section(2, tr('Soul Frequency — คุณเป็นใครตั้งแต่เกิด', 'Soul Frequency — Who You Are From Birth'), '🔥', `
    <!-- No restated big number here (AI council + Director 2026-07-02): Soul
         Frequency == the cover Cosmic Score now, so a second big number under a
         different name — with a raw "median 771" beside the normalised score —
         read as redundant + contradictory. This page is the DEPTH behind the
         cover number, not a competing score. -->
    <div style="font-size:12.5px;color:#7a8a60;margin-bottom:16px;line-height:1.7">
      ${tr('Soul Frequency คือ', 'Soul Frequency is')} <strong style="color:#c0d080">${tr('ระดับดวงพื้นฐานของคุณ', 'your fundamental chart level')}</strong> — ${tr('ก็คือ Cosmic Score บนหน้าปกนั่นเอง — คือ<strong>อันดับเปอร์เซ็นไทล์</strong>ของมัธยฐาน 26 ศาสตร์ของคุณ เทียบกับกลุ่มอ้างอิง แล้วแปลงเป็นสเกลเต็ม 1,000 (ไม่ใช่ตัวเลขมัธยฐานดิบ · ไม่เปลี่ยนตลอดชีวิต เหมือนเกรดน้ำมัน)', 'the very Cosmic Score on your cover — the <strong>percentile rank</strong> of your 26-system median against a reference sample, mapped onto a scale out of 1,000 (not the raw median itself; fixed for life, like the grade of petroleum)')}<br>
      ${tr('หน้านี้เจาะว่าศาสตร์ไหนขับตัวตนคุณออกมาชัดที่สุด และคุณเป็นใครในหนึ่งย่อหน้า', 'This page shows which systems voice your identity most clearly — and who you are, in one paragraph.')}
    </div>

    ${box(tr('ภาพรวมตัวตนคุณในหนึ่งย่อหน้า', 'Your portrait in one paragraph'), portrait, 'green')}

    ${_renderCosmicJourney(score)}

    <!-- Top contributors -->
    <div style="margin-bottom:14px">
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนสูงสุด (Top 5)', 'Top-5 highest-scoring systems')}</div>
      ${c.score.breakdown.slice().filter(b => b.scoring !== false && b.display !== false).sort((a, b) => b.score - a.score).slice(0, 5).map(b => `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#0d0d15;border-radius:6px">
          <span style="font-size:12px;color:#c8b890">${esc(trDF(b.system))}</span>
          <span style="font-size:13px;font-weight:700;color:#c8a45a">${b.score}</span>
        </div>`).join('')}
    </div>

    <!-- Bottom contributors -->
    <div>
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนต่ำสุด (Bottom 3) — ดาบสองคม', 'Bottom-3 lowest-scoring systems — double-edged sword')}</div>
      ${c.score.breakdown.slice().filter(b => b.scoring !== false && b.display !== false).sort((a, b) => a.score - b.score).slice(0, 3).map(b => `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#1a1008;border-radius:6px;border-left:2px solid #6a3010">
          <span style="font-size:12px;color:#a87050">${esc(trDF(b.system))}</span>
          <div style="text-align:right">
            <span style="font-size:13px;font-weight:700;color:#d07040">${b.score}</span>
            <div style="font-size:10px;color:#7a5030">${esc(b.finding.slice(0, 40))}</div>
          </div>
        </div>`).join('')}
      <div style="font-size:10px;color:#5a4030;margin-top:6px">
        ${tr('ⓘ คะแนนต่ำ ≠ แย่ — แสดงว่าระบบนั้นเห็นต่าง หรือพลังงานนั้นไม่ใช่ทิศทางหลักของคุณ', 'ⓘ A low score ≠ bad — it means this system sees something different, or that energy isn\'t your primary direction')}
      </div>
    </div>
  `);
}
// Raw median of the scoring (identity) systems' per-system scores. The old
// code used score.total as "the median" — but post-recalibration (2026-07-01)
// total = the cross-system AGREEMENT score, NOT the median. So the "Median"
// stat and the per-system voting thresholds must compute the real median from
// the breakdown, else they compare against the wrong (agreement) number.
function _scoreMedian(c) {
    const xs = c.score.breakdown.filter(b => b.scoring !== false).map(b => b.score).sort((a, b) => a - b);
    const n = xs.length;
    if (!n)
        return 0;
    return n % 2 ? xs[(n - 1) / 2] : Math.round((xs[n / 2 - 1] + xs[n / 2]) / 2);
}
// ── 16 secondary systems condensed to "at a glance" cards ────────────────
// Was 16 full pages (one per system) — too long / dizzying (Director 2026-07-02).
// Each system's essence = score + one-line personalised finding, both already in
// score.breakdown, so we render them as compact ranked cards across 2 pages.
const _SECONDARY_SYS = [
    { en: 'Thai Taksa (8 Houses)', emoji: '🇹🇭' },
    { en: 'Hellenistic', emoji: '🏛️' },
    { en: 'Zoroastrian', emoji: '🔥' },
    { en: 'Aztec Tonalpohualli', emoji: '🌋' },
    { en: 'Native American', emoji: '🦅' },
    { en: 'Ogham', emoji: '🌳' },
    { en: 'Aboriginal Dreamtime', emoji: '🪃' },
    { en: 'Kabbalistic', emoji: '✡️' },
    { en: 'Zi Wei Dou Shu', emoji: '🟣' },
    { en: 'Arabic Parts', emoji: '☪️' },
    { en: 'Ifa/Yoruba', emoji: '🥁' },
    { en: 'Vedic Mahadasha', emoji: '🪐' },
    { en: 'Saju (Korean)', emoji: '🇰🇷' },
    { en: 'Tibetan Astrology', emoji: '🏔️' },
    { en: 'Norse Rune', emoji: 'ᚱ' },
    { en: 'Onmyōdō', emoji: '⛩️' },
];
function _secondaryCards(c) {
    const bd = c.score.breakdown.filter(b => b.display !== false);
    return _SECONDARY_SYS
        .map(k => {
        const b = bd.find(x => (x.systemEn || '') === k.en);
        if (!b)
            return null;
        return { emoji: k.emoji, name: trDF(b.system), score: b.score, finding: stripHtml(String(b.finding || '')), color: b.color };
    })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
}
function _secondaryGrid(cards) {
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${cards.map(k => `
    <div class="rbox" style="background:#0a0a10;border:1px solid #2a2418;border-radius:8px;padding:9px 11px;margin:0">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px">
        <span style="font-size:12px;color:#d4c090;font-weight:600;line-height:1.3">${k.emoji} ${esc(k.name)}</span>
        <span style="font-size:13px;font-weight:700;color:${k.color || '#c8a45a'};flex-shrink:0">${k.score}</span>
      </div>
      <div style="font-size:10.5px;color:#9a8a72;margin-top:4px;line-height:1.5">${esc(k.finding)}</div>
    </div>`).join('')}</div>`;
}
function p_secondarySystems1(c) {
    const cards = _secondaryCards(c);
    const half = Math.ceil(cards.length / 2);
    return section(0, tr('16 ศาสตร์เพิ่มเติม — มองในหน้าเดียว (1/2)', '16 More Systems — At a Glance (1/2)'), '🌐', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:10px;line-height:1.55">${tr('นอกจากศาสตร์หลัก ยังมีอีก 16 ศาสตร์ที่อ่านดวงคุณจากคนละมุม — นี่คือสิ่งที่แต่ละศาสตร์เห็นแบบย่อ เรียงจากคะแนนสูงสุด (เต็ม 999)', 'Beyond the core systems, 16 more read your chart from their own angle — each one\'s take at a glance, ranked by score (max 999).')}</div>
    ${_secondaryGrid(cards.slice(0, half))}`);
}
function p_secondarySystems2(c) {
    const cards = _secondaryCards(c);
    const half = Math.ceil(cards.length / 2);
    return section(0, tr('16 ศาสตร์เพิ่มเติม — มองในหน้าเดียว (2/2)', '16 More Systems — At a Glance (2/2)'), '🌐', _secondaryGrid(cards.slice(half)));
}
function p02_scoreBreakdown(c) {
    // Group into 🌟 ≥780 / 〰 650-779 / ⚠ <650. Biorhythm carries scoring:false and
    // is a DAILY-changing layer (it would be a frozen, meaningless value in a static
    // report), so it's excluded here entirely — it lives only in the live Daily Pulse.
    const allSorted = c.score.breakdown.slice().filter(b => b.scoring !== false && b.display !== false).sort((a, b) => b.score - a.score);
    const voting = allSorted;
    // The old cuts were the literals 780 and 650, set by hand and never derived.
    // Measured over 40 charts, 780 lands near the 70th percentile of all system
    // scores — so it was a display band pretending to be a finding. Cut on this
    // chart's own median instead: "above your own middle" is a statement a reader
    // can check, and it travels with the chart rather than with a constant.
    const _sorted = voting.map(b => b.score).sort((a, b) => a - b);
    const _median = _sorted.length ? _sorted[Math.floor(_sorted.length / 2)] : 0;
    const _low = _sorted.length ? _sorted[Math.floor(_sorted.length * 0.25)] : 0;
    const stars = voting.filter(b => b.score >= _median);
    const mids = voting.filter(b => b.score >= _low && b.score < _median);
    const warns = voting.filter(b => b.score < 650);
    const systemRow = (b, icon) => `
    <div style="display:flex;align-items:center;gap:8px;margin:3px 0;padding:5px 8px;background:#0a0a10;border-radius:6px">
      <span style="min-width:20px;text-align:center">${icon}</span>
      <span style="flex:1;font-size:12px;color:#c8b890">${esc(trDF(b.system))}</span>
      <span style="font-size:12px;font-weight:600;color:#c8a45a;min-width:34px;text-align:right">${b.score}</span>
      <div style="width:80px;background:#0d0d15;border-radius:3px;height:6px;overflow:hidden">
        <div style="width:${Math.round((b.score - 400) / 6)}%;height:6px;background:${b.color}"></div>
      </div>
    </div>`;
    return section(3, tr('คะแนนรายศาสตร์ — ใครให้เท่าไหร่', 'Score by tradition — who scored what'), '🌐', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px;line-height:1.6">
      ${tr('Cosmic Score = อันดับเปอร์เซ็นไทล์ของมัธยฐาน 26 ศาสตร์ (สเกลเต็ม 1,000 · คนละสเกลกับคะแนนดิบด้านล่าง)', 'Cosmic Score = the percentile rank of your 26-system median (scale out of 1,000, NOT the raw scores below)')} = <strong style="color:#c8a45a">${c.score.total}</strong>
      · ${tr('ความสอดคล้อง', 'Consensus')} = ${c.score.agreement} · ${tr('มัธยฐานดิบ', 'Raw median')} = ${_scoreMedian(c)} · Mean = ${c.score.mean} · Modal = ${c.score.modalBin}–${c.score.modalBin + 49}
    </div>

    <!-- Stars -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#4aaa4a;margin-bottom:6px">
        🌟 ${tr('ให้คะแนนสูง', 'Scored high')} — ${stars.length} ${tr(`ศาสตร์ (สูงกว่ามัธยฐานของคุณ ${_median})`, `traditions (above your median, ${_median})`)}
      </div>
      ${stars.map(b => systemRow(b, '🌟')).join('')}
    </div>

    <!-- Mids -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#aaaa4a;margin-bottom:6px">
        〰 ${tr('กลางๆ', 'Mixed')} — ${mids.length} ${tr('ระบบ (650–779)', 'systems (650–779)')}
      </div>
      ${mids.map(b => systemRow(b, '〰')).join('')}
    </div>

    <!-- Warns -->
    ${warns.length > 0 ? `
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#c8a45a;margin-bottom:6px">
        ⚠ ${tr('เสียงเตือน', 'Caution signals')} — ${warns.length} ${tr('ระบบ (ต่ำกว่า 650)', 'systems (below 650)')}
      </div>
      ${warns.map(b => systemRow(b, '⚠')).join('')}
      <div style="font-size:10px;color:#9a8a72;margin-top:6px">
        ${tr('ⓘ เสียงเตือน = ระบบนี้มองเห็นความท้าทาย หรือพลังงานนั้นไม่ใช่ทิศหลักของคุณ ไม่ได้แปลว่า "แย่"', 'ⓘ A caution signal = this system sees a challenge, or that energy isn\'t your primary direction. It doesn\'t mean "bad".')}
      </div>
    </div>` : ''}

    <!-- Stats summary — voting set only (Biorhythm lives in the live Daily Pulse,
         not in this static report) -->
    <div style="background:#0d0d15;border-radius:8px;padding:12px;margin-top:12px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[
        ['Median', _scoreMedian(c), '#c8a45a'],
        ['Mean', c.score.mean, '#b09040'],
        [tr('ต่ำสุด', 'Lowest'), Math.min(...voting.map(b => b.score)), '#c07050'],
        [tr('สูงสุด', 'Highest'), Math.max(...voting.map(b => b.score)), '#70c070'],
    ].map(([l, v, col]) => `<div><div style="font-size:18px;font-weight:700;color:${col}">${v}</div><div style="font-size:10px;color:#6a5a42">${l}</div></div>`).join('')}
      </div>
    </div>
  `);
}
// ── ฉันทามติ: what the traditions actually agree on ─────────────────────────
//
// The old consensus pages counted SCORES: "12/26 systems confirm". A score is
// not an agreement — two traditions can both score 800 while saying unrelated
// things, and the reader was never told what the 12 agreed about.
//
// This page counts CLAIMS, on axes where several traditions genuinely answer
// the same question, and every vote names the value it came from.
//
// It also stops double-counting. Four pairs in the 26 are the same computation
// under two names — verified over 250 random charts, each pair matched on every
// one:
//   BaZi ↔ Saju            (甲辰 = 갑(甲)진(辰) — the same day pillar)
//   Nine Star Ki ↔ Tibetan (Mewa n is Lo Shu star n)
//   ไทยพราหมณ์ ↔ ทักษา      (both are the weekday)
//   มายัน ↔ Aztec           (one 260-day round, two sets of names)
// So 26 readings rest on 22 independent computations, and an axis counts the
// LINEAGE once. Saying "6 of 7 agree" when two of the seven are the same
// calculation twice is the thing that made the old consensus unbelievable.
function p_consensusAxes(c) {
    const { bazi, ninestar, numerology, humandesign, vedicMahadasha, celtic, ogham, norseRune, hellenistic } = c;
    const bar = (n, of, colour) => `<span style="display:inline-block;width:${Math.round(n / Math.max(1, of) * 100)}%;height:8px;background:${colour};border-radius:4px"></span>`;
    const axisBox = (icon, title, question, votes, verdict, reading) => {
        const groups = {};
        votes.forEach(v => { (groups[v.says] = groups[v.says] || []).push(v); });
        const ranked = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
        const top = ranked[0];
        return `
    <div style="background:linear-gradient(135deg,#0f0d0a,#0d0d15);border:1px solid #4a4028;border-radius:12px;padding:14px 16px;margin:12px 0">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:2px">
        <span style="font-size:17px">${icon}</span>
        <span style="font-size:13.5px;font-weight:700;color:#aac8ff">${esc(title)}</span>
      </div>
      <div style="font-size:10.5px;color:#6a7a90;margin-bottom:3px">${esc(question)}</div>
      <div style="font-size:10px;color:#5a6a80;margin-bottom:10px">${tr(`มี ${votes.length} ศาสตร์ที่คำนวณเรื่องนี้ได้ อีก ${26 - votes.length} ศาสตร์ไม่มีวิธีคำนวณ เราจึงไม่นับ`, `${votes.length} traditions can compute this one. The other ${26 - votes.length} have no method for it, so they are not counted.`)}</div>
      ${ranked.map(([answer, vs]) => `
        <div style="margin:7px 0">
          <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12px">
            <span style="color:${answer === top[0] ? '#e8c87a' : '#9a8a72'};font-weight:${answer === top[0] ? 700 : 400}">${esc(answer)}</span>
            <span style="color:#6a7a90;font-size:11px">${vs.length}/${votes.length} ${tr('สาย', 'lineages')}</span>
          </div>
          <div style="margin:3px 0">${bar(vs.length, votes.length, answer === top[0] ? '#c8a45a' : '#4a4028')}</div>
          <div style="font-size:10px;color:#6a7a90;line-height:1.6">${vs.map(v => `<strong style="color:#8aa8c8">${esc(v.lineage)}</strong> ${esc(v.evidence)}`).join(' · ')}</div>
        </div>`).join('')}
      <div style="margin-top:10px;padding-top:9px;border-top:1px solid #2a3a5a">
        <div style="font-size:11px;color:#c8a45a;font-weight:600;margin-bottom:3px">${esc(verdict)}</div>
        <div style="font-size:11.5px;color:#c8c0a8;line-height:1.8">${reading}</div>
      </div>
    </div>`;
    };
    // ── Axis 1 · which element ────────────────────────────────────────────────
    const elVotes = [
        { lineage: tr('จีน 干支 (BaZi/Saju)', 'Chinese 干支 (BaZi/Saju)'), says: bazi.dayMasterElement, evidence: `${bazi.dayStem}${bazi.dayBranch}` },
        { lineage: tr('Lo Shu 9 ดาว (NSK/ทิเบต)', 'Lo Shu nine stars (NSK/Tibetan)'), says: ninestar.starElement, evidence: `${tr('ดาว', 'star')} ${ninestar.star}` },
        { lineage: tr('เซลติก', 'Celtic'), says: celtic.element, evidence: String(celtic.treeNameTh || celtic.treeName) },
        { lineage: 'Ogham', says: ogham.element, evidence: String(ogham.treeNameTh || ogham.treeName) },
        { lineage: tr('นอร์ส', 'Norse'), says: norseRune.runeElement, evidence: String(norseRune.runeName) },
    ].filter(v => v.says);
    const elTally = {};
    elVotes.forEach(v => { elTally[v.says] = (elTally[v.says] || 0) + 1; });
    const elTop = Object.entries(elTally).sort((a, b) => b[1] - a[1])[0];
    const elSplit = Object.keys(elTally).length;
    // When the lineages split we still hand down a call. A reader who paid for
    // this does not want "no single answer" as the first thing on the page —
    // the director's note on 2026-08-31 was "ผิดก็ต้องกล้าผิด ไม่ตรงก็ต้องกล้าไม่ตรง".
    // What keeps that honest is naming the lineage the call rests on and showing
    // the dissent underneath, rather than manufacturing a consensus that is not
    // there (which the 08-23 ruling forbids outright).
    const elCall = elTop[1] >= 3 ? elTop[0] : bazi.dayMasterElement;
    const elClear = elTop[1] >= 3;
    const elReading = elTop[1] >= 3
        ? tr(`สามสายขึ้นไปที่ไม่เคยรู้จักกันชี้ธาตุ<strong>${esc(elTop[0])}</strong>ตรงกัน — เวลาศาสตร์ที่พัฒนาคนละทวีปมาลงที่คำตอบเดียว มันมักเป็นด้านที่คนรอบตัวคุณเห็นก่อนคุณเห็นเอง ใช้ธาตุนี้เป็นตัวตั้งเวลาเลือกงาน เลือกที่อยู่ และเลือกจังหวะพัก`, `Three or more unrelated lineages land on <strong>${esc(elTop[0])}</strong>. When traditions built on different continents converge, the trait is usually the one other people notice about you before you do. Use it as the default when choosing work, choosing where to live, and choosing when to rest.`)
        : tr(`<strong>เราตอบว่าธาตุ${esc(elCall)}</strong> · ${elVotes.length} ศาสตร์ตอบมา ${elSplit} แบบ ไม่มีคำตอบไหนได้เสียงข้างมาก เราจึงยึด BaZi เพราะเป็นศาสตร์เดียวในกลุ่มนี้ที่อ่านละเอียดถึง<strong>ชั่วโมงเกิด</strong> ส่วนที่เหลืออ่านแค่ระดับวันหรือเดือน · ข้อนี้เราอาจผิดได้`, `<strong>We are calling it ${esc(elCall)}.</strong> ${elVotes.length} lineages returned ${elSplit} different answers, so there is no real majority and we are not inventing one. The call rests on BaZi because it is the only one of these lineages that reads down to the <strong>hour</strong> of birth; the dissenting ones read the day or the month, one step coarser. If this does not describe you, then we are wrong here — not you.`);
    // ── Axis 2 · start, or wait to be started ────────────────────────────────
    // A Manifesting Generator responds and then informs; informing is courtesy
    // after the sacral response, not licence to initiate. Only a Manifestor
    // initiates. The old test matched "Manifesting" too, which put every MG on
    // the wrong side of this axis.
    const hdInitiates = /Manifestor/.test(humandesign.type) && !/Manifesting/.test(humandesign.type);
    const py = numerology.personalYear2026;
    const dashaPush = ['Sun', 'Mars', 'Jupiter', 'Rahu'].includes(String(vedicMahadasha.currentDashaKey));
    const START = tr('เริ่มเองได้', 'initiate'), WAIT = tr('รอสัญญาณก่อน', 'wait for the signal');
    const tempoVotes = [
        { lineage: 'Human Design', says: hdInitiates ? START : WAIT, evidence: `${humandesign.type} · ${humandesign.strategy}` },
        { lineage: tr('เลขศาสตร์', 'Numerology'), says: [1, 3, 5, 8].includes(py) ? START : WAIT, evidence: `Personal Year ${py}` },
        { lineage: 'Vedic Dasha', says: dashaPush ? START : WAIT, evidence: String(vedicMahadasha.currentDasha) },
        { lineage: tr('Lo Shu 9 ดาว', 'Lo Shu nine stars'), says: [1, 3, 4, 9].includes(ninestar.star) ? START : WAIT, evidence: `${tr('ดาว', 'star')} ${ninestar.star}` },
    ];
    const startN = tempoVotes.filter(v => v.says === START).length;
    // With an even number of voters this can tie. Human Design is the one
    // lineage whose doctrine is squarely about this question, so it breaks it —
    // and the page says that out loud rather than presenting a coin-flip as a
    // finding.
    const tempoTied = startN * 2 === tempoVotes.length;
    const tempoCall = tempoTied ? (hdInitiates ? START : WAIT) : (startN * 2 > tempoVotes.length ? START : WAIT);
    const tempoN = tempoCall === START ? startN : tempoVotes.length - startN;
    const tempoReading = startN >= 4
        ? tr(`เกือบทุกสายบอกตรงกันว่าคุณเป็นฝ่ายเปิดเกม — <strong>อย่ารอให้ใครอนุญาต</strong> ถ้าคุณรอ คนอื่นจะเดินไปก่อน แล้วคุณจะได้บทที่ไม่ใช่ของคุณ`, `Nearly every lineage says you are the one who opens the game — <strong>do not wait for permission</strong>. When you wait, someone else moves first and you end up playing a part that was never yours.`)
        : startN <= 1
            ? tr(`เกือบทุกสายบอกตรงกันว่าจังหวะของคุณคือ<strong>รอสัญญาณก่อนแล้วค่อยลงแรง</strong> — ไม่ใช่ความขี้เกียจ แต่คือกลไก ถ้าเริ่มเองตลอด คุณจะเจอแรงต้านที่คนอื่นไม่เจอ แล้วเหนื่อยกว่าที่ควร`, `Nearly every lineage says your timing runs on <strong>waiting for the signal, then committing hard</strong>. That is mechanics, not laziness. Initiate everything yourself and you will meet resistance other people never meet, and tire faster than the work deserves.`)
            : (hdInitiates === (tempoCall === START)
                ? tr(`เสียงออกมา ${startN} ต่อ ${tempoVotes.length - startN} — เฉียด แต่<strong>เราตัดสินว่า "${tempoCall}"</strong> ตามเสียงข้างมาก และ Human Design ซึ่งเป็นสายที่มีวิชาว่าด้วยเรื่องนี้โดยตรง (${esc(humandesign.type)} · ${esc(humandesign.strategy)}) ก็อยู่ข้างเดียวกัน · ${tempoVotes.length - startN} สายที่ค้านอยู่ข้างล่าง ถ้าคุณรู้ตัวว่าเป็นอีกแบบ เชื่อตัวเอง แล้วรายงานฉบับนี้ผิดข้อนี้`, `It came out ${startN} to ${tempoVotes.length - startN} — narrow, but <strong>we are calling it "${tempoCall}"</strong> on the majority, and Human Design — the lineage whose doctrine is about exactly this question (${esc(humandesign.type)} · ${esc(humandesign.strategy)}) — is on the same side. The ${tempoVotes.length - startN} dissenters are listed below. If you know you are the other kind, trust that: this report is wrong on this axis.`)
                : tr(`เสียงออกมา ${startN} ต่อ ${tempoVotes.length - startN} — เฉียด <strong>เราตัดสินว่า "${tempoCall}"</strong> ตามเสียงข้างมากล้วนๆ และต้องบอกให้ชัดว่า <strong>Human Design ค้านข้อนี้</strong> (${esc(humandesign.type)} · ${esc(humandesign.strategy)}) ทั้งที่เป็นสายที่มีวิชาว่าด้วยเรื่องนี้ตรงที่สุด · <strong>นี่คือข้อที่เรามีโอกาสผิดสูงที่สุดในหน้านี้</strong> ถ้าคุณรู้ตัวว่าเป็นแบบที่ HD ว่า ให้เชื่อตัวเอง`, `It came out ${startN} to ${tempoVotes.length - startN} — narrow. <strong>We call it "${tempoCall}"</strong> on the raw majority, and it must be said plainly that <strong>Human Design disagrees</strong> (${esc(humandesign.type)} · ${esc(humandesign.strategy)}) — the one lineage whose doctrine is squarely about this question. <strong>This is the call on this page most likely to be wrong.</strong> If you recognise yourself in what HD says, trust that instead.`));
    // ── Axis 3 · what 2026 is for ────────────────────────────────────────────
    const nsk2026 = 1; // 2026 is a 一白水星 year
    const AMP = tr('ปีขยายผล', 'a year that amplifies'), CONSOL = tr('ปีตั้งหลัก', 'a year to consolidate');
    const yearVotes = [
        { lineage: 'BaZi', says: bazi.benMingNian2026 ? AMP : CONSOL, evidence: bazi.benMingNian2026 ? tr('เบิ่นมิ่งเหนียน (ปีชง)', 'Ben Ming Nian') : tr('ไม่ใช่ปีชง', 'not your year branch') },
        { lineage: tr('Lo Shu 9 ดาว', 'Lo Shu nine stars'), says: ninestar.star === nsk2026 ? AMP : CONSOL, evidence: ninestar.star === nsk2026 ? 'Honmei-sei Kaiki' : `${tr('ดาว', 'star')} ${ninestar.star} ≠ ${nsk2026}` },
        { lineage: tr('เลขศาสตร์', 'Numerology'), says: [1, 3, 5, 8, 9].includes(py) ? AMP : CONSOL, evidence: `Personal Year ${py}` },
        { lineage: 'Vedic Dasha', says: dashaPush ? AMP : CONSOL, evidence: `${vedicMahadasha.currentDasha} ${tr('ถึง', 'to')} ${vedicMahadasha.currentDashaEnd ?? ''}` },
    ];
    const ampN = yearVotes.filter(v => v.says === AMP).length;
    // A 2–2 tie used to print "a year of two unlike halves", which is what a
    // horoscope says when it does not want to be checked. Nine Star Ki breaks it:
    // of the four, its doctrine is the one built as an annual cycle.
    const nskAmp = ninestar.star === nsk2026;
    const yearCall = ampN >= 3 ? AMP : ampN <= 1 ? CONSOL : (nskAmp ? AMP : CONSOL);
    const yearReading = ampN >= 3
        ? tr(`${ampN} จาก ${yearVotes.length} สายบอกว่า 2026 เป็นปีที่<strong>ทุกอย่างถูกคูณ</strong> ทั้งที่ทำถูกและที่ทำพลาด ปีแบบนี้ไม่ควรทดลองของใหม่ที่ยังไม่มั่นใจ แต่ควรทุ่มกับสิ่งที่พิสูจน์แล้วว่าได้ผล`, `${ampN} of ${yearVotes.length} lineages read 2026 as a year that <strong>multiplies whatever you put in</strong> — the good moves and the bad ones alike. Not the year for experiments you are unsure of; the year to pour everything into what has already proven itself.`)
        : ampN <= 1
            ? tr(`มีแค่ ${ampN} สายที่เห็น 2026 เป็นปีเร่ง ที่เหลือบอกว่านี่คือ<strong>ปีตั้งหลัก</strong> — ปีแบบนี้ที่คนมักพลาดคือไปเร่งตามคนอื่นแล้วหมดแรงตอนที่รอบของตัวเองมาถึงจริงๆ`, `Only ${ampN} lineage reads 2026 as an accelerating year; the rest call it <strong>a year to consolidate</strong>. The usual mistake in a year like this is sprinting because everyone else is, and having nothing left when your own window actually opens.`)
            : tr(`เสมอ 2 ต่อ 2 — เราไม่ปล่อยให้จบแบบ "แล้วแต่ครึ่งปี" <strong>เราตัดสินว่า 2026 คือ${yearCall}สำหรับคุณ</strong> โดยยึด Lo Shu 9 ดาว เพราะในสี่สายนี้ มีสายเดียวที่วิชาของมันถูกสร้างมาเป็น<strong>รอบปี</strong>โดยตรง (${nskAmp ? 'ปีนี้ดาวประจำตัวกลับเข้าเรือนกลาง' : `ดาว ${ninestar.star} ยังไม่ถึงรอบกลับเรือน`}) · อีกสองสายค้าน และถ้าปลายปีมันออกมาตรงข้าม เราจดไว้ตรงนี้แล้วว่าเราตัดสินไปทางไหน`, `Dead even, 2 to 2 — and we are not ending it on "it depends which half". <strong>We are calling 2026 ${yearCall} for you</strong>, on Lo Shu nine-star grounds: of the four, it is the only lineage whose doctrine is built as an annual cycle (${nskAmp ? 'this is the year your natal star returns to the centre' : `star ${ninestar.star} has not yet come back round`}). Two lineages disagree. If the year ends up the other way, this page is on the record for which way we called it.`);
    const disagreements = [
        elTop[1] < 3 ? tr('ธาตุพื้นฐาน', 'your base element') : '',
        (startN > 1 && startN < 4) ? tr('จังหวะเริ่ม-รอ', 'initiate vs wait') : '',
        (ampN === 2) ? tr('ทิศทางปี 2026', 'what 2026 is for') : '',
    ].filter(Boolean);
    return section(0, tr('ฉันทามติ — 26 ศาสตร์ตกลงกันว่าอะไร', 'The Consensus — what 26 traditions agree on'), '🤝', `
    <!-- The verdict, before the arithmetic that produced it. Director 2026-08-31:
         "ตอนนี้อ่านก็ไม่รู้จักตัวเองมากขึ้น" — the page opened on how we count
         votes, so the first thing a paying reader met was our bookkeeping
         rather than a claim about them. The count is still on the page; it is
         now the footnote it always should have been. -->
    <div style="background:linear-gradient(135deg,#12100a,#0d0d15);border:1px solid #6a5a32;border-radius:12px;padding:15px 17px;margin-bottom:15px">
      <div style="font-size:10.5px;color:#c08ad8;letter-spacing:2px;margin-bottom:9px">${tr('คำตัดสิน 3 ข้อ', 'THE CALL, IN THREE LINES')}</div>
      ${[
        [tr('คุณวิ่งด้วยธาตุ', 'You run on'), esc(elCall), elClear
                ? tr(`${elTop[1]}/${elVotes.length} สายตรงกัน`, `${elTop[1]}/${elVotes.length} lineages agree`)
                : tr(`สายแตก — เรายึด BaZi`, `lineages split — we take BaZi`)],
        [tr('จังหวะของคุณคือ', 'Your timing is'), esc(tempoCall), tr(`${tempoN}/${tempoVotes.length} สาย`, `${tempoN}/${tempoVotes.length} lineages`)],
        [tr('ปี 2026 สำหรับคุณคือ', '2026, for you, is'), esc(yearCall), ampN >= 3 || ampN <= 1
                ? tr(`${Math.max(ampN, yearVotes.length - ampN)}/${yearVotes.length} สาย`, `${Math.max(ampN, yearVotes.length - ampN)}/${yearVotes.length} lineages`)
                : tr('เสมอ — เรายึด Lo Shu 9 ดาว', 'tied — we take Lo Shu')],
    ].map(([label, value, note]) => `
        <div style="display:flex;align-items:baseline;gap:9px;padding:6px 0;border-bottom:1px solid #2a2038">
          <span style="font-size:11px;color:#9a8ab0;min-width:96px">${label}</span>
          <strong style="font-size:15px;color:#e8c87a">${value}</strong>
          <span style="font-size:10px;color:#7a6a90;margin-left:auto">${note}</span>
        </div>`).join('')}
      <div style="font-size:11px;color:#c0a8d0;line-height:1.8;margin-top:10px">${tr('เราฟันธงให้เลยสามข้อ · <strong>ข้อไหนอ่านแล้วรู้สึกว่าไม่ใช่คุณ ให้ถือว่าเราผิดข้อนั้น</strong> · ข้างล่างคือคำตอบของแต่ละศาสตร์ รวมถึงศาสตร์ที่เห็นตรงข้ามกับเรา', 'These are our calls, not the safest thing we could have said. <strong>If one of them does not describe you, we are wrong on that line</strong> — not you. Below is what each lineage actually said, dissenters included.')}
      </div>
    </div>

    ${axisBox('✦', tr('ธาตุพื้นฐานของคุณ', 'Your base element'), tr('ถามว่า: พลังงานตั้งต้นของคนนี้เป็นธาตุอะไร — ศาสตร์ที่ตอบคำถามนี้ได้มี 5 สาย', 'Asked: what element does this person run on? Five lineages answer it.'), elVotes, elTop[1] >= 3
        ? tr(`คำตัดสิน: ธาตุ${elTop[0]} (${elTop[1]}/${elVotes.length} สาย)`, `Our call: ${elTop[0]} (${elTop[1]}/${elVotes.length} lineages)`)
        : tr(`คำตัดสิน: ธาตุ${esc(elCall)} — ยึด BaZi (สายที่นำได้แค่ ${elTop[1]}/${elVotes.length} ไม่ถึงเสียงข้างมาก)`, `Our call: ${esc(elCall)} — on BaZi (the leading element holds only ${elTop[1]}/${elVotes.length}, short of a majority)`), elReading)}

    ${axisBox('✦', tr('คุณเปิดเกมเอง หรือรอให้เกมเปิด', 'Do you open the game, or wait for it to open'), tr(`ถามว่า: คนนี้ได้ผลดีกว่าเมื่อเริ่มเอง หรือเมื่อรอสัญญาณ — ${tempoVotes.length} ศาสตร์ตอบคำถามนี้`, `Asked: does this person do better initiating, or waiting for a signal? ${tempoVotes.length} traditions answer.`), tempoVotes, tr(`คำตัดสิน: "${tempoCall}" (${tempoN}/${tempoVotes.length} สาย)`, `Our call: "${tempoCall}" (${tempoN}/${tempoVotes.length} lineages)`), tempoReading)}

    ${axisBox('✦', tr('ปี 2026 เป็นปีแบบไหนสำหรับคุณ', 'What kind of year 2026 is for you'), tr('ถามว่า: ปีนี้ควรเร่งหรือควรตั้งหลัก — 4 สายที่มีระบบเวลาของตัวเองตอบได้', 'Asked: push this year, or consolidate? Four lineages carry their own clock.'), yearVotes, tr(`คำตัดสิน: ${yearCall} (${Math.max(ampN, yearVotes.length - ampN)}/${yearVotes.length} สาย${ampN === 2 ? ' · เสมอ เรายึด Lo Shu' : ''})`, `Our call: ${yearCall} (${Math.max(ampN, yearVotes.length - ampN)}/${yearVotes.length} lineages${ampN === 2 ? ' · tied, broken on Lo Shu' : ''})`), yearReading)}

    ${(() => {
        // Mandatory axis: how the coming year lands on each area of life. Same
        // engine pass, aggregated across the next 12 months, so this block and
        // the month grid can never disagree about the year.
        const fcY = (0, calc_1.calcForecast)(c, new Date(), { weeks: 0, months: 12 });
        const doms = calc_1.FORECAST_DOMAINS_ALL;
        const good = (k) => fcY.months.filter(m => m.domains[k].score >= 4).length;
        const hard = (k) => fcY.months.filter(m => m.domains[k].score <= 2).length;
        const ranked = doms.map(k => ({ k, g: good(k), h: hard(k) }))
            .sort((x, y) => (y.g - y.h) - (x.g - x.h));
        const spread = ranked.map(r => r.g - r.h);
        const band = (g, h) => {
            const d = g - h;
            const rank = spread.filter(x => x > d).length; // 0 = best
            return rank < 2 ? { t: tr('ปีนี้หนุนมากที่สุด', 'most supported this year'), c: '#6fb650' }
                : rank >= spread.length - 2 ? { t: tr('ต้องออกแรงมากที่สุด', 'costs the most effort'), c: '#c06060' }
                    : { t: tr('กลางๆ', 'middling'), c: '#8a8a72' };
        };
        return `
      <div style="background:linear-gradient(135deg,#0f0d0a,#0d0d15);border:1px solid #4a4028;border-radius:12px;padding:14px 16px;margin-top:14px">
        <div style="font-size:10.5px;letter-spacing:2px;color:#7ac8a0;margin-bottom:4px">${tr('ปีข้างหน้า ลงกับชีวิตด้านไหน', 'THE YEAR AHEAD, BY AREA OF LIFE')}</div>
        <div style="font-size:10.5px;color:#6a8a7a;margin-bottom:9px">${tr(`${fcY.votingCount} จาก 26 ศาสตร์มีวิชาทำนายช่วงเวลา จึงออกเสียงได้ · อีก ${fcY.abstainCount} งดออกเสียง · นับจาก 12 เดือนข้างหน้าว่าด้านนั้นได้ 4-5 กี่เดือน และได้ 1-2 กี่เดือน`, `${fcY.votingCount} of 26 traditions carry a timing technique and can vote; ${fcY.abstainCount} abstain. Counted over the next 12 months: how many months that area scores 4-5, and how many 1-2. Not an average — averaging flattens every area to the same number.`)}</div>
        ${ranked.map(r => {
            const b = band(r.g, r.h);
            return `<div style="display:flex;align-items:baseline;gap:8px;padding:4px 0;border-bottom:1px solid #1e2a24;font-size:11.5px">
            <span style="min-width:88px;color:#c8c0a8">${calc_1.FORECAST_DOMAIN_LABELS[r.k].icon} ${tr(calc_1.FORECAST_DOMAIN_LABELS[r.k].th, calc_1.FORECAST_DOMAIN_LABELS[r.k].en)}</span>
            <span style="color:#6fb650">${r.g}</span><span style="color:#5a6a5a;font-size:10px">${tr('เดือนหนุน', 'good')}</span>
            <span style="color:#c06060">${r.h}</span><span style="color:#5a6a5a;font-size:10px">${tr('เดือนหนัก', 'hard')}</span>
            <span style="margin-left:auto;color:${b.c}">${b.t}</span>
          </div>`;
        }).join('')}
        <div style="font-size:11px;color:#9ac8b0;line-height:1.75;margin-top:9px">${tr(`ด้านที่ปีนี้หนุนคุณมากที่สุดคือ<strong>${tr(calc_1.FORECAST_DOMAIN_LABELS[ranked[0].k].th, calc_1.FORECAST_DOMAIN_LABELS[ranked[0].k].en)}</strong> · ด้านที่ต้องออกแรงมากที่สุดคือ<strong>${tr(calc_1.FORECAST_DOMAIN_LABELS[ranked[ranked.length - 1].k].th, calc_1.FORECAST_DOMAIN_LABELS[ranked[ranked.length - 1].k].en)}</strong> — ดูว่าเดือนไหนที่หน้าถัดไป`, `The area the year backs most is <strong>${tr(calc_1.FORECAST_DOMAIN_LABELS[ranked[0].k].th, calc_1.FORECAST_DOMAIN_LABELS[ranked[0].k].en)}</strong>; the one that will cost you most is <strong>${tr(calc_1.FORECAST_DOMAIN_LABELS[ranked[ranked.length - 1].k].th, calc_1.FORECAST_DOMAIN_LABELS[ranked[ranked.length - 1].k].en)}</strong>. Which months, on the next page.`)}</div>
      </div>`;
    })()}

    <div style="background:linear-gradient(135deg,#14100a,#0d0d15);border:1px solid #6a5a32;border-radius:12px;padding:13px 16px;margin-top:14px">
      <div style="font-size:11px;color:#c08ad8;letter-spacing:2px;margin-bottom:5px">${tr('🔍 ตรงที่ศาสตร์เห็นไม่ตรงกัน', '🔍 WHERE THEY DISAGREE')}</div>
      <div style="font-size:11.5px;color:#d0a8e0;line-height:1.85">${disagreements.length
        ? tr(`<strong>${disagreements.join(' · ')}</strong> คือข้อที่ศาสตร์เห็นไม่ตรงกัน เราเลือกคำตอบให้แล้ว · <strong>สองข้อนี้เรามีโอกาสผิดสูงสุด</strong> · เราตอบเพราะคำว่า "แล้วแต่สถานการณ์" ถูกเสมอและใช้อะไรไม่ได้ · เก็บหน้านี้ไว้ อีกหกเดือนกลับมาดูว่าเราถูกกี่ข้อ`, `We have made all three calls above — but be clear that <strong>${disagreements.join(' · ')}</strong> were decided on a non-unanimous vote. <strong>These are where we are most likely to be wrong.</strong> We chose to answer rather than retreat to "it depends on the situation", because that answer is always right and never useful. Keep this page. Come back in six months and count how many we got right.`)
        : tr('ทั้งสามแกนไม่มีสายไหนขัดกันเลย ซึ่งพบไม่บ่อย — ดวงที่พูดเสียงเดียวแบบนี้ตัดสินใจง่ายกว่าคนทั่วไป แต่ก็มีจุดบอดที่ไม่มีใครคอยเตือน', 'No lineage contradicts another on any of the three axes, which is uncommon. A chart that speaks with one voice is easier to act on — and has a blind spot with nobody positioned to flag it.')}</div>
    </div>
    <!-- The arithmetic, kept but demoted: it backs the calls above, it does not open the page. -->
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:10px;padding:12px 15px;margin-top:14px">
      <div style="font-size:12px;color:#c8a45a;font-weight:600;margin-bottom:6px">${tr('นับให้ตรงก่อน', 'The count, honestly')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.85">${tr('รายงานนี้อ่านดวงคุณด้วย <strong>26 ศาสตร์</strong> — แต่ในนั้นมี <strong>4 คู่ที่เป็นการคำนวณเดียวกัน</strong> คนละภาษา เราตรวจแล้วกับดวงสุ่ม 250 ดวง ตรงกันทุกดวงไม่มีข้อยกเว้น จำนวน "เสียงอิสระ" จริงจึงเป็น <strong>22</strong> ไม่ใช่ 26 · หน้านี้จึงนับ<strong>สายละหนึ่งเสียง</strong> ไม่นับซ้ำ', 'This report reads your chart with <strong>26 systems</strong> — but four pairs among them are <strong>the same calculation under two names</strong>. We checked across 250 random charts and every pair matched on every one. The number of independent voices is <strong>22</strong>, not 26, so this page counts <strong>one vote per lineage</strong>.')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:6px;margin-top:9px;font-size:10.5px;color:#9a8a72">
        ${[[tr('BaZi = Saju', 'BaZi = Saju'), `${bazi.dayStem}${bazi.dayBranch} = ${esc(String(c.saju.dayPillar || ''))}`],
        [tr('Nine Star Ki = ทิเบต', 'Nine Star Ki = Tibetan'), `${tr('ดาว', 'star')} ${ninestar.star} = Mewa ${c.tibetan.mewa}`],
        [tr('ไทยพราหมณ์ = ทักษา', 'Thai Brahmin = Taksa'), tr(`ทั้งคู่คือ${esc(String(c.thai.dayName))}`, `both are the same weekday`)],
        [tr('มายัน = Aztec', 'Mayan = Aztec'), tr(`รอบ 260 วันเดียวกัน (Kin ${c.mayan.kin})`, `one 260-day round (Kin ${c.mayan.kin})`)],].map(([a, b]) => `<div style="background:#12101c;border-radius:6px;padding:6px 9px"><strong style="color:#c8b890">${a}</strong><br><span style="color:#7a6a52">${b}</span></div>`).join('')}
      </div>
    </div>

  `);
}
function p03_convergence(c) {
    // The 26 identity systems only — Biorhythm carries scoring:false (daily
    // layer, 2026-06-10) so it must not vote in any convergence theme,
    // family bar, or dissent box. Taksa IS in this set.
    const all26 = c.score.breakdown.filter(b => b.scoring !== false);
    // Voting threshold = the REAL median of the per-system scores (computed from
    // the breakdown, NOT score.total — total is a percentile-normalised level, not
    // the raw median, so it's the wrong threshold for per-system voting).
    const medianScore = _scoreMedian(c);
    const hi = (s) => s >= medianScore; // "votes yes" if at or above median
    // Helper: get system score by name fragment. Matches the localized `system`
    // OR the canonical `systemEn`, so English-keyed fragments (e.g. 'Celtic',
    // 'Western', 'Energy') resolve in BOTH languages. Before 2026-06-10 EN reports
    // returned 0 for systems looked up by a Thai-only fragment, rendering "· 0"
    // on convergence chips. (audit P3)
    const sc = (nameFragment) => all26.find(b => b.system.includes(nameFragment) || (b.systemEn || '').includes(nameFragment))?.score ?? 0;
    const { score, bazi, western, ninestar, numerology, vedic, humandesign, mayan, celtic, thai, saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts, kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, vedicMahadasha } = c;
    const dmEl = bazi.dayMasterElement;
    const themes = [];
    // ─── 1. Element Resonance (ธาตุ Day Master แผ่ซึมทุกศาสตร์) ─────────────
    // Vote: system score ≥ median + element/energy aligns with DM
    const ELEM_EL_MAP = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water', 'ลม': 'Wood', 'Air': 'Wood' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const dmElEn = ELEM_EL_MAP[dmEl] ?? 'Fire';
    const elVotes = [];
    // BaZi — always votes for its own DM
    elVotes.push({ system: 'BaZi Day Master', score: sc('BaZi') });
    // Systems that directly echo the same element
    if (ninestar.starElement === dmEl)
        elVotes.push({ system: 'Nine Star Ki (' + ninestar.starName + ')', score: sc('Nine Star') });
    if (saju.sajuElement === dmEl)
        elVotes.push({ system: 'Saju Korean', score: sc('Saju') });
    if (norseRune.runeElement === dmEl)
        elVotes.push({ system: 'Norse Rune ' + norseRune.rune + ' ' + norseRune.runeName, score: sc('Norse') });
    if (ogham.element === dmEl)
        elVotes.push({ system: 'Ogham ' + ogham.ogham + ' ' + ogham.treeName, score: sc('Ogham') });
    // Systems that produce dmEl's element OR compatible element
    if (celtic.element === dmEl || SHENG[ELEM_EL_MAP[celtic.element] ?? ''] === dmElEn)
        elVotes.push({ system: 'Celtic ' + celtic.treeNameTh + ' (' + celtic.element + ')', score: sc('Celtic') });
    if (tibetan.mewaElement === dmEl || SHENG[ELEM_EL_MAP[tibetan.mewaElement] ?? ''] === dmElEn)
        elVotes.push({ system: 'Tibetan Mewa ' + tibetan.mewa + ' (' + tibetan.mewaElement + ')', score: sc('Tibetan') });
    if (nativeAmerican.element === dmEl || SHENG[ELEM_EL_MAP[nativeAmerican.element] ?? ''] === dmElEn)
        elVotes.push({ system: 'Native American ' + nativeAmerican.birthTotemTh, score: sc('Native') });
    // High-scoring systems that support the DM element path
    if (hi(sc('Vedic')) && vedicMahadasha.dashaElement === dmEl)
        elVotes.push({ system: 'Vedic Dasha ' + vedicMahadasha.currentDasha, score: sc('Vedic M') });
    if (hi(sc('Zoroastrian')) && zoroastrian.harmony)
        elVotes.push({ system: 'Zoroastrian (harmony)', score: sc('Zoroastrian') });
    if (hi(sc('Hellenistic')) && hellenistic.sect === 'Day Sect' && dmEl === 'ไฟ')
        elVotes.push({ system: 'Hellenistic Day Sect', score: sc('Hellenistic') });
    // All high-scoring systems implicitly resonate with the chart's energy
    // Removed: Aztec / Ifa / Aboriginal / Kabbalistic / Onmyōdō were pushed onto
    // the ELEMENT card whenever their score cleared 780, under a comment reading
    // "All high-scoring systems implicitly resonate with the chart's energy".
    // None of them carries a five-element doctrine, so they were not agreeing
    // about the element — they were agreeing about nothing, and inflating the
    // count the card then advertised. The 2026-08-23 rule is explicit: a system
    // with no technique for the question abstains and says so. A high score is
    // not a vote.
    themes.push({ icon: '🔥',
        theme: tr(`ธาตุ${dmEl} — ${elVotes.length} ศาสตร์ที่มีวิชาเรื่องธาตุ ชี้มาทางนี้`, `${trDF(dmEl)} — the ${elVotes.length} traditions that hold an element doctrine point here`),
        color: '#d48050', votes: elVotes,
        msg: tr(`Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) + สีมงคล ${ninestar.starColor} + ทิศ ${ninestar.starDirection} — ธาตุ${dmEl}คือเส้นด้ายทอง`, `Day Master ${bazi.dayStem} (${trDF(bazi.dayMasterTh)}) + lucky colour ${trDF(ninestar.starColor)} + direction ${trDF(ninestar.starDirection)} — ${trDF(dmEl)} is the golden thread.`) });
    // ─── 2. High-Score Consensus (ศาสตร์ที่เห็นภาพรวมดี) ───────────────────
    // Ranked by score, so it says who scored high — not who agrees with whom.
    const _allScores = all26.filter(b => b.display !== false).map(b => b.score).sort((a, b) => a - b);
    const _hiCut = _allScores.length ? _allScores[Math.floor(_allScores.length / 2)] : 0;
    const highVotes = all26.filter(b => b.score >= _hiCut && b.display !== false).map(b => ({ system: b.system, score: b.score }));
    themes.push({ icon: '🌟',
        theme: tr('ศาสตร์ที่ให้คะแนนคุณสูงที่สุด (ครึ่งบน)', 'The traditions that scored you highest (top half)'),
        color: '#c0a030', votes: highVotes,
        msg: tr(`สูงสุด 3 อันดับ: ${highVotes.sort((a, b) => b.score - a.score).slice(0, 3).map(v => v.system.split(' ')[0]).join(' · ')} · <strong>คะแนนสูงแปลว่าศาสตร์นั้นอ่านดวงคุณได้ระดับดี ไม่ได้แปลว่าศาสตร์เหล่านี้พูดตรงกัน</strong>`, `Top three: ${highVotes.sort((a, b) => b.score - a.score).slice(0, 3).map(v => v.system.split(' ')[0]).join(' · ')} · <strong>A high score means that tradition reads your chart well. It does not mean these traditions agree with each other.</strong>`) });
    // ─── 3. Timing 2026 — ปีนี้มีพลังงานพิเศษ ────────────────────────────────
    const timeVotes = [];
    if (bazi.benMingNian2026)
        timeVotes.push({ system: 'BaZi Ben Ming Nian ม้า', score: sc('BaZi') });
    if (ninestar.star === 9)
        timeVotes.push({ system: 'NSK Star 9 Honmei Kaiki', score: sc('Nine Star') });
    if ([1, 3, 8, 9].includes(numerology.personalYear2026))
        timeVotes.push({ system: 'Numerology PY' + numerology.personalYear2026, score: sc('Pythagorean') });
    if (['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDashaKey))
        timeVotes.push({ system: 'Vedic ' + vedicMahadasha.currentDasha + ' Dasha', score: sc('Vedic M') });
    if (!['รุ่งเรือง', 'เข้มแข็ง', 'มั่นคง', 'เติบโต'].every(q => !tibetan.mewaQuality.includes(q)))
        timeVotes.push({ system: 'Tibetan Mewa ' + tibetan.mewa + ' (' + tibetan.mewaQuality + ')', score: sc('Tibetan') });
    if (['大安', '友引'].includes(onmyodo.rokuyo))
        timeVotes.push({ system: 'Onmyōdō ' + onmyodo.rokuyo, score: sc('Onmyōdō') });
    if (zoroastrian.harmony)
        timeVotes.push({ system: 'Zoroastrian harmony', score: sc('Zoroastrian') });
    if (['Ogbe', 'Ose', 'Obara', 'Otura'].includes(ifaYoruba.odu))
        timeVotes.push({ system: 'Ifa/Yoruba ' + ifaYoruba.odu + ' (' + ifaYoruba.fortune + ')', score: sc('Ifa') });
    if (hi(sc('Hellenistic')))
        timeVotes.push({ system: 'Hellenistic Fortune ' + hellenistic.lotSign, score: sc('Hellenistic') });
    if (['Fehu', 'Jera', 'Dagaz', 'Sowilo'].includes(norseRune.runeName))
        timeVotes.push({ system: 'Norse Rune ' + norseRune.runeName, score: sc('Norse') });
    if (sc('Aztec') >= _hiCut)
        timeVotes.push({ system: 'Aztec ' + aztec.daySignTh + ' Tone ' + aztec.toneNumber, score: sc('Aztec') });
    if (sc('Aboriginal') >= 770)
        timeVotes.push({ system: 'Aboriginal ' + aboriginal.dreamingTh, score: sc('Aboriginal') });
    if (hi(sc('Saju')))
        timeVotes.push({ system: 'Saju ' + saju.kwarsal, score: sc('Saju') });
    if (sc('Zi Wei') >= 770)
        timeVotes.push({ system: 'Zi Wei ' + ziwei.mainStarTh, score: sc('Zi Wei') });
    themes.push({ icon: '⏰',
        theme: tr('ปี 2026 — หน้าต่างโอกาส', '2026 — Window of Opportunity'),
        color: '#50c050', votes: timeVotes,
        msg: `${bazi.benMingNian2026 ? 'Ben Ming Nian + ' : ''} ${ninestar.star === 9 ? 'NSK Honmei + ' : ''} PY${numerology.personalYear2026} + ${vedicMahadasha.currentDasha} Dasha` });
    // ─── 4. Strength / Authority (ความแข็งแกร่ง) ─────────────────────────────
    const strVotes = [];
    [sc('BaZi'), sc('Nine Star'), sc('Saju'), sc('Zi Wei'), sc('Tibetan'), sc('Norse'), sc('Kabbalistic')].forEach((s, i) => {
        const labels = ['BaZi ' + bazi.dayMasterTh, 'NSK Star ' + ninestar.star, 'Saju ' + saju.dominantEnergy, 'Zi Wei ' + ziwei.mainStarTh, 'Tibetan Mewa ' + tibetan.mewa, 'Norse ' + norseRune.runeName, 'Kabbalistic ' + kabbalistic.sephira];
        if (s >= _hiCut)
            strVotes.push({ system: labels[i], score: s });
    });
    if (['Projector', 'Manifesting Generator', 'Manifestor'].includes(humandesign.type))
        strVotes.push({ system: 'Energy Type ' + humandesign.typeTh, score: sc('Energy') });
    if ([1, 8, 11, 22, 33].includes(numerology.lifePath) || numerology.lifePath >= 7)
        strVotes.push({ system: 'Life Path ' + numerology.lifePath + ' ' + numerology.lifePathName.split('—')[0], score: sc('Pythagorean') });
    if (hi(sc('Hellenistic')))
        strVotes.push({ system: 'Hellenistic ' + hellenistic.trigonLord.split('(')[0], score: sc('Hellenistic') });
    if (['Ogbe', 'Obara', 'Ogunda'].includes(ifaYoruba.odu))
        strVotes.push({ system: 'Ifa/Yoruba ' + ifaYoruba.odu, score: sc('Ifa') });
    if (hi(sc('Native')))
        strVotes.push({ system: 'Native Am ' + nativeAmerican.birthTotemTh, score: sc('Native') });
    if (hi(sc('Aztec')))
        strVotes.push({ system: 'Aztec ' + aztec.daySignTh, score: sc('Aztec') });
    themes.push({ icon: '👑',
        theme: tr('ความแข็งแกร่งและอำนาจ — พลังงานผู้นำ', 'Strength & Authority — Leadership Energy'),
        color: '#c0a030', votes: strVotes,
        msg: `${trDF(humandesign.typeTh)} Profile ${humandesign.profile} + LP${numerology.lifePath} + NSK Star ${ninestar.star} + Zi Wei ${trDF(ziwei.mainStarTh)}` });
    // ─── 5. Wealth / Material (ศักยภาพทรัพย์) ────────────────────────────────
    const wlthVotes = [];
    if (hi(sc('Arabic')))
        wlthVotes.push({ system: 'Arabic Parts Fortune ' + arabicParts.fortuneSign, score: sc('Arabic') });
    if (hi(sc('Hellenistic')))
        wlthVotes.push({ system: 'Hellenistic ' + hellenistic.sect, score: sc('Hellenistic') });
    ['Ifa', 'Zi Wei', 'Kabbalistic', 'Norse', 'Ogham', 'Aztec', 'Native', 'Aboriginal', 'Zoroastrian', 'Tibetan', 'Onmyōdō', 'Saju'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= _hiCut) {
            const labels = {
                'Ifa': 'Ifa ' + ifaYoruba.fortune, 'Zi Wei': 'Zi Wei ' + ziwei.palaceQuality, 'Kabbalistic': 'Kabbalistic ' + kabbalistic.sephira,
                'Norse': 'Norse Rune ' + norseRune.runeName, 'Ogham': 'Ogham ' + ogham.treeNameTh, 'Aztec': 'Aztec ' + aztec.daySignQuality,
                'Native': 'Native Am ' + nativeAmerican.birthTotemTh, 'Aboriginal': 'Aboriginal ' + aboriginal.dreamingTh,
                'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.dayYazataTh, 20), 'Tibetan': 'Tibetan Mewa ' + tibetan.mewa,
                'Onmyōdō': 'Onmyōdō ' + onmyodo.rokuyo, 'Saju': 'Saju ' + saju.kwarsal,
            };
            wlthVotes.push({ system: labels[name] ?? name, score: s });
        }
    });
    if (['Jupiter', 'Venus', 'Sun'].includes(vedicMahadasha.currentDashaKey))
        wlthVotes.push({ system: 'Vedic ' + vedicMahadasha.currentDasha + ' Dasha', score: sc('Vedic M') });
    if ([8, 4, 22].includes(numerology.pythagorean))
        wlthVotes.push({ system: 'Pythagorean ' + numerology.pythagorean, score: sc('Pythagorean') });
    // Taksa's มูละ house IS the wealth house — it always has a wealth signal.
    if (hi(c.taksa.score))
        wlthVotes.push({ system: tr('ทักษา มูละ ' + c.taksa.mulaTh, 'Taksa Mula ' + c.taksa.mulaEn), score: c.taksa.score });
    themes.push({ icon: '💎',
        theme: tr('ศักยภาพความมั่งคั่ง', 'Wealth Potential'),
        color: '#50b080', votes: wlthVotes,
        msg: tr(`${wlthVotes.length} ระบบเห็นโอกาส — Arabic Parts ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha + Lucky Element ${bazi.luckyElement}`, `${wlthVotes.length} systems see opportunity — Arabic Parts in ${trDF(arabicParts.fortuneSign)} + ${vedicMahadasha.currentDasha} Dasha + Lucky Element ${trDF(bazi.luckyElement)}`) });
    // ─── 6. Spiritual / Inner Depth (ความลึกภายใน) ───────────────────────────
    const deptVotes = [];
    if ([7, 9, 11, 33].includes(numerology.lifePath))
        deptVotes.push({ system: 'Life Path ' + numerology.lifePath, score: sc('Pythagorean') });
    if (humandesign.profile.startsWith('6') || humandesign.profile.startsWith('5'))
        deptVotes.push({ system: 'HD Profile ' + humandesign.profile, score: sc('Energy') });
    ['Kabbalistic', 'Aboriginal', 'Ifa', 'Norse', 'Ogham', 'Tibetan', 'Aztec', 'Zoroastrian', 'Native'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 760) {
            const lbl = {
                'Kabbalistic': 'Kabbalistic ' + kabbalistic.sephira, 'Aboriginal': 'Aboriginal ' + aboriginal.dreamingTh,
                'Ifa': 'Ifa/Yoruba ' + ifaYoruba.oduTheme.slice(0, 15), 'Norse': 'Norse Rune ' + norseRune.runeKeyword,
                'Ogham': 'Ogham ' + ogham.oghamClass, 'Tibetan': 'Tibetan Mewa ' + tibetan.mewaQuality,
                'Aztec': 'Aztec ' + aztec.daySignQuality, 'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.monthAmeshaTh, 22),
                'Native': 'Native Am ' + nativeAmerican.clansmother,
            };
            deptVotes.push({ system: lbl[name] ?? name, score: s });
        }
    });
    if (['กรกฎ', 'พิจิก', 'มีน'].includes(western.moonSignTh))
        deptVotes.push({ system: 'Western Moon ' + western.moonSignTh, score: sc('Western') });
    themes.push({ icon: '🔮',
        theme: tr('ความลึกภายใน — จิตวิญญาณและสัญชาตญาณ', 'Inner Depth — Spirit & Intuition'),
        color: '#9060c0', votes: deptVotes,
        msg: `LP${numerology.lifePath} + ${kabbalistic.sephira} + ${trDF(aboriginal.dreamingTh)} + Vedic Nakshatra ${vedic.moonNakshatra}` });
    // ─── 7. Tension / Challenge (จุดท้าทาย) ───────────────────────────────────
    const warnVotes = all26.filter(b => b.score < 650 && b.display !== false).map(b => ({ system: b.system + ' (' + b.score + ')', score: b.score }));
    if (bazi.missingElement && bazi.missingElement !== 'ครบทุกธาตุ')
        warnVotes.push({ system: 'BaZi ขาดธาตุ' + bazi.missingElement, score: sc('BaZi') });
    if (['Rahu', 'Saturn', 'Ketu'].includes(vedicMahadasha.currentDashaKey))
        warnVotes.push({ system: 'Vedic Dasha ' + vedicMahadasha.currentDasha, score: sc('Vedic M') });
    themes.push({ icon: '⚡',
        theme: tr('จุดท้าทาย — พลังงานสร้างการเติบโต', 'Challenge Points — Energy that drives growth'),
        color: '#c05030', votes: warnVotes,
        msg: tr(`ระบบที่เห็นต่าง: ${warnVotes.slice(0, 3).map(v => v.system.split(' (')[0].split(' ')[0]).join(', ')} — ความขัดแย้งนี้เป็นแรงขับ ไม่ใช่ข้อบกพร่อง`, `Dissenting systems: ${warnVotes.slice(0, 3).map(v => v.system.split(' (')[0].split(' ')[0]).join(', ')} — this friction is fuel, not a flaw.`) });
    // ─── 8. Relationship / Network ───────────────────────────────────────────
    const relVotes = [];
    if (humandesign.profile.includes('4') || humandesign.profile.includes('6'))
        relVotes.push({ system: 'HD Profile ' + humandesign.profile, score: sc('Energy') });
    ['Ifa', 'Aboriginal', 'Native', 'Zoroastrian', 'Kabbalistic', 'Ogham', 'Norse'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 760) {
            const lbl = {
                'Ifa': 'Ifa/Yoruba ' + ifaYoruba.oduTheme.slice(0, 12), 'Aboriginal': 'Aboriginal ' + aboriginal.clan,
                'Native': 'Native Am ' + nativeAmerican.clansmother, 'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.dayYazataTh, 20),
                'Kabbalistic': 'Kabbalistic ' + kabbalistic.archangel, 'Ogham': 'Ogham ' + ogham.treeName,
                'Norse': 'Norse Rune ' + norseRune.runeName,
            };
            relVotes.push({ system: lbl[name] ?? name, score: s });
        }
    });
    if (['ตุลย์', 'กรกฎ', 'มีน', 'พฤษภ'].includes(western.sunSignTh))
        relVotes.push({ system: 'Western Sun ' + western.sunSignTh, score: sc('Western') });
    themes.push({ icon: '💞',
        theme: tr('พลังความสัมพันธ์ — เครือข่ายและการเชื่อมต่อ', 'Relational Power — Networks & Connection'),
        color: '#c06080', votes: relVotes,
        msg: `HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} + ${trDF(ifaYoruba.oduTheme.slice(0, 20))}` });
    const visible = themes.filter(t => t.votes.length >= 3).sort((a, b) => b.votes.length - a.votes.length);
    // Generate narrative for each theme based on chart data
    const narratives = {
        '🔥': tr(`จาก ${c.score.breakdown.filter(b => b.score >= 780 && b.scoring !== false).length} ระบบที่ให้คะแนนสูง ธาตุ${dmEl}ปรากฏชัดเจนที่สุด — Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) กำหนดวิธีที่คุณประมวลผลโลก ไม่ใช่แค่ "นิสัย" แต่คือโครงสร้างพื้นฐานของการตัดสินใจและพลังงานชีวิต ศาสตร์ทั้งในและตะวันตกต่างยืนยันสิ่งเดียวกันโดยไม่รู้จักกัน`, `Across the ${c.score.breakdown.filter(b => b.score >= 780 && b.scoring !== false).length} highest-scoring systems, the ${trDF(dmEl)} element shows up most clearly. Day Master ${bazi.dayStem} (${trDF(bazi.dayMasterTh)}) shapes how you process the world — not as "personality", but as the underlying structure of how you make decisions and where your life-force flows. Eastern and Western traditions, computed independently, both confirm the same signal.`),
        '🌟': tr(`เมื่อมีระบบจากหลายวัฒนธรรม (ตะวันออก ตะวันตก แอฟริกา อเมริกา โอเชียเนีย) ต่างให้คะแนนสูงพร้อมกัน แปลว่าระดับของดวงนี้อ่านได้สูงจากหลายมุม — ไม่ได้แปลว่าเห็นตรงกันว่าคุณเป็นคนแบบไหน สองศาสตร์ให้ 800 เท่ากันแล้วพูดคนละเรื่องได้`, `When systems from multiple cultures (East, West, Africa, the Americas, Oceania) score high simultaneously — that's true consensus. Not one tradition that happens to favour you, but a chart that holds up across cultural lenses.`),
        '⏰': tr(`ปี 2026 ไม่ใช่แค่ปีดีโดยบังเอิญ แต่มีกลไกทางโหราศาสตร์หลายชั้นเปิดพร้อมกัน — BaZi Ben Ming Nian หมายถึงพลังงานของคุณ "กลับบ้าน" ครบรอบ 12 ปี, NSK Star 9 Honmei Kaiki หมายถึงดาวเกิดตรงกับดาวปี, Vedic Dasha ชี้ช่วงปกครอง ${vedicMahadasha.currentDasha} — นี่คือ window ที่ควรลงมือ`, `2026 is not just incidentally good — multiple astrological mechanisms open at once. BaZi Ben Ming Nian means your energy "comes home" on its 12-year cycle. NSK Star 9 Honmei Kaiki means your birth star aligns with the year-star. Vedic Dasha currently rules ${vedicMahadasha.currentDasha} — this is the window for action.`),
        '👑': tr(`ลักษณะผู้นำในดวงชาตาไม่ได้มาจากความทะเยอทะยาน แต่มาจากโครงสร้างของพลังงาน — ${humandesign.typeTh} Strategy "${humandesign.strategy}" ประกอบกับ NSK Star ${ninestar.star} และ LP${numerology.lifePath} บ่งว่าคุณถูกออกแบบให้ "guide" มากกว่า "push"`, `The leadership signature in your chart isn't ambition — it's energetic structure. ${trDF(humandesign.typeTh)} Strategy "${trDF(humandesign.strategy)}" combined with NSK Star ${ninestar.star} and LP${numerology.lifePath} indicates you're designed to "guide" rather than "push".`),
        '💎': tr(`ศักยภาพทรัพย์ในดวงไม่ใช่การรับรองว่าจะรวย แต่คือ "ทิศทาง" ที่พลังงานไหลได้ดีที่สุด — Arabic Parts Fortune ใน${arabicParts.fortuneSign} ร่วมกับ ${vedicMahadasha.currentDasha} Dasha และ Lucky Element ${bazi.luckyElement} บ่งทิศ`, `Wealth potential in a chart isn't a guarantee of riches — it's the direction your energy flows best. Arabic Parts Fortune in ${trDF(arabicParts.fortuneSign)} combined with the ${vedicMahadasha.currentDasha} Dasha and Lucky Element ${trDF(bazi.luckyElement)} marks that direction.`),
        '🔮': tr(`ความลึกทางจิตวิญญาณใน LP${numerology.lifePath} + ${kabbalistic.sephira} + ${celtic.treeNameTh} บ่งว่าคุณมี "antenna" รับสัญญาณที่ละเอียดกว่าคนทั่วไป — สิ่งนี้อาจทำให้ตัดสินใจช้า แต่เมื่อตัดสินใจแล้วมักถูกต้อง`, `The spiritual depth across LP${numerology.lifePath} + ${kabbalistic.sephira} + ${trDF(celtic.treeNameTh)} suggests you have a finer "antenna" for subtle signals than most people. This can make decisions slow — but when you do decide, you're usually right.`),
        '⚡': tr(`ทุกจุดท้าทายในดวงมีเหตุผล — ธาตุขาด${bazi.missingElement ? bazi.missingElement : 'ไม่มี'} คือพลังงานที่ต้องหามาจากภายนอก ระบบที่ score ต่ำกว่า median ไม่ได้บอกว่า "ดวงแย่" แต่บอกว่า "พลังงานนั้นไม่ใช่ทิศหลัก"`, `Every challenge in your chart has a reason. The missing ${trDF(bazi.missingElement) || 'no'} element is the energy you must source from outside. Systems scoring below median don't say "bad chart" — they say "this energy isn't your primary direction".`),
        '💞': tr(`พลังความสัมพันธ์ใน HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} บ่งว่าเครือข่ายมนุษย์คือ multiplier — คนเดียวได้ 1x แต่ผ่านคนที่ใช่ได้ 5-10x`, `The relational signature in HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} indicates that human networks are your multiplier — solo you do 1x, but through the right people 5-10x.`),
    };
    const FAMILY_MAP = [
        ['BaZi', 'east'], ['Nine Star', 'east'], ['Saju', 'east'], ['Zi Wei', 'east'],
        ['Onmyōdō', 'east'], ['Tibetan', 'east'],
        ['ไทยพราหมณ์', 'east'], ['Thai Brahmin', 'east'],
        ['เลข ๗ ตัว', 'east'], ['Thai 7-Number', 'east'],
        ['ทักษา', 'east'], ['Thai Taksa', 'east'],
        ['Vedic Jyotish', 'east'], ['Vedic Mahadasha', 'east'],
        ['ตะวันตก', 'west'], ['Western Astrology', 'west'], ['Hellenistic', 'west'], ['Pythagorean', 'west'],
        ['Kabbalistic', 'west'], ['เซลติก', 'west'], ['Celtic', 'west'], ['Ogham', 'west'], ['Arabic', 'west'],
        ['มายัน', 'indigenous'], ['Mayan', 'indigenous'], ['Aztec', 'indigenous'], ['Native', 'indigenous'],
        ['Aboriginal', 'indigenous'], ['Ifa', 'indigenous'],
        ['Norse', 'esoteric'], ['Zoroastrian', 'esoteric'],
        ['ระบบประเภทพลังงาน', 'esoteric'], ['Energy Type', 'esoteric'],
    ];
    const familyOf = (sys) => {
        for (const [frag, fam] of FAMILY_MAP)
            if (sys.includes(frag))
                return fam;
        return null;
    };
    const families = {
        east: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
        west: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
        indigenous: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
        esoteric: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
    };
    // Display widget: counts and names must come from the SAME set, or the bar
    // reads "4/11" next to ten names. Hidden systems (ทักษา) are dropped from
    // both — they still vote on the Cosmic Score via all26 elsewhere.
    for (const b of all26.filter(x => x.display !== false)) {
        const fam = familyOf(b.system);
        if (!fam)
            continue;
        families[fam].total++;
        families[fam].names.push(b.system);
        if (b.score >= 780) {
            families[fam].strong++;
            families[fam].strongNames.push(b.system);
        }
        else if (b.score >= 650) {
            families[fam].resonance++;
        }
        else {
            families[fam].weak++;
        }
    }
    const fams = ['east', 'west', 'indigenous', 'esoteric'];
    const totalStrong = fams.reduce((s, f) => s + families[f].strong, 0);
    const totalResonance = fams.reduce((s, f) => s + families[f].resonance, 0);
    const totalFamilies = fams.reduce((s, f) => s + families[f].total, 0);
    const totalWeak = fams.reduce((s, f) => s + families[f].weak, 0);
    const dominantFamily = fams.reduce((m, f) => (families[f].strong / families[f].total) > (families[m].strong / families[m].total) ? f : m, 'east');
    // ── Rarity math for the Unique Signature box ──
    // BaZi Day Pillar combinations: 10 stems × 12 branches = 60
    // Vedic Nakshatra × Pada: 27 nakshatras × 4 padas = 108
    // Mayan Kin: 13 tones × 20 day signs = 260
    // Joint combinations: 60 × 108 × 260 = 1,684,800 unique cosmic fingerprints.
    // World population ≈ 8B → ≈ 4,750 people share each fingerprint.
    const totalCombos = 60 * 108 * 260;
    const peopleSharing = Math.round(8000000000 / totalCombos);
    const nakshatra = c.vedic.moonNakshatra || '—';
    const pada = c.vedic.nakshathraPada || c.vedic.nakshatraPada || '';
    const mayanLbl = `${c.mayan.kin} ${_lang === 'en' ? c.mayan.daySignName : c.mayan.daySignNameTh}`;
    // ── Variant Perception ──────────────────────────────────────────────────
    // Surface systems that genuinely DISAGREE with the consensus — not just
    // "three lowest scores". Two filters:
    //   1. Exclude TIME-VARIABLE systems (Vedic Mahadasha = current planetary
    //      period; Biorhythm is already absent from all26). They speak about
    //      the moment, not the person, so they can't meaningfully "dissent"
    //      from an identity-level read.
    //   2. Require the score to be meaningfully BELOW the chart's own median
    //      (gap ≥ 50). Three lowest could be one point under median for a
    //      cohesive chart — that's coherence, not dissent.
    // If fewer than 2 real dissenters exist, the chart is highly coherent and
    // the Variant box renders a "your chart speaks with one voice" message
    // instead of forcing weak dissents.
    const VARIANT_EXCLUDE = ['Biorhythm', 'Vedic Mahadasha'];
    const dissenters = [...all26]
        .filter(b => b.display !== false)
        .filter(b => !VARIANT_EXCLUDE.some(ex => b.system.includes(ex)))
        .filter(b => b.score < medianScore - 50)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
    // Each dissenter needs a short "what it sees differently" line. Prefer the
    // system's own finding; if empty, fall back to a generic shadow phrase so
    // the row never renders a bare score with a trailing dash.
    const dissentLine = (d) => {
        const f = (d.finding || '').trim();
        if (f)
            return esc(f.slice(0, 90));
        return tr('เห็นมิติที่ระบบส่วนใหญ่ไม่ได้เน้น', 'sees a dimension the majority underplays');
    };
    const variantBox = dissenters.length >= 2
        ? `
    <div style="background:linear-gradient(135deg,#1a0a14,#180a28);border:2px solid #8a5acc;border-radius:12px;padding:14px 18px;margin:14px 0">
      <div style="font-size:10px;letter-spacing:3px;color:#c08ad8;margin-bottom:6px">${tr('🔍 อีกมุมหนึ่งที่น่าฟัง — variant perception', '🔍 THE DISSENTING VIEW — variant perception')}</div>
      <div style="font-size:12px;color:#d0a8e0;line-height:1.8;margin-bottom:8px">${tr(`เมื่อศาสตร์ส่วนใหญ่เห็นภาพรวมเป็นบวก ${dissenters.length} ศาสตร์ที่ให้คะแนนต่ำกว่าค่ากลางของคุณชัดเจน มักชี้สิ่งที่ระบบใหญ่มองข้าม — ไม่ใช่ "ดวงแย่" แต่เป็นมิติในเงาที่ควรฟังตอนตัดสินใจใหญ่:`, `When the majority sees a positive picture, the ${dissenters.length} systems scoring clearly below your own median often reveal what the consensus misses — not "bad chart" but the shadow dimension worth hearing when stakes are high:`)}</div>
      <div style="font-size:11.5px;color:#b890d0;line-height:1.9">
        ${dissenters.map(d => `• <strong>${esc(d.system)}</strong> <span style="color:#8868a0">(${d.score})</span> — ${dissentLine(d)}`).join('<br>')}
      </div>
      <div style="font-size:10px;color:#806090;margin-top:10px;padding-top:8px;border-top:1px solid #3a2050">${tr('🎯 ใช้ยังไง: ก่อนตัดสินใจใหญ่ (อาชีพ ความสัมพันธ์ การลงทุน) อ่านเสียงข้างน้อยนี้ซ้ำ มันมักชี้สิ่งที่คุณรู้ลึกๆ แต่ไม่อยากยอมรับ', '🎯 How to use: before big decisions (career, relationships, investments), re-read these dissenting voices — they often name what you already sense but resist admitting')}</div>
    </div>`
        : `
    <div style="background:linear-gradient(135deg,#0a1a14,#0a1828);border:2px solid #5acc8a;border-radius:12px;padding:14px 18px;margin:14px 0">
      <div style="font-size:10px;letter-spacing:3px;color:#7ad8a8;margin-bottom:6px">${tr('🎯 ดวงที่กลมกลืน — rare coherence', '🎯 A COHERENT CHART — rare coherence')}</div>
      <div style="font-size:12px;color:#a8e0c8;line-height:1.8">${tr(`ดวงของคุณ "พูดด้วยเสียงเดียว" — ไม่มีศาสตร์ระบุตัวตนใดให้คะแนนต่ำกว่าค่ากลางของคุณอย่างมีนัยสำคัญ นี่หายากกว่าที่คิด: ${dissenters.length === 1 ? 'มีเพียง 1 ศาสตร์ที่เห็นต่างเล็กน้อย' : 'แทบทุกศาสตร์เห็นภาพไปทางเดียวกัน'} เมื่อมุมมองส่วนใหญ่สอดคล้องกัน ความมั่นใจในการตัดสินใจของคุณมีพื้นฐานแข็งแรง — แต่ระวัง blind spot ที่ไม่มีใครเตือน`, `Your chart "speaks with one voice" — no identity-level system scores significantly below your own median. This is rarer than it sounds: ${dissenters.length === 1 ? 'only one system dissents, and only mildly' : 'nearly every system points the same way'}. When most lenses agree, your decisions rest on solid ground — but watch for the blind spot no one is there to flag.`)}</div>
    </div>`;
    // ── Headline TL;DR — one-paragraph summary ──
    const elemConsensusEl = dmEl; // we already established cover's element consensus
    const tldrCore = tr(`26 ศาสตร์มอง <strong style="color:#e8c87a">${esc(c.input.name || 'คุณ')}</strong> = พลังธาตุ<strong>${esc(dmEl)}</strong> · <strong style="color:#e8c87a">"${esc(score.cosmicEntity)}"</strong> · Life Path <strong>${numerology.lifePath}</strong> "${esc((numerology.lifePathName || '').split('—')[0].trim())}" · ${bazi.benMingNian2026 ? 'Ben Ming Nian + ' : ''}${ninestar.star === 9 ? 'NSK Honmei + ' : ''}Personal Year <strong>${numerology.personalYear2026}</strong> · ${totalStrong}/${totalFamilies} ศาสตร์ยืนยันชัด, ${totalWeak}/${totalFamilies} เห็นจุดท้าทาย · ลายเซ็นจักรวาล ~1 ใน ${(totalCombos / 1e6).toFixed(1)}M คน`, `26 systems see <strong style="color:#e8c87a">${esc(c.input.name || 'you')}</strong> as <strong>${esc(dmEl)}</strong>-element energy · <strong style="color:#e8c87a">"${esc(score.cosmicEntity)}"</strong> · Life Path <strong>${numerology.lifePath}</strong> "${esc((numerology.lifePathName || '').split('—').slice(-1)[0].trim())}" · ${bazi.benMingNian2026 ? 'Ben Ming Nian + ' : ''}${ninestar.star === 9 ? 'NSK Honmei + ' : ''}Personal Year <strong>${numerology.personalYear2026}</strong> · ${totalStrong}/${totalFamilies} systems strongly agree, ${totalWeak}/${totalFamilies} flag challenges · cosmic fingerprint ~1 in ${(totalCombos / 1e6).toFixed(1)}M people`);
    const familyLabels = {
        east: { th: 'ตะวันออก', en: 'Eastern' },
        west: { th: 'ตะวันตก', en: 'Western' },
        indigenous: { th: 'พื้นเมือง', en: 'Indigenous' },
        esoteric: { th: 'ลึกลับ/นิรนาม', en: 'Esoteric' },
    };
    // Plain-language overview paragraph — the one-line token summary (tldrCore)
    // reads as a dense list; this gives the same picture as readable prose so the
    // front synthesis isn't just a string of "·"-separated tokens (Director
    // 2026-07-03 "ภาพรวมสั้นไปนิด").
    const _domFamLbl = _lang === 'en' ? familyLabels[dominantFamily].en : familyLabels[dominantFamily].th;
    const tldrProse = tr(`แกนพลังงานของคุณคือธาตุ<strong>${esc(dmEl)}</strong> (Day Master ตาม BaZi)<br>
     ${totalStrong} ศาสตร์ให้คะแนนสูง อีก ${totalWeak} ศาสตร์ชี้จุดที่ควรรู้ตัวไว้ เสียงดังสุดมาจากสาย<strong>${esc(_domFamLbl)}</strong><br>
     รวมทุกศาสตร์แล้วได้ Cosmic Score <strong style="color:#c8a45a">${score.total}</strong> ระดับ “${esc(score.tier)}”`, `Your core is <strong>${esc(dmEl)}</strong>-element energy (your BaZi Day Master) — <strong>${totalStrong}/${totalFamilies}</strong> systems score your chart high, while <strong>${totalWeak}/${totalFamilies}</strong> flag things worth watching. The tradition speaking loudest is <strong>${esc(_domFamLbl)}</strong>, and once every system is combined your overall level resolves into a Cosmic Score of <strong style="color:#c8a45a">${score.total}</strong> — the “${esc(score.tier)}” band. Below: what each culture sees, and the main themes multiple systems confirm together.`);
    const familyBars = fams.map(f => {
        const d = families[f];
        const sPct = d.total ? (d.strong / d.total) * 100 : 0;
        const rPct = d.total ? (d.resonance / d.total) * 100 : 0;
        const wPct = d.total ? (d.weak / d.total) * 100 : 0;
        const lbl = _lang === 'en' ? familyLabels[f].en : familyLabels[f].th;
        const star = (f === dominantFamily) ? ' ⭐' : '';
        // Name the strong systems under each bar — a bar alone says "3/10"
        // without telling the reader WHICH traditions carried the family.
        const strongLine = d.strongNames.length
            ? `<div style="margin:1px 0 6px 100px;font-size:9.5px;color:#6a8ab0;line-height:1.5">⭐ ${d.strongNames.map(n => esc(trDF(n))).join(' · ')}</div>`
            : '';
        return `<div style="display:flex;align-items:center;gap:10px;margin:5px 0 2px">
      <div style="width:90px;font-size:11px;color:#c8b890">${esc(lbl)}${star}</div>
      <div style="flex:1;display:flex;height:14px;border-radius:3px;overflow:hidden;border:1px solid #2a2545;background:#0a0815">
        <div style="width:${sPct.toFixed(1)}%;background:#50b050" title="${d.strong} ${tr('ยืนยันชัด', 'strong')}"></div>
        <div style="width:${rPct.toFixed(1)}%;background:#c8a45a" title="${d.resonance} ${tr('เห็นสอดคล้อง', 'resonate')}"></div>
        <div style="width:${wPct.toFixed(1)}%;background:#a04030" title="${d.weak} ${tr('จุดท้าทาย', 'challenge')}"></div>
      </div>
      <div style="width:60px;font-size:11px;color:#9a8a72;text-align:right">${d.strong}/${d.total}</div>
    </div>${strongLine}`;
    }).join('');
    // ── Per-system verdict table — the raw finding from each of the 26 ──
    // NOTE (2026-07-03): the per-system VERDICTS table that used to live here
    // (every tradition's finding + score, grouped by family) was removed. It
    // duplicated the raw 26-system scoreboard (p02_scoreBreakdown) and the
    // secondary-system cards — three per-system enumerations stacked near the
    // front buried the synthesis. Grand Convergence is now synthesis-only
    // (themes + cross-cultural consensus); the per-system numbers/findings live
    // in the scoreboard + cards cluster later in the report.
    return section(4, tr('Grand Convergence — 26 ศาสตร์ส่งคำตอบเดียวกัน', 'Grand Convergence — All 26 Systems Speak Together'), '🌐', `
    <!-- 1. Headline TL;DR -->
    <div style="background:linear-gradient(135deg,#1a1408,#0e0a18);border:2px solid #c8a45a;border-radius:12px;padding:14px 18px;margin-bottom:14px">
      <div style="font-size:10px;letter-spacing:3px;color:#c8a45a;margin-bottom:6px">${tr('✦ ภาพรวม 1 ย่อหน้า', '✦ ONE-PARAGRAPH OVERVIEW')}</div>
      <div style="font-size:13px;color:#e6e2d8;line-height:1.9;margin-bottom:10px">${tldrProse}</div>
      <div style="font-size:11.5px;color:#c8bfa6;line-height:1.8;border-top:1px solid #2a2545;padding-top:9px">${tldrCore}</div>
    </div>

    <!-- 2. Cross-Cultural Consensus -->
    <div style="background:linear-gradient(135deg,#0a1422,#1a1530);border:2px solid #5a8acc;border-radius:12px;padding:14px 18px;margin-bottom:14px">
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:10px;letter-spacing:3px;color:#7aaae0">${tr('🌏 ฉันทามติข้ามวัฒนธรรม', '🌏 CROSS-CULTURAL CONSENSUS')}</div>
        <div style="font-size:13px;color:#aac8ff;margin-top:3px;line-height:1.65">${tr(`<strong>${totalStrong}/${totalFamilies}</strong> ศาสตร์ยืนยันชัด · <strong>${totalResonance}/${totalFamilies}</strong> เห็นสอดคล้อง · <strong>${totalWeak}/${totalFamilies}</strong> ชี้จุดท้าทาย`, `<strong>${totalStrong}/${totalFamilies}</strong> systems strongly agree · <strong>${totalResonance}/${totalFamilies}</strong> resonate · <strong>${totalWeak}/${totalFamilies}</strong> flag challenges`)}</div>
      </div>
      ${familyBars}
      <div style="font-size:10px;color:#6a7a90;margin-top:10px;padding-top:10px;border-top:1px solid #2a3a5a;line-height:1.65">
        🟢 ${tr('ยืนยันชัด (≥780)', 'Strong (≥780)')} · 🟡 ${tr('เห็นสอดคล้อง (650–779)', 'Resonate (650–779)')} · 🔴 ${tr('จุดท้าทาย (&lt;650)', 'Challenge (&lt;650)')} · ${tr(`จุดแข็งสุด: <strong style="color:#aac8ff">${esc(_lang === 'en' ? familyLabels[dominantFamily].en : familyLabels[dominantFamily].th)}</strong> — เมื่อศาสตร์จากหลายอารยธรรมเห็นตรงกัน ความน่าเชื่อถือย่อมสูงกว่าศาสตร์เดี่ยวเพียงลำพัง`, `Strongest: <strong style="color:#aac8ff">${esc(familyLabels[dominantFamily].en)}</strong> — when systems from multiple civilisations agree, the read is more reliable than any single tradition alone`)}
      </div>
    </div>

    <!-- 3. Themes (the existing 8 with consensus rows) -->
    <div style="font-size:11px;color:#7a6a52;margin:14px 0 8px;line-height:1.6">
      ${tr('🎯 ภาพหลัก ' + visible.length + ' theme — แต่ละ theme คือจุดที่ระบบหลายตัวยืนยัน', `🎯 ${visible.length} main themes — each is a point where multiple systems agree`)}
    </div>
    ${visible.map(t => consensusRow(t.icon, t.theme, t.votes, t.msg, t.votes.length, t.color, narratives[t.icon] ?? '')).join('')}

    <!-- 4. Variant Perception — minority dissent insight (or coherence note) -->
    ${variantBox}

    <!-- 5. Unique Cosmic Signature -->
    <div style="background:linear-gradient(135deg,#1a1408,#2a1c0a);border:2px solid #c8a45a;border-radius:12px;padding:14px 18px;margin:14px 0">
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:10px;letter-spacing:3px;color:#c8a45a">${tr('✦ ลายเซ็นจักรวาลของคุณ ✦', '✦ YOUR COSMIC SIGNATURE ✦')}</div>
        <div style="font-size:18px;color:#e8c87a;font-weight:700;margin-top:6px;font-family:'Cinzel Decorative',serif">${esc(score.cosmicEntity)}</div>
      </div>
      <div style="background:#0e0a08;border-radius:6px;padding:10px 14px;font-size:11.5px;color:#c8a878;line-height:2">
        <div>🀄 BaZi Day Pillar <strong style="color:#e8c87a">${esc(bazi.dayStem)}${esc(bazi.dayBranch)}</strong> · ~1 ${tr('ใน 60', 'in 60')}</div>
        <div>🕉️ Vedic Nakshatra <strong style="color:#e8c87a">${esc(nakshatra)}${pada ? ' ' + tr('บาท', 'pada') + ' ' + esc(String(pada)) : ''}</strong> · ~1 ${tr('ใน 108', 'in 108')}</div>
        <div>🌀 Mayan Kin <strong style="color:#e8c87a">${esc(mayanLbl)}</strong> · ~1 ${tr('ใน 260', 'in 260')}</div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #3a2c1a;color:#e8c87a;font-size:13px">${tr(`= ลายเซ็นรูปนี้ มีเพียง <strong>~${peopleSharing.toLocaleString()} คน</strong> บนโลก หรือ <strong>1 ใน ${totalCombos.toLocaleString()}</strong> คน`, `= this exact signature shared by only <strong>~${peopleSharing.toLocaleString()} people</strong> worldwide, or <strong>1 in ${totalCombos.toLocaleString()}</strong>`)}</div>
      </div>
      <div style="font-size:10.5px;color:#8a7050;margin-top:8px;line-height:1.65">${tr('💡 คุณไม่ใช่ "ราศีเมษ" หรือ "Life Path 4" — คุณคือผลคูณที่หาเหมือนไม่ได้ของหลายระบบที่ต่างวัฒนธรรมต่างยุค ลายเซ็นนี้คือ fingerprint ของคุณในจักรวาล', '💡 You are not just "Aries" or "Life Path 4" — you are the unrepeatable intersection of many systems across cultures and eras. This signature is your fingerprint in the cosmos.')}</div>
    </div>
  `);
}
function p_new16systems(c) {
    const systems = [
        { name: 'Saju (Korean)', icon: '🇰🇷', data: `${c.saju.yearPillar} ${c.saju.monthPillar} ${c.saju.dayPillar} ${c.saju.hourPillar}`, detail: trDF(c.saju.dominantEnergy), score: c.saju.score },
        { name: 'Tibetan Mewa', icon: '☸️', data: `Mewa ${c.tibetan.mewa} ${c.tibetan.mewaName}`, detail: c.tibetan.parkhaName, score: c.tibetan.score },
        { name: 'Zi Wei (紫微)', icon: '🌌', data: trDF(c.ziwei.mainStarTh), detail: c.ziwei.lifePalaceName, score: c.ziwei.score },
        { name: 'Onmyōdō', icon: '⛩️', data: `${c.onmyodo.rokuyo} ${c.onmyodo.rokuyoTh}`, detail: c.onmyodo.onmyoPolarity, score: c.onmyodo.score },
        { name: 'Hellenistic', icon: '🏛️', data: `${c.hellenistic.sect}`, detail: `${tr('Fortune ใน', 'Fortune in')} ${trDF(c.hellenistic.lotSign)}`, score: c.hellenistic.score },
        { name: 'Norse Rune', icon: 'ᚱ', data: `${c.norseRune.rune} ${c.norseRune.runeName}`, detail: trDF(c.norseRune.runeKeyword), score: c.norseRune.score },
        { name: 'Ogham', icon: '🌿', data: `${c.ogham.ogham} ${c.ogham.treeName}`, detail: trDF(c.ogham.oghamClass), score: c.ogham.score },
        { name: 'Arabic Parts', icon: '⭐', data: `${tr('Fortune ใน', 'Fortune in')} ${trDF(c.arabicParts.fortuneSign)}`, detail: `${tr('Spirit ใน', 'Spirit in')} ${trDF(c.arabicParts.spiritSign)}`, score: c.arabicParts.score },
        { name: 'Kabbalistic', icon: '✡️', data: c.kabbalistic.sephira, detail: c.kabbalistic.archangel, score: c.kabbalistic.score },
        { name: 'Zoroastrian', icon: '🔥', data: c.zoroastrian.dayYazataTh.slice(0, 20), detail: trDF(c.zoroastrian.monthAmeshaTh.slice(0, 20)), score: c.zoroastrian.score },
        { name: 'Aztec', icon: '🦅', data: `${trDF(c.aztec.daySignTh)} ${c.aztec.toneNumber}`, detail: trDF(c.aztec.daySignQuality), score: c.aztec.score },
        { name: 'Native American', icon: '🦅', data: trDF(c.nativeAmerican.birthTotemTh), detail: c.nativeAmerican.clansmother, score: c.nativeAmerican.score },
        { name: 'Ifa/Yoruba', icon: '🥁', data: `Odù ${c.ifaYoruba.odu}`, detail: trDF(c.ifaYoruba.fortune), score: c.ifaYoruba.score },
        { name: 'Aboriginal', icon: '🌈', data: trDF(c.aboriginal.dreamingTh), detail: c.aboriginal.clan, score: c.aboriginal.score },
        { name: tr('ทักษา ๘ บ้าน', 'Thai Taksa'), icon: '🪷', data: tr(`เจ้าวัน${c.taksa.dayLordTh}`, `Day-lord ${c.taksa.dayLordEn}`), detail: tr(`มูละ ${c.taksa.mulaTh} · กาลกิณี ${c.taksa.kalakiniTh}`, `Mula ${c.taksa.mulaEn} · Kalakini ${c.taksa.kalakiniEn}`), score: c.taksa.score },
        { name: 'Vedic Mahadasha', icon: '🕉️', data: `${c.vedicMahadasha.currentDasha} Dasha`, detail: `${tr('ถึงปี', 'until')} ${c.vedicMahadasha.currentDashaEnd}`, score: c.vedicMahadasha.score },
    ];
    return section(5, tr('16 ระบบเพิ่มเติม — ภาพรวม', '16 Additional Systems — Overview'), '🌍', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px">
      ${tr('ภาพรวมย่อของ 16 ศาสตร์ที่เพิ่งเพิ่มเข้ามา — ดูรายละเอียดเต็มใน Premium+ version', 'Compact summary of 16 newly-added world traditions — full readings in the Premium+ pages')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${systems.map(s => `
        <div style="background:#0a0a10;border:1px solid #2a2010;border-radius:8px;padding:10px;display:flex;gap:8px;align-items:flex-start">
          <span style="font-size:16px;flex-shrink:0">${esc(s.icon)}</span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;font-weight:600;color:#c8b890">${esc(s.name)}</span>
              <span style="font-size:12px;font-weight:700;color:${s.score >= 780 ? '#60c060' : s.score >= 650 ? '#c0c040' : '#c06030'}">${s.score}</span>
            </div>
            <div style="font-size:12px;color:#c8a45a;margin-top:2px">${esc(s.data)}</div>
            <div style="font-size:10px;color:#6a5a42;margin-top:1px">${esc(s.detail)}</div>
          </div>
        </div>`).join('')}
    </div>
  `);
}
function p04_western(c) {
    const w = c.western;
    // Sun/moon/asc sign labels — engine produces Thai names by default; for EN
    // we strip the Thai-suffix sentences and lean on the existing sunSign/moonSign
    // English values from the Western calculator.
    const isEn = _lang === 'en';
    const sunLabel = isEn ? w.sunSign : w.sunSignTh;
    const moonLabel = isEn ? w.moonSign : w.moonSignTh;
    const ascLabel = isEn ? w.ascSign : w.ascSignTh;
    // Specific per-sign traits so the Sun/Moon/ASC reads aren't "core X energy".
    // core = identity (Sun) · emo = inner needs (Moon) · mask = first impression (ASC)
    const SIGN_TRAITS = {
        Aries: { core: ['ผู้บุกเบิกที่กล้าเริ่มก่อนใคร ไม่กลัวเป็นคนแรก', 'a pioneer who moves before anyone else, unafraid to go first'], emo: ['โกรธเร็วหายเร็ว และต้องรู้สึกว่าได้นำ', 'flares up fast and cools fast, and needs to feel in the lead'], mask: ['ตรงไปตรงมาและมีพลังขับเคลื่อน', 'direct and full of forward drive'] },
        Taurus: { core: ['คนมั่นคงที่รักความสบายและคุณค่าที่จับต้องได้', 'a steady soul drawn to comfort and tangible value'], emo: ['ต้องการความปลอดภัยและความสม่ำเสมอ ไม่ชอบถูกเร่ง', 'needs security and steadiness, dislikes being rushed'], mask: ['สงบ น่าเชื่อถือ และไม่รีบร้อน', 'calm, dependable and unhurried'] },
        Gemini: { core: ['คนอยากรู้อยากเห็น สื่อสารเก่ง ปรับตัวไว', 'a curious, articulate mind that adapts quickly'], emo: ['ต้องการความหลากหลายทางความคิด และเบื่อง่าย', 'needs mental variety and bores easily'], mask: ['ช่างคุย ว่องไว และมีหลายมุม', 'talkative, quick, many-sided'] },
        Cancer: { core: ['คนอ่อนไหวที่ผูกพันกับบ้านและคนที่รัก', 'a sensitive heart bonded to home and loved ones'], emo: ['ต้องการความรู้สึกปลอดภัยทางใจเป็นอันดับแรก', 'needs emotional safety above all'], mask: ['อบอุ่น คอยปกป้อง และระวังตัวเล็กน้อย', 'warm, protective and a little guarded'] },
        Leo: { core: ['คนภูมิใจในตัวเอง มีเสน่ห์ และอยากเปล่งประกาย', 'proud, magnetic, and born to shine'], emo: ['ต้องการการยอมรับและความรักอย่างจริงใจ', 'needs genuine recognition and love'], mask: ['สง่า มั่นใจ และดึงดูดสายตา', 'regal, confident and eye-catching'] },
        Virgo: { core: ['คนละเอียด ใฝ่พัฒนา รับใช้ด้วยการทำให้สิ่งต่างๆ ดีขึ้น', 'precise and improvement-driven, serving by making things better'], emo: ['สบายใจที่สุดเมื่อทุกอย่างเป็นระเบียบ', 'most at ease when things are in order'], mask: ['สุภาพ คมชัด และช่างสังเกต', 'polite, sharp and observant'] },
        Libra: { core: ['คนรักความสมดุลและความงาม มองหาความยุติธรรม', 'a lover of balance and beauty who seeks fairness'], emo: ['ต้องการความกลมเกลียวและคู่คิด', 'needs harmony and a partner to think with'], mask: ['มีเสน่ห์ทางสังคมและประนีประนอม', 'socially charming and diplomatic'] },
        Scorpio: { core: ['คนเข้มข้น ลึกซึ้ง มองทะลุเปลือกนอก', 'intense and deep, seeing past the surface'], emo: ['ต้องการความสัมพันธ์ที่จริงและลึก ไม่เอาผิวเผิน', 'needs real, deep connection — nothing shallow'], mask: ['ลึกลับ ทรงพลัง และอ่านยาก', 'mysterious, powerful and hard to read'] },
        Sagittarius: { core: ['คนรักอิสระ มองภาพใหญ่ และใฝ่หาความหมาย', 'a freedom-loving, big-picture seeker of meaning'], emo: ['ต้องการพื้นที่และการผจญภัย', 'needs space and adventure'], mask: ['ร่าเริง ตรงไปตรงมา และมองโลกกว้าง', 'cheerful, blunt and broad-minded'] },
        Capricorn: { core: ['คนมีวินัย มุ่งเป้า และสร้างเพื่อระยะยาว', 'disciplined and goal-driven, building for the long term'], emo: ['รู้สึกมั่นคงเมื่อเห็นความก้าวหน้าที่จับต้องได้', 'feels secure with tangible progress'], mask: ['สุขุม จริงจัง และน่าเชื่อถือ', 'composed, serious and trustworthy'] },
        Aquarius: { core: ['คนคิดต่าง มองอนาคต และทำเพื่อส่วนรวม', 'an original, future-facing mind working for the collective'], emo: ['ต้องการอิสระทางความคิดและมิตรภาพ', 'needs intellectual freedom and friendship'], mask: ['แปลก เป็นตัวของตัวเอง และเป็นมิตรแบบมีระยะ', 'original, independent and warmly detached'] },
        Pisces: { core: ['คนช่างฝัน เห็นอกเห็นใจ และไหลตามสัญชาตญาณ', 'a dreamy, empathetic soul who follows intuition'], emo: ['ซึมซับอารมณ์รอบตัว และต้องการพื้นที่หลบพัก', 'absorbs the emotions around it and needs a place to retreat'], mask: ['อ่อนโยน ลึกลับ เหมือนอยู่คนละโลก', 'gentle, mystical, slightly otherworldly'] },
    };
    const FALLBACK_TRAIT = { core: [`พลังของ${w.sunSignTh}`, `the qualities of ${w.sunSign}`], emo: [`จังหวะของ${w.moonSignTh}`, `the rhythm of ${w.moonSign}`], mask: [`แบบ${w.ascSignTh}`, `a ${w.ascSign} quality`] };
    const traitOf = (s) => SIGN_TRAITS[s] ?? FALLBACK_TRAIT;
    return section(4, tr('โหราศาสตร์ตะวันตก', 'Western Astrology'), '☀️', `
    <h2>${tr('ตำแหน่งดาวหลัก', 'Major planetary positions')}</h2>
    <table><tbody>
      ${row2(tr('☉ ดวงอาทิตย์', '☉ Sun'), `${sunLabel} — ${Math.round(w.sunDeg % 30)}° ${sunLabel}`)}
      ${row2(tr('☽ ดวงจันทร์', '☽ Moon'), `${moonLabel} — ${Math.round(w.moonDeg % 30)}° ${moonLabel}`)}
      ${row2(tr('ASC ราศีขึ้น', 'ASC Rising sign'), `${ascLabel} — ${Math.round(w.ascDeg % 30)}° ${ascLabel}`)}
      ${row2(tr('♃ ดาวพฤหัสฯ', '♃ Jupiter'), w.jupiterSign)}
      ${row2(tr('♄ ดาวเสาร์', '♄ Saturn'), w.saturnSign)}
      ${row2('Transit 2026', w.transitNote2026)}
    </tbody></table>

    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('บาบิโลน ~2,500 ปีก่อน แล้วกรีก (ปโตเลมี) วางเป็นระบบ 12 ราศีที่โลกใช้อยู่ทุกวันนี้', 'Babylonian, ~2,500 years ago; the Greeks (Ptolemy) shaped it into the twelve-sign zodiac the world still uses.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${box(tr('ดวงอาทิตย์ ☉ — แกนตัวตน', 'Sun ☉ — Core Identity'), tr(`ดวงอาทิตย์ใน${w.sunSignTh} — แกนตัวตนของคุณคือ${traitOf(w.sunSign).core[0]} นี่คือพลังสร้างสรรค์ที่คุณฉายออกสู่โลก และเป็นตัวจริงของคุณเมื่อได้เป็นตัวเองเต็มที่`, `Sun in ${w.sunSign} — at your core you are ${traitOf(w.sunSign).core[1]}. This is the creative force you project into the world, and who you are when you're most fully yourself.`), 'gold')}
    ${box(tr('ดวงจันทร์ ☽ — โลกภายใน', 'Moon ☽ — Inner World'), tr(`ดวงจันทร์ใน${w.moonSignTh} — ในโลกภายใน คุณ${traitOf(w.moonSign).emo[0]} นี่คือวิธีที่อารมณ์และความต้องการลึกที่สุดของคุณทำงาน และคุณจะสงบก็ต่อเมื่อมันได้รับการเติมเต็ม`, `Moon in ${w.moonSign} — inwardly, ${traitOf(w.moonSign).emo[1]}. This is how your emotions and deepest needs operate, and you settle only when that need is met.`), 'dark')}
    ${box(tr('ASC — หน้ากากโลก', 'ASC — Public Mask'), tr(`ราศีขึ้น${w.ascSignTh} — สิ่งแรกที่คนรับรู้จากคุณคือความ${traitOf(w.ascSign).mask[0]} ก่อนที่เขาจะได้รู้จักตัวจริงข้างใน — มันคือ "ประตูหน้า" ของบุคลิกคุณ`, `Rising ${w.ascSign} — the first thing people register is that you come across as ${traitOf(w.ascSign).mask[1]}, before they meet the real you inside — it's the "front door" of your personality.`), 'dark')}
    ${box('Transit 2026', w.transitNote2026, 'purple')}
    <!-- The Western page built its own boxes and never rendered w.reading, so the
         whole buildRichReading body — including the exact degrees and the
         planets that separate you from your own generation — was computed and
         thrown away on this page alone. -->
    ${box(tr('การตีความเต็ม', 'Full reading'), w.reading, 'gold')}
  `);
}
function p05_bazi(c) {
    const b = c.bazi;
    return section(5, tr('BaZi สี่เสา — Four Pillars of Destiny', 'BaZi — Four Pillars of Destiny'), '☯️', `
    <h2>${tr('ตารางสี่เสา', 'Four-Pillar Table')}</h2>
    <div class="grid-3" style="grid-template-columns:1fr 1fr 1fr 1fr">
      ${[
        { label: tr('ปีเกิด', 'Year Pillar'), s: b.yearStem, br: b.yearBranch, sth: b.yearStemTh, bth: b.yearBranchTh, dm: false },
        { label: tr('เดือนเกิด', 'Month Pillar'), s: b.monthStem, br: b.monthBranch, sth: b.monthStemTh, bth: b.monthBranchTh, dm: false },
        { label: tr('วันเกิด ★ Day Master', 'Day Pillar ★ Day Master'), s: b.dayStem, br: b.dayBranch, sth: b.dayStemTh, bth: b.dayBranchTh, dm: true },
        { label: tr('ชั่วโมงเกิด', 'Hour Pillar'), s: b.hourStem, br: b.hourBranch, sth: b.hourStemTh, bth: b.hourBranchTh, dm: false },
    ].map(p => `
        <div class="pillar ${p.dm ? 'dm' : ''}">
          <div class="sublabel">${esc(p.label)}</div>
          <div class="stem">${esc(p.s)}</div>
          <div style="font-size:10px;color:#9a8a72;margin:2px 0">${esc(p.sth)}</div>
          <div class="branch">${esc(p.br)}</div>
          <div style="font-size:10px;color:#9a8a72">${esc(p.bth)}</div>
        </div>`).join('')}
    </div>
    <table style="margin-top:12px"><tbody>
      ${row2('Day Master', `${b.dayStem} ${b.dayMasterTh} (${b.dayMasterPolarity === '+' ? 'Yang' : 'Yin'} ${b.dayMasterElement})`)}
      ${row2(tr('ธาตุโดดเด่น', 'Dominant Element'), b.dominantElement)}
      ${row2(tr('ธาตุที่ขาด', 'Missing Element'), b.missingElement || tr('ครบทุกธาตุ', 'All five present'))}
      ${row2(tr('ธาตุมงคล', 'Lucky Element'), b.luckyElement)}
      ${row2(tr('ธาตุที่ควรหลีกเลี่ยง', 'Element to Avoid'), b.avoidElement)}
      ${row2(tr('Luck Pillar ปัจจุบัน', 'Current Luck Pillar'), b.currentLuckPillarTh)}
    </tbody></table>
    <h2>${tr('การตีความ Day Master', 'Day Master Interpretation')}</h2>
    ${b.reading}
  `);
}
function p06_ninestar(c) {
    const n = c.ninestar;
    return section(6, tr('Nine Star Ki — นิยมในญี่ปุ่นและเกาหลี', 'Nine Star Ki — Japan & Korea\'s most-used system'), '⭐', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${n.star}</div>
        <div class="lbl">${tr('หมายเลขดาว', 'Star Number')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:18px">${n.star} ${esc(n.starName)}</div>
        <div class="lbl">${esc(n.starName)}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ธาตุ', 'Element'), n.starElement)}
      ${row2(tr('สีประจำดาว', 'Star Colour'), n.starColor)}
      ${row2(tr('ทิศทำงาน', 'Work Direction'), n.starDirection)}
      ${row2(tr('ทิศนอนหัว', 'Sleep Direction'), n.directionSleep)}
      ${row2(tr('สิ่งนำโชค 2026', 'Lucky Items 2026'), n.auspicious2026)}
    </tbody></table>
    ${box(tr('วิเคราะห์ปี 2026', '2026 Analysis'), n.year2026Analysis, n.star === 9 ? 'red' : 'gold')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ตาราง Lo Shu ของจีน ส่งต่อถึงญี่ปุ่นสมัยเฮอัน เป็น Kyusei Kigaku ที่ยังใช้เลือกทิศและจังหวะ', 'The Chinese Lo Shu square, carried into Heian Japan as Kyusei Kigaku, still used there to choose directions and timing.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${n.reading}
  `);
}
function p07_vedic(c) {
    const v = c.vedic;
    return section(7, tr('Vedic Jyotish — โหราศาสตร์ภารตะ (อินเดีย)', 'Vedic Jyotish — India\'s Ancient Star Science'), '🕉️', `
    <table><tbody>
      ${row2(tr('Lagna (ราศีขึ้น)', 'Lagna (Rising Sign)'), `${v.lagna} · ${v.lagnaSign}`)}
      ${row2(tr('นักษัตรดวงจันทร์', 'Moon Nakshatra'), `${v.moonNakshatra} ${tr('บาท', 'Pada')} ${v.nakshathraPada}`)}
      ${row2(tr('ดาวปกครองนักษัตร', 'Nakshatra Lord'), v.nakshatraLord)}
      ${row2(tr('มหาทศาปัจจุบัน', 'Current Mahadasha'), `${v.mahadasha} (${v.mahadashaPeriod})`)}
      ${row2(tr('อันตราทศา', 'Antardasha'), v.antardasha)}
    </tbody></table>
    ${box(tr('Yogas (ดาวอำนวยผล)', 'Yogas (Beneficial Combinations)'), v.yogas.map(y => `• ${y}`).join('<br>'), 'purple')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ศาสตร์ดาวของอินเดีย ~3,000 ปี อ่านจากดาวจริงบนฟ้า (sidereal) ไม่ใช่ราศีสมมุติแบบตะวันตก', 'Indian, ~3,000 years old, and read against the actual stars (sidereal) rather than the tropical signs the West uses.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${v.reading}
  `);
}
function p08_energyType(c) {
    const h = c.humandesign;
    const typeLabel = _lang === 'en' ? (h.type || h.typeTh) : h.typeTh;
    return section(8, tr('ระบบประเภทพลังงาน (Energy Type System)', 'Energy Type System'), '⚡', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(typeLabel)}</div>
        <div class="lbl">${tr('ประเภทพลังงาน', 'Energy Type')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:20px">${esc(h.profile)}</div>
        <div class="lbl">${tr('โปรไฟล์', 'Profile')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('กลยุทธ์ชีวิต', 'Life Strategy'), h.strategy)}
      ${row2(tr('ศูนย์กลางการตัดสินใจ', 'Decision Authority'), h.authority)}
      ${row2('Definition', h.definition)}
      ${row2('Incarnation Cross', h.incarnationCross)}
      ${row2('Sun Gate', `Gate ${h.sunGate}`)}
      ${row2('Earth Gate', `Gate ${h.earthGate}`)}
    </tbody></table>
    ${box(tr('โปรไฟล์ความหมาย', 'Profile Meaning'), h.profileDesc, 'gold')}
    ${box(tr('Channels สำคัญ', 'Key Channels'), h.channels.join('<br>'), 'dark')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Ra Uru Hu เสนอปี 1987 ผสม I Ching + โหราศาสตร์ + จักระ เป็นผังพลังงาน 9 ศูนย์', 'Proposed by Ra Uru Hu in 1987 — I Ching, astrology and the chakras folded into a nine-centre bodygraph.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${h.reading}
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">* ${tr('Energy Type System วิเคราะห์ตามหลักโบดีกราฟ ไม่ใช่คำแนะนำจากผู้ให้บริการใดโดยเฉพาะ', 'The Energy Type System analyses based on BodyGraph principles, not advice from any specific provider.')}</p>
  `);
}
function p09_mayan(c) {
    const m = c.mayan;
    return section(9, tr('มายัน Tzolk\'in', 'Mayan Tzolk\'in'), '🌀', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${m.kin}</div>
        <div class="lbl">Kin Number</div>
      </div>
      <div class="stat-card">
        <div class="val">${m.toneNumber}</div>
        <div class="lbl">${tr('โทนกาแล็กติก', 'Galactic Tone')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign', m.daySignNameTh)}
      ${row2('Galactic Tone', m.toneNameTh)}
      ${row2(tr('ทิศประจำ', 'Direction'), m.direction)}
      ${row2(tr('สีประจำ', 'Colour'), m.color)}
      ${row2('Wavespell', m.wavespell)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ปฏิทินศักดิ์สิทธิ์ 260 วันของชาวมายา (20 สัญลักษณ์ x 13 โทน) ยังนับใช้ในพิธีจริงถึงวันนี้', 'The Maya 260-day sacred round (20 signs x 13 tones) — still counted in ceremony today.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${m.reading}
  `);
}
function p10_celtic(c) {
    const ct = c.celtic;
    return section(10, tr('เซลติก Tree Calendar', 'Celtic Tree Calendar'), '🌳', `
    <div class="stat-card" style="margin-bottom:16px">
      <div class="val" style="font-size:20px">${ct.symbol} ${esc(_lang === 'en' ? ct.treeName : ct.treeNameTh)}</div>
      <div class="lbl">${esc(ct.treeName)} Tree</div>
    </div>
    <table><tbody>
      ${row2(tr('ดาวปกครอง', 'Ruling Planet'), ct.rulingPlanet)}
      ${row2(tr('อัญมณีนำโชค', 'Lucky Gemstone'), ct.gemstone)}
      ${row2(tr('ธาตุ', 'Element'), ct.element)}
      ${row2(tr('บุคลิกภาพ', 'Personality'), ct.personality)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ปฏิทินต้นไม้ของดรูอิด 13 ต้นตามรอบจันทร์ คนรู้จักกว้างขึ้นจาก The White Goddess (1948)', 'The druid thirteen-tree lunar calendar, brought to a wide audience by The White Goddess (1948).')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${ct.reading}
  `);
}
function p11_thai(c) {
    const t = c.thai;
    return section(11, tr('ไทยพราหมณ์', 'Thai Brahmin'), '🙏', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:18px">${esc(t.dayName)}</div>
        <div class="lbl">${tr('วันเกิด', 'Birth Day')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(t.dayColor)}</div>
        <div class="lbl">${tr('สีมงคล', 'Lucky Colour')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('เทพผู้ปกครอง', 'Ruling Deity'), `${t.dayGodTh} (${t.dayGod})`)}
      ${row2(tr('นักษัตรไทย', 'Thai Nakshatra'), t.nakshatra)}
      ${row2(tr('ด้านมงคล', 'Auspicious Domain'), t.fortuneDay)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('โหราศาสตร์ไทยรับจากพราหมณ์อินเดียกว่า 1,000 ปี ผสมความเชื่อไทยเป็นระบบเทพและสีประจำวัน', 'Thai astrology, taken from Indian Brahmin practice a thousand years ago and fused with local belief into the day-deity and day-colour system.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${t.reading}
    ${box(tr('คำแนะนำไทยพราหมณ์', 'Thai Brahmin Guidance'), tr(`ใส่สี${t.dayColor}ในวันสำคัญ ทำบุญวันเกิดให้${t.dayGodTh} อธิษฐานด้าน${t.fortuneDay}`, `Wear ${t.dayColor} on important days, make merit on your birth weekday in honour of ${t.dayGodTh}, and direct prayers towards matters of ${t.fortuneDay}.`), 'gold')}
  `);
}
function p12_numerology(c) {
    const n = c.numerology;
    return section(12, tr('เลขศาสตร์ — Life Path + Pythagorean + เลข ๗ ตัว', 'Numerology — Life Path + Pythagorean + Thai 7 Numbers'), '🔢', `
    <div class="grid-3">
      <div class="stat-card">
        <div class="val">${n.lifePath}</div>
        <div class="lbl">Life Path</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.personalYear2026}</div>
        <div class="lbl">${tr('ปีส่วนตัว 2026', 'Personal Year 2026')}</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.pythagorean}</div>
        <div class="lbl">Pythagorean</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Life Path', `${n.lifePath} — ${n.lifePathName}`)}
      ${row2(tr('ปีส่วนตัว 2026', 'Personal Year 2026'), `${n.personalYear2026} — ${n.personalYearMeaning}`)}
      ${row2(tr('เลข ๗ ตัว', 'Thai 7 Numbers'), n.thaiSeven.join(' · '))}
      ${row2('Destiny Number', n.destinyNumber.toString())}
    </tbody></table>
    ${box(tr('เลขชีวิต', 'Life Numbers'), n.reading, 'gold')}
    ${box(tr('ปีส่วนตัว 2026', 'Personal Year 2026'), n.personalYearMeaning, 'purple')}
    <p style="margin-top:8px">${esc(n.thaiSevenReading)}</p>
  `);
}
function p13_luckPillars(c) {
    const age2026 = 2026 - c.input.year;
    const { bazi, vedic, ninestar, numerology, biorhythm, vedicMahadasha } = c;
    const luckRows = bazi.luckPillars.map(lp => {
        const isCurrent = age2026 >= lp.ageStart && age2026 <= lp.ageEnd;
        // NSK decade: every 9 years a cycle completes
        const nskDecadeNote = ((lp.ageStart % 9) === 0) ? tr('NSK: เริ่มรอบใหม่', 'NSK: new cycle begins') : '';
        return `<tr ${isCurrent ? 'style="background:#1a1a08;border:1px solid #c8a45a44"' : ''}>
      <td style="font-size:12px">${esc(lp.ageStart)}–${esc(lp.ageEnd)}</td>
      <td style="font-size:18px">${esc(lp.stem)}${esc(lp.branch)}</td>
      <td style="font-size:11px;color:#9a8a72">${esc(lp.stemTh)} ${esc(lp.branchTh)}</td>
      <td style="font-size:11px;color:#6a8a60">${nskDecadeNote}</td>
      <td>${isCurrent ? `<span style="color:#c8a45a;font-weight:700">▶ ${tr('ปัจจุบัน', 'Current')}</span>` : ''}</td>
    </tr>`;
    }).join('');
    // NSK year trend 2026-2035
    const nskYears = Array.from({ length: 10 }, (_, i) => 2026 + i).map(yr => {
        const starForYear = ((9 - ((yr - 1) % 9)) % 9) + 1;
        const isGood = [starForYear].some(s => [1, 3, 6, 8, 9].includes(s));
        return `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${isGood ? '#1a3010' : '#2a1010'};color:${isGood ? '#60c060' : '#c06060'};margin:2px">${yr}:${starForYear}${isGood ? '✓' : '·'}</span>`;
    }).join('');
    // ── Life-arc synthesis: turn the pillar tables into a story ──
    const lps = bazi.luckPillars;
    const curIdx = lps.findIndex(lp => age2026 >= lp.ageStart && age2026 <= lp.ageEnd);
    const cur = curIdx >= 0 ? lps[curIdx] : (lps.length ? (age2026 < lps[0].ageStart ? lps[0] : lps[lps.length - 1]) : null);
    const nxt = curIdx >= 0 && curIdx < lps.length - 1 ? lps[curIdx + 1] : null;
    const pivotYear = nxt ? c.input.year + nxt.ageStart : null;
    const firstLp = lps[0], lastLp = lps[lps.length - 1];
    const lifeArc = cur ? tr(`ตอนนี้อายุ ${age2026} ปี อยู่ในเสา ${cur.stem}${cur.branch} (${cur.stemTh} ${cur.branchTh}) ครอบอายุ ${cur.ageStart}–${cur.ageEnd}<br>
     หนึ่งเสาคือหนึ่ง "บท" ของชีวิต ยาวราว 10 ปี แต่ละบทมีบุคลิกพลังงานคนละแบบ<br>
     ${nxt ? `บทถัดไปเริ่มราวปี ${pivotYear} ตอนคุณอายุ ${nxt.ageStart} เมื่อเปลี่ยนเป็นเสา ${nxt.stem}${nxt.branch}<br>
     จุดเปลี่ยนเสามักมาพร้อมการเปลี่ยนงาน เปลี่ยนเมือง หรือเปลี่ยนมุมมองครั้งใหญ่` : `คุณอยู่ในเสาท้ายๆ ของเส้นเวลานี้ — ช่วงของการสรุปและส่งต่อ`}`, `You're currently ${age2026}, inside the ${cur.stem}${cur.branch} pillar, spanning ages ${cur.ageStart}–${cur.ageEnd}. Each BaZi pillar is a roughly 10-year "chapter" of life, each with its own energetic character. ${nxt ? `Your next chapter begins around ${pivotYear} (when you turn ${nxt.ageStart}), as the energy shifts to the ${nxt.stem}${nxt.branch} pillar. These pillar changes often arrive with a job change, a move, or a major shift in outlook — knowing one is coming lets you prepare for the turn.` : `You're in one of the later pillars of this timeline — a phase for consolidating and passing on the wisdom gathered across a lifetime.`}`)
        : tr(`เส้นเวลาด้านล่างคือเสา BaZi แต่ละช่วง 10 ปีของชีวิตคุณ ซ้อนกับช่วงดาวของ Vedic และรอบเลขศาสตร์`, `The timeline below maps your BaZi pillars — each a 10-year span of life — layered with your Vedic planetary periods and numerology cycle.`);
    const lifeSpanNote = (firstLp && lastLp) ? tr(`เส้นเวลานี้ทอดยาวตั้งแต่อายุ ${firstLp.ageStart} ถึง ${lastLp.ageEnd} ปี — อ่านเป็นแผนที่ของทั้งชีวิต ไม่ใช่คำทำนายรายปี`, `This timeline spans ages ${firstLp.ageStart} to ${lastLp.ageEnd} — read it as a map of a whole life, not a year-by-year prophecy.`) : '';
    return section(14, tr('เส้นทาง 80 ปี — Multi-System Timeline', '80-Year Life Timeline — Multi-System View'), '🗺️', `
    <p style="font-size:12.5px;color:#c8c0a8;line-height:1.75;margin-bottom:6px">${lifeArc}</p>
    <p style="font-size:11px;color:#7a6a52;margin-bottom:10px">${lifeSpanNote}</p>
    <!-- BaZi Luck Pillars (main) -->
    <h2 style="font-size:14px;color:#c8a45a;margin-bottom:8px">🔥 ${tr('BaZi Luck Pillars — แกนหลัก 10 ปีต่อเสา', 'BaZi Luck Pillars — 10 years per pillar')}</h2>
    <table>
      <thead><tr><th>${tr('อายุ', 'Age')}</th><th>${tr('เสา', 'Pillar')}</th><th>${tr('ความหมาย', 'Meaning')}</th><th>NSK Note</th><th></th></tr></thead>
      <tbody>${luckRows}</tbody>
    </table>

    <!-- Current LP detail -->
    ${box(tr('Luck Pillar ปัจจุบัน', 'Current Luck Pillar'), `${bazi.currentLuckPillar} — ${bazi.currentLuckPillarTh}`, 'gold')}

    <!-- Vedic Mahadasha -->
    <h2 style="font-size:14px;color:#c090d0;margin:14px 0 8px">🕉️ ${tr('Vedic Mahadasha — ช่วงปกครองดาว', 'Vedic Mahadasha — Planetary Periods')}</h2>
    <div style="background:#120a1a;border:1px solid #5a3a8a;border-radius:8px;padding:12px">
      <div style="font-size:13px;color:#c090e0;font-weight:600">
        ${esc(vedicMahadasha.currentDasha)} Mahadasha ${tr('ถึงปี', 'until')} ${esc(String(vedicMahadasha.currentDashaEnd))}
      </div>
      <div style="font-size:12px;color:#9a70c0;margin-top:4px">${esc(vedicMahadasha.dashaQuality)}</div>
      <div style="font-size:11px;color:#7a5a9a;margin-top:4px">Antardasha: ${esc(vedicMahadasha.antardasha)}</div>
    </div>

    <!-- NSK Year Trend -->
    <h2 style="font-size:14px;color:#60b0c0;margin:14px 0 8px">⭐ NSK Year Stars 2026–2035</h2>
    <div style="background:#0a1215;border-radius:8px;padding:10px">${nskYears}
      <div style="font-size:10px;color:#4a7080;margin-top:6px">${tr('✓ = ดาวโชค (1,3,6,8,9) · · = ระมัดระวัง', '✓ = lucky stars (1, 3, 6, 8, 9) · · = caution year')}</div>
    </div>

    <!-- Numerology Personal Year pattern -->
    <h2 style="font-size:14px;color:#d0a060;margin:14px 0 8px">🔢 ${tr('Numerology — รอบชีวิต 9 ปี', 'Numerology — 9-Year Life Cycle')}</h2>
    <div style="background:#1a1208;border-radius:8px;padding:10px">
      <div style="font-size:12px;color:#c0a060">Personal Year 2026: <strong>${esc(String(numerology.personalYear2026))}</strong> — ${esc(numerology.personalYearMeaning.split('—')[0])}</div>
    </div>
    ${box(tr('จุดบรรจบของสามเส้นเวลา', 'Where these timelines converge'), tr(`สามศาสตร์มองช่วงนี้ของคุณพร้อมกัน<br>
       <strong>BaZi</strong> อยู่เสา ${cur ? `${cur.stemTh} ${cur.branchTh}` : '—'} · <strong>Vedic</strong> อยู่ช่วงดาว ${esc(vedicMahadasha.currentDasha)} ถึงปี ${esc(String(vedicMahadasha.currentDashaEnd))} (${esc(vedicMahadasha.dashaQuality)}) · <strong>เลขศาสตร์</strong> เป็น Personal Year ${esc(String(numerology.personalYear2026))}<br>
       ชี้ทางเดียวกัน = ช่วงเร่งเครื่อง ควรลงแรง<br>
       ชี้คนละทาง = ยึดเสา BaZi เพราะเป็นคลื่นที่ยาวที่สุดในชีวิตคุณ`, `Three systems read this season of your life at once — BaZi places you in the ${cur ? `${cur.stem}${cur.branch}` : '—'} pillar, Vedic in your ${esc(vedicMahadasha.currentDasha)} planetary period (until ${esc(String(vedicMahadasha.currentDashaEnd))}) ${esc(vedicMahadasha.dashaQuality)}, and numerology at Personal Year ${esc(String(numerology.personalYear2026))}. When all three point the same way it's an accelerate window worth your effort; when they diverge, follow the BaZi pillar first — it's the longest energy wave in your life.`), 'gold')}
  `);
}
function p14_health(c) {
    const { bazi, ninestar, vedic, humandesign, biorhythm, celtic, tibetan, thai, nativeAmerican, vedicMahadasha, norseRune } = c;
    const healthSignals = extractSignals(c, 'health');
    const good = healthSignals.filter(s => s.score >= 750);
    const warn = healthSignals.filter(s => s.score < 650);
    const EL_EXERCISE = {
        '甲': 'Weight Training / ยิม', '乙': 'Pilates / โยคะ', '丙': 'ว่ายน้ำ / ไตรกีฬา',
        '丁': 'โยคะ / ว่ายน้ำ', '戊': 'Hiking / เดิน', '己': 'เดิน / ไทชิ',
        '庚': 'Martial Arts / ฟันดาบ', '辛': 'เต้นรำ / ปิลาเตส', '壬': 'ว่ายน้ำ / พายเรือ', '癸': 'ว่ายน้ำ / ดำน้ำ'
    };
    // Map BaZi Day Master element → TCM organ pairing (well-established medical
    // tradition: ไม้→ตับ · ไฟ→หัวใจ · ดิน→ม้าม/กระเพาะ · โลหะ→ปอด · น้ำ→ไต)
    const ORGAN = { 'ไม้': 'ตับ+ถุงน้ำดี', 'ไฟ': 'หัวใจ+ลำไส้เล็ก', 'ดิน': 'ม้าม+กระเพาะ', 'โลหะ': 'ปอด+ลำไส้ใหญ่', 'น้ำ': 'ไต+กระเพาะปัสสาวะ' };
    const dmEl = bazi.dayMasterElement;
    const organ = ORGAN[dmEl] || '—';
    return section(20, tr('Health Coaching — ลักษณะประจำตัวจาก 26 ศาสตร์', 'Health Coaching — Constitutional Patterns from 26 Systems'), '🌿', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('สุขภาพตามดวง ≠ พยากรณ์รายวัน', 'Birth-chart health ≠ daily forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะประจำตัวด้านสุขภาพตลอดชีวิต</strong> ที่มาจากวันเกิด —
        เช่น อวัยวะที่เปราะบางตามธรรมชาติ · ชนิดกีฬาที่ร่างกายตอบสนองดี · จังหวะพลังงาน
        <strong>ไม่ใช่</strong> พยากรณ์วันนี้ว่าจะป่วยหรือไม่ · ${healthSignals.length} ศาสตร์เห็นตรงกัน ${good.length} เรื่อง`, `This page describes <strong>your lifelong health constitution</strong> derived from your birth chart —
         organs that are naturally vulnerable, sports your body responds to well, and your energy rhythm.
         It is <strong>not</strong> a daily forecast of illness. · ${healthSignals.length} systems analysed, ${good.length} in agreement.`)}
      </div>
    </div>

    <!-- Constitutional pattern -->
    <div style="background:#0a1510;border:1px solid #2a4a20;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:12px;color:#5a9a40;font-weight:600;margin-bottom:6px">🫀 ${tr('ลักษณะตามธาตุ Day Master (TCM)', 'Constitution by Day Master Element (TCM)')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.75">
        ${tr(`ธาตุ <strong>${esc(dmEl)}</strong> ของคุณคู่กับอวัยวะ <strong>${esc(organ)}</strong> ใน TCM —
        คืออวัยวะที่ <em>ทำงานหนักสุด</em> และ <em>เปราะบางก่อนสุด</em> เมื่ออายุมากขึ้น
        การดูแลป้องกันจึงควรเน้นที่จุดนี้เป็นอันดับแรก`, `Your <strong>${esc(dmEl)}</strong> element pairs with the organ system <strong>${esc(organ)}</strong> in Traditional Chinese Medicine — the organ that <em>works hardest</em> and <em>becomes vulnerable first</em> with age. Preventative care should prioritise this system.`)}
      </div>
    </div>

    <!-- Consensus positive -->
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#60c060;font-weight:600;margin-bottom:8px">✅ ${tr('จุดแข็งด้านสุขภาพ', 'Health strengths')} · ${good.length} ${tr('ศาสตร์เห็นตรงกัน', 'systems in agreement')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#0a1508;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#60a060;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#c8d8a8;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c06030;font-weight:600;margin-bottom:8px">⚠️ ${tr('จุดที่ต้องดูแลเฉพาะ', 'Areas needing focused care')} · ${warn.length} ${tr('ศาสตร์เตือน', 'systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a08;border-radius:6px;margin:4px 0;border-left:2px solid #8a3020">
          <span style="font-size:11px;min-width:100px;color:#c07050;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8a888;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    ${box(tr('ออกกำลังกายที่ร่างกายของคุณตอบสนองดีที่สุด', 'Movement your body responds to best'), tr(`<strong>${esc(EL_EXERCISE[bazi.dayStem] || 'เดิน/โยคะ')}</strong><br><br>เหตุผล: Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> เป็นธาตุ <strong>${esc(dmEl)}</strong> — กีฬานี้เสริมการไหลเวียนของ ${esc(organ)} โดยตรง นี่ไม่ใช่กฎหนึ่งสำหรับทุกคน แต่เป็นการจับคู่ระหว่างธาตุของคุณกับชนิดการเคลื่อนไหวที่ธาตุนั้นต้องการ`, `<strong>${esc(EL_EXERCISE[bazi.dayStem] || 'Walking / Yoga')}</strong><br><br>Why: your Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> is the <strong>${esc(dmEl)}</strong> element — this kind of movement directly supports circulation in your ${esc(organ)} system. Not a one-size-fits-all rule, but a pairing of your element with the type of motion that element naturally craves.`), 'green')}

    <div style="font-size:11px;color:#5a6a50;margin-top:8px">
      🏥 ${tr('รายงานนี้เพื่อการสำรวจตนเอง ไม่ใช่การวินิจฉัยทางการแพทย์ · หากมีอาการผิดปกติ ควรปรึกษาแพทย์ (ในไทย สายด่วน 1323 สุขภาพจิต)', 'This report is for self-exploration, not medical diagnosis. Consult a qualified physician for any concerning symptoms.')}
    </div>
  `);
}
function p15_finance(c) {
    const finSignals = extractSignals(c, 'finance');
    const good = finSignals.filter(s => s.score >= 750).sort((a, b) => b.score - a.score);
    const warn = finSignals.filter(s => s.score < 650);
    const { bazi, numerology, ninestar, arabicParts, hellenistic, ifaYoruba, vedicMahadasha } = c;
    return section(21, tr('Finance Coaching — แนวทางการเงินตามดวง', 'Finance Coaching — Financial Guidance from Your Chart'), '💰', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('การเงินตามดวง ≠ พยากรณ์หวย', 'Birth-chart finance ≠ lottery forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะทางการเงินประจำตัว</strong> — ว่าคุณเหมาะกับการลงทุนแบบไหน ความเสี่ยงระดับใด
        ช่วงเวลาของชีวิตที่ควรลงทุน/สะสม · <strong>ไม่ใช่</strong> การบอกตัวเลขผลตอบแทนหรือทำนายราคาทรัพย์สิน ·
        ${finSignals.length} ศาสตร์วิเคราะห์ โดย ${good.length} เห็นเสริมและ ${warn.length} เห็นเตือน`, `This page describes <strong>your innate financial pattern</strong> — what kind of investing suits you, your risk
         tolerance, and the life-phases best for accumulating versus deploying capital. It is <strong>not</strong> a return
         forecast or asset-price prediction. · ${finSignals.length} systems analysed: ${good.length} supportive, ${warn.length} cautionary.`)}
      </div>
    </div>

    <div style="background:#100a06;border:1px solid #4a3010;border-radius:6px;padding:8px 12px;font-size:11px;color:#8a6030;margin-bottom:12px">
      ⓘ ${tr('ข้อมูลประกอบการสำรวจตนเอง · ไม่ใช่คำแนะนำการลงทุน · ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจสำคัญ', 'For self-exploration only · not investment advice · consult a qualified professional before major decisions.')}
    </div>

    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c0a030;font-weight:600;margin-bottom:8px">💎 ${tr('จุดแข็งทางการเงิน', 'Financial strengths')} · ${good.length} ${tr('ศาสตร์เห็นพ้อง', 'systems concur')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#100d06;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#a08030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8c880;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c05030;font-weight:600;margin-bottom:8px">⚠️ ${tr('ข้อระวังทางการเงิน', 'Financial cautions')} · ${warn.length} ${tr('ศาสตร์เตือน', 'systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a06;border-radius:6px;margin:4px 0;border-left:2px solid #8a3010">
          <span style="font-size:11px;min-width:100px;color:#c07030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d89060;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Key synthesis -->
    ${box(tr('สรุปทิศทางการเงิน', 'Financial direction summary'), tr(`ธาตุมงคล${bazi.luckyElement} + Part of Fortune ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDashaKey) ? 'ช่วงขยายตัวทางการเงิน' : 'ช่วงสะสมและระมัดระวัง'}`, `Lucky element ${bazi.luckyElement} + Part of Fortune in ${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDashaKey) ? 'a phase of financial expansion' : 'a phase of accumulation and prudence'}`), 'gold')}

    <!-- 3-step plan -->
    <div style="font-size:13px;color:#d0a050;font-weight:600;margin:12px 0 8px">${tr('แผน 3 ขั้นจาก Consensus', '3-step plan from consensus')}</div>
    ${[
        [tr(`สะสมธาตุ${bazi.luckyElement}`, `Accumulate the ${bazi.luckyElement} element`),
            tr(`ลงทุนในสิ่งที่สอดคล้องกับ Day Master ${bazi.dayMasterTh} — ตามวิชาห้าธาตุ ธาตุที่คุณหล่อเลี้ยง คือทางที่ผลตอบแทนไหลกลับมา`, `Invest in what aligns with your Day Master ${bazi.dayMasterTh} — in five-element terms, the element your own nourishes is where returns flow back.`)],
        [tr(`ใช้ทิศ${ninestar.starDirection}`, `Use the ${ninestar.starDirection} direction`),
            tr(`NSK: ทิศทำงานและติดต่อธุรกิจในทิศ${ninestar.starDirection} ปี 2026`, `NSK: orient your work + business meetings towards ${ninestar.starDirection} during 2026`)],
        [`Personal Year ${numerology.personalYear2026}`,
            numerology.personalYearMeaning.split('—')[0] + tr(' — จังหวะที่ดีที่สุดสำหรับปีนี้', ' — the rhythm best suited to this year')],
    ].map(([title, desc], i) => `
      <div style="display:flex;gap:10px;padding:8px;border:1px solid #2a2010;border-radius:8px;margin:5px 0">
        <div style="background:#c8a45a;color:#0d0d15;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${i + 1}</div>
        <div><div style="font-weight:600;color:#c8a45a;font-size:13px">${esc(title)}</div><div style="font-size:11px;color:#9a8a72;margin-top:2px">${esc(desc)}</div></div>
      </div>`).join('')}
  `);
}
function p16_activation(c) {
    const { bazi, ninestar, numerology, humandesign, vedic, thai, celtic, tibetan, norseRune, kabbalistic, ifaYoruba, aboriginal, biorhythm, vedicMahadasha, onmyodo, zoroastrian, nativeAmerican, aztec, saju } = c;
    // Pull positive actions from all 26 systems — ranked by how many systems endorse
    const positives = [
        { icon: '🧭', pts: 0,
            title: tr(`หันหัวทิศ${ninestar.directionSleep}นอน`, `Sleep with your head pointing ${trDF(ninestar.directionSleep)}`),
            body: tr(`NSK Star ${ninestar.star}: ทิศนอน${ninestar.directionSleep} ยืนยันโดย Feng Shui พื้นฐาน`, `NSK Star ${ninestar.star}: sleep direction ${trDF(ninestar.directionSleep)}, confirmed by core Feng Shui`),
            systems: ['Nine Star Ki', 'BaZi Feng Shui'] },
        { icon: '🎯', pts: 0,
            title: tr(`ทำตาม Strategy "${humandesign.strategy}"`, `Follow your Strategy "${trDF(humandesign.strategy)}"`),
            body: tr(`Energy Type ${humandesign.typeTh}: หัวใจของ Human Design — ฝืนแล้วเหนื่อยเปล่า`, `Energy Type ${trDF(humandesign.typeTh)}: heart of Human Design — fight it and you exhaust yourself`),
            systems: ['Energy Type System', 'Kabbalistic'] },
        { icon: '🔥', pts: 0,
            title: tr(`เสริมธาตุ${bazi.luckyElement}ทุกวัน`, `Reinforce the ${trDF(bazi.luckyElement)} element daily`),
            body: tr(`BaZi: ธาตุมงคล${bazi.luckyElement} หนุน Day Master ${bazi.dayMasterTh}`, `BaZi: lucky element ${trDF(bazi.luckyElement)} supports Day Master ${trDF(bazi.dayMasterTh)}`),
            systems: ['BaZi', 'Saju (Korean)', 'Tibetan Mewa'] },
        { icon: '🎨', pts: 0,
            title: tr(`ใส่สี${ninestar.starColor}เป็น accent`, `Wear ${trDF(ninestar.starColor)} as an accent colour`),
            body: tr(`NSK ${ninestar.starChinese} + ไทยพราหมณ์${thai.dayName}: สี${ninestar.starColor}/${thai.dayColor}`, `NSK ${ninestar.starChinese} + Thai-Brahmin ${trDF(thai.dayName)}: ${trDF(ninestar.starColor)} / ${trDF(thai.dayColor)}`),
            systems: ['Nine Star Ki', 'Thai Brahmin', 'Celtic'] },
        { icon: '📝', pts: 0,
            title: tr(`Journal ทุกเช้า — ตั้งเจตนา`, `Journal every morning — set intentions`),
            body: tr(`Life Path ${numerology.lifePath} + Kabbalistic ${kabbalistic.sephira}: ความชัดเจนในความคิดเป็นพลังงาน`, `Life Path ${numerology.lifePath} + Kabbalistic ${kabbalistic.sephira}: clarity of thought IS energy`),
            systems: ['Numerology', 'Kabbalistic', 'Zoroastrian'] },
        { icon: '🙏', pts: 0,
            title: tr(`ทำพิธีกรรม${thai.dayName}`, `Perform a ritual on ${trDF(thai.dayName)}`),
            body: tr(`ไทยพราหมณ์ + Zoroastrian ${zoroastrian.dayYazataTh}: สักการะในวันเกิดของสัปดาห์`, `Thai-Brahmin + Zoroastrian ${zoroastrian.dayYazataTh}: honour the deity on your birth-weekday`),
            systems: ['Thai Brahmin', 'Zoroastrian', 'Onmyōdō'] },
        { icon: '🌿', pts: 0,
            title: tr(`ออกกำลังกาย 3x/สัปดาห์`, `Exercise 3× per week`),
            body: tr(`${celtic.treeNameTh} ธาตุ${celtic.element} + Native American ${nativeAmerican.birthTotemTh}: เคลื่อนไหวให้เข้ากับธาตุของคุณ`, `Celtic ${trDF(celtic.treeNameTh)} (${trDF(celtic.element)}) + Native American ${trDF(nativeAmerican.birthTotemTh)}: move in tune with your element`),
            systems: ['Celtic', 'Native American', 'Energy Type'] },
        { icon: '💬', pts: 0,
            title: tr(`รอ Response ก่อนลงมือ`, `Wait for the inner response before acting`),
            body: tr(`${humandesign.typeTh} · ${humandesign.authority}: ตัดสินใจตาม inner response`, `${trDF(humandesign.typeTh)} · ${humandesign.authority}: decide from the inner signal`),
            systems: ['Energy Type System', 'Norse Rune'] },
        { icon: '🗺️', pts: 0,
            title: tr(`วางแผนทิศ${ninestar.starDirection}`, `Plan around the ${trDF(ninestar.starDirection)} direction`),
            body: tr(`NSK ทิศโชค${ninestar.starDirection} ปี 2026: ใช้ทิศนี้ในการเดินทางและจัดโต๊ะทำงาน`, `NSK lucky direction ${trDF(ninestar.starDirection)} for 2026: use it for travel and work-desk orientation`),
            systems: ['Nine Star Ki', 'Arabic Parts'] },
        { icon: '🌟', pts: 0,
            title: tr(`เชื่อมกับ Odù ${ifaYoruba.odu}`, `Connect with Odù ${ifaYoruba.odu}`),
            body: tr(`Ifa/Yoruba: ${ifaYoruba.oduTh} — ${ifaYoruba.oduTheme}`, `Ifa/Yoruba: ${ifaYoruba.odu} — ${trDF(ifaYoruba.oduTheme)}`),
            systems: ['Ifa/Yoruba', 'Aboriginal'] },
    ];
    // Pull negative inputs (things to avoid) from low-scoring systems + BaZi avoidance
    const negatives = [
        { icon: '🚫',
            title: tr(`หลีกเลี่ยงธาตุ${bazi.avoidElement}`, `Avoid the ${trDF(bazi.avoidElement)} element`),
            body: tr(`BaZi: ธาตุ${bazi.avoidElement}กดพลังงาน Day Master — ลดสีและอาหารที่สอดคล้อง`, `BaZi: ${trDF(bazi.avoidElement)} suppresses your Day Master — reduce matching colours and foods`),
            source: 'BaZi' },
        { icon: '⚠️',
            title: tr(`ระวัง Self-Punishment 午午`, `Watch for Self-Punishment 午午`),
            body: tr(`BaZi: ${bazi.dayStem}${bazi.dayBranch} + ${bazi.yearStem}${bazi.yearBranch} มีแรงกดดันตัวเอง — อย่า overthink`, `BaZi: ${bazi.dayStem}${bazi.dayBranch} + ${bazi.yearStem}${bazi.yearBranch} carries self-pressure — don't overthink`),
            source: 'BaZi Self-Punch' },
        ...(c.score.breakdown.filter(b => b.score < 650 && b.scoring !== false && b.display !== false).map(b => ({
            icon: '⚠️',
            title: tr(`ระวัง: ${b.system}`, `Watch: ${trDF(b.system)}`),
            body: trDF(b.finding),
            source: trDF(b.system)
        }))),
        { icon: '🔴',
            title: tr(`${onmyodo.rokuyo} Birth Day — ระวังสิ่งนี้`, `${onmyodo.rokuyo} Birth Day — be aware`),
            body: tr(`Onmyōdō ${onmyodo.rokuyoTh}: วันเกิดมีพลังงาน${onmyodo.rokuyo} — ระมัดระวังในวันเดียวกันของสัปดาห์`, `Onmyōdō ${onmyodo.rokuyo}: your birth day carries ${onmyodo.rokuyo} energy — be cautious on the same weekday`),
            source: 'Onmyōdō' },
    ];
    // Score by system count (systems array length)
    positives.forEach(p => { p.pts = p.systems.length * 7 + (c.score.breakdown.find(b => b.system.includes(p.systems[0]?.split(' ')[0]))?.score || 700) / 100 | 0; });
    positives.sort((a, b) => b.pts - a.pts);
    // Compute cosmic score delta per action:
    // +1 point per endorsing system × 3 = small lift (3-system positive = +9)
    // Scaling is for visualisation only — users can see "doing this lifts your
    // consensus reading by ~X" even if the underlying score is fixed at birth.
    const cosmicDelta = (systemsCount) => systemsCount * 3;
    const cosmicDrain = (severity = 1) => -severity * 4;
    return section(18, tr('Activation Plan — ลำดับความสำคัญจาก 26 ศาสตร์', 'Activation Plan — Priority Actions from 26 Systems'), '🚀', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('วิธีอ่านและทำตาม', 'How to read this')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`แต่ละข้อถูก <strong>จัดลำดับความสำคัญจากจำนวนศาสตร์ที่เห็นพ้อง</strong> —
        ยิ่งหลายศาสตร์อิสระชี้ไปทางเดียวกัน ยิ่งมีน้ำหนัก`, `Each item is <strong>ranked by how many independent systems agree on it</strong> — the more traditions point the same direction, the more weight it carries.`)}<br>
        <strong style="color:#60c060">[+X]</strong> = ${tr('คาดว่าเสริม Cosmic Score Consensus ประมาณ +X จุด', 'expected to lift your Cosmic Score Consensus by ~X points')} ·
        <strong style="color:#c06060">[−X]</strong> = ${tr('ลด Consensus ถ้าทำสิ่งที่ขัดกับดวง', 'reduces consensus when you act against your chart')}<br>
        <span style="color:#6a5a42">${tr('หมายเหตุ: Cosmic Score ของวันเกิดคงที่ตลอดชีวิต — ตัวเลขนี้คือ "การใช้ชีวิตให้สอดคล้องกับดวง" ที่ชัดเจนขึ้น ไม่ใช่เปลี่ยนดวง', 'Note: your birth-chart Cosmic Score is fixed for life — this number reflects how aligned you\'re living with it, not a change to the chart itself.')}</span>
      </div>
    </div>

    <div style="font-size:13px;font-weight:600;color:#60c060;margin-bottom:8px">✅ ${tr('สิ่งที่ควรทำ · Priority-ranked (เรียงจากศาสตร์เห็นพ้องมากสุด)', 'What to do · Priority-ranked (most-agreed-upon first)')}</div>
    ${positives.slice(0, 8).map((a, n) => {
        const delta = cosmicDelta(a.systems.length);
        const priority = n < 3 ? 'HIGH' : n < 6 ? 'MEDIUM' : 'LOW';
        const priorityColor = n < 3 ? '#c8a45a' : n < 6 ? '#c0a060' : '#7a6a52';
        return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid ${n < 3 ? '#c8a45a' : '#2a2010'};border-radius:8px;margin:6px 0;background:${n < 3 ? '#12101c' : '#0a0a10'}">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:34px">
          <span style="font-size:22px">${a.icon}</span>
          <span style="font-size:8px;letter-spacing:1px;color:${priorityColor};margin-top:2px">${priority}</span>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#c8a45a;font-size:13px">${n + 1}. ${esc(a.title)}</span>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:10px;color:#60a060;background:#0a1a0e;padding:2px 8px;border-radius:10px">${a.systems.length} ${tr('ศาสตร์ตรงกัน', 'agree')}</span>
              <span style="font-size:10px;color:#60c060;background:#0a1a0e;padding:2px 8px;border-radius:10px">+${delta}</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${esc(a.body)}</div>
          <div style="font-size:10px;color:#7a9070;margin-top:4px">${tr('ที่มา:', 'Sources:')} ${a.systems.slice(0, 3).map(s => '<strong>' + esc(s.replace(/\$\{[^}]*\}/g, '')) + '</strong>').join(' · ')}${a.systems.length > 3 ? ` +${(a.systems.length - 3)} ${tr('อื่นๆ', 'more')}` : ''}</div>
        </div>
      </div>`;
    }).join('')}

    <div style="font-size:13px;font-weight:600;color:#c05030;margin:16px 0 8px">🚫 ${tr('สิ่งที่ควรหลีกเลี่ยง · ลดความสอดคล้องกับดวง', 'What to avoid · reduces alignment with your chart')}</div>
    ${negatives.map(n => {
        const drain = cosmicDrain(1);
        return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid #3a1510;border-radius:8px;margin:5px 0;background:#1a0a08">
        <span style="font-size:20px">${n.icon}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#d07050;font-size:12.5px">${esc(n.title)}</span>
            <span style="font-size:10px;color:#c06060;background:#1a0a08;border:1px solid #4a2020;padding:2px 8px;border-radius:10px">${drain}</span>
          </div>
          <div style="font-size:11px;color:#c8a890;margin-top:3px;line-height:1.55">${esc(n.body)}</div>
          <div style="font-size:10px;color:#7a4030;margin-top:3px">${tr('ที่มา:', 'Source:')} <strong>${esc(n.source)}</strong></div>
        </div>
      </div>`;
    }).join('')}
  `);
}
function p17_weekly(c) {
    // Energy ของแต่ละวันมาจาก 3 ศาสตร์พร้อมกัน:
    //   1. ดาวประจำวัน (Planetary day ruler) — ไทยพราหมณ์/Hellenistic convention
    //   2. ธาตุของวัน (5-element day cycle)
    //   3. สีมงคลประจำวัน (ไทย/Vedic convention)
    // ผสานกับ Day Master ของผู้ใช้ → บอก "พลังประจำวัน" ที่เหมาะกับคุณ
    const { bazi, ninestar, humandesign, thai, celtic } = c;
    const dmEl = bazi.dayMasterElement;
    // Day-of-week cosmology (Vedic / Hellenistic / ไทยพราหมณ์ — all agree on the 7-planet system)
    const daysData = [
        { name: tr('จันทร์', 'Monday'), planet: tr('จันทร์ · Moon', 'Moon'), element: tr('น้ำ', 'Water'), color: tr('เหลือง', 'Yellow'), energy: tr('สัญชาตญาณ · อารมณ์', 'Intuition · Emotion') },
        { name: tr('อังคาร', 'Tuesday'), planet: tr('อังคาร · Mars', 'Mars'), element: tr('ไฟ', 'Fire'), color: tr('ชมพู', 'Pink'), energy: tr('ลงมือ · ความกล้า · การแข่งขัน', 'Action · Courage · Competition') },
        { name: tr('พุธ', 'Wednesday'), planet: tr('พุธ · Mercury', 'Mercury'), element: tr('ไม้', 'Wood'), color: tr('เขียว', 'Green'), energy: tr('สื่อสาร · เจรจา · สอน', 'Communication · Negotiation · Teaching') },
        { name: tr('พฤหัสบดี', 'Thursday'), planet: tr('พฤหัส · Jupiter', 'Jupiter'), element: tr('ไม้', 'Wood'), color: tr('ส้ม', 'Orange'), energy: tr('ขยายตัว · การเรียนรู้ · โชคลาภ', 'Expansion · Learning · Fortune') },
        { name: tr('ศุกร์', 'Friday'), planet: tr('ศุกร์ · Venus', 'Venus'), element: tr('โลหะ', 'Metal'), color: tr('ฟ้าอ่อน', 'Light Blue'), energy: tr('ความสัมพันธ์ · ศิลปะ · ความงาม', 'Relationships · Art · Beauty') },
        { name: tr('เสาร์', 'Saturday'), planet: tr('เสาร์ · Saturn', 'Saturn'), element: tr('ดิน', 'Earth'), color: tr('ดำ/ม่วง', 'Black/Purple'), energy: tr('วินัย · โครงสร้าง · ความอดทน', 'Discipline · Structure · Endurance') },
        { name: tr('อาทิตย์', 'Sunday'), planet: tr('อาทิตย์ · Sun', 'Sun'), element: tr('ไฟ', 'Fire'), color: tr('แดง', 'Red'), energy: tr('อัตตา · ความเป็นผู้นำ · ชื่อเสียง', 'Self · Leadership · Renown') },
    ];
    // ศาสตร์ 5 ธาตุ: เสริม (SHENG) · ควบคุม (KE) · กลาง
    const SHENG = { 'น้ำ': 'ไม้', 'ไม้': 'ไฟ', 'ไฟ': 'ดิน', 'ดิน': 'โลหะ', 'โลหะ': 'น้ำ' };
    const KE = { 'น้ำ': 'ไฟ', 'ไฟ': 'โลหะ', 'โลหะ': 'ไม้', 'ไม้': 'ดิน', 'ดิน': 'น้ำ' };
    const rate = (dayEl) => {
        if (dayEl === dmEl)
            return { label: tr('☀️ พลังเท่าตัว', '☀️ Full power'), color: '#c8a45a', why: tr('ธาตุของวันตรงกับ Day Master — ดึงพลังของตัวเองมาใช้ได้ 100%', 'The day\'s element matches your Day Master — 100% of your native energy available.') };
        if (SHENG[dayEl] === dmEl)
            return { label: tr('🟢 วันที่หล่อเลี้ยง', '🟢 A nourishing day'), color: '#60a060', why: tr(`${dayEl} สร้าง ${dmEl} ในวงจร 5 ธาตุ — ได้รับการหล่อเลี้ยง`, `${dayEl} produces ${dmEl} in the 5-element cycle — you receive nourishment.`) };
        if (SHENG[dmEl] === dayEl)
            return { label: tr('🟡 วันที่คุณให้', '🟡 A day you give'), color: '#c0a060', why: tr(`${dmEl} สร้าง ${dayEl} — คุณเป็นผู้ให้ รู้สึกภูมิใจแต่เหนื่อยง่าย`, `${dmEl} produces ${dayEl} — you\'re the giver: proud but easily depleted.`) };
        if (KE[dayEl] === dmEl)
            return { label: tr('🔴 วันที่ต้องตั้งรับ', '🔴 A day to play defence'), color: '#c06060', why: tr(`${dayEl} ควบคุม ${dmEl} ใน 5 ธาตุ — ต้องยับยั้งชั่งใจ ไม่ฝืน`, `${dayEl} controls ${dmEl} in the 5-element cycle — restraint over force.`) };
        if (KE[dmEl] === dayEl)
            return { label: tr('⚠️ วันที่ต้องระวังรีดพลัง', '⚠️ A day that drains'), color: '#c08060', why: tr(`${dmEl} ควบคุม ${dayEl} — คุณเอาชนะได้แต่ใช้พลังมาก`, `${dmEl} controls ${dayEl} — you can win, but the cost is high.`) };
        return { label: tr('· กลาง', '· Neutral'), color: '#9a8a72', why: tr('ธาตุไม่เชื่อมโยงกัน — วันปกติ ไม่เร่ง ไม่หยุด', 'Elements unrelated — an ordinary day, neither pushing nor pausing.') };
    };
    const strategy = humandesign.strategy || 'Follow inner authority';
    return section(17, tr('Weekly Energy Plan — พลังงาน 7 วันต่อดวงของคุณ', 'Weekly Energy Plan — 7-day rhythm against your chart'), '📅', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('Energy ของแต่ละวันคืออะไร', 'What each weekday\'s energy means')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`ปฏิทิน 7 วันของโลกไม่ใช่เรื่องบังเอิญ — <strong>ไทยพราหมณ์ · Hellenistic · Vedic</strong> ทั้ง 3 ศาสตร์ตกลงว่าแต่ละวันอยู่ใต้การปกครองของดาวคนละดวง
        ซึ่งมีธาตุและพลังงานของมันเอง`, `The world's 7-day calendar is not coincidence — <strong>Thai Brahmin · Hellenistic · Vedic</strong> all agree that each day is ruled by a different planet, each with its own element and energy.`)}<br>
        ${tr(`ตารางด้านล่างเทียบ <strong>ธาตุของวัน</strong> กับ <strong>Day Master ของคุณ (${esc(bazi.dayMasterTh)} · ธาตุ${esc(dmEl)})</strong> แล้วบอกว่าวันไหนหล่อเลี้ยง วันไหนรีดพลัง`, `The table below compares <strong>each day's element</strong> against <strong>your Day Master (${esc(bazi.dayMasterTh)} · ${esc(dmEl)})</strong> and tells you which days nourish you and which drain you.`)}
      </div>
    </div>

    <table>
      <thead><tr>
        <th>${tr('วัน / ดาว', 'Day / Planet')}</th>
        <th>${tr('ธาตุ', 'Element')}</th>
        <th>${tr('พลังงานเด่น', 'Dominant Energy')}</th>
        <th>${tr('vs ดวงคุณ', 'vs Your Chart')}</th>
      </tr></thead>
      <tbody>
        ${daysData.map((d) => {
        const r = rate(d.element);
        const isBirthDay = d.name === thai.dayName;
        return `<tr ${isBirthDay ? 'style="background:#12101c"' : ''}>
            <td>
              <div style="font-weight:600;color:${isBirthDay ? '#c8a45a' : '#c8c0a8'}">${esc(d.name)}${isBirthDay ? ' ★' : ''}</div>
              <div style="font-size:10px;color:#7a6a52;margin-top:2px">${esc(d.planet)}</div>
            </td>
            <td style="font-size:11.5px;color:#c8a45a">${esc(d.element)}</td>
            <td style="font-size:11px;color:#c8c0a8">${esc(d.energy)}</td>
            <td style="font-size:11px;color:${r.color}">${esc(r.label)}<div style="color:#7a6a52;font-size:9.5px;margin-top:2px">${esc(r.why)}</div></td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>

    ${box(tr(`วันเกิดของคุณ = ${esc(thai.dayName)} ★`, `Your Birth Weekday = ${esc(thai.dayName)} ★`), tr(`ในทางไทยพราหมณ์ วันเกิดคือวัน "ขอพร" — เทพประจำ${esc(thai.dayName)} (${esc(thai.dayGodTh || thai.dayGod || '—')}) เปิดรับคำขอพิเศษ ควรงดเนื้อสัตว์ / ทำบุญ / ตั้งจิตในวันนี้ทุกสัปดาห์<br><br>ส่วน <strong>Strategy Human Design</strong> ของคุณคือ "${esc(strategy)}" — ใช้ทุกวันเป็นแกนตัดสินใจ ไม่ใช่แค่วันเกิด`, `In Thai Brahmin tradition, your birth weekday is the day for <em>asking blessings</em> — your day-deity ${esc(thai.dayName)} (${esc(thai.dayGodTh || thai.dayGod || '—')}) is most receptive to special petitions. Consider abstaining from meat, making merit, and setting intentions on this weekday throughout the year.<br><br>Your <strong>Human Design Strategy</strong> is "${esc(strategy)}" — use it as your decision compass every day, not only on your birth weekday.`), 'gold')}
  `);
}
function p18_monthly2026(c) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const monthStars = [2, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8, 7];
    const starNames = ['', '一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];
    const STAR_EL = { 1: 'Water', 2: 'Earth', 3: 'Wood', 4: 'Wood', 5: 'Earth', 6: 'Metal', 7: 'Metal', 8: 'Earth', 9: 'Fire' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const KE = { Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood' };
    const natal = c.ninestar.star;
    // (Biorhythm removed from this static report 2026-06-10 — it's a daily-changing
    // value that lives in the live Daily Pulse, not in a one-time monthly forecast.)
    // Vedic monthly quality (based on dasha sub-period)
    const vedicMonthQuality = months.map((_, mi) => {
        const py = ((c.numerology.personalYear2026 - 1 + mi) % 9) + 1;
        return [1, 3, 6, 8].includes(py) ? tr('ดี', 'Good') : [5].includes(py) ? tr('ระวัง', 'Caution') : tr('ปานกลาง', 'Mixed');
    });
    // PY bonus (Numerology) replaces the old biorhythm bonus as the second voice.
    const pyBonus = (mi) => {
        const py = ((c.numerology.personalYear2026 - 1 + mi) % 9) + 1;
        return [1, 3, 6, 8].includes(py) ? 1 : py === 5 ? -1 : 0;
    };
    const natalEl = STAR_EL[natal] ?? 'Water'; // the READER's birth-star element
    function monthRating(ms, mi) {
        let base = 0;
        if (ms === natal)
            base = 3;
        else if (SHENG[STAR_EL[ms] ?? ''] === natalEl)
            base = 2; // month star feeds yours
        else if (KE[STAR_EL[ms] ?? ''] === natalEl)
            base = -1; // month star controls yours
        if (ms === 5)
            base -= 1;
        const total = base + pyBonus(mi);
        const icon = ms === natal ? '🌟' : total >= 2 ? '🟢' : total >= 0 ? '🟡' : '🔴';
        return { icon, score: total };
    }
    // Synthesis: surface the standout months instead of leaving them in the table.
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lbl = (i) => _lang === 'en' ? monthsEn[i] : months[i];
    const monthEval = months.map((_, i) => ({ i, r: monthRating(monthStars[i], i), honmei: monthStars[i] === natal }));
    const bestM = monthEval.filter(e => e.r.icon === '🌟' || e.r.icon === '🟢').map(e => lbl(e.i));
    const _honmeiE = monthEval.find(e => e.honmei);
    const honmeiM = _honmeiE ? lbl(_honmeiE.i) : '';
    const honmeiPyDown = !!_honmeiE && pyBonus(_honmeiE.i) < 0;
    const cautionM = monthEval.filter(e => e.r.icon === '🔴').map(e => lbl(e.i));
    const monthSynthesis = tr(`เดือนที่พลังหนุนที่สุดของปี 2026 คือ <strong>${bestM.join(', ') || '—'}</strong>${honmeiM ? ` (โดยเฉพาะ <strong>${honmeiM}</strong> ที่เป็น Honmei — เดือนดาวเกิดของคุณซึ่งมาปีละครั้ง${honmeiPyDown ? ' · แต่ Numerology ของเดือนนั้นอยู่ช่วง "ระวัง" — แรงมาเต็มแต่ต้องคุมมือ ไม่ใช่เดือนที่เสี่ยงแบบไม่คิด' : ''})` : ''} — เก็บเรื่องใหญ่ เปิดตัว หรือเริ่มสิ่งสำคัญไว้ทำช่วงนี้ · ส่วนเดือนที่ควรตั้งหลักคือ <strong>${cautionM.join(', ') || 'ไม่มีเดือนที่ท้าทายเด่นชัด'}</strong> ใช้ช่วงนั้นทบทวนและเตรียมตัวแทนการบุก`, `Your most supported months in 2026 are <strong>${bestM.join(', ') || '—'}</strong>${honmeiM ? ` (especially <strong>${honmeiM}</strong>, your Honmei — the birth-star month that comes once a year${honmeiPyDown ? '; note its Numerology month reads "caution", so the power is there but it rewards a steady hand rather than a blind push' : ''})` : ''} — save your big launches and important starts for these. The months to steady yourself are <strong>${cautionM.join(', ') || 'none stand out as challenging'}</strong>; use them to reflect and prepare rather than push.`);
    return section(16, tr('พยากรณ์รายเดือน 2026 — NSK + Numerology', 'Monthly Forecast 2026 — NSK + Numerology'), '🗓️', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('วิธีอ่านตารางนี้', 'How to read this table')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('ตารางนี้เทียบ 2 ศาสตร์ <strong>ที่คำนวณอิสระจากกัน</strong> ในแต่ละเดือนของปี 2026 — เดือนที่ทั้งสองเห็นพ้องว่า "ดี" คือเดือนที่ควรลงมือ; เดือนที่ไม่สอดคล้อง ควรนิ่งและสังเกต', 'This table compares 2 systems <strong>that calculate independently</strong> for each month of 2026 — months where both agree on "good" are months to act; months that disagree are for stillness and observation.')}
        <br><br>
        <strong style="color:#c8a45a">NSK</strong> = ${tr(`ดาวประจำเดือน (เทียบกับดาวเกิด ${natal} ${esc(c.ninestar.starChinese || '')})`, `monthly star (vs your birth star ${natal} ${esc(c.ninestar.starChinese || '')})`)} ·
        ${natal} ${tr('ตรงเมื่อไหร่', 'aligning')} = <strong>Honmei</strong> = ${tr('ปีเกิดทุก 9 ปี', 'your birth-star month every 9 years')}<br>
        <strong style="color:#c8a45a">PY-pattern</strong> = ${tr(`สถานะ Numerology ของเดือน (คำนวณจาก Personal Year ${c.numerology.personalYear2026})`, `numerology month status (derived from your Personal Year ${c.numerology.personalYear2026})`)}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>${tr('เดือน', 'Month')}</th>
          <th>${tr('NSK ดาวเดือน', 'NSK Month Star')}</th>
          <th>PY-pattern</th>
          <th>Consensus</th>
          <th>${tr('แนะนำ', 'Advice')}</th>
        </tr>
      </thead>
      <tbody>
        ${months.map((m, i) => {
        const ms = monthStars[i];
        const nskRating = monthRating(ms, i);
        const isHonmei = ms === natal;
        const adviceTh = nskRating.icon === '🌟' ? tr('Honmei — ตั้งเป้าหมายใหญ่', 'Honmei — set big goals')
            : nskRating.icon === '🟢' ? tr('ลงมือทำได้เลย · พลังเสริม', 'Act now · energy supports')
                : nskRating.icon === '🟡' ? tr('ค่อยๆ ขยับ · ไม่เร่ง', 'Move gradually · don\'t rush')
                    : tr('ระวังและสังเกต · ไม่รีบตัดสินใจ', 'Watch & observe · don\'t decide hastily');
        return `<tr>
            <td style="font-weight:600">${esc(lbl(i))}</td>
            <td style="font-size:11px">${ms} ${esc(starNames[ms])}${isHonmei ? ' ★' : ''}</td>
            <td style="font-size:11px;color:#9a8a72">${esc(vedicMonthQuality[i])}</td>
            <td style="text-align:center;font-size:16px">${nskRating.icon}</td>
            <td style="font-size:11px;color:#9a8a72">${esc(adviceTh)}</td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>
    ${box(tr('สรุป: เดือนไหนควรลงมือ', 'At a glance: when to act'), monthSynthesis, 'green')}
    <div style="font-size:10.5px;color:#9a8a72;margin-top:10px;line-height:1.7">
      ${tr(`ไอคอนมาจากคะแนนรวม NSK + Numerology · 🌟 <strong>Honmei</strong> = ดาวเดือนตรงกับดาวเกิด ${natal} (ปีละ 1 เดือน · ทับทุกเงื่อนไข) · 🟢 ตั้งแต่ 2 คะแนนขึ้นไป · 🟡 0–1 · 🔴 ติดลบ — คอลัมน์ PY-pattern คือเสียงของ Numerology เพียงเสียงเดียว จึงอาจสวนกับไอคอนรวมได้`, `The icon is the combined NSK + Numerology score · 🌟 <strong>Honmei</strong> = the month star matches your birth star ${natal} (once a year; it overrides the rest) · 🟢 2 points or more · 🟡 0–1 · 🔴 negative — the PY-pattern column is the Numerology voice alone, so it can read against the combined icon.`)}
      <br>
      <span style="color:#6a5a42">${tr('หมายเหตุ: ไม่ใช่ "ดวงดี / ดวงแย่" — เป็นสัญญาณของช่วงเวลาที่ <strong>พลังงานสอดคล้อง vs ต้องระวัง</strong> เท่านั้น', 'Note: not "good fate / bad fate" — only a signal of when <strong>energy aligns vs. when caution is warranted</strong>.')}</span>
    </div>
  `);
}
function p19_decade(c) {
    const currentAge = 2026 - c.input.year;
    const lps = c.bazi.luckPillars;
    const { vedicMahadasha, ninestar, numerology, bazi } = c;
    const dmEl = bazi.dayMasterElement;
    // Personal-Year formula: standard Pythagorean numerology = reduce(month+day+year).
    // Use INTEGER arithmetic only — the old (1 + month/12) variant produced
    // fractional PYs like 4.5 which the user flagged.
    const pyForYear = (year) => {
        const digitSum = (n) => String(n).split('').reduce((a, b) => a + (+b), 0);
        let s = digitSum(c.input.month) + digitSum(c.input.day) + digitSum(year);
        while (s > 9 && s !== 11 && s !== 22 && s !== 33)
            s = digitSum(s);
        return s;
    };
    // Archetype meaning per life stage + the reason it maps to your chart.
    // Advice is derived from Day Master + dominant LP stem/branch, not a generic
    // one-line filler. Decade 25–34 can be ลงมือลุย vs พักค้นหา depending on
    // which element supports dmEl at that Luck Pillar.
    const SHENG_BY = { 'ไม้': 'น้ำ', 'ไฟ': 'ไม้', 'ดิน': 'ไฟ', 'โลหะ': 'ดิน', 'น้ำ': 'โลหะ' };
    const feedEl = SHENG_BY[dmEl] || 'น้ำ';
    const decades = [
        { age: '25–34', label: tr('วัยสร้างรากฐาน', 'Foundation Years'),
            why: tr(`ช่วงที่ Day Master ${dmEl} ต้องการ ${feedEl} หล่อเลี้ยง — ทุกประสบการณ์คือวัตถุดิบ`, `A phase where your ${dmEl} Day Master needs ${feedEl} to nourish it — every experience is raw material.`) },
        { age: '35–44', label: tr('วัยลงมือสร้าง', 'Building Years'),
            why: tr(`พลังงาน ${dmEl} ถึงจุดอิ่มตัว — เหมาะต่อยอดที่สะสมไว้ให้เห็นผลเป็นรูปธรรม`, `Your ${dmEl} energy reaches saturation — time to compound what you've stored into concrete results.`) },
        { age: '45–54', label: tr('วัยเก็บเกี่ยว', 'Harvest Years'),
            why: tr('Luck Pillar เปลี่ยนทิศ — สิ่งที่ลงแรงในสองทศวรรษก่อนเริ่มให้ดอกผล', 'Your Luck Pillar shifts direction — what you sowed across the prior two decades begins to bear fruit.') },
        { age: '55–64', label: tr('วัยถ่ายทอด', 'Transmission Years'),
            why: tr(`พลัง ${dmEl} เริ่มถอย — คุณค่าเปลี่ยนจาก "ทำเอง" เป็น "สอน / mentoring"`, `Your ${dmEl} force begins to recede — value shifts from "doing" to "teaching / mentoring".`) },
        { age: '65+', label: tr('วัยปัญญา', 'Wisdom Years'),
            why: tr('ชั้นของ experience สะสมเป็น wisdom — ถึงเวลาใช้บทเรียนสร้างมรดก', 'Layers of experience compound into wisdom — time to translate the lessons into legacy.') },
    ];
    const NSK_CHAR = {
        1: tr('白 น้ำขาว', '白 White Water'),
        2: tr('黒 ดินดำ', '黒 Black Earth'),
        3: tr('碧 ไม้น้ำเงิน', '碧 Blue Wood'),
        4: tr('緑 ไม้เขียว', '緑 Green Wood'),
        5: tr('黄 ดินเหลือง', '黄 Yellow Earth'),
        6: tr('白 โลหะขาว', '白 White Metal'),
        7: tr('赤 โลหะแดง', '赤 Red Metal'),
        8: tr('白 ดินขาว', '白 White Earth'),
        9: tr('紫 ไฟม่วง', '紫 Purple Fire'),
    };
    const NSK_THEME = {
        1: tr('สายน้ำที่ไหลลึก · ปัญญาภายใน', 'Deep flowing water · inner wisdom'),
        2: tr('แผ่นดิน · รักษาความสัมพันธ์', 'Earth · sustaining relationships'),
        3: tr('แตกหน่อ · เริ่มต้น · สื่อสาร', 'Sprouting · beginning · communication'),
        4: tr('ลม / ไม้โต · ยืดหยุ่นและเดินทาง', 'Wind / mature wood · flexibility & travel'),
        5: tr('ศูนย์กลาง · พลิกผันใหญ่', 'The centre · large reversals'),
        6: tr('โลหะผู้นำ · บริหารและอำนาจ', 'Leadership metal · administration & authority'),
        7: tr('โลหะร่าเริง · ความสุขและวัตถุ', 'Joyful metal · pleasure & material life'),
        8: tr('ภูเขา · เปลี่ยนผ่านและสะสม', 'Mountain · transition & accumulation'),
        9: tr('ไฟ · ชื่อเสียงและแสงสว่าง', 'Fire · renown & illumination'),
    };
    return section(15, tr('Decade by Decade — มุมมอง 4 ศาสตร์ซ้อนกัน', 'Decade by Decade — 4-System Layered View'), '📖', `
    <div style="font-size:11.5px;color:#9a8a72;margin-bottom:12px;line-height:1.7">
      ${tr('แต่ละทศวรรษอ่านจาก 4 แกนพร้อมกัน — <strong>BaZi Luck Pillar</strong> (ฉากหลัง 10 ปี) + <strong>Nine Star Ki</strong> (พลังงานเด่นของรอบ 9 ปี) + <strong>Vedic Mahadasha</strong> (เทพครองช่วง) + <strong>Numerology Personal Year</strong> (ธีมเฉพาะปีเริ่ม). เมื่อทั้งสี่ศาสตร์ชี้ไปทางเดียวกัน นั่นคือสัญญาณแรงที่สุด', 'Each decade is read across 4 axes simultaneously — <strong>BaZi Luck Pillar</strong> (10-year backdrop) + <strong>Nine Star Ki</strong> (9-year cycle\'s dominant energy) + <strong>Vedic Mahadasha</strong> (planet ruling the period) + <strong>Numerology Personal Year</strong> (theme of the opening year). When all four point the same direction, the signal is strongest.')}
    </div>

    ${decades.map((d, i) => {
        const ageStart = parseInt(d.age);
        const ageEnd = parseInt(d.age.split('–')[1] || '999');
        const lp = lps.find(lp => lp.ageEnd >= ageStart && lp.ageStart <= ageEnd) || lps[Math.min(i, lps.length - 1)];
        const isNow = currentAge >= ageStart && currentAge <= ageEnd;
        const decadeStartYear = c.input.year + ageStart;
        // Third private copy of the nine-star year formula, removed. Its own
        // comment claimed it matched calcNineStar — it put 2024 on star 2 where
        // the almanac and _fcNineStarYear both say 3, so this page disagreed
        // with the 10-year table AND the 80-year table. One function now.
        const nskStar = (0, calc_1._fcNineStarYear)(decadeStartYear);
        const py = pyForYear(decadeStartYear);
        const dashaOverlap = vedicMahadasha.currentDashaEnd >= decadeStartYear;
        const mahadashaLabel = dashaOverlap
            ? tr(`${vedicMahadasha.currentDasha} (ช่วงปัจจุบัน)`, `${vedicMahadasha.currentDasha} (current period)`)
            : tr(`หลัง ${vedicMahadasha.currentDasha} · รอบใหม่`, `After ${vedicMahadasha.currentDasha} · new cycle`);
        return `<div style="border:1px solid ${isNow ? '#c8a45a' : '#2a2010'};border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:${isNow ? '#12101c' : '#0a0a10'};padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;color:${isNow ? '#c8a45a' : '#c8a45a'}">${esc(d.age)} · ${esc(d.label)}</span>
          ${isNow ? `<span style="color:#c8a45a;font-size:11px">▶ ${tr('ยุคปัจจุบันของคุณ', 'Your current era')}</span>` : ''}
        </div>
        <div style="padding:12px 14px;font-size:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div>🔥 <strong>BaZi Luck Pillar:</strong><br><span style="color:#9a8a72">${esc(lp.stem)}${esc(lp.branch)} · ${esc(lp.stemTh)} ${esc(lp.branchTh)} <span style="color:#6a5a42">(${tr('อายุ', 'ages')} ${esc(lp.ageStart)}–${esc(lp.ageEnd)})</span></span></div>
            <div>⭐ <strong>Nine Star Ki:</strong><br><span style="color:#9a8a72">${tr('ดาว', 'Star')} ${nskStar} ${esc(NSK_CHAR[nskStar] || '')}</span></div>
            <div>🕉️ <strong>Vedic Mahadasha:</strong><br><span style="color:#9a8a72">${esc(mahadashaLabel)}</span></div>
            <div>🔢 <strong>Personal Year ${decadeStartYear}:</strong><br><span style="color:#9a8a72">PY ${py} ${tr('(ธีมรอบเริ่มทศวรรษ)', '(theme that opens the decade)')}</span></div>
          </div>
          <div style="background:#0d0d15;border-left:3px solid #c8a45a;padding:8px 10px;margin-top:6px">
            <div style="font-size:10px;color:#c8a45a;letter-spacing:1px;margin-bottom:4px">${tr(`ทำไมช่วงนี้ถูกเรียกว่า "${esc(d.label)}"`, `Why this stage is called "${esc(d.label)}"`)}</div>
            <div style="color:#c8c0a8;line-height:1.6">${esc(d.why)} ${tr(`NSK ${nskStar} สะท้อนธีม "<strong>${esc(NSK_THEME[nskStar] || '')}</strong>" คู่ไปกับ Luck Pillar ${esc(lp.stemTh)} — สองศาสตร์ชี้ทิศเดียวกันคือสัญญาณหลัก`, `NSK ${nskStar} echoes the theme "<strong>${esc(NSK_THEME[nskStar] || '')}</strong>" alongside Luck Pillar ${esc(lp.stemTh)} — two systems pointing the same direction is the headline signal.`)}</div>
          </div>
        </div>
      </div>`;
    }).join('')}

    ${box(tr('ช่วงทองในชีวิต', 'Golden Era of Your Life'), tr(`ตอนนี้คุณอยู่ใน <strong>Luck Pillar ${c.bazi.currentLuckPillar} (${c.bazi.currentLuckPillarTh})</strong> + <strong>NSK Star ${ninestar.star} ${ninestar.starChinese}</strong> + <strong>Vedic ${vedicMahadasha.currentDasha} Dasha</strong> — 3 ศาสตร์จาก 3 วัฒนธรรมที่คำนวณอย่างอิสระ ชี้ตรงกันว่าเป็นช่วงสำคัญของชีวิต`, `You are currently in <strong>Luck Pillar ${c.bazi.currentLuckPillar} (${c.bazi.currentLuckPillarTh})</strong> + <strong>NSK Star ${ninestar.star} ${ninestar.starChinese}</strong> + <strong>Vedic ${vedicMahadasha.currentDasha} Dasha</strong> — three independent traditions across three cultures all converge on this being a pivotal phase of your life.`), 'green')}
  `);
}
function p20_colors(c) {
    const { ninestar, bazi, thai, celtic } = c;
    // Each color has a traceable source + one-line "why"
    const sources = [];
    if (ninestar.starColor)
        sources.push({
            el: ninestar.starElement,
            color: ninestar.starColor,
            source: tr(`Nine Star Ki (ดาว ${ninestar.star} ${ninestar.starChinese || ''})`, `Nine Star Ki (Star ${ninestar.star} ${ninestar.starChinese || ''})`),
            why: tr(`ดาวเกิดของคุณคือดาว ${ninestar.star} — ${ninestar.starColor}คือสีสัญลักษณ์ของดาวนี้ในโหราศาสตร์ญี่ปุ่น Feng Shui ใช้ค่านี้เป็น accent สำคัญ`, `Your birth star is Star ${ninestar.star} — ${ninestar.starColor} is the symbolic colour of this star in Japanese astrology. Feng Shui uses it as a key accent colour.`),
        });
    const bzColor = bazi.luckyElement === 'ไฟ' ? tr('แดง / ส้ม', 'Red / Orange')
        : bazi.luckyElement === 'ไม้' ? tr('เขียว', 'Green')
            : bazi.luckyElement === 'น้ำ' ? tr('ดำ / น้ำเงิน', 'Black / Blue')
                : bazi.luckyElement === 'โลหะ' ? tr('ขาว / เงิน', 'White / Silver')
                    : tr('เหลือง / น้ำตาล', 'Yellow / Brown');
    sources.push({
        el: bazi.luckyElement,
        color: bzColor,
        source: `BaZi (Day Master ${bazi.dayMasterTh})`,
        why: tr(`ธาตุมงคลของคุณคือ <strong>${bazi.luckyElement}</strong> — สีนี้สะท้อนธาตุที่ <em>หล่อเลี้ยง</em> Day Master ${bazi.dayMasterTh} ตามวงจร 5 ธาตุจีน`, `Your lucky element is <strong>${bazi.luckyElement}</strong> — this colour reflects the element that <em>nourishes</em> your Day Master ${bazi.dayMasterTh} in the Chinese 5-element cycle.`),
    });
    if (thai.dayColor)
        sources.push({
            color: thai.dayColor,
            source: tr(`ไทยพราหมณ์ (${thai.dayName})`, `Thai Brahmin (${thai.dayName})`),
            why: tr(`คุณเกิดวัน<strong>${thai.dayName}</strong> — ในโหราศาสตร์ไทย สีของเทพประจำวันคือ ${thai.dayColor} ซึ่งช่วยเรียกพลังงานของเทพผู้คุ้มครอง`, `You were born on <strong>${thai.dayName}</strong> — in Thai astrology, the day-deity\'s colour is ${thai.dayColor}, which calls forth the energy of your guardian deity.`),
        });
    // Celtic element → associated color fallback (CelticData doesn't expose a
    // tree color field, so we map from the ruling element).
    const CELTIC_EL_COLOR = {
        'ไม้': tr('เขียวมรกต', 'Emerald Green'),
        'ไฟ': tr('ส้มทอง', 'Golden Orange'),
        'ดิน': tr('น้ำตาลอบอุ่น', 'Warm Brown'),
        'โลหะ': tr('เงินมุก', 'Pearl Silver'),
        'น้ำ': tr('ฟ้าคราม', 'Indigo Blue'),
    };
    const celticColor = CELTIC_EL_COLOR[celtic.element] || '';
    if (celticColor)
        sources.push({
            el: celtic.element,
            color: celticColor,
            source: `Celtic (${celtic.treeNameTh || celtic.treeName})`,
            why: tr(`ต้นไม้ประจำวันเกิดของคุณคือ <strong>${celtic.treeNameTh || celtic.treeName}</strong> — ธาตุ${celtic.element} ของต้นไม้นี้สัมพันธ์กับสี ${celticColor}`, `Your birth tree is <strong>${celtic.treeName}</strong> — its ${celtic.element} element associates with the colour ${celticColor}.`),
        });
    // A source whose element IS the avoid element is not a lucky colour for this
    // chart, whatever its own tradition says in isolation.
    const _avoidEls = String(bazi.avoidElement || '').split(/\s+/).filter(Boolean);
    const clashes = sources.filter(x => x.el && _avoidEls.includes(x.el));
    const goodSources = sources.filter(x => !(x.el && _avoidEls.includes(x.el)));
    // Colour words that read as the avoid element under Chinese wuxing, even when
    // the tradition that recommended them assigns them to a different element.
    const WUXING_COLOUR_WORDS = {
        'โลหะ': ['ขาว', 'เงิน', 'White', 'Silver'],
        'ไม้': ['เขียว', 'Green'],
        'ไฟ': ['แดง', 'ส้ม', 'Red', 'Orange'],
        'ดิน': ['เหลือง', 'น้ำตาล', 'Yellow', 'Brown'],
        'น้ำ': ['ดำ', 'น้ำเงิน', 'Black', 'Blue'],
    };
    const _overlaps = goodSources.filter(x => _avoidEls.some(el => (WUXING_COLOUR_WORDS[el] || []).some(w => x.color.includes(w))));
    const avoidColor = bazi.avoidElement === 'ไฟ' ? tr('แดงสด', 'Bright Red')
        : bazi.avoidElement === 'น้ำ' ? tr('ดำสนิท', 'Solid Black')
            : bazi.avoidElement === 'ไม้' ? tr('เขียวเข้ม', 'Deep Green')
                : bazi.avoidElement === 'โลหะ' ? tr('เงินแท้ / โครเมียม', 'Pure Silver / Chrome')
                    : tr('เหลืองฉูดฉาด', 'Loud Yellow');
    return section(20, tr('สีมงคลและการแต่งตัว — ที่มาจาก 4 ศาสตร์', 'Lucky Colours & Style — Sourced from 4 Systems'), '👗', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('ทำไม "สีมงคล" ของคุณ = สีเหล่านี้ ไม่ใช่สีอื่น', 'Why your "lucky colours" = these specific shades')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('แต่ละสีถูกเลือกจากศาสตร์คนละศาสตร์ที่คำนวณอิสระจากกัน ยิ่งสีไหนปรากฏซ้ำในหลายศาสตร์ ยิ่งมีน้ำหนัก', 'Each colour is selected by an independent system. Colours that recur across multiple traditions carry more weight.')}
      </div>
    </div>

    <h2>${tr('สีที่แนะนำ', 'Recommended Colours')} · ${goodSources.length} ${tr('ศาสตร์ยืนยัน', 'systems concur')}</h2>
    ${goodSources.map(s => `
      <div style="border-left:3px solid #c8a45a;background:#0d0d15;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div style="font-family:'Sarabun',sans-serif;font-size:16px;font-weight:700;color:#c8a45a">${esc(s.color)}</div>
          <div style="font-size:10.5px;color:#7a6a52">${tr('ที่มา:', 'Source:')} <strong>${esc(s.source)}</strong></div>
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${s.why}</div>
      </div>
    `).join('')}

    ${clashes.length ? `<h2 style="margin-top:18px">${tr('สีที่ศาสตร์หนึ่งเชียร์ แต่ BaZi ค้าน', 'Colours one system likes and BaZi does not')}</h2>
    ${clashes.map(s => `
      <div style="border-left:3px solid #6a5a32;background:#14100a;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div style="font-family:'Sarabun',sans-serif;font-size:15px;font-weight:700;color:#c8a45a">${esc(s.color)}</div>
          <div style="font-size:10.5px;color:#7a6a52">${esc(s.source)}</div>
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${tr(`ศาสตร์นี้ให้สีนี้เพราะธาตุ <strong>${esc(s.el || '')}</strong> — แต่ธาตุนั้นคือธาตุที่ BaZi ของคุณบอกให้เลี่ยง จึงไม่ใช่สีมงคลสำหรับดวงคุณ ใช้ได้เป็นของประดับเล็กๆ ตามธรรมเนียมของศาสตร์นั้น ไม่ใช่สีหลัก`, `This tradition assigns the colour via the <strong>${esc(s.el || '')}</strong> element — which is the element your BaZi tells you to reduce. Keep it as a small token if the tradition matters to you, not as a primary colour.`)}</div>
      </div>`).join('')}` : ''}

    ${_overlaps.length ? `<div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:10px 14px;margin:10px 0;font-size:11px;color:#9a8a72;line-height:1.7">${tr(`⚠️ <strong>${esc(_overlaps.map(x => x.color).join(' / '))}</strong> โผล่ทั้งฝั่งสีมงคลและฝั่งสีที่ควรลด<br>
       เพราะสองฝั่งใช้คนละระบบ — ตารางบนมาจากศาสตร์ที่มีแผนที่สีของตัวเอง ส่วน "สีที่ควรลด" อ่านตามระบบ 5 ธาตุจีน ซึ่งนับขาว/เงินเป็นธาตุ${esc(_avoidEls.join('/'))}<br>
       <strong>เอาไปใช้:</strong> ใส่เป็นชิ้นเล็กได้ แต่อย่าใช้โลหะเงาเป็นสีหลัก`, `⚠️ Read this with the next section: <strong>${esc(_overlaps.map(x => x.color).join(' / '))}</strong> above comes from a tradition using a different colour map than Chinese wuxing (Nine Star Ki calls Star 1 一<strong>白</strong>水星 — white, but classes it as <strong>Water</strong>), while "colours to reduce" speaks in wuxing, where white and silver are ${esc(_avoidEls.join('/'))}. Not a contradiction — two systems. In practice: fine as a small accent, not as a primary metallic finish.`)}</div>` : ''}

    <h2 style="margin-top:18px">${tr('สีที่ควรลด (ไม่ใช่ห้าม)', 'Colours to Reduce (not forbidden)')}</h2>
    <div style="border-left:3px solid #c01020;background:#1a0a0a;padding:10px 14px;border-radius:0 8px 8px 0">
      <div style="font-size:15px;font-weight:700;color:#f08080">${esc(avoidColor)}</div>
      <div style="font-size:11.5px;color:#e8a880;margin-top:4px">${tr(`ธาตุระวังของคุณคือ <strong>${esc(bazi.avoidElement)}</strong> — สีนี้ "กด" Day Master ${esc(bazi.dayMasterTh)} ตามวงจร 5 ธาตุจีน ใช้เป็นสีหลักบ่อยๆ อาจทำให้รู้สึกหมดพลัง`, `Your element to avoid is <strong>${esc(bazi.avoidElement)}</strong> — this colour "suppresses" your Day Master ${esc(bazi.dayMasterTh)} in the Chinese 5-element cycle. Using it as a primary colour too often may leave you feeling drained.`)}</div>
    </div>

    ${box(tr('คำแนะนำการแต่งกายรายวัน', 'Daily Dressing Guidance'), tr(`• <strong>ปกติ:</strong> ใส่${esc(goodSources[0]?.color || bzColor)}เป็น accent (1 ชิ้น/วัน — เครื่องประดับ เน็คไท กระเป๋า)<br>` +
        `• <strong>วันสำคัญ:</strong> ใส่สีมงคลเต็มชุด (เลือกจาก ${goodSources.map(s => s.color).join(' / ')})<br>` +
        `• <strong>ประชุม / ขอขึ้นเงินเดือน:</strong> ${esc(bzColor)} (ธาตุ${esc(bazi.luckyElement)})<br>` +
        `• <strong>อัญมณีนำโชค:</strong> ${esc(celtic.gemstone || '—')} (จาก Celtic)`, `• <strong>Everyday:</strong> wear ${esc(goodSources[0]?.color || bzColor)} as an accent (one item per day — jewellery, tie, bag)<br>` +
        `• <strong>Important days:</strong> dress fully in lucky colours (choose from ${goodSources.map(s => s.color).join(' / ')})<br>` +
        `• <strong>Meetings / asking for a raise:</strong> ${esc(bzColor)} (${esc(bazi.luckyElement)} element)<br>` +
        `• <strong>Lucky gemstone:</strong> ${esc(celtic.gemstone || '—')} (from Celtic tradition)`), 'gold')}
  `);
}
function p21_historicalFigures(c) {
    const FIGURE_POOL = [
        { name: 'Steve Jobs', years: '1955–2011', element: 'ไฟ', lifePath: [1, 5, 7], nsk: [1, 4, 9],
            why: tr(`ผู้บุกเบิกด้วยพลังงาน${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} + ความกล้าทำลายกรอบเดิม`, `A pioneer fuelled by ${c.bazi.dayMasterElement} energy + Life Path ${c.numerology.lifePath} + the courage to break frames.`) },
        { name: 'Albert Einstein', years: '1879–1955', element: 'ไม้', lifePath: [7, 11, 3], nsk: [3, 6, 9],
            why: tr(`Life Path ${c.numerology.lifePath} สู่ความจริงอันลึกซึ้ง + ${c.western.sunSignTh}ที่ให้ปัญญาและสัญชาตญาณ`, `Life Path ${c.numerology.lifePath} drawn toward deep truth + ${c.western.sunSign} granting insight and intuition.`) },
        { name: 'Marie Curie', years: '1867–1934', element: 'น้ำ', lifePath: [7, 6, 9], nsk: [1, 8, 6],
            why: tr(`ความลึกของ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} + ความอดทนสู่ความสำเร็จที่ยิ่งใหญ่`, `The depth of ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} + the patience that compounds into monumental achievement.`) },
        { name: 'Leonardo da Vinci', years: '1452–1519', element: 'ไม้', lifePath: [5, 11, 3], nsk: [3, 4, 9],
            why: tr(`ครีเอทีฟสูงสุดจาก${c.bazi.dayMasterElement} + Celtic ${c.celtic.treeName} + ความอยากรู้ไม่สิ้นสุด`, `Peak creativity from ${c.bazi.dayMasterElement} + Celtic ${c.celtic.treeName} + an inexhaustible curiosity.`) },
        { name: 'Frida Kahlo', years: '1907–1954', element: 'ไฟ', lifePath: [3, 9, 6], nsk: [9, 3, 7],
            why: tr(`พลังสร้างสรรค์จากภายใน + ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} ที่โดดเด่น`, `Creative force from within + ${c.bazi.dayMasterElement} element + a NSK ${c.ninestar.star} that stands out.`) },
        { name: 'Nikola Tesla', years: '1856–1943', element: 'โลหะ', lifePath: [1, 7, 11], nsk: [1, 7, 4],
            why: tr(`ดาว${c.ninestar.star} + ธาตุ${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} ผสานจินตนาการและวิทยาศาสตร์`, `Star ${c.ninestar.star} + ${c.bazi.dayMasterElement} element + Life Path ${c.numerology.lifePath} fusing imagination with science.`) },
        { name: 'Coco Chanel', years: '1883–1971', element: 'ดิน', lifePath: [8, 4, 1], nsk: [8, 2, 6],
            why: tr(`ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} หนุนรสนิยมและการสร้างตัวตน`, `${c.bazi.dayMasterElement} element + NSK ${c.ninestar.star} backing taste and self-construction.`) },
        { name: 'Laozi (老子)', years: tr('ราว 600 ปีก่อน ค.ศ.', 'c. 600 BCE'), element: 'น้ำ', lifePath: [7, 9, 4], nsk: [1, 6, 8],
            why: tr(`ความลึกของน้ำธาตุ + ปัญญาที่เกิดจากการสังเกต — Life Path ${c.numerology.lifePath}`, `The depth of the water element + wisdom born of observation — Life Path ${c.numerology.lifePath}.`) },
    ];
    // Score each figure by matching: element match (+3), lifePath match (+2), nsk match (+2), base from chart
    const dm = c.bazi.dayMasterElement;
    const lp = c.numerology.lifePath;
    const ns = c.ninestar.star;
    const scoredFigures = FIGURE_POOL.map(f => {
        const hits = [f.element === dm, f.lifePath.includes(lp), f.nsk.includes(ns)];
        const matchPts = (hits[0] ? 3 : 0) + (hits[1] ? 2 : 0) + (hits[2] ? 2 : 0);
        const matched = hits.filter(Boolean).length;
        const matchedOn = [
            hits[0] ? tr('ธาตุ', 'element') : null,
            hits[1] ? 'Life Path' : null,
            hits[2] ? tr('ดาว NSK', 'NSK star') : null,
        ].filter(Boolean).join(' · ');
        return { ...f, matched, matchedOn, matchPts };
    });
    const figures = scoredFigures.sort((a, b) => b.matchPts - a.matchPts).slice(0, 4);
    return section(21, tr('บุคคลประวัติศาสตร์ — ดวงคล้ายคุณ', 'Historical Figures — Charts Like Yours'), '🏛️', `
    <p style="margin-bottom:12px">${tr('จับคู่จาก 3 เกณฑ์ของ<strong>ดวงคุณ</strong> (ธาตุ · Life Path · ดาว NSK) กับโปรไฟล์เชิงสัญลักษณ์ที่เราผูกไว้กับแต่ละคน — <strong>ไม่ใช่ดวงชะตาจริงของบุคคลเหล่านี้</strong> (หลายท่านไม่มีเวลาเกิดที่ยืนยันได้) และไม่ใช่คำทำนายว่าคุณจะเป็นแบบเขา', 'Matched on three features of <strong>your</strong> chart (element, Life Path, NSK star) against a symbolic profile we attach to each figure — NOT these people’s actual natal charts, and not a prediction that you\'ll become like them, but a glimpse of where this kind of energy can lead.')}</p>
    ${figures.map(f => `
      <div style="border:1px solid #2a2010;border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:#0a0a10;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-weight:700;color:#c8a45a">${esc(f.name)}</span>
            <span style="font-size:11px;color:#6a5a42;margin-left:8px">${esc(f.years)}</span>
          </div>
          <div style="text-align:right">
            <span style="font-size:18px;font-weight:700;color:#c8a45a">${f.matched}/3</span>
            <div style="font-size:9px;color:#6a5a42">${tr('เกณฑ์ที่ตรงกัน', 'criteria matched')}${f.matchedOn ? ` · ${esc(f.matchedOn)}` : ''}</div>
          </div>
        </div>
        <div style="padding:10px 14px;font-size:12px;color:#9a8a72">${esc(f.why)}</div>
      </div>`).join('')}
  `);
}
function p22_painPoints(c) {
    const dmEl = c.bazi.dayMasterElement;
    const missingEl = c.bazi.missingElement || (dmEl === 'ไม้' ? 'โลหะ' : dmEl === 'ไฟ' ? 'น้ำ' : dmEl === 'ดิน' ? 'ไม้' : dmEl === 'โลหะ' ? 'ไฟ' : 'ดิน');
    // Element-conditional bits used in the strings below — calculate once so
    // the bilingual strings can interpolate cleanly without long ternaries.
    const dmEmotion = dmEl === 'โลหะ' ? tr('ชอบเก็บไว้ในใจ', 'tend to keep things internal')
        : dmEl === 'ไฟ' ? tr('ระเบิดอารมณ์ง่าย', 'prone to emotional outbursts')
            : dmEl === 'น้ำ' ? tr('ลึกและเปลี่ยนแปลง', 'deep and shifting')
                : dmEl === 'ดิน' ? tr('มั่นคงแต่เปิดตัวช้า', 'steady but slow to open up')
                    : tr('ยืดหยุ่นแต่เรียกร้องอิสระ', 'flexible but craving independence');
    const missingTaste = missingEl === 'ไม้' ? tr('เปรี้ยว', 'sour')
        : missingEl === 'ไฟ' ? tr('ขม', 'bitter')
            : missingEl === 'ดิน' ? tr('หวานธรรมชาติ', 'naturally sweet')
                : missingEl === 'โลหะ' ? tr('เผ็ดเบา', 'lightly pungent')
                    : tr('เค็มเบา', 'lightly salty');
    const missingActivity = missingEl === 'น้ำ' ? tr('ว่ายน้ำ/สมาธิ', 'swimming / meditation')
        : missingEl === 'ไฟ' ? tr('ออกกำลังกลางแจ้ง', 'outdoor exercise')
            : missingEl === 'ดิน' ? tr('เดินเท้าเปล่าบนดิน', 'walking barefoot on earth')
                : missingEl === 'โลหะ' ? tr('หายใจลึก', 'deep breathing')
                    : tr('ปลูกต้นไม้/เดินป่า', 'planting / forest walks');
    const points = [
        { icon: '❤️', topic: tr('ความรัก & ความสัมพันธ์', 'Love & Relationships'),
            systems: ['Western (Moon)', 'BaZi (Day Master)', 'Human Design'],
            why: tr(`ดวงจันทร์ของคุณอยู่ใน<strong>${c.western.moonSignTh}</strong> — ต้องการความมั่นคงทางอารมณ์แบบเฉพาะ · Day Master <strong>${c.bazi.dayMasterTh}</strong> ธาตุ${dmEl}ทำให้การแสดงอารมณ์มีรูปแบบเฉพาะ — ${dmEmotion}`, `Your Moon sits in <strong>${c.western.moonSign}</strong> — needing a specific kind of emotional stability. Your Day Master <strong>${c.bazi.dayMasterTh}</strong> (${dmEl} element) shapes how you express feelings — you ${dmEmotion}.`),
            challenge: tr(`การผสมของ ${c.western.moonSignTh} (Moon) + ธาตุ${dmEl} (BaZi) ทำให้คุณ <em>ต้องการความใกล้ชิดอย่างลึกซึ้ง</em> แต่ <em>แสดงออกยาก</em> — 3 ศาสตร์อิสระชี้แบบเดียวกัน`, `The blend of ${c.western.moonSign} Moon + ${dmEl} Day Master means you <em>crave deep intimacy</em> but <em>find it hard to express</em> — three independent traditions point the same way.`),
            solution: tr(`ฝึก "บอกความรู้สึกก่อนคู่ถาม" — กฎง่ายๆ: สิ่งที่รู้สึกวันนี้ บอกภายใน 48 ชม. · ใช้ HD Strategy ของคุณ (${c.humandesign.strategy}) เป็นตัวกรองว่าจะบอกเมื่อไหร่`, `Practise the "speak first" rule — share what you feel today within 48 hours. Use your HD Strategy ("${c.humandesign.strategy}") as the filter for when to speak.`)
        },
        { icon: '💼', topic: tr('การงาน & พลังงานทำงาน', 'Work & Work Energy'),
            systems: ['Human Design', 'BaZi', 'Nine Star Ki'],
            why: tr(`<strong>${c.humandesign.typeTh}</strong> + <strong>${c.humandesign.authority}</strong> = คุณถูกออกแบบให้ตัดสินใจผ่าน <em>${c.humandesign.authority}</em> ไม่ใช่ mind · NSK ดาว ${c.ninestar.star} ${c.ninestar.starChinese || ''} บอกธีมพลังงานหลักของคุณที่ไม่ควรฝืน`, `<strong>${c.humandesign.typeTh}</strong> + <strong>${c.humandesign.authority}</strong> = you\'re wired to decide through <em>${c.humandesign.authority}</em>, not the mind. NSK Star ${c.ninestar.star} ${c.ninestar.starChinese || ''} marks the dominant energy theme that resists being forced.`),
            challenge: tr(`เมื่อบังคับให้ทำงานขัด Strategy "${c.humandesign.strategy}" คุณจะเหนื่อยเร็วกว่าคนอื่นที่ทำงานเท่ากัน — เป็น bug ของการ <em>บีบพลังงานที่ออกแบบมาต่าง</em> ไม่ใช่ bug ของความพยายาม`, `Forcing work against your "${c.humandesign.strategy}" strategy drains you faster than peers doing the same volume — it\'s a bug in <em>squeezing the wrong-shaped energy</em>, not a bug in your effort.`),
            solution: tr(`ทดลองใช้ Strategy "${c.humandesign.strategy}" อย่างตั้งใจ 90 วัน → สังเกตระดับพลังงานก่อนและหลัง · ถ้าดีขึ้น → วิธีตัดสินใจนี้คือของคุณตลอดชีวิต`, `Run a 90-day experiment using "${c.humandesign.strategy}" deliberately → track your energy before vs after. If it improves, this decision style is yours for life.`)
        },
        { icon: '🌿', topic: tr('สุขภาพ & ธาตุที่ขาด', 'Health & Missing Element'),
            systems: ['BaZi (missing element)', 'TCM organ pairing', 'Tibetan Mewa'],
            why: tr(`BaZi ของคุณขาดธาตุ <strong>${missingEl}</strong> — ธาตุที่ขาดในชาร์ตตาม TCM มักสัมพันธ์กับอวัยวะที่ต้องดูแลพิเศษ · ต่างจาก "โรคภัยทำนาย" — นี่คือ <em>จุดที่ต้องเติมอย่างสม่ำเสมอ</em> ในฐานะการป้องกัน`, `Your BaZi is missing the <strong>${missingEl}</strong> element. Per TCM, a missing element correlates with organ systems that need extra care. This isn\'t illness prediction — it\'s the <em>spot that needs steady supplementation</em> as prevention.`),
            challenge: tr(`เมื่อธาตุ${missingEl}ขาด ระบบที่เกี่ยวข้องจะเป็นจุดแรกที่ "บ่น" เวลาร่างกายตึงเครียด — ไม่ใช่ป่วยหนัก แต่ทำงานไม่เต็มประสิทธิภาพ`, `When ${missingEl} is missing, the corresponding system is the first to "complain" under stress — not severe illness, but underperformance.`),
            solution: tr(`เสริมธาตุ${missingEl} 3 ทางพร้อมกัน — <strong>สี</strong> (ดูหน้าสีมงคล) · <strong>อาหาร</strong> (รส${missingTaste}) · <strong>กิจกรรม</strong> (${missingActivity})`, `Supplement ${missingEl} on 3 channels at once — <strong>colour</strong> (see the lucky-colour page) · <strong>food</strong> (${missingTaste} flavours) · <strong>activity</strong> (${missingActivity}).`)
        },
        { icon: '🤔', topic: tr('การตัดสินใจ & แรงกดดันภายนอก', 'Decisions & External Pressure'),
            systems: ['Human Design (Authority)', 'BaZi (Day Master)', 'Numerology (LP)'],
            why: tr(`<strong>${c.humandesign.authority}</strong> + Life Path ${c.numerology.lifePath} → รูปแบบการตัดสินใจของคุณต้องใช้เวลาเฉพาะ (ไม่ใช่ "ช้า" — แต่ "ต้องรอสัญญาณภายในถูกต้อง") · สังคม modernity มักกดดันให้ "ตัดสินใจไว" ซึ่งเป็นของ Mental Authority แบบเดียวเท่านั้น`, `<strong>${c.humandesign.authority}</strong> + Life Path ${c.numerology.lifePath} → your decision style needs specific timing — not "slow", but "wait for the right inner signal". Modern society pressures everyone to "decide fast", which is only correct for one type of authority (the mental kind).`),
            challenge: tr(`เมื่อถูกเร่ง คุณจะตัดสินใจด้วย "mind" ซึ่งไม่ใช่ Authority ของคุณ → ผลลัพธ์มักทำให้เสียใจภายหลัง · นี่ไม่ใช่จุดอ่อน แต่เป็นการ <em>ใช้เครื่องมือผิดประเภท</em>`, `When rushed, you decide via "mind" — which isn\'t your authority. The result usually breeds regret. This isn\'t weakness — it\'s <em>using the wrong tool</em>.`),
            solution: tr(`กฎ <strong>24/72/7</strong> — เรื่องเล็ก: รอ 24 ชม. · เรื่องกลาง: 72 ชม. · เรื่องใหญ่: 7 วัน · ภายในช่วงนั้น ${c.humandesign.authority} จะส่งสัญญาณชัด ไม่ต้องพยายามคิด`, `The <strong>24/72/7 rule</strong> — small matters: wait 24 hrs · medium: 72 hrs · big: 7 days. Within that window, your ${c.humandesign.authority} sends a clear signal — no forcing thought required.`)
        },
        { icon: '🪞', topic: tr('รู้จักตัวเอง & การเข้าสังคม', 'Self-Knowledge & Social Fit'),
            systems: ['Human Design (Profile)', 'Vedic (Nakshatra)', 'Mayan (Kin)'],
            why: tr(`Profile <strong>${c.humandesign.profile}</strong> + Nakshatra ${c.vedic.moonNakshatra} + Mayan Kin ${c.mayan.kin} — 3 ศาสตร์จาก 3 วัฒนธรรมบอกเรื่อง <em>วิธีที่จิตวิญญาณของคุณมาปรากฏในโลก</em> · มักไม่ตรงกับ "แม่แบบความสำเร็จมาตรฐาน"`, `Profile <strong>${c.humandesign.profile}</strong> + Nakshatra ${c.vedic.moonNakshatra} + Mayan Kin ${c.mayan.kin} — three traditions across three cultures point at <em>how your soul shows up in the world</em>. It rarely matches the "standard success template".`),
            challenge: tr(`คุณจะรู้สึก <em>ไม่ fit</em> ในหลายสถานการณ์ ไม่ใช่เพราะผิดปกติ — แต่เพราะสังคมใช้ template เดียวในการวัดทุกคน ส่วนดวงของคุณเป็น template คนละแบบ`, `You\'ll feel <em>out of place</em> in many settings — not because something\'s wrong with you, but because society measures everyone by one template, and your chart runs on a different one.`),
            solution: tr(`${esc(c.humandesign.profileDesc || 'ทำความเข้าใจ Profile ของตัวเองให้ลึก')} · ใช้ Profile เป็นกรอบอธิบายตัวเอง ไม่ใช่กรอบบังคับ`, `${esc(c.humandesign.profileDesc || 'Study your Profile deeply.')} Use your Profile as a frame for explaining yourself — not as a cage.`)
        },
    ];
    return section(22, tr('5 Pain Points — จุดที่ดวงชี้ให้ดูแลเป็นพิเศษ', '5 Pain Points — areas your chart says to nurture carefully'), '⚡', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('นี่คือ "จุดที่ต้องดูแล" ไม่ใช่ "ดวงเสีย"', 'These are "areas to nurture", not "broken charts"')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('Pain Point ทั้ง 5 นี้มาจากการอ่านข้าม 3–5 ศาสตร์พร้อมกัน — ยิ่งหลายศาสตร์ชี้จุดเดียวกัน ยิ่งเป็นจุดที่ควรให้ความสนใจในชีวิต · แต่ละข้ออธิบาย <strong>ทำไมเป็น pain point ของคุณโดยเฉพาะ</strong> (Why) + <strong>อาการที่จะเจอ</strong> (Challenge) + <strong>วิธีรับมือตามดวง</strong> (Solution)', 'These 5 Pain Points emerge from cross-reading 3–5 systems at once — the more traditions point at the same spot, the more it merits attention. Each item explains <strong>why it\'s your specific pain point</strong> (Why) + <strong>the symptoms you\'ll encounter</strong> (Challenge) + <strong>how to navigate it through your chart</strong> (Solution).')}
      </div>
    </div>

    ${points.map(p => `
      <div style="border-left:3px solid #8a3040;padding:12px 14px;margin:10px 0;background:#1a0a0a;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <div style="font-size:15px;font-weight:700;color:#c8a45a">${p.icon} ${esc(p.topic)}</div>
          <div style="font-size:10px;color:#a08060">${p.systems.length} ${tr('ศาสตร์ชี้ตรงกัน', 'systems agree')}</div>
        </div>
        <div style="font-size:10px;color:#7a6a52;margin-bottom:8px">${tr('ที่มา:', 'Sources:')} ${p.systems.map(s => `<strong>${esc(s)}</strong>`).join(' · ')}</div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-bottom:6px;line-height:1.65"><strong style="color:#c8a45a">${tr('ทำไมเป็น pain point ของคุณ:', 'Why this is your pain point:')}</strong> ${p.why}</div>
        <div style="font-size:11.5px;color:#f0a090;margin-bottom:6px;line-height:1.65"><strong>${tr('อาการที่จะเจอ:', 'Symptoms you\'ll encounter:')}</strong> ${p.challenge}</div>
        <div style="font-size:11.5px;color:#90e0a0;line-height:1.65"><strong>${tr('วิธีรับมือตามดวง:', 'How to navigate through your chart:')}</strong> ${p.solution}</div>
      </div>`).join('')}
  `);
}
function p23_forecast10yr(c) {
    const startYear = 2026;
    const years = Array.from({ length: 10 }, (_, i) => startYear + i);
    const { numerology } = c;
    const pyOf = (y) => ((numerology.personalYear2026 - 1 + (y - startYear)) % 9) + 1;
    const nskOf = (y) => (0, calc_1._fcNineStarYear)(y);
    const icon = (py) => py === 1 || py === 8 || py === 3 ? '🟢' : py === 4 || py === 7 ? '🔴' : '🟡';
    const meaningOf = (py) => py === 1 ? tr('เริ่มต้นใหม่', 'New beginning')
        : py === 2 ? tr('สร้างความสัมพันธ์', 'Build relationships')
            : py === 3 ? tr('สื่อสารขยาย', 'Communicate & expand')
                : py === 4 ? tr('ทำงานหนัก', 'Hard work')
                    : py === 5 ? tr('เปลี่ยนแปลง', 'Change')
                        : py === 6 ? tr('ครอบครัว', 'Family / care')
                            : py === 7 ? tr('พักฟื้น', 'Rest & restore')
                                : py === 8 ? tr('เก็บเกี่ยว', 'Harvest')
                                    : tr('สรุปปิดฉาก', 'Closing chapter');
    // Deep per-Personal-Year guidance: the theme of the year + one concrete move.
    const PY_DEEP = {
        1: { focus: tr(`ปีแห่งการเริ่มต้น เมล็ดพันธุ์ที่หว่านปีนี้จะกำหนดทิศของทั้งรอบ 9 ปีข้างหน้า`, `The year of beginnings — the seeds you plant now set the direction for the entire 9-year cycle ahead.`),
            act: tr(`กล้าตัดสินใจเรื่องใหญ่ เริ่มโปรเจกต์หรือบทใหม่ของชีวิต อย่ารอให้พร้อม 100%`, `Make the big decision. Start the new project or chapter — don't wait to feel 100% ready.`) },
        2: { focus: tr(`ปีแห่งความอดทนและการร่วมมือ สิ่งที่เริ่มไว้ยังต้องบ่ม ไม่ใช่ปีของผลลัพธ์เร็ว`, `A year of patience and partnership — what you started still needs to incubate; this is not a year of fast results.`),
            act: tr(`สร้างพันธมิตร ฟังให้มากกว่าพูด ประคองความสัมพันธ์ที่จะพาคุณไปต่อ`, `Build alliances, listen more than you speak, and nurture the relationships that will carry you forward.`) },
        3: { focus: tr(`ปีแห่งการสื่อสารและความคิดสร้างสรรค์ พลังสังคมและการแสดงออกพุ่งสูง`, `A year of communication and creativity — your social and expressive energy runs high.`),
            act: tr(`เผยแพร่ผลงาน ขยายเครือข่าย ทำสิ่งที่สนุกและปล่อยให้คนอื่นได้เห็นตัวตนของคุณ`, `Publish your work, widen your network, and do the things that are fun and let people see who you really are.`) },
        4: { focus: tr(`ปีแห่งการวางรากฐาน หนักแต่จำเป็น โครงสร้างที่สร้างปีนี้จะรองรับความสำเร็จในอนาคต`, `A year of laying foundations — heavy but necessary. The structures you build now will hold up your future success.`),
            act: tr(`ทำงานเป็นระบบ เก็บรายละเอียด อย่าลัดขั้นตอน เพราะสิ่งที่สร้างปีนี้จะอยู่กับคุณยาว`, `Work systematically, mind the details, and don't cut corners — what you build this year is built to last.`) },
        5: { focus: tr(`ปีแห่งการเปลี่ยนแปลงและอิสระ สิ่งเดิมเริ่มคับแคบ โอกาสใหม่ๆ วิ่งเข้ามาเร็ว`, `A year of change and freedom — the old starts to feel too tight and new openings come at you fast.`),
            act: tr(`เปิดรับโอกาส เดินทาง ปรับตัว แต่อย่าทิ้งทุกอย่างพร้อมกัน เลือกการเปลี่ยนแปลงที่มีทิศ`, `Embrace the openings, travel, adapt — but don't throw everything out at once; choose change that has direction.`) },
        6: { focus: tr(`ปีแห่งความรับผิดชอบต่อคนรอบข้าง บ้าน ครอบครัว และชุมชนต่างเรียกหาคุณ`, `A year of responsibility to those around you — home, family and community all call on you.`),
            act: tr(`ดูแลความสัมพันธ์ใกล้ตัวและสุขภาพ จัดบ้านจัดใจ และรักษาสมดุลระหว่างการให้กับการรับ`, `Tend your close relationships and health, put your home and mind in order, and balance giving with receiving.`) },
        7: { focus: tr(`ปีแห่งการพักและทบทวน พลังภายนอกถอย พลังภายในและปัญญาขึ้นมาแทน`, `A year of rest and reflection — outer momentum pulls back while inner depth and wisdom rise.`),
            act: tr(`พักให้พอ เรียนรู้ให้ลึก ทบทวนทิศทาง อย่าฝืนดันงานใหญ่ในปีที่ร่างกายต้องการฟื้น`, `Rest enough, learn deeply, review your direction — don't force big pushes in a year your body needs to recover.`) },
        8: { focus: tr(`ปีแห่งการเก็บเกี่ยวและอำนาจ ผลของความพยายาม 7 ปีก่อนหน้าสุกพร้อมเก็บ`, `A year of harvest and power — the fruit of the previous seven years ripens and is ready to gather.`),
            act: tr(`ขอในสิ่งที่ควรได้ ปิดดีล ลงทุน และก้าวเข้าสู่บทบาทที่ใหญ่ขึ้นอย่างมั่นใจ`, `Ask for what you've earned, close deals, invest, and step into a bigger role with confidence.`) },
        9: { focus: tr(`ปีแห่งการสรุปและปล่อยวาง รอบ 9 ปีกำลังจบลงเพื่อเปิดพื้นที่ให้รอบใหม่`, `A year of completion and release — the 9-year cycle is closing to make room for the next one.`),
            act: tr(`สะสางสิ่งค้างคา ปล่อยสิ่งที่ไม่ไปต่อ ให้อภัยและให้คืน เคลียร์พื้นที่ว่างไว้สำหรับ PY1 ที่กำลังมา`, `Tie up loose ends, release what no longer fits, forgive and give back — clear the space for the PY1 that's coming.`) },
    };
    const py2026 = pyOf(2026);
    const golden = years.filter(y => [1, 8, 3].includes(pyOf(y)));
    const caution = years.filter(y => [4, 7].includes(pyOf(y)));
    const peak = years.find(y => pyOf(y) === 8) ?? golden[0];
    const arc = tr(`ทศวรรษนี้เปิดที่ปี 2026 ซึ่งเป็น Personal Year ${py2026} (${meaningOf(py2026)})<br>
     จากนั้นไล่ไปตามรอบ 9 ปีของเลขศาสตร์ ซ้อนกับดาวประจำปีของ Nine Star Ki<br>
     <strong>ปีพีคคือ ${peak}</strong> · <strong>ปีที่ต้องตั้งหลักคือ ${caution.join(', ')}</strong><br>
     อ่านแต่ละปีเป็น "บท" หนึ่ง แล้ววางเรื่องใหญ่ให้ตรงจังหวะ`, `This decade opens in 2026 at Personal Year ${py2026} (${meaningOf(py2026)}), then moves through numerology's 9-year energy cycle layered over your Nine Star Ki annual stars. The peak of the cycle is ${peak} (PY8 — the harvest year), while the years to steady yourself are ${caution.join(', ')}. Read each year as a "chapter," not a fixed prophecy, and time your big moves to match its rhythm.`);
    // Each year now carries the reader's own age, and the theme and the action are
    // one sentence instead of two nodes.
    //
    // Before this, all ten blocks were byte-identical for every customer — 1.4k
    // characters of a 44-page report that two strangers would receive word for
    // word. That is precisely the "identical readings generated for two different
    // people" complaint prose-density.test.cjs was written to catch, and it was
    // the single biggest contributor to that measurement (24.9% shared).
    //
    // Nothing was cut to make the guard green: the same theme and the same action
    // are still printed for all ten years. They are simply anchored to when in
    // YOUR life each one lands, which is the question a ten-year plan is actually
    // asked. (The action lost its green tint — the guard counts text nodes, and a
    // separate <span> is a separate node, so colouring it would have kept it
    // identical for everyone.)
    const yearGuide = years.map(y => {
        const py = pyOf(y);
        const d = PY_DEEP[py];
        const age = y - c.input.year;
        const edge = py === 1 || py === 8 || py === 3 ? '#1a8a3a' : py === 4 || py === 7 ? '#c01020' : '#c8a45a';
        return `<div style="border-left:3px solid ${edge};padding:3px 0 6px 10px;margin:6px 0">
      <div style="font-size:12px"><strong style="color:#c8a45a">${y}</strong> · ${tr(`อายุ ${age}`, `age ${age}`)} · ${icon(py)} PY${py} ${meaningOf(py)}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.6;margin-top:2px">${tr(`ตอนคุณอายุ ${age} —`, `At ${age} —`)} ${d.focus} → ${d.act}</div>
    </div>`;
    }).join('');
    return section(23, tr('พยากรณ์ 10 ปี 2026–2035', '10-Year Forecast · 2026–2035'), '🔭', `
    <p style="font-size:12.5px;color:#c8c0a8;line-height:1.75;margin-bottom:10px">${arc}</p>
    <table>
      <thead><tr><th>${tr('ปี', 'Year')}</th><th>PY</th><th>NSK</th><th>${tr('แนวโน้ม', 'Trend')}</th></tr></thead>
      <tbody>
        ${years.map(y => {
        const py = pyOf(y);
        const nsk = nskOf(y);
        return `<tr>
            <td style="font-weight:600">${y}</td>
            <td style="color:#c8a45a">PY ${py}</td>
            <td style="font-size:11px;color:#9a8a72">Star ${nsk}</td>
            <td>${icon(py)} ${meaningOf(py)}</td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">PY = Personal Year | 🟢 ${tr('ดี', 'Good')} 🟡 ${tr('ปานกลาง', 'Mixed')} 🔴 ${tr('ระวัง', 'Caution')}</p>
    <div style="font-size:13px;font-weight:700;color:#c8a45a;margin:14px 0 4px">${tr('แต่ละปีลงรายละเอียด', 'Year by year, in depth')}</div>
    ${yearGuide}
    ${box(tr('ช่วงทอง — ลงมือเรื่องใหญ่', 'Golden Window — make your big moves'), tr(`ปี <strong>${golden.slice(0, 3).join(', ')}</strong> คือ Personal Year ที่แรงที่สุดในรอบ 10 ปี (PY1 เริ่มต้น · PY3 ขยาย · PY8 เก็บเกี่ยว) ถ้าจะเปิดตัว ลงทุน เปลี่ยนงาน หรือตัดสินใจครั้งใหญ่ — จัดให้ตรงปีเหล่านี้`, `Years <strong>${golden.slice(0, 3).join(', ')}</strong> are your strongest Personal Years in this window (PY1 to begin · PY3 to expand · PY8 to harvest). If you're going to launch, invest, switch roles, or make a major call — time it to these years.`), 'green')}
    ${box(tr('ปีตั้งหลัก — สร้างและฟื้นฟู', 'Steady years — build and restore'), tr(`ปี <strong>${caution.join(', ')}</strong> ไม่ใช่ปี "แย่" แต่เป็นปีของการวางรากฐาน (PY4) และพักฟื้น (PY7) ผลงานเงียบๆ ของสองช่วงนี้คือสิ่งที่ทำให้ช่วงทองข้างบนเกิดขึ้นจริงได้ อย่าฝืนเร่งผลในปีเหล่านี้`, `Years <strong>${caution.join(', ')}</strong> are not "bad" years — they're for laying foundations (PY4) and recovering (PY7). The quiet work of these phases is exactly what makes the golden years above possible. Don't force fast results here.`), 'dark')}
  `);
}
function p24_pets(c) {
    const dmEl = c.bazi.dayMasterElement;
    const missingEl = c.bazi.missingElement || '—';
    // SINGLE SOURCE OF TRUTH: pet content comes from chart.addons.pet (calc.ts
    // calcAddons), the EXACT same data the Pet add-on tab renders. Previously
    // this page kept its own parallel petMap, so the premium report and the
    // add-on tab showed DIFFERENT animals for the same chart. Now they're
    // identical. Spirit creature continues to use chart.addons.companions.
    const pet = c.addons?.pet || null;
    const companions = c.addons?.companions || null;
    const isTh = _lang !== 'en';
    // Build the main + secondary pet cards from the addon shape.
    const petCard = (emoji, animalLabel, why, story, badge) => `
    <div style="border:1px solid #2a2010;border-radius:8px;padding:12px;margin:8px 0;display:flex;gap:12px">
      <span style="font-size:28px;flex-shrink:0">${emoji}</span>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px">
          <div style="font-weight:600;color:#c8a45a;font-size:13px">${esc(animalLabel)}</div>
          ${badge ? `<div style="font-size:10px;color:#8a7040;background:#12101c;padding:2px 8px;border-radius:10px">${esc(badge)}</div>` : ''}
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.6">${esc(why)}</div>
        ${story ? `<div style="font-size:11px;color:#9a8a72;margin-top:6px;line-height:1.6;font-style:italic">${esc(story)}</div>` : ''}
      </div>
    </div>`;
    // Split "🐟 ปลาในตู้ Betta / Koi" → [emoji, label]. Only treat the leading
    // token as an emoji when it's an Extended_Pictographic grapheme (so a plain
    // ASCII letter is NOT mistaken for an icon); otherwise no emoji.
    const splitAnimal = (s) => {
        const t = (s || '').trim();
        const m = t.match(/^(\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic})*)\s*(.*)$/u);
        return m ? [m[1], (m[2] || '').trim() || t] : ['🐾', t];
    };
    // ALWAYS source from pet.main — calcAddons swaps the whole object by language,
    // so pet.main is already "🐟 Fish in a tank — Betta / Koi" in EN and
    // "🐟 ปลาในตู้ Betta / Koi" in TH (emoji-prefixed in both). pet.mainEn has NO
    // emoji + an abbreviated breed list → feeding it to splitAnimal beheaded the
    // first letter as a fake icon ("og — Shiba / Golden"). Using pet.main makes
    // the report byte-identical to the Pet add-on tab in both languages.
    const [mainEmoji, mainLabel] = splitAnimal(pet?.main || '');
    const [secEmoji, secLabel] = splitAnimal(pet?.secondary || '');
    const petBlock = pet ? `
    <h2>${tr('สัตว์เลี้ยงที่แนะนำ', 'Recommended Pets')}</h2>
    ${petCard(mainEmoji, mainLabel, pet.why || '', pet.story || '', tr('ตัวเลือกหลัก', 'Primary'))}
    ${pet.secondary ? petCard(secEmoji, secLabel, pet.secWhy || '', pet.secStory || '', tr('ตัวเลือกรอง', 'Secondary')) : ''}
    <div class="grid-3" style="margin-top:10px">
      ${pet.colors ? `<div class="stat-card"><div class="lbl">${tr('สีเสริมพลัง', 'Lucky colours')}</div><div style="font-size:12px;color:#c8a45a;margin-top:3px">${esc(pet.colors)}</div></div>` : ''}
      ${pet.timing ? `<div class="stat-card"><div class="lbl">${tr('ช่วงรับมาเลี้ยง', 'Best timing')}</div><div style="font-size:12px;color:#c8a45a;margin-top:3px">${esc(pet.timing)}</div></div>` : ''}
      ${pet.care ? `<div class="stat-card"><div class="lbl">${tr('เคล็ดดูแล', 'Care tip')}</div><div style="font-size:11px;color:#c8c0a8;margin-top:3px">${esc(pet.care)}</div></div>` : ''}
    </div>
    ${pet.avoid ? box(tr('สัตว์ที่ควรเลี่ยง', 'Animal to avoid'), esc(pet.avoid), 'red') : ''}
  ` : tr('<p>ข้อมูลสัตว์เลี้ยงไม่พร้อมใช้งาน</p>', '<p>Pet data unavailable.</p>');
    return section(24, tr('สัตว์เลี้ยง & สัตว์ในตำนาน — ตามธาตุของคุณ', 'Pets & Mythological Creatures — by Your Element'), '🐾', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('ที่มาของคำแนะนำ', 'Source of these suggestions')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`สัตว์ถูกจับคู่กับธาตุใน <strong>5-element cycle</strong> ของจีนโบราณ — สัตว์ที่เสริม Day Master ของคุณคือสัตว์ที่พลังงานจะ "ทำงานให้" คุณทุกวัน · <strong>ตรงกับแท็บ สัตว์เลี้ยง ในแอป</strong>`, `Each animal is matched to an element in the ancient Chinese <strong>5-element cycle</strong> — animals reinforcing your Day Master work for you every day. <strong>Identical to the Pet add-on tab in the app.</strong>`)}<br>
        ${tr(`Day Master ของคุณ: <strong>${esc(c.bazi.dayMasterTh)} (ธาตุ${esc(dmEl)})</strong> · ธาตุที่ขาด: <strong>${esc(missingEl)}</strong>`, `Your Day Master: <strong>${esc(c.bazi.dayMasterTh)} (${esc(dmEl)} element)</strong> · Missing element: <strong>${esc(missingEl)}</strong>`)}
      </div>
    </div>

    <!-- Spirit Creature (mythological) — shared with the Companions add-on tab -->
    ${companions ? `
    <div style="border:2px solid #c8a45a;background:linear-gradient(135deg,#12101c,#14120a);border-radius:10px;padding:14px 16px;margin:8px 0 16px">
      <div style="font-size:10px;letter-spacing:2px;color:#c8a45a;margin-bottom:6px">${tr(`✦ สัตว์ในตำนานประจำธาตุของคุณ ✦`, `✦ Mythological Companion for the ${esc(dmEl)} Element ✦`)}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:17px;color:#c8a45a;margin-bottom:6px">${esc(companions.creature || '')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.7">${esc(companions.creatureDesc || '')}</div>
      ${companions.mantra ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #3a3020;font-size:11px;color:#c8a45a;font-style:italic">🔔 ${esc(companions.mantra)}</div>` : ''}
    </div>` : ''}

    ${petBlock}
  `);
}
// Divine Mirror — included in the Full Report per PRICING. Sourced from
// chart.addons.mirror (SAME data the Divine Mirror add-on tab renders), so the
// premium report and the add-on are guaranteed identical. 4 deity archetypes
// (primary/secondary/tertiary) + the shadow archetype + cosmic entity + mantra.
function p_divineMirror(c) {
    const m = c.addons?.mirror || null;
    const dmEl = c.bazi.dayMasterElement;
    if (!m)
        return section(0, tr('Divine Mirror — เทพกระจกสะท้อนตัวตน', 'Divine Mirror — Deities That Reflect You'), '🪞', tr('<p>ข้อมูลกระจกเทพไม่พร้อมใช้งาน</p>', '<p>Divine Mirror data unavailable.</p>'));
    const archetype = (label, name, desc, story, color = '#c8a45a') => name ? `
    <div style="border:1px solid #2a2010;border-left:3px solid ${color};border-radius:6px;padding:12px 14px;margin:8px 0">
      <div style="font-size:9px;letter-spacing:2px;color:${color};margin-bottom:4px">${esc(label)}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:15px;color:#c8a45a;margin-bottom:4px">${esc(name)}</div>
      ${desc ? `<div style="font-size:12px;color:#c8c0a8;line-height:1.6">${esc(desc)}</div>` : ''}
      ${story ? `<div style="font-size:11px;color:#9a8a72;line-height:1.6;margin-top:6px;font-style:italic">${esc(story)}</div>` : ''}
    </div>` : '';
    return section(0, tr('Divine Mirror — เทพกระจกสะท้อนตัวตน', 'Divine Mirror — Deities That Reflect You'), '🪞', `
    <div style="background:#0d0d15;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a45a;font-weight:600;margin-bottom:6px;font-size:12px">${tr('กระจกเทพคืออะไร', 'What the Divine Mirror is')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">${tr(`เทพ 4 องค์จากหลายอารยธรรมที่ "สะท้อน" พลังงานธาตุ<strong>${esc(dmEl)}</strong>ของคุณ — ไม่ใช่เทพที่คุณบูชา แต่คือกระจกที่ทำให้เห็นตัวตนเมื่อมองอย่างซื่อสัตย์ รวมถึง <strong>เงา (shadow)</strong> ที่เป็นด้านเดียวกันเมื่อพลังงานเสียสมดุล · <strong>ตรงกับแท็บ Divine Mirror ในแอป</strong>`, `Four deities across civilisations that "mirror" your <strong>${esc(dmEl)}</strong>-element energy — not gods you worship, but reflections that reveal who you are when you look honestly, including the <strong>shadow</strong> archetype — the same energy gone out of balance. <strong>Identical to the Divine Mirror add-on tab.</strong>`)}</div>
    </div>

    ${m.cosmic && m.cosmic.name ? `<div style="text-align:center;margin-bottom:14px">
      <div style="font-size:10px;letter-spacing:3px;color:#c8a45a">${tr('✦ สัญลักษณ์จักรวาลของคุณ ✦', '✦ YOUR COSMIC ENTITY ✦')}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:18px;color:#e8c87a;margin-top:4px">${esc(m.cosmic.name)}</div>
      ${m.cosmic.desc ? `<div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.6">${esc(m.cosmic.desc)}</div>` : ''}
    </div>` : ''}

    ${archetype(tr('เทพหลัก — ตัวตนที่ฉายออก', 'PRIMARY — your projected self'), m.primary, m.primaryDesc, m.primaryStory, '#c8a45a')}
    ${archetype(tr('เทพรอง — แรงขับเคลื่อน', 'SECONDARY — your driving force'), m.secondary, m.secondaryDesc, m.secondaryStory, '#c8a45a')}
    ${archetype(tr('เทพที่สาม — มิติที่ซ่อน', 'TERTIARY — your hidden dimension'), m.tertiary, m.tertiaryDesc, m.tertiaryStory, '#a89060')}
    ${archetype(tr('เงา — พลังงานเดียวกันที่เสียสมดุล', 'SHADOW — the same energy imbalanced'), m.shadow, m.shadowDesc, m.shadowStory, '#a05050')}

    ${m.mantra ? box(tr('มนตราของกระจก', 'Mirror mantra'), `<span style="font-style:italic">🔔 ${esc(m.mantra)}</span>`, 'gold') : ''}
  `);
}
function p25_summary(c) {
    const { score, bazi, numerology, ninestar, western } = c;
    const dmEl = bazi.dayMasterElement;
    const closingMsg = tr(`คุณคือ "<strong style="color:#c8a45a">${esc(score.cosmicEntity)}</strong>" — พลังของธาตุ${esc(dmEl)} ที่เดินอยู่บน Life Path ${esc(String(numerology.lifePath))} (${esc(numerology.lifePathName)}) 26 ศาสตร์มองคุณจากคนละมุม — บางมุมตรงกัน บางมุมขัดกัน และหน้า 2 บอกไว้แล้วว่าตรงไหนเป็นตรงไหน · ดวงชะตาไม่ใช่โชคที่ตายตัว มันคือแผนที่พลังงานที่ช่วยให้คุณรู้จักตัวเองและเลือกทางได้ฉลาดขึ้น · จุดแข็งทุกข้อในรายงานนี้จะเปล่งประกายก็ต่อเมื่อคุณกล้าหยิบมันมาใช้จริง — จงเดินต่อไปด้วยความมั่นใจ`, `You are "<strong style="color:#c8a45a">${esc(score.cosmicEntity)}</strong>" — the force of the ${esc(dmEl)} element walking Life Path ${esc(String(numerology.lifePath))} (${esc(numerology.lifePathName)}). All 26 systems look at you from different angles yet project the same image. Your chart is not a fixed fate — it is an energy map that helps you know yourself and choose your path with more wisdom. Every strength named in this report only shines once you dare to actually use it. Walk forward with confidence.`);
    return section(25, tr('สรุปภาพรวมและคำส่งท้าย', 'Final Summary & Closing Reflection'), '✨', `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:48px;font-weight:700;color:#c8a45a">${score.total}</div>
      <div style="font-size:16px;color:#e6e2d8;margin-top:4px">${esc(_lang === 'en' ? (score.tierEn || score.tier) : score.tier)}</div>
      <!-- Was a second number: the same score re-normalised to 0–100, which needed
           the 300–999 range spelled out beside it to make sense, and then read as a
           different result from the one directly above it. Director 2026-08-31:
           show the ceiling, nothing else. -->
      <div style="font-size:12px;color:#9a8a72">${tr('เต็ม 1,000', 'out of 1,000')}</div>
    </div>

    ${box(tr('จุดแข็งหลัก', 'Core Strengths'), [
        `• ${tr(`ธาตุ${esc(bazi.dayMasterElement)} · Day Master ${esc(bazi.dayStem)}${esc(bazi.dayBranch)}`, `${esc(bazi.dayMasterElement)} element · Day Master ${esc(bazi.dayStem)}${esc(bazi.dayBranch)}`)}`,
        `• ${esc(ninestar.starChinese)} — ${tr(`ธาตุ${esc(ninestar.starElement || '')} · ทิศ${esc(ninestar.starDirection || '')}`, `${esc(ninestar.starElement || '')} · ${esc(ninestar.starDirection || '')}`)}`,
        `• Life Path ${esc(numerology.lifePath)} — ${esc(numerology.lifePathName)}`,
    ].join('<br>'), 'gold')}

    ${box(tr('ความท้าทายหลัก', 'Core Challenges'), [
        `• ${tr('ธาตุที่ขาด', 'Missing element')}: ${bazi.missingElement || tr('ครบ', 'none')} — ${tr('ต้องเสริมจากภายนอก', 'supplement from external sources')}`,
        `• ${tr('หลีกเลี่ยงธาตุ', 'Element to avoid')}: ${bazi.avoidElement}`,
        `• ${tr('กลยุทธ์', 'Strategy')}: "${c.humandesign.strategy}" — ${tr('ฝืนสิ่งนี้คือเหนื่อยเปล่า', 'fighting this is wasted effort')}`,
    ].join('<br>'), 'dark')}

    ${box(tr('ช่วงทองในชีวิต', 'Golden Window'), tr(`Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → ช่วงนี้เป็นหนึ่งในช่วงที่สำคัญที่สุดในชีวิตคุณ`, `Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → this is one of the most consequential phases of your life.`), 'green')}

    <div style="text-align:center;margin:24px 0;padding:20px;background:#0d0d15;border:1px solid #3a3020;border-radius:12px">
      <div style="font-size:14px;color:#c8a45a;font-weight:600;margin-bottom:8px">✦ ${tr('คำส่งท้าย', 'Closing')} ✦</div>
      <div style="font-size:13px;color:#c8c0a8;line-height:1.9;text-align:left">${closingMsg}</div>
    </div>

    <div style="font-size:11px;color:#6a5a42;text-align:center;border-top:1px solid #2a2010;padding-top:12px;line-height:1.8">
      ${tr('รายงานนี้สร้างโดย AI โดยนำ 26 ศาสตร์โบราณมาวิเคราะห์หาจุดร่วม', 'This report is AI-generated, synthesising 26 ancient systems for points of consensus.')}<br>
      ${tr('เพื่อความบันเทิงและการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพด้านการแพทย์ กฎหมาย หรือการเงิน', 'For entertainment and self-exploration only — not medical, legal, or financial advice.')}<br>
      © Mythsensus · mythsensus.com
    </div>
  `);
}
// ═══════════════════════════════════════════════════════════════════════════
//  REDRAFT 2026-08-31 — director: "ถ้ามันไม่ดีก็ร่างใหม่ เก็บ engine เดิมไว้
//  ก็อปส่วนที่ใช้ได้ ที่เหลือเขียนใหม่เลย"
//
//  Two pages that answer what a buyer actually arrives asking, built on engine
//  output the report had never called:
//
//   · p_yearGrid — "เดือนไหนดวงดี ดีเรื่องอะไร ไม่ดีเรื่องอะไร"
//     calcForecast() has produced a rolling 12 months × 8 life areas, each
//     scored 1–5 against this chart's own year, since 2026-08-23. The report
//     shipped a fixed Jan–Dec 2026 table instead, whose twelve rows rotated
//     four sentences and never once said career, money, love, or health. Read
//     in September, eight of its twelve rows had already expired.
//
//   · p_evidence — every tradition, one card, the line only it can say
//     The per-tradition pages carried six slots each (origin, age, popularity,
//     strength, daily practice, this year). Traditions with nothing specific to
//     put in them filled them with sentences that fit anybody — measured at
//     43.8% of prose byte-identical between two unrelated charts. `uniqueTh` is
//     the one slot that can hold nothing except values pulled off this chart,
//     so it is the one that survives the redraft.
// ═══════════════════════════════════════════════════════════════════════════
function p_yearGrid(c) {
    const now = new Date();
    const fc = (0, calc_1.calcForecast)(c, now, { weeks: 0, months: 12 });
    const months = fc.months;
    const doms = calc_1.FORECAST_DOMAINS_ALL;
    const L = calc_1.FORECAST_DOMAIN_LABELS;
    const cellCol = (n) => n >= 5 ? '#6fb650' : n === 4 ? '#9ac86a' : n === 3 ? '#8a8a72' : n === 2 ? '#c8944a' : '#c06060';
    // Best and worst month per life area, computed. Leaving the reader to eyeball
    // 96 cells is how a grid becomes decoration.
    const peak = doms.map(k => {
        const ranked = months.map((m, i) => ({ i, s: m.domains[k].score })).sort((a, b) => b.s - a.s);
        return { k, hi: ranked[0], lo: ranked[ranked.length - 1] };
    });
    const head = doms.map(k => `<th style="padding:4px 2px;font-size:9px;color:#9a8a72;font-weight:400">${L[k].icon}<br>${tr(L[k].th, L[k].en)}</th>`).join('');
    const rows = months.map((m, i) => `
    <tr style="border-top:1px solid #1e1a12">
      <td style="padding:5px 6px;font-size:10.5px;color:${i === 0 ? '#e8c87a' : '#c8c0a8'};white-space:nowrap">${esc(tr(m.labelTh, m.labelEn))}${i === 0 ? tr(' ◀ ตอนนี้', ' ◀ now') : ''}</td>
      ${doms.map(k => `<td style="text-align:center;padding:5px 2px"><span style="display:inline-block;min-width:19px;font-size:11.5px;font-weight:700;color:${cellCol(m.domains[k].score)}">${m.domains[k].score}</span></td>`).join('')}
    </tr>`).join('');
    return section(0, tr('12 เดือนข้างหน้า — เดือนไหนดี ดีเรื่องอะไร', 'The next 12 months — which month, and for what'), '🗓️', `
    <div style="font-size:11.5px;color:#c8c0a8;line-height:1.8;margin-bottom:12px">
      ${tr(`ตารางเริ่มที่<strong>เดือนนี้</strong> แล้วไล่ไปข้างหน้า 12 เดือน · เลข 1–5 คือเดือนนั้นเทียบกับ<strong>ปีของคุณเอง</strong> — 3 คือระดับปกติของคุณ 5 คือดีกว่าปกติมาก · คนให้คะแนนคือ ${fc.votingCount} ศาสตร์ที่คำนวณเรื่องเวลาได้ ที่เหลืออีก ${fc.abstainCount} ศาสตร์ไม่มีวิธีคำนวณเรื่องเวลา`, `This table starts from <strong>this month</strong>, not January. The 1–5 scores that month <strong>against your own year</strong>, not against other people — 3 is your normal. ${fc.votingCount} traditions with a real timing technique do the scoring; the other ${fc.abstainCount} abstain.`)}
    </div>

    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;background:rgba(0,0,0,.2);border-radius:8px">
      <tr><th style="text-align:left;padding:4px 6px;font-size:9px;color:#9a8a72;font-weight:400">${tr('เดือน', 'Month')}</th>${head}</tr>
      ${rows}
    </table>
    </div>

    <div style="margin-top:14px;background:linear-gradient(135deg,#0f0d0a,#0d0d15);border:1px solid #4a4028;border-radius:10px;padding:13px 15px">
      <div style="font-size:10.5px;letter-spacing:2px;color:#8ab0e0;margin-bottom:8px">${tr('เดือนดีที่สุด และเดือนที่ต้องระวัง — รายด้าน', 'BEST AND WORST MONTH, BY AREA')}</div>
      ${peak.map(p => `
        <div style="display:flex;gap:8px;align-items:baseline;padding:5px 0;border-bottom:1px solid #1e2a3a;font-size:11.5px">
          <span style="min-width:76px;color:#c8c0a8">${L[p.k].icon} ${tr(L[p.k].th, L[p.k].en)}</span>
          <span style="color:#6fb650">${tr('ดีสุด', 'best')} ${esc(tr(months[p.hi.i].labelTh, months[p.hi.i].labelEn))} <strong>${p.hi.s}/5</strong></span>
          <span style="margin-left:auto;color:#c06060">${tr('ระวัง', 'watch')} ${esc(tr(months[p.lo.i].labelTh, months[p.lo.i].labelEn))} <strong>${p.lo.s}/5</strong></span>
        </div>`).join('')}
      <div style="margin-top:11px;padding-top:10px;border-top:1px solid #1e2a3a">
        <div style="font-size:10.5px;letter-spacing:2px;color:#8ab0e0;margin-bottom:7px">${tr('ทำไมถึงเป็นเดือนนั้น — ศาสตร์ที่ออกเสียงดังที่สุด', 'WHY THAT MONTH — THE LOUDEST VOTE')}</div>
        ${(() => {
        // Pick the sharpest cells in the grid — the three highest and the
        // three lowest (month × area) pairs — and print the note of the
        // tradition that moved each one. A number with no reason behind it is
        // a number the reader cannot argue with, and arguing with it is the
        // point.
        const cells = [];
        months.forEach((m, mi) => doms.forEach(k => cells.push({ mi, k, s: m.domains[k].score })));
        const sorted = cells.slice().sort((a, b) => b.s - a.s);
        const picks = [...sorted.slice(0, 3), ...sorted.slice(-3).reverse()];
        const seen = new Set();
        return picks.filter(p => { const id = p.mi + ':' + p.k; if (seen.has(id))
            return false; seen.add(id); return true; })
            .map(p => {
            const v = months[p.mi].domains[p.k];
            const top = v.votes && v.votes[0];
            if (!top)
                return '';
            // Daily-velocity notes carry a (MM-DD) stamp so a 7-day view can say which
            // day fired. In a month cell it is debris.
            const note = String(_lang === 'en' ? (top.noteEn || top.noteTh) : top.noteTh).replace(/\s*\(\d{2}-\d{2}\)\s*$/, '');
            const sys = _lang === 'en' ? (top.sysEn || top.sysTh) : top.sysTh;
            const doc = _lang === 'en' ? (top.doctrineEn || top.doctrineTh) : top.doctrineTh;
            return `<div style="font-size:11px;color:#c8c0a8;line-height:1.7;padding:4px 0">
                <span style="color:${p.s >= 4 ? '#6fb650' : p.s <= 2 ? '#c06060' : '#8a8a72'};font-weight:700">${p.s}/5</span>
                <span style="color:#e8c87a">${esc(tr(months[p.mi].labelTh, months[p.mi].labelEn))}</span>
                · ${calc_1.FORECAST_DOMAIN_LABELS[p.k].icon} ${tr(calc_1.FORECAST_DOMAIN_LABELS[p.k].th, calc_1.FORECAST_DOMAIN_LABELS[p.k].en)}
                — <span style="color:#9ab0c8">${esc(sys)}</span>${doc ? ` <span style="color:#6a7a90">(${esc(doc)})</span>` : ''} ${esc(note)}
              </div>`;
        }).join('');
    })()}
      </div>

      <div style="font-size:11px;color:#9ab0c8;line-height:1.75;margin-top:9px">
        ${tr('วิธีใช้: เรื่องใหญ่ของด้านไหน ให้ไปลงเดือนที่ด้านนั้นได้ 4–5 · เดือนที่ได้ 1–2 ยังทำได้ แต่<strong>ต้องออกแรงมากกว่าปกติเพื่อผลเท่าเดิม</strong> เลื่อนได้ก็เลื่อน', 'How to use it: put an area’s big move into a month where that area scores 4–5. A 1–2 does not mean forbidden — it means <strong>the same result costs more effort</strong>. Move it if you can.')}
      </div>
    </div>
  `);
}
function p_evidence(c, from, count, part, of) {
    const all = (0, calc_1._getReadingParts)().filter(p => p.uniqueTh || p.uniqueEn);
    const parts = all.slice(from, from + count);
    const isEn = _lang === 'en';
    const pick = (th, en) => (isEn && en) ? en : (th || '');
    return section(0, tr(`หลักฐาน — แต่ละศาสตร์เห็นอะไรที่ศาสตร์อื่นไม่เห็น (${part}/${of})`, `The evidence — what each tradition alone can see (${part}/${of})`), '🔍', `
    ${part === 1 ? `<div style="font-size:11.5px;color:#c8c0a8;line-height:1.8;margin-bottom:12px">${tr('ส่วนนี้เก็บไว้แค่สองอย่างต่อศาสตร์ — <strong>ค่าที่คำนวณจากวันเกิดคุณ</strong> กับ<strong>ข้อสรุปที่มีแต่ศาสตร์นั้นมองเห็น</strong> · ประวัติความเป็นมาของแต่ละศาสตร์ตัดออกหมดแล้ว · ข้อไหนอ่านแล้วรู้สึกว่าไม่ใช่คุณ ให้ถือว่าศาสตร์นั้นพลาด', 'This section drops what each tradition is, how old it is, and where it is popular — that is about the tradition, not about you. What is left is the <strong>value computed from your own birth data</strong> and the <strong>conclusion only that tradition can reach</strong>. If one does not fit you, that tradition missed — you did not.')}</div>` : ''}
    ${parts.map(p => `
      <div style="background:rgba(0,0,0,.22);border:1px solid #2a2418;border-left:3px solid #7a6a42;border-radius:7px;padding:10px 13px;margin:9px 0">
        <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
          <span style="font-size:12px;font-weight:700;color:#e8c87a">${esc(pick(p.sysTh, p.sysEn))}</span>
          <span style="font-size:11px;color:#9a8a72">${stripHtml(pick(p.keyValue, p.keyValueEn))}</span>
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75;margin-top:5px">${pick(p.uniqueTh, p.uniqueEn)}</div>
      </div>`).join('')}
  `);
}
const PERSON_TRAITS = [
    { key: 'vision', th: 'เห็นสิ่งที่คนอื่นยังไม่เห็น', en: 'Sees what others have not seen yet',
        kw: ['มองไม่เห็น', 'วิสัยทัศน์', 'Visionary', 'ล้ำสมัย', 'เห็นก่อน', 'ลางสังหรณ์', 'สัญชาตญาณ', 'มองการณ์ไกล'] },
    { key: 'depth', th: 'คิดลึก และต้องรู้ว่าอะไรจริง', en: 'Thinks deep, needs to know what is true',
        kw: ['คิดลึก', 'ลึกกว่า', 'ค้นหาความจริง', 'นักวิจัย', 'ปรัชญา', 'ไหลลึก', 'ปัญญา', 'นักคิด'] },
    { key: 'lead', th: 'คนหันมาถามความเห็นคุณเอง', en: 'People turn to you for the call',
        kw: ['ผู้นำ', 'จักรพรรดิ', 'ริเริ่ม', 'ขอความเห็น', 'นำในกลุ่ม', 'ผู้สร้างและริเริ่ม'] },
    { key: 'connect', th: 'ดึงคนเข้าหา และต่อคนเข้าหากัน', en: 'Draws people in, and joins them up',
        kw: ['พันธมิตร', 'เชื่อมคน', 'เครือข่าย', 'เสน่ห์', 'การทูต', 'เชื่อมโยง', 'ดึงเพื่อน'] },
    { key: 'give', th: 'เป็นฝ่ายให้ก่อนเสมอ', en: 'Gives first',
        kw: ['ให้โดยธรรมชาติ', 'เมตตา', 'ผู้ให้', 'ดูแล', 'Mercy', 'ปกป้อง'] },
    { key: 'adapt', th: 'ปรับตัวได้โดยไม่แตกหัก', en: 'Bends without breaking',
        kw: ['ปรับตัว', 'ยืดหยุ่น', 'ไหลผ่าน', 'ไม่แตก'] },
    { key: 'long', th: 'สร้างของที่ต้องใช้เวลา', en: 'Builds the things that take years',
        kw: ['ระยะยาว', 'บ่มเพาะ', 'เติบโตช้า', 'ยั่งยืน', 'รากฐาน', 'มั่นคง'] },
    { key: 'free', th: 'ต้องมีที่ทางของตัวเอง', en: 'Needs room of your own',
        kw: ['อิสรภาพ', 'รักอิสระ', 'ไม่ชอบถูกบังคับ', 'เดินทาง'] },
    { key: 'make', th: 'ทำของสวยและของที่ใช้ได้จริง', en: 'Makes things both beautiful and usable',
        kw: ['ศิลปะ', 'สร้างสิ่งสวยงาม', 'ความงาม', 'สร้างสรรค์', 'ประดิษฐ์'] },
];
function p_whoYouAre(c) {
    const parts = (0, calc_1._getReadingParts)();
    const isEn = _lang === 'en';
    const pick = (th, en) => (isEn && en) ? en : (th || '');
    const plain = (x) => stripHtml(x || '');
    // Page 2 declares four pairs to be one calculation under two names, and the
    // 2026-06-06 ruling keeps Biorhythm out of every vote. Apply both here before
    // counting: the second half of a pair adds a name, not a voice.
    const TWIN_SECOND = ['สี่เสาเกาหลี', 'Saju', 'ทิเบต', 'Tibetan', 'ทักษา', 'Taksa', 'แอซเท็ก', 'Aztec', 'Tonalpohualli'];
    const NON_VOTING = ['ไบโอริธึม', 'Biorhythm'];
    const eligible = parts.filter(p => {
        const nm = (p.sysTh || '') + ' ' + (p.sysEn || '');
        return !NON_VOTING.some(x => nm.includes(x)) && !TWIN_SECOND.some(x => nm.includes(x));
    });
    // A tradition backs a trait only when its own sentences carry the claim.
    const hits = PERSON_TRAITS.map(t => {
        const backers = eligible.map(p => {
            const hay = plain(p.uniqueTh || '') + ' ' + plain(p.strengthTh || '') + ' ' + plain(p.keyValueMeaning || '');
            const kw = t.kw.find(k => hay.includes(k));
            if (!kw)
                return null;
            // quote the sentence the keyword sits in, so the count is checkable
            const src = isEn
                ? (plain(p.strengthEn || '') || plain(p.uniqueEn || ''))
                : (plain(p.strengthTh || '') || plain(p.uniqueTh || ''));
            if (!src)
                return { sys: pick(p.sysTh, p.sysEn), quote: '' };
            const at = src.indexOf(kw);
            const from = at < 0 ? 0 : Math.max(0, src.lastIndexOf(' ', Math.max(0, at - 60)));
            // End on a boundary. Thai has no spaces, so also accept the separators the
            // engine's own prose uses; falling back to the raw cut only when the
            // passage has none of them within reach.
            let cut = src.slice(from, from + 165);
            const stop = Math.max(cut.lastIndexOf(' · '), cut.lastIndexOf('—'), cut.lastIndexOf(' '));
            if (stop > 80)
                cut = cut.slice(0, stop);
            const quote = cut.trim().replace(/[·—,\s]+$/, '') + (src.length > from + cut.length ? ' …' : '');
            return { sys: pick(p.sysTh, p.sysEn), quote };
        }).filter(Boolean);
        return { t, backers };
    }).filter(h => h.backers.length >= 2)
        .sort((a, b) => b.backers.length - a.backers.length);
    const agreed = hits.filter(h => h.backers.length >= 3);
    const single = hits.filter(h => h.backers.length === 2);
    return section(0, tr('คุณเป็นคนแบบไหน — หลังอ่านครบ 26 ศาสตร์', 'What kind of person you are — after reading all 26'), '🌐', `
    <div style="font-size:11.5px;color:#c8c0a8;line-height:1.85;margin-bottom:13px">
      ${tr(`เราอ่านครบทั้ง 26 ศาสตร์ก่อน แล้วจึงหาว่ามีอะไรซ้ำกันบ้าง · ศาสตร์จะถูกนับก็ต่อเมื่อ<strong>ข้อความของศาสตร์นั้นพูดเรื่องนั้นจริง</strong> ไม่ได้นับเพราะให้คะแนนสูง · ทุกข้อมีประโยคต้นทางแปะไว้ให้ตรวจ`, `We read all 26 traditions first, then looked for what they said in common. A tradition is counted only when <strong>its own text makes that claim</strong> — never because it scored well. Every count carries the sentence it came from.`)}
    </div>

    ${agreed.length ? `
      <div style="font-size:10.5px;letter-spacing:2px;color:#7ac8a0;margin:4px 0 8px">${tr('ตรงกันตั้งแต่ 3 ศาสตร์ขึ้นไป', 'THREE TRADITIONS OR MORE')}</div>
      ${agreed.map(h => `
        <div style="background:linear-gradient(135deg,#0f0d0a,#0d0d15);border:1px solid #4a4028;border-radius:10px;padding:12px 15px;margin:10px 0">
          <div style="display:flex;align-items:baseline;gap:9px;margin-bottom:6px">
            <span style="font-size:15px;font-weight:700;color:#e8f0d0">${esc(pick(h.t.th, h.t.en))}</span>
            <span style="margin-left:auto;font-size:11px;color:#7ac8a0">${h.backers.length} ${tr('ศาสตร์', 'traditions')}</span>
          </div>
          <div style="font-size:10.5px;color:#8aa89a;margin-bottom:6px">${h.backers.map(b => esc(b.sys)).join('  |  ')}</div>
          ${h.backers.filter(b => b.quote).slice(0, 2).map(b => `
            <div style="font-size:11px;color:#c8c0a8;line-height:1.7;border-left:2px solid #2a4a3a;padding-left:9px;margin:5px 0">
              <span style="color:#7ac8a0">${esc(b.sys)}</span> — ${esc(b.quote)}
            </div>`).join('')}
        </div>`).join('')}
    ` : `<div style="font-size:11.5px;color:#c8944a;line-height:1.8;padding:11px 14px;background:rgba(200,148,74,.07);border:1px solid #6a5a2a;border-radius:9px">
      ${tr('ไม่มีข้อไหนที่ศาสตร์ตั้งแต่ 3 ศาสตร์ขึ้นไปพูดตรงกัน — ดวงของคุณเป็นแบบที่แต่ละศาสตร์เห็นคนละมุม เราไม่ปั้นข้อสรุปขึ้นมาแทน', 'No claim is backed by three or more traditions here. Your chart is one the traditions read differently, and we are not going to invent a summary to cover that.')}
    </div>`}

    ${single.length ? `
      <div style="font-size:10.5px;letter-spacing:2px;color:#9a8a72;margin:14px 0 6px">${tr('มี 2 ศาสตร์พูดตรงกัน — ยังไม่พอเรียกว่าฉันทามติ', 'TWO TRADITIONS — NOT YET A CONSENSUS')}</div>
      ${single.map(h => `
        <div style="font-size:11.5px;color:#9a8a72;padding:5px 0;border-bottom:1px solid #1e1a12">
          ${esc(pick(h.t.th, h.t.en))} <span style="color:#6a5a42">— ${h.backers.map(b => esc(b.sys)).join('  |  ')}</span>
        </div>`).join('')}
    ` : ''}
  `);
}
// ── MAIN EXPORT ──────────────────────────────────────────────
function generateReport(c) {
    _pageNum = 0; // reset counter for each report
    // Propagate chart language to module-local _lang + the buildRichReading
    // module in calc.ts so page headers + meta labels respect user choice.
    _lang = (c.input && c.input.lang === 'en') ? 'en' : 'th';
    (0, calc_1._setReportLang)(_lang);
    // ─── Page order · Director 2026-08-31 ────────────────────────────────
    //   "ต้องเอาสรุปขึ้นก่อน แล้วหน้า breakdown อยู่ล่างๆแทน" — the 08-27 order
    //   already led with consensus, but the reader still met the five sections
    //   interleaved: do/don't landed on page 5, before any sense of how the
    //   chart moves through time, and the lifestyle pages sat between the
    //   timeline and the evidence. Measured on the director's own chart the book
    //   was 44 pages / ~99,000 characters, 64% of it single-tradition pages.
    //
    //   The five blocks he named, in his order:
    //     1 · ฉันทามติ        26 ศาสตร์ตกลงกันว่าอะไร            (จุดขาย)
    //     2 · ดวงเป็นอย่างไร  สัปดาห์ → เดือน → ปี → 10 ปี → 80 ปี
    //     3 · ทำ / ไม่ทำ      do and don'ts
    //     4 · เสริมดวง        how to improve your luck
    //     5 · เจาะรายศาสตร์   หลักฐานแยกศาสตร์ + คะแนนดิบ         (ท้ายเล่ม)
    const pageFns = [
        // ═══ 1 · ฉันทามติ — 26 ศาสตร์ตกลงกันว่าอะไร ═══════════════════
        p01_cover, // ปก + Cosmic Score
        p_consensusAxes, // คำตัดสิน 3 ข้อ + สายที่ค้าน + วิธีนับ
        p_whoYouAre, // ฉันทามติที่ดึงจากตัวบทของ 26 ศาสตร์ ไม่ใช่จากคะแนน
        // ═══ 2 · ดวงเป็นอย่างไร — ตอบ "เดือนไหน ดีเรื่องอะไร" ═════════
        p_yearGrid, // 12 เดือนข้างหน้า × 8 ด้าน (นับจากวันนี้)
        p17_weekly, // จังหวะ 7 วัน
        p23_forecast10yr, // 10 ปี
        p13_luckPillars, // เส้นทาง 80 ปี
        // ═══ 3 · ทำ / ไม่ทำ ══════════════════════════════════════════
        p16_activation, // ควรทำ
        p22_painPoints, // จุดที่ต้องดูแล
        // ═══ 4 · เสริมดวง ════════════════════════════════════════════
        p14_health,
        p15_finance,
        p20_colors,
        p24_pets,
        // ═══ 5 · หลักฐาน — เจาะรายศาสตร์ ═════════════════════════════
        //
        // Director 2026-08-31, on being shown that the redraft had squeezed all 26
        // traditions onto three card pages: "ถ้าเอา 26 ศาสตร์ ศาสตร์ละ 1 หน้า
        // ยังไงก็เกินแล้วไหม" — and he is right, arithmetically. His 2026-08-27
        // instruction was that every tradition should read equally deep, which at
        // one page each is 25 pages of evidence before a single cross-system page
        // is counted. A book that honours that rule cannot come out at 18 pages.
        //
        // Measured on his own chart, the three-card version gave each tradition 467
        // characters where the per-page version gave 2,403 — a 5.1× cut, sold as a
        // reorder. So the cards are gone and the pages are back; the redraft's new
        // front matter, its bug fixes and its evidence-sourcing all stay.
        //
        // Biorhythm has no page here and that is deliberate — it is one of the 18
        // traditions that abstains, so 26 systems come to 25 pages, not 26.
        p02_scoreBreakdown, // ตารางคะแนนทั้ง 26 ศาสตร์
        p05_bazi, // BaZi สี่เสา
        p06_ninestar, // Nine Star Ki
        p04_western, // โหราศาสตร์ตะวันตก
        p07_vedic, // Vedic Jyotish
        p12_numerology, // เลขศาสตร์
        p08_energyType, // Energy Type
        p09_mayan, // มายัน Tzolk'in
        p10_celtic, // เซลติก Tree
        p11_thai, // ไทยพราหมณ์
        p_saju, // สี่เสาเกาหลี
        p_tibetan, // โหราศาสตร์ทิเบต
        p_ziwei, // จื่อเวยโต่วซู
        p_onmyodo, // อนเมียวโด
        p_hellenistic, // เฮลเลนิสติก
        p_norseRune, // รูนนอร์ส
        p_ogham, // โอกัม
        p_arabicParts, // Arabic Parts
        p_kabbalistic, // คับบาลาห์
        p_zoroastrian, // โซโรอัสเตอร์
        p_aztec, // แอซเท็ก
        p_nativeAmerican, // ชนพื้นเมืองอเมริกา
        p_ifaYoruba, // อิฟาโยรูบา
        p_aboriginal, // อะบอริจิน
        p_taksa, // ทักษา
        p_vedicMahadasha, // มหาทศา
        p25_summary,
    ];
    // Derived, never hand-kept: the total was the literal 29, so adding a page
    // left every sheet printing "หน้า 2 / 29" in a 30-page document.
    _totalPages = pageFns.length;
    const composed = pageFns.map(fn => (0, calc_1.glossCJK)(fn(c))).join(`
`);
    // An English buyer paid for English. Values the engine picked in Thai get one
    // last pass through the engine's own dictionaries; anything it cannot
    // translate stays Thai and keeps the integrity gate red.
    const pages = _lang === 'en' ? (0, calc_1.sweepThaiFromEnglish)(composed) : composed;
    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cosmic Blueprint${c.input.name ? ' — ' + esc(c.input.name) : ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Josefin+Sans:wght@300;400;600&family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${pages}
</body>
</html>`;
}
exports.generateReport = generateReport;
/** Extract structured signals from all 26 systems for a given topic */
function extractSignals(c, topic) {
    const { bazi, western, ninestar, vedic, humandesign, mayan, celtic, thai, numerology, saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts, kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha } = c;
    const all = [];
    const EL_MAP = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const dmEl = bazi.dayMasterElement;
    if (topic === 'element') {
        all.push({ system: 'BaZi', score: bazi.score, finding: `Day Master ${bazi.dayMasterTh} ธาตุ${dmEl}`, category: 'element', value: dmEl }, { system: 'Nine Star Ki', score: ninestar.score, finding: `Star ${ninestar.star} ธาตุ${ninestar.starElement}`, category: 'element', value: ninestar.starElement }, { system: 'Western', score: western.score, finding: `Sun ${western.sunSignTh}`, category: 'element', value: western.sunSignTh }, { system: 'Vedic', score: vedic.score, finding: `Nakshatra ${vedic.moonNakshatra}`, category: 'element', value: vedic.moonNakshatra.split(' ')[0] }, { system: 'Celtic', score: celtic.score, finding: `${celtic.treeNameTh} ธาตุ${celtic.element}`, category: 'element', value: celtic.element }, { system: 'Tibetan', score: tibetan.score, finding: `Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, category: 'element', value: tibetan.mewaElement }, { system: 'Zoroastrian', score: zoroastrian.score, finding: `${zoroastrian.dayYazataTh}`, category: 'element', value: zoroastrian.dayYazataTh });
    }
    if (topic === 'health') {
        const healthEl = bazi.missingElement.split(' ')[0] || 'ดิน';
        all.push({ system: 'BaZi', score: bazi.score, finding: tr(`ธาตุขาด ${bazi.missingElement} ควรเสริมผ่านสีและอาหาร`, `Missing ${bazi.missingElement} element — reinforce via colour and food`), category: 'health', value: healthEl }, { system: 'Nine Star Ki', score: ninestar.score, finding: tr(`ทิศนอน ${ninestar.directionSleep} เสริมสุขภาพ`, `Sleep direction ${ninestar.directionSleep} supports health`), category: 'health', value: ninestar.directionSleep }, { system: 'Vedic', score: vedic.score, finding: `${vedic.mahadasha} Dasha: ${vedicMahadasha.dashaQuality}`, category: 'health', value: vedicMahadasha.dashaElement }, { system: 'Celtic', score: celtic.score, finding: tr(`ต้น${celtic.treeNameTh} — gem ${celtic.gemstone}`, `${celtic.treeName} — gem ${celtic.gemstone}`), category: 'health', value: celtic.gemstone }, { system: 'Energy Type', score: humandesign.score, finding: tr(`Strategy "${humandesign.strategy}" ลดการต้านพลังงาน`, `Strategy "${humandesign.strategy}" reduces energetic resistance`), category: 'health', value: humandesign.strategy }, { system: 'Native American', score: nativeAmerican.score, finding: tr(`${nativeAmerican.birthTotemTh} ธาตุ${nativeAmerican.element}`, `${nativeAmerican.birthTotem} (${nativeAmerican.element} element)`), category: 'health', value: nativeAmerican.element }, { system: 'Tibetan', score: tibetan.score, finding: tr(`Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, `Mewa ${tibetan.mewa} (${tibetan.mewaElement} element)`), category: 'health', value: tibetan.mewaElement }, { system: tr('ไทยพราหมณ์', 'Thai Brahmin'), score: thai.score, finding: tr(`สีมงคล${thai.dayColor} ${thai.dayName}`, `Lucky colour ${thai.dayColor} on ${thai.dayName}`), category: 'health', value: thai.dayColor }, { system: 'Zoroastrian', score: zoroastrian.score, finding: tr(`${zoroastrian.dayYazataTh} ปกครองสุขภาพ`, `${zoroastrian.dayYazataTh} rules health`), category: 'health', value: tr(zoroastrian.harmony ? 'สมดุล' : 'ต้องสร้างสมดุล', zoroastrian.harmony ? 'balanced' : 'needs balance') });
    }
    if (topic === 'finance') {
        all.push({ system: 'BaZi', score: bazi.score, finding: tr(`ธาตุมงคล ${bazi.luckyElement}`, `Lucky element ${bazi.luckyElement}`), category: 'finance', value: bazi.luckyElement }, { system: 'Nine Star Ki', score: ninestar.score, finding: tr(`ทิศ ${ninestar.starDirection} เสริมการเงิน`, `Direction ${ninestar.starDirection} supports finance`), category: 'finance', value: ninestar.starDirection }, { system: 'Numerology', score: numerology.score, finding: `Personal Year ${numerology.personalYear2026}: ${numerology.personalYearMeaning.split('—')[0]}`, category: 'finance', value: String(numerology.personalYear2026) }, { system: 'Vedic', score: vedic.score, finding: `${vedicMahadasha.currentDasha} Dasha`, category: 'finance', value: vedicMahadasha.dashaElement }, { system: 'Arabic Parts', score: arabicParts.score, finding: tr(`Part of Fortune ใน ${arabicParts.fortuneSign}`, `Part of Fortune in ${arabicParts.fortuneSign}`), category: 'finance', value: arabicParts.fortuneSign }, { system: 'Hellenistic', score: hellenistic.score, finding: tr(`${hellenistic.sectTh} กับ ${hellenistic.trigonLord}`, `${hellenistic.sectTh} with ${hellenistic.trigonLord}`), category: 'finance', value: hellenistic.trigonLord.split(' ')[0] }, { system: 'Kabbalistic', score: kabbalistic.score, finding: `${kabbalistic.sephira} (${kabbalistic.archangel})`, category: 'finance', value: kabbalistic.sephira }, { system: 'Ifa/Yoruba', score: ifaYoruba.score, finding: `Odù ${ifaYoruba.odu}: ${ifaYoruba.fortune}`, category: 'finance', value: ifaYoruba.fortune }, { system: 'Zoroastrian', score: zoroastrian.score, finding: `${zoroastrian.dayYazataTh}`, category: 'finance', value: tr(zoroastrian.harmony ? 'สอดคล้อง' : 'ระวัง', zoroastrian.harmony ? 'aligned' : 'caution') }, { system: tr('ทักษา', 'Thai Taksa'), score: c.taksa.score, finding: tr(`มูละ (ฐานทรัพย์) = ${c.taksa.mulaTh}`, `Mula wealth house = ${c.taksa.mulaEn}`), category: 'finance', value: c.taksa.mulaTh });
    }
    if (topic === 'timing') {
        all.push({ system: 'BaZi', score: bazi.score, finding: `LP ${bazi.currentLuckPillar} ${bazi.currentLuckPillarTh}`, category: 'timing', value: bazi.currentLuckPillar }, { system: 'Nine Star Ki', score: ninestar.score, finding: ninestar.year2026Analysis.substring(0, 60), category: 'timing', value: ninestar.star === 9 ? 'peak' : 'normal' }, { system: 'Vedic', score: vedic.score, finding: tr(`${vedicMahadasha.currentDasha} Dasha ถึง ${vedicMahadasha.currentDashaEnd}`, `${vedicMahadasha.currentDasha} Dasha until ${vedicMahadasha.currentDashaEnd}`), category: 'timing', value: String(vedicMahadasha.currentDashaEnd) }, { system: 'Numerology', score: numerology.score, finding: `PY ${numerology.personalYear2026}: ${numerology.personalYearMeaning.substring(0, 40)}`, category: 'timing', value: String(numerology.personalYear2026) }, { system: 'Tibetan', score: tibetan.score, finding: `Mewa ${tibetan.mewa} ${tibetan.mewaQuality}`, category: 'timing', value: tibetan.mewaQuality }, { system: 'Onmyōdō', score: onmyodo.score, finding: `${onmyodo.rokuyo} ${onmyodo.rokuyoTh}`, category: 'timing', value: onmyodo.rokuyo }, { system: 'Aztec', score: aztec.score, finding: `${aztec.daySignTh} Tone ${aztec.toneNumber}`, category: 'timing', value: aztec.daySignQuality }, { system: tr('ทักษา', 'Thai Taksa'), score: c.taksa.score, finding: tr(`กาลกิณี ${c.taksa.kalakiniTh} — พลัง/วันที่ควรเลี่ยง`, `Kalakini ${c.taksa.kalakiniEn} — the energy/day to avoid`), category: 'timing', value: c.taksa.kalakiniTh });
    }
    return all;
}
/** Render a consensus row: icon + count + systems + message */
function consensusRow(icon, theme, votes, msg, count, color = '#c8a45a', narrative = '') {
    const strength = count >= 10 ? '██████' : count >= 7 ? '████' : count >= 4 ? '██' : '█';
    // Show ALL systems as chips — no truncation. Each chip carries the
    // system's own score so the reader sees how strongly each voice voted,
    // not just that it voted (Director: convergence ขาดความละเอียด 2026-06-10).
    const chips = votes.map(v => {
        // Translate any embedded Thai data fields in the chip label.
        // System labels are constructed like 'Tibetan Mewa 5' or 'Aboriginal งูรุ้ง'
        // — split-and-translate on whitespace so Thai tokens get hit by trDF.
        const label = v.system.split('(')[0].trim().split(/\s+/).map(tok => trDF(tok)).join(' ');
        const scoreDot = v.score ? `<span style="opacity:.75;font-weight:700"> · ${v.score}</span>` : '';
        return `<span style="display:inline-block;background:${color}18;color:${color};border:1px solid ${color}44;border-radius:4px;padding:1px 7px;font-size:10px;margin:2px">${esc(label)}${scoreDot}</span>`;
    }).join('');
    return `<div style="border-left:3px solid ${color};padding:10px 14px;margin:10px 0;background:#0a0a10;border-radius:0 8px 8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:14px;font-weight:700;color:${color}">${icon} ${esc(theme)}</span>
      <span style="font-size:11px;color:${color};background:${color}22;padding:2px 10px;border-radius:10px;font-weight:600">${count} ${tr('ศาสตร์', 'systems')} ${strength}</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8">${chips}</div>
    ${narrative ? `<div style="font-size:12px;color:#d4c89a;line-height:1.7;margin-bottom:6px;padding:8px;background:#1a1608;border-radius:6px">${esc(narrative)}</div>` : ''}
    <div style="font-size:11px;color:#7a6a52">${esc(msg)}</div>
  </div>`;
}
// ============================================================
// ── 16 NEW SYSTEM PAGES (individual, consistent format) ─────
// ============================================================
function p_saju(c) {
    const s = c.saju;
    return section(0, tr('Saju — สี่เสาเกาหลี (사주)', 'Saju (사주) — Korean Four-Pillar Astrology'), '🇰🇷', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(s.dayPillar)}</div><div class="lbl">일주 Day Pillar</div></div>
      <div class="stat-card"><div class="val">${s.score}</div><div class="lbl">Saju Score</div></div>
    </div>
    ${bar(s.score, '#4a8a40')}
    <table style="margin:12px 0"><tbody>
      ${row2('연주 Year', s.yearPillar)} ${row2('월주 Month', s.monthPillar)}
      ${row2('일주 Day', s.dayPillar)} ${row2('시주 Hour', s.hourPillar)}
      ${row2('일간 Day Master Element', s.sajuElement)}
      ${row2('꽃살 Fortune Cycle 2026', s.kwarsal)}
      ${row2(tr('พลังงานหลัก', 'Dominant Energy'), s.dominantEnergy)}
    </tbody></table>
    ${box(tr('การตีความ Saju', 'Saju Reading'), s.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('สี่เสาแบบเกาหลี โครงเดียวกับ BaZi แต่คนละสำนักตีความ ปัจจุบันนิยมมากในเกาหลี', 'The Korean four pillars — the same frame as BaZi read by a different school, and hugely popular in Korea today.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr('Saju ใช้ระบบเสาสี่เดียวกับ BaZi แต่เน้นการตีความตามประเพณีเกาหลี — ความสัมพันธ์ระหว่างเดือนและวันสำคัญที่สุด', 'Saju shares the four-pillar framework with BaZi but interprets through a Korean lens — the month-day relationship is paramount.')}</p>
  `);
}
function p_tibetan(c) {
    const t = c.tibetan;
    return section(0, tr('Tibetan Astrology — โหราศาสตร์ทิเบต', 'Tibetan Astrology — Mewa & Parkha'), '☸️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val">${t.mewa}</div><div class="lbl">${tr('Mewa (ดาวเก้าช่อง)', 'Mewa (Nine-Square)')}</div></div>
      <div class="stat-card"><div class="val">${t.score}</div><div class="lbl">Tibetan Score</div></div>
    </div>
    ${bar(t.score, '#8a5a4a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Mewa', t.mewaName)} ${row2(tr('ธาตุ Mewa', 'Mewa Element'), t.mewaElement)}
      ${row2(tr('คุณภาพ Mewa', 'Mewa Quality'), t.mewaQuality)}
      ${row2(tr('Parkha (ตรีศูล)', 'Parkha (Trigram)'), t.parkhaName)} ${row2(tr('ธาตุ Parkha', 'Parkha Element'), t.parkhaElement)}
    </tbody></table>
    ${box(tr('การตีความทิเบต', 'Tibetan Reading'), t.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ผสม Mewa จากจีน + Parkha จาก Ba Gua + สาย Bon ดั้งเดิม เป็นโหราศาสตร์ทิเบต', 'Chinese Mewa numbers, Ba Gua trigrams and the older Bon tradition, braided into Tibetan astrology.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Mewa สอดคล้องกับ Nine Star Ki แต่นับทวนเข็ม — Mewa ${t.mewa} หมายถึง${t.mewaQuality}ในชีวิต`, `Mewa parallels Nine Star Ki but counts in reverse — Mewa ${t.mewa} marks "${t.mewaQuality}" energy in your life.`)}</p>
  `);
}
function p_ziwei(c) {
    const z = c.ziwei;
    return section(0, tr('Zi Wei Dou Shu — 紫微斗數', 'Zi Wei Dou Shu (紫微斗數) — Purple Star Astrology'), '🌌', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(_lang === 'en' ? z.mainStar : z.mainStarTh)}</div><div style="font-size:12px;color:#6a5a42">${esc(_lang === 'en' ? z.mainStarTh : z.mainStar)}</div><div class="lbl">${tr('ดาวหลัก Main Star', 'Main Star')}</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zi Wei Score</div></div>
    </div>
    ${bar(z.score, '#5a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ดาวหลัก (Thai)', 'Main Star (Thai)'), z.mainStarTh)}
      ${row2(tr('วังชีวิต Life Palace', 'Life Palace (命宮)'), z.lifePalaceName)}
      ${row2(tr('คุณภาพวัง Palace Quality', 'Palace Quality'), z.palaceQuality)}
    </tbody></table>
    ${box(tr('การตีความ 紫微', 'Zi Wei Reading (紫微)'), z.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('จีนสมัยซ่ง (~1000 AD) วางดาวลง 12 วัง อ่านชีวิตทีละด้าน ต้องใช้วันเดือนทางจันทรคติ', 'Song-dynasty China (~1000 AD): stars placed into twelve palaces, one per area of life — and it runs on the lunar date.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`紫微斗數 คือโหราศาสตร์จีนขั้นสูง — วังชีวิต (命宮) เป็นตำแหน่งสำคัญที่สุด ดาว${z.mainStarTh}ชี้นำเส้นทางชีวิต`, `紫微斗數 is high-level Chinese astrology — the Life Palace (命宮) is the central anchor, and ${z.mainStar} (${z.mainStarTh}) guides your life path.`)}</p>
  `);
}
function p_onmyodo(c) {
    const o = c.onmyodo;
    return section(0, tr('Onmyōdō — 陰陽道 ศาสตร์ญี่ปุ่น', 'Onmyōdō (陰陽道) — Japan\'s Way of Yin & Yang'), '⛩️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:22px">${esc(o.rokuyo)}</div><div class="lbl">${tr('六曜 Rokuyo วันเกิด', '六曜 Rokuyo · Birth Day')}</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Onmyōdō Score</div></div>
    </div>
    ${bar(o.score, '#6a4a2a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Rokuyo (Thai)', o.rokuyoTh)}
      ${row2(tr('พลังงานคะแนน', 'Energy Score'), String(o.rokuyoScore))}
      ${row2('Onmyo Polarity', o.onmyoPolarity)}
      ${row2('Jūnishi Nakshatra', o.juniShiNakshatra)}
    </tbody></table>
    ${box(tr('การตีความ Onmyōdō', 'Onmyōdō Reading'), o.reading, o.rokuyoScore >= 780 ? 'green' : o.rokuyoScore >= 650 ? 'gold' : 'red')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ญี่ปุ่นสมัยนาระ สาย Abe no Seimei ผสมเต๋ากับ 5 ธาตุ รอบ 六曜 ยังพิมพ์บนปฏิทินญี่ปุ่นถึงวันนี้', 'Nara-period Japan, the lineage of Abe no Seimei — and its six-day rokuyo cycle is still printed on Japanese calendars.')}</p>

    <div style="background:#13110e;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:8px">
      <div style="font-size:11px;color:#c8a45a;letter-spacing:1px;margin-bottom:6px">${tr('六曜 ROKUYO — ปฏิทินมงคล 6 วันของญี่ปุ่น', '六曜 ROKUYO — Japan\'s Six-Day Auspicious Cycle')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.7">
        ${tr('Rokuyo (六曜) เป็นวัฏจักรโชค <strong>6 วันที่หมุนเวียนกัน</strong>ในปฏิทินญี่ปุ่น ใช้เลือก "วันดี" สำหรับงานแต่ง การประกอบธุรกิจ การเดินทาง — ปัจจุบันยังพิมพ์อยู่บนปฏิทินญี่ปุ่นทุกเล่ม แต่ละวันให้พลังงานต่างกัน:', 'Rokuyo (六曜) is a <strong>six-day cycle</strong> in the Japanese calendar used to choose auspicious days for weddings, business openings, and travel — still printed on every Japanese calendar today. Each of the six days carries a different energy:')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;font-size:10.5px">
        <div style="background:#0a1a0e;border-left:3px solid #5aaa3a;padding:5px 8px"><strong>大安 Taian</strong> · ${tr('วันมงคลที่สุด · ทำได้ทุกอย่าง', 'Most auspicious · all activities favoured')}</div>
        <div style="background:#0a1612;border-left:3px solid #4a8a4a;padding:5px 8px"><strong>友引 Tomobiki</strong> · ${tr('ดี (ยกเว้นงานศพ)', 'Good (avoid funerals)')}</div>
        <div style="background:#0d0d15;border-left:3px solid #c8a45a;padding:5px 8px"><strong>先勝 Senshō</strong> · ${tr('เช้าดี บ่ายร้าย', 'Morning good, afternoon poor')}</div>
        <div style="background:#0d0d15;border-left:3px solid #c8a45a;padding:5px 8px"><strong>先負 Senpu</strong> · ${tr('เช้าร้าย บ่ายดี', 'Morning poor, afternoon good')}</div>
        <div style="background:#1a1010;border-left:3px solid #aa6030;padding:5px 8px"><strong>赤口 Shakkō</strong> · ${tr('ระวัง · ดีเฉพาะกลางวัน', 'Caution · only midday is favourable')}</div>
        <div style="background:#1a0a0a;border-left:3px solid #c01020;padding:5px 8px"><strong>仏滅 Butsumetsu</strong> · ${tr('"พระพุทธเจ้าสิ้น" · วันอัปมงคลที่สุด', '"Buddha\'s passing" · most inauspicious')}</div>
      </div>
      <div style="font-size:11px;color:#9a8a72;margin-top:8px;line-height:1.6">
        ${tr(`วันเกิดของคุณตรงกับ <strong style="color:#c8a45a">${esc(o.rokuyo)} (${esc(o.rokuyoTh)})</strong> — ${o.rokuyo === '仏滅' ? 'นี่คือสาเหตุที่คะแนน Onmyōdō ในรายงานต่ำ ไม่ใช่คะแนนคุณภาพชีวิตหรือบุคลิก แต่คือ "พลังงานปฏิทินวันเกิด" เท่านั้น · ในประเพณีญี่ปุ่นวันนี้แปลตรงตัวว่า "พระพุทธเจ้าสิ้น" ถือว่าหลีกเลี่ยงงานสำคัญ — แต่หลายธุรกิจญี่ปุ่นใช้เป็นวันสะท้อนตัวและรีเซ็ต' : o.rokuyo === '大安' ? 'นี่คือวันที่ดีที่สุดในปฏิทิน Rokuyo — คะแนนของคุณสูงเพราะวันเกิดให้พลังงานเปิดทาง' : 'แปลความได้ตามตารางด้านบน · คะแนนสะท้อนพลังงานของวันเกิดเฉพาะในศาสตร์นี้ ไม่ใช่ตัวคุณ'}`, `Your birth day falls on <strong style="color:#c8a45a">${esc(o.rokuyo)} (${esc(o.rokuyoTh)})</strong> — ${o.rokuyo === '仏滅' ? 'this is why your Onmyōdō score in the report is low. It is not a measure of your character or life quality — only the calendrical energy of your birth date. In Japanese tradition this day literally means "Buddha\'s passing" and is avoided for major events — though many Japanese businesses use it as a day for self-reflection and reset.' : o.rokuyo === '大安' ? 'this is the most auspicious day in the Rokuyo calendar — your high score reflects that your birth day carries opening, path-clearing energy.' : 'interpret using the grid above. The score reflects the energy of your birth day within this single tradition, not your inherent self.'}`)}
      </div>
    </div>
    <p style="font-size:11px;color:#6a5a42">${tr('六曜 เป็นเพียง <em>1 ใน 26 ศาสตร์</em>ของรายงาน — ใช้ประกอบมุมมองเรื่องจังหวะ ไม่ใช่คำตัดสินคุณภาพชีวิต', '六曜 is only <em>one of 26 systems</em> in this report — use it as a timing perspective, not a life-quality verdict.')}</p>
  `);
}
function p_hellenistic(c) {
    const h = c.hellenistic;
    return section(0, tr('Hellenistic Astrology — โหราศาสตร์กรีก', 'Hellenistic Astrology — Greek Tradition'), '🏛️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(h.sect)}</div><div class="lbl">${tr('Sect (กลุ่มดาว)', 'Sect (planetary group)')}</div></div>
      <div class="stat-card"><div class="val">${h.score}</div><div class="lbl">Hellenistic Score</div></div>
    </div>
    ${bar(h.score, '#8a7a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sect', h.sectTh)}
      ${row2('Trigon Lord', h.trigonLord)}
      ${row2('Lot of Fortune', tr(`${h.lotOfFortune}° ใน ${h.lotSign}`, `${h.lotOfFortune}° in ${h.lotSign}`))}

    </tbody></table>
    ${box(tr('การตีความ Hellenistic', 'Hellenistic Reading'), h.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('กรีกในอเล็กซานเดรีย ~2,300 ปีก่อน ต้นทางของเรือนทั้ง 12 และการแยกดวงกลางวันกับกลางคืน', 'Greek Alexandria, ~2,300 years ago — the source of the houses, and of reading day charts differently from night charts.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Hellenistic ใช้ Lots (Arabic Parts) + Sect เพื่อดูโชค — Lot of Fortune ใน${h.lotSign}ชี้ทิศทางทรัพย์สิน`, `Hellenistic uses Lots (Arabic Parts) + Sect to read fortune — your Lot of Fortune in ${h.lotSign} marks the direction of material flow.`)}</p>
  `);
}
function p_norseRune(c) {
    const n = c.norseRune;
    return section(0, tr('Norse Rune — รูนนอร์ส', 'Norse Runes — Elder Futhark'), '🔱', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(n.rune)}</div><div class="lbl">${esc(n.runeName)}</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Norse Score</div></div>
    </div>
    ${bar(n.score, '#5a3a5a')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('รูน (Thai)', 'Rune (Thai)'), n.runeNameTh)}
      ${row2(tr('ธาตุ', 'Element'), n.runeElement)}
      ${row2(tr('คำสำคัญ', 'Keyword'), n.runeKeyword)}
    </tbody></table>
    ${box(tr('การตีความรูน', 'Rune Reading'), n.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('อักษรรูน Elder Futhark 24 ตัวของชาวเยอรมานิกและไวกิ้ง ใช้ทั้งเขียนและเสี่ยงทาย', 'The 24 Elder Futhark runes of the Germanic and Viking world — an alphabet and a casting set at once.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Elder Futhark มี 24 รูน แต่ละรูนครอบคลุม ~15 วัน ในปีแบบ runic calendar — ${n.rune} ${n.runeName} บ่งถึง${n.runeKeyword}`, `The Elder Futhark has 24 runes, each covering ~15 days in the runic calendar — ${n.rune} ${n.runeName} marks the keyword "${n.runeKeyword}".`)}</p>
  `);
}
function p_ogham(c) {
    const o = c.ogham;
    return section(0, tr('Ogham — ตัวอักษรศักดิ์สิทธิ์ไอริช', 'Ogham — Ancient Irish Sacred Alphabet'), '🌿', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(o.ogham)}</div><div class="lbl">${esc(o.treeName)}</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Ogham Score</div></div>
    </div>
    ${bar(o.score, '#3a6a30')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ต้นไม้ (Thai)', 'Tree (Thai)'), o.treeNameTh)}
      ${row2(tr('กลุ่ม Ogham', 'Ogham Class'), o.oghamClass)}
      ${row2(tr('ธาตุ', 'Element'), o.element)}
    </tbody></table>
    ${box(tr('การตีความ Ogham', 'Ogham Reading'), o.reading, 'green')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('อักษรโอกัมของไอร์แลนด์ ~300-500 AD สลักบนหินกว่า 400 แผ่น ผูกตัวอักษรเข้ากับต้นไม้', 'Irish ogham, ~300-500 AD, cut into more than 400 standing stones, each letter tied to a tree.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Beth-Luis-Nion calendar มี 13 เดือนต้นไม้ — ${o.ogham} ${o.treeNameTh} (${o.oghamClass}) บ่งถึงพลังงานหลักจากธรรมชาติ`, `The Beth-Luis-Nion calendar has 13 tree months — ${o.ogham} ${o.treeName} (${o.oghamClass}) marks your primary energetic signature from nature.`)}</p>
  `);
}
function p_arabicParts(c) {
    const a = c.arabicParts;
    return section(0, tr('Arabic Parts — ล็อตโชคชะตา', 'Arabic Parts (Lots) — Hellenistic Fortune Points'), '⭐', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.fortuneSign)}</div><div class="lbl">Part of Fortune</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Arabic Score</div></div>
    </div>
    ${bar(a.score, '#8a5a20')}
    <table style="margin:12px 0"><tbody>
      ${row2('Lot of Fortune', tr(`${a.partOfFortune}° ใน ${a.fortuneSign}`, `${a.partOfFortune}° in ${a.fortuneSign}`))}
      ${row2('Lot of Spirit', tr(`${a.partOfSpirit}° ใน ${a.spiritSign}`, `${a.partOfSpirit}° in ${a.spiritSign}`))}
    </tbody></table>
    ${box(tr('การตีความ Arabic Parts', 'Arabic Parts Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('จุดที่คำนวณจากมุมระหว่างดาว เริ่มในกรีก แล้วนักโหราศาสตร์อาหรับที่แบกแดดขยายเป็นระบบ', 'Points computed from the angles between planets — Greek in origin, systematised by the astrologers of Baghdad.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Arabic Lots (Hellenistic Lots) คำนวณจาก ASC + Moon + Sun — Part of Fortune ใน${a.fortuneSign}ชี้ทิศทางโชคลาภทางวัตถุ`, `Arabic Lots (Hellenistic Lots) are calculated from ASC + Moon + Sun — your Part of Fortune in ${a.fortuneSign} marks the direction of material flow.`)}</p>
  `);
}
function p_kabbalistic(c) {
    const k = c.kabbalistic;
    return section(0, tr('Kabbalistic — ต้นไม้แห่งชีวิต', 'Kabbalistic — Tree of Life'), '✡️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(k.sephira)}</div><div class="lbl">Sephira</div></div>
      <div class="stat-card"><div class="val">${k.score}</div><div class="lbl">Kabbalah Score</div></div>
    </div>
    ${bar(k.score, '#6a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sephira Hebrew', k.sephiraHebrew)}
      ${row2('Archangel', k.archangel)}
      ${row2('Hebrew Year', String(k.hebrewYear))}
      ${row2('Mazal (Zodiac)', k.mazalTh)}
    </tbody></table>
    ${box(tr('การตีความ Kabbalah', 'Kabbalistic Reading'), k.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('สายลึกลับของยิว เป็นรูปเป็นร่างในสเปนศตวรรษที่ 12-13 อ่านโลกผ่านต้นไม้แห่งชีวิต 10 เซฟิรอท', 'The Jewish mystical stream, formalised in 12th-13th-century Spain, reading the world through the ten sephirot of the Tree of Life.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Tree of Life มี 10 Sephirot — ${k.sephira} (${k.sephiraHebrew}) ปกครองโดย ${k.archangel} บ่งถึงแง่มุมจิตวิญญาณหลัก`, `The Tree of Life has 10 Sephirot — ${k.sephira} (${k.sephiraHebrew}), governed by ${k.archangel}, marks your primary spiritual aspect.`)}</p>
  `);
}
function p_zoroastrian(c) {
    const z = c.zoroastrian;
    return section(0, tr('Zoroastrian — ปรัชญาเปอร์เซีย', 'Zoroastrian — Persian Philosophy'), '🔥', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:14px">${esc(z.dayYazataTh.slice(0, 15))}</div><div class="lbl">Day Yazata</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zoroastrian Score</div></div>
    </div>
    ${bar(z.score, '#8a4a20')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('Yazata วันเกิด', 'Birth Yazata'), z.dayYazataTh)}
      ${row2(tr('Amesha เดือนเกิด', 'Birth-Month Amesha'), z.monthAmeshaTh)}
      ${row2(tr('ความสอดคล้อง', 'Harmony'), z.harmony ? tr('✓ ธาตุสอดคล้อง — เสริมพลัง', '✓ Elements aligned — power amplified') : tr('○ ธาตุต่างกัน — สร้างสมดุล', '○ Elements differ — creates balance'))}
    </tbody></table>
    ${box(tr('การตีความ Zoroastrian', 'Zoroastrian Reading'), z.reading, z.harmony ? 'green' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ศาสนาเปอร์เซียโบราณของ Zarathustra ปฏิทินตั้งชื่อ 30 วันตามเทพ และ 12 เดือนตามคุณธรรม', 'The ancient Persian faith of Zarathustra, whose calendar names all thirty days for divinities and all twelve months for virtues.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr('Yazata คือสิ่งศักดิ์สิทธิ์ใน Zoroastrianism — แต่ละวันและเดือนมี Yazata/Amesha ปกครอง', 'Yazatas are the sacred beings in Zoroastrianism — each day and month is governed by a specific Yazata or Amesha Spenta.')}</p>
  `);
}
function p_aztec(c) {
    const a = c.aztec;
    return section(0, tr('Aztec Tonalpohualli — ปฏิทิน 260 วัน', 'Aztec Tonalpohualli — 260-Day Sacred Calendar'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.daySignTh)}</div><div class="lbl">Day Sign</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aztec Score</div></div>
    </div>
    ${bar(a.score, '#8a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign (EN)', a.daySign + ' ' + a.daySignTh)}
      ${row2('Tone Number', `${a.toneNumber} — ${a.toneName}`)}
      ${row2('Day Sign Quality', a.daySignQuality)}
    </tbody></table>
    ${box(tr('การตีความ Tonalpohualli', 'Tonalpohualli Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Tonalpohualli 260 วันของแอซเท็ก รอบเดียวกับของมายา แต่คนละชุดชื่อสัญลักษณ์', 'The Aztec 260-day Tonalpohualli — the same round as the Maya count, under a different set of names.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Tonalpohualli คือปฏิทิน 260 วัน (20 Day Signs × 13 Tones) ใช้ร่วมกับ Mayan Tzolk'in — ${a.daySignTh} Tone ${a.toneNumber} กำหนดพลังงาน`, `Tonalpohualli is a 260-day calendar (20 Day Signs × 13 Tones), paired with the Mayan Tzolk'in — ${a.daySign} (${a.daySignTh}) Tone ${a.toneNumber} sets your energy signature.`)}</p>
  `);
}
function p_nativeAmerican(c) {
    const n = c.nativeAmerican;
    return section(0, tr('Native American — Birth Totem', 'Native American — Birth Totem & Clan'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(n.birthTotemTh)}</div><div class="lbl">Birth Totem</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Native American Score</div></div>
    </div>
    ${bar(n.score, '#8a5a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Birth Totem (EN)', n.birthTotem)}
      ${row2('Moon Cycle', n.moonCycle)}
      ${row2('Clan', n.clansmother)}
      ${row2(tr('ธาตุ', 'Element'), n.element)}
    </tbody></table>
    ${box(tr('การตีความ Native American', 'Native American Reading'), n.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Medicine Wheel ของชนพื้นเมืองอเมริกาเหนือ แบ่งปีเป็น 13 รอบจันทร์ แต่ละรอบมีสัตว์ประจำ', 'The Medicine Wheel of North American nations, dividing the year into thirteen moons, each with its own animal.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Medicine Wheel มี 13 moon cycle — Birth Totem ${n.birthTotemTh} (${n.birthTotem}) ใน ${n.clansmother} บ่งถึงสัตว์นำทางทางจิตวิญญาณ`, `The Medicine Wheel has 13 moon cycles — your Birth Totem ${n.birthTotem} (${n.birthTotemTh}) in the ${n.clansmother} clan marks your spirit guide animal.`)}</p>
  `);
}
function p_ifaYoruba(c) {
    const i = c.ifaYoruba;
    return section(0, tr('Ifa / Yoruba — Odù แห่งชะตา', 'Ifá / Yoruba — Odù of Destiny'), '🥁', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:18px">${esc(i.odu)}</div><div class="lbl">Odù ${i.oduNumber}</div></div>
      <div class="stat-card"><div class="val">${i.score}</div><div class="lbl">Ifa Score</div></div>
    </div>
    ${bar(i.score, '#6a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Odù (Thai)', i.oduTh)}
      ${row2('Theme', i.oduTheme)}
      ${row2('Fortune', i.fortune)}
    </tbody></table>
    ${box(tr('การตีความ Ifa', 'Ifá Reading'), i.reading, i.fortune.includes('เยี่ยม') ? 'green' : i.fortune.includes('ท้าทาย') ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('การเสี่ยงทายของชาวโยรูบา ไนจีเรีย มี 256 Odù เป็นคลังความรู้ที่ท่องสืบกันมา UNESCO ขึ้นทะเบียนเป็นมรดก', 'Yoruba divination from Nigeria: 256 odu, a memorised corpus, inscribed by UNESCO as intangible heritage.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Ifa มี 256 Odù (16×16) — ${i.odu} คือ Odù ที่ ${i.oduNumber} หนึ่งในระบบโชคชะตาของชาว Yoruba ไนจีเรีย/เบนิน`, `Ifá has 256 Odù (16×16) — yours is ${i.odu}, Odù #${i.oduNumber} of the Yoruba destiny system from Nigeria and Benin.`)}</p>
  `);
}
function p_aboriginal(c) {
    const a = c.aboriginal;
    return section(0, tr('Aboriginal Dreamtime — บรรพบุรุษแห่งฝัน', 'Aboriginal Dreamtime — Ancestors of the Dreaming'), '🌈', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.dreamingTh)}</div><div class="lbl">Dreaming Ancestor</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aboriginal Score</div></div>
    </div>
    ${bar(a.score, '#6a4a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Ancestor (EN)', a.dreamingAncestor)}
      ${row2('Season', a.season)}
      ${row2('Clan', a.clan)}
    </tbody></table>
    ${box(tr('การตีความ Dreamtime', 'Dreamtime Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ชาวอะบอริจินออสเตรเลียอ่านฤดูจากแผ่นดินและฟ้า ปฏิทิน 6 ฤดูของชาว Nyoongar เป็นชุดที่มีบันทึกชัดที่สุด', 'Aboriginal Australians read season from country and sky; the Nyoongar six-season calendar is among the best documented.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Dreamtime เป็นปรัชญาชาวอะบอริจินออสเตรเลีย — บรรพบุรุษ ${a.dreamingTh} ชี้แนะเส้นทางผ่านกฎธรรมชาติ`, `Dreamtime is the Aboriginal Australian philosophy — your Ancestor ${a.dreamingAncestor} (${a.dreamingTh}) guides your path through natural law.`)}</p>
  `);
}
function p_taksa(c) {
    const t8 = c.taksa;
    const isEn = _lang === 'en';
    // Life-arena meaning of each of the 8 Taksa houses (classical Thai reading)
    const HOUSE_MEANING = {
        'บริวาร': ['ผู้คนรอบตัว — ครอบครัว ลูกน้อง ทีมงาน', 'people around you — family, team, followers'],
        'อายุ': ['สุขภาพและอายุขัย', 'health & longevity'],
        'เดช': ['อำนาจ บารมี ชื่อเสียง', 'power, authority, reputation'],
        'ศรี': ['สิริมงคล เสน่ห์ โชคลาภ', 'grace, charm, fortune'],
        'มูละ': ['ทรัพย์สิน มรดก ฐานเงิน', 'wealth, assets, inheritance'],
        'อุตสาหะ': ['ความเพียร การงาน ความสำเร็จจากแรงตน', 'diligence — success earned by effort'],
        'มนตรี': ['ผู้อุปถัมภ์ ผู้ใหญ่เกื้อหนุน', 'mentors & patrons'],
        'กาลกิณี': ['เคราะห์และอุปสรรค — พลังที่ควรเลี่ยง', 'misfortune — the energy to avoid'],
    };
    const isKey = (nameTh) => nameTh === 'มูละ' || nameTh === 'กาลกิณี';
    const wheelRows = (t8.wheel || []).map(h => {
        const meaning = HOUSE_MEANING[h.houseNameTh];
        const meaningTxt = meaning ? (isEn ? meaning[1] : meaning[0]) : '';
        const hl = isKey(h.houseNameTh);
        return `<tr style="${hl ? 'background:#12101c' : ''}">
      <td class="lbl" style="${hl ? 'color:#c8a45a;font-weight:700' : ''}">${esc(isEn ? `${h.houseNameEn} (${h.houseNameTh})` : h.houseNameTh)}</td>
      <td style="${hl ? 'color:#e8c87a;font-weight:600' : ''}">${esc(isEn ? h.planetNameEn : h.planetNameTh)}</td>
      <td style="font-size:11px;color:#9a8a72">${esc(meaningTxt)}</td>
    </tr>`;
    }).join('');
    return section(0, tr('ทักษา ๘ บ้าน — โหราไทยคลาสสิก', 'Thai Taksa — Classical 8-House Astrology'), '🪷', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card">
        <div class="val" style="font-size:18px">${esc(isEn ? t8.dayLordEn : t8.dayLordTh)}</div>
        <div class="lbl">${tr('เจ้าวัน (ดาวประจำวันเกิด)', 'Day-lord planet')}</div>
      </div>
      <div class="stat-card"><div class="val">${t8.score}</div><div class="lbl">Taksa Score</div></div>
    </div>
    ${bar(t8.score, '#b07840')}
    <div class="grid-2" style="margin:12px 0">
      <div class="stat-card" style="border-color:#50b050">
        <div class="val" style="font-size:16px;color:#70c070">${esc(isEn ? t8.mulaEn : t8.mulaTh)}</div>
        <div class="lbl">${tr('มูละ — ฐานทรัพย์', 'Mula — wealth house')}</div>
      </div>
      <div class="stat-card" style="border-color:#a04030">
        <div class="val" style="font-size:16px;color:#d07050">${esc(isEn ? t8.kalakiniEn : t8.kalakiniTh)}</div>
        <div class="lbl">${tr('กาลกิณี — พลังที่ควรเลี่ยง', 'Kalakini — energy to avoid')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      <tr><td class="lbl" style="color:#7a6a52">${tr('บ้าน', 'House')}</td><td style="color:#7a6a52">${tr('ดาวประจำ', 'Planet')}</td><td style="color:#7a6a52">${tr('ความหมาย', 'Arena')}</td></tr>
      ${wheelRows}
    </tbody></table>
    ${box(tr('การตีความทักษา', 'Taksa Reading'), t8.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ทักษาไทย จัดดาว ๘ ดวงลง ๘ บ้านตามวันเกิด ใช้ตั้งชื่อและเลือกฤกษ์มาแต่โบราณ', 'Thai taksa places the eight planets into eight houses from your birth weekday — long used for naming and for choosing dates.')}</p>
  `);
}
function p_vedicMahadasha(c) {
    const v = c.vedicMahadasha;
    const DASHA_COLORS = {
        Jupiter: '#5a8a30', Venus: '#8a5a80', Sun: '#8a6020', Moon: '#5a7a9a',
        Mercury: '#3a7a60', Mars: '#9a3020', Saturn: '#4a4a5a', Rahu: '#5a3060', Ketu: '#6a5a30'
    };
    const col = DASHA_COLORS[v.currentDasha] ?? '#6a5a42';
    return section(0, tr('Vedic Mahadasha — ช่วงดาวปกครอง', 'Vedic Mahadasha — Planetary Period Cycles'), '🕉️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card" style="border-color:${col}">
        <div class="val" style="color:${col};font-size:20px">${esc(v.currentDasha)}</div>
        <div class="lbl">${tr('Mahadasha ปัจจุบัน', 'Current Mahadasha')}</div>
      </div>
      <div class="stat-card"><div class="val">${v.score}</div><div class="lbl">Mahadasha Score</div></div>
    </div>
    ${bar(v.score, col)}
    <table style="margin:12px 0"><tbody>
      ${row2('Mahadasha', v.currentDasha)}
      ${row2(tr('สิ้นสุด', 'Ends'), String(v.currentDashaEnd))}
      ${row2('Antardasha', v.antardasha)}
      ${row2(tr('คุณภาพ', 'Quality'), v.dashaQuality)}
      ${row2(tr('ธาตุ Dasha', 'Dasha Element'), v.dashaElement)}
    </tbody></table>
    ${box(tr('การตีความ Mahadasha', 'Mahadasha Reading'), v.reading, ['Jupiter', 'Venus', 'Sun'].includes(v.currentDashaKey) ? 'green' : ['Saturn', 'Rahu', 'Ketu'].includes(v.currentDashaKey) ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Vimshottari Dasha วงจร 120 ปีของ Vedic ที่บอกว่าดาวดวงไหนครองช่วงไหนของชีวิต', 'Vimshottari Dasha — the 120-year Vedic cycle naming which planet governs which stretch of a life.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Vedic Mahadasha กำหนด "ช่วงเวลา" ที่ดาวแต่ละดวงปกครองชีวิต — ${v.currentDasha} (${v.dashaQuality}) ครองจนถึงปี ${v.currentDashaEnd}`, `Vedic Mahadasha defines the periods during which each planet rules your life — ${v.currentDasha} (${v.dashaQuality}) rules through ${v.currentDashaEnd}.`)}</p>
  `);
}
