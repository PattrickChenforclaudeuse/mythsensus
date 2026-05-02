/**
 * Inject build/ms26-bundle.js into Offline app/mythsensus-offline.html
 * at the start of the <script> block, plus rewire cb_generate() to
 * call MS26.calculate() + MS26.generateReport().
 *
 * Strategy:
 *   1. Read bundle, wrap in a marker-bracketed block so it can be
 *      re-injected idempotently.
 *   2. If a previous injection exists, remove it before re-injecting
 *      (so this script is safe to run repeatedly).
 *   3. Replace the body of cb_generate() with a call to MS26.
 *
 * Run: node tests/inject-bundle.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'Offline app', 'mythsensus-offline.html');
const BUNDLE = path.join(__dirname, '..', 'build', 'ms26-bundle.js');

const START = '/* MS26_BUNDLE_START — auto-injected, do not edit */';
const END   = '/* MS26_BUNDLE_END */';

let html = fs.readFileSync(HTML, 'utf8');
const bundle = fs.readFileSync(BUNDLE, 'utf8');

// ── 1. Remove any previous injection ─────────────────────────
const injectedBlock = new RegExp(
  `${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`,
  'g'
);
html = html.replace(injectedBlock, '');

// ── 2. Inject bundle right after the opening <script> ────────
const scriptOpen = html.indexOf('<script>\n');
if (scriptOpen < 0) throw new Error('Could not find <script> tag');
const afterOpen = scriptOpen + '<script>\n'.length;

const block = `${START}\n${bundle}\n${END}\n`;
html = html.slice(0, afterOpen) + block + html.slice(afterOpen);

// ── 3. Rewire cb_generate() to use MS26 ───────────────────────
const cbMatch = html.match(/function cb_generate\(\) \{[\s\S]*?^\}\n/m);
if (!cbMatch) throw new Error('Could not locate cb_generate()');

const newCbGenerate = `function cb_generate() {
  // Grab form values.
  const name    = document.getElementById('cb-f-name').value.trim() || 'ผู้ใช้';
  const gender  = document.getElementById('cb-f-gender').value;
  const dob     = document.getElementById('cb-f-dob').value;
  const cityVal = document.getElementById('cb-f-city').value;

  if (!dob) { alert(LANG === 'th' ? 'กรุณากรอกวันเกิดก่อน' : 'Please enter your date of birth first'); return; }
  const parts = dob.split('-');
  if (parts.length !== 3) { alert(LANG === 'th' ? 'รูปแบบวันเกิดไม่ถูกต้อง' : 'Invalid date format'); return; }

  const [y, m, d] = [+parts[0], +parts[1], +parts[2]];
  const h         = Math.min(23, Math.max(0, parseInt(document.getElementById('cb-f-time-h').value) || 12));
  const mi        = Math.min(59, Math.max(0, parseInt(document.getElementById('cb-f-time-m').value) || 0));
  const [lat, lon, tz] = cityVal.split(',').map(Number);

  // Read Life Path Resonance context saved by the Subscription → Resonance panel.
  const workCountry = localStorage.getItem('mth_country') || '';
  const domain      = localStorage.getItem('mth_career')  || '';
  const industry    = localStorage.getItem('mth_industry')|| '';

  document.getElementById('cb-form-section').style.display = 'none';
  document.getElementById('cb-loading').style.display = 'block';

  // Use the 26-system engine compiled from report-engine/lib/{calc,report}.ts
  setTimeout(() => {
    try {
      if (!window.MS26 || typeof window.MS26.calculate !== 'function') {
        throw new Error('MS26 engine not loaded');
      }
      const chart = window.MS26.calculate({
        name, gender,
        year: y, month: m, day: d,
        hour: h, minute: mi,
        lat, lon, timezone: tz,
        workCountry,   // from Subscription → Life Path Resonance
        domain,        // career role
        industry,      // industry sector
        lang: LANG,    // propagate UI lang into report.ts for bilingual output
      });
      cbCurrentHTML = window.MS26.generateReport(chart);
      window._lastChartData = chart;           // expose so cb_saveHTML can persist metadata
      showCompareScore(chart.score);

      document.getElementById('cb-loading').style.display = 'none';
      document.getElementById('cb-toolbar').style.display = 'flex';
      document.getElementById('cb-report-wrap').style.display = 'block';
      document.getElementById('cb-report-frame').srcdoc = cbCurrentHTML;
    } catch (err) {
      document.getElementById('cb-loading').style.display = 'none';
      document.getElementById('cb-form-section').style.display = 'block';
      alert((LANG === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
      console.error(err);
    }
  }, 200);
}
`;

html = html.replace(cbMatch[0], newCbGenerate);

fs.writeFileSync(HTML, html, 'utf8');
console.log(`✓ Injected bundle (${(bundle.length / 1024).toFixed(1)} KB) into offline HTML`);
console.log(`✓ Rewired cb_generate() to use MS26 engine`);
console.log(`  Final size: ${(html.length / 1024).toFixed(1)} KB`);
