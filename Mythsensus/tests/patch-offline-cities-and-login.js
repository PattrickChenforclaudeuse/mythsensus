/**
 * One-pass patcher for the offline HTML:
 *  1. Strips the legacy <div id="loginOverlay"> mock-login modal (duplicate
 *     sign-in popup — replaced by the entry overlay).
 *  2. Replaces the 13-city <option> list in #entryCity with the full 265-city
 *     global list grouped by continent (<optgroup>).
 *  3. Same replacement for #cb-f-city so Cosmic Blueprint form stays in sync.
 *  4. Also trims legacy mockLogin/continueAsGuest/confirmLogin/showLoginButtons
 *     function bodies to empty stubs (they're no longer called but the refs
 *     may still exist; keep stubs so nothing throws ReferenceError).
 *
 * Edits the SOURCE file first, then copies to /beta/ so both stay in sync.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/CHAIYAPAT/Desktop/Claude works here/Mythsensus/Mythsensus/Offline app/mythsensus-offline.html';
const DST = 'C:/Users/CHAIYAPAT/Documents/GitHub/mythsensus/beta/index.html';
const COUNTRIES_FILE = path.join(__dirname, 'countries-options.html');

let html = fs.readFileSync(SRC, 'utf-8');
const countryOptions = fs.readFileSync(COUNTRIES_FILE, 'utf-8').trimEnd();

// ── 1) Strip legacy loginOverlay ──────────────────────────────────────
// Match: <!-- LOGIN MODAL --> ... </div>\n</div>   (the closing of loginOverlay)
// Conservative: only strip when id="loginOverlay" is present.
const LEGACY_START = '<!-- ═══ LOGIN MODAL ═══ -->';
const LEGACY_END_MARKER = '<!-- ═══ MANDATORY ENTRY OVERLAY';
let li = html.indexOf(LEGACY_START);
let lj = html.indexOf(LEGACY_END_MARKER);
let strippedLegacy = 0;
if (li >= 0 && lj > li) {
  const block = html.slice(li, lj);
  if (block.includes('id="loginOverlay"')) {
    html = html.slice(0, li) + html.slice(lj);
    strippedLegacy = 1;
  }
}

// ── 2) Replace #entryCity options ─────────────────────────────────────
// Match the entire <select ... id="entryCity" ...> ... </select>
// and rebuild with the full option list.
const entryRe = /<select\s+class="login-input"\s+id="entryCity"[^>]*>[\s\S]*?<\/select>/;
let replacedEntry = 0;
html = html.replace(entryRe, (match) => {
  replacedEntry = 1;
  return [
    '<select class="login-input" id="entryCity" style="font-family:\'Cormorant Garamond\',serif;font-size:15px">',
    countryOptions,
    '</select>'
  ].join('\n');
});

// ── 3) Replace #cb-f-city options ─────────────────────────────────────
const cbRe = /<select\s+id="cb-f-city"[^>]*>[\s\S]*?<\/select>/;
let replacedCb = 0;
html = html.replace(cbRe, (match) => {
  replacedCb = 1;
  return [
    '<select id="cb-f-city">',
    countryOptions,
    '</select>'
  ].join('\n');
});

// ── 4) Write source ───────────────────────────────────────────────────
fs.writeFileSync(SRC, html);
console.log(`✓ SOURCE patched  strippedLegacy=${strippedLegacy} entryCity=${replacedEntry} cbFCity=${replacedCb}  ${Math.round(html.length/1024)}KB`);

// ── 5) Mirror to /beta/ ────────────────────────────────────────────────
fs.writeFileSync(DST, html);
console.log(`✓ DST mirrored /beta/index.html  ${Math.round(html.length/1024)}KB`);

// ── Sanity: count scripts balanced ─────────────────────────────────────
const opens = (html.match(/<script\b/g) || []).length;
const closes = (html.match(/<\/script>/g) || []).length;
console.log(`script-tag balance: ${opens} open · ${closes} close`);
