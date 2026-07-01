// STAGE 1 — per-deity iconography enrichment (the fix for "everything is Anubis",
// missing vahanas/mounts, and low diversity). For each of the 1,069 deities, an
// LLM writes the CANONICAL visual details (specific animal head, mount/vahana,
// weapons, appearance, palette, a fitting pose). Output: enriched.json, keyed by
// god name. Resumable (skips names already present). NOTHING is generated here —
// this only writes text; stage 2 renders.
//
//   ANTHROPIC_API_KEY=sk-... node _card-gen/1-enrich.mjs
//
// Cost: ~1,069 short Sonnet calls (cheap, a couple $). Model = Sonnet (plenty for
// iconography lookup; Thai not involved so no Haiku ban).
import fs from 'node:fs';

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error('set ANTHROPIC_API_KEY'); process.exit(1); }
const GODS = Object.values(JSON.parse(fs.readFileSync(new URL('../data/gods.json', import.meta.url), 'utf8')));
const OUT = new URL('./enriched.json', import.meta.url);
const enriched = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT,'utf8')) : {};

const SYS = `You are a comparative-mythology iconography expert. For a given deity, return the CANONICAL visual details an illustrator needs to make the deity instantly recognizable and DISTINCT from others of the same culture. Be accurate to tradition. Include the deity's iconic MOUNT / vehicle / vahana / animal companion if it has one (e.g. Vishnu→Garuda, Shiva→Nandi the bull, Durga→lion, Ganesha→mouse, Indra→Airavata elephant, Odin→Sleipnir + ravens + wolves, Amaterasu→none). Return ONLY compact JSON, no prose.`;
const schema = `{"form":"<human | animal-headed:WHICH animal | beast | serpent/dragon | multi-armed | abstract>","appearance":"<distinctive features: skin colour, extra arms/heads, third eye, dress>","attributes":"<signature weapons/objects/symbols>","mount":"<iconic mount/vahana/companion animal, or empty string>","palette":"<signature colours>","pose":"<a dynamic action pose fitting THIS deity>","nodepict":<true only for Islamic sacred figures/angels or where a faith forbids depiction, else false>}`;

async function enrich(g){
  const body = { model:'claude-sonnet-5', max_tokens:400, system:SYS,
    messages:[{role:'user',content:`Deity: "${g.name}" (${g.mythology}). Domains: ${(g.represents||[]).join(', ')}.\nReturn JSON exactly in this shape:\n${schema}`}] };
  const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
    headers:{'x-api-key':KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(r.status+' '+(await r.text()).slice(0,120));
  const j = await r.json();
  const txt = (j.content?.[0]?.text||'').replace(/^```json\s*|\s*```$/g,'').trim();
  return JSON.parse(txt);
}

const todo = GODS.filter(g=>!enriched[g.name]);
console.log(`enriching ${todo.length}/${GODS.length} (rest cached)`);
let i=0, done=0, err=0;
async function worker(){
  while(i<todo.length){ const g=todo[i++];
    try{ enriched[g.name] = await enrich(g); }
    catch(e){ err++; if(err<=8) console.log('ERR',g.name,String(e).slice(0,80)); enriched[g.name]={_error:String(e).slice(0,60)}; }
    if(++done%25===0){ fs.writeFileSync(OUT, JSON.stringify(enriched,null,1)); console.log(`[${done}/${todo.length}] err=${err}`); }
  }
}
await Promise.all(Array.from({length:5}, worker));
fs.writeFileSync(OUT, JSON.stringify(enriched,null,1));
console.log(`DONE. total=${Object.keys(enriched).length} err=${err} -> enriched.json`);
