// ============================================================
//  Oracle Add-on — UNIVERSAL schema (all 26 systems)
//  6 categories × 10 universal questions × 2 voice modes
//  Version: 2.0 (replaces bazi-only 3-section schema 1.0)
//  Locked 2026-06-09 with director
// ============================================================
//
//  Design principle:
//    - Every question is PATTERN + TIMING, NOT event prediction.
//    - Works for every life stage / employment / relationship status.
//    - status fields (relationship_status, ...) only adjust answer
//      emphasis, never change the question shown to the user.
//
//  See _shared/system-prompt-base.md for voice rules + few-shots.
//  See <system>/framework.md for system-specific knowledge.

// ─── System identity ────────────────────────────────────────

export type SystemKey =
  | 'bazi' | 'vedic' | 'western' | 'ninestar' | 'numerology'
  | 'humandesign' | 'mayan' | 'thai' | 'saju' | 'celtic'
  | 'tibetan' | 'ziwei' | 'onmyodo' | 'hellenistic' | 'norseRune'
  | 'ogham' | 'arabicParts' | 'kabbalistic' | 'zoroastrian' | 'aztec'
  | 'nativeAmerican' | 'ifaYoruba' | 'aboriginal' | 'biorhythm'
  | 'vedicMahadasha' | 'taksa'

export type VoiceMode = 'engineer' | 'oracle'

export type Lang = 'th' | 'en'

// ─── User context that affects emphasis ─────────────────────

/** 'unknown' is the default for users who haven't filled it in */
export type RelationshipStatus =
  | 'single'
  | 'in_relationship'
  | 'married'
  | 'separated'
  | 'unknown'

// ─── Category + question contracts ──────────────────────────

export type CategoryKey =
  | 'work'     // 事 — การงาน
  | 'money'    // 財 — การเงิน
  | 'love'     // 緣 — ความรัก
  | 'health'   // 身 — สุขภาพ
  | 'people'   // 家 — ครอบครัว/คนใกล้ตัว
  | 'warning'  // 戒 — สิ่งที่ต้องระวัง

export const CATEGORIES: Record<CategoryKey, { th: string; en: string; glyph: string }> = {
  work:    { th: 'การงาน',                 en: 'Work',         glyph: '事' },
  money:   { th: 'การเงิน',                 en: 'Money',        glyph: '財' },
  love:    { th: 'ความรัก',                 en: 'Love',         glyph: '緣' },
  health:  { th: 'สุขภาพ',                  en: 'Health',       glyph: '身' },
  people:  { th: 'ครอบครัว / คนใกล้ตัว',     en: 'People',       glyph: '家' },
  warning: { th: 'สิ่งที่ต้องระวัง',          en: 'Cautions',     glyph: '戒' },
}

/** Universal question set — same wording across all 26 systems.
 *  Each system answers from its own framework knowledge.
 *  Distribution: work 2 · money 2 · love 2 · health 1 · people 1 · warning 2 = 10.
 */
