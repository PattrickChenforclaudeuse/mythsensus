'use client'
// ============================================================
//  hooks/useDailyLimit.ts — Check + track a daily usage limit
//  Used by gods/draw and organum pages to show remaining uses.
// ============================================================
import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { TABLES } from '@/lib/constants'

interface DailyLimitState {
  count:   number
  loading: boolean
  refresh: () => void
}

export function useDailyLimit(
  table: typeof TABLES.ORGANUM_SESSIONS | typeof TABLES.GOD_DRAWS,
  userId: string | null,
  dateColumn: 'created_at' | 'draw_date' = 'created_at',
): DailyLimitState {
  const supabase = createSupabaseBrowser()
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId!)

      // The two tables use different date column names
      if (dateColumn === 'draw_date') {
        query.eq('draw_date', today)
      } else {
        query.gte('created_at', `${today}T00:00:00Z`)
      }

      const { count: c } = await query
      setCount(c ?? 0)
      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tick])

  return { count, loading, refresh: () => setTick(t => t + 1) }
}
