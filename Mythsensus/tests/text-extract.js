'use strict';
const fs = require('fs');
const h = fs.readFileSync('test-artifacts/visual-review-th.html','utf8');

const target = process.argv[2] || 'Decade';
const markers = {
  Decade:  'มุมมอง 4 ศาสตร์ซ้อนกัน',
  Monthly: 'พยากรณ์รายเดือน 2026',
  Activation: 'ลำดับความสำคัญจาก 26 ศาสตร์',
  Weekly: 'พลังงาน 7 วันต่อดวงของคุณ',
  Health: 'ลักษณะประจำตัวจาก 26 ศาสตร์',
  Colors: 'สีมงคลและการแต่งตัว — ที่มาจาก 4 ศาสตร์',
  Pain:   'จุดที่ดวงชี้ให้ดูแล',
  Pets:   'สัตว์ในตำนานประจำธาตุ',
  Bio:    'Biorhythm — วัฏจักรชีวิต',
};
const marker = markers[target] || target;
const ix = h.indexOf(marker);
if (ix < 0) { console.log('not found'); process.exit(1); }
const pageStart = h.lastIndexOf('<div class="page"', ix);
const nextPage = h.indexOf('<div class="page"', ix+1);
let section = h.slice(pageStart, nextPage > 0 ? nextPage : pageStart+14000);
// strip HTML tags, keep structure
section = section
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<\/(div|p|tr|td|h\d|span|strong|em)>/g, '\n')
  .replace(/<(div|p|tr|td|h\d|span|strong|em)[^>]*>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/^[ \t]+/gm, '')
  .replace(/[ \t]{2,}/g, ' ');
console.log(section);
