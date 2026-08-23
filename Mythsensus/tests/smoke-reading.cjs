#!/usr/bin/env node
/**
 * smoke-reading.cjs — walk the path we actually sell.
 *
 * smoke-draw.cjs covers the blessing (the SECOND door). This covers the one
 * we sell: type a birth date on the landing → the form appears → confirm →
 * the forecast renders.
 *
 * The date is typed into the LANDING fields in Buddhist era, deliberately.
 * That is the path a Thai visitor from Facebook takes, and on 2026-08-23 it
 * was broken end to end: entryHeroGo() converted BE→CE but left the era
 * selector on BE, so _getEntryDob() subtracted 543 twice, produced 1448,
 * failed its own y<1900 guard and returned "" — every such visitor stopped
 * dead at step two. The old version of this test filled the FORM fields
 * directly and so walked straight past the broken hand-off.
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

  // 1. the primary CTA must be the READING, not the blessing.
  //    The label is deliberately NOT asserted word-for-word — it has been
  //    rewritten twice (26 systems → four weeks) and each time this test went
  //    red for a copy edit rather than a broken journey. What has to hold is
  //    that the main button is not the blessing and that it opens the form.
  // Locate the primary CTA by its role on the page, not by the name of the
  // function behind it. The handler has changed once already (entryShowForm ->
  // entryHeroGo, when the date fields moved onto the landing) and this test
  // went red for a rename rather than for a broken journey. What matters is
  // that the main button opens the birth form; that is asserted below.
  const primary = page.locator('button.login-confirm-btn[data-eh="cta"]');
  if (!(await primary.count())) {
    problems.push('primary CTA (button.login-confirm-btn[data-eh="cta"]) not found on the landing page');
  } else {
    const label = (await primary.first().textContent() || '').trim();
    if (!label) problems.push('primary CTA has no label');
    if (/จั่ว|รับพร/.test(label)) problems.push(`primary CTA is the blessing, not the reading: "${label}"`);

    // Type the date on the LANDING, in พ.ศ., before tapping through — this is
    // the hand-off that broke. If the fields are not there, say so rather than
    // silently falling through to the form fields and testing nothing.
    const heroFilled = await page.evaluate(() => {
      const set = (id, v) => {
        const e = document.getElementById(id); if (!e) return false;
        e.value = String(v);
        e.dispatchEvent(new Event('input',  { bubbles: true }));
        e.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      return set('heroDay', 3) && set('heroMonth', 2) && set('heroYear', 2534);
    });
    if (!heroFilled) problems.push('landing date fields (heroDay/heroMonth/heroYear) missing');

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
    // Name is left EMPTY on purpose: it has never been required, and a test
    // that always fills it would not notice if it silently became mandatory.
    // The date is NOT re-typed either — it was entered on the landing, and
    // whether it survived the hand-off is exactly what is under test. Read it
    // back through the page's own getter, which is what entryAccept() uses.
    const dob = (typeof _getEntryDob === 'function') ? _getEntryDob() : '';
    if (dob !== '1991-02-03') {
      return { ok: false, why: `landing date did not survive the hand-off: _getEntryDob() = "${dob}" (want 1991-02-03)` };
    }
    const okD = true, okM = true, okY = true;
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

  // 5. the forecast must actually render — the thing the landing promises
  try {
    await page.waitForFunction(
      () => {
        const p = document.getElementById('panel-forecast');
        const h = document.getElementById('forecastPanel');
        return p && p.classList.contains('active') && h && (h.innerText || '').trim().length > 400;
      },
      { timeout: 25000 }
    );
  } catch (_) {
    problems.push('forecast (#panel-forecast.active) never rendered after confirming the birth date');
  }

  const shown = await page.evaluate(() => {
    const p = document.getElementById('panel-forecast');
    const h = document.getElementById('forecastPanel');
    const txt = h ? (h.innerText || '').trim() : '';
    return { active: !!(p && p.classList.contains('active')),
             chars: txt.length,
             // A forecast of nothing is the failure mode this product has to
             // avoid: if every domain reads the same, the page is technically
             // rendering and telling the reader nothing.
             scores: (txt.match(/[1-5]\/5/g) || []).slice(0, 8),
             entryViewFired: !!window._entryShownTracked };
  });
  if (shown.active && shown.scores.length < 4) {
    problems.push(`forecast rendered but only ${shown.scores.length} domain scores found (want 4)`);
  }
  if (shown.scores.length && new Set(shown.scores).size === 1) {
    problems.push(`every domain scored the same (${shown.scores[0]}) — the forecast is not discriminating`);
  }

  if (!shown.entryViewFired) problems.push('entry_view never fired — the overlay-shown signal is not working');
  if (pageErrors.length) problems.push('uncaught JS: ' + pageErrors.join(' | ').slice(0, 300));

  console.log(`  url:          ${URL}`);
  console.log(`  forecast:     ${shown.active} (${shown.chars} chars)`);
  console.log(`  scores:       ${shown.scores.join('  ')}`);
  console.log(`  entry_view:   ${shown.entryViewFired}`);
  console.log(`  js errors:    ${pageErrors.length}`);

  await browser.close();

  if (problems.length) {
    console.error(`\n✗ smoke-reading FAILED — ${problems.length} problem(s):`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('\n✓ smoke-reading passed — a cold visitor can type a พ.ศ. birth date on the landing and reach a forecast that discriminates');
})();
