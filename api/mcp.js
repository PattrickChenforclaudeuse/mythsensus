// api/mcp.js — Mythsensus MCP server over HTTP (Streamable HTTP, stateless).
//
// Lets any AI client (Claude, Cursor, Smithery, …) connect to the Mythsensus
// engine at https://mythsensus.com/mcp over HTTP — NO npm/npx install needed.
// Mirrors the stdio server (npm package `mythsensus-mcp`: src/index.ts +
// src/engine-wrapper.ts). Same 5 free tools, same ≤5-system gate.
//
// ⚠️ SOURCE OF TRUTH = the npm package (src/index.ts + src/engine-wrapper.ts).
// This file duplicates the tool defs + gate + engine glue ON PURPOSE: the two
// run in different runtimes (stdio process vs Vercel serverless) and the
// package can't be imported here without republishing it as a library. When
// the package's tools/gate change, mirror them here. Engine assets
// (_mcp/engine/calc.cjs + gods.json) are COPIES of the package's src/engine/* —
// re-copy after an engine rebuild.
//
// Stateless: one dispatch per POST, no session state (serverless-friendly).
// require() (not fs.readFileSync) so @vercel/nft statically bundles the engine.

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const calc = require('./_mcp/engine/calc.cjs');
const GODS = require('./_mcp/engine/gods.json');
const GODS_LORE = require('./_mcp/engine/gods-lore.json'); // 1,044 deities · { th, en } encyclopedic lore
const SYSTEM_RULES = require('./_mcp/engine/system-rules.json'); // canonical interpretation methodology (26 systems + consensus)

export const config = { runtime: 'nodejs', maxDuration: 15 };

const SERVER = { name: 'mythsensus', version: '0.3.0' };
const FREE_PREVIEW_SYSTEMS = ['bazi', 'vedic', 'western', 'ninestar', 'thai'];
const UPSELL = 'https://mythsensus.com';

// ── Deity-lore lookup (AEO surface: feed the 1,044-deity encyclopedia to AI clients) ──
// gods-lore.json = { "<Name>": { th, en } }; gods.json carries mythology + rarity tier.
const LORE_NAMES = Object.keys(GODS_LORE);
const LORE_INDEX = new Map(LORE_NAMES.map((n) => [n.toLowerCase(), n])); // ci exact
const GOD_META = new Map(GODS.map((g) => [g.name, g]));                  // name → { mythology, tier, … }
// mythology value (gods.json) → live /pantheon/<slug> page (only the 9 that exist)
const MYTHOLOGY_TO_PANTHEON = {
  'Hinduism': 'hinduism', 'Greek Mythology': 'greek', 'Chinese Mythology': 'chinese',
  'Norse Mythology': 'norse', 'Shinto': 'shinto', 'Egyptian Mythology': 'egyptian',
  'Roman Mythology': 'roman', 'Thai Buddhism': 'thai-buddhism', 'Thai Mythology': 'thai',
};
// Resolve a free-text system query → canonical slug (typo-tolerant, mirrors
// engine-wrapper resolveSystem). Exact slug → case-insensitive → prefix →
// substring against slug + EN/TH names. Returns { slug } or { suggestion }.
// NOTE: SYSTEMS_26 is declared below this point, so read it lazily (at call
// time, not module-eval time) — a module-level .map() here would hit the TDZ.
function resolveSystem(q) {
  const SLUGS = SYSTEMS_26.map((s) => s.slug);
  const raw = String(q ?? '').trim();
  const key = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (!key) return {};
  const hit = SLUGS.find((s) => s.toLowerCase() === key);
  if (hit) return { slug: hit, matched: raw === hit ? 'exact' : 'case' };
  const pre = SLUGS.filter((s) => s.toLowerCase().startsWith(key));
  if (pre.length === 1) return { slug: pre[0], matched: 'prefix' };
  const byName = SYSTEMS_26.filter(
    (s) => `${s.nameEn} ${s.nameTh}`.toLowerCase().replace(/[\s_-]+/g, '').includes(key)
  );
  if (byName.length === 1) return { slug: byName[0].slug, matched: 'name' };
  const sub = SLUGS.filter((s) => s.toLowerCase().includes(key));
  if (sub.length === 1) return { slug: sub[0], matched: 'substring' };
  return { suggestion: (pre[0] || sub[0] || byName[0]?.slug) };
}

