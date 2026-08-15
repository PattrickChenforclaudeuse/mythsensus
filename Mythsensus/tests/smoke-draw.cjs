#!/usr/bin/env node
/**
 * smoke-draw.cjs — drive the one journey the whole funnel depends on.
 *
 * A brand-new visitor lands, taps the single dominant CTA ("จั่วพรวันนี้ · ฟรี"),
 * and should get a revealed god card with a share affordance under the blessing.
 * Nothing tested this. qa-scanner proves pages load and throw no errors; it never
 * clicks anything, so on 2026-08-15 the landing page could serve 200 with every
 * button dead and every automated check stayed green.
 *
 * Runs in a FRESH browser context (no localStorage), which is what a visitor
 * arriving from a Facebook link actually gets — including the free tier's 1 draw
 * per day, rather than the owner account's 3.
 *
 * Usage: node Mythsensus/tests/smoke-draw.cjs [url]     (default: production)
 */
const { chromium } = require('playwright');

const URL = process.argv[2] || 'https://mythsensus.com/?im=1';
const problems = [];

(async () => {
  const browser = await chromium.launch();
  // Mobile viewport: most traffic from the Facebook groups arrives on a phone.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'th-TH' });
  const page = await ctx.newPage();

  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });

  // 1. the entry CTA must exist and be clickable
  const cta = page.locator('button[onclick*="entryDrawFirst"]');
  if (!(await cta.count())) problems.push('entry CTA (entryDrawFirst) not found on the landing page');
  else await cta.first().click();

  // 2. the card must actually reveal — this is the step that needs real rAF,
  //    which is why a hidden/headless-throttled pane could never confirm it.
  try {
    await page.waitForSelector('.god-card.revealed', { timeout: 20000 });
  } catch (_) {
    problems.push('god card never reached .revealed after tapping the free draw');
  }

  // The reveal is animated: `.revealed` lands at the START of the sequence, while
  // the deity name, the share block and the persisted counter are all written at
  // the END. Asserting immediately after the class appears reports four failures
  // for a page that is simply mid-animation — so wait for the deity name, which is
  // the first thing painted once the draw has actually resolved.
  try {
    await page.waitForFunction(
      () => (document.getElementById('godName')?.textContent || '').trim().length > 0,
      { timeout: 20000 }
    );
  } catch (_) {
    problems.push('deity name never appeared within 20s of the draw');
  }

  const godName = (await page.locator('#godName').textContent().catch(() => '')) || '';
  if (!godName.trim()) problems.push('#godName is empty — a card revealed with no deity');

  // 3. the share affordance must be visible, and above the represents chips —
  //    the entire point of the 2026-08-15 move.
  const shareVisible = await page.locator('#godShareWrap').isVisible().catch(() => false);
  if (!shareVisible) problems.push('#godShareWrap is not visible after the reveal');

  const geo = await page.evaluate(() => {
    const box = id => { const e = document.getElementById(id); if (!e) return null;
      const r = e.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), h: Math.round(r.height) }; };
    return { msg: box('godMessage'), share: box('godShareWrap'), rep: box('godRepresents') };
  });
  if (geo.msg && geo.share && geo.share.top < geo.msg.top) problems.push('share block sits ABOVE the blessing text');
  if (geo.share && geo.rep && geo.share.top > geo.rep.top) problems.push('share block is back BELOW the represents chips');

  // 4. the draw must persist, or the "one per day" promise is fiction
  const persisted = await page.evaluate(() => localStorage.getItem('mth_bless_count'));
  if (!persisted || Number(persisted) < 1) problems.push(`draw not persisted (mth_bless_count=${persisted})`);

  if (pageErrors.length) problems.push('uncaught JS: ' + pageErrors.join(' | ').slice(0, 300));

  console.log(`  url:        ${URL}`);
  console.log(`  god drawn:  ${godName.trim() || '(none)'}`);
  console.log(`  share seen: ${shareVisible}`);
  console.log(`  geometry:   message@${geo.msg?.top} → share@${geo.share?.top} (h${geo.share?.h}) → represents@${geo.rep?.top}`);
  console.log(`  persisted:  mth_bless_count=${persisted}`);

  await browser.close();

  if (problems.length) {
    console.error(`\n✗ smoke-draw FAILED — ${problems.length} problem(s):`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('\n✓ smoke-draw passed — a cold visitor can draw, sees the card, and the share block is under the blessing');
})();
