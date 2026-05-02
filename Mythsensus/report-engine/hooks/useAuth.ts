'use client'
// ============================================================
//  hooks/useAuth.ts — Auth state (user + subscription tier)
//  Use this in every portal page instead of duplicating
//  supabase.auth.getUser() + subscriptions query logic.
// ============================================================
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowser } from '@/lib/supabase'
import { TABLES, PLAN } from '@/lib/constants'
import type { Plan } from '@/lib/constants'
import type { SubscriptionRow } from '@/lib/types'

interface AuthState {
  user:    User | null
  plan:    Plan
  loading: boolean
}

export function useAuth(): AuthState {
  const supabase = createSupabaseBrowser()
  const [state, setState] = useState<AuthState>({ user: null, plan: PLAN.FREE, loading: true })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({ user: null, plan: PLAN.FREE, loading: false })
        return
      }

      const { data: sub } = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .select('tier, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle<SubscriptionRow>()

      const plan = (sub?.tier as Plan) ?? PLAN.FREE

      setState({ user, plan, loading: false })
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
