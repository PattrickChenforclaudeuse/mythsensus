'use strict';
const fs = require('fs');
const h = fs.readFileSync('test-artifacts/visual-review-th.html','utf8');

const sections = [
  { name:'Decade',          marker:'มุมมอง 4 ศาสตร์ซ้อนกัน' },
  { name:'Monthly2026',     marker:'พยากรณ์รายเดือน 2026' },
  { name:'Activation',      marker:'ลำดับความสำคัญจาก 26 ศาสตร์' },
  { name:'Weekly',          marker:'พลังงาน 7 วันต่อดวงของคุณ' },
  { name:'Health',          marker:'ลักษณะประจำตัวจาก 26 ศาสตร์' },
  { name:'Finance',         marker:'แนวทางการเงินตามดวง' },
  { name:'Colors',          marker:'สีมงคลและการแต่งตัว — ที่มาจาก 4 ศาสตร์' },
  { name:'PainPoints',      marker:'จุดที่ดวงชี้ให้ดูแล' },
  { name:'Pets+Mythic',     marker:'สัตว์ในตำนานประจำธาตุ' },
  { name:'Biorhythm',       marker:'Biorhythm' },
];

sections.forEach(s => {
  const ix = h.indexOf(s.marker);
  if (ix < 0) { console.log('✗ NOT FOUND:', s.name); return; }
  const pageStart = h.lastIndexOf('<div class="page"', ix);
  const nextPage = h.indexOf('<div class="page"', ix+1);
  const section = h.slice(pageStart, nextPage > 0 ? nextPage : Math.min(pageStart+16000, h.length));
  const issues = [];
  if (/<td[^>]*>\s*<\/td>/.test(section))  issues.push('empty td');
  if (/\$\{/.test(section))                 issues.push('unresolved ${');
  const opens = (section.match(/<div/g)||[]).length;
  const closes = (section.match(/<\/div>/g)||[]).length;
  if (Math.abs(opens-closes) > 2) issues.push('div imbalance '+opens+'/'+closes);
  const strongOpen = (section.match(/<strong/g)||[]).length;
  const strongClose = (section.match(/<\/strong>/g)||[]).length;
  if (strongOpen !== strongClose) issues.push('<strong> imbalance '+strongOpen+'/'+strongClose);
  // check for weird floats in text
  if (/\d+\.\d{4,}/.test(section)) issues.push('number with 4+ decimals');
  const status = issues.length ? '⚠ '+issues.join(' · ') : '✓ clean · '+(section.length/1024).toFixed(1)+'KB';
  console.log(status+' — '+s.name);
});
