const TIERS = [
  { th: 'ฟ้า', en: 'Celestial', color: '#d4aa50', pct: 'top 1%' },
  { th: 'แสง', en: 'Radiant', color: '#c8e040', pct: 'top 5%' },
  { th: 'เปล่งประกาย', en: 'Luminous', color: '#40c0a0', pct: 'top 15%' },
  { th: 'สั่นพ้อง', en: 'Resonant', color: '#6080d0', pct: 'top 35%' },
  { th: 'หยั่งราก', en: 'Grounded', color: '#a08060', pct: 'top 55%' },
  { th: 'แสวงหา', en: 'Seeking', color: '#806050', pct: 'top 75%' },
  { th: 'กำลังก่อตัว', en: 'Emerging', color: '#605040', pct: 'bottom 25%' },
]

export default function TierTable() {
  return (
    <section style={{ padding: '40px 24px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 8 }}>COSMIC TIERS</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>คุณอยู่ระดับไหน?</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TIERS.map(t => (
          <div key={t.en} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#151210', border: '1px solid #2a2010', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ color: t.color, fontWeight: 700, marginRight: 8 }}>{t.th}</span>
              <span style={{ color: '#6a5a42', fontSize: 12 }}>{t.en}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6a5a42' }}>{t.pct}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
