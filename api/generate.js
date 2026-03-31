// api/generate.js — Mythsensus Cosmic Score Generator
// Vercel Edge Function · No external dependencies
// POST /api/generate
// Body: { name, dob, tob, pob, timeKnown, promoCode, userId? }

export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://woamqrhifuxsscnihqco.supabase.co';

// ─── SYSTEM CALCULATORS ───────────────────────────────────────────────────────

function calcWesternAstrology(dob, tob) {
  const d = new Date(dob + 'T' + (tob || '12:00') + ':00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const signs = [
    { sign: 'Aries',       start: [3,21], end: [4,19],  element: 'Fire',  modality: 'Cardinal' },
    { sign: 'Taurus',      start: [4,20], end: [5,20],  element: 'Earth', modality: 'Fixed'    },
    { sign: 'Gemini',      start: [5,21], end: [6,20],  element: 'Air',   modality: 'Mutable'  },
    { sign: 'Cancer',      start: [6,21], end: [7,22],  element: 'Water', modality: 'Cardinal' },
    { sign: 'Leo',         start: [7,23], end: [8,22],  element: 'Fire',  modality: 'Fixed'    },
    { sign: 'Virgo',       start: [8,23], end: [9,22],  element: 'Earth', modality: 'Mutable'  },
    { sign: 'Libra',       start: [9,23], end: [10,22], element: 'Air',   modality: 'Cardinal' },
    { sign: 'Scorpio',     start: [10,23],end: [11,21], element: 'Water', modality: 'Fixed'    },
    { sign: 'Sagittarius', start: [11,22],end: [12,21], element: 'Fire',  modality: 'Mutable'  },
    { sign: 'Capricorn',   start: [12,22],end: [1,19],  element: 'Earth', modality: 'Cardinal' },
    { sign: 'Aquarius',    start: [1,20], end: [2,18],  element: 'Air',   modality: 'Fixed'    },
    { sign: 'Pisces',      start: [2,19], end: [3,20],  element: 'Water', modality: 'Mutable'  },
  ];
  let sunSign = 'Capricorn';
  for (const s of signs) {
    const [sm, sd] = s.start; const [em, ed] = s.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) { sunSign = s.sign; break; }
    if (sm > em && (month === sm && day >= sd || month <= em)) { sunSign = s.sign; break; }
  }
  const sun = signs.find(s => s.sign === sunSign) || signs[9];
  const hour = parseInt((tob || '12:00').split(':')[0]);
  const ascendants = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ascIdx = Math.floor(hour / 2) % 12;
  return {
    system: 'Western Astrology',
    sunSign,
    element: sun.element,
    modality: sun.modality,
    ascendant: ascendants[ascIdx],
    score_contribution: scoreFromElement(sun.element) + scoreFromModality(sun.modality)
  };
}

function calcBaZi(dob, tob) {
  const d = new Date(dob + 'T12:00:00');
  const year = d.getFullYear();
  const heavenlyStems = ['Jia Wood+','Yi Wood-','Bing Fire+','Ding Fire-','Wu Earth+','Ji Earth-','Geng Metal+','Xin Metal-','Ren Water+','Gui Water-'];
  const earthlyBranches = ['Zi Rat','Chou Ox','Yin Tiger','Mao Rabbit','Chen Dragon','Si Snake','Wu Horse','Wei Goat','Shen Monkey','You Rooster','Xu Dog','Hai Pig'];
  const yearStem = heavenlyStems[(year - 4) % 10];
  const yearBranch = earthlyBranches[(year - 4) % 12];
  const month = d.getMonth();
  const monthStem = heavenlyStems[(month + (year * 2)) % 10];
  const monthBranch = earthlyBranches[month % 12];
  const dayStem = heavenlyStems[(Math.floor(d.getTime() / 86400000) + 40) % 10];
  const dayBranch = earthlyBranches[(Math.floor(d.getTime() / 86400000) + 40) % 12];
  const hour = parseInt((tob || '12:00').split(':')[0]);
  const hourStem = heavenlyStems[(hour + 1) % 10];
  const hourBranch = earthlyBranches[Math.floor(hour / 2) % 12];
  const elements = [yearStem, monthStem, dayStem, hourStem].map(s => {
    const parts = s.split(' ');
    return parts[1] ? parts[1].replace(/[+-]/,'') : 'Earth';
  });
  const dominant = mostFrequent(elements);
  return {
    system: 'BaZi',
    year_pillar: yearStem + ' / ' + yearBranch,
    month_pillar: monthStem + ' / ' + monthBranch,
    day_pillar: dayStem + ' / ' + dayBranch,
    hour_pillar: hourStem + ' / ' + hourBranch,
    dominant_element: dominant,
    score_contribution: scoreFromElement(dominant)
  };
}

