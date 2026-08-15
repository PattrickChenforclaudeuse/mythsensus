#!/usr/bin/env node
/**
 * smoke-reading.cjs — walk the path we actually sell.
 *
 * smoke-draw.cjs covers the blessing (now the SECOND door). This covers the
 * first one: tap "ดูดวง 26 ศาสตร์" → the birth form appears → fill it → the
 * 26-system result renders. That is the journey the 2026-08-15 entry rework
 * promoted to primary, and nothing was testing it.
 *
 * Fresh context every run (no localStorage), mobile viewport — what a visitor
 * arriving from a Facebook group actually gets.
 *
 * Usage: node Mythsensus/tests/smoke-reading.cjs [url]
 */
const { chromium } = require('playwright');

const URL = process.argv[2] || 'https://mythsensus.com/?im=1';
const problems = [];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'th-TH' });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });

  // 1. the primary CTA must be the READING, not the blessing
  const primary = page.locator('button.login-confirm-btn[onclick*="entryShowForm"]');
  if (!(await primary.count())) {
    problems.push('primary CTA does not call entryShowForm — the door swap is not live');
  } else {
    const label = (await primary.first().textContent() || '').trim();
    if (!/26/.test(label)) problems.push(`primary CTA does not mention 26 systems: "${label}"`);
    if (/จั่ว/.test(label)) problems.push(`primary CTA still says "จั่ว": "${label}"`);
    await primary.first().click();
  }

  // 2. tapping it must reveal the birth form
  try {
    await page.waitForSelector('#entryFormStep', { state: 'visible', timeout: 10000 });
  } catch (_) {
    problems.push('birth form (#entryFormStep) never became visible after tapping the primary CTA');
  }

  // 3. the blessing must still be reachable as the second door
  const secondary = page.locator('button[onclick*="entryDrawFirst"]');
  if (!(await secondary.count())) problems.push('blessing door (entryDrawFirst) disappeared entirely');

  // 4. fill the form and submit — the actual conversion step
  // The entry form uses SEPARATE day / month / year selects plus a city — not a
  // single <input type="date">. The first version of this test filled #profDob,
  // which does not exist here, so it reported a product failure that was really a
  // test failure. Fill what the form actually has, then press its own confirm.
  const filled = await page.evaluate(() => {
    const set = (id, v) => {
      const e = document.getElementById(id); if (!e) return false;
      e.value = String(v);
      e.dispatchEvent(new Event('input',  { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
    const missing = ['entryDay','entryMonth','entryYear'].filter(id => !document.getElementById(id));
    if (missing.length) return { ok: false, why: 'missing fields: ' + missing.join(', ') };
    set('entryName', 'Test');
    // The year field is BUDDHIST ERA — it ships prefilled with 2569. Feeding it a
    // CE year makes _getEntryDob() return "" and entryAccept() refuses with
    // "กรุณากรอกวันเกิด", which reads exactly like a broken money path but is the
    // form working as designed. 2534 BE = 1991 CE.
    const okD = set('entryDay', 3), okM = set('entryMonth', 2), okY = set('entryYear', 2534);
    set('entryHour', 5);
    set('entryCity', 'Bangkok, Thailand');
    // Cold visitors must tick the 13+ age box or entryAccept() bails with an
    // error and never renders anything. Missing this made the test look like a
    // broken money path when the form was behaving exactly as designed.
    const age = document.getElementById('entryAgeConfirm');
    if (age && age.type === 'checkbox' && !age.checked) age.click();
    const unknown = document.getElementById('entryUnknownTime');
    if (unknown && unknown.type === 'checkbox' && !okD) unknown.click();
    return { ok: okD && okM && okY };
  });
  if (!filled.ok) problems.push('could not fill the birth form: ' + (filled.why || 'setter failed'));

  const submitted = await page.evaluate(() => {
    const b = document.querySelector('#entryFormStep button[onclick*="entryAccept"]')
           || [...document.querySelectorAll('button')].find(x => /entryAccept\(\)/.test(x.getAttribute('onclick') || ''));
    if (!b) return false;
    b.click();
    return true;
  });
  if (!submitted) problems.push('entryAccept() confirm button not found');

  // 5. the 26-system result must actually render
  try {
    await page.waitForFunction(
      () => {
        const r = document.getElementById('chartResults');
        return r && r.classList.contains('active') && (r.innerText || '').trim().length > 200;
      },
      { timeout: 25000 }
    );
  } catch (_) {
    problems.push('26-system result (#chartResults.active) never rendered after submitting the birth date');
  }

  const shown = await page.evaluate(() => {
    const r = document.getElementById('chartResults');
    return { active: !!(r && r.classList.contains('active')),
             chars: r ? (r.innerText || '').trim().length : 0,
             entryViewFired: !!window._entryShownTracked };
  });

  if (!shown.entryViewFired) problems.push('entry_view never fired — the overlay-shown signal is not working');
  if (pageErrors.length) problems.push('uncaught JS: ' + pageErrors.join(' | ').slice(0, 300));

  console.log(`  url:          ${URL}`);
  console.log(`  result shown: ${shown.active} (${shown.chars} chars)`);
  console.log(`  entry_view:   ${shown.entryViewFired}`);
  console.log(`  js errors:    ${pageErrors.length}`);

  await browser.close();

  if (problems.length) {
    console.error(`\n✗ smoke-reading FAILED — ${problems.length} problem(s):`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('\n✓ smoke-reading passed — cold visitor can tap the 26-system door, fill a birth date, and get a result');
})();
