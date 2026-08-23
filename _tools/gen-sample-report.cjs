// Regenerate the public Cosmic Blueprint sample (Sunthorn Phu) in BOTH languages.
//
// WHY THIS EXISTS: the sample was generated once, in Thai, on 2026-07-01 and then
// left alone. Two things rotted.
//   1. English readers had no sample at all. generateReport() has always honoured
//      c.input.lang — the live app passes `lang: LANG` at all three call sites, so
//      a paying English user already gets an English report. Only this static file
//      was stuck in Thai, which made the free proof-of-value Thai-only.
//   2. The published score (340) is not what the engine returns any more (320).
//      A sample whose numbers a reader cannot reproduce is worse than no sample —
//      the whole pitch is "deterministic, run it yourself and check".
// Regenerating both from the current engine fixes both at once.
//
//   node _tools/gen-sample-report.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { calculate } = require(path.join(ROOT, 'Mythsensus', 'build', 'calc.js'));
const { generateReport } = require(path.join(ROOT, 'Mythsensus', 'build', 'report.js'));

// Sunthorn Phu · 26 June 1786 · Bangkok. Birth time is not recorded for 1786, so
// noon is the documented default — the report carries its own precision caveat.
const BIRTH = { name: 'Sunthorn Phu', gender: 'ชาย', year: 1786, month: 6, day: 26,
                hour: 12, minute: 0, lat: 13.7525, lon: 100.4936, timezone: 7 };

const TOGGLE = (here, there, thereLabel) => `
<div style="position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:4px;
            background:rgba(10,10,14,.92);border:1px solid #6b5a2e;border-radius:8px;padding:3px;
            font-family:'Josefin Sans',sans-serif;font-size:11px;letter-spacing:1.4px">
  <span style="padding:5px 11px;border-radius:6px;background:rgba(200,168,74,.18);color:#c8a84a">${here}</span>
  <a href="${there}" style="padding:5px 11px;border-radius:6px;color:#c8a84a;text-decoration:none">${thereLabel}</a>
</div>`;

function write(lang, outDir, toggle) {
  const chart = calculate(Object.assign({}, BIRTH, { lang }));
  let html = generateReport(chart);
  html = html.replace(/<\/body>/i, toggle + '\n</body>');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  const txt = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  const thai = (txt.match(/[฀-๿]/g) || []).length;
  const len = txt.replace(/\s+/g, ' ').length;
  console.log(lang, '->', path.relative(ROOT, outDir), '|', html.length, 'bytes | thai',
              thai, '/', len, '=', Math.round(100 * thai / len) + '%',
              '| score', chart.score && (chart.score.total ?? chart.score.value));
  return chart;
}

const th = write('th', path.join(ROOT, 'sample-report', 'sunthorn-phu'),
                 TOGGLE('TH', '/sample-report/sunthorn-phu/en', 'EN'));
write('en', path.join(ROOT, 'sample-report', 'sunthorn-phu', 'en'),
      TOGGLE('EN', '/sample-report/sunthorn-phu', 'TH'));

console.log('\nCosmic Score now published:', th.score && (th.score.total ?? th.score.value),
            '— update any copy that still quotes an older number.');
