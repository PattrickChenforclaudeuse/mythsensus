'use client'
// ============================================================
//  app/portal/billing/page.tsx — Billing & upgrade (Omise)
//  Card tokenization via OmiseJS popup → POST /api/checkout
// ============================================================
import { useState, useEffect } from 'react'
import Script                  from 'next/script'
import { createSupabaseBrowser } from '@/lib/supabase'
import { TABLES, PLAN }          from '@/lib/constants'
import { COLORS, SPACE, RADIUS, FONT_SIZE } from '@/lib/theme'
import { PageHeader }            from '@/components/ui/PageHeader'
import { Card }                  from '@/components/ui/Card'
import { Button }                from '@/components/ui/Button'
import { TierBadge }             from '@/components/ui/StatCard'

const PRODUCTS = [
  { key: 'subscription',   label: '🌟 Subscriber',      price: '฿320/เดือน', features: ['Today Sky ครบ 5 มิติ','108 Organum ไม่จำกัด','God Blessing สะสมทุกวัน','Shadow reading เทพทุกองค์'] },
  { key: 'premium_report', label: '📜 Premium Report',  price: '฿1,750',      features: ['PDF รายงานครบ 26 ระบบ','Cosmic Score + tier','ดาวน์โหลดตลอดชีพ'] },
  { key: 'addon_mirror',   label: '🪞 Divine Mirror',   price: '฿320',        features: ['เปรียบเทียบ cosmic กับคนดัง'] },
  { key: 'addon_compat',   label: '💞 Compatibility',   price: '฿420',        features: ['รายงานความเข้ากันได้กับคู่'] },
  { key: 'addon_names',    label: '✍️ Alias Unlock',    price: '฿180',        features: ['อ่านชื่อเล่น/ชื่อธุรกิจไม่จำกัด'] },
  { key: 'addon_flow',     label: '🌊 Element Flow',    price: '฿320',        features: ['วิเคราะห์การไหลธาตุ 5 ทิศ'] },
]

declare global {
  interface Window {
    OmiseCard: {
      configure: (opts: Record<string, unknown>) => void
      open: (opts: Record<string, unknown>) => void
    }
  }
}