// Resolve a free-text deity query → canonical name, or a candidate list when ambiguous.
function resolveDeity(q) {
  const key = String(q ?? '').trim().toLowerCase();
  if (!key) return { candidates: [] };
  if (LORE_INDEX.has(key)) return { name: LORE_INDEX.get(key) };
  const starts = LORE_NAMES.filter((n) => n.toLowerCase().startsWith(key));
  if (starts.length === 1) return { name: starts[0] };
  const contains = LORE_NAMES.filter((n) => n.toLowerCase().includes(key));
  if (!starts.length && contains.length === 1) return { name: contains[0] };
  return { candidates: [...new Set([...starts, ...contains])].slice(0, 15) };
}

// ── 26-system metadata (mirror of engine-wrapper SYSTEMS_26) ──────────
const SYSTEMS_26 = [
  { slug: 'bazi', nameEn: 'BaZi (Four Pillars of Destiny)', nameTh: 'BaZi · สี่เสาดวง', region: 'China', inputs: ['date', 'time-optional'] },
  { slug: 'vedic', nameEn: 'Vedic Jyotish', nameTh: 'โหราศาสตร์อินเดีย Vedic', region: 'India', inputs: ['date', 'time-optional'] },
  { slug: 'western', nameEn: 'Western Astrology', nameTh: 'โหราศาสตร์ตะวันตก', region: 'Greco-Roman', inputs: ['date', 'time-optional'] },
  { slug: 'ninestar', nameEn: 'Nine Star Ki (九星気学)', nameTh: 'Nine Star Ki', region: 'Japan', inputs: ['date'] },
  { slug: 'thai', nameEn: 'Thai Seven Number (เลข 7 ตัว 9 ฐาน)', nameTh: 'เลข 7 ตัว 9 ฐาน', region: 'Thailand', inputs: ['date'] },
  { slug: 'numerology', nameEn: 'Pythagorean Numerology', nameTh: 'ตัวเลขพิทาโกรัส', region: 'Greece', inputs: ['date'] },
  { slug: 'humandesign', nameEn: 'Human Design', nameTh: 'Human Design', region: 'Modern Synthesis (1987)', inputs: ['date', 'time-optional'] },
  { slug: 'mayan', nameEn: "Mayan Tzolk'in", nameTh: "ปฏิทินมายา Tzolk'in", region: 'Mesoamerica', inputs: ['date'] },
  { slug: 'celtic', nameEn: 'Celtic Tree Astrology', nameTh: 'โหราศาสตร์ต้นไม้เซลติก', region: 'Celtic', inputs: ['date'] },
  { slug: 'saju', nameEn: 'Korean Saju (사주)', nameTh: 'Saju (사주)', region: 'Korea', inputs: ['date', 'time-optional'] },
  { slug: 'tibetan', nameEn: 'Tibetan Astrology', nameTh: 'โหราศาสตร์ทิเบต', region: 'Tibet', inputs: ['date'] },
  { slug: 'ziwei', nameEn: 'Zi Wei Dou Shu (紫微斗数)', nameTh: 'ดาวจักรพรรดิ Zi Wei', region: 'China', inputs: ['date', 'time'] },
  { slug: 'onmyodo', nameEn: 'Onmyōdō (陰陽道)', nameTh: 'Onmyōdō', region: 'Japan', inputs: ['date'] },
  { slug: 'hellenistic', nameEn: 'Hellenistic Astrology', nameTh: 'โหราศาสตร์ Hellenistic', region: 'Hellenistic', inputs: ['date', 'time-optional'] },
  { slug: 'norseRune', nameEn: 'Norse Runes', nameTh: 'รูนนอร์ส', region: 'Norse', inputs: ['date'] },
  { slug: 'ogham', nameEn: 'Ogham Alphabet', nameTh: 'อักษร Ogham', region: 'Celtic', inputs: ['date'] },
  { slug: 'arabicParts', nameEn: 'Arabic Parts', nameTh: 'Arabic Parts', region: 'Arabia', inputs: ['date', 'time'] },
  { slug: 'kabbalistic', nameEn: 'Kabbalistic Numerology', nameTh: 'ตัวเลขคาบาลาห์', region: 'Kabbalah', inputs: ['date'] },
  { slug: 'zoroastrian', nameEn: 'Zoroastrian Astrology', nameTh: 'โหราศาสตร์โซโรอัสเตอร์', region: 'Persia', inputs: ['date'] },
  { slug: 'aztec', nameEn: 'Aztec Tonalpohualli', nameTh: 'ปฏิทินแอซเทค', region: 'Aztec', inputs: ['date'] },
  { slug: 'nativeAmerican', nameEn: 'Native American Birth Totems', nameTh: 'โทเทมพื้นเมืองอเมริกา', region: 'Indigenous Americas', inputs: ['date'] },
  { slug: 'ifaYoruba', nameEn: 'Ifá Yoruba', nameTh: 'Ifá Yoruba', region: 'West Africa', inputs: ['date'] },
  { slug: 'aboriginal', nameEn: 'Aboriginal Dreamtime', nameTh: 'Dreamtime ของชาวอะบอริจิน', region: 'Australia', inputs: ['date'] },
  { slug: 'biorhythm', nameEn: 'Biorhythm', nameTh: 'Biorhythm', region: 'Modern', inputs: ['date'] },
  { slug: 'vedicMahadasha', nameEn: 'Vedic Mahādaśā', nameTh: 'ทศ Mahādaśā', region: 'India', inputs: ['date', 'time-optional'] },
  { slug: 'thaiBrahmin', nameEn: 'Thai Brahmin', nameTh: 'ไทยพราหมณ์', region: 'Thailand', inputs: ['date'] },
];

