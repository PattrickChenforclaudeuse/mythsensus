'use strict';
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message.substring(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text().substring(0, 200)); });

  const file = path.resolve(__dirname, '..', 'Offline app', 'mythsensus-offline.html');
  const url = 'file:///' + file.replace(/\\/g, '/');
  console.log('URL:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const state = await page.evaluate(() => ({
    LANG: typeof LANG !== 'undefined' ? LANG : 'undef',
    has_MS26: typeof window.MS26 !== 'undefined',
    has_calc: typeof (window.MS26 || {}).calculate === 'function',
    has_apply: typeof applyLang === 'function',
    has_renderTodayBar: typeof renderTodayBar === 'function',
    has_renderHistory: typeof renderHistory === 'function',
    title: document.title,
    bodyChildren: document.body?.children.length,
  }));
  console.log('State:', JSON.stringify(state, null, 2));
  console.log('Errors collected:', errors.length);
  errors.slice(0, 10).forEach(e => console.log(' ', e));

  await browser.close();
})();
