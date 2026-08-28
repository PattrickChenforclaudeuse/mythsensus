const { calculate } = require('./Mythsensus/build/calc.js');
const CH = [
  {label:'หญิง 1966 โตเกียว', d:{name:'สมใจ',gender:'หญิง',year:1966,month:4,day:12,hour:9,minute:15,lat:35.7,lon:139.7,timezone:9}},
  {label:'ชาย 1984 นิวยอร์ก', d:{name:'Ken',gender:'ชาย',year:1984,month:12,day:29,hour:23,minute:40,lat:40.7,lon:-74.0,timezone:-5}},
  {label:'หญิง 1999 เชียงใหม่', d:{name:'ฟ้า',gender:'หญิง',year:1999,month:7,day:18,hour:3,minute:5,lat:18.8,lon:99.0,timezone:7}},
  {label:'ชาย 1952 ลอนดอน', d:{name:'Alan',gender:'ชาย',year:1952,month:9,day:2,hour:16,minute:50,lat:51.5,lon:-0.12,timezone:0}},
];
const strip = h => String(h).replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim();
for (const {label,d} of CH) {
  const c = calculate(d);
  console.log('\n' + '='.repeat(78));
  console.log(label, '·', c.score.total, c.score.tierEn, '· DM', c.bazi.dayStem, c.bazi.dayMasterElement,
    '· NSK', c.ninestar.star, '· LP', c.numerology.lifePath, '· HD', c.humandesign.type, c.humandesign.profile);
  for (const k of ['bazi','humandesign','kabbalistic']) {
    const r = strip(c[k].reading);
    const i = r.indexOf('สิ่งที่มีแต่ศาสตร์นี้เห็น:');
    console.log('\n--- ' + k + ' ---');
    console.log(i>=0 ? r.slice(i, i+430) : '(ไม่มีช่องนี้)');
  }
}
