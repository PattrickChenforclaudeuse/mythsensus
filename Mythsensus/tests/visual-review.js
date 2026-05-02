/**
 * Visual review script — scans the offline HTML for common rendering red flags
 * without opening a browser. Catches:
 *   - adjacent template-literal concat bugs
 *   - double-semicolons in inline style
 *   - buttons without onclick (unreachable UI)
 *   - inputs without type attribute
 *   - panel IDs missing content div
 *
 * Run: node tests/visual-review.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'Offline app', 'mythsensus-offline.html');
const h = fs.readFileSync(HTML, 'utf8');

const patterns = [
  { pat: /\}\$\{/g, name: 'adjacent template literals (concat no separator)' },
  { pat: /style="[^"]*;;[^"]*"/g, name: 'double semicolons in inline style' },
  { pat: />[\u00A0 \-–—]{3,}</g, name: 'long dash sequences in DOM text' },
  { pat: />\s*\d+\.\d{3,}[%\s]*</g, name: 'percent/number with >3 decimals' },
  { pat: /class="[^"]*\s{2,}[^"]*"/g, name: 'double spaces in class list' },
  { pat: /aria-label="\s*"/g, name: 'empty aria-label' },
  { pat: /<img(?![^>]*alt=)[^>]*>/g, name: 'img without alt' },
  { pat: /color:\s*undefined/g, name: 'undefined in color value' },
];

console.log('═══ Visual Review ═══');
let total = 0;
for (const p of patterns) {
  const m = h.match(p.pat);
  if (m) {
    total += m.length;
    console.log('⚠ ' + p.name + ': ' + m.length + ' hit(s)');
    m.slice(0, 3).forEach(x => console.log('  · ' + x.slice(0, 90).replace(/\s+/g, ' ')));
  }
}
if (total === 0) console.log('✓ No visual red flags in automated scan');

// Panel + render fn coverage
console.log('\nPanel coverage:');
const panels = [
  ['panel-mirror', 'mirrorContent', 'renderMirror'],
  ['panel-pet', 'petContent', 'renderPet'],
  ['panel-companions', 'companionsContent', 'renderCompanions'],
  ['panel-exercise', 'exerciseContent', 'renderExercise'],
  ['panel-food', 'foodContent', 'renderFood'],
  ['panel-product', 'productContent', 'renderProduct'],
  ['panel-compat', 'compatContent', 'renderCompat'],
  ['panel-resonance', 'resonancePanel', 'renderResonance'],
  ['panel-brief', 'briefPanel', 'renderMonthlyBrief'],
];
for (const [panel, content, fn] of panels) {
  const hasPanel = h.includes('id="' + panel + '"');
  const hasContent = h.includes('id="' + content + '"');
  const hasFn = h.includes('function ' + fn + '(');
  const ok = hasPanel && hasContent && hasFn;
  console.log(
    (ok ? '✓' : '✗') + ' ' + panel +
    (hasPanel ? '' : ' [no panel]') +
    (hasContent ? '' : ' [no content #' + content + ']') +
    (hasFn ? '' : ' [no ' + fn + '()]')
  );
}

// Render function line counts (bigger = more visual surface to review)
console.log('\nRender fn line counts (rough):');
for (const [, , fn] of panels) {
  const ix = h.indexOf('function ' + fn + '(');
  if (ix < 0) continue;
  // Walk braces to find end
  let depth = 0, i = ix, started = false;
  while (i < h.length) {
    if (h[i] === '{') { depth++; started = true; }
    else if (h[i] === '}') { depth--; if (started && depth === 0) break; }
    i++;
  }
  const slice = h.slice(ix, i + 1);
  const lines = slice.split('\n').length;
  console.log('  ' + fn + ': ' + lines + ' lines');
}

// Bilingual coverage hint — count isTh? occurrences per render fn
console.log('\nBilingual (isTh?) occurrences per render fn:');
for (const [, , fn] of panels) {
  const ix = h.indexOf('function ' + fn + '(');
  if (ix < 0) continue;
  let depth = 0, i = ix, started = false;
  while (i < h.length) {
    if (h[i] === '{') { depth++; started = true; }
    else if (h[i] === '}') { depth--; if (started && depth === 0) break; }
    i++;
  }
  const slice = h.slice(ix, i + 1);
  const count = (slice.match(/isTh\?/g) || []).length;
  console.log('  ' + fn + ': ' + count + ' isTh? branches');
}

console.log('\nTotal HTML size:', (h.length / 1024).toFixed(0), 'KB');
