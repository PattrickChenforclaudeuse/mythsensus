'use strict';
// Bilingual audit: visit every tab, set lang=en or lang=th, scan visible text
// for the OPPOSITE language. Reports tab + element + offending text.
//
// Run: node Mythsensus/tests/audit-bilingual.cjs [URL]
// Default URL: http://localhost:8000  (use file://... to test local index.html)
// Override: pass full URL as first arg, e.g. https://mythsensus.com/

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL_ARG = process.argv[2] || 'https://mythsensus.com/';
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'audit-bilingual-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const THAI_RE = /[฀-๿]/;
// English heuristic: an English "word" of 3+ ASCII letters (skip standalone uppercase glyphs / brand names)
const EN_WORD_RE = /\b[a-zA-Z]{4,}\b/;
// Brand / system names allowed in BOTH modes (won't be flagged as bilingual mix)
const ALLOWED_EN_IN_TH = new Set([
  'Mythsensus', 'Cosmic', 'Blueprint', 'BaZi', 'Bazi', 'Vedic', 'Western', 'Tarot',
  'Kabbalah', 'Hellenistic', 'Norse', 'Rune', 'Ogham', 'Mayan', 'Aztec', 'Tonalpohualli',
  'Tzolkin', 'Tibetan', 'Zoroastrian', 'Pythagorean', 'Onmyodo', 'Saju', 'Ifa', 'Yoruba',
  'Premium', 'Beta', 'PDF', 'HTML', 'Print', 'Save', 'Login', 'Profile', 'Sky',
  'Today', 'Streak', 'History', 'Reports', 'Resonance', 'Frequency', 'Organum',
  'Email', 'OAuth', 'LINE', 'Facebook', 'Google', 'Skip', 'Back', 'Compare',
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  'Wood', 'Fire', 'Earth', 'Metal', 'Water', 'Yin', 'Yang',
  'Star', 'Path', 'Tone', 'Kin', 'Day', 'Master',
  'YouTube', 'Spotify', 'Instagram', 'TikTok', 'Twitter',
  'Om', 'Namah', 'Namaha', 'Brahma', 'Vishnu', 'Shiva',
]);

// Tabs to visit. Each entry: { id, label, group, prep? }
// group means we may need to click a parent tab first.
const TABS = [
  { id: 'profile',          label: 'Profile (Me)',           group: 'profile',     sub: 'me' },
  { id: 'profile-multi',    label: 'Profile (Multi)',        group: 'profile',     sub: 'multi' },
  { id: 'profile-settings', label: 'Profile (Settings)',     group: 'profile',     sub: 'settings' },
  { id: 'free-blessing',    label: 'Free → Blessing',        group: 'free',        sub: 'blessing' },
  { id: 'free-organum',     label: 'Free → 108 Organum',     group: 'free',        sub: 'organum' },
  { id: 'free-preview',     label: 'Free → Preview',         group: 'free',        sub: 'preview' },
  { id: 'free-collection',  label: 'Free → Collection',      group: 'free',        sub: 'collection' },
  { id: 'free-streak',      label: 'Free → Streak',          group: 'free',        sub: 'streak' },
  { id: 'free-history7',    label: 'Free → 7-day History',   group: 'free',        sub: 'history7' },
  { id: 'sub-sky',          label: 'Subscription → Sky',     group: 'subscription',sub: 'sky' },
  { id: 'sub-resonance',    label: 'Subscription → Resonance',group:'subscription',sub: 'resonance' },
  { id: 'sub-organum',      label: 'Subscription → Organum+',group:'subscription', sub: 'organum_plus' },
  { id: 'sub-brief',        label: 'Subscription → Monthly', group: 'subscription',sub: 'brief' },
  { id: 'sub-freq',         label: 'Subscription → Frequency',group:'subscription',sub: 'freq' },
  { id: 'sub-history-all',  label: 'Subscription → History', group: 'subscription',sub: 'history_all' },
  { id: 'addon-deep',       label: 'Add-on → Deep 26',       group: 'addon',       sub: 'deep' },
  { id: 'addon-mirror',     label: 'Add-on → Mirror',        group: 'addon',       sub: 'mirror' },
  { id: 'addon-pet',        label: 'Add-on → Pet',           group: 'addon',       sub: 'pet' },
  { id: 'addon-companions', label: 'Add-on → Companions',    group: 'addon',       sub: 'companions' },
  { id: 'addon-exercise',   label: 'Add-on → Exercise',      group: 'addon',       sub: 'exercise' },
  { id: 'addon-food',       label: 'Add-on → Food',          group: 'addon',       sub: 'food' },
  { id: 'addon-product',    label: 'Add-on → Product',       group: 'addon',       sub: 'product' },
  { id: 'addon-compat',     label: 'Add-on → Compatibility', group: 'addon',       sub: 'compat' },
  { id: 'premium-generate', label: 'Premium → Generate',     group: 'premium',     sub: 'generate' },
];

