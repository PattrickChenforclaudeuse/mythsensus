const SYSTEMS = [
  { icon: '🀄', name: 'BaZi', th: 'ปาจื้อ' },
  { icon: '🕉', name: 'Vedic', th: 'โชติษ์' },
  { icon: '⭐', name: 'Nine Star Ki', th: 'คิวเซย์' },
  { icon: '♈', name: 'Western', th: 'ตะวันตก' },
  { icon: '🌽', name: 'Mayan', th: 'มายัน' },
  { icon: '🌿', name: 'Celtic', th: 'เซลติก' },
  { icon: '📿', name: 'Thai Brahman', th: 'ไทยพราหมณ์' },
  { icon: '🔢', name: 'Numerology', th: 'เลขศาสตร์' },
  { icon: '⚡', name: 'Human Design', th: 'ฮิวแมนดีไซน์' },
  { icon: '🟰', name: 'Saju', th: 'ซาจู' },
  { icon: '🏔', name: 'Tibetan', th: 'ทิเบต' },
  { icon: '☯️', name: 'Zi Wei', th: 'จื่อเว่ย์' },
  { icon: '⛩', name: 'Onmyōdō', th: 'ออนเมียว' },
  { icon: '🌟', name: 'Hellenistic', th: 'เฮลเลนิสติก' },
  { icon: '🪄', name: 'Norse Rune', th: 'รูนนอร์ส' },
  { icon: '🌳', name: 'Ogham', th: 'โอกัม' },
  { icon: '🌙', name: 'Arabic Parts', th: 'อารบิก' },
  { icon: '✡️', name: 'Kabbalistic', th: 'คับบาลาห์' },
  { icon: '🔥', name: 'Zoroastrian', th: 'โซโรอัสเตอร์' },
  { icon: '🦅', name: 'Aztec', th: 'แอซเทก' },
  { icon: '🐻', name: 'Native American', th: 'พื้นเมืองอเมริกา' },
  { icon: '🥁', name: 'Ifá/Yoruba', th: 'อิฟา/โยรูบา' },
  { icon: '🪃', name: 'Aboriginal', th: 'อะบอริจิน' },
  { icon: '📊', name: 'Biorhythm', th: 'ไบโอริธึม' },
  { icon: '🪐', name: 'Vedic Mahadasha', th: 'มหาทศา' },
  { icon: '🔢', name: 'Thai 7 Numbers', th: 'เลข 7 ตัว' },
]

export default function SystemsGrid() {
  return (
    <section style={{ padding: '40px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 8 }}>CONSENSUS ENGINE</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 24, color: '#d4aa50' }}>26 ระบบ · ครอบคลุม 92% ของโลก</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
        {SYSTEMS.map(s => (
          <div key={s.name} style={{ background: '#151210', border: '1px solid #2a2010', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: '#d4aa50', fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 10, color: '#6a5a42' }}>{s.th}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