function calcVedicJyotish(dob) {
  const d = new Date(dob + 'T12:00:00');
  const nakshatras = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const nakshatra = nakshatras[dayOfYear % 27];
  const lords = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
  return {
    system: 'Vedic Jyotish',
    nakshatra,
    dasha_lord: lords[dayOfYear % 9],
    score_contribution: 80 + (dayOfYear % 40)
  };
}

function calcNumerology(name, dob) {
  const digits = dob.replace(/[^0-9]/g,'').split('').map(Number);
  let sum = digits.reduce((a,b) => a+b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').map(Number).reduce((a,b) => a+b, 0);
  }
  const MAP = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8};
  const nameUpper = (name||'').toUpperCase().replace(/[^A-Z]/g,'');
  let expr = nameUpper.split('').reduce((a,c) => a+(MAP[c]||0), 0);
  while (expr > 9 && expr !== 11 && expr !== 22) {
    expr = String(expr).split('').map(Number).reduce((a,b) => a+b, 0);
  }
  const pathNames = {1:'The Leader',2:'The Mediator',3:'The Creator',4:'The Builder',5:'The Adventurer',6:'The Nurturer',7:'The Seeker',8:'The Achiever',9:'The Humanitarian',11:'The Illuminator',22:'The Master Builder',33:'The Master Teacher'};
  return {
    system: 'Numerology',
    life_path: sum,
    life_path_name: pathNames[sum] || 'The Seeker',
    expression: expr,
    expression_name: pathNames[expr] || 'The Creator',
    score_contribution: sum * 8 + expr * 5
  };
}

function calcIChing(dob, tob) {
  const d = new Date(dob + 'T' + (tob||'12:00') + ':00');
  const dayNum = Math.floor(d.getTime() / 86400000);
  const hexNum = (dayNum % 64) + 1;
  const trigrams = ['Heaven','Lake','Fire','Thunder','Wind','Water','Mountain','Earth'];
  return {
    system: 'I Ching',
    hexagram: hexNum,
    lower_trigram: trigrams[hexNum % 8],
    upper_trigram: trigrams[Math.floor(hexNum / 8) % 8],
    score_contribution: 60 + (hexNum % 40)
  };
}

function calcEnergyType(dob) {
  const d = new Date(dob + 'T12:00:00');
  const types = ['Manifestor','Generator','Manifesting Generator','Projector','Reflector'];
  const authorities = ['Emotional','Sacral','Splenic','Ego','Self-Projected','Environmental','Lunar'];
  const profiles = ['1/3 Investigator/Martyr','1/4 Investigator/Opportunist','2/4 Hermit/Opportunist','2/5 Hermit/Heretic','3/5 Martyr/Heretic','3/6 Martyr/Role Model','4/6 Opportunist/Role Model','4/1 Opportunist/Investigator','5/1 Heretic/Investigator','5/2 Heretic/Hermit','6/2 Role Model/Hermit','6/3 Role Model/Martyr'];
  const dayNum = Math.floor(d.getTime() / 86400000);
  return {
    system: 'Energy Type System',
    type: types[dayNum % 5],
    authority: authorities[(dayNum * 3 + 7) % 7],
    profile: profiles[dayNum % 12],
    score_contribution: 70 + ((dayNum % 5) * 10)
  };
}

function calcNineStarKi(dob) {
  const d = new Date(dob + 'T12:00:00');
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const adjustedYear = month < 2 ? year - 1 : year;
  let starNum = ((adjustedYear - 1) % 9) || 9;
  const stars = {
    1: { name: '1 Water Star', element: 'Water', direction: 'North' },
    2: { name: '2 Earth Star', element: 'Earth', direction: 'Southwest' },
    3: { name: '3 Thunder Star', element: 'Wood', direction: 'East' },
    4: { name: '4 Wind Star', element: 'Wood', direction: 'Southeast' },
    5: { name: '5 Earth Star', element: 'Earth', direction: 'Center' },
    6: { name: '6 Metal Star', element: 'Metal', direction: 'Northwest' },
    7: { name: '7 Metal Star', element: 'Metal', direction: 'West' },
    8: { name: '8 Earth Star', element: 'Earth', direction: 'Northeast' },
    9: { name: '9 Fire Star', element: 'Fire', direction: 'South' }
  };
  const star = stars[starNum] || stars[5];
  return {
    system: 'Nine Star Ki',
    star_number: starNum,
    star_name: star.name,
    element: star.element,
    direction: star.direction,
    score_contribution: starNum * 10 + 20
  };
}

