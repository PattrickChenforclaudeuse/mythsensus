// ============================================================
//  lib/types.ts — All shared TypeScript types & interfaces
//  One file to define them all. Import from here, not from
//  individual route files or page components.
// ============================================================
import type { Tier, Plan } from './constants'

// ── Supabase DB rows (mirrors actual DB schema) ───────────────
export interface ProfileRow {
  id:                 string
  user_id:            string | null
  name:               string
  dob:                string          // 'YYYY-MM-DD'
  birth_time:         string | null
  birth_place:        string
  birth_lat:          number | null
  birth_lon:          number | null
  birth_tz:           number | null
  gender:             'male' | 'female' | 'other'
  relationship_label: string | null
  birth_country:      string | null
  work_country:       string | null
  career_level:       string | null
  domain:             string | null
  industry:           string | null
  cosmic_score:       number | null
  soul_freq:          number | null
  life_terrain:       number | null
  path_resonance:     number | null
  tier:               string | null
  dm_element:         string | null
  nsk_star:           number | null
  life_path:          number | null
  systems_json:       Record<string, unknown> | null
  created_at:         string
  updated_at:         string
}

export interface ReportRow {
  id:            string
  profile_id:    string
  report_uuid:   string
  type:          'full' | 'companion' | 'element' | string
  html_content:  string | null
  pdf_url:       string | null
  status:        'pending' | 'ready' | 'failed' | string
  purchased_at:  string | null
  generated_at:  string | null
  expires_at:    string | null
  created_at:    string
}

export interface GodDrawRow {
  id:                string
  user_id:           string
  profile_id:        string | null
  god_id:            string
  god_name:          string
  tier:              string
  blessing:          string
  origin:            string
  element:           string
  draw_date:         string          // 'YYYY-MM-DD'
  draw_overflow_flag: boolean
  drawn_at:          string
}

export interface OrganumSessionRow {
  id:         string
  user_id:    string
  profile_id: string | null
  question:   string
  response:   OrganumResponse | null
  answer:     string | null          // legacy column
  created_at: string
}

export interface SubscriptionRow {
  id:                      string
  user_id:                 string
  stripe_customer_id:      string | null
  stripe_subscription_id:  string | null
  tier:                    Plan | string
  status:                  'active' | 'cancelled' | 'past_due' | string
  current_period_end:      string | null
  created_at:              string
}

// ── God / pantheon ───────────────────────────────────────────
export interface God {
  id:        string
  name:      string
  origin:    string
  pantheon:  string
  tier:      string
  blessing:  string
  shadow:    string | null
  represents:string
  element:   string
  gender:    string
}

// ── Organum (108-god oracle) ─────────────────────────────────
export interface OrganumResponse {
  spokesperson:   string
  origin:         string
  agree_count:    number
  warn_count:     number
  neutral_count:  number
  message:        string
  consensus_note: string
}

// ── Cosmic score & tiers ─────────────────────────────────────
export interface CosmicScore {
  total:               number
  soulFrequency:       number
  lifeTerrainScore:    number
  pathResonanceScore:  number
  cosmicFinal:         number
  tier:                string   // Thai label e.g. 'ฟ้า — Celestial'
  tierEn:              Tier     // English only e.g. 'Celestial'
  percentile:          string   // e.g. 'Top 1%'  (string from calc.ts TIERS)
  maxAchievable:       number
  mean:                number
  modalBin:            number
  starCount:           number
  midCount:            number
  warnCount:           number
  primaryGod:          string
  secondaryGod:        string
  cosmicEntity:        string
  cosmicEntityDesc:    string
  lifeTerrainDetail:   string
  pathResonanceDetail: string
  breakdown:           Array<{ system: string; weight: number; score: number; finding: string; color: string }>
}

// ── BirthData (input to calculate()) ────────────────────────
export interface BirthData {
  name:          string
  gender:        string
  year:          number
  month:         number
  day:           number
  hour:          number
  minute:        number
  lat:           number
  lon:           number
  timezone:      number
  birthCountry?: string
  workCountry?:  string
  careerLevel?:  string
  domain?:       string
  industry?:     string
}

// ── Chart (output from calculate()) ──────────────────────────
export interface Chart {
  score:      CosmicScore
  bazi:       { dayMasterElement: string; [key: string]: unknown }
  ninestar:   { star: number;          [key: string]: unknown }
  numerology: { lifePath: number;      [key: string]: unknown }
  [key: string]: unknown    // other systems
}

// ── API request/response shapes ──────────────────────────────
export interface GenerateRequest {
  name?:          string
  gender?:        string
  dob:            string
  birth_time?:    string
  birth_place:    string
  birth_lat?:     number
  birth_lon?:     number
  birth_tz?:      number
  birth_country?: string
  work_country?:  string
  career_level?:  string
  domain?:        string
  industry?:      string
  profile_id?:    string
  report_type?:   string
  promo_code?:    string
}

export interface GenerateResponse {
  report_uuid:  string
  cosmic_score: number
  tier:         string   // English tier
  tier_th:      string   // Thai tier label
  percentile:   string   // e.g. 'Top 1%'
  star_count:   number
  mid_count:    number
  warn_count:   number
  soul_freq:    number
  dm_element:   string
  primary_god:  string
}

export interface CheckoutRequest {
  product_type: string
  profile_id?:  string
  success_path?: string
}

export interface OrganumRequest {
  question:    string
  profile_id?: string
}

export interface GodDrawRequest {
  profile_id?: string
}

// ── Planet transit (Today Sky) ───────────────────────────────
export interface PlanetEntry {
  planet:         string
  sign_en:        string
  sign_th:        string
  degree:         number
  house:          number
  movement:       string    // 'Direct' | 'Retrograde'
  natal_sign_en:  string
  meaning:        string
}

export type SkyTab = 'career' | 'finance' | 'love' | 'health' | 'growth'

export interface SkyResponse {
  date:       string
  free_only:  boolean
  sun?:       PlanetEntry
  tabs?:      Record<SkyTab, PlanetEntry[]>
}

// ── Stripe products ───────────────────────────────────────────
export interface StripeProduct {
  price_id:    string
  mode:        'payment' | 'subscription'
  amount:      number    // cents
  name:        string
  description: string
}

// ── Utility types ─────────────────────────────────────────────
/** Make all properties of T optional recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Extract the value type of a record */
export type ValueOf<T> = T[keyof T]

/** API error response shape */
export interface ApiError {
  error:         string
  code?:         string
  limit_reached?: boolean
}
