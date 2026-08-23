const fs = require('fs');
const path = require('path');
const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('-with-history.json')).sort();
let merged = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  console.log(f, '→', data.length);
  merged = merged.concat(data);
}
const missing = merged.filter(s => !s.history_th || !s.history_en);
console.log('Total:', merged.length, '· missing history:', missing.length);
const ids = new Map();
for (const s of merged) ids.set(s.id, s);
const deduped = Array.from(ids.values());
console.log('After dedupe:', deduped.length);
const outPath = path.join(__dirname, '..', 'sacred-places.json');
fs.writeFileSync(outPath, JSON.stringify(deduped));
const size = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log('Wrote sacred-places.json:', size, 'KB');
console.log('Sample EN:', deduped[0].history_en.slice(0, 120));
