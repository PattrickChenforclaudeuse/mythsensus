import Link from 'next/link'

export default function PricingCards({ onAuthRequest }: { onAuthRequest: () => void }) {
  return (
    <section style={{ padding: '60px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 8 }}>PRICING</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 24, color: '#d4aa50' }}>เลือกแผนที่ใช่สำหรับคุณ</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>

        <div style={{ background: '#111009', border: '1px solid #2a2010', borderRadius: 12, padding: '28px 24px' }}>
          <div style={{ fontSize: 13, color: '#6a5a42', letterSpacing: 2, marginBottom: 8 }}>FREE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f0e8d0', marginBottom: 4 }}>$0</div>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 13, color: '#9a8a72', lineHeight: 2.2 }}>
            <li>✓ Cosmic Score preview</li>
            <li>✓ 26-system bar chart</li>
            <li>✓ Daily God Blessing 1×/วัน</li>
            <li>✓ 108 Organum 5 คำถาม/วัน</li>
            <li>✓ Today Sky (Sun only)</li>
            <li>✓ Famous Mirror 3 คน</li>
          </ul>
          <button onClick={onAuthRequest} style={{ width: '100%', background: '#2a2010', color: '#d4aa50', border: '1px solid #3a3020', padding: '10px', borderRadius: 6, cursor: 'pointer', marginTop: 16 }}>
            เริ่มต้นฟรี
          </button>
        </div>

        <div style={{ background: '#1a1408', border: '2px solid #d4aa50', borderRadius: 12, padding: '28px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#d4aa50', color: '#0a0806', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 20 }}>MOST POPULAR</div>
          <div style={{ fontSize: 13, color: '#d4aa50', letterSpacing: 2, marginBottom: 8 }}>PREMIUM</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#d4aa50', marginBottom: 4 }}>$49 <span style={{ fontSize: 14, fontWeight: 400, color: '#9a8a72' }}>one-time</span></div>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 13, color: '#9a8a72', lineHeight: 2.2 }}>
            <li>✓ Full ~31-page report</li>
            <li>✓ 10 ศาสตร์ Deep Reading</li>
            <li>✓ Divine Mirror</li>
            <li>✓ Grand Convergence</li>
            <li>✓ Decade by Decade</li>
            <li>✓ Activation Plan 8 ข้อ</li>
            <li>✓ Scenario Analysis</li>
            <li>✓ 2026 Timing + 10-year</li>
            <li>✓ Compatibility Report</li>
          </ul>
          <Link href="/onboarding" style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', padding: '12px', borderRadius: 6, cursor: 'pointer', marginTop: 16, textAlign: 'center', textDecoration: 'none', fontWeight: 700 }}>
            ✦ รับรายงาน Premium
          </Link>
        </div>

        <div style={{ background: '#0a0f14', border: '1px solid #204060', borderRadius: 12, padding: '28px 24px' }}>
          <div style={{ fontSize: 13, color: '#4090c0', letterSpacing: 2, marginBottom: 8 }}>SUBSCRIPTION</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f0e8d0', marginBottom: 4 }}>$9 <span style={{ fontSize: 14, fontWeight: 400, color: '#9a8a72' }}>/เดือน</span></div>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 13, color: '#9a8a72', lineHeight: 2.2 }}>
            <li>✓ Daily God Blessing สะสม</li>
            <li>✓ 108 Organum ไม่จำกัด</li>
            <li>✓ Today Sky ส่วนตัวเต็มรูปแบบ</li>
            <li>✓ Monthly Cosmic Brief</li>
            <li>✓ Element Flow ไม่จำกัด</li>
            <li>✓ Yearly Report Update</li>
            <li>✓ Early Access Add-ons</li>
          </ul>
          <button onClick={onAuthRequest} style={{ width: '100%', background: '#0a1f30', color: '#4090c0', border: '1px solid #204060', padding: '10px', borderRadius: 6, cursor: 'pointer', marginTop: 16 }}>
            สมัคร Subscription
          </button>
        </div>

      </div>
    </section>
  )
}
