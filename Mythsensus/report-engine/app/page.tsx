'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'
import SystemsGrid from '@/components/SystemsGrid'
import TierTable from '@/components/TierTable'
import PricingCards from '@/components/PricingCards'

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [user, setUser]         = useState<{ email?: string } | null>(null)

  const supabase = createSupabaseBrowser()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('auth=1')) setAuthOpen(true)
  }, [])

  return (
    <div style={{ fontFamily: "'Sarabun','Noto Sans Thai',sans-serif", background: '#0a0806', color: '#f0e8d0', minHeight: '100vh' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #2a2010', position: 'sticky', top: 0, background: '#0a0806', zIndex: 100 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 20, color: '#d4aa50', letterSpacing: 3 }}>MYTHSENSUS</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/library" style={{ color: '#9a8a72', textDecoration: 'none', fontSize: 14 }}>Cosmic Library</Link>
          <Link href="/onboarding" style={{ color: '#d4aa50', textDecoration: 'none', fontSize: 14 }}>รายงาน Premium</Link>
          {user ? (
            <Link href="/portal" style={{ background: '#d4aa50', color: '#0a0806', padding: '8px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              My Portal →
            </Link>
          ) : (
            <button onClick={() => setAuthOpen(true)} style={{ background: '#d4aa50', color: '#0a0806', border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </nav>

      <section style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: '#6a5a42', marginBottom: 16 }}>✦ WHERE MYRIAD MYTHS REACH CONSENSUS ✦</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(28px,5vw,54px)', color: '#d4aa50', fontWeight: 700, lineHeight: 1.2, marginBottom: 20 }}>
          26 ศาสตร์โบราณ<br/>หนึ่งคะแนนจักรวาล
        </h1>
        <p style={{ fontSize: 18, color: '#9a8a72', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
          BaZi · Vedic · Norse · Mayan · Human Design และอีก 21 ศาสตร์<br/>
          วิเคราะห์ดวงชะตาของคุณใน 60 วินาที
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/onboarding" style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            ✦ สร้างรายงาน Premium — $49
          </Link>
          <button onClick={() => setAuthOpen(true)} style={{ background: 'transparent', border: '1px solid #3a3020', color: '#c8c0a8', padding: '14px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            ฟรี — เช็ค Cosmic Score
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#4a3a2a', marginTop: 16 }}>
          เทียบตลาด: Human Design report $47-197 · Vedic report $149 · หมอดู $50-200/ชม.
        </p>
      </section>

      <SystemsGrid />
      <TierTable />
      <PricingCards onAuthRequest={() => setAuthOpen(true)} />

      <footer style={{ borderTop: '1px solid #1a1510', padding: '32px 24px', textAlign: 'center', color: '#4a3a2a', fontSize: 12 }}>
        <div style={{ fontFamily: "'Cinzel',serif", color: '#6a5a42', marginBottom: 8, letterSpacing: 2 }}>MYTHSENSUS</div>
        <p>mythsensus.com · คำนวณทั้งหมด 100% บนเซิร์ฟเวอร์ · ไม่แบ่งปันข้อมูลส่วนตัว</p>
        <p style={{ marginTop: 6 }}>รายงานสร้างโดย AI เพื่อการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ · เส้นสายด่วนสุขภาพจิต 1323</p>
        <div style={{ marginTop: 16, display: 'flex', gap: 20, justifyContent: 'center' }}>
          <a href="/library" style={{ color: '#6a5a42', textDecoration: 'none' }}>Cosmic Library</a>
          <a href="/privacy" style={{ color: '#6a5a42', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: '#6a5a42', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