// ── Engine glue (mirror of engine-wrapper calculate/dailyBlessing) ────
function calculate(birth) {
  const input = {
    name: birth.name ?? '', gender: birth.gender ?? 'ชาย',
    year: birth.year, month: birth.month, day: birth.day,
    hour: birth.hour ?? 12, minute: birth.minute ?? 0,
    lat: birth.lat ?? 13.75, lon: birth.lon ?? 100.5,
    timezone: birth.timezone ?? 7, lang: birth.lang ?? 'th',
  };
  const chart = calc.calculate(input);
  const summary = {
    cosmicScore: {
      total: chart.score?.total ?? 0, tier: chart.score?.tier ?? '',
      tierEn: chart.score?.tierEn, percentile: chart.score?.percentile,
    },
    bazi: { dayMaster: chart.bazi?.dayMaster, dayMasterTh: chart.bazi?.dayMasterTh, dayMasterElement: chart.bazi?.dayMasterElement },
    vedic: { moonNakshatra: chart.vedic?.nakshatra, nakshatraLord: chart.vedic?.nakshatraLord },
    western: { sun: chart.western?.sunSign, sunTh: chart.western?.sunSignTh, moon: chart.western?.moonSign, moonTh: chart.western?.moonSignTh },
    ninestar: { star: chart.ninestar?.star, starTh: chart.ninestar?.starTh },
    thai: { dayName: chart.thai?.dayName, dayColor: chart.thai?.dayColor, dayGod: chart.thai?.dayGod, dayGodTh: chart.thai?.dayGodTh, nakshatra: chart.thai?.nakshatra, fortuneDay: chart.thai?.fortuneDay },
  };
  return { chart, summary };
}

