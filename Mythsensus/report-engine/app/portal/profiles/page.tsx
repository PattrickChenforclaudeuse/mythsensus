'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser, UserProfile } from '@/lib/supabase'

export default function ProfilesPage() {
  const supabase = createSupabaseBrowser()
  const router   = useRouter()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading]   = useState(true)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setProfiles(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm('ลบ Profile นี้? รายงานที่เกี่ยวข้องจะยังเข้าถึงได้ผ่าน UUID')) return
    await supabase.from('profiles').delete().eq('id', id)
    load()
  }

  if (loading) return <div style={{ color: '#6a5a42', padding: 40 }}>กำลังโหลด...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 6 }}>BIRTH CHARTS</div>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>Profiles</h1>
          <p style={{ fontSize: 13, color: '#6a5a42', marginTop: 6 }}>จัดการดวงชะตาหลายคน — ตัวเอง ครอบครัว คู่</p>
        </div>
        <button onClick={() => router.push('/onboarding')}
          style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          + เพิ่ม Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div style={{ background: '#1a1510', border: '1px solid #2a2010', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#6a5a42', marginBottom: 16 }}>ยังไม่มี Profile — สร้างรายงาน Premium เพื่อเริ่มต้น</div>
          <button onClick={() => router.push('/onboarding')}
            style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', border: 'none', padding: '12px 28px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
            ✦ รับรายงาน Premium — $49
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {profiles.map(p => (
            <div key={p.id} style={{ background: '#1a1510', border: '1px solid #2a2010', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, color: '#d4aa50', fontWeight: 700 }}>{p.display_name || 'ไม่มีชื่อ'}</div>
                <div style={{ fontSize: 12, color: '#9a8a72', marginTop: 3 }}>
                  {p.dob} · {p.birth_place} · {p.gender === 'M' ? 'ชาย' : p.gender === 'F' ? 'หญิง' : 'อื่นๆ'}
                </div>
                {p.cosmic_score && (
                  <div style={{ fontSize: 12, color: '#6a5a42', marginTop: 4 }}>
                    Cosmic Score: <span style={{ color: '#d4aa50' }}>{p.cosmic_score}</span> · {p.tier} · Day Master: <span style={{ color: '#d4aa50' }}>{p.dm_element}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {p.systems_json && (
                  <button onClick={() => router.push('/onboarding')}
                    style={{ background: '#1a2010', border: '1px solid #3a4020', color: '#8aba50', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    รายงาน →
                  </button>
                )}
                <button onClick={() => handleDelete(p.id)}
                  style={{ background: '#1a0a0a', border: '1px solid #3a1010', color: '#9a4a4a', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
