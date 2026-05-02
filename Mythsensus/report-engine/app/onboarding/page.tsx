'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// QA-6: charset is in layout.tsx — applies to all pages including this one

const CITIES: Record<string, { lat: number; lon: number; tz: number; country: string }> = {
  'Bangkok, Thailand':    { lat: 13.75,   lon: 100.5,   tz: 7,   country: 'Thailand' },
  'Chiang Mai, Thailand': { lat: 18.78,   lon: 98.98,   tz: 7,   country: 'Thailand' },
  'Phuket, Thailand':     { lat: 7.89,    lon: 98.40,   tz: 7,   country: 'Thailand' },
  'Tokyo, Japan':         { lat: 35.68,   lon: 139.69,  tz: 9,   country: 'Japan' },
  'Seoul, South Korea':   { lat: 37.57,   lon: 126.98,  tz: 9,   country: 'South Korea' },
  'Singapore':            { lat: 1.35,    lon: 103.82,  tz: 8,   country: 'Singapore' },
  'London, UK':           { lat: 51.51,   lon: -0.13,   tz: 0,   country: 'United Kingdom' },
  'New York, USA':        { lat: 40.71,   lon: -74.01,  tz: -5,  country: 'United States' },
  'Los Angeles, USA':     { lat: 34.05,   lon: -118.24, tz: -8,  country: 'United States' },
  'Paris, France':        { lat: 48.85,   lon: 2.35,    tz: 1,   country: 'France' },
  'Sydney, Australia':    { lat: -33.87,  lon: 151.21,  tz: 10,  country: 'Australia' },
  'Dubai, UAE':           { lat: 25.20,   lon: 55.27,   tz: 4,   country: 'UAE' },
  'Mumbai, India':        { lat: 19.07,   lon: 72.88,   tz: 5.5, country: 'India' },
  'Beijing, China':       { lat: 39.91,   lon: 116.39,  tz: 8,   country: 'China' },
  'Taipei, Taiwan':       { lat: 25.03,   lon: 121.56,  tz: 8,   country: 'Taiwan' },
  'Ho Chi Minh, Vietnam': { lat: 10.78,   lon: 106.69,  tz: 7,   country: 'Vietnam' },
  'Kuala Lumpur, Malaysia':{ lat: 3.14,   lon: 101.69,  tz: 8,   country: 'Malaysia' },
}

const CAREER_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Director', 'Executive', 'Entrepreneur', 'Student', 'Other']

const DOMAINS = [
  'Business Development', 'Engineering / Tech', 'Design / Creative',
  'Finance / Accounting', 'Sales / Marketing', 'Education / Research',
  'Healthcare / Wellness', 'Law / Compliance', 'Operations / Logistics',
  'Art / Entertainment', 'Construction / Real Estate', 'Consulting',
  'Government / Public Service', 'Non-profit / Social Work', 'Other',
]