function calcMayanTzolkin(dob) {
  const d = new Date(dob + 'T12:00:00');
  const dayCount = Math.floor(d.getTime() / 86400000);
  const daySigns = ['Imix','Ik','Akbal','Kan','Chicchan','Cimi','Manik','Lamat','Muluc','Oc','Chuen','Eb','Ben','Ix','Men','Cib','Caban','Etznab','Cauac','Ahau'];
  const toneNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13];
  const signIdx = (dayCount + 4) % 20;
  const toneIdx = (dayCount + 4) % 13;
  const sign = daySigns[signIdx];
  return {
    system: 'Mayan Tzolkin',
    day_sign: sign,
    tone: toneNumbers[toneIdx],
    score_contribution: (signIdx + 1) * 3 + toneNumbers[toneIdx] * 5
  };
}

function calcCelticTree(dob) {
  const d = new Date(dob + 'T12:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const trees = [
    { tree: 'Silver Fir',  ogham: 'Ailm',  start: [12,23], end: [1,1],   quality: 'Far-sightedness, objectivity' },
    { tree: 'Rowan',       ogham: 'Luis',  start: [1,21],  end: [2,17],  quality: 'Protection, inspiration'      },
    { tree: 'Ash',         ogham: 'Nion',  start: [2,18],  end: [3,17],  quality: 'Connection of worlds'         },
    { tree: 'Alder',       ogham: 'Fearn', start: [3,18],  end: [4,14],  quality: 'Courage, groundedness'        },
    { tree: 'Willow',      ogham: 'Saille',start: [4,15],  end: [5,12],  quality: 'Intuition, cycles'            },
    { tree: 'Hawthorn',    ogham: 'Huath', start: [5,13],  end: [6,9],   quality: 'Transformation'               },
    { tree: 'Oak',         ogham: 'Duir',  start: [6,10],  end: [7,7],   quality: 'Strength, endurance'          },
    { tree: 'Holly',       ogham: 'Tinne', start: [7,8],   end: [8,4],   quality: 'Unity, warrior spirit'        },
    { tree: 'Hazel',       ogham: 'Coll',  start: [8,5],   end: [9,1],   quality: 'Wisdom, creativity'           },
    { tree: 'Vine',        ogham: 'Muin',  start: [9,2],   end: [9,29],  quality: 'Abundance, relaxation'        },
    { tree: 'Ivy',         ogham: 'Gort',  start: [9,30],  end: [10,27], quality: 'Perseverance'                 },
    { tree: 'Reed',        ogham: 'Ngetal',start: [10,28], end: [11,24], quality: 'Purpose, action'              },
    { tree: 'Elder',       ogham: 'Ruis',  start: [11,25], end: [12,22], quality: 'Endings and beginnings'       },
  ];
  let tree = trees[12];
  for (const t of trees) {
    const [sm,sd] = t.start; const [em,ed] = t.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) { tree = t; break; }
  }
  return {
    system: 'Celtic Tree',
    tree: tree.tree,
    ogham: tree.ogham,
    quality: tree.quality,
    score_contribution: 70 + (trees.indexOf(tree) * 5)
  };
}

