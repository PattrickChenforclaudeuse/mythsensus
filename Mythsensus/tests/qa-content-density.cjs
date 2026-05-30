/**
 * Content-density analysis for the enrichment review. Generates a report for a
 * normal profile, then (a) measures the per-system "reading" length from the
 * chart object, and (b) splits the report HTML into pages and measures the
 * narrative (non-tag, non-numeric) text length per page to surface thin pages.
 *
 * Run: node Mythsensus/tests/qa-content-density.cjs
 */
'use strict';
const calc=require('../build/calc.js');
const rep=require('../build/report.js');

const d={ name:'สมชาย ใจดี', gender:'ชาย', year:1990, month:6, day:15, hour:14, minute:30,
  lat:13.75, lon:100.5, timezone:7, lang:'th', workCountry:'Thailand', careerLevel:'Senior', domain:'Engineering', industry:'Tech' };

const chart=calc.calculate(d);

// ── (a) per-system reading depth ──
const SYS=['western','bazi','ninestar','numerology','vedic','humandesign','mayan','celtic','thai','saju','tibetan','ziwei','onmyodo','hellenistic','norseRune','ogham','arabicParts','kabbalistic','zoroastrian','aztec','nativeAmerican','ifaYoruba','aboriginal','biorhythm','vedicMahadasha'];
function readingLen(v){
  if(!v||typeof v!=='object')return 0;
  // collect string fields that look like prose (reading/insight/summary/desc/origin/meaning/...)
  let total=0, fields=[];
  for(const[k,val]of Object.entries(v)){
    if(typeof val==='string' && val.length>0 && /reading|insight|summary|desc|meaning|origin|narrative|interpretation|text|note|advice|guidance/i.test(k)){
      total+=val.length; fields.push(`${k}:${val.length}`);
    }
  }
  return {total, fields};
}
console.log('── PER-SYSTEM PROSE LENGTH (chars of reading-like fields) ──');
const rows=SYS.map(k=>{const r=readingLen(chart[k]);return {k,total:r.total,fields:r.fields};}).sort((a,b)=>a.total-b.total);
for(const r of rows){
  const bar='█'.repeat(Math.min(40,Math.round(r.total/40)));
  console.log(`${r.k.padEnd(16)}${String(r.total).padStart(5)}  ${bar}`);
}

// ── (b) report page narrative density ──
const html=rep.generateReport(chart);
const pages=html.split(/<div class="page"/).slice(1);
function narrative(htmlChunk){
  // strip tags, scripts, styles; collapse whitespace; count Thai+latin letters
  const txt=htmlChunk.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ');
  const letters=(txt.match(/[฀-๺a-zA-Z]/g)||[]).length;
  // page title guess: first 40 visible chars
  const title=(txt.replace(/\s+/g,' ').trim().slice(0,55));
  return {letters,title};
}
console.log('\n── REPORT PAGE NARRATIVE DENSITY (letters of prose) ──');
console.log(`Total pages: ${pages.length}`);
const pageRows=pages.map((p,i)=>({i:i+1,...narrative(p)}));
// show thinnest 15 + a few thickest
const sorted=[...pageRows].sort((a,b)=>a.letters-b.letters);
console.log('\nTHINNEST 18 pages (candidate for enrichment):');
for(const p of sorted.slice(0,18)){
  console.log(`  p${String(p.i).padStart(2)} ${String(p.letters).padStart(5)} letters | ${p.title}`);
}
console.log('\nTHICKEST 6 pages (reference):');
for(const p of sorted.slice(-6)){
  console.log(`  p${String(p.i).padStart(2)} ${String(p.letters).padStart(5)} letters | ${p.title}`);
}
const totalLetters=pageRows.reduce((s,p)=>s+p.letters,0);
console.log(`\nAvg letters/page: ${Math.round(totalLetters/pages.length)} | median: ${sorted[Math.floor(sorted.length/2)].letters}`);
