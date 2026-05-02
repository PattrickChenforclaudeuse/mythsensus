'use strict';
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8124';
const TEST_CHART = {
  mth_name:'Test', mth_dob:'1991-02-03', mth_time:'12:00',
  mth_gender:'male', mth_city:'Bangkok, Thailand',
  mth_lat:'13.7563', mth_lon:'100.5018', mth_tz:'7', mth_lang:'th',
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(`(function(){
    const seed = ${JSON.stringify(TEST_CHART)};
    Object.entries(seed).forEach(([k,v]) => { try { localStorage.setItem(k,v); } catch(_){} });
  })()`);
  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const skip = Array.from(document.querySelectorAll('a, button, [onclick]'))
      .find(el => /ข้ามไปก่อน|skip|ลองดู Tab/i.test(el.textContent || ''));
    if (skip) skip.click();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { if (typeof setGroup === 'function') setGroup('profile'); });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    // Find ▾ chevron
    const all = Array.from(document.querySelectorAll('*'));
    const chev = all.find(el => el.children.length === 0 && (el.textContent || '').trim() === '▾');
    const tepa = all.find(el => el.children.length === 0 && (el.textContent || '').includes('เทพปกรณัม'));
    if (!chev || !tepa) return { error: 'not found' };
    // Walk up from each, log ancestry depth + tag
    const chain = (el) => {
      const out = [];
      let n = el, d = 0;
      while (n && n !== document.body && d < 10) {
        out.push(`${n.tagName}.${(n.className||'').slice(0,30)}#${n.id||''}`.replace(/\.$|#$/g, ''));
        n = n.parentElement; d++;
      }
      return out;
    };
    return {
      chevChain: chain(chev),
      tepaChain: chain(tepa),
      chevParent: chev.parentElement === tepa.parentElement,
      chevSibling: chev.parentElement?.parentElement === tepa.parentElement?.parentElement,
      chevRect: chev.getBoundingClientRect().toJSON(),
      tepaRect: tepa.getBoundingClientRect().toJSON(),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
