// Public report viewer — no auth required, UUID is the access key
import { Metadata } from 'next'
import { createSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  params: { uuid: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Mythsensus Report — ${params.uuid.slice(0, 8)}`,
    description: 'Your Cosmic Blueprint — 26 ancient wisdom systems',
  }
}

export default async function ReportPage({ params }: Props) {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('reports')
    .select('html_content, report_type, generated_at, expires_at')
    .eq('report_uuid', params.uuid)
    .maybeSingle()

  if (error || !data) {
    return (
      <div style={{ fontFamily: "'Sarabun',sans-serif", background: '#0a0806', color: '#f0e8d0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>✦</div>
        <div style={{ fontSize: 18, color: '#6a5a42' }}>ไม่พบรายงาน</div>
        <div style={{ fontSize: 13, color: '#4a3a2a' }}>UUID อาจไม่ถูกต้อง หรือรายงานหมดอายุแล้ว</div>
        <Link href="/" style={{ color: '#d4aa50', textDecoration: 'none', fontSize: 14 }}>← กลับหน้าหลัก</Link>
      </div>
    )
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return (
      <div style={{ fontFamily: "'Sarabun',sans-serif", background: '#0a0806', color: '#f0e8d0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 18, color: '#6a5a42' }}>รายงานหมดอายุแล้ว</div>
        <Link href="/onboarding" style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>สร้างรายงานใหม่</Link>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Sarabun',sans-serif", background: '#0a0806', minHeight: '100vh' }}>
      {/* Toolbar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0e0c08', borderBottom: '1px solid #1a1510', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: '#d4aa50', letterSpacing: 3, textDecoration: 'none' }}>MYTHSENSUS</Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#4a3a2a' }}>
            {new Date(data.generated_at).toLocaleDateString('th-TH')}
          </span>
          <button
            onClick={() => window.print()}
            style={{ background: '#1a6a10', color: '#4aaa4a', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            🖨️ พิมพ์ / PDF
          </button>
        </div>
      </div>

      {/* Report content rendered in iframe for isolation */}
      <iframe
        srcDoc={data.html_content ?? '<p>ไม่มีเนื้อหา</p>'}
        title="Cosmic Blueprint Report"
        style={{ width: '100%', height: 'calc(100vh - 44px)', border: 'none', display: 'block' }}
      />
    </div>
  )
}
