/**
 * Report integrity — the sweep that spot-checking is not.
 *
 * 2026-08-31: the director opened the report, pointed at a card, and found a
 * defect. Then another. Then another — a fire icon on a wood element, a header
 * promising 26 traditions above an answer from 5, a poetic "cosmic entity" with
 * no explanation, an Aztec day 23 days from the Maya day it claims to BE.
 * Each one got patched individually, and the next page still had one.
 *
 * Opening pages one at a time only ever finds the defect you were pointed at.
 * This file asserts the CLASSES those defects belong to, across a spread of
 * charts, so the count converges to zero instead of shifting around.
 *
 * Every check here failed on the report as it stood when the file was written.
 * A check that cannot go red teaches people to stop reading red.
 */
'use strict';

const path = require('path');
const { calculate } = require(path.join(__dirname, '..', 'build', 'calc.js'));
const { generateReport } = require(path.join(__dirname, '..', 'build', 'report.js'));

const CHARTS = [
  { name: 'PK CHU',   gender: 'ชาย',  year: 1991, month: 2,  day: 3,  hour: 5,  minute: 6,  lat: 13.75, lon: 100.5, timezone: 7 },
  { name: 'Yin-male', gender: 'ชาย',  year: 1975, month: 9,  day: 21, hour: 14, minute: 10, lat: 51.5,  lon: -0.12, timezone: 0 },
  { name: 'Yang-fem', gender: 'หญิง', year: 2000, month: 6,  day: 30, hour: 8,  minute: 0,  lat: -33.9, lon: 151.2, timezone: 10 },
  { name: 'Dec-Zi',   gender: 'หญิง', year: 1969, month: 12, day: 15, hour: 19, minute: 55, lat: 35.7,  lon: 139.7, timezone: 9 },
  { name: 'Leap-day', gender: 'ชาย',  year: 1996, month: 2,  day: 29, hour: 0,  minute: 20, lat: 40.7,  lon: -74.0, timezone: -5 },
];

const failures = [];
const fail = (chart, cls, msg) => failures.push({ chart, cls, msg });

const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<[^>]+>/g, ' ')
  // Decode one level. `&amp;` in the source is the correct way to write "&";
  // what must not survive is a SECOND level (`&amp;lt;`), which is a real
  // double-encode that reaches the reader as visible markup.
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ');

// Page-by-page so a failure can name where to look.
const pagesOf = (html) => {
  const clean = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  return clean.split(/(?=<div class="page")/).filter(p => p.startsWith('<div class="page"')).map((p, i) => {
    const hd = /<div class="page-header"[^>]*>([\s\S]*?)<\/div>/.exec(p);
    const body = /<div class="page-body"[^>]*>([\s\S]*)/.exec(p);
    const clip = (x) => x.replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ');
    // Same body, but with block boundaries preserved. Without this, adjacent
    // paragraphs merge into one run and every length measurement is fiction.
    const blocks = body
      ? body[1].replace(/<\/(div|p|li|td|tr|h[1-6])>|<br\s*\/?>/g, '\n')
               .replace(/<[^>]+>/g, ' ')
               .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
               .split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean)
      : [];
    return {
      n: i + 1,
      title: hd ? clip(hd[1]).trim() : '',
      text: body ? clip(body[1]) : '',
      blocks,
      html: p,
    };
  });
};

// ── A · nothing from the program may reach the page ────────────────────────
const CODE_ARTEFACTS = [
  ['undefined',        /\bundefined\b/],
  ['[object Object]',  /\[object Object\]/],
  ['NaN',              /\bNaN\b/],
  ['raw ternary',      /\?'[^']{3,}':'/],
  ['js member access', /\b[a-z]+\.[a-z]+\.includes\(/i],
  ['unclosed template',/\$\{/],
  // (html-entity double-encoding is checked against raw HTML below, not here —
  //  a single `&lt;` is correct HTML and renders as "<")
  ['variable name',    /\b[A-Z]{2,}_[A-Z]{2,}\b/],
];

// ── B · a sentence cut mid-word reads as a broken page ─────────────────────
const MIDWORD_CUT = /[ก-ฮa-zA-Z0-9]…/;

// ── C · the same word twice from string concatenation ──────────────────────
const DUPLICATE_WORD = /\b(วัน|Authority|Clan|Star|ดาว)\s*\1\b/;

// ── D · claims that outrun the evidence printed beside them ────────────────
// A universal word is only a false claim when it is bolted to AGREEMENT.
// "ทุกศาสตร์มองธาตุจากมุมของตัวเอง" (each reads it its own way) is an
// explanation and passes; "ทุกศาสตร์สะท้อน / ฉายภาพเดียวกัน" is a claim about
// unanimity and has to match the badge printed beside it.
const AGREE = 'สะท้อน|เห็นตรงกัน|ยืนยัน|ฉายภาพเดียวกัน|ตรงกัน|พูดเหมือนกัน|reflects?|agree';
const OVERCLAIM = new RegExp('(?<!เกือบ)(?<!almost )(?<!nearly )(ทุกศาสตร์|ทุกสาย|ทั้ง 26 ศาสตร์|all 26|every system)[^.·]{0,40}(' + AGREE + ')');

const FIVE_ELEMENTS = ['ไฟ', 'ไม้', 'น้ำ', 'โลหะ', 'ดิน'];
const ELEMENT_ICON = { 'ไฟ': '🔥', 'ไม้': '🌳', 'น้ำ': '🌊', 'โลหะ': '⚙️', 'ดิน': '⛰️' };

for (const input of CHARTS) {
  const name = input.name;
  const c = calculate(input);
  const html = generateReport(c);
  const text = strip(html);
  const pages = pagesOf(html);

  // A · code artefacts
  for (const [label, re] of CODE_ARTEFACTS) {
    for (const p of pages) {
      const m = re.exec(p.text);
      if (m) { fail(name, 'A code-leak', `p${p.n} "${label}" → …${p.text.slice(Math.max(0, m.index - 40), m.index + 40).trim()}…`); break; }
    }
  }

  // A2 · double-encoded entities reach the reader as visible markup
  for (const p of pages) {
    const m = /&amp;(amp|lt|gt|quot|#\d+);/.exec(p.html);
    if (m) fail(name, 'A code-leak', `p${p.n} double-encoded "${m[0]}"`);
  }

  // B · mid-word truncation
  for (const p of pages) {
    const m = MIDWORD_CUT.exec(p.text);
    if (m) fail(name, 'B midword-cut', `p${p.n} → …${p.text.slice(Math.max(0, m.index - 45), m.index + 15).trim()}`);
  }

  // C · doubled words
  for (const p of pages) {
    const m = DUPLICATE_WORD.exec(p.text);
    if (m) fail(name, 'C doubled-word', `p${p.n} "${m[0]}"`);
  }

  // D · "every tradition agrees" printed next to a count that is not 26
  for (const p of pages) {
    if (!OVERCLAIM.test(p.text)) continue;
    const counts = [...p.text.matchAll(/(\d+)\s*ศาสตร์/g)].map(m => +m[1]).filter(n => n < 26);
    if (counts.length) {
      fail(name, 'D overclaim', `p${p.n} says "ทุกศาสตร์/all 26" beside a badge of ${counts[0]}`);
    }
  }

  // E · an element headline must not carry another element's icon
  for (const p of pages) {
    for (const el of FIVE_ELEMENTS) {
      const re = new RegExp('(.)\\s*ธาตุ' + el + '\\b');
      const m = re.exec(p.text);
      if (!m) continue;
      const icon = m[1];
      const wrong = Object.entries(ELEMENT_ICON).find(([e, ic]) => ic === icon && e !== el);
      if (wrong) fail(name, 'E icon-mismatch', `p${p.n} "${icon} ธาตุ${el}" — ${icon} is the ${wrong[0]} icon`);
    }
  }

  // F · the four declared twin pairs must actually agree
  //     The consensus page tells the reader these are one calculation under two
  //     names and counts them as a single voice. If they disagree, that page is
  //     making a promise the engine does not keep.
  const mayaPos = (c.mayan.kin - 1) % 20;
  const aztecSignName = String(c.aztec.daySignTh || '');
  const AZTEC_ORDER = ['จระเข้','ลม','บ้าน','จิ้งจก','งู','ความตาย','กวาง','กระต่าย','น้ำ','สุนัข','ลิง','หญ้า','อ้อ','เสือจากัวร์','นกอินทรี','แร้ง','แผ่นดินไหว','หินเหล็กไฟ','ฝน','ดอกไม้'];
  const aztecPos = AZTEC_ORDER.indexOf(aztecSignName);
  if (aztecPos >= 0 && aztecPos !== mayaPos) {
    fail(name, 'F twin-drift', `Maya position ${mayaPos + 1} vs Aztec position ${aztecPos + 1} — the report calls these one calendar`);
  }
  if (c.aztec.toneNumber !== c.mayan.toneNumber) {
    fail(name, 'F twin-drift', `Maya tone ${c.mayan.toneNumber} vs Aztec tone ${c.aztec.toneNumber}`);
  }

  // G · the nine-star year must be one number across every page that prints it
  const starClaims = [...text.matchAll(/2026[^0-9]{0,12}Star\s*(\d)|2026:(\d)/g)]
    .map(m => +(m[1] || m[2])).filter(Boolean);
  const uniqueStars = [...new Set(starClaims)];
  if (uniqueStars.length > 1) {
    fail(name, 'G star-disagree', `2026 nine-star printed as ${uniqueStars.join(' and ')} on different pages`);
  }

  // I · a verdict may not cite as its authority a lineage that voted the other
  //     way. The tempo axis said "we call it INITIATE, and we lean on Human
  //     Design because its doctrine is about exactly this" — on charts where
  //     Human Design had voted WAIT and sat in the dissent list two lines below.
  for (const p of pages) {
    if (!/คำตัดสิน: "?(เริ่มเองได้|รอสัญญาณก่อน)/.test(p.text)) continue;
    const call = /คำตัดสิน: "?(เริ่มเองได้|รอสัญญาณก่อน)/.exec(p.text)[1];
    const leansOnHD = /Human Design เป็นสายที่มีวิชา/.test(p.text);
    if (!leansOnHD) continue;
    const hdSaysWait = /Human Design[^·]{0,60}(รอตอบสนอง|ตอบสนอง แล้วแจ้ง)/.test(p.text);
    const hdVoteMatchesCall = hdSaysWait ? call === 'รอสัญญาณก่อน' : call === 'เริ่มเองได้';
    if (!hdVoteMatchesCall) {
      fail(name, 'I authority-dissents', `p${p.n} calls "${call}" and cites Human Design as the reason, but Human Design voted the other way`);
    }
  }

  // H · one book, one instruction about which element to strengthen
  const boost = new Set();
  for (const m of text.matchAll(/เสริมธาตุ\s*([ก-ฮ]+)/g)) if (FIVE_ELEMENTS.includes(m[1])) boost.add(m[1]);
  if (boost.size > 1) {
    fail(name, 'H advice-conflict', `the report tells the reader to strengthen ${[...boost].join(' and ')}`);
  }
}

// ═══ J/K/L · can a person actually read it ═════════════════════════════════
// These three are why the director could not follow the redraft. They are not
// about tone; they are about a reader hitting a wall.
const CJK = /[\u4e00-\u9fff]+/g;
const SENTENCE_CAP = 300;   // characters. Median in the report was 140, worst 1511.

for (const input of CHARTS) {
  const name = input.name;
  const c = calculate(input);
  const html = generateReport(c);
  const pages = pagesOf(html);

  // J · a Chinese term with no gloss is a wall for a Thai reader. A gloss is a
  //     Thai or Latin reading in brackets within a few characters of the term.
  for (const p of pages) {
    for (const m of p.text.matchAll(CJK)) {
      const after = p.text.slice(m.index + m[0].length, m.index + m[0].length + 46);
      const before = p.text.slice(Math.max(0, m.index - 46), m.index);
      const glossed = /[（(][^)）]{2,44}[)）]/.test(after) || /[（(][^)）]{2,44}[)）]\s*$/.test(before);
      // CJK terms hold no regex metacharacters, so a plain lookup is both
      // correct and unbreakable.
      // A term written INSIDE brackets right after a Thai or Latin name is
      // already explained by that name: "BaZi สี่เสา (八字)" needs nothing more.
      // Some passages translate the term inline without brackets
      // ("偏印 ความรู้นอกตำรา"). The reader is told either way.
      const thaiFollows = /^[\s—·:]*[฀-๿]{2,}/.test(p.text.slice(m.index + m[0].length, m.index + m[0].length + 40));
      const bracketedAfterLabel = /[（(][^)）]{0,22}$/.test(p.text.slice(Math.max(0, m.index - 24), m.index));
      const glossedElsewhereOnPage = p.text.includes(m[0] + ' (') || p.text.includes(m[0] + '(');
      if (!glossed && !glossedElsewhereOnPage && !bracketedAfterLabel && !thaiFollows) {
        fail(name, 'J unglossed-CJK', `p${p.n} "${m[0]}" with no reading beside it → …${p.text.slice(Math.max(0, m.index - 30), m.index + 34).trim()}…`);
        break;   // one per page is enough to send someone to the page
      }
    }
  }

  // K · a sentence nobody finishes
  for (const p of pages) {
    const sents = p.blocks.flatMap(b => b.split(/[·।]|\. /)).map(x => x.trim())
      .filter(x => /[\u0E00-\u0E7F]/.test(x))
      // Grids reduce to long runs of digits and single glyphs once the tags
      // are gone. Those are not sentences and nobody reads them as sentences.
      .filter(x => (x.replace(/[^0-9]/g, '').length / x.length) < 0.12)
      .filter(x => ((x.match(/[\u0E00-\u0E7F]/g) || []).length / x.length) > 0.45);
    const worst = sents.sort((a, b) => b.length - a.length)[0];
    if (worst && worst.length > SENTENCE_CAP) {
      fail(name, 'K long-sentence', `p${p.n} ${worst.length} chars (cap ${SENTENCE_CAP}) → ${worst.slice(0, 60)}…`);
    }
  }

  // L · Thai in the English edition. A buyer in English paid for English.
  const en = generateReport(calculate({ ...input, lang: 'en' }));
  const enText = strip(en);
  const thai = [...enText.matchAll(/[\u0E00-\u0E7F]+/g)].map(m => m[0]);
  if (thai.length) {
    const uniq = [...new Set(thai)];
    fail(name, 'L thai-in-english', `${thai.length} Thai runs in the EN report (${uniq.length} distinct): ${uniq.slice(0, 8).join(' · ')}`);
  }
}

// ═══ M · the theme may not depend on the chart ═════════════════════════════
{
  const palettes = CHARTS.map(input => {
    const html = generateReport(calculate(input));
    return { name: input.name, set: new Set((html.match(/#[0-9a-fA-F]{6}/g) || []).map(x => x.toLowerCase())) };
  });
  const base = palettes[0];
  for (const p of palettes.slice(1)) {
    const extra = [...p.set].filter(x => !base.set.has(x));
    const missing = [...base.set].filter(x => !p.set.has(x));
    if (extra.length || missing.length) {
      fail(p.name, 'M theme-drift',
        `palette differs from ${base.name} by ${extra.length + missing.length} colours ` +
        `(${[...extra, ...missing].slice(0, 6).join(' ')}) — answers and glyphs may change per chart, the theme may not`);
    }
  }
}

// ── report ─────────────────────────────────────────────────────────────────
const W = '═'.repeat(55);
console.log('\n' + W);
console.log(' REPORT INTEGRITY — ' + CHARTS.length + ' charts, 8 defect classes');
console.log(W);

if (!failures.length) {
  console.log(' ✓ PASS — no class of defect found\n');
  process.exit(0);
}

const byClass = {};
for (const f of failures) (byClass[f.cls] = byClass[f.cls] || []).push(f);
for (const cls of Object.keys(byClass).sort()) {
  console.log('\n ' + cls + ' — ' + byClass[cls].length);
  for (const f of byClass[cls].slice(0, 6)) console.log('   [' + f.chart + '] ' + f.msg);
  if (byClass[cls].length > 6) console.log('   … +' + (byClass[cls].length - 6) + ' more');
}
console.log('\n ✗ FAIL — ' + failures.length + ' findings across ' + Object.keys(byClass).length + ' classes\n');
process.exit(1);
