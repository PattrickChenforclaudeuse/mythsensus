// ============================================================
//  MYTHSENSUS — Report HTML Generator
//  Generates full 25-section report from ChartData.
//  Structure-first version: all sections with real calculated data.
//  Expand prose text per section in future iterations.
// ============================================================
import { ChartData, _setReportLang } from './calc'

// ── helpers ──────────────────────────────────────────────────
const esc = (s: string | number) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
// Strip HTML tags + collapse whitespace. Use for fields whose templates contain
// <strong>/<div>/<br> markup before truncating with substring(): cutting through
// a tag boundary leaves a broken open tag that the page renders as raw text.
const stripHtml = (s: string | number | undefined | null) =>
  String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
// Truncate a string with an ellipsis when it actually overflows. Prefer this
// over bare .slice(0,N) for badge-style labels — bare slice silently drops
// the suffix (e.g. "เดือนความจริง-ไฟ" → "เดือนความจริง-ไ" looks broken).
const trunc = (s: string | undefined | null, n: number) => {
  const v = String(s ?? '')
  return v.length > n ? v.slice(0, Math.max(1, n - 1)) + '…' : v
}

function bar(score: number, color: string) {
  const pct = Math.round((score - 300) / 7)
  return `<div style="background:#2a2010;border-radius:4px;height:10px;overflow:hidden;margin-top:4px">
    <div style="width:${pct}%;height:10px;border-radius:4px;background:${esc(color)}"></div></div>`
}

function scoreColor(s: number) {
  if (s >= 850) return '#d4aa50'
  if (s >= 750) return '#1a8a3a'
  if (s >= 650) return '#3a5a80'
  return '#9a8a72'
}

function pill(text: string, bg = '#2a2010', color = '#d4aa50') {
  return `<span style="display:inline-block;background:${bg};color:${color};border-radius:20px;padding:2px 10px;font-size:11px;margin:2px">${esc(text)}</span>`
}

// Auto-incrementing page counter (reset per report generation)
let _pageNum = 0
let _totalPages = 42
// Language for the currently-generating report. Set once by generateReport()
// from chart.input.lang so page headers/footers respect the user's choice.
let _lang: 'th' | 'en' = 'th'
// Translation helper. Use everywhere a Thai string is rendered into the
// report: tr('ดวงชะตา', 'destiny chart'). Returns Thai when _lang is 'th'
// (the default for the Thai-first market), English otherwise. Designed for
// inline use in template literals so the original Thai stays readable in
// source — translators / brand reviewers can still scan the English second
// argument without context-switching files.
const tr = (th: string, en: string) => _lang === 'en' ? en : th
function section(_num: number, title: string, icon: string, content: string) {
  _pageNum++
  const isEn = _lang === 'en'
  const pageLabel  = isEn ? `Page ${_pageNum} / ${_totalPages}` : `หน้า ${_pageNum} / ${_totalPages}`
  const footerText = isEn
    ? '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ AI-generated analysis of 26 ancient systems · for personal exploration, not professional advice ✦'
    : '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ รายงานสร้างโดย AI วิเคราะห์จาก 26 ศาสตร์โบราณ เพื่อการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ ✦'
  // No per-page bg override — body star-field shows through transparent .page
  return `
<div class="page">
  <div class="page-header">
    <span class="page-icon">${icon}</span>
    <span class="page-title">${esc(title)}</span>
    <span class="page-num">${pageLabel}</span>
  </div>
  <div class="page-body">
    ${content}
  </div>
  <div class="page-footer">${footerText}</div>
</div>`
}

function row2(label: string, value: string) {
  return `<tr><td class="lbl">${esc(label)}</td><td>${esc(value)}</td></tr>`
}

function box(title: string, body: string, type: 'gold' | 'green' | 'red' | 'dark' | 'purple' = 'gold') {
  const styles: Record<string, string> = {
    gold:   'background:#1e1a0e;border:1px solid #d4aa50;border-radius:8px;padding:14px;margin:8px 0',
    green:  'background:#0a1a0e;border:1px solid #1a8a3a;border-radius:8px;padding:14px;margin:8px 0',
    red:    'background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:14px;margin:8px 0',
    dark:   'background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:14px;margin:8px 0',
    purple: 'background:#120a1a;border:1px solid #7a3aaa;border-radius:8px;padding:14px;margin:8px 0',
  }
  return `<div style="${styles[type]}"><div style="font-weight:bold;margin-bottom:8px;color:#d4aa50">${esc(title)}</div><div style="font-size:13px;line-height:1.8;color:#c8c0a8">${body}</div></div>`
}

// ── CSS ───────────────────────────────────────────────────────
// Background uses a layered star-field via multiple radial-gradients
// (restored — previous version lost the starfield when bg was simplified
// to flat #0e0c08). Pages no longer have a hard min-height constraint so
// long content flows onto a second/third page naturally instead of being
// clipped.
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:#f0e8d0;
  background-color:#0e0c08;
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
    radial-gradient(ellipse at center, #141018 0%, #0a0812 55%, #050308 100%);
  background-size: 600px 800px, 700px 900px, 500px 700px, 800px 600px, 640px 750px, 720px 820px, 560px 680px, 900px 1000px, 820px 920px, 680px 860px, 100% 100%;
  background-attachment: fixed;
}
/* Each page uses transparent so the body star field shows through.
   min-height removed so content flows to next page when overflowing —
   UX first, hard pagination second. */
