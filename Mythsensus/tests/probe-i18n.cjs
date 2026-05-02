'use strict';
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const stored of [null, 'th', 'en']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    if (stored) {
      await ctx.addInitScript(`try { localStorage.setItem('mth_lang', '${stored}'); } catch(_){}`);
    }
    const page = await ctx.newPage();
    await page.goto('https://mythsensus.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    // dismiss overlay
    await page.evaluate(() => {
      const skip = Array.from(document.querySelectorAll('a, button, [onclick]'))
        .find(el => /ข้ามไปก่อน|skip|ลองดู Tab/i.test(el.textContent || ''));
      if (skip) skip.click();
    });
    await page.waitForTimeout(2000);
    const sample = await page.evaluate(() => {
      const pick = (sel) => document.querySelector(sel)?.textContent.trim().substring(0, 80);
      return {
        LANG: typeof LANG !== 'undefined' ? LANG : 'undefined',
        mth_lang: localStorage.getItem('mth_lang'),
        date: pick('#dateDisplay'),
        group_free: pick('#group-free'),
        group_premium: pick('#group-premium'),
        sub_blessing: Array.from(document.querySelectorAll('button, [onclick]'))
          .map(e => (e.textContent||'').trim().substring(0, 30))
          .find(t => /Blessing|จั่วไพ่/.test(t)),
        intro: pick('.panel-intro'),
        drawBtn: pick('#drawBtn'),
        recentTitle: pick('#blessingRecentTitle'),
      };
    });
    console.log(`stored=${stored || 'NONE'}:`, JSON.stringify(sample, null, 2));
    await ctx.close();
  }
  await browser.close();
})();