type Step = 'birth' | 'career' | 'preview' | 'pay'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]               = useState<Step>('birth')
  const [name, setName]               = useState('')
  const [gender, setGender]           = useState<'M' | 'F' | 'X'>('M')
  const [dob, setDob]                 = useState('')
  const [birthTime, setBirthTime]     = useState('12:00')
  const [city, setCity]               = useState('Bangkok, Thailand')
  const [careerLevel, setCareerLevel] = useState('')
  const [domain, setDomain]           = useState('')
  const [workCountry, setWorkCountry] = useState('Thailand')
  const [industry, setIndustry]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [preview, setPreview]         = useState<{
    cosmic_score: number; tier: string; tier_th: string; percentile: string
    star_count: number; mid_count: number; warn_count: number
    report_uuid: string; dm_element: string
  } | null>(null)

  const loc = CITIES[city] ?? CITIES['Bangkok, Thailand']

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    if (!dob) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, gender, dob, birth_time: birthTime,
          birth_place: city,
          birth_lat: loc.lat, birth_lon: loc.lon, birth_tz: loc.tz,
          birth_country: loc.country,
          work_country:  workCountry || loc.country,
          career_level:  careerLevel,
          domain, industry,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setPreview(data)
      setStep('preview')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: 'premium_report',
          profile_id: null,
          success_path: `/report/${preview?.report_uuid}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment error')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0a0806', border: '1px solid #3a3020',
    color: '#f0e8d0', padding: '11px 14px', borderRadius: 8, fontSize: 14,
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#9a8a72', marginBottom: 5, display: 'block' }

  return (
    <div style={{ fontFamily: "'Sarabun','Noto Sans Thai',sans-serif", background: '#0a0806', color: '#f0e8d0', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1a1510' }}>
        <Link href="/" style={{ fontFamily: "'Cinzel',serif", fontSize: 18, color: '#d4aa50', letterSpacing: 3, textDecoration: 'none' }}>MYTHSENSUS</Link>
        <div style={{ fontSize: 12, color: '#6a5a42' }}>
          {step === 'birth' && '① ข้อมูลเกิด'}
          {step === 'career' && '② อาชีพ / สภาพแวดล้อม'}
          {step === 'preview' && '③ ดูตัวอย่างผล'}
          {step === 'pay' && '④ ชำระเงิน'}
        </div>
      </nav>

      <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 20px' }}>

        {/* ── STEP 1: Birth data ── */}
        {step === 'birth' && (
          <form onSubmit={e => { e.preventDefault(); setStep('career') }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 8 }}>STEP 1 / 3</div>
              <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>ข้อมูลวันเกิด</h1>
              <p style={{ fontSize: 13, color: '#6a5a42', marginTop: 6 }}>ยิ่งข้อมูลแม่นยำ ยิ่งผลชัดเจน</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>ชื่อ / Name (หรือนามแฝง)</label>
                <input style={inputStyle} type="text" placeholder="ชื่อหรือนามแฝงของคุณ"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div>
                <label style={labelStyle}>เพศ / Gender</label>
                <select style={inputStyle} value={gender} onChange={e => setGender(e.target.value as 'M'|'F'|'X')}>
                  <option value="M">ชาย (Male)</option>
                  <option value="F">หญิง (Female)</option>
                  <option value="X">ไม่ระบุ / Other</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>วันเกิด / Date of Birth</label>
                  <input style={inputStyle} type="date" value={dob} onChange={e => setDob(e.target.value)}
                    min="1900-01-01" max="2025-12-31" required />
                </div>
                <div>
                  <label style={labelStyle}>เวลาเกิด (ถ้าทราบ)</label>
                  <input style={inputStyle} type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>สถานที่เกิด / Birth City</label>
                <select style={inputStyle} value={city} onChange={e => setCity(e.target.value)}>
                  {Object.keys(CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button type="submit" style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', border: 'none', padding: '14px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                ถัดไป →
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: Career / Life Terrain ── */}
        {step === 'career' && (
          <form onSubmit={handlePreview}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 8 }}>STEP 2 / 3</div>
              <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>สภาพแวดล้อมชีวิต</h1>
              <p style={{ fontSize: 13, color: '#6a5a42', marginTop: 6 }}>ใช้คำนวณ Life Terrain Score — กรอกหรือข้ามได้</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>ประเทศที่ทำงาน / Work Country</label>
                <input style={inputStyle} type="text" placeholder="e.g. Thailand, Japan, USA"
                  value={workCountry} onChange={e => setWorkCountry(e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>ระดับอาชีพ / Career Level</label>
                <select style={inputStyle} value={careerLevel} onChange={e => setCareerLevel(e.target.value)}>
                  <option value="">— ไม่ระบุ —</option>
                  {CAREER_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>สายงาน / Domain</label>
                <select style={inputStyle} value={domain} onChange={e => setDomain(e.target.value)}>
                  <option value="">— ไม่ระบุ —</option>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>อุตสาหกรรม / Industry (optional)</label>
                <input style={inputStyle} type="text" placeholder="e.g. Interior Construction, FinTech, F&B"
                  value={industry} onChange={e => setIndustry(e.target.value)} />
              </div>

              {error && (
                <div style={{ background: '#1a0a0a', border: '1px solid #c01020', borderRadius: 8, padding: 12, fontSize: 13, color: '#f0a080' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setStep('birth')}
                  style={{ flex: '0 0 auto', background: '#1a1510', border: '1px solid #3a3020', color: '#9a8a72', padding: '14px 20px', borderRadius: 8, cursor: 'pointer' }}>
                  ← กลับ
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', border: 'none', padding: '14px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
                  {loading ? 'กำลังคำนวณ 26 ศาสตร์...' : '✦ คำนวณดูผล'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── STEP 3: Preview (score teaser) ── */}
        {step === 'preview' && preview && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 8 }}>STEP 3 / 3</div>
              <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>ผลเบื้องต้น</h1>
            </div>

            {/* Score card */}
            <div style={{ background: '#1a1510', border: '2px solid #d4aa50', borderRadius: 14, padding: '28px 24px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: '#6a5a42', marginBottom: 8 }}>COSMIC SCORE</div>
              <div style={{ fontSize: 72, fontWeight: 700, color: '#d4aa50', lineHeight: 1 }}>{preview.cosmic_score}</div>
              <div style={{ fontSize: 20, color: '#f0e8d0', marginTop: 8 }}>{preview.tier_th} <span style={{ fontSize: 14, color: '#9a8a72' }}>{preview.tier}</span></div>
              <div style={{ fontSize: 13, color: '#6a5a42', marginTop: 4 }}>{preview.percentile} ของโลก</div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <div style={{ background: '#1a3a10', borderRadius: 6, padding: '5px 14px', fontSize: 13, color: '#4aaa4a' }}>🌟 {preview.star_count}/26</div>
                <div style={{ background: '#2a2a10', borderRadius: 6, padding: '5px 14px', fontSize: 13, color: '#aaaa4a' }}>〰 {preview.mid_count}/26</div>
                <div style={{ background: '#3a1510', borderRadius: 6, padding: '5px 14px', fontSize: 13, color: '#aa5a4a' }}>⚠ {preview.warn_count}/26</div>
              </div>

              {/* Blur overlay teasing more content */}
              <div style={{ marginTop: 20, position: 'relative', height: 80, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, color: '#9a8a72', lineHeight: 2 }}>
                  Day Master: {preview.dm_element} · 10 Gods Analysis · Grand Convergence<br/>
                  Divine Mirror · Decade by Decade · Activation Plan...
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent,#1a1510)' }} />
              </div>
            </div>

            <div style={{ background: '#111009', border: '1px solid #2a2010', borderRadius: 10, padding: '16px 20px', marginBottom: 20, fontSize: 13, color: '#9a8a72', lineHeight: 1.8 }}>
              <strong style={{ color: '#d4aa50' }}>รายงาน Premium ~31 หน้า ประกอบด้วย:</strong><br/>
              Deep Reading 10 ศาสตร์ · Divine Mirror · Grand Convergence · Scenario Analysis<br/>
              Decade by Decade · Activation Plan 8 ข้อ · Health &amp; Finance Coaching<br/>
              2026 Timing + 10-year window · Compatibility Report
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep('career')}
                style={{ flex: '0 0 auto', background: '#1a1510', border: '1px solid #3a3020', color: '#9a8a72', padding: '14px 20px', borderRadius: 8, cursor: 'pointer' }}>
                ← แก้ไข
              </button>
              <button onClick={handlePay} disabled={loading}
                style={{ flex: 1, background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', border: 'none', padding: '14px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'กำลังเชื่อมต่อ Stripe...' : '✦ รับรายงาน Premium — $49'}
              </button>
            </div>
            {error && <p style={{ color: '#f0a080', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
            <p style={{ fontSize: 11, color: '#4a3a2a', textAlign: 'center', marginTop: 12 }}>
              ชำระผ่าน Stripe · ปลอดภัย 100% · คืนเงินได้ภายใน 7 วัน
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
