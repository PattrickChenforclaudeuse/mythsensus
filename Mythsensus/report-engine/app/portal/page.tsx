'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowser, UserProfile, Subscription } from '@/lib/supabase'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#1a1510', border: '1px solid #2a2010', borderRadius: 10, padding: '18px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#d4aa50' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#9a8a72', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#4a3a2a', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

const TIER_COLOR: Record<string, string> = {
  Celestial: '#d4aa50', Radiant: '#c8e040', Luminous: '#40c0a0',
  Resonant: '#6080d0', Grounded: '#a08060', Seeking: '#806050', Emerging: '#605040',
}

export default function PortalDashboard() {
  const supabase = createSupabaseBrowser()
  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [sub, setSub]           = useState<Subscription | null>(null)
  const [reports, setReports]   = useState<{ report_uuid: string; generated_at: string; report_type: string }[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profiles }, { data: subs }, { data: rpts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
        supabase.from('reports').select('report_uuid,generated_at,report_type').order('generated_at', { ascending: false }).limit(5),
      ])

      setProfile(profiles?.[0] ?? null)
      setSub(subs ?? null)
      setReports(rpts ?? [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6a5a42', fontSize: 14 }}>
      กำลังโหลด...
    </div>
  )

  const tierColor = TIER_COLOR[profile?.tier ?? ''] || '#9a8a72'

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 6 }}>PORTAL DASHBOARD</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>
          สวัสดี{profile?.display_name ? `, ${profile.display_name}` : ''}
        </h1>
        {sub && (
          <div style={{ marginTop: 8, display: 'inline-block', background: '#1a3a10', border: '1px solid #2a6a20', borderRadius: 20, padding: '3px 14px', fontSize: 12, color: '#4aaa4a' }}>
            ✓ {sub.tier === 'sub' ? 'Subscriber' : sub.tier === 'premium' ? 'Premium' : sub.tier}
          </div>
        )}
      </div>

      {/* Score overview */}
      {profile ? (
        <>
          <div style={{ background: '#1a1510', border: `2px solid ${tierColor}`, borderRadius: 14, padding: '24px', marginBottom: 24, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: tierColor, lineHeight: 1 }}>{profile.cosmic_score ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#6a5a42', letterSpacing: 2, marginTop: 4 }}>COSMIC SCORE</div>
            </div>
            <div>
              <div style={{ fontSize: 22, color: '#f0e8d0', fontWeight: 700 }}>{profile.tier}</div>
              <div style={{ fontSize: 13, color: '#9a8a72', marginTop: 4 }}>Day Master: <span style={{ color: '#d4aa50' }}>{profile.dm_element || '—'}</span></div>
              <div style={{ fontSize: 13, color: '#9a8a72' }}>Life Path: <span style={{ color: '#d4aa50' }}>{profile.life_path ?? '—'}</span> · NSK Star: <span style={{ color: '#d4aa50' }}>{profile.nsk_star ?? '—'}</span></div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/portal/profiles" style={{ color: '#6a5a42', fontSize: 12, textDecoration: 'none', border: '1px solid #2a2010', padding: '6px 14px', borderRadius: 6 }}>
                จัดการ Profiles →
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard label="Soul Frequency" value={profile.soul_freq ?? '—'} sub="Born chart" />
            <StatCard label="Life Terrain" value={profile.life_terrain ?? '—'} sub="Environment" />
            <StatCard label="Path Resonance" value={profile.path_resonance ?? '—'} sub="Domain fit" />
          </div>
        </>
      ) : (
        <div style={{ background: '#1a1510', border: '1px solid #3a3020', borderRadius: 12, padding: '32px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#9a8a72', marginBottom: 16 }}>ยังไม่มีรายงาน — สร้างรายงาน Premium เพื่อดูคะแนนเต็ม</div>
          <Link href="/onboarding" style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
            ✦ รับรายงาน Premium — $49
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { href: '/portal/gods', icon: '⚡', label: 'Daily God Blessing', desc: 'รับพรวันนี้' },
          { href: '/portal/sky',  icon: '🪐', label: 'Today Sky', desc: 'ดาวส่วนตัว' },
          { href: '/portal/organum', icon: '📿', label: '108 Organum', desc: 'ถามเทพ' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{ background: '#111009', border: '1px solid #1a1510', borderRadius: 10, padding: '16px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a3020')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1510')}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontSize: 14, color: '#d4aa50', fontWeight: 600 }}>{a.label}</div>
            <div style={{ fontSize: 12, color: '#6a5a42', marginTop: 3 }}>{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent reports */}
      {reports.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, color: '#9a8a72', letterSpacing: 2, marginBottom: 12 }}>RECENT REPORTS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map(r => (
              <Link key={r.report_uuid} href={`/report/${r.report_uuid}`}
                style={{ background: '#111009', border: '1px solid #1a1510', borderRadius: 8, padding: '12px 16px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#d4aa50', fontSize: 13 }}>{r.report_type}</span>
                  <span style={{ color: '#4a3a2a', fontSize: 11, marginLeft: 12 }}>{r.report_uuid.slice(0, 8)}...</span>
                </div>
                <span style={{ color: '#4a3a2a', fontSize: 11 }}>{new Date(r.generated_at).toLocaleDateString('th-TH')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade banner for free users */}
      {!sub && (
        <div style={{ marginTop: 28, background: 'linear-gradient(135deg,#1a1408,#2a2010)', border: '1px solid #d4aa50', borderRadius: 12, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: '#d4aa50', fontWeight: 700, marginBottom: 4 }}>อัพเกรดเป็น Subscriber</div>
            <div style={{ fontSize: 13, color: '#9a8a72' }}>Daily God Blessing สะสม · 108 Organum ไม่จำกัด · Today Sky ส่วนตัว</div>
          </div>
          <Link href="/portal/billing" style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            $9/เดือน →
          </Link>
        </div>
      )}
    </div>
  )
}
