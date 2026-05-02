// ============================================================
//  lib/supabase-server.ts — Server-only Supabase client
//  Use in: API Route Handlers, Server Components, middleware
//  Uses next/headers (cookies) — never import in 'use client'
// ============================================================
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Server Component / Route Handler client — refreshes session via cookies */
export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — cookies are read-only; middleware handles refresh
        }
      },
    },
  })
}
