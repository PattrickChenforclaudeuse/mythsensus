/**
 * Mock 12 users, drive each through every tab in the live beta app,
 * and capture screenshots + automated visual checks (raw HTML leaks,
 * undefined/NaN/[object Object], doubled words, JS errors, broken
 * images, empty panels).
 *
 * Output:
 *   user-sim-screenshots/<userN>/<group>-<tab>.png
 *   user-sim-report.html — interactive index with embedded shots
 *
 * Run: node Mythsensus/tests/user-simulator.js
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BASE_URL = 'https://mythsensus.com/beta/';
const SHOT_DIR = path.join(REPO_ROOT, 'user-sim-screenshots');
const REPORT_PATH = path.join(REPO_ROOT, 'user-sim-report.html');

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

// ── 12 mock users ─────────────────────────────────────────────
const USERS = [
  { name: 'Anya',    gender: 'หญิง', y: 1991, m: 2,  d: 3,  hh: 5,  mm: 6,  city: 'Bangkok',   lang: 'th' },
  { name: 'Bjorn',   gender: 'ชาย',  y: 1985, m: 7,  d: 14, hh: 14, mm: 22, city: 'Reykjavik', lang: 'en' },
  { name: 'Citlali', gender: 'หญิง', y: 1972, m: 11, d: 28, hh: 22, mm: 0,  city: 'Mexico',    lang: 'en' },
  { name: 'Daichi',  gender: 'ชาย',  y: 1999, m: 4,  d: 9,  hh: 7,  mm: 30, city: 'Tokyo',     lang: 'en' },
  { name: 'Esme',    gender: 'หญิง', y: 1968, m: 9,  d: 17, hh: 11, mm: 11, city: 'London',    lang: 'en' },
  { name: 'Farid',   gender: 'ชาย',  y: 1958, m: 12, d: 5,  hh: 4,  mm: 45, city: 'Cairo',     lang: 'en' },
  { name: 'Gita',    gender: 'หญิง', y: 2003, m: 8,  d: 21, hh: 19, mm: 33, city: 'Bangkok',   lang: 'th' },
  { name: 'Hiro',    gender: 'ชาย',  y: 1944, m: 1,  d: 1,  hh: 0,  mm: 0,  city: 'Tokyo',     lang: 'en' },
  { name: 'Indra',   gender: 'หญิง', y: 1990, m: 6,  d: 25, hh: 12, mm: 12, city: 'Bangkok',   lang: 'th' },
  { name: 'Jonas',   gender: 'ชาย',  y: 1976, m: 3,  d: 31, hh: 15, mm: 50, city: 'NewYork',   lang: 'en' },
  { name: 'Kira',    gender: 'หญิง', y: 1982, m: 10, d: 10, hh: 10, mm: 10, city: 'Sydney',    lang: 'en' },
  { name: 'Liu',     gender: 'ชาย',  y: 1995, m: 5,  d: 19, hh: 23, mm: 59, city: 'Bangkok',   lang: 'th' },
];

// ── Tab map (mirrors GROUPS in beta/index.html) ───────────────
const TABS = [
  // group, key, label
  ['free',         'blessing',  'God Blessing'],
  ['free',         'organum',   '108 Organum'],
  ['free',         'preview',   'Chart Preview'],
  ['free',         'history',   '7-day History'],
  ['premium',      'blueprint', 'Blueprint'],
  ['premium',      'reports',   'My Reports'],
  ['subscription', 'sky',       'Sky'],
  ['subscription', 'resonance', 'Resonance'],
  ['subscription', 'organum',   'Organum+'],
  ['subscription', 'brief',     'Brief'],
  ['subscription', 'freq',      'Frequency'],
  ['subscription', 'history',   'Full History'],
  ['addon',        'mirror',    'Mirror'],
  ['addon',        'pet',       'Pet'],
  ['addon',        'companions','Companions'],
  ['addon',        'exercise',  'Exercise'],
  ['addon',        'food',      'Food'],
  ['addon',        'product',   'Product'],
  ['addon',        'compat',    'Compat'],
  ['profile',      'collection','Collection'],
  ['profile',      'streak',    'Streak'],
  ['profile',      'me',        'Me'],
  ['profile',      'multi',     'Multi-profile'],
  ['profile',      'settings',  'Settings'],
];

// ── In-page audit (runs in browser) ───────────────────────────
const AUDIT_FN = `() => {
  const issues = [];
  const text = document.body.innerText;
  // 1. raw HTML leaking as plain text
  if (/&lt;\\s*(div|span|strong|p|br)[\\s>]/i.test(text)) issues.push('raw HTML in text');
  // 2. doubled words (Clan Clan, Forest Forest)
  const dup = text.match(/\\b([A-Za-z]{4,}|[฀-๿]{4,})\\s+\\1\\b/);
  if (dup) issues.push('doubled word: '+dup[1]);
  // 3. undefined / NaN / [object Object] visible
  if (/\\b(undefined|NaN)\\b/.test(text)) issues.push('undefined/NaN visible');
  if (text.includes('[object Object]')) issues.push('[object Object] in text');
  // 4. unresolved Mustache or template syntax
  if (/\\$\\{[a-z]/i.test(text) || /\\{\\{\\s*\\.[A-Za-z]/.test(text)) issues.push('unresolved template syntax');
  // 5. slash-list HD authority leak (the bug we fixed; canary)
  if (text.includes('อารมณ์/ปัญญา/ประสาทสัมผัส')) issues.push('HD slash-list authority leak');
  // 6. broken images
  const brokenImg = [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0);
  if (brokenImg.length) issues.push(brokenImg.length + ' broken images');
  // 7. empty active panel?
  const panels = [...document.querySelectorAll('[id^="panel-"], .panel')]
    .filter(p => getComputedStyle(p).display !== 'none' && p.offsetWidth > 0);
  const visible = panels.find(p => p.innerText.trim().length > 30);
  if (panels.length && !visible) issues.push('all visible panels are empty');
  return { issues, textLen: text.length, panelCount: panels.length };
}`;

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ── Per-user run ───────────────────────────────────────────────
async function runUser(browser, user, idx) {
  const userDir = path.join(SHOT_DIR, `u${String(idx + 1).padStart(2, '0')}-${user.name}`);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 200)); });
  page.on('pageerror', err => consoleErrors.push('[pageerror] ' + err.message.substring(0, 200)));

  const tabResults = [];
  let entryOk = false;

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(800);

    // ── Fill entry overlay ────────────────────────────────────
    // Pick language
    if (user.lang === 'th') {
      await page.click('#entryLangTh').catch(() => {});
    } else {
      await page.click('#entryLangEn').catch(() => {});
    }
    await page.waitForTimeout(200);

    // Name
    await page.fill('#entryName', user.name).catch(() => {});
    // DOB — entry uses split fields. Try common shapes.
    const yyyy = String(user.y), mm = String(user.m).padStart(2, '0'), dd = String(user.d).padStart(2, '0');
    // single date input?
    if (await page.$('#entryDob')) {
      await page.fill('#entryDob', `${yyyy}-${mm}-${dd}`).catch(() => {});
    } else {
      // 3 fields fallback
      await page.fill('#entryYear',  yyyy).catch(() => {});
      await page.fill('#entryMonth', mm).catch(() => {});
      await page.fill('#entryDay',   dd).catch(() => {});
    }
    await page.fill('#entryHour',   String(user.hh)).catch(() => {});
    await page.fill('#entryMinute', String(user.mm)).catch(() => {});
    // Gender
    await page.evaluate(g => { const el = document.getElementById('entryGender'); if (el) el.value = g; }, user.gender).catch(() => {});

    // Click the SUBMIT (not the sign-in shortcut). Look for entrySubmit / start-btn.
    const submitSel = await page.evaluate(() => {
      const candidates = ['#entrySubmit', '#entryStart', '.entry-submit', 'button[onclick*="entryConfirm"]', 'button[onclick*="entrySubmit"]'];
      for (const s of candidates) if (document.querySelector(s)) return s;
      // last resort: any visible button inside #entryOverlay that isn't the sign-in shortcut
      const btns = [...document.querySelectorAll('#entryOverlay button')]
        .filter(b => b.offsetWidth > 0 && !/Sign in|ลงชื่อเข้าใช้|ภาษา|เลือก/i.test(b.textContent));
      return btns.length ? '__direct_click__' : null;
    });
    if (submitSel === '__direct_click__') {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('#entryOverlay button')]
          .filter(b => b.offsetWidth > 0 && !/Sign in|ลงชื่อเข้าใช้|ภาษา|เลือก/i.test(b.textContent));
        // The largest / last full-width button is usually the submit
        const submit = btns.find(b => /✦|เริ่ม|Start|Begin|Continue/.test(b.textContent)) || btns[btns.length - 1];
        if (submit) submit.click();
      });
    } else if (submitSel) {
      await page.click(submitSel).catch(() => {});
    }
    await page.waitForTimeout(2500);
    // If the entry overlay is still up, try the bypass: hide it via JS and bootstrap manually.
    const stillEntry = await page.evaluate(() => {
      const o = document.getElementById('entryOverlay');
      return o && getComputedStyle(o).display !== 'none';
    });
    if (stillEntry) {
      // Force-set localStorage and reload — guarantees bypass.
      await page.evaluate(u => {
        localStorage.setItem('mth_lang', u.lang);
        localStorage.setItem('mth_dob', `${u.y}-${String(u.m).padStart(2,'0')}-${String(u.d).padStart(2,'0')}`);
        localStorage.setItem('mth_name', u.name);
        localStorage.setItem('mth_time', `${String(u.hh).padStart(2,'0')}:${String(u.mm).padStart(2,'0')}`);
        localStorage.setItem('mth_gender', u.gender);
        localStorage.setItem('mth_city', '13.75,100.5,7');
        localStorage.setItem('mth_guest_ok', '1');
      }, user);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      // Click "Use saved data" if visible, else direct dismiss
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('#entryOverlay button')];
        const useSaved = btns.find(b => /ใช้ข้อมูลเดิม|Use saved/.test(b.textContent));
        if (useSaved) useSaved.click();
        else {
          const o = document.getElementById('entryOverlay');
          if (o) o.style.display = 'none';
          if (typeof window._bootAfterEntry === 'function') window._bootAfterEntry();
        }
      });
      await page.waitForTimeout(1500);
    }

    entryOk = await page.evaluate(() => {
      const o = document.getElementById('entryOverlay');
      return !o || getComputedStyle(o).display === 'none';
    });

    if (!entryOk) {
      consoleErrors.push('[sim] entry overlay never dismissed');
    }

    // ── Walk every tab ──────────────────────────────────────
    for (const [group, tab, label] of TABS) {
      const file = path.join(userDir, `${group}-${tab}.png`);
      let audit = { issues: [], textLen: 0, panelCount: 0 };
      let navErr = null;
      try {
        await page.evaluate(({ g, t }) => {
          if (typeof window.setGroup === 'function') window.setGroup(g);
          if (typeof window.showSubTab === 'function') window.showSubTab(t);
        }, { g: group, t: tab });
        await page.waitForTimeout(800);
        await page.screenshot({ path: file, fullPage: false });
        const result = await page.evaluate(AUDIT_FN);
        if (result && Array.isArray(result.issues)) audit = result;
      } catch (e) {
        navErr = e.message;
      }
      // Always ensure issues is an array even if audit clobbers it.
      tabResults.push({
        group, tab, label,
        file: path.relative(REPO_ROOT, file),
        navErr,
        issues: Array.isArray(audit.issues) ? audit.issues : [],
        textLen: audit.textLen || 0,
        panelCount: audit.panelCount || 0,
      });
    }
  } catch (e) {
    consoleErrors.push('[fatal] ' + e.message);
  }

  await ctx.close();
  return { user, entryOk, consoleErrors: consoleErrors.slice(0, 12), tabs: tabResults };
}

// ── Main ──────────────────────────────────────────────────────
console.log(`Simulating ${USERS.length} users × ${TABS.length} tabs = ${USERS.length * TABS.length} screenshots`);
const browser = await chromium.launch({ headless: true });
const all = [];
for (let i = 0; i < USERS.length; i++) {
  const u = USERS[i];
  process.stdout.write(`  [${i + 1}/${USERS.length}] ${u.name} ${u.gender} ${u.y}-${u.m}-${u.d} @${u.city} ... `);
  const r = await runUser(browser, u, i);
  const issueCount = r.tabs.reduce((n, t) => n + t.issues.length + (t.navErr ? 1 : 0), 0);
  console.log(`entry=${r.entryOk ? '✓' : '✗'} · ${r.consoleErrors.length} console errors · ${issueCount} tab issues`);
  all.push(r);
}
await browser.close();

// ── HTML report ───────────────────────────────────────────────
const html = `<!doctype html><meta charset="utf-8"><title>Mythsensus User Simulator — ${new Date().toISOString()}</title>
<style>
  body{font-family:system-ui,Segoe UI,sans-serif;background:#0a0a10;color:#e8e0c8;padding:20px;max-width:1300px;margin:auto}
  h1{color:#d4aa50;border-bottom:1px solid #2a2545;padding-bottom:8px}
  h2{color:#c8a840;margin-top:30px}
  .user-card{background:#13112a;border:1px solid #2a2545;border-radius:8px;padding:14px;margin-bottom:18px}
  .user-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;background:#2a2545;color:#d4aa50;margin-right:6px}
  .ok{color:#80ff80}.warn{color:#ffd080}.err{color:#ff8080}
  pre{background:#0a0a10;padding:8px;border-radius:4px;overflow-x:auto;font-size:11px;white-space:pre-wrap}
  table.tabs{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
  table.tabs td,table.tabs th{border:1px solid #2a2545;padding:5px 8px;text-align:left;vertical-align:top}
  table.tabs th{background:#1a1830}
  details{margin-top:8px}
  summary{cursor:pointer;color:#9a8a72}
  img{max-width:240px;border:1px solid #2a2545;display:block;margin:4px 0}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:8px}
  .shot{background:#0a0a10;border:1px solid #2a2545;border-radius:6px;padding:6px}
  .shot img{max-width:100%}
  .shot .caption{font-size:11px;color:#9a8a72;margin-top:4px}
  .shot.bad{border-color:#c01020}
</style>
<h1>Mythsensus User Simulator</h1>
<p>Run: ${new Date().toISOString()} · ${USERS.length} users × ${TABS.length} tabs = ${USERS.length * TABS.length} screenshots</p>
${all.map((r, i) => {
  const totalIssues = r.tabs.reduce((n, t) => n + t.issues.length + (t.navErr ? 1 : 0), 0);
  const flag = totalIssues === 0 && r.consoleErrors.length === 0
    ? '<span class="ok">✓ clean</span>'
    : `<span class="${totalIssues ? 'err' : 'warn'}">${totalIssues} tab issues · ${r.consoleErrors.length} console</span>`;
  return `<div class="user-card">
    <div class="user-head">
      <h2>U${String(i + 1).padStart(2, '0')} · ${esc(r.user.name)} (${esc(r.user.gender)}) · ${r.user.y}-${String(r.user.m).padStart(2,'0')}-${String(r.user.d).padStart(2,'0')} · @${esc(r.user.city)} · lang=${r.user.lang}</h2>
      <div>${flag} <span class="badge">entry ${r.entryOk ? '✓' : '✗'}</span></div>
    </div>
    ${r.consoleErrors.length ? `<details><summary>Console errors (${r.consoleErrors.length})</summary><pre>${esc(r.consoleErrors.join('\n'))}</pre></details>` : ''}
    <details ${totalIssues ? 'open' : ''}><summary>Tabs (${r.tabs.length})</summary>
      <table class="tabs"><thead><tr><th>Group/Tab</th><th>Issues</th><th>Text</th></tr></thead><tbody>
        ${r.tabs.map(t => {
          const cls = (t.issues.length || t.navErr) ? 'err' : 'ok';
          return `<tr><td><strong>${esc(t.group)}</strong> / ${esc(t.tab)} <span style="color:#6a5a42">(${esc(t.label)})</span></td>
            <td class="${cls}">${t.navErr ? '⚠ '+esc(t.navErr) : (t.issues.length ? t.issues.map(esc).join('<br>') : '✓')}</td>
            <td>${t.textLen}b · ${t.panelCount} panels</td></tr>`;
        }).join('')}
      </tbody></table>
    </details>
    <details><summary>Screenshots</summary>
      <div class="grid">
        ${r.tabs.map(t => `<div class="shot ${t.issues.length ? 'bad' : ''}">
          <img src="${esc(t.file.replace(/\\/g,'/'))}" loading="lazy">
          <div class="caption">${esc(t.group)}/${esc(t.tab)}</div>
        </div>`).join('')}
      </div>
    </details>
  </div>`;
}).join('\n')}`;
fs.writeFileSync(REPORT_PATH, html);
console.log(`\n✓ Report: ${REPORT_PATH}`);
console.log(`✓ Screenshots: ${SHOT_DIR}/`);
