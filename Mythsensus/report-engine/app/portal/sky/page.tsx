'use client'
// QA-3: NEVER say good/bad — only planet position + movement
import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

type TabKey = 'career' | 'finance' | 'love' | 'health' | 'growth'

const TAB_LABELS: Record<TabKey, string> = {
  career: '💼 Career', finance: '💰 Finance', love: '💫 Love', health: '🌿 Health', growth: '🌱 Growth',
}

interface PlanetEntry {
  planet: string; sign_en: string; sign_th: string; degree: number
  house: number; movement: string; natal_sign_en: string; meaning: string
}

export default function SkyPage() {
  const supabase = createSupabaseBrowser()
  const [tab, setTab]       = useState<TabKey>('career')
  const [data, setData]     = useState<{ free_only: boolean; date: string; sun?: PlanetEntry; tabs?: Record<TabKey, PlanetEntry[]> } | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      const pid = profiles?.[0]?.id ?? null
      setProfileId(pid)

      const url = pid ? `/api/sky?profile_id=${pid}` : '/api/sky'
      const res = await fetch(url)
      if (!res.ok) { setError('โหลดไม่ได้'); setLoading(false); return }
      const json = await res.json()
      setData(json)
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div style={{ color: '#6a5a42', padding: 40 }}>กำลังโหลดข้อมูลดาว...</div>
  if (error)   return <div style={{ color: '#f0a080', padding: 40 }}>{error}</div>

  const today = data?.date ? new Date(data.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 6 }}>DAILY TRANSIT</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>Today Sky</h1>
        <p style={{ fontSize: 13, color: '#6a5a42', marginTop: 6 }}>{today} · ตำแหน่งดาววันนี้เทียบกับดวงเกิดของคุณ</p>
        {/* QA-3: note that we don't say good/bad */}
        <p style={{ fontSize: 11, color: '#4a3a2a', marginTop: 4 }}>แสดงตำแหน่งและการเคลื่อนที่เท่านั้น — ตีความเองตามบริบทชีวิตคุณ</p>
      </div>

      {data?.free_only ? (
        /* Free user — Sun only */
        <div>
          <div style={{ background: '#1a1510', border: '1px solid #3a3020', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#6a5a42', marginBottom: 12 }}>SUN POSITION TODAY</div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ fontSize: 40 }}>☀️</div>
              <div>
                <div style={{ fontSize: 20, color: '#d4aa50', fontWeight: 700 }}>
                  {data.sun?.sign_en} {data.sun?.degree}°
                  {data.sun?.sign_th && <span style={{ fontSize: 14, color: '#9a8a72', marginLeft: 8 }}>{data.sun.sign_th}</span>}
                </div>
                <div style={{ fontSize: 13, color: '#6a5a42', marginTop: 4 }}>{data.sun?.movement}</div>
                <div style={{ fontSize: 12, color: '#9a8a72', marginTop: 6 }}>{data.sun?.meaning}</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#0a0f14', border: '1px solid #204060', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#9a8a72', marginBottom: 16 }}>
              Subscribe เพื่อดูดาวส่วนตัวครบ 5 มิติ — Career · Finance · Love · Health · Growth<br/>
              เปรียบเทียบกับดวงเกิดจริง (Natal vs Transit)
            </div>
            <a href="/portal/billing" style={{ background: 'linear-gradient(135deg,#0a3050,#1060a0)', color: '#4090c0', padding: '10px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              Subscribe $9/เดือน →
            </a>
          </div>
        </div>
      ) : (
        /* Sub user — full 5 tabs */
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            {(Object.keys(TAB_LABELS) as TabKey[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                  background: tab === t ? '#1a1510' : '#0e0c08',
                  color:      tab === t ? '#d4aa50' : '#6a5a42',
                  outline:    tab === t ? '1px solid #3a3020' : 'none',
                }}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Planet cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data?.tabs?.[tab] ?? []).map((planet: PlanetEntry) => (
              <div key={planet.planet} style={{ background: '#1a1510', border: '1px solid #2a2010', borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 140 }}>
                  <div style={{ fontSize: 15, color: '#d4aa50', fontWeight: 700 }}>{planet.planet}</div>
                  <div style={{ fontSize: 13, color: '#f0e8d0', marginTop: 2 }}>
                    {planet.sign_en} {planet.degree}°
                    <span style={{ color: '#9a8a72', marginLeft: 6, fontSize: 12 }}>House {planet.house}</span>
                  </div>
                  <div style={{ fontSize: 11, color: planet.movement.includes('Retrograde') ? '#c08060' : '#4aaa4a', marginTop: 4 }}>
                    {planet.movement}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#9a8a72', marginBottom: 4 }}>{planet.meaning}</div>
                  {planet.natal_sign_en && planet.natal_sign_en !== planet.sign_en && (
                    <div style={{ fontSize: 11, color: '#4a3a2a' }}>
                      Natal: {planet.natal_sign_en} → Transit: {planet.sign_en}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