.page{padding:14mm 16mm 16mm;page-break-after:always;position:relative;background:transparent}
.page-header{display:flex;align-items:center;gap:10px;border-bottom:1px solid #3a3020;padding-bottom:10px;margin-bottom:18px}
.page-icon{font-size:22px}
.page-title{font-size:16px;font-weight:700;color:#d4aa50;flex:1;letter-spacing:1px}
.page-num{font-size:11px;color:#6a5a42}
.page-body{font-size:13px;line-height:1.8;color:#c8c0a8;padding-bottom:40px}
.page-footer{text-align:center;font-size:9px;color:#6a5a42;border-top:1px solid #2a2010;padding-top:6px;margin-top:18px}
h2{font-size:15px;color:#d4aa50;font-weight:700;margin:16px 0 8px;border-left:3px solid #d4aa50;padding-left:10px}
h3{font-size:13px;color:#c8a840;font-weight:600;margin:12px 0 6px}
p{margin-bottom:8px;color:#c8c0a8}
table{width:100%;border-collapse:collapse;margin:10px 0}
th{background:#1a1510;color:#d4aa50;padding:8px 10px;text-align:left;font-size:12px}
td{padding:7px 10px;border-bottom:1px solid #2a2010;font-size:12px;vertical-align:top}
.lbl{color:#9a8a72;font-weight:600;width:30%;background:#151210}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:10px 0}
.stat-card{background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.stat-card .val{font-size:28px;font-weight:700;color:#d4aa50}
.stat-card .lbl{font-size:11px;color:#9a8a72;width:auto;background:transparent;padding:0;margin-top:4px}
.pillar{background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.pillar.dm{border-color:#d4aa50;background:#1e1a0e}
.pillar .stem{font-size:32px;font-weight:700;color:#d4aa50}
.pillar .branch{font-size:22px;color:#c8a840;margin-top:4px}
.pillar .sublabel{font-size:10px;color:#6a5a42;margin-top:2px}
.conv{border-left:3px solid #d4aa50;padding:8px 12px;margin:8px 0;background:#1a1510}
.conv.med{border-left-color:#6a5a42;background:#151210}
.warn{background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:12px;margin:8px 0;color:#f0c8b0}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px}
@media print{
  .page{page-break-after:always;min-height:0}
  body{background:#fff;color:#1a1510}
  .page{background:#fff!important}
  h2{color:#8a6820}
  .page-title{color:#8a6820}
  .stat-card,.pillar{background:#f8f5f0;border-color:#ccc}
  td{border-color:#ddd}
  .lbl{background:#f0ede8}
}`

// ── PAGES ─────────────────────────────────────────────────────

// dd/mm/yyyy is ambiguous in international audiences (3/2 = March 2 or Feb 3?).
// Render with localized month name to remove the ambiguity.
const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const formatDob = (input: { day: number; month: number; year: number; lang?: 'th'|'en' }) => {
  const months = input.lang === 'en' ? MONTHS_EN : MONTHS_TH
  const m = months[Math.max(0, Math.min(11, input.month - 1))]
  return `${input.day} ${m} ${input.year}`
}

function p01_cover(c: ChartData): string {
  const { score, bazi, western, ninestar, numerology, input } = c
  const dobStr = formatDob({ ...input, lang: _lang })
  const timeStr = _lang === 'en'
    ? `${String(input.hour).padStart(2,'0')}:${String(input.minute).padStart(2,'0')}`
    : `${String(input.hour).padStart(2,'0')}:${String(input.minute).padStart(2,'0')} น.`
  const pctBar = Math.round((score.total - 400) / 6)
  // Tier label is only available in Thai from the engine. When rendering EN,
  // prefer score.tierEn (already English) and skip the secondary "TierEn ·"
  // line since it would duplicate. In TH we keep both to give the reader
  // both languages on the same row.
  const tierMain = _lang === 'en' ? esc(score.tierEn || score.tier) : esc(score.tier)
  const tierSub  = _lang === 'en'
    ? `${esc(score.percentile)} ${tr('ของโลก','globally')}`
    : `${esc(score.tierEn)} · ${esc(score.percentile)} ${tr('ของโลก','globally')}`

  return section(1, tr('Cosmic Blueprint — ภาพรวม', 'Cosmic Blueprint — Overview'), '✦', `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:10px;color:#6a5a42;letter-spacing:4px;margin-bottom:6px">✦ MYTHSENSUS — PREMIUM EDITION ✦</div>
      <div style="font-size:22px;font-weight:700;color:#d4aa50;margin-bottom:4px">Cosmic Blueprint · 26 Ancient Systems</div>
      <div style="font-size:12px;color:#9a8a72">${esc(input.gender)} ${esc(input.name)} · ${dobStr} · ${timeStr}</div>
    </div>

    <!-- Cosmic Score -->
    <div style="background:#1a1510;border:2px solid #d4aa50;border-radius:14px;padding:20px;margin:12px 0">
      <div style="display:flex;gap:20px;align-items:center">
        <div style="text-align:center;min-width:90px">
          <div style="font-size:60px;font-weight:700;color:#d4aa50;line-height:1">${score.cosmicFinal}</div>
          <div style="font-size:10px;color:#6a5a42;letter-spacing:1px">COSMIC SCORE</div>
          <div style="font-size:8px;color:#6a5a42;letter-spacing:.5px;margin-top:2px">${score.cosmicFinal === score.total ? 'Soul Frequency' : 'SF×40% + LT×30% + PR×30%'}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:20px;font-weight:700;color:#f0e8d0">${tierMain}</div>
          <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tierSub}</div>
          <div style="background:#2a2010;border-radius:6px;height:10px;overflow:hidden">
            <div style="width:${pctBar}%;height:10px;background:linear-gradient(90deg,#5a3810,#d4aa50)"></div>
          </div>
          <div style="font-size:10px;color:#6a5a42;margin-top:4px">
            ${tr('Median 26 ศาสตร์','Median 26 systems')} · Mean ${score.mean} · Modal ${score.modalBin}–${score.modalBin+49}
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

    <!-- 3-Score Framework -->
    <div style="margin:14px 0">
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px;letter-spacing:2px">THE 3-SCORE FRAMEWORK</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <!-- Soul Frequency -->
        <div style="background:#151a10;border:1px solid #4a6a20;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#6a8a40;letter-spacing:1px;margin-bottom:4px">SOUL FREQUENCY</div>
          <div style="font-size:28px;font-weight:700;color:#8aba50">${score.soulFrequency}</div>
          <div style="font-size:10px;color:#6a8a40">${tr('Born chart · น้ำมันเกรดไหน','Born chart · petroleum grade')}</div>
        </div>
        <!-- Life Terrain -->
        <div style="background:#1a1510;border:1px solid ${score.lifeTerrainScore > 0 ? '#8a6030' : '#3a2010'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#8a6030;letter-spacing:1px;margin-bottom:4px">LIFE TERRAIN</div>
          <div style="font-size:28px;font-weight:700;color:${score.lifeTerrainScore > 0 ? '#d4a040' : '#6a4020'}">${score.lifeTerrainScore > 0 ? score.lifeTerrainScore : '—'}</div>
          <div style="font-size:10px;color:#8a6030">${score.lifeTerrainScore > 0 ? 'Work environment' : tr('กรอกอาชีพ+ประเทศ','Add career + country')}</div>
          ${score.lifeTerrainDetail ? `<div style="font-size:9px;color:#6a4020;margin-top:3px">${esc(score.lifeTerrainDetail.split('|')[0])}</div>` : ''}
        </div>
        <!-- Path Resonance -->
        <div style="background:#10151a;border:1px solid ${score.pathResonanceScore > 0 ? '#205a5a' : '#103030'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#408080;letter-spacing:1px;margin-bottom:4px">PATH RESONANCE</div>
          <div style="font-size:28px;font-weight:700;color:${score.pathResonanceScore > 0 ? '#40c0a0' : '#206050'}">${score.pathResonanceScore > 0 ? score.pathResonanceScore : '—'}</div>
          <div style="font-size:10px;color:#408080">${score.pathResonanceScore > 0 ? 'Domain fit' : tr('กรอกสายงาน','Add domain')}</div>
          ${score.pathResonanceDetail ? `<div style="font-size:9px;color:#205050;margin-top:3px">${esc(score.pathResonanceDetail.split('|')[0])}</div>` : ''}
        </div>
      </div>
      <!-- Cosmic Final -->
      <div style="background:#1a1510;border-radius:8px;padding:10px;margin-top:8px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:11px;color:#9a8a72">
          Cosmic Final = SF×40% + LT×30% + PR×30%
          ${score.lifeTerrainScore === 0 ? ' · ' + tr('(LT/PR ยังไม่กรอกข้อมูล)','(LT/PR not filled yet)') : ''}
        </div>
        <div style="font-size:24px;font-weight:700;color:#d4aa50">${score.cosmicFinal}</div>
      </div>
    </div>

    <!-- Key signals -->
    <div class="grid-3" style="margin:12px 0">
      ${[
        ['🔥 Day Master', `${bazi.dayStem} ${bazi.dayMasterElement}`],
        ['⭐ Nine Star Ki', ninestar.star+' '+ninestar.starName],
        [tr('☀️ Western','☀️ Western Sun'), _lang==='en' ? (western as any).sunSign || western.sunSignTh : western.sunSignTh],
        ['🕉️ Vedic Lagna', c.vedic.lagnaSign],
        [tr('⚡ พลังงาน','⚡ Energy Type'), _lang==='en' ? (c.humandesign as any).type || c.humandesign.typeTh : c.humandesign.typeTh],
        ['🔢 Life Path', `${numerology.lifePath}`],
      ].map(([l,v]) => `<div class="stat-card"><div class="lbl">${esc(l)}</div><div style="font-size:13px;font-weight:600;color:#d4aa50;margin-top:3px">${esc(v)}</div></div>`).join('')}
    </div>

    ${bazi.benMingNian2026 ? `
    <div class="warn">
      <strong>⚠️ ${tr('Ben Ming Nian 2569','Ben Ming Nian (2026)')}</strong> — ${tr('เกิดปีม้า ตรงปี 2569 = ทุกสิ่งขยายผล ต้องใส่สีแดง 1 ชิ้น/วัน','Year of the Horse coincides with 2026 — everything amplifies. Wear at least one red item per day to balance.')}
    </div>` : ''}

    <div style="background:#0e0a16;border:1px solid #5a3a8a;border-radius:8px;padding:12px;margin:10px 0;display:flex;gap:12px;align-items:center">
      <div style="font-size:24px">✨</div>
      <div>
        <div style="font-size:13px;color:#c0a0e0;font-weight:600">${esc(score.cosmicEntity)}</div>
        <div style="font-size:11px;color:#7a6a9a;margin-top:2px">${tr('สัญลักษณ์จักรวาล','Cosmic symbol')} · ${esc(score.primaryGod)} &amp; ${esc(score.secondaryGod)}</div>
      </div>
    </div>
  `)
}

// ── 3-SCORE DETAIL ─────────────────────────────────────────────
function p_threeScores(c: ChartData): string {
  const { bazi, score } = c
  const SHENG: Record<string,string> = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'}
  const EL_EN: Record<string,string> = {'ไม้':'Wood','ไฟ':'Fire','ดิน':'Earth','โลหะ':'Metal','น้ำ':'Water'}
  const dmElEn = EL_EN[bazi.dayMasterElement] ?? 'Fire'
  // Domain example: Interior BD (construction = Earth, BD = Fire domain → Fire creates Earth → DM_CREATES)
  const bdEl = 'ไฟ' // BD domain = fire (persuasion, leadership)
  const industryEl = 'ดิน' // interior/construction = earth
  const countryEl = 'ไม้' // Thailand = Wood (tropical, agricultural)
  const feedsDm = SHENG[EL_EN[countryEl]??''] === dmElEn
  const domainFit = SHENG[EL_EN[bdEl]??''] === EL_EN[industryEl] ? 'ธาตุงานเสริมกัน ✓' : 'ธาตุงานต่างกัน'

  return section(2, tr('Soul Frequency — คุณเป็นใครตั้งแต่เกิด', 'Soul Frequency — Who You Are From Birth'), '🔥', `
    <div style="font-size:12px;color:#7a8a60;margin-bottom:16px;line-height:1.6">
      ${tr('Soul Frequency คือ', 'Soul Frequency is')} <strong style="color:#c0d080">${tr('คุณภาพดวงชะตาพื้นฐาน', 'your fundamental chart quality')}</strong> — ${tr('ไม่เปลี่ยนแปลง เหมือนเกรดน้ำมัน', 'unchanging, like the grade of petroleum')}<br>
      ${tr('คำนวณจาก Median ของ 26 ศาสตร์โบราณ (equal weight) เทียบกับ dataset n=1,211', 'Calculated from the median of 26 ancient systems (equal weight) against a dataset of n=1,211')}
    </div>

    <!-- Soul Frequency big display -->
    <div style="background:linear-gradient(135deg,#0e1a08,#1a2810);border:2px solid #4a7a20;border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="text-align:center">
          <div style="font-size:64px;font-weight:700;color:#8aba50;line-height:1">${score.total}</div>
          <div style="font-size:11px;color:#5a8a30;letter-spacing:2px">SOUL FREQUENCY</div>
        </div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:600;color:#c0e080">${_lang === 'en' ? esc(score.tierEn || score.tier) : esc(score.tier)}</div>
          <div style="font-size:12px;color:#7a9a50;margin:4px 0">${esc(score.percentile)} ${tr('ใน dataset n=1,211', 'in dataset n=1,211')}</div>
          <div style="background:#0a1205;border-radius:4px;height:8px;overflow:hidden;margin:8px 0">
            <div style="width:${Math.round((score.total-400)/6)}%;height:8px;background:linear-gradient(90deg,#2a5010,#8aba50)"></div>
          </div>
          <div style="display:flex;gap:8px;font-size:11px;color:#5a7a40">
            <span>Median: <strong style="color:#8aba50">${score.total}</strong></span>
            <span>Mean: ${score.mean}</span>
            <span>Modal: ${score.modalBin}–${score.modalBin+49}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Petroleum analogy -->
    <div style="background:#120a06;border:1px solid #5a3010;border-radius:8px;padding:14px;margin-bottom:14px">
      <div style="font-size:12px;color:#9a6040;margin-bottom:8px;font-weight:600">🛢️ Petroleum Grade Analogy</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;font-size:11px">
        <div style="background:#1a0e06;border-radius:6px;padding:10px">
          <div style="font-size:20px;margin-bottom:4px">🛢️</div>
          <div style="color:#d4aa50;font-weight:600">${tr('น้ำมัน', 'Petroleum')}</div>
          <div style="color:#7a5a40;margin-top:2px">Soul Frequency</div>
          <div style="color:#aa8050;font-size:12px;margin-top:4px">${score.total} ${tr('= เกรด', '= grade')} ${score.total >= 810 ? '95+' : score.total >= 730 ? '91' : score.total >= 650 ? 'diesel' : tr('ชีวมวล', 'biofuel')}</div>
        </div>
        <div style="background:#1a1206;border-radius:6px;padding:10px;opacity:0.7">
          <div style="font-size:20px;margin-bottom:4px">⚙️</div>
          <div style="color:#aa8840;font-weight:600">${tr('เครื่องยนต์', 'Engine')}</div>
          <div style="color:#7a6030;margin-top:2px">Life Terrain</div>
          <div style="color:#7a6030;font-size:12px;margin-top:4px">${tr('กรอกอาชีพ+ประเทศ', 'Add career + country')}</div>
        </div>
        <div style="background:#0a1015;border-radius:6px;padding:10px;opacity:0.7">
          <div style="font-size:20px;margin-bottom:4px">🔌</div>
          <div style="color:#408890;font-weight:600">${tr('ท่อเชื้อเพลิง', 'Fuel Line')}</div>
          <div style="color:#306070;margin-top:2px">Path Resonance</div>
          <div style="color:#306070;font-size:12px;margin-top:4px">${tr('กรอกสายงาน', 'Add domain')}</div>
        </div>
      </div>
    </div>

    <!-- Top contributors -->
    <div style="margin-bottom:14px">
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนสูงสุด (Top 5)', 'Top-5 highest-scoring systems')}</div>
      ${c.score.breakdown.slice().sort((a,b)=>b.score-a.score).slice(0,5).map(b =>
        `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#1a1510;border-radius:6px">
          <span style="font-size:12px;color:#c8b890">${esc(b.system)}</span>
          <span style="font-size:13px;font-weight:700;color:#d4aa50">${b.score}</span>
        </div>`
      ).join('')}
    </div>

    <!-- Bottom contributors -->
    <div>
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนต่ำสุด (Bottom 3) — ดาบสองคม', 'Bottom-3 lowest-scoring systems — double-edged sword')}</div>
      ${c.score.breakdown.slice().sort((a,b)=>a.score-b.score).slice(0,3).map(b =>
        `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#1a1008;border-radius:6px;border-left:2px solid #6a3010">
          <span style="font-size:12px;color:#a87050">${esc(b.system)}</span>
          <div style="text-align:right">
            <span style="font-size:13px;font-weight:700;color:#d07040">${b.score}</span>
            <div style="font-size:10px;color:#7a5030">${esc(b.finding.slice(0,40))}</div>
          </div>
        </div>`
      ).join('')}
      <div style="font-size:10px;color:#5a4030;margin-top:6px">
        ${tr('ⓘ คะแนนต่ำ ≠ แย่ — แสดงว่าระบบนั้นเห็นต่าง หรือพลังงานนั้นไม่ใช่ทิศทางหลักของคุณ', 'ⓘ A low score ≠ bad — it means this system sees something different, or that energy isn\'t your primary direction')}
      </div>
    </div>
  `)
}

function p02_scoreBreakdown(c: ChartData): string {
  // Group into 🌟 ≥780 / 〰 650-779 / ⚠ <650
  const sorted = c.score.breakdown.slice().sort((a,b) => b.score - a.score)
  const stars = sorted.filter(b => b.score >= 780)
  const mids  = sorted.filter(b => b.score >= 650 && b.score < 780)
  const warns = sorted.filter(b => b.score < 650)

  const systemRow = (b: typeof sorted[0], icon: string) => `
    <div style="display:flex;align-items:center;gap:8px;margin:3px 0;padding:5px 8px;background:#141210;border-radius:6px">
      <span style="min-width:20px;text-align:center">${icon}</span>
      <span style="flex:1;font-size:12px;color:#c8b890">${esc(b.system)}</span>
      <span style="font-size:12px;font-weight:600;color:#d4aa50;min-width:34px;text-align:right">${b.score}</span>
      <div style="width:80px;background:#1a1510;border-radius:3px;height:6px;overflow:hidden">
        <div style="width:${Math.round((b.score-400)/6)}%;height:6px;background:${b.color}"></div>
      </div>
    </div>`

  return section(3, tr('26-System Consensus — ทุกศาสตร์เห็นอะไร', '26-System Consensus — what every tradition sees'), '🌐', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px;line-height:1.6">
      ${tr('Equal weight · แต่ละระบบ 3.8% · คะแนน Median', 'Equal weight · each system 3.8% · Median score')} = <strong style="color:#d4aa50">${c.score.total}</strong>
      · Mean = ${c.score.mean} · Modal range = ${c.score.modalBin}–${c.score.modalBin+49}
    </div>

    <!-- Stars -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#4aaa4a;margin-bottom:6px">
        🌟 ${tr('เห็นด้วย', 'In agreement')} — ${stars.length} ${tr('ระบบ (คะแนน ≥780)', 'systems (score ≥780)')}
      </div>
      ${stars.map(b => systemRow(b,'🌟')).join('')}
    </div>

    <!-- Mids -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#aaaa4a;margin-bottom:6px">
        〰 ${tr('กลางๆ', 'Mixed')} — ${mids.length} ${tr('ระบบ (650–779)', 'systems (650–779)')}
      </div>
      ${mids.map(b => systemRow(b,'〰')).join('')}
    </div>

    <!-- Warns -->
    ${warns.length > 0 ? `
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#aa6a4a;margin-bottom:6px">
        ⚠ ${tr('เสียงเตือน', 'Caution signals')} — ${warns.length} ${tr('ระบบ (ต่ำกว่า 650)', 'systems (below 650)')}
      </div>
      ${warns.map(b => systemRow(b,'⚠')).join('')}
      <div style="font-size:10px;color:#7a5040;margin-top:6px">
        ${tr('ⓘ เสียงเตือน = ระบบนี้มองเห็นความท้าทาย หรือพลังงานนั้นไม่ใช่ทิศหลักของคุณ ไม่ได้แปลว่า "แย่"', 'ⓘ A caution signal = this system sees a challenge, or that energy isn\'t your primary direction. It doesn\'t mean "bad".')}
      </div>
    </div>` : ''}

    <!-- Stats summary -->
    <div style="background:#1a1510;border-radius:8px;padding:12px;margin-top:12px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[
          ['Median', c.score.total, '#d4aa50'],
          ['Mean', c.score.mean, '#b09040'],
          [tr('ต่ำสุด', 'Lowest'), Math.min(...c.score.breakdown.map(b=>b.score)), '#c07050'],
          [tr('สูงสุด', 'Highest'), Math.max(...c.score.breakdown.map(b=>b.score)), '#70c070'],
        ].map(([l,v,col]) => `<div><div style="font-size:18px;font-weight:700;color:${col}">${v}</div><div style="font-size:10px;color:#6a5a42">${l}</div></div>`).join('')}
      </div>
    </div>
  `)
}

function p03_convergence(c: ChartData): string {
  const all26 = c.score.breakdown  // all 26 systems with scores
  const medianScore = c.score.total
  const hi = (s: number) => s >= medianScore  // "votes yes" if at or above median

  // Helper: get system score by name fragment
  const sc = (nameFragment: string) =>
    all26.find(b => b.system.includes(nameFragment))?.score ?? 0

  const { bazi, western, ninestar, numerology, vedic, humandesign, mayan, celtic, thai,
          saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts,
          kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal,
          biorhythm, vedicMahadasha } = c
  const dmEl = bazi.dayMasterElement

  // ── RULE: Every system votes IF its score >= median AND it has relevant signal ──
  // This ensures all 26 systems participate in SOME theme

  type Vote = { system: string; score: number }
  type Theme = { icon: string; theme: string; color: string; votes: Vote[]; msg: string }
  const themes: Theme[] = []

  // ─── 1. Element Resonance (ธาตุ Day Master แผ่ซึมทุกศาสตร์) ─────────────
  // Vote: system score ≥ median + element/energy aligns with DM
  const ELEM_EL_MAP: Record<string,string> = {'ไม้':'Wood','ไฟ':'Fire','ดิน':'Earth','โลหะ':'Metal','น้ำ':'Water','ลม':'Wood','Air':'Wood'}
  const SHENG: Record<string,string> = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'}
  const dmElEn = ELEM_EL_MAP[dmEl] ?? 'Fire'
  const elVotes: Vote[] = []
  // BaZi — always votes for its own DM
  elVotes.push({ system:'BaZi Day Master', score:sc('BaZi') })
  // Systems that directly echo the same element
  if (ninestar.starElement === dmEl) elVotes.push({ system:'Nine Star Ki ('+ninestar.starName+')', score:sc('Nine Star') })
  if (saju.sajuElement === dmEl) elVotes.push({ system:'Saju Korean', score:sc('Saju') })
  if (norseRune.runeElement === dmEl) elVotes.push({ system:'Norse Rune '+norseRune.rune+' '+norseRune.runeName, score:sc('Norse') })
  if (ogham.element === dmEl) elVotes.push({ system:'Ogham '+ogham.ogham+' '+ogham.treeName, score:sc('Ogham') })
  // Systems that produce dmEl's element OR compatible element
  if (celtic.element === dmEl || SHENG[ELEM_EL_MAP[celtic.element]??''] === dmElEn)
    elVotes.push({ system:'Celtic '+celtic.treeNameTh+' ('+celtic.element+')', score:sc('เซลติก') })
  if (tibetan.mewaElement === dmEl || SHENG[ELEM_EL_MAP[tibetan.mewaElement]??''] === dmElEn)
    elVotes.push({ system:'Tibetan Mewa '+tibetan.mewa+' ('+tibetan.mewaElement+')', score:sc('Tibetan') })
  if (nativeAmerican.element === dmEl || SHENG[ELEM_EL_MAP[nativeAmerican.element]??''] === dmElEn)
    elVotes.push({ system:'Native American '+nativeAmerican.birthTotemTh, score:sc('Native') })
  // High-scoring systems that support the DM element path
  if (hi(sc('Vedic')) && vedicMahadasha.dashaElement === dmEl)
    elVotes.push({ system:'Vedic Dasha '+vedicMahadasha.currentDasha, score:sc('Vedic M') })
  if (hi(sc('Zoroastrian')) && zoroastrian.harmony)
    elVotes.push({ system:'Zoroastrian (harmony)', score:sc('Zoroastrian') })
  if (hi(sc('Hellenistic')) && hellenistic.sect === 'Day Sect' && dmEl === 'ไฟ')
    elVotes.push({ system:'Hellenistic Day Sect', score:sc('Hellenistic') })
  // All high-scoring systems implicitly resonate with the chart's energy
  ;[
    { sys:'Aztec', label:'Aztec '+aztec.daySignTh },
    { sys:'Ifa', label:'Ifa/Yoruba '+ifaYoruba.odu },
    { sys:'Aboriginal', label:'Aboriginal '+aboriginal.dreamingTh },
    { sys:'Kabbalistic', label:'Kabbalistic '+kabbalistic.sephira },
    { sys:'Onmyōdō', label:'Onmyōdō '+onmyodo.rokuyo },
  ].forEach(({ sys, label }) => { const s = all26.find(b=>b.system.toLowerCase().includes(sys.toLowerCase()))?.score??0; if (s>=780) elVotes.push({ system:label, score:s }) })
  themes.push({ icon:'🔥', theme:`ธาตุ${dmEl} — แกนพลังงานที่ทุกศาสตร์สะท้อน`,
    color:'#d48050', votes:elVotes,
    msg:`Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) + สีมงคล ${ninestar.starColor} + ทิศ ${ninestar.starDirection} — ธาตุ${dmEl}คือเส้นด้ายทอง` })

  // ─── 2. High-Score Consensus (ศาสตร์ที่เห็นภาพรวมดี) ───────────────────
  const highVotes: Vote[] = all26.filter(b => b.score >= 780).map(b => ({ system:b.system, score:b.score }))
  themes.push({ icon:'🌟', theme:'High Consensus — ศาสตร์ที่เห็นภาพดีพร้อมกัน (คะแนน ≥780)',
    color:'#c0a030', votes:highVotes,
    msg:`${highVotes.length} ระบบให้คะแนนสูง — Top: ${highVotes.sort((a,b)=>b.score-a.score).slice(0,3).map(v=>v.system.split(' ')[0]).join(' · ')}` })

  // ─── 3. Timing 2026 — ปีนี้มีพลังงานพิเศษ ────────────────────────────────
  const timeVotes: Vote[] = []
  if (bazi.benMingNian2026) timeVotes.push({ system:'BaZi Ben Ming Nian ม้า', score:sc('BaZi') })
  if (ninestar.star === 9) timeVotes.push({ system:'NSK Star 9 Honmei Kaiki', score:sc('Nine Star') })
  if ([1,3,8,9].includes(numerology.personalYear2026)) timeVotes.push({ system:'Numerology PY'+numerology.personalYear2026, score:sc('Pythagorean') })
  if (['Jupiter','Sun','Venus'].includes(vedicMahadasha.currentDasha)) timeVotes.push({ system:'Vedic '+vedicMahadasha.currentDasha+' Dasha', score:sc('Vedic M') })
  if (biorhythm.intellectual > 20 || biorhythm.emotional > 20) timeVotes.push({ system:'Biorhythm (peak '+Math.max(biorhythm.intellectual,biorhythm.emotional)+'%)', score:sc('Biorhythm') })
  if (!['รุ่งเรือง','เข้มแข็ง','มั่นคง','เติบโต'].every(q => !tibetan.mewaQuality.includes(q))) timeVotes.push({ system:'Tibetan Mewa '+tibetan.mewa+' ('+tibetan.mewaQuality+')', score:sc('Tibetan') })
  if (['大安','友引'].includes(onmyodo.rokuyo)) timeVotes.push({ system:'Onmyōdō '+onmyodo.rokuyo, score:sc('Onmyōdō') })
  if (zoroastrian.harmony) timeVotes.push({ system:'Zoroastrian harmony', score:sc('Zoroastrian') })
  if (['Ogbe','Ose','Obara','Otura'].includes(ifaYoruba.odu)) timeVotes.push({ system:'Ifa/Yoruba '+ifaYoruba.odu+' ('+ifaYoruba.fortune+')', score:sc('Ifa') })
  if (hi(sc('Hellenistic'))) timeVotes.push({ system:'Hellenistic Fortune '+hellenistic.lotSign, score:sc('Hellenistic') })
  if (['Fehu','Jera','Dagaz','Sowilo'].includes(norseRune.runeName)) timeVotes.push({ system:'Norse Rune '+norseRune.runeName, score:sc('Norse') })
  if (sc('Aztec') >= 780) timeVotes.push({ system:'Aztec '+aztec.daySignTh+' Tone '+aztec.toneNumber, score:sc('Aztec') })
  if (sc('Aboriginal') >= 770) timeVotes.push({ system:'Aboriginal '+aboriginal.dreamingTh, score:sc('Aboriginal') })
  if (hi(sc('Saju'))) timeVotes.push({ system:'Saju '+saju.kwarsal, score:sc('Saju') })
  if (sc('Zi Wei') >= 770) timeVotes.push({ system:'Zi Wei '+ziwei.mainStarTh, score:sc('Zi Wei') })
  themes.push({ icon:'⏰', theme:'ปี 2026 — หน้าต่างโอกาส',
    color:'#50c050', votes:timeVotes,
    msg:`${bazi.benMingNian2026?'Ben Ming Nian + ':''} ${ninestar.star===9?'NSK Honmei + ':''} PY${numerology.personalYear2026} + ${vedicMahadasha.currentDasha} Dasha` })

  // ─── 4. Strength / Authority (ความแข็งแกร่ง) ─────────────────────────────
  const strVotes: Vote[] = []
  ;[sc('BaZi'),sc('Nine Star'),sc('Saju'),sc('Zi Wei'),sc('Tibetan'),sc('Norse'),sc('Kabbalistic')].forEach((s,i) => {
    const labels = ['BaZi '+bazi.dayMasterTh,'NSK Star '+ninestar.star,'Saju '+saju.dominantEnergy,'Zi Wei '+ziwei.mainStarTh,'Tibetan Mewa '+tibetan.mewa,'Norse '+norseRune.runeName,'Kabbalistic '+kabbalistic.sephira]
    if (s >= 780) strVotes.push({ system:labels[i], score:s })
  })
  if (['Projector','Manifesting Generator','Manifestor'].includes(humandesign.type)) strVotes.push({ system:'Energy Type '+humandesign.typeTh, score:sc('พลังงาน') })
  if ([1,8,11,22,33].includes(numerology.lifePath)||numerology.lifePath>=7) strVotes.push({ system:'Life Path '+numerology.lifePath+' '+numerology.lifePathName.split('—')[0], score:sc('Pythagorean') })
  if (hi(sc('Hellenistic'))) strVotes.push({ system:'Hellenistic '+hellenistic.trigonLord.split('(')[0], score:sc('Hellenistic') })
  if (['Ogbe','Obara','Ogunda'].includes(ifaYoruba.odu)) strVotes.push({ system:'Ifa/Yoruba '+ifaYoruba.odu, score:sc('Ifa') })
  if (hi(sc('Native'))) strVotes.push({ system:'Native Am '+nativeAmerican.birthTotemTh, score:sc('Native') })
  if (hi(sc('Aztec'))) strVotes.push({ system:'Aztec '+aztec.daySignTh, score:sc('Aztec') })
  themes.push({ icon:'👑', theme:'ความแข็งแกร่งและอำนาจ — พลังงานผู้นำ',
    color:'#c0a030', votes:strVotes,
    msg:`${humandesign.typeTh} Profile ${humandesign.profile} + LP${numerology.lifePath} + NSK Star ${ninestar.star} + Zi Wei ${ziwei.mainStarTh}` })

  // ─── 5. Wealth / Material (ศักยภาพทรัพย์) ────────────────────────────────
  const wlthVotes: Vote[] = []
  if (hi(sc('Arabic'))) wlthVotes.push({ system:'Arabic Parts Fortune '+arabicParts.fortuneSign, score:sc('Arabic') })
  if (hi(sc('Hellenistic'))) wlthVotes.push({ system:'Hellenistic '+hellenistic.sect, score:sc('Hellenistic') })
  ;['Ifa','Zi Wei','Kabbalistic','Norse','Ogham','Aztec','Native','Aboriginal','Zoroastrian','Tibetan','Onmyōdō','Saju'].forEach(name => {
    const s = all26.find(b=>b.system.toLowerCase().includes(name.toLowerCase()))?.score??0
    if (s>=780) {
      const labels: Record<string,string> = {
        'Ifa':'Ifa '+ifaYoruba.fortune,'Zi Wei':'Zi Wei '+ziwei.palaceQuality,'Kabbalistic':'Kabbalistic '+kabbalistic.sephira,
        'Norse':'Norse Rune '+norseRune.runeName,'Ogham':'Ogham '+ogham.treeNameTh,'Aztec':'Aztec '+aztec.daySignQuality,
        'Native':'Native Am '+nativeAmerican.birthTotemTh,'Aboriginal':'Aboriginal '+aboriginal.dreamingTh,
        'Zoroastrian':'Zoroastrian '+trunc(zoroastrian.dayYazataTh, 20),'Tibetan':'Tibetan Mewa '+tibetan.mewa,
        'Onmyōdō':'Onmyōdō '+onmyodo.rokuyo,'Saju':'Saju '+saju.kwarsal,
      }
      wlthVotes.push({ system:labels[name]??name, score:s })
    }
  })
  if (['Jupiter','Venus','Sun'].includes(vedicMahadasha.currentDasha)) wlthVotes.push({ system:'Vedic '+vedicMahadasha.currentDasha+' Dasha', score:sc('Vedic M') })
  if ([8,4,22].includes(numerology.pythagorean)) wlthVotes.push({ system:'Pythagorean '+numerology.pythagorean, score:sc('Pythagorean') })
  themes.push({ icon:'💎', theme:'ศักยภาพความมั่งคั่ง',
    color:'#50b080', votes:wlthVotes,
    msg:`${wlthVotes.length} ระบบเห็นโอกาส — Arabic Parts ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha + Lucky Element ${bazi.luckyElement}` })

  // ─── 6. Spiritual / Inner Depth (ความลึกภายใน) ───────────────────────────
  const deptVotes: Vote[] = []
  if ([7,9,11,33].includes(numerology.lifePath)) deptVotes.push({ system:'Life Path '+numerology.lifePath, score:sc('Pythagorean') })
  if (humandesign.profile.startsWith('6')||humandesign.profile.startsWith('5')) deptVotes.push({ system:'HD Profile '+humandesign.profile, score:sc('พลังงาน') })
  ;['Kabbalistic','Aboriginal','Ifa','Norse','Ogham','Tibetan','Aztec','Zoroastrian','Native'].forEach(name => {
    const s = all26.find(b=>b.system.toLowerCase().includes(name.toLowerCase()))?.score??0
    if (s>=760) {
      const lbl: Record<string,string> = {
        'Kabbalistic':'Kabbalistic '+kabbalistic.sephira,'Aboriginal':'Aboriginal '+aboriginal.dreamingTh,
        'Ifa':'Ifa/Yoruba '+ifaYoruba.oduTheme.slice(0,15),'Norse':'Norse Rune '+norseRune.runeKeyword,
        'Ogham':'Ogham '+ogham.oghamClass,'Tibetan':'Tibetan Mewa '+tibetan.mewaQuality,
        'Aztec':'Aztec '+aztec.daySignQuality,'Zoroastrian':'Zoroastrian '+trunc(zoroastrian.monthAmeshaTh, 22),
        'Native':'Native Am '+nativeAmerican.clansmother,
      }
      deptVotes.push({ system:lbl[name]??name, score:s })
    }
  })
  if (['กรกฎ','พิจิก','มีน'].includes(western.moonSignTh)) deptVotes.push({ system:'Western Moon '+western.moonSignTh, score:sc('ตะวันตก') })
  themes.push({ icon:'🔮', theme:'ความลึกภายใน — จิตวิญญาณและสัญชาตญาณ',
    color:'#9060c0', votes:deptVotes,
    msg:`LP${numerology.lifePath} + ${kabbalistic.sephira} + ${aboriginal.dreamingTh} + Vedic Nakshatra ${vedic.moonNakshatra}` })

  // ─── 7. Tension / Challenge (จุดท้าทาย) ───────────────────────────────────
  const warnVotes: Vote[] = all26.filter(b => b.score < 650).map(b => ({ system:b.system+' ('+b.score+')', score:b.score }))
  if (bazi.missingElement && bazi.missingElement !== 'ครบทุกธาตุ') warnVotes.push({ system:'BaZi ขาดธาตุ'+bazi.missingElement, score:sc('BaZi') })
  if (['Rahu','Saturn','Ketu'].includes(vedicMahadasha.currentDasha)) warnVotes.push({ system:'Vedic Dasha '+vedicMahadasha.currentDasha, score:sc('Vedic M') })
  themes.push({ icon:'⚡', theme:'จุดท้าทาย — พลังงานสร้างการเติบโต',
    color:'#c05030', votes:warnVotes,
    msg:`ระบบที่เห็นต่าง: ${warnVotes.slice(0,3).map(v=>v.system.split(' (')[0].split(' ')[0]).join(', ')} — ความขัดแย้งนี้เป็นแรงขับ ไม่ใช่ข้อบกพร่อง` })

  // ─── 8. Relationship / Network ───────────────────────────────────────────
  const relVotes: Vote[] = []
  if (humandesign.profile.includes('4')||humandesign.profile.includes('6')) relVotes.push({ system:'HD Profile '+humandesign.profile, score:sc('พลังงาน') })
  ;['Ifa','Aboriginal','Native','Zoroastrian','Kabbalistic','Ogham','Norse'].forEach(name => {
    const s = all26.find(b=>b.system.toLowerCase().includes(name.toLowerCase()))?.score??0
    if (s>=760) {
      const lbl: Record<string,string> = {
        'Ifa':'Ifa/Yoruba '+ifaYoruba.oduTheme.slice(0,12),'Aboriginal':'Aboriginal '+aboriginal.clan,
        'Native':'Native Am '+nativeAmerican.clansmother,'Zoroastrian':'Zoroastrian '+trunc(zoroastrian.dayYazataTh, 20),
        'Kabbalistic':'Kabbalistic '+kabbalistic.archangel,'Ogham':'Ogham '+ogham.treeName,
        'Norse':'Norse Rune '+norseRune.runeName,
      }
      relVotes.push({ system:lbl[name]??name, score:s })
    }
  })
  if (['ตุลย์','กรกฎ','มีน','พฤษภ'].includes(western.sunSignTh)) relVotes.push({ system:'Western Sun '+western.sunSignTh, score:sc('ตะวันตก') })
  themes.push({ icon:'💞', theme:'พลังความสัมพันธ์ — เครือข่ายและการเชื่อมต่อ',
    color:'#c06080', votes:relVotes,
    msg:`HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} + ${ifaYoruba.oduTheme.slice(0,20)}` })

  const visible = themes.filter(t => t.votes.length >= 3).sort((a,b) => b.votes.length - a.votes.length)

  // Generate narrative for each theme based on chart data
  const narratives: Record<string,string> = {
    '🔥': `จาก ${c.score.breakdown.filter(b=>b.score>=780).length} ระบบที่ให้คะแนนสูง ธาตุ${dmEl}ปรากฏชัดเจนที่สุด — Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) กำหนดวิธีที่คุณประมวลผลโลก ไม่ใช่แค่ "นิสัย" แต่คือโครงสร้างพื้นฐานของการตัดสินใจและพลังงานชีวิต ศาสตร์ทั้งในและตะวันตกต่างยืนยันสิ่งเดียวกันโดยไม่รู้จักกัน`,
    '🌟': `เมื่อมีระบบจากหลายวัฒนธรรม (ตะวันออก ตะวันตก แอฟริกา อเมริกา โอเชียเนีย) ต่างให้คะแนนสูงพร้อมกัน — นั่นคือ consensus ที่แท้จริง ไม่ใช่แค่ระบบใดระบบหนึ่งชอบ แต่ "ดวงชาตา" นี้แข็งแกร่งข้ามวัฒนธรรม`,
    '⏰': `ปี 2026 ไม่ใช่แค่ปีดีโดยบังเอิญ แต่มีกลไกทางโหราศาสตร์หลายชั้นเปิดพร้อมกัน — BaZi Ben Ming Nian หมายถึงพลังงานของคุณ "กลับบ้าน" ครบรอบ 12 ปี, NSK Star 9 Honmei Kaiki หมายถึงดาวเกิดตรงกับดาวปี, Vedic Dasha ชี้ช่วงปกครอง ${vedicMahadasha.currentDasha} — นี่คือ window ที่ควรลงมือ`,
    '👑': `ลักษณะผู้นำในดวงชาตาไม่ได้มาจากความทะเยอทะยาน แต่มาจากโครงสร้างของพลังงาน — ${humandesign.typeTh} Strategy "${humandesign.strategy}" ประกอบกับ NSK Star ${ninestar.star} และ LP${numerology.lifePath} บ่งว่าคุณถูกออกแบบให้ "guide" มากกว่า "push"`,
    '💎': `ศักยภาพทรัพย์ในดวงไม่ใช่การรับรองว่าจะรวย แต่คือ "ทิศทาง" ที่พลังงานไหลได้ดีที่สุด — Arabic Parts Fortune ใน${arabicParts.fortuneSign} ร่วมกับ ${vedicMahadasha.currentDasha} Dasha และ Lucky Element ${bazi.luckyElement} บ่งทิศ`,
    '🔮': `ความลึกทางจิตวิญญาณใน LP${numerology.lifePath} + ${kabbalistic.sephira} + ${celtic.treeNameTh} บ่งว่าคุณมี "antenna" รับสัญญาณที่ละเอียดกว่าคนทั่วไป — สิ่งนี้อาจทำให้ตัดสินใจช้า แต่เมื่อตัดสินใจแล้วมักถูกต้อง`,
    '⚡': `ทุกจุดท้าทายในดวงมีเหตุผล — ธาตุขาด${bazi.missingElement ? bazi.missingElement : 'ไม่มี'} คือพลังงานที่ต้องหามาจากภายนอก ระบบที่ score ต่ำกว่า median ไม่ได้บอกว่า "ดวงแย่" แต่บอกว่า "พลังงานนั้นไม่ใช่ทิศหลัก"`,
    '💞': `พลังความสัมพันธ์ใน HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} บ่งว่าเครือข่ายมนุษย์คือ multiplier — คนเดียวได้ 1x แต่ผ่านคนที่ใช่ได้ 5-10x`,
  }

  return section(4, tr(`Grand Convergence — ${visible.length} themes จาก 26 ศาสตร์`, `Grand Convergence — ${visible.length} themes across 26 systems`), '🌐', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px;line-height:1.6">
      ${tr('ทุก 26 ระบบ cast votes ในแต่ละ theme — score-based · ชื่อระบบแสดงครบทุกตัว · narrative คือ AI สังเคราะห์จากดวงจริง', 'All 26 systems cast votes per theme — score-weighted · every system listed by name · narrative AI-synthesised from your specific chart')}
    </div>
    ${visible.map(t => consensusRow(t.icon, t.theme, t.votes.map(v=>v.system), t.msg, t.votes.length, t.color, narratives[t.icon]??'')).join('')}
  `)
}

function p_new16systems(c: ChartData): string {
  const systems = [
    { name:'Saju (Korean)', icon:'🇰🇷', data: `${c.saju.yearPillar} ${c.saju.monthPillar} ${c.saju.dayPillar} ${c.saju.hourPillar}`, detail: c.saju.dominantEnergy, score: c.saju.score },
    { name:'Tibetan Mewa', icon:'☸️', data: `Mewa ${c.tibetan.mewa} ${c.tibetan.mewaName}`, detail: c.tibetan.parkhaName, score: c.tibetan.score },
    { name:'Zi Wei (紫微)', icon:'🌌', data: c.ziwei.mainStarTh, detail: c.ziwei.lifePalaceName, score: c.ziwei.score },
    { name:'Onmyōdō', icon:'⛩️', data: `${c.onmyodo.rokuyo} ${c.onmyodo.rokuyoTh}`, detail: c.onmyodo.onmyoPolarity, score: c.onmyodo.score },
    { name:'Hellenistic', icon:'🏛️', data: `${c.hellenistic.sect}`, detail: `Fortune ใน ${c.hellenistic.lotSign}`, score: c.hellenistic.score },
    { name:'Norse Rune', icon:'ᚱ', data: `${c.norseRune.rune} ${c.norseRune.runeName}`, detail: c.norseRune.runeKeyword, score: c.norseRune.score },
    { name:'Ogham', icon:'🌿', data: `${c.ogham.ogham} ${c.ogham.treeName}`, detail: c.ogham.oghamClass, score: c.ogham.score },
    { name:'Arabic Parts', icon:'⭐', data: `Fortune ใน ${c.arabicParts.fortuneSign}`, detail: `Spirit ใน ${c.arabicParts.spiritSign}`, score: c.arabicParts.score },
    { name:'Kabbalistic', icon:'✡️', data: c.kabbalistic.sephira, detail: c.kabbalistic.archangel, score: c.kabbalistic.score },
    { name:'Zoroastrian', icon:'🔥', data: c.zoroastrian.dayYazataTh.slice(0,20), detail: c.zoroastrian.monthAmeshaTh.slice(0,20), score: c.zoroastrian.score },
    { name:'Aztec', icon:'🦅', data: `${c.aztec.daySignTh} ${c.aztec.toneNumber}`, detail: c.aztec.daySignQuality, score: c.aztec.score },
    { name:'Native American', icon:'🦅', data: c.nativeAmerican.birthTotemTh, detail: c.nativeAmerican.clansmother, score: c.nativeAmerican.score },
    { name:'Ifa/Yoruba', icon:'🥁', data: `Odù ${c.ifaYoruba.odu}`, detail: c.ifaYoruba.fortune, score: c.ifaYoruba.score },
    { name:'Aboriginal', icon:'🌈', data: c.aboriginal.dreamingTh, detail: c.aboriginal.clan, score: c.aboriginal.score },
    { name:'Biorhythm', icon:'📈', data: `P:${c.biorhythm.physical}% E:${c.biorhythm.emotional}%`, detail: c.biorhythm.intellectualPhase, score: c.biorhythm.score },
    { name:'Vedic Mahadasha', icon:'🕉️', data: `${c.vedicMahadasha.currentDasha} Dasha`, detail: `ถึงปี ${c.vedicMahadasha.currentDashaEnd}`, score: c.vedicMahadasha.score },
  ]
  return section(5, tr('16 ระบบเพิ่มเติม — ภาพรวม', '16 Additional Systems — Overview'), '🌍', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px">
      ${tr('ภาพรวมย่อของ 16 ศาสตร์ที่เพิ่งเพิ่มเข้ามา — ดูรายละเอียดเต็มใน Premium+ version', 'Compact summary of 16 newly-added world traditions — full readings in the Premium+ pages')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${systems.map(s => `
        <div style="background:#141210;border:1px solid #2a2010;border-radius:8px;padding:10px;display:flex;gap:8px;align-items:flex-start">
          <span style="font-size:16px;flex-shrink:0">${esc(s.icon)}</span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;font-weight:600;color:#c8b890">${esc(s.name)}</span>
              <span style="font-size:12px;font-weight:700;color:${s.score>=780?'#60c060':s.score>=650?'#c0c040':'#c06030'}">${s.score}</span>
            </div>
            <div style="font-size:12px;color:#d4aa50;margin-top:2px">${esc(s.data)}</div>
            <div style="font-size:10px;color:#6a5a42;margin-top:1px">${esc(s.detail)}</div>
          </div>
        </div>`).join('')}
    </div>
  `)
}

function p04_western(c: ChartData): string {
  const w = c.western
  // Sun/moon/asc sign labels — engine produces Thai names by default; for EN
  // we strip the Thai-suffix sentences and lean on the existing sunSign/moonSign
  // English values from the Western calculator.
  const isEn = _lang === 'en'
  const sunLabel  = isEn ? w.sunSign  : w.sunSignTh
  const moonLabel = isEn ? w.moonSign : w.moonSignTh
  const ascLabel  = isEn ? w.ascSign  : w.ascSignTh
  return section(4, tr('โหราศาสตร์ตะวันตก', 'Western Astrology'), '☀️', `
    <h2>${tr('ตำแหน่งดาวหลัก', 'Major planetary positions')}</h2>
    <table><tbody>
      ${row2(tr('☉ ดวงอาทิตย์','☉ Sun'), `${sunLabel} — ${Math.round(w.sunDeg % 30)}° ${sunLabel}`)}
      ${row2(tr('☽ ดวงจันทร์','☽ Moon'), `${moonLabel} — ${Math.round(w.moonDeg % 30)}° ${moonLabel}`)}
      ${row2(tr('ASC ราศีขึ้น','ASC Rising sign'), `${ascLabel} — ${Math.round(w.ascDeg % 30)}° ${ascLabel}`)}
      ${row2(tr('♃ ดาวพฤหัสฯ','♃ Jupiter'), w.jupiterSign)}
      ${row2(tr('♄ ดาวเสาร์','♄ Saturn'), w.saturnSign)}
      ${row2('Transit 2026', w.transitNote2026)}
    </tbody></table>

    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:','Origin:')}</strong> ${tr(
      'มีต้นกำเนิดจากอารยธรรม Babylonian กว่า 4,000 ปีก่อน ถูก Hellenistic Greeks พัฒนาเป็นระบบ Zodiac 12 ราศี และ Ptolemy (100 AD) รวบรวมเป็น "Tetrabiblos" — คัมภีร์โหราศาสตร์หลักจนถึงปัจจุบัน นิยมสูงสุดในโลกตะวันตก เพราะ Sun Sign ใน 5 นาทีทำให้ใครก็เข้าถึงได้',
      'Originating in Babylonian civilisation over 4,000 years ago, refined by Hellenistic Greeks into the 12-sign Zodiac, and consolidated by Ptolemy (~100 AD) into Tetrabiblos — still the canonical text for Western astrology. The most popular tradition in the West because a Sun sign reading takes 5 minutes and is universally accessible.'
    )}</p>
    <h2>${tr('การตีความ','Interpretation')}</h2>
    ${box(tr('ดวงอาทิตย์ ☉ — แกนตัวตน','Sun ☉ — Core Identity'),
      tr(`ดวงอาทิตย์ใน${w.sunSignTh} — คุณมีพลังงานหลักของ${w.sunSignTh} ซึ่งหมายถึงแก่นกลางของบุคลิกภาพและพลังสร้างสรรค์ที่คุณฉายออกสู่โลก`,
         `Sun in ${w.sunSign} — your primary energy carries the qualities of ${w.sunSign}, the core of your personality and the creative force you project into the world.`), 'gold')}
    ${box(tr('ดวงจันทร์ ☽ — โลกภายใน','Moon ☽ — Inner World'),
      tr(`ดวงจันทร์ใน${w.moonSignTh} — อารมณ์ สัญชาตญาณ และความต้องการที่ลึกที่สุดของคุณสะท้อนผ่านพลังงาน${w.moonSignTh}`,
         `Moon in ${w.moonSign} — your emotions, instincts and deepest needs flow through the rhythm of ${w.moonSign}.`), 'dark')}
    ${box(tr('ASC — หน้ากากโลก','ASC — Public Mask'),
      tr(`ราศีขึ้น${w.ascSignTh} — ผู้คนรับรู้คุณในแบบ${w.ascSignTh} ก่อนที่จะรู้จักตัวตนที่แท้จริง`,
         `Rising ${w.ascSign} — others perceive you through the ${w.ascSign} lens before they meet your true self.`), 'dark')}
    ${box('Transit 2026', w.transitNote2026, 'purple')}
  `)
}

function p05_bazi(c: ChartData): string {
  const b = c.bazi
  return section(5, tr('BaZi สี่เสา — Four Pillars of Destiny', 'BaZi — Four Pillars of Destiny'), '☯️', `
    <h2>${tr('ตารางสี่เสา', 'Four-Pillar Table')}</h2>
    <div class="grid-3" style="grid-template-columns:1fr 1fr 1fr 1fr">
      ${[
        { label:tr('ปีเกิด','Year Pillar'),                   s:b.yearStem,  br:b.yearBranch,  sth:b.yearStemTh,  bth:b.yearBranchTh,  dm:false },
        { label:tr('เดือนเกิด','Month Pillar'),                s:b.monthStem, br:b.monthBranch, sth:b.monthStemTh, bth:b.monthBranchTh, dm:false },
        { label:tr('วันเกิด ★ Day Master','Day Pillar ★ Day Master'), s:b.dayStem, br:b.dayBranch, sth:b.dayStemTh,  bth:b.dayBranchTh,  dm:true  },
        { label:tr('ชั่วโมงเกิด','Hour Pillar'),               s:b.hourStem,  br:b.hourBranch,  sth:b.hourStemTh,  bth:b.hourBranchTh,  dm:false },
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
      ${row2(tr('ธาตุโดดเด่น','Dominant Element'), b.dominantElement)}
      ${row2(tr('ธาตุที่ขาด','Missing Element'), b.missingElement || tr('ครบทุกธาตุ','All five present'))}
      ${row2(tr('ธาตุมงคล','Lucky Element'), b.luckyElement)}
      ${row2(tr('ธาตุที่ควรหลีกเลี่ยง','Element to Avoid'), b.avoidElement)}
      ${row2(tr('Luck Pillar ปัจจุบัน','Current Luck Pillar'), b.currentLuckPillarTh)}
    </tbody></table>
    <h2>${tr('การตีความ Day Master','Day Master Interpretation')}</h2>
    ${b.reading}
  `)
}

function p06_ninestar(c: ChartData): string {
  const n = c.ninestar
  return section(6, tr('Nine Star Ki — นิยมในญี่ปุ่นและเกาหลี', 'Nine Star Ki — Japan & Korea\'s most-used system'), '⭐', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${n.star}</div>
        <div class="lbl">${tr('หมายเลขดาว','Star Number')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:18px">${n.star} ${esc(n.starName)}</div>
        <div class="lbl">${esc(n.starName)}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ธาตุ','Element'), n.starElement)}
      ${row2(tr('สีประจำดาว','Star Colour'), n.starColor)}
      ${row2(tr('ทิศทำงาน','Work Direction'), n.starDirection)}
      ${row2(tr('ทิศนอนหัว','Sleep Direction'), n.directionSleep)}
      ${row2(tr('สิ่งนำโชค 2026','Lucky Items 2026'), n.auspicious2026)}
    </tbody></table>
    ${box(tr('วิเคราะห์ปี 2026','2026 Analysis'), n.year2026Analysis, n.star === 9 ? 'red' : 'gold')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:','Origin:')}</strong> ${tr(
      'ต้นกำเนิดจากจีนโบราณกว่า 3,000 ปี อิงจาก Lo Shu Magic Square (洛書) ถ่ายทอดสู่ญี่ปุ่นในสมัย Heian เป็น "Kyusei Kigaku (九星気学)" นิยมมากในญี่ปุ่นและเกาหลีสำหรับการเลือกทิศทาง วันมงคล และความเข้ากันของคน',
      'Originated in ancient China over 3,000 years ago, based on the Lo Shu Magic Square (洛書). Transmitted to Japan during the Heian era as "Kyusei Kigaku (九星気学)". Heavily used today in Japan and Korea for choosing directions, auspicious days, and compatibility.'
    )}</p>
    <h2>${tr('การตีความ','Interpretation')}</h2>
    ${n.reading}
  `)
}

function p07_vedic(c: ChartData): string {
  const v = c.vedic
  return section(7, tr('Vedic Jyotish — โหราศาสตร์เวท', 'Vedic Jyotish — India\'s Ancient Star Science'), '🕉️', `
    <table><tbody>
      ${row2(tr('Lagna (ราศีขึ้น)','Lagna (Rising Sign)'), `${v.lagna} · ${v.lagnaSign}`)}
      ${row2(tr('นักษัตรดวงจันทร์','Moon Nakshatra'), `${v.moonNakshatra} ${tr('บาท','Pada')} ${v.nakshathraPada}`)}
      ${row2(tr('ดาวปกครองนักษัตร','Nakshatra Lord'), v.nakshatraLord)}
      ${row2(tr('มหาทศาปัจจุบัน','Current Mahadasha'), `${v.mahadasha} (${v.mahadashaPeriod})`)}
      ${row2(tr('อันตราทศา','Antardasha'), v.antardasha)}
    </tbody></table>
    ${box(tr('Yogas (ดาวอำนวยผล)','Yogas (Beneficial Combinations)'), v.yogas.map(y => `• ${y}`).join('<br>'), 'purple')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:','Origin:')}</strong> ${tr(
      'เป็นศาสตร์ดาวเก่าแก่ที่สุดระบบหนึ่งของโลก มีอายุกว่า 5,000 ปี บันทึกใน Vedanga Jyotisha — หนึ่งในหกสาขา Vedic knowledge ใช้ระบบ Sidereal (ตามดาวจริง ไม่ใช่ฤดูกาล) Nakshatra 27 แห่ง และ Dasha ระบบช่วงดาวปกครอง — นิยมทั่วอินเดียและเอเชียใต้',
      'One of the world\'s oldest astrological systems — over 5,000 years old, recorded in Vedanga Jyotisha (one of the six branches of Vedic knowledge). Uses sidereal positions (actual stars, not seasonal), 27 Nakshatras (lunar mansions), and the Dasha planetary period system. Mainstream across India and South Asia today.'
    )}</p>
    <h2>${tr('การตีความ','Interpretation')}</h2>
    ${v.reading}
  `)
}

function p08_energyType(c: ChartData): string {
  const h = c.humandesign
  const typeLabel = _lang === 'en' ? (h.type || h.typeTh) : h.typeTh
  return section(8, tr('ระบบประเภทพลังงาน (Energy Type System)','Energy Type System'), '⚡', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(typeLabel)}</div>
        <div class="lbl">${tr('ประเภทพลังงาน','Energy Type')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:20px">${esc(h.profile)}</div>
        <div class="lbl">${tr('โปรไฟล์','Profile')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('กลยุทธ์ชีวิต','Life Strategy'), h.strategy)}
      ${row2(tr('ศูนย์กลางการตัดสินใจ','Decision Authority'), h.authority)}
      ${row2('Definition', h.definition)}
      ${row2('Incarnation Cross', h.incarnationCross)}
      ${row2('Sun Gate', `Gate ${h.sunGate}`)}
      ${row2('Earth Gate', `Gate ${h.earthGate}`)}
    </tbody></table>
    ${box(tr('โปรไฟล์ความหมาย','Profile Meaning'), h.profileDesc, 'gold')}
    ${box(tr('Channels สำคัญ','Key Channels'), h.channels.join('<br>'), 'dark')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:','Origin:')}</strong> ${tr(
      'Human Design ถูกรับรู้โดย Ra Uru Hu ในปี 1987 ที่ Ibiza — อ้างว่าได้รับจาก "Voice" ใน 8 คืน ผสม Astrology, I Ching, Kabbalah, Chakras และ Quantum Physics เข้าเป็น synthesis ใหม่ ใช้ planetary positions ณ เวลาเกิดคำนวณ "BodyGraph" — ปัจจุบันมีผู้ติดตามทั่วโลกหลายล้านคน',
      'Human Design was received by Ra Uru Hu in 1987 in Ibiza — claimed to have come from a "Voice" over 8 nights. Synthesises Astrology, I Ching, Kabbalah, Chakras and Quantum Physics into a unified system. Uses planetary positions at birth to compute the "BodyGraph". Today has millions of practitioners worldwide.'
    )}</p>
    <h2>${tr('การตีความ','Interpretation')}</h2>
    ${h.reading}
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">* ${tr('Energy Type System วิเคราะห์ตามหลักโบดีกราฟ ไม่ใช่คำแนะนำจากผู้ให้บริการใดโดยเฉพาะ','The Energy Type System analyses based on BodyGraph principles, not advice from any specific provider.')}</p>
  `)
}

function p09_mayan(c: ChartData): string {
  const m = c.mayan
  return section(9, tr('มายัน Tzolk\'in','Mayan Tzolk\'in'), '🌀', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${m.kin}</div>
        <div class="lbl">Kin Number</div>
      </div>
      <div class="stat-card">
        <div class="val">${m.toneNumber}</div>
        <div class="lbl">${tr('โทนกาแล็กติก','Galactic Tone')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign', m.daySignNameTh)}
      ${row2('Galactic Tone', m.toneNameTh)}
      ${row2(tr('ทิศประจำ','Direction'), m.direction)}
      ${row2(tr('สีประจำ','Colour'), m.color)}
      ${row2('Wavespell', m.wavespell)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:','Origin:')}</strong> ${tr(
      'Tzolk\'in คือปฏิทิน 260 วันของชาว Maya ที่ใช้มากว่า 3,000 ปี ประกอบด้วย 20 Day Signs × 13 Tone Numbers ใช้ร่วมกับ Haab 365 วันเป็น "Calendar Round" 52 ปี นิยมในกลุ่ม New Age สมัยใหม่หลัง 2012 prophecy แต่ชาว Maya ดั้งเดิมยังใช้จริงในพิธีกรรม',
      'Tzolk\'in is the Maya 260-day sacred calendar used for over 3,000 years — 20 Day Signs × 13 Tone Numbers, paired with the 365-day Haab to form a 52-year "Calendar Round". Popular in New Age circles after the 2012 prophecy, but indigenous Maya communities still use it in actual ceremony today.'
    )}</p>
    <h2>${tr('การตีความ','Interpretation')}</h2>
    ${m.reading}
  `)
}

function p10_celtic(c: ChartData): string {
  const ct = c.celtic
  return section(10, tr('เซลติก Tree Calendar','Celtic Tree Calendar'), '🌳', `
    <div class="stat-card" style="margin-bottom:16px">
      <div class="val" style="font-size:20px">${ct.symbol} ${esc(_lang === 'en' ? ct.treeName : ct.treeNameTh)}</div>
      <div class="lbl">${esc(ct.treeName)} Tree</div>
    </div>
    <table><tbody>
      ${row2(tr('ดาวปกครอง','Ruling Planet'), ct.rulingPlanet)}
      ${row2(tr('อัญมณีนำโชค','Lucky Gemstone'), ct.gemstone)}
      ${row2(tr('ธาตุ','Element'), ct.element)}
      ${row2(tr('บุคลิกภาพ','Personality'), ct.personality)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:','Origin:')}</strong> ${tr(
      'อิงจาก Ogham alphabet โบราณของชาวไอริชและ Gaul Druids มีอายุกว่า 2,500 ปี แต่ละเดือนมีต้นไม้ศักดิ์สิทธิ์ปกครอง ตาม Beth-Luis-Nion calendar Robert Graves นักเขียน popularize ใน "The White Goddess" (1948) ทำให้เป็นที่รู้จักในโลกสมัยใหม่',
      'Based on the ancient Ogham alphabet of Irish and Gaul Druids — over 2,500 years old. Each month is governed by a sacred tree following the Beth-Luis-Nion calendar. Robert Graves popularised this system in "The White Goddess" (1948), bringing it into modern awareness.'
    )}</p>
    <h2>${tr('การตีความ','Interpretation')}</h2>
    ${ct.reading}
  `)
}

function p11_thai(c: ChartData): string {
  const t = c.thai
  return section(11, tr('ไทยพราหมณ์','Thai Brahmin'), '🙏', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:18px">${esc(t.dayName)}</div>
        <div class="lbl">${tr('วันเกิด','Birth Day')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(t.dayColor)}</div>
        <div class="lbl">${tr('สีมงคล','Lucky Colour')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('เทพผู้ปกครอง','Ruling Deity'), `${t.dayGodTh} (${t.dayGod})`)}
      ${row2(tr('นักษัตรไทย','Thai Nakshatra'), t.nakshatra)}
      ${row2(tr('ด้านมงคล','Auspicious Domain'), t.fortuneDay)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:','Origin:')}</strong> ${tr(
      'โหราศาสตร์ไทยรับอิทธิพลจาก Vedic Jyotish ผ่านอินเดียเมื่อกว่า 1,000 ปีก่อน ผสมผสานกับความเชื่อดั้งเดิมของไทยและพราหมณ์ฮินดู ระบบวัน 7 สีและเทพประจำวัน (เช่น พระจันทร์ วันจันทร์) เป็นเอกลักษณ์เฉพาะ ใช้กันแพร่หลายในพิธีกรรมราชสำนักไทยมาหลายศตวรรษ',
      'Thai astrology was shaped by Vedic Jyotish via India over 1,000 years ago, blended with native Thai animism and Hindu Brahmin tradition. The 7-day, 7-colour, day-deity system (e.g. Moon-deity for Monday) is uniquely Thai and has been central to Royal Court ceremony for centuries.'
    )}</p>
    <h2>${tr('การตีความ','Interpretation')}</h2>
    ${t.reading}
    ${box(tr('คำแนะนำไทยพราหมณ์','Thai Brahmin Guidance'),
      tr(`ใส่สี${t.dayColor}ในวันสำคัญ ทำบุญวันเกิดให้${t.dayGodTh} อธิษฐานด้าน${t.fortuneDay}`,
         `Wear ${t.dayColor} on important days, make merit on your birth weekday in honour of ${t.dayGodTh}, and direct prayers towards matters of ${t.fortuneDay}.`), 'gold')}
  `)
}

function p12_numerology(c: ChartData): string {
  const n = c.numerology
  return section(12, tr('เลขศาสตร์ — Life Path + Pythagorean + เลข ๗ ตัว','Numerology — Life Path + Pythagorean + Thai 7 Numbers'), '🔢', `
    <div class="grid-3">
      <div class="stat-card">
        <div class="val">${n.lifePath}</div>
        <div class="lbl">Life Path</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.personalYear2026}</div>
        <div class="lbl">${tr('ปีส่วนตัว 2026','Personal Year 2026')}</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.pythagorean}</div>
        <div class="lbl">Pythagorean</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Life Path', `${n.lifePath} — ${n.lifePathName}`)}
      ${row2(tr('ปีส่วนตัว 2026','Personal Year 2026'), `${n.personalYear2026} — ${n.personalYearMeaning}`)}
      ${row2(tr('เลข ๗ ตัว','Thai 7 Numbers'), n.thaiSeven.join(' · '))}
      ${row2('Destiny Number', n.destinyNumber.toString())}
    </tbody></table>
    ${box(tr('เลขชีวิต','Life Numbers'), n.reading, 'gold')}
    ${box(tr('ปีส่วนตัว 2026','Personal Year 2026'), n.personalYearMeaning, 'purple')}
    <p style="margin-top:8px">${esc(n.thaiSevenReading)}</p>
  `)
}

function p13_luckPillars(c: ChartData): string {
  const age2026 = 2026 - c.input.year
  const { bazi, vedic, ninestar, numerology, biorhythm, vedicMahadasha } = c

  const luckRows = bazi.luckPillars.map(lp => {
    const isCurrent = age2026 >= lp.ageStart && age2026 <= lp.ageEnd
    // Multi-system quality for this decade
    const midAge = (lp.ageStart + lp.ageEnd) / 2
    // NSK decade: every 9 years a cycle completes
    const nskDecadeNote = ((lp.ageStart % 9) === 0) ? 'NSK: เริ่มรอบใหม่' : ''
    // Numerology: personal year pattern
    const startPY = ((c.input.year + lp.ageStart - c.input.year + 2026 - age2026) % 9) + 1
    return `<tr ${isCurrent ? 'style="background:#1a1a08;border:1px solid #d4aa5044"':''}>
      <td style="font-size:12px">${esc(lp.ageStart)}–${esc(lp.ageEnd)}</td>
      <td style="font-size:18px">${esc(lp.stem)}${esc(lp.branch)}</td>
      <td style="font-size:11px;color:#9a8a72">${esc(lp.stemTh)} ${esc(lp.branchTh)}</td>
      <td style="font-size:11px;color:#6a8a60">${nskDecadeNote}</td>
      <td>${isCurrent ? '<span style="color:#d4aa50;font-weight:700">▶ ปัจจุบัน</span>' : ''}</td>
    </tr>`
  }).join('')

  // Vedic Mahadasha timeline (major periods)
  const dashaTimeline = [
    { lord: vedicMahadasha.currentDasha, end: vedicMahadasha.currentDashaEnd, quality: vedicMahadasha.dashaQuality, isCurrent: true },
  ]

  // NSK year trend 2026-2035
  const nskYears = Array.from({length:10},(_,i)=>2026+i).map(yr => {
    const starForYear = ((9 - ((yr - 1) % 9)) % 9) + 1
    const isGood = [starForYear].some(s => [1,3,6,8,9].includes(s))
    return `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${isGood?'#1a3010':'#2a1010'};color:${isGood?'#60c060':'#c06060'};margin:2px">${yr}:${starForYear}${isGood?'✓':'·'}</span>`
  }).join('')

  return section(14, tr('เส้นทาง 80 ปี — Multi-System Timeline','80-Year Life Timeline — Multi-System View'), '🗺️', `
    <!-- BaZi Luck Pillars (main) -->
    <h2 style="font-size:14px;color:#d4aa50;margin-bottom:8px">🔥 ${tr('BaZi Luck Pillars — แกนหลัก 10 ปีต่อเสา','BaZi Luck Pillars — 10 years per pillar')}</h2>
    <table>
      <thead><tr><th>${tr('อายุ','Age')}</th><th>${tr('เสา','Pillar')}</th><th>${tr('ความหมาย','Meaning')}</th><th>NSK Note</th><th></th></tr></thead>
      <tbody>${luckRows}</tbody>
    </table>

    <!-- Current LP detail -->
    ${box(tr('Luck Pillar ปัจจุบัน','Current Luck Pillar'), `${bazi.currentLuckPillar} — ${bazi.currentLuckPillarTh}`, 'gold')}

    <!-- Vedic Mahadasha -->
    <h2 style="font-size:14px;color:#c090d0;margin:14px 0 8px">🕉️ ${tr('Vedic Mahadasha — ช่วงปกครองดาว','Vedic Mahadasha — Planetary Periods')}</h2>
    <div style="background:#120a1a;border:1px solid #5a3a8a;border-radius:8px;padding:12px">
      <div style="font-size:13px;color:#c090e0;font-weight:600">
        ${esc(vedicMahadasha.currentDasha)} Mahadasha ${tr('ถึงปี','until')} ${esc(String(vedicMahadasha.currentDashaEnd))}
      </div>
      <div style="font-size:12px;color:#9a70c0;margin-top:4px">${esc(vedicMahadasha.dashaQuality)}</div>
      <div style="font-size:11px;color:#7a5a9a;margin-top:4px">Antardasha: ${esc(vedicMahadasha.antardasha)}</div>
    </div>

    <!-- NSK Year Trend -->
    <h2 style="font-size:14px;color:#60b0c0;margin:14px 0 8px">⭐ NSK Year Stars 2026–2035</h2>
    <div style="background:#0a1215;border-radius:8px;padding:10px">${nskYears}
      <div style="font-size:10px;color:#4a7080;margin-top:6px">${tr('✓ = ดาวโชค (1,3,6,8,9) · · = ระมัดระวัง','✓ = lucky stars (1, 3, 6, 8, 9) · · = caution year')}</div>
    </div>

    <!-- Numerology Personal Year pattern -->
    <h2 style="font-size:14px;color:#d0a060;margin:14px 0 8px">🔢 ${tr('Numerology — รอบชีวิต 9 ปี','Numerology — 9-Year Life Cycle')}</h2>
    <div style="background:#1a1208;border-radius:8px;padding:10px">
      <div style="font-size:12px;color:#c0a060">Personal Year 2026: <strong>${esc(String(numerology.personalYear2026))}</strong> — ${esc(numerology.personalYearMeaning.split('—')[0])}</div>
      <div style="font-size:11px;color:#8a7040;margin-top:4px">Biorhythm Physical ${esc(String(biorhythm.physical))}% | Emotional ${esc(String(biorhythm.emotional))}% | Intellectual ${esc(String(biorhythm.intellectual))}%</div>
    </div>
  `)
}

function p14_health(c: ChartData): string {
  const { bazi, ninestar, vedic, humandesign, biorhythm, celtic, tibetan, thai, nativeAmerican, vedicMahadasha, norseRune } = c
  const healthSignals = extractSignals(c, 'health')
  const good = healthSignals.filter(s => s.score >= 750)
  const warn = healthSignals.filter(s => s.score < 650)

  const EL_EXERCISE: Record<string,string> = {
    '甲':'Weight Training / ยิม','乙':'Pilates / โยคะ','丙':'ว่ายน้ำ / ไตรกีฬา',
    '丁':'โยคะ / ว่ายน้ำ','戊':'Hiking / เดิน','己':'เดิน / ไทชิ',
    '庚':'Martial Arts / ฟันดาบ','辛':'เต้นรำ / ปิลาเตส','壬':'ว่ายน้ำ / พายเรือ','癸':'ว่ายน้ำ / ดำน้ำ'
  }

  // Map BaZi Day Master element → TCM organ pairing (well-established medical
  // tradition: ไม้→ตับ · ไฟ→หัวใจ · ดิน→ม้าม/กระเพาะ · โลหะ→ปอด · น้ำ→ไต)
  const ORGAN: Record<string,string> = { 'ไม้':'ตับ+ถุงน้ำดี','ไฟ':'หัวใจ+ลำไส้เล็ก','ดิน':'ม้าม+กระเพาะ','โลหะ':'ปอด+ลำไส้ใหญ่','น้ำ':'ไต+กระเพาะปัสสาวะ' }
  const dmEl = bazi.dayMasterElement
  const organ = ORGAN[dmEl] || '—'

  return section(20, tr('Health Coaching — ลักษณะประจำตัวจาก 26 ศาสตร์','Health Coaching — Constitutional Patterns from 26 Systems'), '🌿', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('สุขภาพตามดวง ≠ พยากรณ์รายวัน','Birth-chart health ≠ daily forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะประจำตัวด้านสุขภาพตลอดชีวิต</strong> ที่มาจากวันเกิด —
        เช่น อวัยวะที่เปราะบางตามธรรมชาติ · ชนิดกีฬาที่ร่างกายตอบสนองดี · จังหวะพลังงาน
        <strong>ไม่ใช่</strong> พยากรณ์วันนี้ว่าจะป่วยหรือไม่ · ${healthSignals.length} ศาสตร์เห็นตรงกัน ${good.length} เรื่อง`,
        `This page describes <strong>your lifelong health constitution</strong> derived from your birth chart —
         organs that are naturally vulnerable, sports your body responds to well, and your energy rhythm.
         It is <strong>not</strong> a daily forecast of illness. · ${healthSignals.length} systems analysed, ${good.length} in agreement.`)}
      </div>
    </div>

    <!-- Constitutional pattern -->
    <div style="background:#0a1510;border:1px solid #2a4a20;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:12px;color:#5a9a40;font-weight:600;margin-bottom:6px">🫀 ${tr('ลักษณะตามธาตุ Day Master (TCM)','Constitution by Day Master Element (TCM)')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.75">
        ${tr(`ธาตุ <strong>${esc(dmEl)}</strong> ของคุณคู่กับอวัยวะ <strong>${esc(organ)}</strong> ใน TCM —
        คืออวัยวะที่ <em>ทำงานหนักสุด</em> และ <em>เปราะบางก่อนสุด</em> เมื่ออายุมากขึ้น
        การดูแลป้องกันจึงควรเน้นที่จุดนี้เป็นอันดับแรก`,
        `Your <strong>${esc(dmEl)}</strong> element pairs with the organ system <strong>${esc(organ)}</strong> in Traditional Chinese Medicine — the organ that <em>works hardest</em> and <em>becomes vulnerable first</em> with age. Preventative care should prioritise this system.`)}
      </div>
    </div>

    <!-- Consensus positive -->
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#60c060;font-weight:600;margin-bottom:8px">✅ ${tr('จุดแข็งด้านสุขภาพ','Health strengths')} · ${good.length} ${tr('ศาสตร์เห็นตรงกัน','systems in agreement')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#0a1508;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#60a060;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#c8d8a8;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c06030;font-weight:600;margin-bottom:8px">⚠️ ${tr('จุดที่ต้องดูแลเฉพาะ','Areas needing focused care')} · ${warn.length} ${tr('ศาสตร์เตือน','systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a08;border-radius:6px;margin:4px 0;border-left:2px solid #8a3020">
          <span style="font-size:11px;min-width:100px;color:#c07050;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8a888;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    ${box(tr('ออกกำลังกายที่ร่างกายของคุณตอบสนองดีที่สุด','Movement your body responds to best'),
      tr(`<strong>${esc(EL_EXERCISE[bazi.dayStem]||'เดิน/โยคะ')}</strong><br><br>เหตุผล: Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> เป็นธาตุ <strong>${esc(dmEl)}</strong> — กีฬานี้เสริมการไหลเวียนของ ${esc(organ)} โดยตรง นี่ไม่ใช่กฎหนึ่งสำหรับทุกคน แต่เป็นการจับคู่ระหว่างธาตุของคุณกับชนิดการเคลื่อนไหวที่ธาตุนั้นต้องการ`,
         `<strong>${esc(EL_EXERCISE[bazi.dayStem]||'Walking / Yoga')}</strong><br><br>Why: your Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> is the <strong>${esc(dmEl)}</strong> element — this kind of movement directly supports circulation in your ${esc(organ)} system. Not a one-size-fits-all rule, but a pairing of your element with the type of motion that element naturally craves.`),
      'green')}

    <!-- Biorhythm — reframed as "natural rhythm" not "today" -->
    <div style="background:#0a1510;border:1px solid #2a4a20;border-radius:8px;padding:12px 14px;margin:14px 0">
      <div style="font-size:12px;color:#5a9a40;font-weight:600;margin-bottom:6px">📊 ${tr('จังหวะ Biorhythm ของคุณตอนนี้','Your current biorhythm pulse')}</div>
      <div style="font-size:10.5px;color:#7a9a70;margin-bottom:10px">${tr('สามวงจรจากวันเกิด: กาย 23 วัน · อารมณ์ 28 วัน · สติปัญญา 33 วัน — วันนี้อยู่ช่วงใดของวงจร','Three cycles from birth: Physical 23 days · Emotional 28 days · Intellectual 33 days — where today sits in each cycle')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[
          [tr('ร่างกาย','Physical'), biorhythm.physical, biorhythm.physicalPhase],
          [tr('อารมณ์','Emotional'), biorhythm.emotional, biorhythm.emotionalPhase],
          [tr('สติปัญญา','Intellectual'), biorhythm.intellectual, biorhythm.intellectualPhase],
        ].map(([l,v,p]) =>
          `<div><div style="font-size:22px;font-weight:700;color:${+v>30?'#60c060':+v<-30?'#c06060':'#c0c040'}">${v}%</div><div style="font-size:10px;color:#6a8a60">${esc(String(l))}</div><div style="font-size:10px;color:#4a6a40">${esc(String(p))}</div></div>`
        ).join('')}
      </div>
    </div>

    <div style="font-size:11px;color:#5a6a50;margin-top:8px">
      🏥 ${tr('รายงานนี้เพื่อการสำรวจตนเอง ไม่ใช่การวินิจฉัยทางการแพทย์ · หากมีอาการผิดปกติ ควรปรึกษาแพทย์ (ในไทย สายด่วน 1323 สุขภาพจิต)','This report is for self-exploration, not medical diagnosis. Consult a qualified physician for any concerning symptoms.')}
    </div>
  `)
}

function p15_finance(c: ChartData): string {
  const finSignals = extractSignals(c, 'finance')
  const good = finSignals.filter(s => s.score >= 750).sort((a,b)=>b.score-a.score)
  const warn = finSignals.filter(s => s.score < 650)
  const { bazi, numerology, ninestar, arabicParts, hellenistic, ifaYoruba, vedicMahadasha } = c

  return section(21, tr('Finance Coaching — แนวทางการเงินตามดวง','Finance Coaching — Financial Guidance from Your Chart'), '💰', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('การเงินตามดวง ≠ พยากรณ์หวย','Birth-chart finance ≠ lottery forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะทางการเงินประจำตัว</strong> — ว่าคุณเหมาะกับการลงทุนแบบไหน ความเสี่ยงระดับใด
        ช่วงเวลาของชีวิตที่ควรลงทุน/สะสม · <strong>ไม่ใช่</strong> การบอกตัวเลขผลตอบแทนหรือทำนายราคาทรัพย์สิน ·
        ${finSignals.length} ศาสตร์วิเคราะห์ โดย ${good.length} เห็นเสริมและ ${warn.length} เห็นเตือน`,
        `This page describes <strong>your innate financial pattern</strong> — what kind of investing suits you, your risk
         tolerance, and the life-phases best for accumulating versus deploying capital. It is <strong>not</strong> a return
         forecast or asset-price prediction. · ${finSignals.length} systems analysed: ${good.length} supportive, ${warn.length} cautionary.`)}
      </div>
    </div>

    <div style="background:#100a06;border:1px solid #4a3010;border-radius:6px;padding:8px 12px;font-size:11px;color:#8a6030;margin-bottom:12px">
      ⓘ ${tr('ข้อมูลประกอบการสำรวจตนเอง · ไม่ใช่คำแนะนำการลงทุน · ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจสำคัญ','For self-exploration only · not investment advice · consult a qualified professional before major decisions.')}
    </div>

    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c0a030;font-weight:600;margin-bottom:8px">💎 ${tr('จุดแข็งทางการเงิน','Financial strengths')} · ${good.length} ${tr('ศาสตร์เห็นพ้อง','systems concur')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#100d06;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#a08030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8c880;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c05030;font-weight:600;margin-bottom:8px">⚠️ ${tr('ข้อระวังทางการเงิน','Financial cautions')} · ${warn.length} ${tr('ศาสตร์เตือน','systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a06;border-radius:6px;margin:4px 0;border-left:2px solid #8a3010">
          <span style="font-size:11px;min-width:100px;color:#c07030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d89060;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Key synthesis -->
    ${box(tr('สรุปทิศทางการเงิน','Financial direction summary'),
      tr(`ธาตุมงคล${bazi.luckyElement} + Part of Fortune ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter','Sun','Venus'].includes(vedicMahadasha.currentDasha)?'ช่วงขยายตัวทางการเงิน':'ช่วงสะสมและระมัดระวัง'}`,
         `Lucky element ${bazi.luckyElement} + Part of Fortune in ${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter','Sun','Venus'].includes(vedicMahadasha.currentDasha)?'a phase of financial expansion':'a phase of accumulation and prudence'}`),
      'gold')}

    <!-- 3-step plan -->
    <div style="font-size:13px;color:#d0a050;font-weight:600;margin:12px 0 8px">${tr('แผน 3 ขั้นจาก Consensus','3-step plan from consensus')}</div>
    ${[
      [tr(`สะสมธาตุ${bazi.luckyElement}`, `Accumulate the ${bazi.luckyElement} element`),
       tr(`ลงทุนในสิ่งที่สอดคล้องกับ Day Master ${bazi.dayMasterTh} — Wuxing: DM_CREATES = success`,
          `Invest in things aligned with your Day Master ${bazi.dayMasterTh} — Wuxing: DM_CREATES = success`)],
      [tr(`ใช้ทิศ${ninestar.starDirection}`, `Use the ${ninestar.starDirection} direction`),
       tr(`NSK: ทิศทำงานและติดต่อธุรกิจในทิศ${ninestar.starDirection} ปี 2026`,
          `NSK: orient your work + business meetings towards ${ninestar.starDirection} during 2026`)],
      [`Personal Year ${numerology.personalYear2026}`,
       numerology.personalYearMeaning.split('—')[0] + tr(' — จังหวะที่ดีที่สุดสำหรับปีนี้',' — the rhythm best suited to this year')],
    ].map(([title, desc], i) => `
      <div style="display:flex;gap:10px;padding:8px;border:1px solid #2a2010;border-radius:8px;margin:5px 0">
        <div style="background:#d4aa50;color:#1a1510;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${i+1}</div>
        <div><div style="font-weight:600;color:#d4aa50;font-size:13px">${esc(title)}</div><div style="font-size:11px;color:#9a8a72;margin-top:2px">${esc(desc)}</div></div>
      </div>`).join('')}
  `)
}

function p16_activation(c: ChartData): string {
  const { bazi, ninestar, numerology, humandesign, vedic, thai, celtic, tibetan,
          norseRune, kabbalistic, ifaYoruba, aboriginal, biorhythm, vedicMahadasha,
          onmyodo, zoroastrian, nativeAmerican, aztec, saju } = c

  // Pull positive actions from all 26 systems — ranked by how many systems endorse
  const positives: {icon:string;pts:number;title:string;body:string;systems:string[]}[] = [
    { icon:'🧭', pts:0, title:`หันหัวทิศ${ninestar.directionSleep}นอน`, body:`NSK Star ${ninestar.star}: ทิศนอน${ninestar.directionSleep} ยืนยันโดย Feng Shui พื้นฐาน`, systems:['Nine Star Ki','BaZi Feng Shui'] },
    { icon:'🎯', title:`ทำตาม Strategy "${humandesign.strategy}"`, pts:0, body:`Energy Type ${humandesign.typeTh}: หัวใจของ Human Design — ฝืนแล้วเหนื่อยเปล่า`, systems:['Energy Type System','Kabbalistic (${kabbalistic.archangel})'] },
    { icon:'🔥', title:`เสริมธาตุ${bazi.luckyElement}ทุกวัน`, pts:0, body:`BaZi: ธาตุมงคล${bazi.luckyElement} หนุน Day Master ${bazi.dayMasterTh}`, systems:['BaZi','Saju (Korean)','Tibetan Mewa'] },
    { icon:'🎨', title:`ใส่สี${ninestar.starColor}เป็น accent`, pts:0, body:`NSK ${ninestar.starChinese} + ไทยพราหมณ์วัน${thai.dayName}: สี${ninestar.starColor}/${thai.dayColor}`, systems:['Nine Star Ki','ไทยพราหมณ์','Celtic'] },
    { icon:'📝', title:`Journal ทุกเช้า — ตั้งเจตนา`, pts:0, body:`Life Path ${numerology.lifePath} + Kabbalistic ${kabbalistic.sephira}: ความชัดเจนในความคิดเป็นพลังงาน`, systems:['Numerology','Kabbalistic','Zoroastrian'] },
    { icon:'🙏', title:`ทำพิธีกรรมวัน${thai.dayName}`, pts:0, body:`ไทยพราหมณ์ + Zoroastrian ${zoroastrian.dayYazataTh}: สักการะในวันเกิดของสัปดาห์`, systems:['ไทยพราหมณ์','Zoroastrian','Onmyōdō'] },
    { icon:'🌿', title:`ออกกำลังกาย 3x/สัปดาห์`, pts:0, body:`Biorhythm Physical ${biorhythm.physical}% (${biorhythm.physicalPhase}) + ${celtic.treeNameTh} ธาตุ${celtic.element}`, systems:['Biorhythm','Celtic','Native American'] },
    { icon:'💬', title:`รอ Response ก่อนลงมือ`, pts:0, body:`${humandesign.typeTh} Authority ${humandesign.authority}: ตัดสินใจตาม inner response`, systems:['Energy Type System','Norse Rune (${norseRune.runeName})'] },
    { icon:'🗺️', title:`วางแผนทิศ${ninestar.starDirection}`, pts:0, body:`NSK ทิศโชค${ninestar.starDirection} ปี 2026: ใช้ทิศนี้ในการเดินทางและจัดโต๊ะทำงาน`, systems:['Nine Star Ki','Arabic Parts (${arabicParts.fortuneSign})'] },
    { icon:'🌟', title:`เชื่อมกับ Odù ${ifaYoruba.odu}`, pts:0, body:`Ifa/Yoruba: ${ifaYoruba.oduTh} — ${ifaYoruba.oduTheme}`, systems:['Ifa/Yoruba','Aboriginal (${aboriginal.dreamingTh})'] },
  ]

  // Pull negative inputs (things to avoid) from low-scoring systems + BaZi avoidance
  const negatives: {icon:string;title:string;body:string;source:string}[] = [
    { icon:'🚫', title:`หลีกเลี่ยงธาตุ${bazi.avoidElement}`, body:`BaZi: ธาตุ${bazi.avoidElement}กดพลังงาน Day Master — ลดสีและอาหารที่สอดคล้อง`, source:'BaZi' },
    { icon:'⚠️', title:`ระวัง Self-Punishment 午午`, body:`BaZi: ${bazi.dayStem}${bazi.dayBranch} + ${bazi.yearStem}${bazi.yearBranch} มีแรงกดดันตัวเอง — อย่า overthink`, source:'BaZi Self-Punch' },
    ...(c.score.breakdown.filter(b => b.score < 650).map(b => ({
      icon: '⚠️', title: `ระวัง: ${b.system}`, body: b.finding, source: b.system
    }))),
    { icon:'🔴', title:`${onmyodo.rokuyo} Birth Day — ระวังสิ่งนี้`, body:`Onmyōdō ${onmyodo.rokuyoTh}: วันเกิดมีพลังงาน${onmyodo.rokuyo} — ระมัดระวังในวันเดียวกันของสัปดาห์`, source:'Onmyōdō' },
  ]

  // Score by system count (systems array length)
  positives.forEach(p => { p.pts = p.systems.length * 7 + (c.score.breakdown.find(b=>b.system.includes(p.systems[0]?.split(' ')[0]))?.score||700)/100|0 })
  positives.sort((a,b) => b.pts - a.pts)

  // Compute cosmic score delta per action:
  // +1 point per endorsing system × 3 = small lift (3-system positive = +9)
  // Scaling is for visualisation only — users can see "doing this lifts your
  // consensus reading by ~X" even if the underlying score is fixed at birth.
  const cosmicDelta = (systemsCount: number) => systemsCount * 3
  const cosmicDrain = (severity: number = 1) => -severity * 4

  return section(18, tr('Activation Plan — ลำดับความสำคัญจาก 26 ศาสตร์','Activation Plan — Priority Actions from 26 Systems'), '🚀', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('วิธีอ่านและทำตาม','How to read this')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`แต่ละข้อถูก <strong>จัดลำดับความสำคัญจากจำนวนศาสตร์ที่เห็นพ้อง</strong> —
        ยิ่งหลายศาสตร์อิสระชี้ไปทางเดียวกัน ยิ่งมีน้ำหนัก`,
        `Each item is <strong>ranked by how many independent systems agree on it</strong> — the more traditions point the same direction, the more weight it carries.`)}<br>
        <strong style="color:#60c060">[+X]</strong> = ${tr('คาดว่าเสริม Cosmic Score Consensus ประมาณ +X จุด','expected to lift your Cosmic Score Consensus by ~X points')} ·
        <strong style="color:#c06060">[−X]</strong> = ${tr('ลด Consensus ถ้าทำสิ่งที่ขัดกับดวง','reduces consensus when you act against your chart')}<br>
        <span style="color:#6a5a42">${tr('หมายเหตุ: Cosmic Score ของวันเกิดคงที่ตลอดชีวิต — ตัวเลขนี้คือ "การใช้ชีวิตให้สอดคล้องกับดวง" ที่ชัดเจนขึ้น ไม่ใช่เปลี่ยนดวง','Note: your birth-chart Cosmic Score is fixed for life — this number reflects how aligned you\'re living with it, not a change to the chart itself.')}</span>
      </div>
    </div>

    <div style="font-size:13px;font-weight:600;color:#60c060;margin-bottom:8px">✅ ${tr('สิ่งที่ควรทำ · Priority-ranked (เรียงจากศาสตร์เห็นพ้องมากสุด)','What to do · Priority-ranked (most-agreed-upon first)')}</div>
    ${positives.slice(0,8).map((a,n) => {
      const delta = cosmicDelta(a.systems.length)
      const priority = n < 3 ? 'HIGH' : n < 6 ? 'MEDIUM' : 'LOW'
      const priorityColor = n < 3 ? '#d4aa50' : n < 6 ? '#c0a060' : '#7a6a52'
      return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid ${n<3?'#d4aa50':'#2a2010'};border-radius:8px;margin:6px 0;background:${n<3?'#1e1a0e':'#141210'}">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:34px">
          <span style="font-size:22px">${a.icon}</span>
          <span style="font-size:8px;letter-spacing:1px;color:${priorityColor};margin-top:2px">${priority}</span>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#d4aa50;font-size:13px">${n+1}. ${esc(a.title)}</span>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:10px;color:#60a060;background:#0a1a0e;padding:2px 8px;border-radius:10px">${a.systems.length} ${tr('ศาสตร์ตรงกัน','agree')}</span>
              <span style="font-size:10px;color:#60c060;background:#0a1a0e;padding:2px 8px;border-radius:10px">+${delta}</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${esc(a.body)}</div>
          <div style="font-size:10px;color:#7a9070;margin-top:4px">${tr('ที่มา:','Sources:')} ${a.systems.slice(0,3).map(s=>'<strong>'+esc(s.replace(/\$\{[^}]*\}/g,''))+'</strong>').join(' · ')}${a.systems.length>3?` +${(a.systems.length-3)} ${tr('อื่นๆ','more')}`:''}</div>
        </div>
      </div>`
    }).join('')}

    <div style="font-size:13px;font-weight:600;color:#c05030;margin:16px 0 8px">🚫 ${tr('สิ่งที่ควรหลีกเลี่ยง · ลดความสอดคล้องกับดวง','What to avoid · reduces alignment with your chart')}</div>
    ${negatives.map(n => {
      const drain = cosmicDrain(1)
      return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid #3a1510;border-radius:8px;margin:5px 0;background:#1a0a08">
        <span style="font-size:20px">${n.icon}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#d07050;font-size:12.5px">${esc(n.title)}</span>
            <span style="font-size:10px;color:#c06060;background:#1a0a08;border:1px solid #4a2020;padding:2px 8px;border-radius:10px">${drain}</span>
          </div>
          <div style="font-size:11px;color:#c8a890;margin-top:3px;line-height:1.55">${esc(n.body)}</div>
          <div style="font-size:10px;color:#7a4030;margin-top:3px">${tr('ที่มา:','Source:')} <strong>${esc(n.source)}</strong></div>
        </div>
      </div>`
    }).join('')}
  `)
}

function p17_weekly(c: ChartData): string {
  // Energy ของแต่ละวันมาจาก 3 ศาสตร์พร้อมกัน:
  //   1. ดาวประจำวัน (Planetary day ruler) — ไทยพราหมณ์/Hellenistic convention
  //   2. ธาตุของวัน (5-element day cycle)
  //   3. สีมงคลประจำวัน (ไทย/Vedic convention)
  // ผสานกับ Day Master ของผู้ใช้ → บอก "พลังประจำวัน" ที่เหมาะกับคุณ
  const { bazi, ninestar, humandesign, thai, celtic } = c
  const dmEl = bazi.dayMasterElement
  // Day-of-week cosmology (Vedic / Hellenistic / ไทยพราหมณ์ — all agree on the 7-planet system)
  const daysData = [
    { name:'จันทร์', planet:'จันทร์ · Moon',     element:'น้ำ',   color:'เหลือง',  energy:'สัญชาตญาณ · อารมณ์' },
    { name:'อังคาร', planet:'อังคาร · Mars',     element:'ไฟ',    color:'ชมพู',   energy:'ลงมือ · ความกล้า · การแข่งขัน' },
    { name:'พุธ',    planet:'พุธ · Mercury',     element:'ไม้',   color:'เขียว',  energy:'สื่อสาร · เจรจา · สอน' },
    { name:'พฤหัสบดี', planet:'พฤหัส · Jupiter', element:'ไม้',   color:'ส้ม',     energy:'ขยายตัว · การเรียนรู้ · โชคลาภ' },
    { name:'ศุกร์',  planet:'ศุกร์ · Venus',      element:'โลหะ',   color:'ฟ้าอ่อน', energy:'ความสัมพันธ์ · ศิลปะ · ความงาม' },
    { name:'เสาร์',  planet:'เสาร์ · Saturn',    element:'ดิน',    color:'ดำ/ม่วง', energy:'วินัย · โครงสร้าง · ความอดทน' },
    { name:'อาทิตย์',planet:'อาทิตย์ · Sun',     element:'ไฟ',    color:'แดง',    energy:'อัตตา · ความเป็นผู้นำ · ชื่อเสียง' },
  ]
  // ศาสตร์ 5 ธาตุ: เสริม (SHENG) · ควบคุม (KE) · กลาง
  const SHENG: Record<string,string> = { 'น้ำ':'ไม้','ไม้':'ไฟ','ไฟ':'ดิน','ดิน':'โลหะ','โลหะ':'น้ำ' }
  const KE:    Record<string,string> = { 'น้ำ':'ไฟ', 'ไฟ':'โลหะ','โลหะ':'ไม้','ไม้':'ดิน','ดิน':'น้ำ' }
  const rate = (dayEl: string): {label:string; color:string; why:string} => {
    if (dayEl === dmEl)       return { label:'☀️ พลังเท่าตัว',    color:'#c8a840', why:'ธาตุของวันตรงกับ Day Master — ดึงพลังของตัวเองมาใช้ได้ 100%' }
    if (SHENG[dayEl] === dmEl) return { label:'🟢 วันที่หล่อเลี้ยง', color:'#60a060', why:`${dayEl} สร้าง ${dmEl} ในวงจร 5 ธาตุ — ได้รับการหล่อเลี้ยง` }
    if (SHENG[dmEl] === dayEl) return { label:'🟡 วันที่คุณให้',    color:'#c0a060', why:`${dmEl} สร้าง ${dayEl} — คุณเป็นผู้ให้ รู้สึกภูมิใจแต่เหนื่อยง่าย` }
    if (KE[dayEl]    === dmEl) return { label:'🔴 วันที่ต้องตั้งรับ',color:'#c06060', why:`${dayEl} ควบคุม ${dmEl} ใน 5 ธาตุ — ต้องยับยั้งชั่งใจ ไม่ฝืน` }
    if (KE[dmEl]    === dayEl) return { label:'⚠️ วันที่ต้องระวังรีดพลัง', color:'#c08060', why:`${dmEl} ควบคุม ${dayEl} — คุณเอาชนะได้แต่ใช้พลังมาก` }
    return { label:'· กลาง', color:'#9a8a72', why:'ธาตุไม่เชื่อมโยงกัน — วันปกติ ไม่เร่ง ไม่หยุด' }
  }
  const strategy = humandesign.strategy || 'Follow inner authority'

  return section(17, tr('Weekly Energy Plan — พลังงาน 7 วันต่อดวงของคุณ','Weekly Energy Plan — 7-day rhythm against your chart'), '📅', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">Energy ของแต่ละวันคืออะไร</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ปฏิทิน 7 วันของโลกไม่ใช่เรื่องบังเอิญ — <strong>ไทยพราหมณ์ · Hellenistic · Vedic</strong> ทั้ง 3 ศาสตร์ตกลงว่าแต่ละวันอยู่ใต้การปกครองของดาวคนละดวง
        ซึ่งมีธาตุและพลังงานของมันเอง<br>
        ตารางด้านล่างเทียบ <strong>ธาตุของวัน</strong> กับ <strong>Day Master ของคุณ (${esc(bazi.dayMasterTh)} · ธาตุ${esc(dmEl)})</strong> แล้วบอกว่าวันไหนหล่อเลี้ยง วันไหนรีดพลัง
      </div>
    </div>

    <table>
      <thead><tr>
        <th>วัน / ดาว</th>
        <th>ธาตุ</th>
        <th>พลังงานเด่น</th>
        <th>vs ดวงคุณ</th>
      </tr></thead>
      <tbody>
        ${daysData.map((d) => {
          const r = rate(d.element)
          const isBirthDay = d.name === thai.dayName
          return `<tr ${isBirthDay ? 'style="background:#1e1a0e"' : ''}>
            <td>
              <div style="font-weight:600;color:${isBirthDay?'#d4aa50':'#c8c0a8'}">${esc(d.name)}${isBirthDay?' ★':''}</div>
              <div style="font-size:10px;color:#7a6a52;margin-top:2px">${esc(d.planet)}</div>
            </td>
            <td style="font-size:11.5px;color:#c8a840">${esc(d.element)}</td>
            <td style="font-size:11px;color:#c8c0a8">${esc(d.energy)}</td>
            <td style="font-size:11px;color:${r.color}">${esc(r.label)}<div style="color:#7a6a52;font-size:9.5px;margin-top:2px">${esc(r.why)}</div></td>
          </tr>`
        }).join('')}
      </tbody>
    </table>

    ${box(`วันเกิดของคุณ = วัน${esc(thai.dayName)} ★`, `ในทางไทยพราหมณ์ วันเกิดคือวัน "ขอพร" — เทพประจำวัน${esc(thai.dayName)} (${esc(thai.dayGodTh||thai.dayGod||'—')}) เปิดรับคำขอพิเศษ ควรงดเนื้อสัตว์ / ทำบุญ / ตั้งจิตในวันนี้ทุกสัปดาห์<br><br>ส่วน <strong>Strategy Human Design</strong> ของคุณคือ "${esc(strategy)}" — ใช้ทุกวันเป็นแกนตัดสินใจ ไม่ใช่แค่วันเกิด`, 'gold')}
  `)
}

function p18_monthly2026(c: ChartData): string {
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const monthStars = [2,8,7,6,5,4,3,2,1,9,8,7]
  const starNames = ['','一白水星','二黒土星','三碧木星','四緑木星','五黄土星','六白金星','七赤金星','八白土星','九紫火星']
  const STAR_EL: Record<number,string> = {1:'Water',2:'Earth',3:'Wood',4:'Wood',5:'Earth',6:'Metal',7:'Metal',8:'Earth',9:'Fire'}
  const SHENG: Record<string,string> = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'}
  const KE: Record<string,string>    = {Wood:'Earth',Earth:'Water',Water:'Fire',Fire:'Metal',Metal:'Wood'}
  const natal = c.ninestar.star

  // Biorhythm monthly peaks (approximate by days elapsed)
  const birthJD = Math.floor(2451545 + (c.input.year-2000)*365.25 + c.input.month*30 + c.input.day)
  const monthBiorhythm = months.map((_, mi) => {
    const days = Math.round((2026 - c.input.year)*365.25) + (mi * 30)
    const phy = Math.round(Math.sin(2*Math.PI*days/23)*100)
    const emo = Math.round(Math.sin(2*Math.PI*days/28)*100)
    const int = Math.round(Math.sin(2*Math.PI*days/33)*100)
    return { phy, emo, int, avg: Math.round((phy+emo+int)/3) }
  })

  // Vedic monthly quality (based on dasha sub-period)
  const vedicMonthQuality = months.map((_, mi) => {
    const py = ((c.numerology.personalYear2026 - 1 + mi) % 9) + 1
    return [1,3,6,8].includes(py) ? 'ดี' : [5].includes(py) ? 'ระวัง' : 'ปานกลาง'
  })

  function monthRating(ms: number, bioAvg: number): { icon: string; score: number } {
    let base = 0
    if (ms === natal) base = 3
    else if (SHENG[STAR_EL[ms]??''] === 'Fire') base = 2
    else if (KE[STAR_EL[ms]??''] === 'Fire') base = -1
    if (ms === 5) base -= 1
    const bioBonus = bioAvg > 40 ? 1 : bioAvg < -40 ? -1 : 0
    const total = base + bioBonus
    const icon = ms===natal?'🌟': total>=2?'🟢': total>=0?'🟡': '🔴'
    return { icon, score: total }
  }

  return section(16, tr('พยากรณ์รายเดือน 2026 — 3 ศาสตร์ Consensus','Monthly Forecast 2026 — 3-System Consensus'), '🗓️', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">วิธีอ่านตารางนี้</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ตารางนี้เทียบ 3 ศาสตร์ <strong>ที่คำนวณอิสระจากกัน</strong> ในแต่ละเดือนของปี 2026 —
        เดือนที่ 3 ศาสตร์เห็นพ้องว่า "ดี" คือเดือนที่ควรลงมือ; เดือนที่ไม่สอดคล้อง ควรนิ่งและสังเกต
        <br><br>
        <strong style="color:#c8a840">NSK</strong> = ดาวประจำเดือน (เทียบกับดาวเกิด ${natal} ${esc(c.ninestar.starChinese||'')}) ·
        ${natal} ตรงเมื่อไหร่ = <strong>Honmei</strong> = ปีเกิดทุก 9 ปี<br>
        <strong style="color:#c8a840">Bio</strong> = ค่าเฉลี่ย Biorhythm 3 วงจร (กาย + อารมณ์ + สมอง) ในกลางเดือนนั้น<br>
        <strong style="color:#c8a840">PY-pattern</strong> = สถานะ Numerology ของเดือน (คำนวณจาก Personal Year ${c.numerology.personalYear2026})
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>เดือน</th>
          <th>NSK ดาวเดือน</th>
          <th>Bio avg</th>
          <th>PY-pattern</th>
          <th>Consensus</th>
          <th>แนะนำ</th>
        </tr>
      </thead>
      <tbody>
        ${months.map((m,i) => {
          const ms = monthStars[i]
          const bio = monthBiorhythm[i]
          const nskRating = monthRating(ms, bio.avg)
          const isHonmei = ms === natal
          const adviceTh = nskRating.icon==='🌟'?'Honmei — ตั้งเป้าหมายใหญ่':
                          nskRating.icon==='🟢'?'ลงมือทำได้เลย · พลังเสริม':
                          nskRating.icon==='🟡'?'ค่อยๆ ขยับ · ไม่เร่ง':
                          'ระวังและสังเกต · ไม่รีบตัดสินใจ'
          return `<tr>
            <td style="font-weight:600">${esc(m)}</td>
            <td style="font-size:11px">${ms} ${esc(starNames[ms])}${isHonmei?' ★':''}</td>
            <td style="font-size:11px;color:${bio.avg>30?'#60c060':bio.avg<-30?'#c06060':'#c0a060'}">${bio.avg>0?'+':''}${bio.avg}%</td>
            <td style="font-size:11px;color:#9a8a72">${esc(vedicMonthQuality[i])}</td>
            <td style="text-align:center;font-size:16px">${nskRating.icon}</td>
            <td style="font-size:11px;color:#9a8a72">${esc(adviceTh)}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
    <div style="font-size:10.5px;color:#9a8a72;margin-top:10px;line-height:1.7">
      🌟 <strong>Honmei</strong> (ดาวเดือนตรงกับดาวเกิด ${natal} — เกิดปีละ 1 เดือน) · 🟢 <strong>Positive</strong> (NSK+Bio หนุนกัน) · 🟡 <strong>Neutral</strong> (หนึ่งหนุนหนึ่งต้าน) · 🔴 <strong>Challenging</strong> (NSK ขัด + Bio ตก)
      <br>
      <span style="color:#6a5a42">หมายเหตุ: ไม่ใช่ "ดวงดี / ดวงแย่" — เป็นสัญญาณของช่วงเวลาที่ <strong>พลังงานสอดคล้อง vs ต้องระวัง</strong> เท่านั้น</span>
    </div>
  `)
}

function p19_decade(c: ChartData): string {
  const currentAge = 2026 - c.input.year
  const lps = c.bazi.luckPillars
  const { vedicMahadasha, ninestar, numerology, bazi } = c
  const dmEl = bazi.dayMasterElement

  // Personal-Year formula: standard Pythagorean numerology = reduce(month+day+year).
  // Use INTEGER arithmetic only — the old (1 + month/12) variant produced
  // fractional PYs like 4.5 which the user flagged.
  const pyForYear = (year: number) => {
    const digitSum = (n: number) => String(n).split('').reduce((a,b)=>a+(+b),0)
    let s = digitSum(c.input.month) + digitSum(c.input.day) + digitSum(year)
    while (s > 9 && s !== 11 && s !== 22 && s !== 33) s = digitSum(s)
    return s
  }

  // Archetype meaning per life stage + the reason it maps to your chart.
  // Advice is derived from Day Master + dominant LP stem/branch, not a generic
  // one-line filler. Decade 25–34 can be ลงมือลุย vs พักค้นหา depending on
  // which element supports dmEl at that Luck Pillar.
  const SHENG_BY: Record<string,string> = { 'ไม้':'น้ำ','ไฟ':'ไม้','ดิน':'ไฟ','โลหะ':'ดิน','น้ำ':'โลหะ' }
  const feedEl = SHENG_BY[dmEl] || 'น้ำ'
  const decades = [
    { age:'25–34', label:'วัยสร้างรากฐาน',
      why:`ช่วงที่ Day Master ${dmEl} ต้องการ ${feedEl} หล่อเลี้ยง — ทุกประสบการณ์คือวัตถุดิบ` },
    { age:'35–44', label:'วัยลงมือสร้าง',
      why:`พลังงาน ${dmEl} ถึงจุดอิ่มตัว — เหมาะต่อยอดที่สะสมไว้ให้เห็นผลเป็นรูปธรรม` },
    { age:'45–54', label:'วัยเก็บเกี่ยว',
      why:`Luck Pillar เปลี่ยนทิศ — สิ่งที่ลงแรงในสองทศวรรษก่อนเริ่มให้ดอกผล` },
    { age:'55–64', label:'วัยถ่ายทอด',
      why:`พลัง ${dmEl} เริ่มถอย — คุณค่าเปลี่ยนจาก "ทำเอง" เป็น "สอน / mentoring"` },
    { age:'65+', label:'วัยปัญญา',
      why:`ชั้นของ experience สะสมเป็น wisdom — ถึงเวลาใช้บทเรียนสร้างมรดก` },
  ]

  const NSK_CHAR: Record<number,string> = {
    1:'白 น้ำขาว',2:'黒 ดินดำ',3:'碧 ไม้น้ำเงิน',4:'緑 ไม้เขียว',5:'黄 ดินเหลือง',
    6:'白 โลหะขาว',7:'赤 โลหะแดง',8:'白 ดินขาว',9:'紫 ไฟม่วง',
  }
  const NSK_THEME: Record<number,string> = {
    1:'สายน้ำที่ไหลลึก · ปัญญาภายใน',
    2:'แผ่นดิน · รักษาความสัมพันธ์',
    3:'แตกหน่อ · เริ่มต้น · สื่อสาร',
    4:'ลม / ไม้โต · ยืดหยุ่นและเดินทาง',
    5:'ศูนย์กลาง · พลิกผันใหญ่',
    6:'โลหะผู้นำ · บริหารและอำนาจ',
    7:'โลหะร่าเริง · ความสุขและวัตถุ',
    8:'ภูเขา · เปลี่ยนผ่านและสะสม',
    9:'ไฟ · ชื่อเสียงและแสงสว่าง',
  }

  return section(15, tr('Decade by Decade — มุมมอง 4 ศาสตร์ซ้อนกัน','Decade by Decade — 4-System Layered View'), '📖', `
    <div style="font-size:11.5px;color:#9a8a72;margin-bottom:12px;line-height:1.7">
      แต่ละทศวรรษอ่านจาก 4 แกนพร้อมกัน — <strong>BaZi Luck Pillar</strong> (ฉากหลัง 10 ปี)
      + <strong>Nine Star Ki</strong> (พลังงานเด่นของรอบ 9 ปี) +
      <strong>Vedic Mahadasha</strong> (เทพครองช่วง) + <strong>Numerology Personal Year</strong> (ธีมเฉพาะปีเริ่ม).
      เมื่อทั้งสี่ศาสตร์ชี้ไปทางเดียวกัน นั่นคือสัญญาณแรงที่สุด
    </div>

    ${decades.map((d, i) => {
      const ageStart = parseInt(d.age)
      const ageEnd = parseInt(d.age.split('–')[1] || '999')
      const lp = lps.find(lp => lp.ageEnd >= ageStart && lp.ageStart <= ageEnd) || lps[Math.min(i, lps.length-1)]
      const isNow = currentAge >= ageStart && currentAge <= ageEnd
      const decadeStartYear = c.input.year + ageStart
      // Use the same NSK year formula as calcNineStar() so this matches the
      // year-star shown elsewhere (the prior formula derived from age+birth
      // year produced a different cycle and contradicted the headline NSK).
      let nskStar = ((2 - (decadeStartYear - 2024)) % 9 + 9) % 9
      if (nskStar === 0) nskStar = 9
      const py = pyForYear(decadeStartYear)
      const dashaOverlap = vedicMahadasha.currentDashaEnd >= decadeStartYear
      const mahadashaLabel = dashaOverlap
        ? `${vedicMahadasha.currentDasha} (ช่วงปัจจุบัน)`
        : `หลัง ${vedicMahadasha.currentDasha} · รอบใหม่`

      return `<div style="border:1px solid ${isNow?'#d4aa50':'#2a2010'};border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:${isNow?'#1e1a0e':'#141210'};padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;color:${isNow?'#d4aa50':'#c8a840'}">${esc(d.age)} · ${esc(d.label)}</span>
          ${isNow?'<span style="color:#d4aa50;font-size:11px">▶ ยุคปัจจุบันของคุณ</span>':''}
        </div>
        <div style="padding:12px 14px;font-size:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div>🔥 <strong>BaZi Luck Pillar:</strong><br><span style="color:#9a8a72">${esc(lp.stem)}${esc(lp.branch)} · ${esc(lp.stemTh)} ${esc(lp.branchTh)}</span></div>
            <div>⭐ <strong>Nine Star Ki:</strong><br><span style="color:#9a8a72">ดาว ${nskStar} ${esc(NSK_CHAR[nskStar]||'')}</span></div>
            <div>🕉️ <strong>Vedic Mahadasha:</strong><br><span style="color:#9a8a72">${esc(mahadashaLabel)}</span></div>
            <div>🔢 <strong>Personal Year ${decadeStartYear}:</strong><br><span style="color:#9a8a72">PY ${py} (ธีมรอบเริ่มทศวรรษ)</span></div>
          </div>
          <div style="background:#1a1510;border-left:3px solid #c8a840;padding:8px 10px;margin-top:6px">
            <div style="font-size:10px;color:#c8a840;letter-spacing:1px;margin-bottom:4px">ทำไมช่วงนี้ถูกเรียกว่า "${esc(d.label)}"</div>
            <div style="color:#c8c0a8;line-height:1.6">${esc(d.why)}. NSK ${nskStar} สะท้อนธีม "<strong>${esc(NSK_THEME[nskStar]||'')}</strong>" คู่ไปกับ Luck Pillar ${esc(lp.stemTh)} — สองศาสตร์ชี้ทิศเดียวกันคือสัญญาณหลัก</div>
          </div>
        </div>
      </div>`
    }).join('')}

    ${box('ช่วงทองในชีวิต', `ตอนนี้คุณอยู่ใน <strong>Luck Pillar ${c.bazi.currentLuckPillar} (${c.bazi.currentLuckPillarTh})</strong> + <strong>NSK Star ${ninestar.star} ${ninestar.starChinese}</strong> + <strong>Vedic ${vedicMahadasha.currentDasha} Dasha</strong> — 3 ศาสตร์จาก 3 วัฒนธรรมที่คำนวณอย่างอิสระ ชี้ตรงกันว่าเป็นช่วงสำคัญของชีวิต`, 'green')}
  `)
}

function p20_colors(c: ChartData): string {
  const { ninestar, bazi, thai, celtic } = c
  // Each color has a traceable source + one-line "why"
  const sources: Array<{color: string; source: string; why: string}> = []

  if (ninestar.starColor) sources.push({
    color: ninestar.starColor,
    source: `Nine Star Ki (ดาว ${ninestar.star} ${ninestar.starChinese||''})`,
    why: `ดาวเกิดของคุณคือดาว ${ninestar.star} — ${ninestar.starColor}คือสีสัญลักษณ์ของดาวนี้ในโหราศาสตร์ญี่ปุ่น Feng Shui ใช้ค่านี้เป็น accent สำคัญ`,
  })
  const bzColor = bazi.luckyElement === 'ไฟ' ? 'แดง / ส้ม'
                : bazi.luckyElement === 'ไม้' ? 'เขียว'
                : bazi.luckyElement === 'น้ำ' ? 'ดำ / น้ำเงิน'
                : bazi.luckyElement === 'โลหะ' ? 'ขาว / เงิน'
                : 'เหลือง / น้ำตาล'
  sources.push({
    color: bzColor,
    source: `BaZi (Day Master ${bazi.dayMasterTh})`,
    why: `ธาตุมงคลของคุณคือ <strong>${bazi.luckyElement}</strong> — สีนี้สะท้อนธาตุที่ <em>หล่อเลี้ยง</em> Day Master ${bazi.dayMasterTh} ตามวงจร 5 ธาตุจีน`,
  })
  if (thai.dayColor) sources.push({
    color: thai.dayColor,
    source: `ไทยพราหมณ์ (วัน${thai.dayName})`,
    why: `คุณเกิดวัน<strong>${thai.dayName}</strong> — ในโหราศาสตร์ไทย สีของเทพประจำวันคือ ${thai.dayColor} ซึ่งช่วยเรียกพลังงานของเทพผู้คุ้มครอง`,
  })
  // Celtic element → associated color fallback (CelticData doesn't expose a
  // tree color field, so we map from the ruling element).
  const CELTIC_EL_COLOR: Record<string,string> = {
    'ไม้':'เขียวมรกต', 'ไฟ':'ส้มทอง', 'ดิน':'น้ำตาลอบอุ่น', 'โลหะ':'เงินมุก', 'น้ำ':'ฟ้าคราม',
  }
  const celticColor = CELTIC_EL_COLOR[celtic.element] || ''
  if (celticColor) sources.push({
    color: celticColor,
    source: `Celtic (${celtic.treeNameTh || celtic.treeName})`,
    why: `ต้นไม้ประจำวันเกิดของคุณคือ <strong>${celtic.treeNameTh || celtic.treeName}</strong> — ธาตุ${celtic.element} ของต้นไม้นี้สัมพันธ์กับสี ${celticColor}`,
  })

  const avoidColor = bazi.avoidElement === 'ไฟ' ? 'แดงสด'
                   : bazi.avoidElement === 'น้ำ' ? 'ดำสนิท'
                   : bazi.avoidElement === 'ไม้' ? 'เขียวเข้ม'
                   : bazi.avoidElement === 'โลหะ' ? 'เงินแท้ / โครเมียม'
                   : 'เหลืองฉูดฉาด'

  return section(20, tr('สีมงคลและการแต่งตัว — ที่มาจาก 4 ศาสตร์','Lucky Colours & Style — Sourced from 4 Systems'), '👗', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">ทำไม "สีมงคล" ของคุณ = สีเหล่านี้ ไม่ใช่สีอื่น</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        แต่ละสีถูกเลือกจากศาสตร์คนละศาสตร์ที่คำนวณอิสระจากกัน ยิ่งสีไหนปรากฏซ้ำในหลายศาสตร์ ยิ่งมีน้ำหนัก
      </div>
    </div>

    <h2>สีที่แนะนำ · ${sources.length} ศาสตร์ยืนยัน</h2>
    ${sources.map(s => `
      <div style="border-left:3px solid #c8a840;background:#1a1510;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div style="font-family:'Sarabun',sans-serif;font-size:16px;font-weight:700;color:#d4aa50">${esc(s.color)}</div>
          <div style="font-size:10.5px;color:#7a6a52">ที่มา: <strong>${esc(s.source)}</strong></div>
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${s.why}</div>
      </div>
    `).join('')}

    <h2 style="margin-top:18px">สีที่ควรลด (ไม่ใช่ห้าม)</h2>
    <div style="border-left:3px solid #c01020;background:#1a0a0a;padding:10px 14px;border-radius:0 8px 8px 0">
      <div style="font-size:15px;font-weight:700;color:#f08080">${esc(avoidColor)}</div>
      <div style="font-size:11.5px;color:#e8a880;margin-top:4px">ธาตุระวังของคุณคือ <strong>${esc(bazi.avoidElement)}</strong> — สีนี้ "กด" Day Master ${esc(bazi.dayMasterTh)} ตามวงจร 5 ธาตุจีน ใช้เป็นสีหลักบ่อยๆ อาจทำให้รู้สึกหมดพลัง</div>
    </div>

    ${box('คำแนะนำการแต่งกายรายวัน',
      `• <strong>ปกติ:</strong> ใส่${esc(ninestar.starColor||'')}เป็น accent (1 ชิ้น/วัน — เครื่องประดับ เน็คไท กระเป๋า)<br>` +
      `• <strong>วันสำคัญ:</strong> ใส่สีมงคลเต็มชุด (เลือกจาก ${sources.map(s=>s.color).join(' / ')})<br>` +
      `• <strong>ประชุม / ขอขึ้นเงินเดือน:</strong> ${esc(bzColor)} (ธาตุ${esc(bazi.luckyElement)})<br>` +
      `• <strong>อัญมณีนำโชค:</strong> ${esc(celtic.gemstone||'—')} (จาก Celtic)`
    , 'gold')}
  `)
}

function p21_historicalFigures(c: ChartData): string {
  // Figure pool — selected by Day Master element and Life Path
  type Figure = {name:string;years:string;element:string;lifePath:number[];nsk:number[];why:string}
  const FIGURE_POOL: Figure[] = [
    { name:'Steve Jobs', years:'1955–2011', element:'ไฟ', lifePath:[1,5,7], nsk:[1,4,9], why:`ผู้บุกเบิกด้วยพลังงาน${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} + ความกล้าทำลายกรอบเดิม` },
    { name:'Albert Einstein', years:'1879–1955', element:'ไม้', lifePath:[7,11,3], nsk:[3,6,9], why:`Life Path ${c.numerology.lifePath} สู่ความจริงอันลึกซึ้ง + ${c.western.sunSignTh}ที่ให้ปัญญาและสัญชาตญาณ` },
    { name:'Marie Curie', years:'1867–1934', element:'น้ำ', lifePath:[7,6,9], nsk:[1,8,6], why:`ความลึกของ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} + ความอดทนสู่ความสำเร็จที่ยิ่งใหญ่` },
    { name:'Leonardo da Vinci', years:'1452–1519', element:'ไม้', lifePath:[5,11,3], nsk:[3,4,9], why:`ครีเอทีฟสูงสุดจาก${c.bazi.dayMasterElement} + Celtic ${c.celtic.treeName} + ความอยากรู้ไม่สิ้นสุด` },
    { name:'Frida Kahlo', years:'1907–1954', element:'ไฟ', lifePath:[3,9,6], nsk:[9,3,7], why:`พลังสร้างสรรค์จากภายใน + ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} ที่โดดเด่น` },
    { name:'Nikola Tesla', years:'1856–1943', element:'โลหะ', lifePath:[1,7,11], nsk:[1,7,4], why:`ดาว${c.ninestar.star} + ธาตุ${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} ผสานจินตนาการและวิทยาศาสตร์` },
    { name:'Coco Chanel', years:'1883–1971', element:'ดิน', lifePath:[8,4,1], nsk:[8,2,6], why:`ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} หนุนรสนิยมและการสร้างตัวตน` },
    { name:'Laozi (老子)', years:'ราว 600 ปีก่อน ค.ศ.', element:'น้ำ', lifePath:[7,9,4], nsk:[1,6,8], why:`ความลึกของน้ำธาตุ + ปัญญาที่เกิดจากการสังเกต — Life Path ${c.numerology.lifePath}` },
  ]
  // Score each figure by matching: element match (+3), lifePath match (+2), nsk match (+2), base from chart
  const dm = c.bazi.dayMasterElement
  const lp = c.numerology.lifePath
  const ns = c.ninestar.star
  const scoredFigures = FIGURE_POOL.map(f => {
    const matchPts = (f.element === dm ? 3 : 0) + (f.lifePath.includes(lp) ? 2 : 0) + (f.nsk.includes(ns) ? 2 : 0)
    // Score = chart total adjusted for figure match (not hardcoded)
    const figureScore = Math.min(999, Math.round(c.score.total * 0.9 + matchPts * 8 + (f.lifePath[0] * 3)))
    return { ...f, score: figureScore, matchPts }
  })
  const figures = scoredFigures.sort((a,b) => b.matchPts - a.matchPts).slice(0, 4)
  return section(21, tr('บุคคลประวัติศาสตร์ — ดวงคล้ายคุณ','Historical Figures — Charts Like Yours'), '🏛️', `
    <p style="margin-bottom:12px">คัดเลือกจากลักษณะชาร์ตที่คล้ายกัน — ไม่ใช่การทำนายว่าจะเป็นแบบพวกเขา แต่แสดงให้เห็นว่าพลังงานนี้นำไปสู่อะไรได้</p>
    ${figures.map(f => `
      <div style="border:1px solid #2a2010;border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:#151210;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-weight:700;color:#d4aa50">${esc(f.name)}</span>
            <span style="font-size:11px;color:#6a5a42;margin-left:8px">${esc(f.years)}</span>
          </div>
          <span style="font-size:18px;font-weight:700;color:#d4aa50">${f.score}</span>
        </div>
        <div style="padding:10px 14px;font-size:12px;color:#9a8a72">${esc(f.why)}</div>
      </div>`).join('')}
  `)
}

function p22_painPoints(c: ChartData): string {
  const dmEl = c.bazi.dayMasterElement
  const missingEl = c.bazi.missingElement || (dmEl === 'ไม้'?'โลหะ':dmEl === 'ไฟ'?'น้ำ':dmEl === 'ดิน'?'ไม้':dmEl === 'โลหะ'?'ไฟ':'ดิน')
  const points = [
    { icon:'❤️', topic:'ความรัก & ความสัมพันธ์',
      systems: ['Western (Moon)', 'BaZi (Day Master)', 'Human Design'],
      why: `ดวงจันทร์ของคุณอยู่ใน<strong>${c.western.moonSignTh}</strong> — ต้องการความมั่นคงทางอารมณ์แบบเฉพาะ · Day Master <strong>${c.bazi.dayMasterTh}</strong> ธาตุ${dmEl}ทำให้การแสดงอารมณ์มีรูปแบบเฉพาะ — ${dmEl==='โลหะ'?'ชอบเก็บไว้ในใจ':dmEl==='ไฟ'?'ระเบิดอารมณ์ง่าย':dmEl==='น้ำ'?'ลึกและเปลี่ยนแปลง':dmEl==='ดิน'?'มั่นคงแต่เปิดตัวช้า':'ยืดหยุ่นแต่เรียกร้องอิสระ'}`,
      challenge: `การผสมของ ${c.western.moonSignTh} (Moon) + ธาตุ${dmEl} (BaZi) ทำให้คุณ <em>ต้องการความใกล้ชิดอย่างลึกซึ้ง</em> แต่ <em>แสดงออกยาก</em> — 3 ศาสตร์อิสระชี้แบบเดียวกัน`,
      solution:`ฝึก "บอกความรู้สึกก่อนคู่ถาม" — กฎง่ายๆ: สิ่งที่รู้สึกวันนี้ บอกภายใน 48 ชม. · ใช้ HD Strategy ของคุณ (${c.humandesign.strategy}) เป็นตัวกรองว่าจะบอกเมื่อไหร่`
    },
    { icon:'💼', topic:'การงาน & พลังงานทำงาน',
      systems: ['Human Design', 'BaZi', 'Nine Star Ki'],
      why: `<strong>${c.humandesign.typeTh}</strong> + Authority <strong>${c.humandesign.authority}</strong> = คุณถูกออกแบบให้ตัดสินใจผ่าน <em>${c.humandesign.authority}</em> ไม่ใช่ mind · NSK ดาว ${c.ninestar.star} ${c.ninestar.starChinese||''} บอกธีมพลังงานหลักของคุณที่ไม่ควรฝืน`,
      challenge: `เมื่อบังคับให้ทำงานขัด Strategy "${c.humandesign.strategy}" คุณจะเหนื่อยเร็วกว่าคนอื่นที่ทำงานเท่ากัน — เป็น bug ของการ <em>บีบพลังงานที่ออกแบบมาต่าง</em> ไม่ใช่ bug ของความพยายาม`,
      solution:`ทดลองใช้ Strategy "${c.humandesign.strategy}" อย่างตั้งใจ 90 วัน → สังเกตระดับพลังงานก่อนและหลัง · ถ้าดีขึ้น → วิธีตัดสินใจนี้คือของคุณตลอดชีวิต`
    },
    { icon:'🌿', topic:'สุขภาพ & ธาตุที่ขาด',
      systems: ['BaZi (missing element)', 'TCM organ pairing', 'Biorhythm'],
      why: `BaZi ของคุณขาดธาตุ <strong>${missingEl}</strong> — ธาตุที่ขาดในชาร์ตตาม TCM มักสัมพันธ์กับอวัยวะที่ต้องดูแลพิเศษ · ต่างจาก "โรคภัยทำนาย" — นี่คือ <em>จุดที่ต้องเติมอย่างสม่ำเสมอ</em> ในฐานะการป้องกัน`,
      challenge: `เมื่อธาตุ${missingEl}ขาด ระบบที่เกี่ยวข้องจะเป็นจุดแรกที่ "บ่น" เวลาร่างกายตึงเครียด — ไม่ใช่ป่วยหนัก แต่ทำงานไม่เต็มประสิทธิภาพ`,
      solution:`เสริมธาตุ${missingEl} 3 ทางพร้อมกัน — <strong>สี</strong> (ดูหน้าสีมงคล) · <strong>อาหาร</strong> (รส${missingEl==='ไม้'?'เปรี้ยว':missingEl==='ไฟ'?'ขม':missingEl==='ดิน'?'หวานธรรมชาติ':missingEl==='โลหะ'?'เผ็ดเบา':'เค็มเบา'}) · <strong>กิจกรรม</strong> (${missingEl==='น้ำ'?'ว่ายน้ำ/สมาธิ':missingEl==='ไฟ'?'ออกกำลังกลางแจ้ง':missingEl==='ดิน'?'เดินเท้าเปล่าบนดิน':missingEl==='โลหะ'?'หายใจลึก':'ปลูกต้นไม้/เดินป่า'})`
    },
    { icon:'🤔', topic:'การตัดสินใจ & แรงกดดันภายนอก',
      systems: ['Human Design (Authority)', 'BaZi (Day Master)', 'Numerology (LP)'],
      why: `<strong>${c.humandesign.authority}</strong> Authority + Life Path ${c.numerology.lifePath} → รูปแบบการตัดสินใจของคุณต้องใช้เวลาเฉพาะ (ไม่ใช่ "ช้า" — แต่ "ต้องรอสัญญาณภายในถูกต้อง") · สังคม modernity มักกดดันให้ "ตัดสินใจไว" ซึ่งเป็นของ Mental Authority แบบเดียวเท่านั้น`,
      challenge: `เมื่อถูกเร่ง คุณจะตัดสินใจด้วย "mind" ซึ่งไม่ใช่ Authority ของคุณ → ผลลัพธ์มักทำให้เสียใจภายหลัง · นี่ไม่ใช่จุดอ่อน แต่เป็นการ <em>ใช้เครื่องมือผิดประเภท</em>`,
      solution:`กฎ <strong>24/72/7</strong> — เรื่องเล็ก: รอ 24 ชม. · เรื่องกลาง: 72 ชม. · เรื่องใหญ่: 7 วัน · ภายในช่วงนั้น ${c.humandesign.authority} จะส่งสัญญาณชัด ไม่ต้องพยายามคิด`
    },
    { icon:'🪞', topic:'รู้จักตัวเอง & การเข้าสังคม',
      systems: ['Human Design (Profile)', 'Vedic (Nakshatra)', 'Mayan (Kin)'],
      why: `Profile <strong>${c.humandesign.profile}</strong> + Nakshatra ${c.vedic.moonNakshatra} + Mayan Kin ${c.mayan.kin} — 3 ศาสตร์จาก 3 วัฒนธรรมบอกเรื่อง <em>วิธีที่จิตวิญญาณของคุณมาปรากฏในโลก</em> · มักไม่ตรงกับ "แม่แบบความสำเร็จมาตรฐาน"`,
      challenge: `คุณจะรู้สึก <em>ไม่ fit</em> ในหลายสถานการณ์ ไม่ใช่เพราะผิดปกติ — แต่เพราะสังคมใช้ template เดียวในการวัดทุกคน ส่วนดวงของคุณเป็น template คนละแบบ`,
      solution:`${esc(c.humandesign.profileDesc || 'ทำความเข้าใจ Profile ของตัวเองให้ลึก')} · ใช้ Profile เป็นกรอบอธิบายตัวเอง ไม่ใช่กรอบบังคับ`
    },
  ]
  return section(22, tr('5 Pain Points — จุดที่ดวงชี้ให้ดูแลเป็นพิเศษ','5 Pain Points — areas your chart says to nurture carefully'), '⚡', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">นี่คือ "จุดที่ต้องดูแล" ไม่ใช่ "ดวงเสีย"</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        Pain Point ทั้ง 5 นี้มาจากการอ่านข้าม 3–5 ศาสตร์พร้อมกัน —
        ยิ่งหลายศาสตร์ชี้จุดเดียวกัน ยิ่งเป็นจุดที่ควรให้ความสนใจในชีวิต ·
        แต่ละข้ออธิบาย <strong>ทำไมเป็น pain point ของคุณโดยเฉพาะ</strong> (Why) +
        <strong>อาการที่จะเจอ</strong> (Challenge) + <strong>วิธีรับมือตามดวง</strong> (Solution)
      </div>
    </div>

    ${points.map(p => `
      <div style="border-left:3px solid #8a3040;padding:12px 14px;margin:10px 0;background:#1a0a0a;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <div style="font-size:15px;font-weight:700;color:#d4aa50">${p.icon} ${esc(p.topic)}</div>
          <div style="font-size:10px;color:#a08060">${p.systems.length} ศาสตร์ชี้ตรงกัน</div>
        </div>
        <div style="font-size:10px;color:#7a6a52;margin-bottom:8px">ที่มา: ${p.systems.map(s=>`<strong>${esc(s)}</strong>`).join(' · ')}</div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-bottom:6px;line-height:1.65"><strong style="color:#d4aa50">ทำไมเป็น pain point ของคุณ:</strong> ${p.why}</div>
        <div style="font-size:11.5px;color:#f0a090;margin-bottom:6px;line-height:1.65"><strong>อาการที่จะเจอ:</strong> ${p.challenge}</div>
        <div style="font-size:11.5px;color:#90e0a0;line-height:1.65"><strong>วิธีรับมือตามดวง:</strong> ${p.solution}</div>
      </div>`).join('')}
  `)
}

function p23_forecast10yr(c: ChartData): string {
  const startYear = 2026
  const years = Array.from({length:10}, (_,i) => startYear + i)
  const { bazi, numerology } = c
  return section(23, tr('พยากรณ์ 10 ปี 2026–2035','10-Year Forecast · 2026–2035'), '🔭', `
    <table>
      <thead><tr><th>ปี</th><th>PY</th><th>NSK</th><th>แนวโน้ม</th></tr></thead>
      <tbody>
        ${years.map(y => {
          const py = ((numerology.personalYear2026 - 1 + (y - 2026)) % 9) + 1
          const nsk = ((9 - (y - 2026)) % 9) || 9
          const good = py === 1||py===8||py===3 ? '🟢' : py===4||py===7 ? '🔴' : '🟡'
          return `<tr>
            <td style="font-weight:600">${y}</td>
            <td style="color:#d4aa50">PY ${py}</td>
            <td style="font-size:11px;color:#9a8a72">Star ${nsk}</td>
            <td>${good} ${py===1?'เริ่มต้นใหม่':py===2?'สร้างความสัมพันธ์':py===3?'สื่อสารขยาย':py===4?'ทำงานหนัก':py===5?'เปลี่ยนแปลง':py===6?'ครอบครัว':py===7?'พักฟื้น':py===8?'เก็บเกี่ยว':'สรุปปิดฉาก'}</td>
          </tr>`}).join('')}
      </tbody>
    </table>
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">PY = Personal Year | 🟢 ดี 🟡 ปานกลาง 🔴 ระวัง</p>
    ${box('ช่วงทอง', `ปี ${years.filter((_,i) => {const py=((numerology.personalYear2026-1+i)%9)+1; return py===1||py===8||py===3}).slice(0,3).join(', ')} — Personal Year ที่ดีที่สุดในรอบ 10 ปี`, 'green')}
  `)
}

function p24_pets(c: ChartData): string {
  const dmEl = c.bazi.dayMasterElement
  const missingEl = c.bazi.missingElement || '—'

  // Enrich each pet suggestion with the 5-element logic + which missing
  // element it supplies to make the suggestion traceable, not arbitrary.
  const petMap: Record<string, Array<{animal:string; why:string; fills?:string}>> = {
    'ไฟ': [
      {animal:'🐱 แมว', why:`แมวเป็นสัตว์ที่วัฒนธรรมอียิปต์-ตะวันออกจับคู่กับธาตุไฟ — อิสระ อุณหภูมิร่างกายสูง กลางคืนตื่นตัว · เสริม Day Master ${dmEl}ของคุณโดยตรง`, fills:'ไฟ (หนุน)'},
      {animal:'🦜 นกแก้ว', why:'นกเป็นตัวแทนธาตุไม้ (เคลื่อนไหวในอากาศ-ต้นไม้) · ไม้สร้างไฟใน 5 ธาตุ → หล่อเลี้ยง Day Master ของคุณ', fills:'ไม้ (สร้างไฟ)'},
      {animal:'🐠 ปลา', why:`น้ำตรงข้ามกับไฟ แต่เสริมสมดุล — สำหรับคนไฟร้อนแรง ปลาช่วยลดความร้อนอาโวคาโด · ดีพิเศษถ้าขาดธาตุ${missingEl==='น้ำ'?'น้ำ':'—'}`, fills:missingEl==='น้ำ'?'น้ำ (ขาด)':'น้ำ (สมดุล)'},
      {animal:'🐇 กระต่าย', why:'กระต่ายเป็นสัตว์ธาตุไม้ (เกี่ยวข้องกับพืช) + อ่อนโยน — สมดุลไฟที่อาจร้อนเกิน', fills:'ไม้ (สร้างไฟ)'},
    ],
    'ไม้': [
      {animal:'🐶 สุนัข', why:'สุนัขเป็นสัตว์ธาตุดิน (ซื่อสัตย์ สัมพันธ์กับบ้าน) · ดินให้รากฐานกับไม้ให้ยึดได้', fills:'ดิน (ให้รากกับไม้)'},
      {animal:'🐠 ปลา', why:'น้ำหล่อเลี้ยงไม้โดยตรงใน 5 ธาตุ — ตู้ปลาในบ้านจะเสริม Day Master ของคุณทุกวัน', fills:'น้ำ (หล่อเลี้ยงไม้)'},
      {animal:'🐢 เต่า', why:'เต่าเป็นสัญลักษณ์ดิน+น้ำในพุทธและจีน — สองธาตุที่ค้ำจุนไม้', fills:'ดิน+น้ำ'},
      {animal:'🦜 นก', why:'นกอยู่บนต้นไม้ = ขยายพลังงานไม้ในแนวสูง', fills:'ไม้ (เหมือนกัน)'},
    ],
    'น้ำ': [
      {animal:'🐠 ตู้ปลา', why:'ตู้ปลา = น้ำในบ้าน ขยายพลังของ Day Master โดยตรง · Feng Shui ใช้มาเป็นพันปี', fills:'น้ำ (หนุน)'},
      {animal:'🐢 เต่า', why:'เต่ามีธาตุดิน — ดินควบคุมน้ำใน 5 ธาตุ ทำให้น้ำไม่ล้นหรือหายไปง่าย', fills:'ดิน (สมดุลน้ำ)'},
      {animal:'🐶 สุนัข', why:'สุนัขเป็นธาตุดิน — ช่วย <em>ยึด</em> พลังงานน้ำไม่ให้ไหลเปลี่ยนแปลงเร็วเกินไป', fills:'ดิน (ยึดน้ำ)'},
      {animal:'🐱 แมว', why:'แมวธาตุไฟ — ไฟสมดุลกับน้ำในทางพลังงาน (ขั้วตรงข้ามที่เติมเต็มกัน)', fills:'ไฟ (สมดุล)'},
    ],
    'โลหะ': [
      {animal:'🐟 ปลา', why:'น้ำเป็นผลผลิตของโลหะใน 5 ธาตุ — ปลาช่วยให้พลังงานโลหะของคุณไหลออกมาเป็นการสร้างสรรค์', fills:'น้ำ (โลหะสร้าง)'},
      {animal:'🐇 กระต่าย', why:'ไม้ — โลหะตัดไม้ใน 5 ธาตุ ให้กระต่ายเป็นเป้าของความเข้มงวด เปลี่ยนเป็นความอ่อนโยน', fills:'ไม้ (ควบคู่)'},
      {animal:'🐹 แฮมสเตอร์', why:'พลังงานเบา สะอาด โลหะชอบความเป็นระเบียบ — แฮมสเตอร์ตอบสนองดี', fills:'โลหะ (เหมือน)'},
      {animal:'🐱 แมว', why:'ไฟหลอมโลหะ — แมวเปลี่ยน "โลหะแข็ง" ให้เป็น "โลหะมีชีวิต"', fills:'ไฟ (ปรับโลหะ)'},
    ],
    'ดิน': [
      {animal:'🐶 สุนัข', why:'สุนัขเป็นธาตุดิน (ซื่อสัตย์ รักบ้าน) — เสริม Day Master ของคุณโดยตรง', fills:'ดิน (หนุน)'},
      {animal:'🐱 แมว', why:'ไฟสร้างดินใน 5 ธาตุ — แมวเติมพลังให้ Day Master', fills:'ไฟ (สร้างดิน)'},
      {animal:'🌵 ไม้อวบน้ำ', why:'แม้ไม่ใช่สัตว์ — แต่ไม้อวบน้ำมีทั้งธาตุไม้และน้ำเล็กน้อย · ช่วยป้องกันดินไม่ให้ "แห้ง" เกินไป', fills:'ไม้ (ควบคุมดิน)'},
      {animal:'🐢 เต่า', why:'เต่าเป็นธาตุดิน+น้ำ — เพิ่มความเสถียรให้ Day Master', fills:'ดิน (เหมือน)'},
    ],
  }
  const pets = petMap[dmEl] ?? petMap['ดิน']

  // Mythological Spirit Creature — moved here (was missing in this page).
  // Drawn from the add-ons.companions table via calcAddons, which maps
  // dmEl → {creature, creatureDesc, mantra, ...}
  const companions = (c as any).addons?.companions || null

  return section(24, tr('สัตว์เลี้ยง & สัตว์ในตำนาน — ตามธาตุของคุณ','Pets & Mythological Creatures — by Your Element'), '🐾', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">ที่มาของคำแนะนำ</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        สัตว์แต่ละตัวถูกจับคู่กับธาตุใน <strong>5-element cycle</strong> ของจีนโบราณ —
        สัตว์ที่เสริม Day Master ของคุณ หรือเติมธาตุที่ขาด คือสัตว์ที่พลังงานจะ "ทำงานให้" คุณทุกวันที่อยู่ด้วยกัน<br>
        Day Master ของคุณ: <strong>${esc(c.bazi.dayMasterTh)} (ธาตุ${esc(dmEl)})</strong> ·
        ธาตุที่ขาด: <strong>${esc(missingEl)}</strong>
      </div>
    </div>

    <!-- Spirit Creature (mythological) -->
    ${companions ? `
    <div style="border:2px solid #c8a840;background:linear-gradient(135deg,#1e1a0e,#14120a);border-radius:10px;padding:14px 16px;margin:8px 0 16px">
      <div style="font-size:10px;letter-spacing:2px;color:#c8a840;margin-bottom:6px">✦ สัตว์ในตำนานประจำธาตุ${esc(dmEl)} ✦</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:17px;color:#d4aa50;margin-bottom:6px">${esc(companions.creature||'')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.7">${esc(companions.creatureDesc||'')}</div>
      ${companions.mantra ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #3a3020;font-size:11px;color:#c8a840;font-style:italic">🔔 ${esc(companions.mantra)}</div>` : ''}
    </div>` : ''}

    <h2>สัตว์เลี้ยงที่แนะนำ</h2>
    ${pets.map(p => `
      <div style="border:1px solid #2a2010;border-radius:8px;padding:12px;margin:8px 0;display:flex;gap:12px">
        <span style="font-size:28px;flex-shrink:0">${p.animal.split(' ')[0]}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px">
            <div style="font-weight:600;color:#d4aa50;font-size:13px">${esc(p.animal.split(' ').slice(1).join(' '))}</div>
            ${p.fills ? `<div style="font-size:10px;color:#8a7040;background:#1e1a0e;padding:2px 8px;border-radius:10px">ธาตุ: ${esc(p.fills)}</div>` : ''}
          </div>
          <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.6">${esc(p.why)}</div>
        </div>
      </div>`).join('')}
  `)
}

function p25_summary(c: ChartData): string {
  const { score, bazi, numerology, ninestar, western } = c
  return section(25, tr('สรุปภาพรวมและคำส่งท้าย','Final Summary & Closing Reflection'), '✨', `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:48px;font-weight:700;color:#d4aa50">${score.cosmicFinal}</div>
      <div style="font-size:16px;color:#f0e8d0;margin-top:4px">${esc(_lang === 'en' ? (score.tierEn || score.tier) : score.tier)}</div>
      <div style="font-size:12px;color:#9a8a72">${esc(score.percentile)} ${tr('ของโลก','globally')}</div>
    </div>

    ${box(tr('จุดแข็งหลัก','Core Strengths'), [
      `• ${tr(`ธาตุ${esc(bazi.dayMasterElement)} Day Master ${esc(bazi.dayStem)}`, `${esc(bazi.dayMasterElement)} element · Day Master ${esc(bazi.dayStem)}`)} — ${esc(stripHtml(bazi.reading).substring(0,60))}…`,
      `• ${esc(ninestar.starChinese)} — ${esc(stripHtml(ninestar.reading).substring(0,50))}…`,
      `• Life Path ${esc(numerology.lifePath)} — ${esc(numerology.lifePathName)}`,
    ].join('<br>'), 'gold')}

    ${box(tr('ความท้าทายหลัก','Core Challenges'), [
      `• ${tr('ธาตุที่ขาด','Missing element')}: ${bazi.missingElement || tr('ครบ','none')} — ${tr('ต้องเสริมจากภายนอก','supplement from external sources')}`,
      `• ${tr('หลีกเลี่ยงธาตุ','Element to avoid')}: ${bazi.avoidElement}`,
      `• ${tr('กลยุทธ์','Strategy')}: "${c.humandesign.strategy}" — ${tr('ฝืนสิ่งนี้คือเหนื่อยเปล่า','fighting this is wasted effort')}`,
    ].join('<br>'), 'dark')}

    ${box(tr('ช่วงทองในชีวิต','Golden Window'),
      tr(`Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → ช่วงนี้เป็นหนึ่งในช่วงที่สำคัญที่สุดในชีวิตคุณ`,
         `Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → this is one of the most consequential phases of your life.`),
      'green')}

    <div style="text-align:center;margin:24px 0;padding:20px;background:#1a1510;border:1px solid #3a3020;border-radius:12px">
      <div style="font-size:14px;color:#d4aa50;font-weight:600;margin-bottom:8px">✦ ${tr('คำส่งท้าย','Closing')} ✦</div>
      <div style="font-size:13px;color:#c8c0a8;line-height:1.9">
        ${tr('ดวงชะตาไม่ใช่โชคชะตาที่ตายตัว','Your chart is not a fixed fate.')}<br>
        ${tr('มันคือแผนที่พลังงานที่ช่วยให้คุณเข้าใจตัวเองและเลือกทางได้ฉลาดขึ้น','It is an energy map that helps you know yourself and choose your path with more wisdom.')}<br>
        <strong style="color:#d4aa50">${esc(score.cosmicEntity)}</strong><br>
        — ${tr('นี่คือสัญลักษณ์จักรวาลของคุณ จงเดินไปด้วยความมั่นใจ','This is your cosmic symbol. Walk forward with confidence.')}
      </div>
    </div>

    <div style="font-size:11px;color:#6a5a42;text-align:center;border-top:1px solid #2a2010;padding-top:12px;line-height:1.8">
      ${tr('รายงานนี้สร้างโดย AI โดยนำ 26 ศาสตร์โบราณมาวิเคราะห์หาจุดร่วม','This report is AI-generated, synthesising 26 ancient systems for points of consensus.')}<br>
      ${tr('เพื่อความบันเทิงและการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพด้านการแพทย์ กฎหมาย หรือการเงิน','For entertainment and self-exploration only — not medical, legal, or financial advice.')}<br>
      © Mythsensus · mythsensus.com
    </div>
  `)
}

// ── MAIN EXPORT ──────────────────────────────────────────────
export function generateReport(c: ChartData): string {
  _pageNum = 0  // reset counter for each report
  // Propagate chart language to module-local _lang + the buildRichReading
  // module in calc.ts so page headers + meta labels respect user choice.
  _lang = (c.input && (c.input as any).lang === 'en') ? 'en' : 'th'
  _setReportLang(_lang)
  const pages = [
    // ─── 1-4: Front matter ───────────────────────────────────────
    p01_cover,           // 1. ปก + Cosmic Score + 3-score preview
    p_threeScores,       // 2. Soul Frequency (petroleum) deep dive
    p02_scoreBreakdown,  // 3. 26-system consensus (🌟〰⚠ grouped)
    p03_convergence,     // 4. Grand Convergence (8 themes × 26 systems)
    // ─── 5-9: Born Chart deep-dive (5 systems) ───────────────────
    p05_bazi,            // 5. BaZi สี่เสา
    p06_ninestar,        // 6. Nine Star Ki
    p04_western,         // 7. Western Astrology
    p07_vedic,           // 8. Vedic Jyotish
    p12_numerology,      // 9. Numerology (LP + Thai7)
    // ─── 10-13: Original 4 systems ───────────────────────────────
    p08_energyType,      // 10. Energy Type System
    p09_mayan,           // 11. Mayan Tzolk'in
    p10_celtic,          // 12. Celtic Tree
    p11_thai,            // 13. Thai Brahmin
    // ─── 14-29: 16 New Systems (each own page) ───────────────────
    p_saju,              // 14. Saju (Korean)
    p_tibetan,           // 15. Tibetan Mewa & Parkha
    p_ziwei,             // 16. Zi Wei Dou Shu
    p_onmyodo,           // 17. Onmyōdō
    p_hellenistic,       // 18. Hellenistic Astrology
    p_norseRune,         // 19. Norse Rune
    p_ogham,             // 20. Ogham
    p_arabicParts,       // 21. Arabic Parts
    p_kabbalistic,       // 22. Kabbalistic
    p_zoroastrian,       // 23. Zoroastrian
    p_aztec,             // 24. Aztec Tonalpohualli
    p_nativeAmerican,    // 25. Native American Totem
    p_ifaYoruba,         // 26. Ifa/Yoruba
    p_aboriginal,        // 27. Aboriginal Dreamtime
    p_biorhythm,         // 28. Biorhythm
    p_vedicMahadasha,    // 29. Vedic Mahadasha
    // ─── 30-35: Life guidance (multi-system) ─────────────────────
    p13_luckPillars,     // 30. 80-Year Path (BaZi+Vedic+NSK+Numerology)
    p19_decade,          // 31. Decade by Decade
    p18_monthly2026,     // 32. Monthly 2026 (NSK+Biorhythm+PY)
    p23_forecast10yr,    // 33. 10-Year Forecast
    p16_activation,      // 34. Activation Plan (all 26 systems)
    p17_weekly,          // 35. Weekly Plan
    // ─── 36-42: Lifestyle & closing ──────────────────────────────
    p14_health,          // 36. Health (multi-system)
    p15_finance,         // 37. Finance (multi-system)
    p20_colors,          // 38. สีมงคล
    p24_pets,            // 39. สัตว์เลี้ยง
    p21_historicalFigures, // 40. Historical Figures
    p22_painPoints,      // 41. 5 Pain Points
    p25_summary,         // 42. Summary + Disclaimer
  ].map(fn => fn(c)).join('\n')

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cosmic Blueprint — ${esc(c.input.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${pages}
</body>
</html>`
}

// ============================================================
// ── CONSENSUS HELPER FUNCTIONS ──────────────────────────────
// Aggregate signals across all 26 systems for true majority opinion
// ============================================================

type SystemSignal = { system: string; score: number; finding: string; category: string; value: string }

/** Extract structured signals from all 26 systems for a given topic */
function extractSignals(c: ChartData, topic: 'health'|'finance'|'timing'|'element'|'strength'|'warning'): SystemSignal[] {
  const { bazi, western, ninestar, vedic, humandesign, mayan, celtic, thai, numerology,
          saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts,
          kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha } = c

  const all: SystemSignal[] = []
  const EL_MAP: Record<string,string> = {'ไม้':'Wood','ไฟ':'Fire','ดิน':'Earth','โลหะ':'Metal','น้ำ':'Water'}
  const SHENG: Record<string,string> = {Wood:'Fire',Fire:'Earth',Earth:'Metal',Metal:'Water',Water:'Wood'}
  const dmEl = bazi.dayMasterElement

  if (topic === 'element') {
    all.push(
      { system:'BaZi', score:bazi.score, finding:`Day Master ${bazi.dayMasterTh} ธาตุ${dmEl}`, category:'element', value:dmEl },
      { system:'Nine Star Ki', score:ninestar.score, finding:`Star ${ninestar.star} ธาตุ${ninestar.starElement}`, category:'element', value:ninestar.starElement },
      { system:'Western', score:western.score, finding:`Sun ${western.sunSignTh}`, category:'element', value:western.sunSignTh },
      { system:'Vedic', score:vedic.score, finding:`Nakshatra ${vedic.moonNakshatra}`, category:'element', value:vedic.moonNakshatra.split(' ')[0] },
      { system:'Celtic', score:celtic.score, finding:`${celtic.treeNameTh} ธาตุ${celtic.element}`, category:'element', value:celtic.element },
      { system:'Tibetan', score:tibetan.score, finding:`Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, category:'element', value:tibetan.mewaElement },
      { system:'Zoroastrian', score:zoroastrian.score, finding:`${zoroastrian.dayYazataTh}`, category:'element', value:zoroastrian.dayYazataTh },
    )
  }

  if (topic === 'health') {
    const healthEl = bazi.missingElement.split(' ')[0] || 'ดิน'
    all.push(
      { system:'BaZi', score:bazi.score, finding:`ธาตุขาด ${bazi.missingElement} ควรเสริมผ่านสีและอาหาร`, category:'health', value:healthEl },
      { system:'Nine Star Ki', score:ninestar.score, finding:`ทิศนอน ${ninestar.directionSleep} เสริมสุขภาพ`, category:'health', value:ninestar.directionSleep },
      { system:'Vedic', score:vedic.score, finding:`${vedic.mahadasha} Dasha: ${vedicMahadasha.dashaQuality}`, category:'health', value:vedicMahadasha.dashaElement },
      { system:'Biorhythm', score:biorhythm.score, finding:`Physical ${biorhythm.physical}% (${biorhythm.physicalPhase})`, category:'health', value:biorhythm.physicalPhase },
      { system:'Celtic', score:celtic.score, finding:`ต้น${celtic.treeNameTh} — gem ${celtic.gemstone}`, category:'health', value:celtic.gemstone },
      { system:'Energy Type', score:humandesign.score, finding:`Strategy "${humandesign.strategy}" ลดการต้านพลังงาน`, category:'health', value:humandesign.strategy },
      { system:'Native American', score:nativeAmerican.score, finding:`${nativeAmerican.birthTotemTh} ธาตุ${nativeAmerican.element}`, category:'health', value:nativeAmerican.element },
      { system:'Tibetan', score:tibetan.score, finding:`Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, category:'health', value:tibetan.mewaElement },
      { system:'ไทยพราหมณ์', score:thai.score, finding:`สีมงคล${thai.dayColor} วัน${thai.dayName}`, category:'health', value:thai.dayColor },
      { system:'Zoroastrian', score:zoroastrian.score, finding:`${zoroastrian.dayYazataTh} ปกครองสุขภาพ`, category:'health', value:zoroastrian.harmony?'สมดุล':'ต้องสร้างสมดุล' },
    )
  }

  if (topic === 'finance') {
    all.push(
      { system:'BaZi', score:bazi.score, finding:`ธาตุมงคล ${bazi.luckyElement}`, category:'finance', value:bazi.luckyElement },
      { system:'Nine Star Ki', score:ninestar.score, finding:`ทิศ ${ninestar.starDirection} เสริมการเงิน`, category:'finance', value:ninestar.starDirection },
      { system:'Numerology', score:numerology.score, finding:`Personal Year ${numerology.personalYear2026}: ${numerology.personalYearMeaning.split('—')[0]}`, category:'finance', value:String(numerology.personalYear2026) },
      { system:'Vedic', score:vedic.score, finding:`${vedicMahadasha.currentDasha} Dasha`, category:'finance', value:vedicMahadasha.dashaElement },
      { system:'Arabic Parts', score:arabicParts.score, finding:`Part of Fortune ใน ${arabicParts.fortuneSign}`, category:'finance', value:arabicParts.fortuneSign },
      { system:'Hellenistic', score:hellenistic.score, finding:`${hellenistic.sectTh} กับ ${hellenistic.trigonLord}`, category:'finance', value:hellenistic.trigonLord.split(' ')[0] },
      { system:'Kabbalistic', score:kabbalistic.score, finding:`${kabbalistic.sephira} (${kabbalistic.archangel})`, category:'finance', value:kabbalistic.sephira },
      { system:'Ifa/Yoruba', score:ifaYoruba.score, finding:`Odù ${ifaYoruba.odu}: ${ifaYoruba.fortune}`, category:'finance', value:ifaYoruba.fortune },
      { system:'Zoroastrian', score:zoroastrian.score, finding:`${zoroastrian.dayYazataTh}`, category:'finance', value:zoroastrian.harmony?'สอดคล้อง':'ระวัง' },
      { system:'Biorhythm', score:biorhythm.score, finding:`สติปัญญา ${biorhythm.intellectual}% (${biorhythm.intellectualPhase})`, category:'finance', value:biorhythm.intellectualPhase },
    )
  }

  if (topic === 'timing') {
    all.push(
      { system:'BaZi', score:bazi.score, finding:`LP ${bazi.currentLuckPillar} ${bazi.currentLuckPillarTh}`, category:'timing', value:bazi.currentLuckPillar },
      { system:'Nine Star Ki', score:ninestar.score, finding:ninestar.year2026Analysis.substring(0,60), category:'timing', value:ninestar.star===9?'peak':'normal' },
      { system:'Vedic', score:vedic.score, finding:`${vedicMahadasha.currentDasha} Dasha ถึง ${vedicMahadasha.currentDashaEnd}`, category:'timing', value:String(vedicMahadasha.currentDashaEnd) },
      { system:'Numerology', score:numerology.score, finding:`PY ${numerology.personalYear2026}: ${numerology.personalYearMeaning.substring(0,40)}`, category:'timing', value:String(numerology.personalYear2026) },
      { system:'Biorhythm', score:biorhythm.score, finding:`E:${biorhythm.emotional}% I:${biorhythm.intellectual}% P:${biorhythm.physical}%`, category:'timing', value:biorhythm.intellectualPhase },
      { system:'Tibetan', score:tibetan.score, finding:`Mewa ${tibetan.mewa} ${tibetan.mewaQuality}`, category:'timing', value:tibetan.mewaQuality },
      { system:'Onmyōdō', score:onmyodo.score, finding:`${onmyodo.rokuyo} ${onmyodo.rokuyoTh}`, category:'timing', value:onmyodo.rokuyo },
      { system:'Aztec', score:aztec.score, finding:`${aztec.daySignTh} Tone ${aztec.toneNumber}`, category:'timing', value:aztec.daySignQuality },
    )
  }

  return all
}

/** Render a consensus row: icon + count + systems + message */
function consensusRow(icon: string, theme: string, systems: string[], msg: string, count: number, color = '#d4aa50', narrative = ''): string {
  const strength = count >= 10 ? '██████' : count >= 7 ? '████' : count >= 4 ? '██' : '█'
  // Show ALL systems as chips — no truncation
  const chips = systems.map(s => `<span style="display:inline-block;background:${color}18;color:${color};border:1px solid ${color}44;border-radius:4px;padding:1px 7px;font-size:10px;margin:2px">${esc(s.split('(')[0].trim())}</span>`).join('')
  return `<div style="border-left:3px solid ${color};padding:10px 14px;margin:10px 0;background:#141210;border-radius:0 8px 8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:14px;font-weight:700;color:${color}">${icon} ${esc(theme)}</span>
      <span style="font-size:11px;color:${color};background:${color}22;padding:2px 10px;border-radius:10px;font-weight:600">${count} ศาสตร์ ${strength}</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8">${chips}</div>
    ${narrative ? `<div style="font-size:12px;color:#d4c89a;line-height:1.7;margin-bottom:6px;padding:8px;background:#1a1608;border-radius:6px">${esc(narrative)}</div>` : ''}
    <div style="font-size:11px;color:#7a6a52">${esc(msg)}</div>
  </div>`
}

// ============================================================
// ── 16 NEW SYSTEM PAGES (individual, consistent format) ─────
// ============================================================

function p_saju(c: ChartData): string {
  const s = c.saju
  return section(0, tr('Saju — สี่เสาเกาหลี (사주)','Saju (사주) — Korean Four-Pillar Astrology'), '🇰🇷', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(s.dayPillar)}</div><div class="lbl">일주 Day Pillar</div></div>
      <div class="stat-card"><div class="val">${s.score}</div><div class="lbl">Saju Score</div></div>
    </div>
    ${bar(s.score,'#4a8a40')}
    <table style="margin:12px 0"><tbody>
      ${row2('연주 Year', s.yearPillar)} ${row2('월주 Month', s.monthPillar)}
      ${row2('일주 Day', s.dayPillar)} ${row2('시주 Hour', s.hourPillar)}
      ${row2('일간 Day Master Element', s.sajuElement)}
      ${row2('꽃살 Fortune Cycle 2026', s.kwarsal)}
      ${row2('พลังงานหลัก', s.dominantEnergy)}
    </tbody></table>
    ${box('การตีความ Saju', s.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Saju (사주) คือโหราศาสตร์เกาหลีที่ใช้ 4 เสา (ปี เดือน วัน ชั่วโมง) เหมือน BaZi แต่มีการตีความตามประเพณีเกาหลีที่เน้น 월주 (เดือนเกิด) เป็นหลัก มีอายุกว่า 1,000 ปี ยังใช้แพร่หลายในเกาหลีใต้ปัจจุบัน — มีแอปดูดวงหลายร้อยล้าน downloads ต่อปี</p>
    <p style="font-size:11px;color:#6a5a42">Saju ใช้ระบบเสาสี่เดียวกับ BaZi แต่เน้นการตีความตามประเพณีเกาหลี — ความสัมพันธ์ระหว่างเดือนและวันสำคัญที่สุด</p>
  `)
}

function p_tibetan(c: ChartData): string {
  const t = c.tibetan
  return section(0, tr('Tibetan Astrology — โหราศาสตร์ทิเบต','Tibetan Astrology — Mewa & Parkha'), '☸️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val">${t.mewa}</div><div class="lbl">Mewa (ดาวเก้าช่อง)</div></div>
      <div class="stat-card"><div class="val">${t.score}</div><div class="lbl">Tibetan Score</div></div>
    </div>
    ${bar(t.score,'#8a5a4a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Mewa', t.mewaName)} ${row2('ธาตุ Mewa', t.mewaElement)}
      ${row2('คุณภาพ Mewa', t.mewaQuality)}
      ${row2('Parkha (ตรีศูล)', t.parkhaName)} ${row2('ธาตุ Parkha', t.parkhaElement)}
    </tbody></table>
    ${box('การตีความทิเบต', t.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> โหราศาสตร์ทิเบตผสมระบบ Mewa จากจีน + Parkha จาก Ba Gua + ประเพณีดั้งเดิม Bon + Vedic Jyotish เข้าด้วยกัน พัฒนาในทิเบตกว่า 1,500 ปี ยังใช้อย่างเป็นทางการในวัดทิเบตและโดย Dalai Lama สถาบัน — เน้น Mewa 9 ดวงเป็นแกนหลัก</p>
    <p style="font-size:11px;color:#6a5a42">Mewa สอดคล้องกับ Nine Star Ki แต่นับทวนเข็ม — Mewa ${t.mewa} หมายถึง${t.mewaQuality}ในชีวิต</p>
  `)
}

function p_ziwei(c: ChartData): string {
  const z = c.ziwei
  return section(0, tr('Zi Wei Dou Shu — 紫微斗數','Zi Wei Dou Shu (紫微斗數) — Purple Star Astrology'), '🌌', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(z.mainStarTh)}</div><div style="font-size:12px;color:#6a5a42">${esc(z.mainStar)}</div><div class="lbl">ดาวหลัก Main Star</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zi Wei Score</div></div>
    </div>
    ${bar(z.score,'#5a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2('ดาวหลัก (Thai)', z.mainStarTh)}
      ${row2('วังชีวิต Life Palace', z.lifePalaceName)}
      ${row2('คุณภาพวัง Palace Quality', z.palaceQuality)}
    </tbody></table>
    ${box('การตีความ 紫微', z.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> 紫微斗數 (Zi Wei Dou Shu) พัฒนาโดย Chen Tuan นักปราชญ์จีนในสมัย Song Dynasty (~1000 AD) ใช้ดาว 108 ดวงใน 12 palace — ซับซ้อนและแม่นยำกว่า BaZi ในการทำนายเส้นทางอาชีพ นิยมมากในไต้หวัน ฮ่องกง สิงคโปร์ สำหรับการตัดสินใจธุรกิจ</p>
    <p style="font-size:11px;color:#6a5a42">紫微斗數 คือโหราศาสตร์จีนขั้นสูง — วังชีวิต (命宮) เป็นตำแหน่งสำคัญที่สุด ดาว${z.mainStarTh}ชี้นำเส้นทางชีวิต</p>
  `)
}

function p_onmyodo(c: ChartData): string {
  const o = c.onmyodo
  return section(0, tr('Onmyōdō — 陰陽道 ศาสตร์ญี่ปุ่น','Onmyōdō (陰陽道) — Japan\'s Way of Yin & Yang'), '⛩️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:22px">${esc(o.rokuyo)}</div><div class="lbl">六曜 Rokuyo วันเกิด</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Onmyōdō Score</div></div>
    </div>
    ${bar(o.score,'#6a4a2a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Rokuyo (Thai)', o.rokuyoTh)}
      ${row2('พลังงานคะแนน', String(o.rokuyoScore))}
      ${row2('Onmyo Polarity', o.onmyoPolarity)}
      ${row2('Jūnishi Nakshatra', o.juniShiNakshatra)}
    </tbody></table>
    ${box('การตีความ Onmyōdō', o.reading, o.rokuyoScore >= 780 ? 'green' : o.rokuyoScore >= 650 ? 'gold' : 'red')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Onmyōdō (陰陽道) พัฒนาในญี่ปุ่นสมัย Nara (710-794 AD) โดย Abe no Seimei หมอดูในตำนาน รับอิทธิพลจาก Taoist เต๋าและ Chinese Cosmology ผสมกับความเชื่อ Shinto ใช้โดยราชสำนักญี่ปุ่นเป็นเวลาหลายร้อยปี ปัจจุบันยังมีสถาบัน Onmyōdō อย่างเป็นทางการ</p>

    <div style="background:#13110e;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:8px">
      <div style="font-size:11px;color:#d4aa50;letter-spacing:1px;margin-bottom:6px">六曜 ROKUYO — ปฏิทินมงคล 6 วันของญี่ปุ่น</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.7">
        Rokuyo (六曜) เป็นวัฏจักรโชค <strong>6 วันที่หมุนเวียนกัน</strong>ในปฏิทินญี่ปุ่น
        ใช้เลือก "วันดี" สำหรับงานแต่ง การประกอบธุรกิจ การเดินทาง — ปัจจุบันยังพิมพ์อยู่บนปฏิทินญี่ปุ่นทุกเล่ม
        แต่ละวันให้พลังงานต่างกัน:
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;font-size:10.5px">
        <div style="background:#0a1a0e;border-left:3px solid #5aaa3a;padding:5px 8px"><strong>大安 Taian</strong> · วันมงคลที่สุด · ทำได้ทุกอย่าง</div>
        <div style="background:#0a1612;border-left:3px solid #4a8a4a;padding:5px 8px"><strong>友引 Tomobiki</strong> · ดี (ยกเว้นงานศพ)</div>
        <div style="background:#1a1510;border-left:3px solid #c8a840;padding:5px 8px"><strong>先勝 Senshō</strong> · เช้าดี บ่ายร้าย</div>
        <div style="background:#1a1510;border-left:3px solid #c8a840;padding:5px 8px"><strong>先負 Senpu</strong> · เช้าร้าย บ่ายดี</div>
        <div style="background:#1a1010;border-left:3px solid #aa6030;padding:5px 8px"><strong>赤口 Shakkō</strong> · ระวัง · ดีเฉพาะกลางวัน</div>
        <div style="background:#1a0a0a;border-left:3px solid #c01020;padding:5px 8px"><strong>仏滅 Butsumetsu</strong> · "พระพุทธเจ้าสิ้น" · วันอัปมงคลที่สุด</div>
      </div>
      <div style="font-size:11px;color:#9a8a72;margin-top:8px;line-height:1.6">
        วันเกิดของคุณตรงกับ <strong style="color:#d4aa50">${esc(o.rokuyo)} (${esc(o.rokuyoTh)})</strong>
        — ${o.rokuyo === '仏滅' ? 'นี่คือสาเหตุที่คะแนน Onmyōdō ในรายงานต่ำ ไม่ใช่คะแนนคุณภาพชีวิตหรือบุคลิก แต่คือ "พลังงานปฏิทินวันเกิด" เท่านั้น · ในประเพณีญี่ปุ่นวันนี้แปลตรงตัวว่า "พระพุทธเจ้าสิ้น" ถือว่าหลีกเลี่ยงงานสำคัญ — แต่หลายธุรกิจญี่ปุ่นใช้เป็นวันสะท้อนตัวและรีเซ็ต' : o.rokuyo === '大安' ? 'นี่คือวันที่ดีที่สุดในปฏิทิน Rokuyo — คะแนนของคุณสูงเพราะวันเกิดให้พลังงานเปิดทาง' : 'แปลความได้ตามตารางด้านบน · คะแนนสะท้อนพลังงานของวันเกิดเฉพาะในศาสตร์นี้ ไม่ใช่ตัวคุณ'}
      </div>
    </div>
    <p style="font-size:11px;color:#6a5a42">六曜 เป็นเพียง <em>1 ใน 26 ศาสตร์</em>ของรายงาน — ใช้ประกอบมุมมองเรื่องจังหวะ ไม่ใช่คำตัดสินคุณภาพชีวิต</p>
  `)
}

function p_hellenistic(c: ChartData): string {
  const h = c.hellenistic
  return section(0, tr('Hellenistic Astrology — โหราศาสตร์กรีก','Hellenistic Astrology — Greek Tradition'), '🏛️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(h.sect)}</div><div class="lbl">Sect (กลุ่มดาว)</div></div>
      <div class="stat-card"><div class="val">${h.score}</div><div class="lbl">Hellenistic Score</div></div>
    </div>
    ${bar(h.score,'#8a7a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sect', h.sectTh)}
      ${row2('Trigon Lord', h.trigonLord)}
      ${row2('Lot of Fortune', `${h.lotOfFortune}° ใน ${h.lotSign}`)}
      
    </tbody></table>
    ${box('การตีความ Hellenistic', h.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Hellenistic Astrology พัฒนาโดยชาว Greek ใน Alexandria อียิปต์ (~300-100 ปีก่อน ค.ศ.) รวมระบบ Babylonian Horoscope + Greek Philosophy + Egyptian Lots เข้าด้วยกัน Ptolemy's Tetrabiblos เป็นรากฐานของ Western Astrology ทั้งหมด ปัจจุบัน Renaissance กลับมาแรงมากในวงการ Traditional Astrology</p>
    <p style="font-size:11px;color:#6a5a42">Hellenistic ใช้ Lots (Arabic Parts) + Sect เพื่อดูโชค — Lot of Fortune ใน${h.lotSign}ชี้ทิศทางทรัพย์สิน</p>
  `)
}

function p_norseRune(c: ChartData): string {
  const n = c.norseRune
  return section(0, tr('Norse Rune — รูนนอร์ส','Norse Runes — Elder Futhark'), '🔱', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(n.rune)}</div><div class="lbl">${esc(n.runeName)}</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Norse Score</div></div>
    </div>
    ${bar(n.score,'#5a3a5a')}
    <table style="margin:12px 0"><tbody>
      ${row2('รูน (Thai)', n.runeNameTh)}
      ${row2('ธาตุ', n.runeElement)}
      ${row2('คำสำคัญ', n.runeKeyword)}
    </tbody></table>
    ${box('การตีความรูน', n.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Elder Futhark 24 Runes ใช้โดยชาว Germanic/Viking ราว 160 ปีก่อน ค.ศ. ถึง 1100 AD — ใช้ทั้งเป็นตัวอักษรและเป็นเครื่องมือ divination Rune casting เป็นหนึ่งใน oldest divination systems ในยุโรปเหนือ ปัจจุบัน Neo-Pagan / Heathen communities ยังใช้อย่างจริงจัง</p>
    <p style="font-size:11px;color:#6a5a42">Elder Futhark มี 24 รูน แต่ละรูนครอบคลุม ~15 วัน ในปีแบบ runic calendar — ${n.rune} ${n.runeName} บ่งถึง${n.runeKeyword}</p>
  `)
}

function p_ogham(c: ChartData): string {
  const o = c.ogham
  return section(0, tr('Ogham — ตัวอักษรศักดิ์สิทธิ์ไอริช','Ogham — Ancient Irish Sacred Alphabet'), '🌿', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(o.ogham)}</div><div class="lbl">${esc(o.treeName)}</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Ogham Score</div></div>
    </div>
    ${bar(o.score,'#3a6a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('ต้นไม้ (Thai)', o.treeNameTh)}
      ${row2('กลุ่ม Ogham', o.oghamClass)}
      ${row2('ธาตุ', o.element)}
    </tbody></table>
    ${box('การตีความ Ogham', o.reading, 'green')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Ogham alphabet มีอายุราว 300-500 AD ค้นพบบนหินในไอร์แลนด์และเวลส์กว่า 400 แผ่น Celtic Druids ใช้เป็นทั้งตัวหนังสือและระบบ tree calendar ความลึกของ Ogham อยู่ที่ Beth-Luis-Nion calendar ที่แต่ละต้นไม้มีความหมายทางจิตวิญญาณ — Robert Graves นำมา popularize อีกครั้งในศตวรรษ 20</p>
    <p style="font-size:11px;color:#6a5a42">Beth-Luis-Nion calendar มี 13 เดือนต้นไม้ — ${o.ogham} ${o.treeNameTh} (${o.oghamClass}) บ่งถึงพลังงานหลักจากธรรมชาติ</p>
  `)
}

function p_arabicParts(c: ChartData): string {
  const a = c.arabicParts
  return section(0, tr('Arabic Parts — ล็อตโชคชะตา','Arabic Parts (Lots) — Hellenistic Fortune Points'), '⭐', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.fortuneSign)}</div><div class="lbl">Part of Fortune</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Arabic Score</div></div>
    </div>
    ${bar(a.score,'#8a5a20')}
    <table style="margin:12px 0"><tbody>
      ${row2('Lot of Fortune', `${a.partOfFortune}° ใน ${a.fortuneSign}`)}
      ${row2('Lot of Spirit', `${a.partOfSpirit}° ใน ${a.spiritSign}`)}
    </tbody></table>
    ${box('การตีความ Arabic Parts', a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Arabic Parts หรือ Lots of Fortune มีต้นกำเนิดใน Hellenistic Astrology แต่ Arab astrologers ใน Baghdad (~800-1200 AD) เป็นผู้รวบรวมและขยายให้ครบ 97 Lots Albumasar และ al-Qabisi เป็นผู้มีอิทธิพลสูงสุด Arabic Parts ถ่ายทอดมายังยุโรปผ่าน Crusades และ Spanish translation</p>
    <p style="font-size:11px;color:#6a5a42">Arabic Lots (Hellenistic Lots) คำนวณจาก ASC + Moon + Sun — Part of Fortune ใน${a.fortuneSign}ชี้ทิศทางโชคลาภทางวัตถุ</p>
  `)
}

function p_kabbalistic(c: ChartData): string {
  const k = c.kabbalistic
  return section(0, tr('Kabbalistic — ต้นไม้แห่งชีวิต','Kabbalistic — Tree of Life'), '✡️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(k.sephira)}</div><div class="lbl">Sephira</div></div>
      <div class="stat-card"><div class="val">${k.score}</div><div class="lbl">Kabbalah Score</div></div>
    </div>
    ${bar(k.score,'#6a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sephira Hebrew', k.sephiraHebrew)}
      ${row2('Archangel', k.archangel)}
      ${row2('Hebrew Year', String(k.hebrewYear))}
      ${row2('Mazal (Zodiac)', k.mazalTh)}
    </tbody></table>
    ${box('การตีความ Kabbalah', k.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Kabbalah (קַבָּלָה) มีต้นกำเนิดในยิวโบราณ พัฒนาเต็มรูปแบบใน 12-13 ศตวรรษในสเปนและ Provence Sefer ha-Bahir (1180 AD) และ Sefer ha-Zohar (1290 AD) คือคัมภีร์หลัก Tree of Life มี 10 Sephirot และ 22 paths ตาม Hebrew alphabet ปัจจุบัน Madonna และ Hollywood stars ทำให้ Kabbalah เป็นที่รู้จักทั่วโลก</p>
    <p style="font-size:11px;color:#6a5a42">Tree of Life มี 10 Sephirot — ${k.sephira} (${k.sephiraHebrew}) ปกครองโดย ${k.archangel} บ่งถึงแง่มุมจิตวิญญาณหลัก</p>
  `)
}

function p_zoroastrian(c: ChartData): string {
  const z = c.zoroastrian
  return section(0, tr('Zoroastrian — ปรัชญาเปอร์เซีย','Zoroastrian — Persian Philosophy'), '🔥', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:14px">${esc(z.dayYazataTh.slice(0,15))}</div><div class="lbl">Day Yazata</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zoroastrian Score</div></div>
    </div>
    ${bar(z.score,'#8a4a20')}
    <table style="margin:12px 0"><tbody>
      ${row2('Yazata วันเกิด', z.dayYazataTh)}
      ${row2('Amesha เดือนเกิด', z.monthAmeshaTh)}
      ${row2('ความสอดคล้อง', z.harmony ? '✓ ธาตุสอดคล้อง — เสริมพลัง' : '○ ธาตุต่างกัน — สร้างสมดุล')}
    </tbody></table>
    ${box('การตีความ Zoroastrian', z.reading, z.harmony ? 'green' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Zoroastrianism เป็นหนึ่งในศาสนาที่เก่าแก่ที่สุดในโลก ก่อตั้งโดย Zarathustra (~1500-1000 ปีก่อน ค.ศ.) ในเปอร์เซีย (อิหร่านปัจจุบัน) ระบบ Yazata 30 วัน และ Amesha Spenta 6 เดือน สะท้อนปรัชญา Asha (ความจริง/ความดี) vs Druj (ความเท็จ) — มีอิทธิพลต่อ Judaism, Christianity และ Islam</p>
    <p style="font-size:11px;color:#6a5a42">Yazata คือสิ่งศักดิ์สิทธิ์ใน Zoroastrianism — แต่ละวันและเดือนมี Yazata/Amesha ปกครอง</p>
  `)
}

function p_aztec(c: ChartData): string {
  const a = c.aztec
  return section(0, tr('Aztec Tonalpohualli — ปฏิทิน 260 วัน','Aztec Tonalpohualli — 260-Day Sacred Calendar'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.daySignTh)}</div><div class="lbl">Day Sign</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aztec Score</div></div>
    </div>
    ${bar(a.score,'#8a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign (EN)', a.daySign + ' ' + a.daySignTh)}
      ${row2('Tone Number', `${a.toneNumber} — ${a.toneName}`)}
      ${row2('Day Sign Quality', a.daySignQuality)}
    </tbody></table>
    ${box('การตีความ Tonalpohualli', a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Tonalpohualli (260 วัน) เป็นปฏิทินศักดิ์สิทธิ์ของ Aztec เหมือน Mayan Tzolk'in แต่มีชื่อ Day Signs ต่างออกไป ใช้โดย tonalpouhqui (นักโหราศาสตร์) เพื่อกำหนดชะตาชีวิตตั้งแต่แรกเกิด Aztec เชื่อว่า Day Sign ณ วันเกิดกำหนด "patron deity" ของบุคคลนั้น — นิยมในเม็กซิโกและนักวิจัย Mesoamerican culture</p>
    <p style="font-size:11px;color:#6a5a42">Tonalpohualli คือปฏิทิน 260 วัน (20 Day Signs × 13 Tones) ใช้ร่วมกับ Mayan Tzolk'in — ${a.daySignTh} Tone ${a.toneNumber} กำหนดพลังงาน</p>
  `)
}

function p_nativeAmerican(c: ChartData): string {
  const n = c.nativeAmerican
  return section(0, tr('Native American — Birth Totem','Native American — Birth Totem & Clan'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(n.birthTotemTh)}</div><div class="lbl">Birth Totem</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Native American Score</div></div>
    </div>
    ${bar(n.score,'#8a5a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Birth Totem (EN)', n.birthTotem)}
      ${row2('Moon Cycle', n.moonCycle)}
      ${row2('Clan', n.clansmother)}
      ${row2('ธาตุ', n.element)}
    </tbody></table>
    ${box('การตีความ Native American', n.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Medicine Wheel เป็นระบบจักรวาลวิทยาของชนพื้นเมืองอเมริกาเหนือหลายเผ่า (Lakota, Ojibwe, Cherokee ฯลฯ) 13 Moon Calendar ใช้ lunar cycle 13 รอบต่อปี แต่ละ moon มี totem animal ประจำ ระบบนี้ถ่ายทอดผ่าน oral tradition กว่า 10,000 ปี Sun Bear popularize ผ่านหนังสือในทศวรรษ 1980</p>
    <p style="font-size:11px;color:#6a5a42">Medicine Wheel มี 13 moon cycle — Birth Totem ${n.birthTotemTh} (${n.birthTotem}) ใน ${n.clansmother} บ่งถึงสัตว์นำทางทางจิตวิญญาณ</p>
  `)
}

function p_ifaYoruba(c: ChartData): string {
  const i = c.ifaYoruba
  return section(0, tr('Ifa / Yoruba — Odù แห่งชะตา','Ifá / Yoruba — Odù of Destiny'), '🥁', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:18px">${esc(i.odu)}</div><div class="lbl">Odù ${i.oduNumber}</div></div>
      <div class="stat-card"><div class="val">${i.score}</div><div class="lbl">Ifa Score</div></div>
    </div>
    ${bar(i.score,'#6a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Odù (Thai)', i.oduTh)}
      ${row2('Theme', i.oduTheme)}
      ${row2('Fortune', i.fortune)}
    </tbody></table>
    ${box('การตีความ Ifa', i.reading, i.fortune.includes('เยี่ยม') ? 'green' : i.fortune.includes('ท้าทาย') ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Ifa divination เป็นระบบโหราศาสตร์ของชาว Yoruba ไนจีเรีย มีอายุกว่า 8,000 ปีตามตำนาน มี 256 Odù (corpus ความรู้) แต่ละ Odù มี poems, proverbs และ remedies UNESCO ประกาศให้ Ifa เป็น Intangible Cultural Heritage of Humanity ในปี 2005 Babalawo (นักพยากรณ์) ใช้เวลาเรียน 7-10 ปี</p>
    <p style="font-size:11px;color:#6a5a42">Ifa มี 256 Odù (16×16) — ${i.odu} คือ Odù ที่ ${i.oduNumber} หนึ่งในระบบโชคชะตาของชาว Yoruba ไนจีเรีย/เบนิน</p>
  `)
}

function p_aboriginal(c: ChartData): string {
  const a = c.aboriginal
  return section(0, tr('Aboriginal Dreamtime — บรรพบุรุษแห่งฝัน','Aboriginal Dreamtime — Ancestors of the Dreaming'), '🌈', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.dreamingTh)}</div><div class="lbl">Dreaming Ancestor</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aboriginal Score</div></div>
    </div>
    ${bar(a.score,'#6a4a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Ancestor (EN)', a.dreamingAncestor)}
      ${row2('Season', a.season)}
      ${row2('Clan', a.clan)}
    </tbody></table>
    ${box('การตีความ Dreamtime', a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Dreamtime (Tjukurpa ในภาษา Anangu) เป็นปรัชญาและโลกทัศน์ของชาวอะบอริจินออสเตรเลีย อายุกว่า 65,000 ปี — เก่าแก่ที่สุดในโลก บรรพบุรุษ Dreaming สร้างภูมิทัศน์และกำหนดกฎทางสังคม ไม่ใช่แค่ "ตำนาน" แต่คือ living law ที่ยังใช้อยู่ในชุมชนอะบอริจินปัจจุบัน</p>
    <p style="font-size:11px;color:#6a5a42">Dreamtime เป็นปรัชญาชาวอะบอริจินออสเตรเลีย — บรรพบุรุษ ${a.dreamingTh} ชี้แนะเส้นทางผ่านกฎธรรมชาติ</p>
  `)
}

function p_biorhythm(c: ChartData): string {
  const b = c.biorhythm
  const phaseColor = (v: number) => v > 40 ? '#4a9a40' : v > 0 ? '#8a8a30' : v > -40 ? '#8a5a20' : '#9a3020'
  return section(0, tr('Biorhythm — วัฏจักรชีวิต','Biorhythm — Life Cycles'), '📈', `
    <div class="grid-3" style="margin-bottom:12px;text-align:center">
      ${[['ร่างกาย',b.physical,b.physicalPhase,'Physical (23d)'],['อารมณ์',b.emotional,b.emotionalPhase,'Emotional (28d)'],['สติปัญญา',b.intellectual,b.intellectualPhase,'Intellectual (33d)']].map(([l,v,p,en]) => `
        <div class="stat-card">
          <div class="val" style="color:${phaseColor(+v)}">${+v > 0 ? '+' : ''}${v}%</div>
          <div class="lbl">${esc(String(l))}</div>
          <div style="font-size:10px;color:#6a5a42;margin-top:2px">${esc(String(p))}</div>
        </div>`).join('')}
    </div>
    <div style="background:#0a1008;border-radius:8px;padding:12px;margin:8px 0">
      <div style="font-size:12px;color:#5a8a40;margin-bottom:6px">วัฏจักร ณ 14 เม.ย. 2026</div>
      ${[['Physical 23d', b.physical, '#4a9a40'],['Emotional 28d', b.emotional, '#5a6a90'],['Intellectual 33d', b.intellectual, '#9a7a30']].map(([l,v,col]) =>
        `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="color:#9a8a72">${esc(String(l))}</span><span style="color:${col};font-weight:600">${+v > 0 ?'+':''}${v}%</span></div>
        <div style="background:#1a2010;border-radius:3px;height:6px"><div style="width:${Math.round((+v+100)/2)}%;height:6px;background:${col};border-radius:3px"></div></div></div>`
      ).join('')}
    </div>
    <div class="stat-card" style="margin-top:8px">
      <div class="val">${b.score}</div><div class="lbl">Biorhythm Score</div>
    </div>
    ${bar(b.score,'#5a7a30')}
    ${b.reading}
  `)
}

function p_vedicMahadasha(c: ChartData): string {
  const v = c.vedicMahadasha
  const DASHA_COLORS: Record<string,string> = {
    Jupiter:'#5a8a30', Venus:'#8a5a80', Sun:'#8a6020', Moon:'#5a7a9a',
    Mercury:'#3a7a60', Mars:'#9a3020', Saturn:'#4a4a5a', Rahu:'#5a3060', Ketu:'#6a5a30'
  }
  const col = DASHA_COLORS[v.currentDasha] ?? '#6a5a42'
  return section(0, tr('Vedic Mahadasha — ช่วงดาวปกครอง','Vedic Mahadasha — Planetary Period Cycles'), '🕉️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card" style="border-color:${col}">
        <div class="val" style="color:${col};font-size:20px">${esc(v.currentDasha)}</div>
        <div class="lbl">Mahadasha ปัจจุบัน</div>
      </div>
      <div class="stat-card"><div class="val">${v.score}</div><div class="lbl">Mahadasha Score</div></div>
    </div>
    ${bar(v.score, col)}
    <table style="margin:12px 0"><tbody>
      ${row2('Mahadasha', v.currentDasha)}
      ${row2('สิ้นสุด', String(v.currentDashaEnd))}
      ${row2('Antardasha', v.antardasha)}
      ${row2('คุณภาพ', v.dashaQuality)}
      ${row2('ธาตุ Dasha', v.dashaElement)}
    </tbody></table>
    ${box('การตีความ Mahadasha', v.reading, ['Jupiter','Venus','Sun'].includes(v.currentDasha) ? 'green' : ['Saturn','Rahu','Ketu'].includes(v.currentDasha) ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>ต้นกำเนิด:</strong> Vimshottari Dasha เป็นระบบ planetary periods ใน Vedic Jyotish รวม 120 ปี ประกอบด้วย 9 ดาว แต่ละดาวปกครอง 6-20 ปี คำนวณจาก Nakshatra ของดวงจันทร์ณ เวลาเกิด — ถือเป็นหนึ่งในเครื่องมือทำนาย timing ที่แม่นยำที่สุดใน Vedic system ยังใช้แพร่หลายในอินเดียสำหรับการตัดสินใจสำคัญ</p>
    <p style="font-size:11px;color:#6a5a42">Vedic Mahadasha กำหนด "ช่วงเวลา" ที่ดาวแต่ละดวงปกครองชีวิต — ${v.currentDasha} (${v.dashaQuality}) ครองจนถึงปี ${v.currentDashaEnd}</p>
  `)
}


