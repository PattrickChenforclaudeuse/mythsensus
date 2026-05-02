/**
 * Interactive QA scan — pre-fills a test chart via localStorage, dismisses the
 * entry overlay, walks every group/sub-tab via setGroup() / showSubTab(), and
 * captures a fullPage screenshot + layout metrics at each stop. Catches the
 * class of bugs the load-time qa-scanner can't see: tab overlap, button
 * collision, font-size drift across cards, mixed-script (CJK + Thai + Latin)
 * rendering issues.
 *
 * Run:  node Mythsensus/tests/interactive-qa-scan.cjs
 * Out:  visual-qa-screenshots/  +  visual-qa-report.json
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://mythsensus.com';
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'visual-qa-screenshots');
const REPORT_PATH = path.join(REPO_ROOT, 'visual-qa-report.json');

// Test chart per handoff (Pattrick's reference chart, surfaces all 26 systems)
const TEST_CHART = {
  mth_name:   'Test Chart',
  mth_dob:    '1991-02-03',
  mth_time:   '12:00',
  mth_gender: 'male',
  mth_city:   'Bangkok, Thailand',
  mth_lat:    '13.7563',
  mth_lon:    '100.5018',
  mth_tz:     '7',
  mth_lang:   process.env.SCAN_LANG || 'th',  // override to 'en' to QA the English report
};

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Layout-checks evaluated on each tab. Returns { overlaps, fontSizes, mixedScripts, hidden }.
function collectLayoutMetrics() {
  // 1. Button / link / input rect collisions (visible only).
  // Skip elements inside a closed <details> — they have non-zero layout rects
  // in Chromium even when visually hidden, which produces false overlaps with
  // adjacent visible elements.
  const inClosedDetails = (el) => {
    let n = el;
    while (n && n !== document.body) {
      if (n.tagName === 'DETAILS' && !n.open) return true;
      n = n.parentElement;
    }
    return false;
  };
  const els = Array.from(document.querySelectorAll('button, a, input, [role="button"], [onclick]'))
    .filter(e => {
      const r = e.getBoundingClientRect();
      const s = window.getComputedStyle(e);
      if (r.width <= 0 || r.height <= 0) return false;
      if (s.visibility === 'hidden' || s.display === 'none') return false;
      if (inClosedDetails(e)) return false;
      // Fixed/sticky elements (floating nav, FAB, sticky header) are
      // designed to overlap scrollable content — that's their whole point.
      if (s.position === 'fixed' || s.position === 'sticky') return false;
      // offsetParent is null for elements with display:none ancestors.
      if (e.offsetParent === null) return false;
      return true;
    });
  const overlaps = [];
  for (let i = 0; i < els.length && overlaps.length < 20; i++) {
    const r1 = els[i].getBoundingClientRect();
    for (let j = i + 1; j < els.length && overlaps.length < 20; j++) {
      const r2 = els[j].getBoundingClientRect();
      // Real overlap, not just adjacency. Skip parent-child relations.
      if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
      // Skip elements that share an immediate parent — they're laid out
      // together intentionally (icon + label in a row, chevron at row end,
      // checkbox + text, etc.) and any overlap is the designer's choice.
      if (els[i].parentElement === els[j].parentElement) continue;
      const dx = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
      const dy = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
      if (dx > 4 && dy > 4) {
        overlaps.push({
          a: (els[i].textContent || els[i].getAttribute('aria-label') || els[i].className).trim().substring(0, 50),
          b: (els[j].textContent || els[j].getAttribute('aria-label') || els[j].className).trim().substring(0, 50),
          area: Math.round(dx * dy),
          ax: Math.round(r1.left), ay: Math.round(r1.top),
          bx: Math.round(r2.left), by: Math.round(r2.top),
        });
      }
    }
  }

  // 2. Font-size distribution across text-bearing leaf elements. Inconsistency
  // (e.g. card titles 14px in one place and 18px in another for the same role)
  // shows up as a wide spread within elements sharing a class prefix.
  const sizesByClass = {};
  document.querySelectorAll('h1, h2, h3, h4, .card-title, .tier-name, .addon-name, .section-title, [class*="title"], [class*="heading"]').forEach(el => {
    if (!el.textContent.trim()) return;
    const cls = (el.className || '').split(/\s+/).find(c => /title|heading|name/.test(c)) || el.tagName.toLowerCase();
    const px = Math.round(parseFloat(window.getComputedStyle(el).fontSize));
    if (!sizesByClass[cls]) sizesByClass[cls] = [];
    if (sizesByClass[cls].length < 30) sizesByClass[cls].push(px);
  });
  const fontDrift = [];
  for (const [cls, sizes] of Object.entries(sizesByClass)) {
    if (sizes.length < 2) continue;
    const min = Math.min(...sizes), max = Math.max(...sizes);
    if (max - min > 4) fontDrift.push({ cls, min, max, n: sizes.length, samples: sizes.slice(0, 8) });
  }

  // 3. Mixed-script paragraphs — when CJK + Thai + Latin sit in the same text
  // node, font-fallback can produce baseline / x-height drift. Flag any leaf
  // element whose text contains 2+ of: CJK, Thai, Latin, Devanagari, Hangul.
  const scriptRanges = {
    cjk:    /[一-鿿㐀-䶿]/,         // Han ideographs
    hira:   /[぀-ゟ]/,                        // Hiragana
    kata:   /[゠-ヿ]/,                        // Katakana
    hangul: /[가-힯ᄀ-ᇿ]/,         // Hangul
    thai:   /[฀-๿]/,                        // Thai
    deva:   /[ऀ-ॿ]/,                        // Devanagari
    latin:  /[A-Za-z]/,
  };
  const mixedScripts = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length > 0) return;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) return;
    const t = (el.textContent || '').trim();
    if (!t || t.length < 4) return;
    // Skip elements that clearly hold rendered chart data with intentional
    // separators — we care about RENDERING quality, not "did multilingual
    // content reach the page" (it should — that's the product).
    const scripts = Object.entries(scriptRanges).filter(([_, re]) => re.test(t)).map(([k]) => k);
    const interesting = scripts.filter(s => s !== 'latin');
    if (interesting.length < 2 || mixedScripts.length >= 30) return;
    // Visibility check — invisible nodes shouldn't be flagged.
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    mixedScripts.push({
      scripts,
      text: t.substring(0, 120),
      tag: el.tagName,
      font: cs.fontFamily.substring(0, 100),
      x: Math.round(r.left), y: Math.round(r.top),
      // Whether the parent's innerHTML has a <br> between the scripts —
      // if yes, visual line-break exists and the textContent jam is a
      // false positive (the scripts render on different lines).
      hasInternalBr: (el.parentElement?.innerHTML || '').includes('<br'),
    });
  });

  // 4. Clipped containers — overflow:hidden but content overflows.
  const clipped = [];
  document.querySelectorAll('*').forEach(el => {
    if (clipped.length >= 15) return;
    const s = window.getComputedStyle(el);
    if ((s.overflow === 'hidden' || s.overflowY === 'hidden')
        && el.scrollHeight > el.clientHeight + 5
        && el.clientHeight > 30) {
      clipped.push({
        tag: el.tagName,
        cls: String(el.className).substring(0, 60),
        scrollH: el.scrollHeight,
        clientH: el.clientHeight,
      });
    }
  });

  return { overlaps, fontDrift, mixedScripts, clipped };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} ${vp.width}x${vp.height} ===`);
    const ctx = await browser.newContext({
      viewport: vp,
      userAgent: 'Mozilla/5.0 (compatible; Mythsensus-VisualQA/1.0)',
    });

    // Pre-seed localStorage so the entry overlay is bypassed and chart panels
    // render with real values rather than placeholder/empty state.
    await ctx.addInitScript(`(function(){
      const seed = ${JSON.stringify(TEST_CHART)};
      Object.entries(seed).forEach(([k, v]) => { try { localStorage.setItem(k, v); } catch(_) {} });
    })()`);

    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message.substring(0, 200)}`));
    page.on('console', m => { if (m.type()==='error') errors.push(`console: ${m.text().substring(0, 200)}`); });

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2500);

      // If the entry overlay is still shown despite seeded localStorage, click
      // the "skip" link to dismiss it.
      const skipped = await page.evaluate(() => {
        const skipLink = Array.from(document.querySelectorAll('a, button, [onclick]'))
          .find(el => /ข้ามไปก่อน|skip|Skip|ลองดู Tab/i.test(el.textContent || ''));
        if (skipLink) { skipLink.click(); return true; }
        // Or click reveal if filled
        const revealBtn = Array.from(document.querySelectorAll('button, [onclick]'))
          .find(el => /เปิดเผยดวง|Reveal|My Chart/i.test(el.textContent || ''));
        if (revealBtn) { revealBtn.click(); return 'revealed'; }
        return false;
      });
      console.log('  entry handling:', skipped);
      await page.waitForTimeout(2000);

      // Discover available groups by scanning DOM for setGroup() calls.
      const groups = await page.evaluate(() => {
        const set = new Set();
        document.querySelectorAll('[onclick]').forEach(el => {
          const m = el.getAttribute('onclick').match(/setGroup\(['"]([\w-]+)['"]/);
          if (m) set.add(m[1]);
        });
        return Array.from(set);
      });
      console.log('  groups:', groups.join(', ') || '(none discovered)');

      // Fallback list if discovery fails (well-known group names from index.html)
      const groupsToVisit = groups.length ? groups : ['blueprint', 'organum', 'addon', 'profile', 'live', 'home'];

      // Always capture the initial state first
      const initialShot = path.join(OUT_DIR, `${vp.name}-00-initial.png`);
      await page.screenshot({ path: initialShot, fullPage: true });
      const initialMetrics = await page.evaluate(collectLayoutMetrics);
      allResults.push({ vp: vp.name, group: '_initial', screenshot: path.relative(REPO_ROOT, initialShot), ...initialMetrics });
      console.log(`  _initial: overlaps=${initialMetrics.overlaps.length} fontDrift=${initialMetrics.fontDrift.length} mixedScripts=${initialMetrics.mixedScripts.length}`);

      // Walk each group
      for (let i = 0; i < groupsToVisit.length; i++) {
        const g = groupsToVisit[i];
        try {
          await page.evaluate(group => {
            if (typeof setGroup === 'function') setGroup(group);
          }, g);
          await page.waitForTimeout(1200);
          const filename = `${vp.name}-${String(i+1).padStart(2,'0')}-${g}.png`;
          const shotPath = path.join(OUT_DIR, filename);
          await page.screenshot({ path: shotPath, fullPage: true });
          const metrics = await page.evaluate(collectLayoutMetrics);
          allResults.push({ vp: vp.name, group: g, screenshot: path.relative(REPO_ROOT, filename), ...metrics });
          console.log(`  ${g}: overlaps=${metrics.overlaps.length} fontDrift=${metrics.fontDrift.length} mixedScripts=${metrics.mixedScripts.length}`);
        } catch (e) {
          console.log(`  ${g} FAILED: ${e.message.substring(0, 100)}`);
          allResults.push({ vp: vp.name, group: g, error: e.message });
        }
      }

      // Grab any subTabs visible inside the most-likely-problem groups
      // (premium / addon have the densest multilingual content; subscription
      // has the live brief panels; blueprint is the legacy name we keep as
      // a fallback if the live route ever surfaces it)
      for (const g of ['blueprint', 'premium', 'subscription', 'addon']) {
        if (!groupsToVisit.includes(g)) continue;
        await page.evaluate(group => { if (typeof setGroup === 'function') setGroup(group); }, g);
        await page.waitForTimeout(800);
        const subs = await page.evaluate(() => {
          const set = new Set();
          document.querySelectorAll('[onclick]').forEach(el => {
            const m = el.getAttribute('onclick').match(/showSubTab\(['"]([\w-]+)['"]/);
            if (m) set.add(m[1]);
          });
          return Array.from(set).slice(0, 8); // cap to avoid screenshot explosion
        });
        for (const s of subs) {
          try {
            await page.evaluate(sub => { if (typeof showSubTab === 'function') showSubTab(sub); }, s);
            await page.waitForTimeout(900);
            const filename = `${vp.name}-sub-${g}-${s}.png`;
            const shotPath = path.join(OUT_DIR, filename);
            await page.screenshot({ path: shotPath, fullPage: true });
            const metrics = await page.evaluate(collectLayoutMetrics);
            allResults.push({ vp: vp.name, group: `${g}/${s}`, screenshot: path.relative(REPO_ROOT, filename), ...metrics });
            console.log(`  ${g}/${s}: overlaps=${metrics.overlaps.length} fontDrift=${metrics.fontDrift.length} mixedScripts=${metrics.mixedScripts.length}`);
          } catch (e) {
            console.log(`  ${g}/${s} FAILED: ${e.message.substring(0, 100)}`);
          }
        }
      }

    } catch (e) {
      console.log('  FATAL:', e.message);
      allResults.push({ vp: vp.name, fatal: e.message });
    }

    if (errors.length) {
      console.log(`  page errors collected: ${errors.length}`);
      errors.slice(0, 5).forEach(e => console.log('   ', e));
    }
    allResults.push({ vp: vp.name, _pageErrors: errors });
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(REPORT_PATH, JSON.stringify(allResults, null, 2));
  console.log(`\n✓ Report: ${REPORT_PATH}`);
  console.log(`✓ Screenshots: ${OUT_DIR}/`);
})();
