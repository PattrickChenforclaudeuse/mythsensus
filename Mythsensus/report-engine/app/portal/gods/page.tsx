'use client'
import { useState, useEffect } from 'react'
import { createSupabaseBrowser, GodDraw } from '@/lib/supabase'

const TIER_COLOR: Record<string, string> = {
  common: '#6a5a42', uncommon: '#4a6a9a', rare: '#2a8a4a',
  epic: '#7a3aaa', legendary: '#d4aa50', mythic: '#ff4a20',
}
const TIER_LABEL_TH: Record<string, string> = {
  common: 'ธรรมดา', uncommon: 'ไม่ธรรมดา', rare: 'หายาก',
  epic: 'มหากาพย์', legendary: 'ตำนาน', mythic: 'ยิ่งใหญ่',
}

export default function GodsPage() {
  const supabase = createSupabaseBrowser()
  const [drawn, setDrawn]     = useState<{
    god_id: string; name: string; origin: string; tier: string
    blessing: string; shadow: string | null; element: string; gender: string; is_sub: boolean
    overflow?: boolean
  } | null>(null)
  const [history, setHistory] = useState<GodDraw[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [alreadyDrew, setAlreadyDrew] = useState(false)

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('god_draws')
        .select('*')
        .eq('user_id', user.id)
        .eq('draw_overflow_flag', false)
        .order('draw_date', { ascending: false })
        .limit(30)
      setHistory(data ?? [])

      // Check if already drew today
      const today = new Date().toISOString().split('T')[0]
      const drewToday = (data ?? []).some(d => d.draw_date === today)
      setAlreadyDrew(drewToday)
    }
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDraw() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gods/draw', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) setAlreadyDrew(true)
        setError(data.error)
        return
      }
      // QA-2: overflow returns { overflow: true } — display glitch screen
      if (data.overflow) {
        setDrawn({ god_id: '???', name: '???', origin: '', tier: '???', blessing: '', shadow: null, element: '', gender: '', is_sub: false, overflow: true })
      } else {
        setDrawn(data)
        setAlreadyDrew(!data.is_sub)
      }
      // Reload history
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: h } = await supabase.from('god_draws').select('*').eq('user_id', user.id).eq('draw_overflow_flag', false).order('draw_date', { ascending: false }).limit(30)
        setHistory(h ?? [])
      }
    } catch {
      setError('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 6 }}>DAILY RITUAL</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>God Blessing</h1>
        <p style={{ fontSize: 13, color: '#6a5a42', marginTop: 6 }}>999 เทพ จากทุกมิโธโลจี · ฟรี 1 ครั้ง/วัน · Sub สะสมได้</p>
      </div>

      {/* Draw button */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {!drawn ? (
          <button onClick={handleDraw} disabled={loading || alreadyDrew}
            style={{
              background: alreadyDrew ? '#1a1510' : 'linear-gradient(135deg,#8a6010,#d4aa50)',
              color: alreadyDrew ? '#4a3a2a' : '#0a0806',
              border: alreadyDrew ? '1px solid #2a2010' : 'none',
              padding: '18px 48px', borderRadius: 10, fontSize: 16, fontWeight: 700,
              cursor: loading || alreadyDrew ? 'default' : 'pointer',
            }}>
            {loading ? '✦ กำลังเรียกเทพ...' : alreadyDrew ? '✓ รับพรวันนี้แล้ว' : '✦ รับพรวันนี้'}
          </button>
        ) : null}
        {error && <p style={{ color: '#f0a080', fontSize: 13, marginTop: 12 }}>{error}</p>}
      </div>

      {/* Result card */}
      {drawn && (
        drawn.overflow ? (
          /* QA-2: ??? glitch screen */
          <div style={{ background: '#000', border: '2px solid #ff4a20', borderRadius: 14, padding: '48px 32px', textAlign: 'center', marginBottom: 32, fontFamily: 'monospace' }}>
            <div style={{ color: '#ff4a20', fontSize: 28, marginBottom: 16, animation: 'none' }}>
              {'█'.repeat(Math.floor(Math.random() * 8 + 4))}
            </div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 4, marginBottom: 24 }}>
              YOUR DESTINY HAS CHANGED
            </div>
            <div style={{ color: '#ff4a20', fontSize: 12, fontFamily: 'monospace', marginBottom: 24 }}>
              {Array.from({ length: 3 }, () => Array.from({ length: 24 }, () => Math.random() > 0.5 ? '1' : '0').join(' ')).join('\n')}
            </div>
            <button onClick={() => setDrawn(null)} style={{ background: 'transparent', border: '1px solid #ff4a20', color: '#ff4a20', padding: '8px 28px', borderRadius: 6, cursor: 'pointer', marginTop: 8 }}>
              [close]
            </button>
          </div>
        ) : (
          <div style={{ background: '#1a1510', border: `2px solid ${TIER_COLOR[drawn.tier.toLowerCase()] || '#3a3020'}`, borderRadius: 14, padding: '28px 24px', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#f0e8d0' }}>{drawn.name}</div>
                <div style={{ fontSize: 13, color: '#9a8a72', marginTop: 4 }}>{drawn.origin} · {drawn.element}</div>
              </div>
              <div style={{ background: TIER_COLOR[drawn.tier.toLowerCase()] || '#3a3020', color: '#0a0806', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {TIER_LABEL_TH[drawn.tier.toLowerCase()] || drawn.tier}
              </div>
            </div>

            <div style={{ background: '#0a0806', border: '1px solid #2a2010', borderRadius: 10, padding: '16px 18px', marginBottom: drawn.shadow ? 12 : 0 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#6a5a42', marginBottom: 8 }}>BLESSING</div>
              <p style={{ fontSize: 14, color: '#c8c0a8', lineHeight: 1.8 }}>{drawn.blessing}</p>
            </div>

            {drawn.shadow && (
              <div style={{ background: '#1a0a0a', border: '1px solid #4a2020', borderRadius: 10, padding: '16px 18px', marginTop: 12 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: '#6a3030', marginBottom: 8 }}>SHADOW (Subscriber only)</div>
                <p style={{ fontSize: 13, color: '#c0a0a0', lineHeight: 1.8 }}>{drawn.shadow}</p>
              </div>
            )}

            <button onClick={() => setDrawn(null)} style={{ marginTop: 16, background: 'transparent', border: '1px solid #2a2010', color: '#6a5a42', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              ปิด
            </button>
          </div>
        )
      )}

      {/* Collection history */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 14 }}>COLLECTION — {history.length} / 999</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            {history.map(g => (
              <div key={g.id} style={{ background: '#111009', border: `1px solid ${TIER_COLOR[g.tier.toLowerCase()] || '#2a2010'}22`, borderRadius: 8, padding: '12px' }}>
                <div style={{ fontSize: 13, color: '#d4aa50', fontWeight: 600, marginBottom: 2 }}>{g.god_name}</div>
                <div style={{ fontSize: 11, color: TIER_COLOR[g.tier.toLowerCase()] || '#6a5a42' }}>{g.tier}</div>
                <div style={{ fontSize: 10, color: '#4a3a2a', marginTop: 4 }}>{g.draw_date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
