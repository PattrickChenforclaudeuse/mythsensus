/**
 * Mythsensus Visual QA Scanner — Node + Playwright port of mythsensus-qa.py
 * Run:  node Mythsensus/tests/qa-scanner.js
 * Output: qa-report.html + qa-screenshots/
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const BASE_URL = process.env.BASE_URL || 'https://www.mythsensus.com';
const OUT_DIR = path.join(REPO_ROOT, 'qa-screenshots');
const REPORT_PATH = path.join(REPO_ROOT, 'qa-report.html');

const PAGES = [
  { name: 'landing',     path: '/' },
  { name: 'beta-app',    path: '/beta/' },
  { name: 'pricing',     path: '/pricing/' },
  { name: 'support',     path: '/support/' },
  { name: 'privacy',     path: '/privacy/' },
  { name: 'disclaimer',  path: '/disclaimer/' },
  { name: 'blog',        path: '/blog/' },
  // Added 2026-08-15 (Wald): the routes nothing was watching. /pantheon is 20 pages
  // and 1,069 gods, /en is the whole English entry point, and both were outside
  // every automated check — so a break there would have stayed silent indefinitely,
  // exactly the way the 4-hour landing-page outage did. A page that never reports
  // is not a page that is fine.
  { name: 'pantheon',      path: '/pantheon' },
  { name: 'pantheon-greek',path: '/pantheon/greek' },
  { name: 'en-entry',      path: '/en' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const collectChecks = `() => {
  const visibleTexts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim();
    const el = node.parentElement;
    if (!t || !el) continue;
    const s = window.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0)
      visibleTexts.push({ text: t.substring(0, 120), tag: el.tagName });
    if (visibleTexts.length >= 60) break;
  }

  const overflows = [];
  document.querySelectorAll('*').forEach(el => {
    const s = window.getComputedStyle(el);
    const clipped = (s.overflow === 'hidden' || s.overflowY === 'hidden')
      && el.scrollHeight > el.clientHeight + 5
      && el.clientHeight > 20;
    if (clipped) overflows.push({
      tag: el.tagName,
      cls: String(el.className).substring(0, 80),
      scrollH: el.scrollHeight,
      clientH: el.clientHeight,
    });
  });

  const overlaps = [];
  const els = Array.from(document.querySelectorAll('button, a, input, [role="button"]'));
  for (let i = 0; i < els.length && overlaps.length < 10; i++) {
    const r1 = els[i].getBoundingClientRect();
    if (r1.width === 0) continue;
    for (let j = i + 1; j < els.length && overlaps.length < 10; j++) {
      const r2 = els[j].getBoundingClientRect();
      if (r2.width === 0) continue;
      if (r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top) {
        overlaps.push({
          a: (els[i].textContent || els[i].className).trim().substring(0, 40),
          b: (els[j].textContent || els[j].className).trim().substring(0, 40),
        });
      }
    }
  }

  const hardcodeSuspects = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length > 0) return;
    const t = el.textContent.trim();
    if (/^\\d{1,4}(\\.\\d+)?$/.test(t)) {
      const v = parseFloat(t);
      if ((v >= 1 && v <= 1000) || (v >= 0 && v <= 360)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && hardcodeSuspects.length < 15)
          hardcodeSuspects.push({ value: t, tag: el.tagName, cls: String(el.className).substring(0, 60) });
      }
    }
  });

  const smallTargets = [];
  if (window.innerWidth < 500) {
    document.querySelectorAll('button, a, input, [role="button"]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.width < 44 || r.height < 44) && smallTargets.length < 10) {
        smallTargets.push({ text: el.textContent.trim().substring(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
  }

  // QA rule: raw HTML leaking as text (e.g. user's bug 1 in cosmic report)
  const rawHtmlLeaks = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length > 0) return;
    const t = (el.textContent || '').trim();
    if (/<\\s*(div|span|strong|p|br)[\\s>]/.test(t) && rawHtmlLeaks.length < 5) {
      rawHtmlLeaks.push({ text: t.substring(0, 100), tag: el.tagName });
    }
  });

  // QA rule: doubled-word adjacent (Clan Clan, Chai Chai, etc)
  const doubledWords = [];
  document.body.innerText.split(/\\n/).forEach(line => {
    const m = line.match(/\\b([A-Za-zก-๙]{3,})\\s+\\1\\b/);
    if (m && doubledWords.length < 5) doubledWords.push({ word: m[1], line: line.substring(0, 100) });
  });

  return { visibleTexts, overflows, overlaps, hardcodeSuspects, smallTargets, rawHtmlLeaks, doubledWords };
}`;

const results = [];
const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  for (const pg of PAGES) {
    // ?im=1 marks the visit as ours so the funnel can drop it. Without it every
    // deploy fired ~30 untagged sessions (pages × viewports) straight into the
    // numbers — which is most of why a 44-session day looked like an audience.
    const url = BASE_URL + pg.path + (pg.path.includes('?') ? '&' : '?') + 'im=1';
    const key = `${pg.name}-${vp.name}`;
    const shotPath = path.join(OUT_DIR, `${key}.png`);
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 200)); });
    page.on('pageerror', err => consoleErrors.push('[pageerror] ' + err.message.substring(0, 200)));

    let httpStatus = 0, finalUrl = url, redirected = false, checks = null, err = null;
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForTimeout(1500);
      httpStatus = resp ? resp.status() : 0;
      finalUrl = page.url();
      redirected = finalUrl.replace(/\/$/, '') !== url.replace(/\/$/, '');
      await page.screenshot({ path: shotPath, fullPage: true });
      checks = await page.evaluate(collectChecks);

      // Defense-in-depth smoke test: click a couple of known onclick triggers on the
      // pages that have heavy inline <script> blocks. Any uncaught error from a click
      // (e.g. ReferenceError when the script failed to parse) lands in consoleErrors
      // via the pageerror listener above and is then promoted to a hard fail below.
      if (pg.name === 'landing' || pg.name === 'beta-app') {
        // Pick triggers that are safe to invoke against production: a modal-open
        // (no side effects) and a UI tab switch (no API calls). Anything that
        // hits the generation backend or writes data is intentionally excluded.
        const triggers = [
          '[onclick*="showLoginOverlay"]',
          '[onclick*="setGroup"]',
        ];
        for (const sel of triggers) {
          const btn = await page.$(sel).catch(() => null);
          if (!btn) continue;
          try {
            await btn.click({ timeout: 1000, trial: false });
            await page.waitForTimeout(250);
            // Dismiss anything that might block the next click.
            await page.keyboard.press('Escape').catch(() => {});
          } catch {
            // Click itself failing (overlay, off-screen, etc.) is not a hard fail —
            // we only care whether the click triggered an uncaught JS error, which
            // the pageerror listener already records.
          }
        }
      }
    } catch (e) {
      err = e.message;
    }

    results.push({ key, page: pg.name, vp: vp.name, url, finalUrl, httpStatus, redirected, err, consoleErrors: consoleErrors.slice(0, 8), shot: path.relative(REPO_ROOT, shotPath), checks });
    console.log(`[${key}] ${httpStatus || 'ERR'} ${finalUrl}${redirected ? ' (redirected)' : ''}${err ? ' — ' + err : ''}`);
    await ctx.close();
  }
}
await browser.close();

// HTML report
const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const html = `<!doctype html><meta charset="utf-8"><title>Mythsensus QA Report</title>
<style>
  body{font-family:system-ui,Segoe UI,sans-serif;background:#0a0a10;color:#e8e0c8;padding:24px;max-width:1100px;margin:auto}
  h1{color:#d4aa50;border-bottom:1px solid #2a2545;padding-bottom:8px}
  .card{background:#13112a;border:1px solid #2a2545;border-radius:8px;padding:16px;margin-bottom:18px}
  .key{color:#d4aa50;font-weight:bold}
  .err{color:#ff8080}
  .ok{color:#80ff80}
  .warn{color:#ffd080}
  details{margin-top:8px}
  summary{cursor:pointer;color:#9a8a72}
  pre{background:#0a0a10;padding:10px;border-radius:4px;overflow-x:auto;font-size:11px;white-space:pre-wrap}
  img{max-width:100%;border:1px solid #2a2545;margin-top:6px}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
  td,th{border:1px solid #2a2545;padding:5px 8px;text-align:left}
  th{background:#1a1830}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;background:#2a2545;color:#d4aa50;margin-right:6px}
</style>
<h1>Mythsensus QA Report — ${new Date().toISOString()}</h1>
<p>Base: ${BASE_URL} · ${results.length} runs (${PAGES.length} pages × ${VIEWPORTS.length} viewports)</p>
${results.map(r => {
  const c = r.checks || {};
  const flags = [];
  if (r.err) flags.push(`<span class="err">⚠ FAILED</span>`);
  if (r.httpStatus >= 400) flags.push(`<span class="err">⚠ HTTP ${r.httpStatus}</span>`);
  if (r.consoleErrors.length) flags.push(`<span class="err">⚠ ${r.consoleErrors.length} console errors</span>`);
  if (c.rawHtmlLeaks?.length) flags.push(`<span class="err">⚠ ${c.rawHtmlLeaks.length} HTML leaks</span>`);
  if (c.doubledWords?.length) flags.push(`<span class="warn">⚠ ${c.doubledWords.length} doubled words</span>`);
  if (c.overflows?.length) flags.push(`<span class="warn">⚠ ${c.overflows.length} clipped</span>`);
  if (c.overlaps?.length) flags.push(`<span class="warn">⚠ ${c.overlaps.length} overlaps</span>`);
  if (c.smallTargets?.length) flags.push(`<span class="warn">⚠ ${c.smallTargets.length} small mobile targets</span>`);
  if (!flags.length) flags.push(`<span class="ok">✓ clean</span>`);
  return `<div class="card">
    <div class="key">${esc(r.key)}</div>
    <div>${flags.join(' ')}</div>
    <div style="margin-top:6px;color:#9a8a72;font-size:12px">→ ${esc(r.finalUrl)}${r.redirected ? ' <span class="badge">redirected</span>' : ''} · HTTP ${r.httpStatus || 'ERR'}</div>
    ${r.err ? `<pre class="err">${esc(r.err)}</pre>` : ''}
    ${r.consoleErrors.length ? `<details><summary>Console errors (${r.consoleErrors.length})</summary><pre>${esc(r.consoleErrors.join('\n'))}</pre></details>` : ''}
    ${c.rawHtmlLeaks?.length ? `<details open><summary class="err">Raw HTML leaks (${c.rawHtmlLeaks.length})</summary><pre>${esc(JSON.stringify(c.rawHtmlLeaks, null, 2))}</pre></details>` : ''}
    ${c.doubledWords?.length ? `<details open><summary class="warn">Doubled words (${c.doubledWords.length})</summary><pre>${esc(JSON.stringify(c.doubledWords, null, 2))}</pre></details>` : ''}
    ${c.overlaps?.length ? `<details><summary>Button overlaps (${c.overlaps.length})</summary><pre>${esc(JSON.stringify(c.overlaps, null, 2))}</pre></details>` : ''}
    ${c.overflows?.length ? `<details><summary>Clipped containers (${c.overflows.length})</summary><pre>${esc(JSON.stringify(c.overflows, null, 2))}</pre></details>` : ''}
    ${c.smallTargets?.length ? `<details><summary>Small mobile touch targets (${c.smallTargets.length})</summary><pre>${esc(JSON.stringify(c.smallTargets, null, 2))}</pre></details>` : ''}
    ${c.hardcodeSuspects?.length ? `<details><summary>Hardcoded number suspects (${c.hardcodeSuspects.length})</summary><pre>${esc(JSON.stringify(c.hardcodeSuspects, null, 2))}</pre></details>` : ''}
    <details><summary>Screenshot</summary><img src="${esc(r.shot.replace(/\\/g, '/'))}"></details>
  </div>`;
}).join('\n')}`;
fs.writeFileSync(REPORT_PATH, html);
console.log(`\n✓ Report: ${REPORT_PATH}`);
console.log(`✓ Screenshots: ${OUT_DIR}/`);

// Hard-fail signals — fail the run on uncaught JS errors, broken pages, or raw-HTML leaks.
// Plain console errors stay as warnings (third-party widgets log noise we don't own).
const hardFails = results.filter(r =>
  r.err ||
  r.httpStatus >= 400 ||
  r.consoleErrors.some(e => e.startsWith('[pageerror]')) ||
  (r.checks?.rawHtmlLeaks?.length > 0)
);
if (hardFails.length) {
  console.error(`\n✗ ${hardFails.length}/${results.length} runs FAILED (pageerror / HTTP ≥400 / raw HTML leak)`);
  for (const r of hardFails) {
    const reasons = [
      r.err && `error: ${r.err}`,
      r.httpStatus >= 400 && `HTTP ${r.httpStatus}`,
      ...r.consoleErrors.filter(e => e.startsWith('[pageerror]')),
      r.checks?.rawHtmlLeaks?.length && `${r.checks.rawHtmlLeaks.length} raw HTML leak(s)`,
    ].filter(Boolean);
    console.error(`  - ${r.key}: ${reasons.join(' | ')}`);
  }
  process.exitCode = 1;
}