export const UNIVERSAL_QUESTIONS: Array<{
  q_key: string
  category: CategoryKey
  th: string
  en: string
}> = [
  { q_key: 'work_energy_direction', category: 'work',
    th: 'ปีนี้พลังทางการงานของคุณ ขึ้น / นิ่ง / ลด / แปลงร่าง? เพราะอะไร?',
    en: 'How is your career energy shifting — rising, stable, dipping, transforming? Why?' },
  { q_key: 'work_boldest_move_window', category: 'work',
    th: 'จังหวะ "ก้าวที่กล้าที่สุด" ของปีอยู่ช่วงไหน? + ลงมือทำอะไร?',
    en: 'When is your boldest move of the year — and what should it be?' },
  { q_key: 'money_flow_direction', category: 'money',
    th: 'กระแสเงินปีนี้ เข้า > ออก หรือ ออก > เข้า? ทำไม?',
    en: 'Net cash flow this year — inflow or outflow? Why?' },
  { q_key: 'money_leak_or_windfall', category: 'money',
    th: 'ปีนี้มี "รูรั่ว" หรือ "ก้อนทอง" ที่จุดไหน? + จะปรากฏเมื่อไร?',
    en: 'Where is the leak — or the windfall — and when does it surface?' },
  { q_key: 'love_energy_state', category: 'love',
    th: 'พลังความรักของคุณปีนี้ เปิด / ปิด / กำลังเปลี่ยน? แปลว่ายังไง?',
    en: 'Is your love energy open, closed, or transforming? What does that mean?' },
  { q_key: 'love_timing_windows', category: 'love',
    th: 'ช่วงเดือนไหนคือ "หน้าต่างสำคัญ" ของความสัมพันธ์? (เริ่ม · พัฒนา · ตัดสินใจ · ปล่อย)',
    en: 'Which months are the key relationship windows — to begin, deepen, decide, or release?' },
  { q_key: 'health_weak_point', category: 'health',
    th: 'ปีนี้ "จุดอ่อน" ของร่างกายคืออะไร? ช่วงไหนต้องดูแลพิเศษ?',
    en: 'What is your body\'s weak point — and which months need extra care?' },
  { q_key: 'people_who_changes_you', category: 'people',
    th: 'ใครคือ "คนที่จะเปลี่ยนชีวิตคุณ" ปีนี้? + เปลี่ยนยังไง?',
    en: 'Who will change your life this year — and how?' },
  { q_key: 'warning_high_risk_window', category: 'warning',
    th: 'ช่วงเดือนไหน "เสี่ยงสุด"? เสี่ยงเรื่องอะไร?',
    en: 'Which months are highest-risk — and about what?' },
  { q_key: 'warning_specific', category: 'warning',
    th: 'ปีนี้ต้องระวัง "อะไร / ใคร" เป็นพิเศษ? (คน · สัญญา · การตัดสินใจ · วัตถุ)',
    en: 'What — or who — needs special caution? (People, contracts, decisions, objects?)' },
] as const

// ─── Input from frontend to oracle API ──────────────────────

/** 4-period coarse calendar for month-window references in answers.
 *  Engine pre-computes these from the chart's year_pillar / luck pillar.
 *  ⚠ v1 engine uses approximate month boundaries; v2 uses precise jiéqì.
 */
export interface MonthWindow {
  month_num: number
  iso_start: string
  iso_end: string
  /** Display label, e.g. 'ม.ค.' or 'ม.ค.–ก.พ.' */
  label: string
}

/** What the frontend sends to /api/oracle/[system]/addon */
export interface OracleAddonRequest {
  system: SystemKey
  lang: Lang
  /** Same chart hash the rest of the app uses — also the cache key */
  chart_hash: string
  /** System-specific chart payload — see <system>/framework.md for the shape */
  chart: Record<string, unknown>
  /** Year being forecast — defaults to current calendar year if omitted */
  year: number
  /** Pre-computed month windows (4-12 entries) */
  months: MonthWindow[]
  /** Profile context — used to adjust emphasis, NOT to change questions */
  context: {
    name?: string
    gender?: string
    relationship_status?: RelationshipStatus
    work_country?: string
    domain?: string
  }
}

// ─── Output from oracle to frontend ─────────────────────────

/** Visual tag — used by frontend to color-code answer cards */
export type AnswerTag = 'peak' | 'caution' | 'open' | 'consolidate' | 'neutral'

export interface QuestionAnswer {
  q_key: string
  category: CategoryKey
  /** Re-emitted by the LLM so the frontend can render without lookup */
  q_label_th: string
  q_label_en: string
  /** 1-sentence headline that gives the punchline — bold display */
  headline: string
  /** 2-4 paragraph body explaining the why + how */
  body: string
  /** Specific month references mentioned in the body (for cross-link) */
  month_refs: string[]
  tag: AnswerTag
  /** Engine fields referenced — every astrological claim must cite ≥1 */
  engine_refs: string[]
}

export interface CategorySection {
  category: CategoryKey
  category_label_th: string
  category_label_en: string
  glyph: string
  /** Bold prediction opening sentence — anchors the whole category */
  opening: string
  /** 1-3 framing paragraphs that frame the category before Q&A */
  framing: string
  /** Always exactly the questions assigned to this category by UNIVERSAL_QUESTIONS */
  questions: QuestionAnswer[]
  /** Italic closing reframe — 1 sentence */
  closing: string
}

export interface OracleAddonOutput {
  title: string
  subtitle: string
  year: number
  system: SystemKey
  lang: Lang
  /** Hero anchor for the whole reading — 1 sentence */
  hero_statement: string
  /** Exactly 6 sections, in CATEGORIES order */
  sections: CategorySection[]
  /** Word count for cost monitoring */
  word_count: number
  /** Hash of (system-prompt-base + framework.md + this schema version)
   *  Cached responses are invalidated when this changes. */
  prompt_version: string
}