function calcKabbalah(dob, name) {
  const lifePath = (dob.replace(/[^0-9]/g,'').split('').map(Number).reduce((a,b)=>a+b,0)) % 10 || 10;
  const sephiroth = ['','Kether','Chokmah','Binah','Chesed','Geburah','Tiphareth','Netzach','Hod','Yesod','Malkuth'];
  const paths = {1:'The Crown',2:'Wisdom',3:'Understanding',4:'Mercy',5:'Severity',6:'Beauty',7:'Victory',8:'Splendor',9:'Foundation',10:'The Kingdom'};
  const idx = lifePath % 10 || 10;
  return {
    system: 'Kabbalah',
    sephirah: sephiroth[idx],
    path: paths[idx],
    tree_position: idx,
    score_contribution: idx * 9 + 30
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function scoreFromElement(el) {
  const map = { Fire:95, Earth:80, Air:85, Metal:75, Wood:90, Water:88 };
  return map[el] || 75;
}

function scoreFromModality(mod) {
  const map = { Cardinal:15, Fixed:10, Mutable:12 };
  return map[mod] || 10;
}

function mostFrequent(arr) {
  const counts = {};
  let max = 0, result = arr[0];
  for (const v of arr) {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > max) { max = counts[v]; result = v; }
  }
  return result;
}

function calcCosmicScore(systems) {
  const contributions = systems.map(s => s.score_contribution);
  const base = contributions.reduce((a,b) => a+b, 0) / contributions.length;
  const elements = systems.map(s => s.element || s.dominant_element || '').filter(Boolean);
  const counts = {};
  for (const e of elements) counts[e] = (counts[e]||0) + 1;
  const maxCount = elements.length ? Math.max(...Object.values(counts)) : 1;
  const convergence = maxCount / (elements.length || 1);
  const score = Math.min(1000, Math.round(base * (1 + convergence * 0.3)));
  return { score, convergence_count: Math.round(convergence * 10), percentile: Math.round(score / 10) };
}

function selectDeityMatch(western) {
  const elementMap = {
    Fire:  { deity:'Apollo',     mythology:'Greek',  quality:'Light, Truth, Vision',           description:'The solar archetype of clarity and illumination.' },
    Water: { deity:'Poseidon',   mythology:'Greek',  quality:'Depth, Intuition, Change',        description:'The oceanic archetype of depth and emotional intelligence.' },
    Earth: { deity:'Gaia',       mythology:'Greek',  quality:'Stability, Growth, Foundation',   description:'The foundational archetype of groundedness and endurance.' },
    Air:   { deity:'Athena',     mythology:'Greek',  quality:'Wisdom, Strategy, Clarity',       description:'The air archetype of keen perception and strategic thinking.' },
    Wood:  { deity:'Cernunnos',  mythology:'Celtic', quality:'Growth, Vitality, Wild wisdom',   description:'The forest archetype of natural cycles and untamed vitality.' },
    Metal: { deity:'Hephaestus', mythology:'Greek',  quality:'Craft, Precision, Transformation',description:'The maker archetype of skilled transformation.' },
  };
  return elementMap[western.element] || elementMap['Fire'];
}

// ─── SUPABASE HELPER (no npm — pure fetch) ──────────────────────────────────

async function supabaseInsert(table, row, serviceKey) {
  if (!serviceKey) return;
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(row)
  });
  return res.status;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

  const { name = '', dob, tob = '12:00', pob = '', timeKnown = 'unknown', userId } = body;

  if (!dob) {
    return new Response(JSON.stringify({ error: 'dob required (YYYY-MM-DD)' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const western    = calcWesternAstrology(dob, tob);
  const bazi       = calcBaZi(dob, tob);
  const vedic      = calcVedicJyotish(dob);
  const numerology = calcNumerology(name, dob);
  const iching     = calcIChing(dob, tob);
  const energyType = calcEnergyType(dob);
  const nineStarKi = calcNineStarKi(dob);
  const mayan      = calcMayanTzolkin(dob);
  const celtic     = calcCelticTree(dob);
  const kabbalah   = calcKabbalah(dob, name);

  const allSystems = [western, bazi, vedic, numerology, iching, energyType, nineStarKi, mayan, celtic, kabbalah];
  const { score, convergence_count, percentile } = calcCosmicScore(allSystems);
  const deity = selectDeityMatch(western);

  const aliasSeed = dob.replace(/[^0-9]/g,'').split('').reduce((a,b) => a + parseInt(b), 0);
  const aliasTier = aliasSeed % 10 >= 8 ? 'Legendary' : aliasSeed % 10 >= 5 ? 'Rare' : 'Common';

  const result = {
    meta: { name: name || 'Anonymous', dob, tob, pob, timeKnown, generated_at: new Date().toISOString(), version: '1.0.0' },
    cosmic_score: {
      score,
      percentile,
      convergence_count,
      label: score >= 900 ? 'Transcendent' : score >= 750 ? 'Elevated' : score >= 600 ? 'Awakening' : score >= 400 ? 'Aware' : 'Seeker'
    },
    systems: { western_astrology: western, bazi, vedic_jyotish: vedic, numerology, i_ching: iching, energy_type: energyType, nine_star_ki: nineStarKi, mayan_tzolkin: mayan, celtic_tree: celtic, kabbalah },
    divine_mirror: deity,
    alias: { tier: aliasTier, seed: aliasSeed, deity_link: deity.deity },
    disclaimer: 'Mythsensus provides interpretive insights based on ancient wisdom traditions for self-reflection and personal exploration only. Not medical, psychological, financial, or life advice.'
  };

  // Persist to Supabase via REST (non-blocking)
  const serviceKey = typeof process !== 'undefined' ? process.env?.SUPABASE_SERVICE_KEY : undefined;
  if (serviceKey && userId) {
    supabaseInsert('reports', {
      user_id: userId, dob, tob, pob, name_display: name,
      cosmic_score: score, convergence_count,
      systems_data: result.systems, deity_match: deity.deity,
      created_at: new Date().toISOString()
    }, serviceKey).catch(console.error);
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}