// ============================================================
//  /api/oracle/bazi/origin — input + output schema
//  Phase 0 — version 0.1
// ============================================================

/**
 * Chart input for the Year Pillar oracle endpoint.
 * Computed by the deterministic engine (lib/calc.ts).
 *
 * QA-1: All values must come from calc() — never hardcode.
 */
export interface BaZiOriginChart {
  /** Heavenly Stem of year pillar (年柱) — 1 of 10: 甲乙丙丁戊己庚辛壬癸 */
  year_stem: string
  /** Earthly Branch of year pillar — 1 of 12: 子丑寅卯辰巳午未申酉戌亥 */
  year_branch: string
  /** Element of year branch — 1 of 5: 木火土金水 (Wood/Fire/Earth/Metal/Water) */
  year_branch_element: 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water'
  /** Hidden stems inside year branch (0-3 stems) */
  hidden_stems_of_year_branch: string[]
  /** Na Yin (納音) of year pillar — 1 of 60, e.g. '路旁土' */
  na_yin: string
  /** Day Master stem — 1 of 10 (for Ten God relation calc) */
  day_master: string
  /**
   * Ten God relation of year_stem vs day_master.
   * One of: 七殺 正官 偏印 正印 比肩 劫財 食神 傷官 偏財 正財
   */
  ten_god_of_year_stem: string
  /** ISO birth datetime for cache key (engine outputs are pure functions of this) */
  birth_iso: string
  /** 'male' | 'female' — affects 6 Relatives interpretation */
  gender: 'male' | 'female'
}

/**
 * Oracle voice rendered output for Year Pillar chapter.
 * Validated by Anthropic SDK tool-use forced response.
 */
export interface BaZiOriginOracleOutput {
  title: string
  subtitle: string
  /** Opening hook, 2-3 Thai sentences */
  opening: string
  /** Ancestry interpretation, Thai markdown 250-300 words */
  ancestry: string
  /** Na Yin foundation + cliffhanger, Thai markdown 100-150 words */
  foundation: string
  /** Engine fields referenced (auditor cross-checks) */
  engine_refs: string[]
  /** Cross-sell to next chapter */
  cross_sell_next: 'bazi.day-master' | 'bazi.wealth' | 'bazi.love' | 'bazi.calling'
  /** Renderer's word count (Thai words + Chinese chars) */
  word_count: number
}

/**
 * Audit result from the 4-persona post-render check.
 * Used for quality gating before serving to user.
 */
export interface OracleAuditResult {
  passed: boolean
  scores: {
    engineer_skeptic: number  // 0-10
    barnum_hunter: number     // 0-10
    thai_native: number       // 0-10
    mystic_believer: number   // 0-10
  }
  notes: string[]
  /** If failed, what to regenerate */
  retry_with_hint?: string
}

/**
 * Final API response combining oracle output + audit metadata.
 */
export interface BaZiOriginResponse {
  oracle: BaZiOriginOracleOutput
  audit: OracleAuditResult
  /** ms elapsed for full pipeline (LLM + audit) */
  generated_ms: number
  /** SHA256 of input chart — cache key */
  chart_hash: string
}

/**
 * Acceptance criteria for Phase 0 (used in tests/oracle-bazi-origin.test.ts).
 */
export const ACCEPTANCE = {
  /** Min Thai words (Chinese chars count as 1 each) */
  MIN_WORDS: 400,
  /** Max Thai words */
  MAX_WORDS: 600,
  /** Target word count for happy path */
  TARGET_WORDS: 500,
  /** Min engine_refs the oracle must use (else trivial) */
  MIN_ENGINE_REFS: 3,
  /** Min audit score per persona to pass */
  MIN_PERSONA_SCORE: 6,
  /** Max LLM round-trip ms (Vercel Edge timeout = 25s) */
  MAX_GENERATE_MS: 15000,
} as const
