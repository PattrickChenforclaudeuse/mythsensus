// ============================================================
//  Supabase clients - browser + admin only
//  Server components: import from '@/lib/supabase-server'
//  Client components ('use client'): createSupabaseBrowser()
//  API routes / service actions: createSupabaseAdmin()
// ============================================================

import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Use in 'use client' components */
export function createSupabaseBrowser() {
  return createBrowserClient(URL, ANON)
}

/** Use in API routes that need admin access (bypasses RLS) */
export function createSupabaseAdmin() {
  return createClient(URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// -- Types matching the Supabase schema ---------------------------
export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  dob: string
  birth_time: string | null
  birth_place: string
  birth_lat: number | null
  birth_lon: number | null
  birth_tz: number | null
  gender: 'M' | 'F' | 'X'
  birth_country: string | null
  work_country: string | null
  career_level: string | null
  domain: string | null
  industry: string | null
  cosmic_score: number | null
  soul_freq: number | null
  life_terrain: number | null
  path_resonance: number | null
  tier: string | null
  dm_element: string | null
  nsk_star: number | null
  life_path: number | null
  systems_json: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  profile_id: string
  report_uuid: string
  report_type: 'premium' | 'compatibility' | string
  html_content: string | null
  pdf_url: string | null
  generated_at: string
  expires_at: string | null
}

export interface GodDraw {
  id: string
  user_id: string
  god_id: string
  god_name: string
  tier: string
  blessing: string
  origin: string
  element: string
  draw_date: string
  draw_overflow_flag: boolean
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  tier: 'free' | 'premium' | 'sub' | string
  status: 'active' | 'cancelled' | 'past_due' | string
  current_period_end: string | null
}
