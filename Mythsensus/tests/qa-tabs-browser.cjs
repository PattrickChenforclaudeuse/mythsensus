/**
 * UI-level QA — drive EVERY tab in a real browser for 10 weird profiles.
 *
 * For each profile it sets the birth data in localStorage (the same ground
 * truth cb_generate / _getMS26ChartFromProfile read), then walks every
 * group×sub-tab via setGroup()+showSubTab() — which invokes the real panel
 * RENDERERS — and records:
 *   • any console.error / pageerror thrown during that tab's render
 *   • any NaN / undefined / [object Object] leaking into the visible text
 *   • whether the panel rendered any content at all
 *
 * It then runs the FULL blueprint generate (cb_generate) for one profile and
 * inspects the 42-page report rendered inside the iframe, and captures
 * desktop + mobile screenshots of key tabs.
 *
 * Run: node Mythsensus/tests/qa-tabs-browser.cjs
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', '..', '_qa-out');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

const TYPES = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.woff':'font/woff', '.woff2':'font/woff2' };

const profiles = [
  { id:'p01', tag:'leap+midnight+polar (Reykjavik)', name:'หม่อมหลวงปุณณภา ณ อยุธยา', gender:'หญิง', dob:'2000-02-29', time:'00:00', city:'64.13,-21.9,0' },
  { id:'p02', tag:"apostrophe+CJK+yearend south", name:"O'Brien-李", gender:'ชาย', dob:'1999-12-31', time:'23:59', city:'-54.8,-68.3,-3' },
  { id:'p03', tag:'special chars+1901 London', name:'X Æ A-12', gender:'ชาย', dob:'1901-01-01', time:'00:01', city:'51.5,-0.12,0' },
  { id:'p04', tag:'emoji name+newborn 2025', name:'👶✨', gender:'หญิง', dob:'2025-12-25', time:'04:44', city:'13.75,100.5,7' },
  { id:'p05', tag:'single-char+Lichun Feb4 Beijing', name:'A', gender:'ชาย', dob:'1988-02-04', time:'12:00', city:'39.9,116.4,8' },
  { id:'p06', tag:'Old-Norse+dateline tz+14', name:'Þórðr Hrafnsson', gender:'ชาย', dob:'1972-06-21', time:'13:07', city:'1.87,-157.4,14' },
  { id:'p07', tag:'Arabic RTL+tz-11', name:'محمد عبدالله', gender:'ชาย', dob:'1965-07-04', time:'00:00', city:'-14.3,-170.7,-11' },
  { id:'p08', tag:'180-char name+leap Tokyo', name:'A'.repeat(180), gender:'หญิง', dob:'1996-02-29', time:'23:59', city:'35.7,139.7,9' },
  { id:'p09', tag:'CJK+symbols+Null Island', name:'李明 123 #@!', gender:'ชาย', dob:'1933-03-03', time:'03:33', city:'0,0,0' },
  { id:'p10', tag:'Nordic diacritics+recent leap Quito', name:'Ægir Ø Åsa', gender:'หญิง', dob:'2024-02-29', time:'02:22', city:'-0.18,-78.47,-5' },
];

// group → [subKey] (mirror of GROUPS in index.html)
const TABS = [
  ['free',        ['blessing','organum','preview','history']],
  ['premium',     ['blueprint','reports']],
  ['subscription',['pulse','sky','resonance','organum','brief','freq','history']],
  ['addon',       ['deep','mirror','pet','companions','exercise','food','product','compat']],
  ['profile',     ['collection','library','streak','me','multi','settings']],
];

const LEAK = /\bNaN\b|\[object Object\]|\bundefined\b/;

function startServer() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(url.parse(req.url).pathname);
      if (p === '/') p = '/index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.stat(fp, (e, st) => {
        if (e || !st.isFile()) { res.writeHead(404); res.end('404 '+p); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(fp).pipe(res);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

(async () => {
  const { srv, port } = await startServer();
  const BASE = `http://127.0.0.1:${port}/index.html`;
  const browser = await chromium.launch();
  const results = [];
  let totalTabErrors = 0, totalLeaks = 0;

  for (const prof of profiles) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    // pre-seed localStorage before first load
    await ctx.addInitScript(p => {
      const set = (k,v)=>localStorage.setItem(k,v);
      set('mth_dob', p.dob); set('mth_time', p.time); set('mth_city', p.city);
      set('mth_name', p.name); set('mth_gender', p.gender);
      set('ms_lang', 'th');
    }, prof);

    const errLog = [];
    let currentTab = '(load)';
    page.on('console', m => { if (m.type() === 'error') errLog.push({ tab: currentTab, msg: m.text().slice(0,300) }); });
    page.on('pageerror', e => errLog.push({ tab: currentTab, msg: 'PAGEERROR: ' + (e.message||'').slice(0,300) }));

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.MS26 && typeof window.setGroup === 'function' && typeof window.showSubTab === 'function', null, { timeout: 20000 });
    // sync form + precompute chart for any renderer that reads window._lastChartData
    await page.evaluate(() => {
      try { if (window.LANG !== undefined) window.LANG = 'th'; } catch(_){}
      const dob = localStorage.getItem('mth_dob');
      const pf = document.getElementById('profDob'); if (pf) pf.value = dob;
      try { window.syncAllForms && window.syncAllForms(); } catch(_){}
      try {
        const [y,m,d] = dob.split('-').map(Number);
        const [hh,mm] = (localStorage.getItem('mth_time')||'12:00').split(':').map(Number);
        const [lat,lon,tz] = (localStorage.getItem('mth_city')||'13.75,100.5,7').split(',').map(Number);
        window._lastChartData = window.MS26.calculate({ name:localStorage.getItem('mth_name'), gender:localStorage.getItem('mth_gender'), year:y,month:m,day:d,hour:hh||12,minute:mm||0,lat,lon,timezone:tz,lang:'th' });
      } catch(e){ /* engine guards already covered by Layer 1 */ }
    });

    const tabRows = [];
    for (const [group, subs] of TABS) {
      for (const sub of subs) {
        currentTab = `${group}/${sub}`;
        const before = errLog.length;
        let info;
        try {
          await page.evaluate(([g,s]) => { window.setGroup(g); window.showSubTab(s); }, [group, sub]);
        } catch (e) {
          errLog.push({ tab: currentTab, msg: 'EVAL THREW: ' + e.message.slice(0,200) });
        }
        await page.waitForTimeout(160);
        info = await page.evaluate(() => {
          const p = document.querySelector('.panel.active');
          const txt = p ? (p.innerText || '').trim() : '';
          return { found: !!p, len: txt.length, sample: txt.slice(0, 4000) };
        });
        const leak = LEAK.test(info.sample);
        const newErrs = errLog.length - before;
        if (leak) totalLeaks++;
        if (newErrs) totalTabErrors += newErrs;
        tabRows.push({ tab: currentTab, panelFound: info.found, textLen: info.len, leak, renderErrors: newErrs,
          leakSample: leak ? (info.sample.match(/.{0,40}(NaN|\[object Object\]|undefined).{0,40}/)||[''])[0] : '' });
      }
    }

    results.push({ profile: prof, tabs: tabRows, errors: errLog });
    // representative screenshots from p06 (most extreme: tz+14, Old Norse name)
    if (prof.id === 'p06') {
      for (const [g,s] of [['addon','deep'],['subscription','pulse'],['free','blessing'],['addon','compat']]) {
        currentTab = `${g}/${s}`;
        await page.evaluate(([gg,ss]) => { window.setGroup(gg); window.showSubTab(ss); }, [g,s]);
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(OUT,'shots',`${prof.id}-${g}-${s}-desktop.png`), fullPage: false });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      for (const [g,s] of [['addon','deep'],['subscription','pulse']]) {
        await page.evaluate(([gg,ss]) => { window.setGroup(gg); window.showSubTab(ss); }, [g,s]);
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(OUT,'shots',`${prof.id}-${g}-${s}-mobile.png`), fullPage: false });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    }

    // FULL blueprint generate for p08 (180-char name + leap) — stress the report + iframe
    if (prof.id === 'p08') {
      currentTab = 'BLUEPRINT-GENERATE';
      await page.evaluate(() => { window.setGroup('premium'); window.showSubTab('blueprint'); try{window.syncAllForms&&window.syncAllForms();}catch(_){} });
      await page.waitForTimeout(200);
      await page.evaluate(() => { try { window.cb_generate(); } catch(e){ console.error('cb_generate threw', e.message); } });
      // wait for the iframe to receive srcdoc (loader ~3.6s)
      let iframeText = '';
      try {
        await page.waitForFunction(() => { const f=document.getElementById('cb-report-frame'); return f && f.getAttribute('srcdoc') && f.getAttribute('srcdoc').length > 1000; }, null, { timeout: 12000 });
        const frame = page.frames().find(f => f !== page.mainFrame());
        if (frame) iframeText = await frame.evaluate(() => document.body.innerText.slice(0, 200000));
        await page.screenshot({ path: path.join(OUT,'shots','p08-blueprint-report.png'), fullPage: false });
      } catch (e) { errLog.push({ tab: currentTab, msg: 'iframe wait failed: ' + e.message.slice(0,200) }); }
      const reportLeak = LEAK.test(iframeText);
      results[results.length-1].blueprint = { rendered: iframeText.length > 1000, textLen: iframeText.length, leak: reportLeak,
        leakSample: reportLeak ? (iframeText.match(/.{0,40}(NaN|\[object Object\]|undefined).{0,40}/)||[''])[0] : '' };
    }

    await ctx.close();
    const pErrs = results[results.length-1].tabs.filter(t=>t.renderErrors||t.leak).length;
    console.log(`${prof.id} ${prof.tag.padEnd(38)} tabs=${tabRows.length} problemTabs=${pErrs} consoleErrs=${errLog.length}`);
  }

  await browser.close();
  srv.close();

  fs.writeFileSync(path.join(OUT, 'tabs-result.json'), JSON.stringify(results, null, 2), 'utf8');

  // ── summary ──
  console.log('\n══════════════ TAB SWEEP SUMMARY ══════════════');
  const tabAgg = {};
  for (const r of results) for (const t of r.tabs) {
    tabAgg[t.tab] = tabAgg[t.tab] || { renders: 0, errs: 0, leaks: 0, empty: 0 };
    tabAgg[t.tab].renders++;
    if (t.renderErrors) tabAgg[t.tab].errs++;
    if (t.leak) tabAgg[t.tab].leaks++;
    if (!t.panelFound || t.textLen < 15) tabAgg[t.tab].empty++;
  }
  console.log('tab'.padEnd(26)+'errs leaks empty (of '+profiles.length+')');
  for (const [tab, a] of Object.entries(tabAgg)) {
    const flag = (a.errs||a.leaks) ? ' ⚠' : '';
    console.log(`${tab.padEnd(26)}${String(a.errs).padStart(4)} ${String(a.leaks).padStart(5)} ${String(a.empty).padStart(5)}${flag}`);
  }
  const bp = results.find(r=>r.blueprint)?.blueprint;
  console.log('\nBlueprint full-generate (p08): ' + (bp ? `rendered=${bp.rendered} textLen=${bp.textLen} leak=${bp.leak} ${bp.leakSample}` : 'n/a'));
  console.log(`\nTOTAL: tabErrors=${totalTabErrors} leaks=${totalLeaks}`);
  console.log('Details → _qa-out/tabs-result.json   Screenshots → _qa-out/shots/');
  process.exit(0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });
