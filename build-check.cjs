#!/usr/bin/env node
/**
 * predeploy-check.cjs — the gate that would have stopped the 2026-08-15 outage.
 *
 * WHAT HAPPENED: a one-character edit to index.html left a stray "}" that closed
 * drawBlessing()'s try block early. `try` with no catch/finally is a PARSE error,
 * so the browser threw away the entire inline script — every button on the landing
 * page went dead while the server still answered 200. It shipped, and stayed live
 * for four and a half hours.
 *
 * WHY THIS EXISTS SEPARATELY FROM qa-scanner.js: the scanner already catches this
 * (it listens for pageerror and hard-fails), but it drives a real browser against
 * the DEPLOYED site — it can only tell you after the damage is public. This check
 * is static, needs no browser, runs in well under a second, and refuses to let the
 * broken file leave the machine.
 *
 * Run: node Mythsensus/tests/predeploy-check.cjs
 * Wired as the npm "predeploy" hook, so `npm run deploy` runs it automatically.
 */
const fs = require('fs');
const path = require('path');

// Lives at the repo root on purpose: /Mythsensus/tests/ is in .vercelignore, so a
// checker parked there never reaches Vercel's build container and the gate silently
// does nothing server-side. Root keeps it inside the uploaded file set.
const ROOT = __dirname;
const failures = [];
const notes = [];

// ── 1. Every inline <script> must parse ────────────────────────────────────────
// JSON-LD blocks are DATA, not code: parsing them with new Function() reports
// bogus "Unexpected token ':'" failures, so route them to JSON.parse instead.
function checkScripts(file) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  let js = 0, json = 0;

  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || '';
    const body = m[2];
    if (/\ssrc\s*=/.test(attrs)) continue;            // external file, nothing to parse here
    const line = html.slice(0, m.index).split('\n').length;

    if (/type\s*=\s*["'][^"']*json/i.test(attrs)) {
      json++;
      try { JSON.parse(body); }
      catch (e) { failures.push(`${rel}:${line} — JSON-LD block is invalid: ${e.message}`); }
      continue;
    }

    js++;
    try { new Function(body); }
    catch (e) { failures.push(`${rel}:${line} — inline script does not parse: ${e.message}`); }
  }
  notes.push(`${rel}: ${js} inline JS block(s), ${json} JSON-LD block(s)`);
  return html;
}

// ── 2. Functions the landing page cannot live without ─────────────────────────
// A parse error anywhere in the big script takes ALL of these down at once, so a
// missing name is the same signal as a syntax error — caught either way. Listing
// them also guards against an edit that deletes or renames one by accident.
const REQUIRED = [
  'entryDrawFirst',   // the single dominant CTA on the entry overlay
  'drawBlessing',     // the free daily draw
  'calcChart',        // the 26-system reading (the monetised path)
  '_shareCardImage',  // share-the-card
  '_msTrack',         // analytics — silent loss here makes every funnel read wrong
];

function checkRequired(html) {
  for (const name of REQUIRED) {
    // Covers the four shapes actually used in this file: `function x(`,
    // `const/let/var x =`, `x = function|(`, and `window.x =` (how _msTrack is bound).
    const declared = new RegExp(
      `(function\\s+${name}\\s*\\()|((const|let|var)\\s+${name}\\s*=)|(\\b${name}\\s*=\\s*(function|\\())|(window\\.${name}\\s*=)`
    ).test(html);
    if (!declared) failures.push(`index.html — required global "${name}" is no longer declared`);
  }
}

const indexPath = path.join(ROOT, 'index.html');
const html = checkScripts(indexPath);
checkRequired(html);

// ── No Thai on the English side ───────────────────────────────────────────────
// Director's rule (2026-08-23): English words inside Thai copy are fine — the
// audience reads "Nine Star Ki" and "Cosmic Score" as names. Thai reaching an
// English reader is not fine, and it is invisible to anyone testing in Thai.
// One entry had been sitting in TX.en for months (lucky_title), and four other
// keys had the two languages swapped outright, which nothing caught because
// both tables were complete and every value was a valid string.
//
// The language switcher is the deliberate exception: it must say "ไทย" to an
// English reader, or they cannot tell what pressing it does.
function checkEnglishTableIsEnglish(html) {
  const lines = html.split(/\r?\n/);
  const enStart = lines.findIndex(l => /^en:\{/.test(l.trim()));
  const thStart = lines.findIndex((l, i) => i > enStart && /^th:\{/.test(l.trim()));
  if (enStart < 0 || thStart < 0) {
    notes.push('i18n: could not locate TX.en / TX.th — skipped the Thai-leak check');
    return;
  }
  const THAI = /[\u0E00-\u0E7F]/;
  const KV = /([a-z0-9_]+)\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  const ALLOW = new Set(['lang_switch', 'lang_th', 'lang_name_th']);
  let found = 0;
  for (let i = enStart + 1; i < thStart; i++) {
    KV.lastIndex = 0;
    let m;
    while ((m = KV.exec(lines[i] || ''))) {
      if (ALLOW.has(m[1])) continue;
      if (THAI.test(m[2])) {
        found++;
        failures.push('index.html:' + (i + 1) + ' — TX.en."' + m[1] + '" contains Thai: ' + m[2].slice(0, 60));
      }
    }
  }
  if (!found) notes.push('i18n: TX.en carries no Thai');
}
checkEnglishTableIsEnglish(html);

// ── report ────────────────────────────────────────────────────────────────────
for (const n of notes) console.log('  ' + n);

if (failures.length) {
  console.error(`\n✗ predeploy check FAILED — ${failures.length} problem(s), nothing was deployed:\n`);
  for (const f of failures) console.error('  - ' + f);
  console.error('\nFix the file and run again. Do NOT deploy past this.');
  process.exit(1);
}

console.log('\n✓ predeploy check passed — all inline scripts parse, all required globals present');
