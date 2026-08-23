// Fix unescaped nested quotes in region-6 JSON output by replacing
// inner straight double-quote pairs with Thai/curly quotes (“ ”).
// Applies to all *-with-history.json files in this folder so we
// handle every region's potential quote issues, not just region-6.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('-with-history.json')).sort();

function fixQuotes(raw) {
  // Strategy: walk the text. We track whether we're inside a JSON string
  // (delimited by unescaped "). Within a string, when we encounter another
  // unescaped " that is NOT followed by JSON structural chars (, } ] : space + ,),
  // it's a nested quote — replace with curly. Alternate “ and ” as we go.
  const out = [];
  let inStr = false;
  let openCurly = true; // next curly to write: “ first, ” second
  let prev = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const next = raw[i+1] || '';
    if (!inStr) {
      if (c === '"' && prev !== '\\') {
        inStr = true;
        openCurly = true;
        out.push(c);
      } else {
        out.push(c);
      }
    } else {
      // Inside a string
      if (c === '"' && prev !== '\\') {
        // Is this the END of the string? Heuristic: next non-space char
        // is one of: , } ] : (or EOF)
        let j = i + 1;
        while (j < raw.length && (raw[j] === ' ' || raw[j] === '\t' || raw[j] === '\n' || raw[j] === '\r')) j++;
        const after = raw[j] || '';
        const isStringEnd = after === ',' || after === '}' || after === ']' || after === ':' || j >= raw.length;
        if (isStringEnd) {
          inStr = false;
          out.push(c);
        } else {
          // It's a nested quote within the string — convert to curly
          out.push(openCurly ? '“' : '”');
          openCurly = !openCurly;
        }
      } else {
        out.push(c);
      }
    }
    prev = c;
  }
  return out.join('');
}

for (const f of files) {
  const p = path.join(dir, f);
  const raw = fs.readFileSync(p, 'utf8');
  try {
    JSON.parse(raw);
    console.log(f, '· OK, no fix needed');
    continue;
  } catch (e) {
    const fixed = fixQuotes(raw);
    try {
      const parsed = JSON.parse(fixed);
      fs.writeFileSync(p, fixed);
      console.log(f, '· FIXED ·', parsed.length, 'sites');
    } catch (e2) {
      console.log(f, '· STILL BROKEN:', e2.message);
      const m = e2.message.match(/position (\d+)/);
      if (m) {
        const pos = +m[1];
        console.log('  context:', JSON.stringify(fixed.slice(Math.max(0, pos - 80), pos + 80)));
      }
    }
  }
}
