// ============================================================
//  /api/oracle/bazi/addon — input + output schema
//  Universal Add-on format: พื้นดวง + 12 เดือน + closing
//  Version: 1.0 (replaces v0.2 origin-only)
// ============================================================

/**
 * Static BaZi chart computed by the deterministic engine.
 * Same for any add-on call for the same person.
 */
export interface BaZiChart {
  year_stem: string
  year_branch: string
  month_stem: string
  month_branch: string
  day_stem: string         // = Day Master
  day_branch: string
  hour_stem: string
  hour_branch: string

  na_yin_year: string      // e.g. 路旁土
  day_master_element: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water'
  yong_shin: ('Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water')[]   // favorable elements

  element_counts: {
    Wood: number
    Fire: number
    Earth: number
    Metal: number
    Water: number
  }                        // 0-100 percentage (sums to 100)

  ten_god_of_year_stem: string    // year_stem vs Day Master
  ten_god_of_month_stem: string
  ten_god_of_hour_stem: string

  current_lp: {
    pillar: string                 // e.g. 丁卯
    iso_start: string              // e.g. '2019-02-04'
    iso_end:   string              // e.g. '2029-02-03'
    ten_god_vs_dm: string          // relation of LP stem to Day Master
  }

  birth_iso: string
  gender: 'male' | 'female'
  display_name?: string
}

/**
 * 12-month timeline computed for the requested forecast year.
 * Index 0 = month 1 (ม.ค.), index 11 = month 12 (ธ.ค.).
 */
export interface MonthSlice {
  /** 1-12 */
  month_num: number
  /** Display label, e.g. 'ม.ค.' */
  label: string
  /** Solar-term boundary (BaZi month starts not on calendar 1st), e.g. '2026-01-06' */
  iso_start: string
  iso_end: string
  /** e.g. '己' */
  stem: string
  /** e.g. '丑' */
  branch: string
  /** Month pillar combo, e.g. '己丑' */
  pillar: string
  /** Relation of month stem to Day Master, e.g. '正財' */
  ten_god: string
  /** '沖' (clash) | '合' (combo) | null vs day_pillar */
  clash_or_combo: string | null
}

/**
 * Year-level context (Liu Nian) for the requested forecast year.
 */
export interface YearContext {
  year: number                                // e.g. 2026
  year_pillar: string                         // e.g. '丙午'
  liu_nian_ten_god: string                    // year_stem vs Day Master
  year_pillar_vs_day_pillar: string | null    // '沖' | '合' | null
}

/**
 * Full request to /api/oracle/bazi/addon.
 */
export interface BaZiAddonRequest {
  chart: BaZiChart
  year_context: YearContext
  months: MonthSlice[]                        // length must be 12
}

// ─── Output ─────────────────────────────────────────────────

export interface SectionA {
  hero_statement: string
  identity_reading: string
  key_themes: string[]                        // length 3
}

export type MonthTag = 'peak' | 'caution' | 'open' | 'consolidate'

export interface MonthCard {
  label: string
  iso_range: string
  pillar: string
  pillar_phonetic: string
  ten_god: string
  ten_god_phonetic: string
  headline: string
  action: string
  watch: string | null
  tag: MonthTag
}

export interface SectionB {
  year_pillar: string
  year_pillar_phonetic: string
  liu_nian_ten_god: string
  liu_nian_ten_god_phonetic: string
  months: MonthCard[]                         // length 12
}

export interface SectionC {
  year_theme: string
  long_arc_cliffhanger: string
  cross_sell: string
}

export interface BaZiAddonOracleOutput {
  title: string
  subtitle: string
  section_a: SectionA
  section_b: SectionB
  section_c: SectionC
  engine_refs: string[]
  word_count: number
}

export interface BaZiAddonResponse {
  oracle: BaZiAddonOracleOutput
  generated_ms: number
  chart_hash: string
}

// ─── Acceptance ─────────────────────────────────────────────

export const ACCEPTANCE = {
  MIN_WORDS: 1200,
  MAX_WORDS: 2000,
  TARGET_WORDS: 1500,
  MIN_ENGINE_REFS: 5,
  /** Month tag distribution caps (false promises of all peaks = falsifiability fail) */
  MAX_PEAK_MONTHS: 3,
  MAX_CAUTION_MONTHS: 3,
  MAX_GENERATE_MS: 25000,
} as const

/**
 * Validate output respects tag distribution.
 */
export function validateTagDistribution(months: MonthCard[]): string | null {
  const counts = { peak: 0, caution: 0, open: 0, consolidate: 0 }
  for (const m of months) counts[m.tag]++
  if (counts.peak > ACCEPTANCE.MAX_PEAK_MONTHS) {
    return `peak months ${counts.peak} > cap ${ACCEPTANCE.MAX_PEAK_MONTHS}`
  }
  if (counts.caution > ACCEPTANCE.MAX_CAUTION_MONTHS) {
    return `caution months ${counts.caution} > cap ${ACCEPTANCE.MAX_CAUTION_MONTHS}`
  }
  if (months.length !== 12) return `months must be 12, got ${months.length}`
  return null
}