export interface OracleAddonResponse {
  oracle: OracleAddonOutput
  /** Whether this came from cache (cost = 0) or fresh render (cost > 0) */
  cached: boolean
  generated_ms: number
  cost_cents?: number
  model?: string
}

// ─── Acceptance checks ──────────────────────────────────────

export const ACCEPTANCE = {
  /** Total word count of all section bodies + answers (sanity bounds) */
  MIN_WORDS: 1500,
  MAX_WORDS: 3500,
  TARGET_WORDS: 2200,
  /** Each section must mention at least this many engine fields total */
  MIN_ENGINE_REFS_PER_SECTION: 3,
  /** Tag distribution — falsifiability matters; no "all peak" answers */
  MAX_PEAK_ANSWERS: 4,
  MAX_CAUTION_ANSWERS: 4,
  /** API hard timeout (Vercel function ceiling is 60s; oracle render budget) */
  MAX_GENERATE_MS: 25000,
  /** Daily cost guard — soft cap, configurable via env */
  DEFAULT_DAILY_BUDGET_CENTS: 3000,
  /** Per-user daily cap */
  DEFAULT_USER_DAILY_RENDERS: 10,
} as const

/** Validate output structure before returning to client.
 *  Returns null on success, error string on failure (sent to client as 502). */
export function validateOutput(out: OracleAddonOutput): string | null {
  if (!out || typeof out !== 'object') return 'oracle output not an object'
  if (!out.title || !out.hero_statement) return 'missing title/hero'
  if (!Array.isArray(out.sections) || out.sections.length !== 6) {
    return `sections must be exactly 6, got ${out.sections?.length ?? 0}`
  }
  const seenCategories = new Set<string>()
  let totalAnswers = 0
  let tagCounts: Record<AnswerTag, number> = {
    peak: 0, caution: 0, open: 0, consolidate: 0, neutral: 0,
  }
  for (const sec of out.sections) {
    if (!CATEGORIES[sec.category]) return `unknown category: ${sec.category}`
    if (seenCategories.has(sec.category)) return `duplicate category: ${sec.category}`
    seenCategories.add(sec.category)
    if (!sec.opening || !sec.closing) return `section ${sec.category} missing opening/closing`
    if (!Array.isArray(sec.questions)) return `section ${sec.category} missing questions`
    // Each question must be in UNIVERSAL_QUESTIONS and match this category
    for (const a of sec.questions) {
      const def = UNIVERSAL_QUESTIONS.find(q => q.q_key === a.q_key)
      if (!def) return `unknown question key: ${a.q_key}`
      if (def.category !== sec.category) {
        return `question ${a.q_key} in wrong category (expected ${def.category}, got ${sec.category})`
      }
      if (!a.headline || !a.body) return `answer ${a.q_key} missing headline/body`
      if (!Array.isArray(a.engine_refs) || a.engine_refs.length === 0) {
        return `answer ${a.q_key} must cite ≥1 engine_refs`
      }
      if (!tagCounts.hasOwnProperty(a.tag)) return `answer ${a.q_key} invalid tag: ${a.tag}`
      tagCounts[a.tag]++
      totalAnswers++
    }
  }
  if (totalAnswers !== 10) return `must have exactly 10 answers across all sections, got ${totalAnswers}`
  if (tagCounts.peak > ACCEPTANCE.MAX_PEAK_ANSWERS) {
    return `peak tags ${tagCounts.peak} > cap ${ACCEPTANCE.MAX_PEAK_ANSWERS} — not falsifiable`
  }
  if (tagCounts.caution > ACCEPTANCE.MAX_CAUTION_ANSWERS) {
    return `caution tags ${tagCounts.caution} > cap ${ACCEPTANCE.MAX_CAUTION_ANSWERS}`
  }
  const wc = out.word_count ?? 0
  if (wc < ACCEPTANCE.MIN_WORDS || wc > ACCEPTANCE.MAX_WORDS) {
    return `word_count ${wc} out of bounds [${ACCEPTANCE.MIN_WORDS}, ${ACCEPTANCE.MAX_WORDS}]`
  }
  return null
}
