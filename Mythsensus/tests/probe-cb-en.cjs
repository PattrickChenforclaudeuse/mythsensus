/**
 * Probe: with mth_lang='en' seeded BEFORE first paint, generate the
 * Cosmic Blueprint report and inspect rendered HTML for Thai-only strings
 * that should have been translated. Targets specifically the Petroleum
 * Grade Analogy region the user reported as still-Thai.
 */
'use strict';
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://mythsensus.com';
const REPO_ROOT = path.resolve(__dirname, '..', '..');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(`(function(){
    try {
      localStorage.setItem('mth_lang', 'en');
      localStorage.setItem('mth_name', 'Test');
      localStorage.setItem('mth_dob', '1991-02-03');
      localStorage.setItem('mth_time', '12:00');
      localStorage.setItem('mth_gender', 'male');
      localStorage.setItem('mth_city', 'Bangkok, Thailand');
      localStorage.setItem('mth_lat', '13.7563');
      localStorage.setItem('mth_lon', '100.5018');
      localStorage.setItem('mth_tz', '7');
    } catch(_){}
  })()`);

  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('[console error]', m.text().substring(0, 150)); });
  page.on('pageerror', e => console.log('[pageerror]', e.message.substring(0, 150)));

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Verify state
  const state = await page.evaluate(() => ({
    LANG: typeof LANG !== 'undefined' ? LANG : 'undef',
    mth_lang: localStorage.getItem('mth_lang'),
    has_MS26: typeof window.MS26 !== 'undefined',
    has_MS26_calc: typeof (window.MS26 || {}).calculate === 'function',
    has_MS26_report: typeof (window.MS26 || {}).generateReport === 'function',
  }));
  console.log('State:', JSON.stringify(state));

  if (!state.has_MS26_calc) {
    console.log('✗ MS26 engine not loaded — abort');
    await browser.close();
    return;
  }

  // Generate the report directly via window.MS26 (bypass the UI clicks)
  const result = await page.evaluate(() => {
    try {
      const c = window.MS26.calculate({
        name: 'Test', gender: 'male',
        year: 1991, month: 2, day: 3,
        hour: 12, minute: 0,
        lat: 13.7563, lon: 100.5018, timezone: 7,
        lang: LANG,  // explicitly pass current LANG ('en')
      });
      const html = window.MS26.generateReport(c);
      return { ok: true, lang_passed: LANG, lang_in_input: c.input.lang, html_length: html.length, html };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  if (!result.ok) {
    console.log('✗ Generate failed:', result.error);
    await browser.close();
    return;
  }
  console.log('✓ Report generated · length:', result.html_length, '· lang_passed:', result.lang_passed, '· lang_in_input:', result.lang_in_input);

  // Look for Thai chars in the rendered output (report.ts source has Thai
  // wrapped in tr() but we want to see what survives at run time)
  const html = result.html;
  const thaiRegex = /[฀-๿]+/g;
  const thaiMatches = html.match(thaiRegex) || [];
  // Dedupe
  const unique = [...new Set(thaiMatches)].sort((a, b) => b.length - a.length);
  console.log(`\nThai fragments found in EN report: ${unique.length} unique`);
  console.log('Top 30 longest:');
  unique.slice(0, 30).forEach(s => console.log('  ', s));

  // Specific Petroleum check
  console.log('\n--- Petroleum Grade Analogy region ---');
  const petroIdx = html.indexOf('Petroleum Grade Analogy');
  if (petroIdx >= 0) {
    const slice = html.substring(petroIdx, petroIdx + 1500);
    console.log(slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 800));
  } else {
    console.log('(Petroleum Grade Analogy header not found)');
  }

  await browser.close();
})();