export default function BillingPage() {
  const supabase = createSupabaseBrowser()
  const [plan, setPlan]             = useState<string>(PLAN.FREE)
  const [loading, setLoading]       = useState<string | null>(null)
  const [omiseReady, setOmiseReady] = useState(false)
  const [message, setMessage]       = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: sub } = await supabase
        .from(TABLES.SUBSCRIPTIONS).select('tier').eq('user_id', user.id).eq('status', 'active').maybeSingle()
      if (sub?.tier) setPlan(sub.tier as string)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleToken(productKey: string, token: string) {
    setLoading(productKey); setMessage('')
    try {
      const res  = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_type: productKey, token }) })
      const data = await res.json()
      if (data.authorize_uri) { window.location.href = data.authorize_uri; return }
      if (res.ok && (data.status === 'successful' || data.status === 'active')) {
        setMessage('✅ ชำระเงินสำเร็จ! รีเฟรชหน้าเพื่อดูสิทธิ์ใหม่')
        if (productKey === 'subscription')   setPlan(PLAN.SUBSCRIPTION)
        if (productKey === 'premium_report') setPlan(PLAN.PREMIUM)
      } else { setMessage(`❌ ${data.error ?? 'เกิดข้อผิดพลาด'}`) }
    } catch { setMessage('❌ เชื่อมต่อไม่ได้ กรุณาลองใหม่')
    } finally { setLoading(null) }
  }

  function openPopup(productKey: string, price: string) {
    if (!omiseReady || !window.OmiseCard) { setMessage('กำลังโหลดระบบชำระเงิน...'); return }
    window.OmiseCard.open({
      frameLabel:  'Mythsensus',
      submitLabel: `ชำระ ${price}`,
      onCreateTokenSuccess: (token: string) => handleToken(productKey, token),
      onFormClosed: () => setLoading(null),
    })
    setLoading(productKey)
  }

  const isSub     = plan === PLAN.SUBSCRIPTION
  const isPremium = plan === PLAN.PREMIUM

  return (
    <>
      <Script src="https://cdn.omise.co/omise.js" strategy="afterInteractive"
        onLoad={() => {
          window.OmiseCard.configure({ publicKey: process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY ?? '', currency: 'THB', locale: 'th' })
          setOmiseReady(true)
        }}
      />

      <PageHeader eyebrow="BILLING" title="แผนและการชำระเงิน"
        subtitle="ชำระผ่าน Omise · บัตรเครดิต / เดบิต / PromptPay"
        extra={<TierBadge tier={plan} />}
      />

      {isSub && (
        <Card style={{ marginBottom: SPACE['6'], borderColor: COLORS.gold.bright }}>
          <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.text.faint }}>แผนปัจจุบัน</div>
          <div style={{ fontSize: FONT_SIZE.xl, color: COLORS.gold.bright, fontWeight: 700, margin: `${SPACE['1']}px 0` }}>🌟 Subscriber — ฿320/เดือน</div>
          <div style={{ fontSize: FONT_SIZE.sm, color: COLORS.text.muted }}>สิทธิ์ทุกอย่างเปิดแล้ว · ยกเลิกได้ทุกเมื่อ</div>
        </Card>
      )}

      {message && (
        <div style={{ padding: `${SPACE['3']}px ${SPACE['4']}px`, borderRadius: RADIUS.md, marginBottom: SPACE['5'],
          background: message.startsWith('✅') ? '#0a1f0a' : '#1f0a0a',
          border: `1px solid ${message.startsWith('✅') ? COLORS.status.agree : COLORS.status.error}`,
          color:  message.startsWith('✅') ? COLORS.status.agree : COLORS.status.warn,
          fontSize: FONT_SIZE.base }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: SPACE['4'] }}>
        {PRODUCTS.map(p => {
          const isActive  = (p.key === 'subscription' && isSub) || (p.key === 'premium_report' && isPremium)
          const isLoading = loading === p.key
          return (
            <Card key={p.key} borderColor={isActive ? COLORS.gold.bright : COLORS.border.default}
              style={{ display: 'flex', flexDirection: 'column', gap: SPACE['3'] }}>
              <div>
                <div style={{ fontSize: FONT_SIZE.lg, fontWeight: 700, color: COLORS.text.primary }}>{p.label}</div>
                <div style={{ fontSize: FONT_SIZE['2xl'], color: COLORS.gold.bright, fontWeight: 700, margin: `${SPACE['1']}px 0` }}>{p.price}</div>
              </div>
              <ul style={{ margin: 0, padding: `0 0 0 ${SPACE['4']}px`, fontSize: FONT_SIZE.sm, color: COLORS.text.muted, lineHeight: 1.9 }}>
                {p.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <div style={{ marginTop: 'auto' }}>
                {isActive
                  ? <div style={{ textAlign: 'center', color: COLORS.status.agree, fontWeight: 700, fontSize: FONT_SIZE.sm }}>✓ มีอยู่แล้ว</div>
                  : <Button variant={p.key === 'subscription' ? 'primary' : 'secondary'} size="md" loading={isLoading}
                      style={{ width: '100%' }} onClick={() => openPopup(p.key, p.price)}>
                      {isLoading ? 'กำลังดำเนินการ...' : `ซื้อ ${p.price}`}
                    </Button>
                }
              </div>
            </Card>
          )
        })}
      </div>

      <div style={{ marginTop: SPACE['8'], fontSize: FONT_SIZE.xs, color: COLORS.text.disabled, textAlign: 'center' }}>
        ชำระเงินผ่าน Omise · PCI-DSS Level 1 · ไม่เก็บข้อมูลบัตรบนเซิร์ฟเวอร์
      </div>
    </>
  )
}