async function setLangAndProfile(page, lang) {
  await page.evaluate((l) => {
    try {
      localStorage.setItem('mth_lang', l);
      // Pre-fill a known-good profile so all premium/data-driven tabs render
      localStorage.setItem('mth_dob', '1990-05-15');
      localStorage.setItem('mth_time', '12:00');
      localStorage.setItem('mth_name', 'AuditUser');
      localStorage.setItem('mth_gender', 'ชาย');
      localStorage.setItem('mth_city', '13.75,100.5,7');
    } catch (_) {}
  }, lang);
}

async function dismissOverlay(page) {
  await page.evaluate(() => {
    // Click any "skip" / "ข้ามไปก่อน" button if entry overlay is showing
    const skip = Array.from(document.querySelectorAll('a, button, [onclick]'))
      .find(el => /ข้ามไปก่อน|skip|ลองดู Tab|Take a look/i.test(el.textContent || ''));
    if (skip) skip.click();
  });
}

async function navigateToTab(page, tab) {
  const result = await page.evaluate((t) => {
    try {
      // Switch to group first
      if (typeof setGroup === 'function') {
        setGroup(t.group);
      }
      // Then sub-tab via showSub if available
      if (typeof showSub === 'function') {
        showSub(t.sub);
      } else if (typeof showTab === 'function') {
        showTab(t.sub);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  }, tab);
  await page.waitForTimeout(500);
  return result;
}

function classifyMix(text, mode) {
  // mode = 'en' means we are in EN mode → flag Thai
  // mode = 'th' means we are in TH mode → flag long English words (unless allowed)
  if (mode === 'en') {
    if (!THAI_RE.test(text)) return null;
    // Only flag prose: 4+ Thai chars
    const thaiCount = (text.match(/[฀-๿]/g) || []).length;
    if (thaiCount < 4) return null;
    return 'thai-in-en';
  } else {
    // mode th
    const matches = text.match(/\b[a-zA-Z]{4,}\b/g) || [];
    const offenders = matches.filter(w => !ALLOWED_EN_IN_TH.has(w));
    if (offenders.length === 0) return null;
    // Allow if the line is mostly Thai already (some EN words inline are normal)
    const thaiCount = (text.match(/[฀-๿]/g) || []).length;
    if (thaiCount > offenders.join('').length * 2) return null;
    return 'en-in-th';
  }
}

async function scanCurrentView(page, mode) {
  return await page.evaluate((mode) => {
    const THAI_RE = /[฀-๿]/;
    const EN_WORD_RE = /\b[a-zA-Z]{4,}\b/;
    const ALLOWED = new Set(["Mythsensus","Cosmic","Blueprint","BaZi","Bazi","Vedic","Western","Tarot","Kabbalah","Hellenistic","Norse","Rune","Ogham","Mayan","Aztec","Tonalpohualli","Tzolkin","Tibetan","Zoroastrian","Pythagorean","Onmyodo","Saju","Ifa","Yoruba","Premium","Beta","PDF","HTML","Print","Save","Login","Profile","Sky","Today","Streak","History","Reports","Resonance","Frequency","Organum","Email","OAuth","LINE","Facebook","Google","Skip","Back","Compare","Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces","Wood","Fire","Earth","Metal","Water","Yin","Yang","Star","Path","Tone","Kin","Day","Master","YouTube","Spotify","Instagram","TikTok","Twitter","Om","Namah","Namaha","Brahma","Vishnu","Shiva"]);

    // Walk all visible text nodes inside the main app container
    const offenders = [];
    function isVisible(el) {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      return true;
    }
    function walk(root) {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = w.nextNode())) {
        const txt = (node.textContent || '').trim();
        if (!txt) continue;
        const parent = node.parentElement;
        if (!parent || !isVisible(parent)) continue;
        // skip script/style
        const tn = parent.tagName;
        if (tn === 'SCRIPT' || tn === 'STYLE' || tn === 'NOSCRIPT') continue;
        // classify
        if (mode === 'en') {
          const thaiCount = (txt.match(/[฀-๿]/g) || []).length;
          if (thaiCount < 4) continue;
          offenders.push({
            type: 'thai-in-en',
            tag: tn,
            id: parent.id || '',
            cls: parent.className?.toString?.().slice(0, 80) || '',
            text: txt.slice(0, 200),
          });
        } else {
          const matches = txt.match(/\b[a-zA-Z]{4,}\b/g) || [];
          const bad = matches.filter(w => !ALLOWED.has(w));
          if (bad.length === 0) continue;
          // skip if it's mostly Thai with a few EN words inline
          const thaiCount = (txt.match(/[฀-๿]/g) || []).length;
          if (thaiCount > bad.join('').length * 2) continue;
          // skip pure data values like "Day Master 甲" etc
          offenders.push({
            type: 'en-in-th',
            tag: tn,
            id: parent.id || '',
            cls: parent.className?.toString?.().slice(0, 80) || '',
            text: txt.slice(0, 200),
            badWords: bad.slice(0, 5),
          });
        }
      }
    }
    walk(document.body);
    // Dedupe by text
    const seen = new Set();
    return offenders.filter(o => {
      const key = o.type + '|' + o.text;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, mode);
}

(async () => {
  console.log(`[audit] target = ${URL_ARG}`);
  const browser = await chromium.launch({ headless: true });
  const report = { url: URL_ARG, ts: new Date().toISOString(), modes: {} };

  for (const lang of ['en', 'th']) {
    console.log(`\n========== LANG=${lang.toUpperCase()} ==========`);
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(`try {
      localStorage.setItem('mth_lang','${lang}');
      localStorage.setItem('mth_dob','1990-05-15');
      localStorage.setItem('mth_time','12:00');
      localStorage.setItem('mth_name','AuditUser');
      localStorage.setItem('mth_gender','ชาย');
      localStorage.setItem('mth_city','13.75,100.5,7');
    } catch(_){}`);
    const page = await ctx.newPage();
    page.on('pageerror', e => console.error(`[pageerror ${lang}]`, e.message));
    page.on('console', msg => {
      if (msg.type() === 'error') console.error(`[console.error ${lang}]`, msg.text().slice(0,200));
    });

    try {
      await page.goto(URL_ARG, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      console.error(`[goto fail]`, e.message);
      await ctx.close();
      continue;
    }
    await page.waitForTimeout(1500);
    await dismissOverlay(page);
    await page.waitForTimeout(1000);

    report.modes[lang] = {};
    for (const tab of TABS) {
      const nav = await navigateToTab(page, tab);
      if (!nav.ok) {
        console.log(`[${tab.id}] NAV FAIL: ${nav.err}`);
        report.modes[lang][tab.id] = { error: nav.err };
        continue;
      }
      // Capture screenshot
      const shot = path.join(SCREENSHOT_DIR, `${lang}-${tab.id}.png`);
      try {
        await page.screenshot({ path: shot, fullPage: true });
      } catch (_) {}
      const offenders = await scanCurrentView(page, lang);
      report.modes[lang][tab.id] = {
        label: tab.label,
        screenshot: path.basename(shot),
        offenders,
        count: offenders.length,
      };
      const flag = offenders.length > 0 ? `❌ ${offenders.length}` : '✓';
      console.log(`  [${flag}] ${tab.label}`);
      if (offenders.length > 0 && offenders.length <= 3) {
        for (const o of offenders) {
          console.log(`        · ${o.text.slice(0, 100)}`);
        }
      }
    }
    await ctx.close();
  }

  await browser.close();

  const out = path.join(__dirname, '..', '..', 'audit-bilingual-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\n[audit] report → ${out}`);
  console.log(`[audit] screenshots → ${SCREENSHOT_DIR}/`);

  // Summary
  let totalOffenders = 0;
  for (const lang of Object.keys(report.modes)) {
    for (const tabId of Object.keys(report.modes[lang])) {
      totalOffenders += report.modes[lang][tabId].count || 0;
    }
  }
  console.log(`\n=== TOTAL OFFENDING TEXT NODES: ${totalOffenders} ===`);
  process.exit(totalOffenders > 0 ? 1 : 0);
})();
