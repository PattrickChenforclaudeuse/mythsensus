/**
 * walk_tabs.cjs — เข้าเว็บเหมือนคนจริง แล้วไล่กดทุกกลุ่ม × ทุกแท็บ
 * ตรวจว่า "คำตอบไม่มั่ว": แผงว่าง, undefined/NaN, ตัวเลขขัดกันเอง, ไทยหลุดฝั่ง EN, js error
 *
 * ใช้: node walk_tabs.cjs [url] [th|en]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'https://mythsensus.com/?im=1';
const LANGWANT = process.argv[3] || 'th';
const SHOTS = path.join(process.env.TMPDIR||require('os').tmpdir(), 'tabs-' + LANGWANT);
fs.mkdirSync(SHOTS, { recursive: true });

const GARBAGE = [
  [/\bundefined\b/i, 'undefined'],
  [/\bNaN\b/, 'NaN'],
  [/\[object [A-Z]/, '[object Object]'],
  [/\bInfinity\b/, 'Infinity'],
  [/\{\{|\}\}/, 'template ที่ไม่ถูกแทนค่า'],
  [/\bnull\b/, 'null'],
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'th-TH' });
  const page = await ctx.newPage();
  const jsErr = [];
  page.on('pageerror', e => jsErr.push(String(e.message).slice(0, 140)));
  page.on('console', m => { if (m.type() === 'error') jsErr.push('console: ' + m.text().slice(0, 120)); });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);

  if (LANGWANT === 'en') {
    await page.evaluate(() => { try { setLangExplicit('en'); } catch (_) {} });
    await page.waitForTimeout(1200);
  }

  // ── เข้าเว็บเหมือนคนจริง: กรอกวันเกิดบนหน้าแรก → ฟอร์ม → ยืนยัน ──
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); if (!e) return; e.value = String(v);
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    set('heroDay', 3); set('heroMonth', 2); set('heroYear', 2534);
  });
  await page.locator('button.login-confirm-btn[data-eh="cta"]').first().click();
  await page.waitForSelector('#entryFormStep', { state: 'visible', timeout: 15000 });
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); if (!e) return; e.value = String(v);
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
    set('entryHour', 5); set('entryCity', 'Bangkok, Thailand');
    const age = document.getElementById('entryAgeConfirm');
    if (age && age.type === 'checkbox' && !age.checked) age.click();
  });
  const confirm = page.locator('#entryFormStep button.login-confirm-btn').last();
  await confirm.click();
  await page.waitForTimeout(5000);

  const overlayGone = await page.evaluate(() => {
    const o = document.getElementById('entryOverlay');
    return !o || getComputedStyle(o).display === 'none';
  });
  if (!overlayGone) { console.log('!! เข้าเว็บไม่ผ่าน — overlay ยังอยู่'); await browser.close(); process.exit(1); }

  // ── รายชื่อกลุ่ม × แท็บ จากตัวเว็บเอง ──
  const plan = await page.evaluate(() => {
    const out = [];
    for (const g of Object.keys(GROUPS)) for (const tb of GROUPS[g].tabs)
      out.push({ group: g, sub: tb[0], panel: tb[1], txKey: tb[2], locked: !!tb[3] });
    return out;
  });

  const results = [];
  for (const it of plan) {
    jsErr.length = 0;
    let r = { ...it, ok: true, notes: [] };
    try {
      await page.evaluate(([g, s]) => { setGroup(g); showSubTab(s); }, [it.group, it.sub]);
      await page.waitForTimeout(2600);
      const info = await page.evaluate((panelId) => {
        const el = document.getElementById('panel-' + panelId);
        if (!el) return { missing: true };
        const cs = getComputedStyle(el);
        const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
        const thai = (txt.match(/[฀-๿]/g) || []).length;
        const label = (document.querySelector('.sub-btn.active') || {}).textContent || '';
        return { visible: cs.display !== 'none', chars: txt.length, thai, txt: txt.slice(0, 300), full: txt, label: label.trim() };
      }, it.panel);
      r = { ...r, ...info };
      if (info.missing) r.notes.push('ไม่มี panel นี้ใน DOM');
      else {
        if (!info.visible) r.notes.push('panel ไม่ถูกแสดง');
        if (info.chars < 40) r.notes.push('แผงแทบว่าง (' + info.chars + ' ตัวอักษร)');
        for (const [re, name] of GARBAGE) if (re.test(info.txt)) r.notes.push('เจอ ' + name);
        if (LANGWANT === 'en' && info.thai > 0) r.notes.push('ไทยหลุดฝั่ง EN ' + info.thai + ' ตัว');
      }
      if (jsErr.length) r.notes.push('js: ' + jsErr.slice(0, 2).join(' | '));
      await page.screenshot({ path: path.join(SHOTS, it.group + '__' + it.sub + '.png') });
    } catch (e) {
      r.notes.push('พัง: ' + String(e.message).slice(0, 100));
    }
    r.ok = r.notes.length === 0;
    results.push(r);
    console.log((r.ok ? 'OK  ' : 'ดู! ') + (it.group + '/' + it.sub).padEnd(28) +
      String(r.chars || 0).padStart(6) + ' ตัวอักษร' + (it.locked ? ' [ล็อก]' : '') +
      (r.notes.length ? '  << ' + r.notes.join(' · ') : ''));
  }

  fs.writeFileSync(path.join(__dirname, 'walk-' + LANGWANT + '.json'), JSON.stringify(results, null, 1));
  const bad = results.filter(r => !r.ok);
  console.log('\nรวม ' + results.length + ' แท็บ · ต้องดู ' + bad.length + ' แท็บ');
  await browser.close();
})();
