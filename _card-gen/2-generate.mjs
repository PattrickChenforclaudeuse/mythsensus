// STAGE 2 — render the cyber cards using the enriched per-deity iconography from
// stage 1. Builds a prompt that names the deity's SPECIFIC head/appearance/
// weapons/MOUNT/pose (so Ra=falcon not Anubis, Vishnu rides Garuda, etc.) on top
// of the culture cues + the locked cyber template. Skips `nodepict` deities.
// Resumable (skips existing out/ files). Writes to _card-gen/out/<Tier>-<slug>.jpg.
//
//   FAL_KEY=xxxxx:yyyyy node _card-gen/2-generate.mjs [pilot|all] [concurrency]
//
// Cost: flux-pro/v1.1 ~$0.045/img. Upload out/ to woam bucket god-cards-v2 after
// review (see README). Pilot mode = 1 god per top-25 mythology for a cheap check.
import fs from 'node:fs';
import { cuesFor } from './culture-map.mjs';

const KEY = process.env.FAL_KEY;
if (!KEY) { console.error('set FAL_KEY (id:secret)'); process.exit(1); }
const GODS = Object.values(JSON.parse(fs.readFileSync(new URL('../data/gods.json', import.meta.url),'utf8')));
const ENR = JSON.parse(fs.readFileSync(new URL('./enriched.json', import.meta.url),'utf8'));  // from stage 1
const MODE = process.argv[2] || 'pilot';
const CONC = Number(process.argv[3]) || 5;
const outDir = new URL('./out/', import.meta.url); fs.mkdirSync(outDir,{recursive:true});

// Locked cyber template (culture-dominant + cyber material + dark cultural bg +
// action + consistent framing). Per-deity iconography is injected before it.
const TECH =
  " Reimagined SEMI-ROBOTIC / cyberpunk: dark blackened-brass and chrome mechanical plating alive with glowing " +
  "electric-cyan circuit lines tracing the traditional patterns, a glowing energy-reactor core, exposed mechanical " +
  "joints. The cyberpunk tech is the MATERIAL only — the mythological form, headdress, weapon, mount and cultural " +
  "identity stay DOMINANT and unmistakable. Set against a DARK ATMOSPHERIC cultural background, dimly lit, deep " +
  "shadows, volumetric haze — NOT a flat black void, NOT daylight. FULL-BODY or three-quarter framing, centered. " +
  "Deep black background edges, dark moody cinematic, ultra detailed, epic, sacred, mysterious. Vertical trading-card " +
  "portrait. No text, no watermark, no border frame.";

const slug = g => g.tier + '-' + String(g.name).replace(/[^a-z0-9]+/gi,'-');
function buildPrompt(g){
  const e = ENR[g.name] || {};
  const c = cuesFor(g.mythology);
  const bits = [];
  bits.push(`${g.name}, a ${c.culture} deity — deity of ${(g.represents||[]).slice(0,3).join(', ')}.`);
  bits.push(`Instantly recognizable as ${c.culture}: ${c.cues}.`);
  if (e.form && e.form!=='human') bits.push(`Form: ${e.form}.`);
  if (e.appearance) bits.push(e.appearance + '.');
  if (e.attributes) bits.push('Carries ' + e.attributes + '.');
  if (e.mount) bits.push('Accompanied by their iconic mount, ' + e.mount + '.');
  if (e.palette) bits.push(e.palette + ' palette.');
  bits.push(e.pose ? ('In a dynamic pose: ' + e.pose + '.') : 'In a dynamic, powerful action pose.');
  return bits.join(' ') + TECH;
}

// pilot = 1 god per top-25 mythology (highest tier); all = every non-nodepict god
const TORDER = { Mythic:6, Legendary:5, Epic:4, Rare:3, Uncommon:2, Common:1 };
const byMyth = {}; for (const g of GODS){ (byMyth[g.mythology] ||= []).push(g); }
const pilot = Object.entries(byMyth).sort((a,b)=>b[1].length-a[1].length).slice(0,25)
  .map(([,arr])=>arr.slice().sort((a,b)=>(TORDER[b.tier]||0)-(TORDER[a.tier]||0))[0]);
const targets = (MODE==='all' ? GODS : pilot).filter(g=>!(ENR[g.name]||{}).nodepict);

async function gen(g){
  const out = new URL('./out/'+slug(g)+'.jpg', import.meta.url);
  if (fs.existsSync(out) && fs.statSync(out).size>5000) return {g,skip:true};
  const body = { prompt:buildPrompt(g), image_size:{width:832,height:1216}, num_images:1, output_format:'jpeg', safety_tolerance:'5', enable_safety_checker:false };
  const r = await fetch('https://fal.run/fal-ai/flux-pro/v1.1',{method:'POST',headers:{'Authorization':'Key '+KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) return {g,err:r.status+' '+(await r.text()).slice(0,100)};
  const url = JSON.parse(await r.text()).images?.[0]?.url; if(!url) return {g,err:'no url'};
  fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer())); return {g,ok:true};
}

console.log(`${MODE.toUpperCase()} — ${targets.length} gods (nodepict skipped), concurrency ${CONC}`);
let i=0, done=0, up=0, err=0;
async function worker(){ while(i<targets.length){ const g=targets[i++]; let r; try{ r=await gen(g); }catch(e){ r={g,err:String(e).slice(0,100)}; }
  if(r.ok) up++; if(r.err){ err++; if(err<=8) console.log('ERR',g.name,r.err); }
  if(++done%25===0) console.log(`[${done}/${targets.length}] up=${up} err=${err}`); } }
await Promise.all(Array.from({length:CONC}, worker));
console.log(`DONE up=${up} err=${err} -> _card-gen/out/`);