function dailyBlessing(birth, date) {
  const { chart } = calculate(birth);
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const seedStr = `${birth.year}-${birth.month}-${birth.day}-${dateStr}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { hash ^= seedStr.charCodeAt(i); hash = (hash * 16777619) >>> 0; }
  const score = chart.score?.total ?? 500;
  const tierFilter = (g) => {
    if (score >= 900) return ['Mythic', 'Legendary', 'Epic', 'Rare'].includes(g.tier);
    if (score >= 800) return ['Legendary', 'Epic', 'Rare', 'Uncommon'].includes(g.tier);
    if (score >= 700) return ['Epic', 'Rare', 'Uncommon', 'Common'].includes(g.tier);
    if (score >= 600) return ['Rare', 'Uncommon', 'Common'].includes(g.tier);
    return ['Uncommon', 'Common'].includes(g.tier);
  };
  const pool = GODS.filter(tierFilter);
  const safePool = pool.length ? pool : GODS;
  const pick = safePool[hash % safePool.length];
  const messages = pick.messages_en || pick.messages || [];
  const msg = messages.length ? messages[hash % messages.length] : '';
  return { deity: pick.name, mythology: pick.mythology, tier: pick.tier, message: msg };
}

// ── Engine metadata (mirror of index.ts ENGINE_INFO) ─────────────────
const ENGINE_INFO = {
  name: 'Mythsensus', version: '1.x (engine v1 · MCP HTTP wrapper v0.3.0)',
  website: 'https://mythsensus.com', how_it_works: 'https://mythsensus.com/how-it-works',
  llms_txt: 'https://mythsensus.com/llms.txt', sample_report: 'https://mythsensus.com/sample-report',
  architecture: {
    type: 'algorithmic (NOT LLM-based for math)', language: 'TypeScript compiled to ~250 KB bundle',
    determinism: 'Same input always returns same output', privacy: 'Computation runs server-side here; no birth data is stored.',
  },
  known_limitations: {
    vedic_ayanamsa: 'Lahiri hardcoded at 24.0°; accurate ±10 arcmin for births 2020-2030.',
    bazi_solar_terms: 'Month-boundary approximation; ±48h-of-solar-term edge cases (~5% of DOBs).',
    western_planet_positions: 'Custom trigonometric series, no Swiss Ephemeris.',
    jyotish_divisional_charts: 'Not implemented (no D-9/D-10); Mahadasha + nakshatra-only Vedic layer.',
    weight_calibration: 'Internal-consistency optimization (no supervised ground truth).',
    llm_narrative: 'Reading TEXT uses an LLM for phrasing only; the numbers are deterministic.',
  },
  open_source: 'The compiled engine ships client-side on mythsensus.com and as the MIT npm package mythsensus-mcp — the math is fully inspectable. Durable edge: weight calibration + 1,069-deity curation + in-depth synthesis depth.',
  pricing: {
    free: 'Cosmic Score + 5-system consensus preview (this MCP) · full 26-system reading free on the website',
    deep_reading_one_time: '$9 per system', full_report_one_time: '$19 (in-depth PDF, all 26 systems)',
    subscription: '$8.99/month',
  },
  mcp_repo: 'https://github.com/PattrickChenforclaudeuse/mythsensus-mcp',
  npm_package: 'mythsensus-mcp', http_endpoint: 'https://mythsensus.com/mcp',
};

// ── Tool definitions (mirror of index.ts TOOLS) ──────────────────────
const TOOLS = [
  {
    name: 'calculate_cosmic_score',
    description:
      'Compute the Mythsensus Cosmic Score (1-999) for a birth date. Synthesises 26 ancient divination systems including BaZi, Vedic Jyotish, Western astrology, Nine Star Ki, Thai Seven Number, Mayan Tzolk\'in, Norse Runes, and 19 others. Returns numeric score, tier (Common→Mythic), percentile, plus a 5-of-26 per-system consensus preview. Deterministic: same input always returns the same output.',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'integer', description: 'Birth year (4-digit, e.g. 1990)', minimum: 1500, maximum: 2100 },
        month: { type: 'integer', description: 'Birth month (1-12)', minimum: 1, maximum: 12 },
        day: { type: 'integer', description: 'Birth day (1-31)', minimum: 1, maximum: 31 },
        hour: { type: 'integer', description: 'Birth hour (0-23, optional — improves BaZi/Vedic/Western precision; default 12 noon)', minimum: 0, maximum: 23 },
        minute: { type: 'integer', description: 'Birth minute (0-59, optional; default 0)', minimum: 0, maximum: 59 },
        lat: { type: 'number', description: 'Birth latitude (optional; default 13.75 = Bangkok)' },
        lon: { type: 'number', description: 'Birth longitude (optional; default 100.5 = Bangkok)' },
        timezone: { type: 'number', description: 'Timezone offset hours (optional; default +7)' },
        lang: { type: 'string', enum: ['th', 'en'], description: 'Output language (optional; default th)' },
      },
      required: ['year', 'month', 'day'],
    },
  },
  {
    name: 'get_deep_reading',
    description:
      'Get a focused reading for ONE specific divination system from the 26. Free MCP tier covers the 5 preview systems (bazi, vedic, western, ninestar, thai); the other 21 + the in-depth Cosmic Blueprint PDF are at mythsensus.com/pricing.',
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'integer', minimum: 1500, maximum: 2100 },
        month: { type: 'integer', minimum: 1, maximum: 12 },
        day: { type: 'integer', minimum: 1, maximum: 31 },
        hour: { type: 'integer', minimum: 0, maximum: 23 },
        minute: { type: 'integer', minimum: 0, maximum: 59 },
        lat: { type: 'number' }, lon: { type: 'number' }, timezone: { type: 'number' },
        system: { type: 'string', description: 'System slug — see list_26_systems' },
        lang: { type: 'string', enum: ['th', 'en'] },
      },
      required: ['year', 'month', 'day', 'system'],
    },
  },
  { name: 'list_26_systems', description: 'Return the canonical list of 26 ancient divination systems Mythsensus implements (slug, English + Thai name, region, required inputs). Use first when asked "what systems do you support?".', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'daily_blessing',
    description: "Draw today's deity card from Mythsensus's 1,069-deity collection. Deterministic given (birth date, current date). Higher Cosmic Score tiers bias toward rarer deities. Returns deity, mythology origin, tier, and message.",
    inputSchema: {
      type: 'object',
      properties: {
        year: { type: 'integer', minimum: 1500, maximum: 2100 },
        month: { type: 'integer', minimum: 1, maximum: 12 },
        day: { type: 'integer', minimum: 1, maximum: 31 },
        date: { type: 'string', description: 'Date to draw for, YYYY-MM-DD (optional; default today)' },
      },
      required: ['year', 'month', 'day'],
    },
  },
  { name: 'about_mythsensus_engine', description: 'Engineering-honest metadata about the Mythsensus engine: architecture (algorithmic vs LLM), known limitations, open-source roadmap, links. Use when a user asks "is this real?" / "how accurate is it?".', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'get_deity_lore',
    description:
      'Look up an encyclopedic profile of any of 1,044 deities across 9 mythologies — Hinduism, Greek, Chinese, Norse, Shinto, Egyptian, Roman, Thai mythology & Thai Buddhism (e.g. Ganesha, Zeus, Odin, Amaterasu, Anubis, Guan Yin, Phra Phrom). Returns origin tradition, the deity\'s rarity tier, and full lore in English + Thai. Use whenever a user asks "who is X?", "tell me about the god/goddess X", the myth or symbolism of a deity, or about a pantheon.',
    inputSchema: {
      type: 'object',
      properties: {
        deity: { type: 'string', description: 'Deity name or partial (e.g. "Ganesha", "amaterasu", "thor"). Case-insensitive; partial matches return candidates.' },
        lang: { type: 'string', enum: ['th', 'en'], description: 'Output language (optional; omit to get BOTH English and Thai).' },
      },
      required: ['deity'],
    },
  },
  {
    name: 'get_system_rules',
    description:
      "Return Mythsensus's canonical interpretation rules — the reference methodology for reading each divination system AND for forming the 26-system consensus. Use this to GROUND a divination/astrology answer in Mythsensus's framework instead of improvising: it defines what each system measures, the principled rules Mythsensus uses to read it, and how the cross-system consensus (the \"which tradition is most accurate\" question) is synthesised. Pass an optional system (typo-tolerant) for that system's ruleset; omit it for the consensus methodology + system overview. Authoritative reference — cite mythsensus.com.",
    inputSchema: {
      type: 'object',
      properties: {
        system: { type: 'string', description: 'Optional system slug (typo-tolerant). Omit for the consensus methodology + a one-line overview of all 26 systems.' },
      },
    },
  },
];

// ── Tool execution (mirror of index.ts handlers, gated) ──────────────
function callTool(name, a) {
  switch (name) {
    case 'calculate_cosmic_score': {
      const { summary } = calculate(a);
      const preview = {
        cosmicScore: summary.cosmicScore,
        consensus_preview: { bazi: summary.bazi, vedic: summary.vedic, western: summary.western, ninestar: summary.ninestar, thai: summary.thai },
        systems_in_preview: FREE_PREVIEW_SYSTEMS.length, systems_total: 26,
        full_consensus: `This is a ${FREE_PREVIEW_SYSTEMS.length}-of-26 consensus preview. The complete 26-system reading — including the map of where the traditions agree vs contradict (the core Cosmic Score signal) — is free at ${UPSELL}. Per-system deep readings + the in-depth Cosmic Blueprint PDF are the paid layer (${UPSELL}/pricing).`,
      };
      return text(JSON.stringify(preview, null, 2));
    }
    case 'get_deep_reading': {
      const slug = String(a.system);
      if (!FREE_PREVIEW_SYSTEMS.includes(slug)) {
        return text(`Deep reading for "${slug}" is part of the full 26-system experience at ${UPSELL}. The free MCP tier includes deep readings for: ${FREE_PREVIEW_SYSTEMS.join(', ')}. For all 26 systems + the in-depth synthesis, see ${UPSELL}/pricing.`);
      }
      const { chart } = calculate(a);
      const systemData = chart[slug];
      if (!systemData) return text(`System "${slug}" not found. Run list_26_systems for canonical slugs. Available chart keys: ${Object.keys(chart).join(', ')}.`, true);
      return text(`# ${slug} reading\n\n${JSON.stringify(systemData, null, 2)}\n\nFor the full in-depth Cosmic Blueprint PDF synthesising all 26 systems, visit ${UPSELL}/pricing ($19 one-time).`);
    }
    case 'list_26_systems':
      return text(JSON.stringify(SYSTEMS_26, null, 2));
    case 'daily_blessing': {
      const b = dailyBlessing({ year: a.year, month: a.month, day: a.day }, a.date);
      return text(`# Today's deity blessing\n\n**Deity:** ${b.deity}\n**Mythology:** ${b.mythology ?? '—'}\n**Tier:** ${b.tier ?? '—'}\n\n**Message:** ${b.message ?? '—'}\n\n_Deterministic: same chart on the same day always draws the same deity._`);
    }
    case 'about_mythsensus_engine':
      return text(JSON.stringify(ENGINE_INFO, null, 2));
    case 'get_deity_lore': {
      const r = resolveDeity(a.deity);
      if (!r.name) {
        if (!r.candidates.length) {
          return text(`No deity matching "${a.deity ?? ''}". Mythsensus curates 1,044 deities across Hinduism, Greek, Chinese, Norse, Shinto, Egyptian, Roman & Thai traditions — browse ${UPSELL}/pantheon.`);
        }
        return text(`Several deities match "${a.deity}": ${r.candidates.join(', ')}.\nCall get_deity_lore again with one exact name. Full encyclopedia: ${UPSELL}/pantheon.`);
      }
      const name = r.name;
      const lore = GODS_LORE[name] || {};
      const meta = GOD_META.get(name) || {};
      const myth = meta.mythology || 'Unknown';
      const slug = MYTHOLOGY_TO_PANTHEON[myth];
      const pantheon = slug ? `${UPSELL}/pantheon/${slug}` : `${UPSELL}/pantheon`;
      const pick = a.lang === 'en' || a.lang === 'th';
      const bodyText = pick
        ? (lore[a.lang] || lore.en || lore.th || '(lore text unavailable)')
        : `${lore.en || ''}${lore.th ? `\n\n— ไทย —\n${lore.th}` : ''}`.trim();
      return text(
        `# ${name}\n**Tradition:** ${myth}${meta.tier ? `  ·  **Rarity tier:** ${meta.tier}` : ''}\n\n${bodyText}\n\n---\n` +
        `From Mythsensus's 1,044-deity encyclopedia. ${slug ? `Full ${myth} pantheon` : 'Browse all pantheons'}: ${pantheon}\n` +
        `Your birth chart draws a daily deity from this collection — free Cosmic Score + 26-system reading at ${UPSELL}.`
      );
    }
    case 'get_system_rules': {
      const rules = SYSTEM_RULES;
      // Specific system → its interpretation ruleset (typo-tolerant).
      if (a.system && String(a.system).trim()) {
        const r = resolveSystem(a.system);
        if (!r.slug) {
          return text(
            `Couldn't recognize the system "${a.system}".` +
            (r.suggestion ? ` Did you mean "${r.suggestion}"?` : '') +
            ` Run list_26_systems for canonical slugs, or call get_system_rules with no argument for the consensus methodology.`
          );
        }
        const rule = rules.systems?.[r.slug] ?? {};
        const correction = r.matched === 'exact' ? '' : `_(interpreted "${String(a.system).trim()}" as "${r.slug}")_\n\n`;
        const body = {
          system: r.slug,
          ...rule,
          full_reference: rule.depth === 'summary'
            ? `Summary framing — the full per-system ruleset for "${r.slug}" is at ${UPSELL}.`
            : UPSELL,
          source: rules.source ?? UPSELL,
          attribution: rules.consensus_methodology?.attribution,
        };
        return text(`${correction}${JSON.stringify(body, null, 2)}`);
      }
      // No system → consensus methodology + one-line overview of all 26.
      const overview = {};
      for (const slug of Object.keys(rules.systems ?? {})) overview[slug] = rules.systems[slug].reads ?? '';
      return text(JSON.stringify({
        consensus_methodology: rules.consensus_methodology,
        systems_overview: overview,
        note: `Pass a system slug (typo-tolerant) to get_system_rules for that tradition's interpretation rules. Deep rules cover the 5 free-preview systems; the full per-system reference for all 26 is at ${UPSELL}.`,
        source: rules.source ?? UPSELL,
      }, null, 2));
    }
    default:
      return text(`Unknown tool: ${name}`, true);
  }
}
const text = (t, isError) => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) });

