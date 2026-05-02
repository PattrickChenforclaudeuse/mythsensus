/**
 * Targeted check: confirm the <br> in the Zi Wei system card actually
 * produces a visual line break between 貪狼 (main star) and ระบบดาราศาสตร์
 * (description). Captures a focused screenshot AND reports the y-coords of
 * each text fragment so we can definitively confirm "貪狼" is on a different
 * line than "ระบบดาราศาสตร์".
 */
'use strict';
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8124';
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const TEST_CHART = {
  mth_name:'Test', mth_dob:'1991-02-03', mth_time:'12:00',
  mth_gender:'male', mth_city:'Bangkok, Thailand',
  mth_lat:'13.7563', mth_lon:'100.5018', mth_tz:'7', mth_lang:'th',
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(`(function(){
    const seed = ${JSON.stringify(TEST_CHART)};
    Object.entries(seed).forEach(([k,v]) => { try { localStorage.setItem(k,v); } catch(_){} });
  })()`);
  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  // dismiss overlay
  await page.evaluate(() => {
    const skip = Array.from(document.querySelectorAll('a, button, [onclick]'))
      .find(el => /ข้ามไปก่อน|skip|ลองดู Tab/i.test(el.textContent || ''));
    if (skip) skip.click();
  });
  await page.waitForTimeout(1500);
  // navigate to addon → deep
  await page.evaluate(() => { if (typeof setGroup === 'function') setGroup('addon'); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { if (typeof showSubTab === 'function') showSubTab('deep'); });
  await page.waitForTimeout(1500);

  // Find the Zi Wei insight card by the unique 貪狼 character
  const ziwei = await page.evaluate(() => {
    // Find element containing both 貪狼 (main star) and ระบบ (system desc)
    const all = Array.from(document.querySelectorAll('div, p, span'));
    const card = all.find(el => {
      const html = el.innerHTML || '';
      return html.includes('貪狼') && html.includes('ระบบดาราศาสตร์') && html.length < 1000;
    });
    if (!card) return null;
    const cardInnerHtml = card.outerHTML.substring(0, 500);
    const tagInfo = card.tagName + '.' + (card.className || 'NO_CLASS').substring(0, 60);
    const cardRect = card.getBoundingClientRect();
    // Walk children of the card and report each text node's y-pos so we can
    // see whether 貪狼 and ระบบดาราศาสตร์ are on the same line or different.
    const fragments = [];
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim();
      if (!t) continue;
      // Get bounding rect of the text node by wrapping it in a Range
      const range = document.createRange();
      range.selectNode(n);
      const r = range.getBoundingClientRect();
      fragments.push({
        text: t.substring(0, 60),
        x: Math.round(r.left), y: Math.round(r.top),
        w: Math.round(r.width), h: Math.round(r.height),
      });
    }
    return {
      tagInfo,
      cardInnerHtml,
      cardRect: { x: Math.round(cardRect.left), y: Math.round(cardRect.top),
                  w: Math.round(cardRect.width), h: Math.round(cardRect.height) },
      fragments,
    };
  });

  if (!ziwei) {
    console.log('✗ Zi Wei card not found on page');
  } else {
    console.log('Element:', ziwei.tagInfo);
    console.log('outerHTML:', ziwei.cardInnerHtml.replace(/\s+/g, ' '));
    console.log('Zi Wei card rect:', ziwei.cardRect);
    console.log('Text fragments (top → bottom):');
    ziwei.fragments
      .filter(f => f.text.length > 2)
      .sort((a, b) => a.y - b.y)
      .forEach(f => console.log(`  y=${f.y}  "${f.text}"`));
    // Take a focused screenshot of just this card
    const cardEl = await page.$('div:has-text("紫微斗數")');
    if (cardEl) {
      const shot = path.join(REPO_ROOT, 'visual-qa-screenshots', 'probe-ziwei-card.png');
      await cardEl.screenshot({ path: shot });
      console.log(`✓ Card screenshot: ${shot}`);
    }
  }

  await browser.close();
})();
