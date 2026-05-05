'use strict';
/**
 * One-shot migration: replace the 3 long <select> city pickers in index.html
 * with searchable <input list> + <datalist> pattern.
 *
 * Before: <select id="entryCity">… 265 <option value="lat,lon,tz">Name</option> …</select>
 * After:  <input id="entryCity-search" list="ms-cities-datalist" …>
 *         <input type="hidden" id="entryCity" value="13.75,100.5,7">
 *
 * The shared <datalist id="ms-cities-datalist"> is added once near the body.
 * The MS_CITIES master array + initCitiesDatalist() / wireCitySearch() helpers
 * are added near the top of the inline script so they run before any picker
 * is interacted with.
 *
 * Idempotent: if MS_CITIES is already present, we skip data injection.
 *
 * Run: node Mythsensus/tests/migrate-city-pickers.cjs
 */
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', '..', 'index.html');
const CITIES_JS_PATH = path.join(__dirname, 'cities-extracted.js');

let html = fs.readFileSync(HTML_PATH, 'utf8');
const sizeBefore = html.length;

const cityIds = ['entryCity', 'profCity', 'cb-f-city'];
const replacementFor = (id) => {
  // Style hint:
  //   entryCity uses class="login-input" + a font-family override (matches the entry overlay form)
  //   profCity has no class (matches the profile-tab styling that targets bare <input>)
  //   cb-f-city has no class (matches the Cosmic Blueprint form)
  // Default the hidden field's value to Bangkok so cb_generate has something
  // to fall back on; the visible search input is initially blank.
  const placeholder = "พิมพ์ค้นหาเมือง / Type to search city";
  if (id === 'entryCity') {
    return `<input class="login-input" id="entryCity-search" list="ms-cities-datalist" placeholder="${placeholder}" autocomplete="off" style="font-family:'Cormorant Garamond','Songti SC','PingFang SC','Microsoft YaHei','Sarabun',serif;font-size:15px">\n      <input type="hidden" id="entryCity" value="13.75,100.5,7">`;
  }
  return `<input id="${id}-search" list="ms-cities-datalist" placeholder="${placeholder}" autocomplete="off">\n        <input type="hidden" id="${id}" value="13.75,100.5,7">`;
};

let replaced = 0;
for (const id of cityIds) {
  // Match the entire <select id="X">…</select> block, possibly multi-line, possibly with class/style attrs.
  const re = new RegExp(`<select\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?<\\/select>`, 'g');
  const after = html.replace(re, () => {
    replaced++;
    return replacementFor(id);
  });
  if (after === html) {
    console.warn(`  ⚠️  No <select id="${id}"> found — already migrated?`);
  }
  html = after;
}

// Add the shared datalist after </header> or before </body> if not already present.
if (!html.includes('id="ms-cities-datalist"')) {
  // Insert just before the first inline <script> so it's parsed before init JS runs.
  // index.html has no separate body section; find the first script tag.
  html = html.replace(
    /(<script\b)/,
    '<datalist id="ms-cities-datalist"><!-- populated by initCitiesDatalist() at runtime --></datalist>\n$1',
  );
  console.log('  ✓ injected <datalist id="ms-cities-datalist">');
}

// Inject the MS_CITIES const + helpers once, near the top of the first inline <script>.
if (!html.includes('const MS_CITIES =')) {
  const citiesJs = fs.readFileSync(CITIES_JS_PATH, 'utf8');
  const helpers = `
// ── City picker (searchable) ──────────────────────────────────────
${citiesJs}
const MS_CITY_COORDS = Object.fromEntries(MS_CITIES.map(c => [c.n, c.v]));
function initCitiesDatalist() {
  const dl = document.getElementById('ms-cities-datalist');
  if (!dl || dl.children.length > 1) return; // already populated (>1 because of the placeholder comment node)
  dl.innerHTML = MS_CITIES.map(c => '<option value="' + c.n.replace(/"/g, '&quot;') + '">').join('');
}
function wireCitySearch(searchId, hiddenId) {
  const search = document.getElementById(searchId);
  const hidden = document.getElementById(hiddenId);
  if (!search || !hidden) return;
  // Prefill the search box with whichever city corresponds to the hidden
  // coord value (so on reload, the user sees "Bangkok, Thailand", not blank).
  if (hidden.value && !search.value) {
    const found = MS_CITIES.find(c => c.v === hidden.value);
    if (found) search.value = found.n;
  }
  const sync = () => {
    const v = search.value.trim();
    const coords = MS_CITY_COORDS[v];
    if (coords) hidden.value = coords;
    // If user typed a non-matching string we DON'T overwrite hidden — keeps the
    // last valid coords as a safety net (cb_generate's NaN-fallback covers
    // genuinely corrupted state too).
  };
  search.addEventListener('input', sync);
  search.addEventListener('change', sync);
  search.addEventListener('blur', sync);
}
// Run once DOM is ready. We piggy-back on existing app boot via DOMContentLoaded.
if (document.readyState !== 'loading') {
  initCitiesDatalist();
  ['entryCity', 'profCity', 'cb-f-city'].forEach(id => wireCitySearch(id + '-search', id));
} else {
  document.addEventListener('DOMContentLoaded', () => {
    initCitiesDatalist();
    ['entryCity', 'profCity', 'cb-f-city'].forEach(id => wireCitySearch(id + '-search', id));
  });
}
// ── /City picker ──────────────────────────────────────────────────
`;
  // Inject helpers right after the opening <script> tag of the FIRST inline script
  // that lives in the body (looking for /Mythsensus/ or similar marker).
  // Fallback: just append to first <script>…</script> body.
  const firstScriptMatch = /(<script>)([\s\S]{0,40})/.exec(html);
  if (firstScriptMatch) {
    html = html.replace(firstScriptMatch[0], firstScriptMatch[0].replace('<script>', '<script>' + helpers));
    console.log('  ✓ injected MS_CITIES + initCitiesDatalist + wireCitySearch helpers');
  } else {
    console.warn('  ⚠️ Could not find <script> to inject helpers');
  }
}

const sizeAfter = html.length;
const delta = sizeAfter - sizeBefore;
fs.writeFileSync(HTML_PATH, html);
console.log(`\nReplaced ${replaced} city <select> blocks`);
console.log(`File size: ${sizeBefore} → ${sizeAfter} bytes (Δ ${delta > 0 ? '+' : ''}${delta})`);