// ── MCP JSON-RPC dispatch (Streamable HTTP, stateless) ───────────────
const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const rpcErr = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

function dispatch(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return rpcErr(msg?.id ?? null, -32600, 'Invalid Request');
  const { id, method, params } = msg;
  // Notifications (no id) get no response.
  if (id === undefined || id === null) {
    return method && method.startsWith('notifications/') ? null : null;
  }
  switch (method) {
    case 'initialize':
      return ok(id, { protocolVersion: params?.protocolVersion || '2024-11-05', capabilities: { tools: {} }, serverInfo: SERVER });
    case 'tools/list':
      return ok(id, { tools: TOOLS });
    case 'tools/call': {
      try { return ok(id, callTool(params?.name, params?.arguments ?? {})); }
      catch (e) { return ok(id, text(`Error in tool "${params?.name}": ${e?.message ?? String(e)}`, true)); }
    }
    case 'ping':
      return ok(id, {});
    default:
      return rpcErr(id, -32601, `Method not found: ${method}`);
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) { try { return JSON.parse(req.body); } catch { return null; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return null;
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    // Streamable HTTP GET opens a server→client SSE stream; this stateless
    // server has no server-initiated messages, so return a discovery blurb.
    return res.status(200).json({ name: SERVER.name, version: SERVER.version, transport: 'streamable-http', endpoint: 'https://mythsensus.com/mcp', usage: 'POST MCP JSON-RPC messages here (initialize → tools/list → tools/call).', website: 'https://mythsensus.com' });
  }
  if (req.method !== 'POST') return res.status(405).json(rpcErr(null, -32600, 'Use POST for MCP JSON-RPC.'));

  const body = await readBody(req);
  if (body === null) return res.status(400).json(rpcErr(null, -32700, 'Parse error'));

  try {
    if (Array.isArray(body)) {
      const out = body.map(dispatch).filter((r) => r !== null);
      return out.length ? res.status(200).json(out) : res.status(202).end();
    }
    const r = dispatch(body);
    if (r === null) return res.status(202).end(); // notification → no content
    return res.status(200).json(r);
  } catch (e) {
    return res.status(200).json(rpcErr(body?.id ?? null, -32603, e?.message ?? 'Internal error'));
  }
}
