// ย้ายสคริปต์แอปก้อนใหญ่ (~1.4MB inline) ออกเป็น /build/app.js แบบ defer — 11 ก.ย. 69
//
// ทำไม: Lighthouse มือถือ 55 · FCP/LCP 10.1s/10.4s — สคริปต์ inline บล็อกการวาดจนโหลดครบ 1.4MB (brotli แล้ว)
//        ทั้งที่จอ entry เป็น HTML ล้วน (#entryOverlay style="display:flex") วาดได้ทันทีถ้าไม่ถูกบล็อก
// ปลอดภัยเพราะ: (1) ก้อนนี้เป็น <script> ตัวสุดท้ายในไฟล์ ไม่มี inline ใดตามหลังที่ต้องพึ่งมัน
//               (2) defer รักษาลำดับกับ /build/ms26-bundle.js (defer เหมือนกัน วางถัดกัน)
//               (3) supabase CDN โหลดแบบ sync ก่อนหน้า ⇒ พร้อมก่อน defer ทุกตัว
//               (4) top-level const/let/function ใน classic external script = global lexical scope เดียวกับ inline
//               (5) วางไว้ใต้ /build/ ⇒ service worker ใช้กติกา network-first เดียวกับ bundle (ไม่ค้าง)
// รันซ้ำได้: ถ้า index.html ชี้ /build/app.js อยู่แล้ว จะ "sync" เนื้อจาก index.html → ไม่มีอะไรทำ (ต้นทางคือ build/app.js แล้ว)
// ⛔ หลังจากนี้ แก้โค้ดแอปที่ build/app.js ไม่ใช่ index.html · bump ?v= ด้วยการรันสคริปต์นี้ (มันคำนวณ hash ให้)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html'), APP = path.join(ROOT, 'build', 'app.js');
let html = fs.readFileSync(HTML, 'utf8');
const hashOf = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);

const tagRe = /<script src="\/build\/app\.js\?v=([0-9a-f]+)" defer><\/script>/;
if (tagRe.test(html)) {
  // โหมด bump: ไฟล์แยกอยู่แล้ว — อัปเดต ?v= ให้ตรง hash ปัจจุบันของ build/app.js
  const app = fs.readFileSync(APP, 'utf8'); const h = hashOf(app);
  const before = html;
  html = html.replace(/\/build\/app\.js\?v=[0-9a-f]+/g, '/build/app.js?v=' + h);
  if (html !== before) { fs.writeFileSync(HTML, html); console.log('bumped app.js ?v= → ' + h); } else console.log('app.js already at v=' + h + ' — nothing to do');
  process.exit(0);
}

// โหมดย้าย: หา inline script ตัวใหญ่สุด (ไม่ใช่ src / ไม่ใช่ ld+json)
let big = null;
for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (/\ssrc\s*=/.test(m[1]) || /ld\+json/.test(m[1])) continue;
  if (!big || m[2].length > big[2].length) big = m;
}
if (!big || big[2].length < 500000) { console.error('big inline script not found'); process.exit(1); }
// ต้องเป็น <script> ตัวสุดท้ายของไฟล์ (เงื่อนไขความปลอดภัยข้อ 1)
const after = html.slice(big.index + big[0].length);
if (/<script(?![^>]*ld\+json)[^>]*>/.test(after)) { console.error('มี <script> ตามหลังก้อนใหญ่ — ลำดับจะเพี้ยน ยกเลิก'); process.exit(1); }

const body = big[2].replace(/^\s*\n/, '');
const header = `// build/app.js — โค้ดแอป Mythsensus (ย้ายออกจาก index.html 11 ก.ย. 69 เพื่อให้หน้าแรกวาดก่อนโหลด JS)\n// แก้ที่ไฟล์นี้ แล้วรัน node _tools/extract-app.cjs เพื่อ bump ?v= ใน index.html · ห้ามย้ายกลับไป inline\n`;
const app = header + body;
const h = hashOf(app);
fs.mkdirSync(path.dirname(APP), { recursive: true });
fs.writeFileSync(APP, app);
const tag = `<script src="/build/app.js?v=${h}" defer></script>`;
html = html.slice(0, big.index) + tag + html.slice(big.index + big[0].length);
// preload ถัดจากของ bundle
const pre = '<link rel="preload" as="script" href="/build/ms26-bundle.js?v=254">';
if (html.includes(pre) && !html.includes('href="/build/app.js')) html = html.replace(pre, pre + `\n<link rel="preload" as="script" href="/build/app.js?v=${h}">`);
fs.writeFileSync(HTML, html);
console.log(`extracted ${body.length} bytes → build/app.js (v=${h}) · index.html now ${html.length} bytes`);
