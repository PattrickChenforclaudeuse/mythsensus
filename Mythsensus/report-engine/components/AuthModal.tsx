'use client'
import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode]       = useState<'login' | 'magic'>('login')
  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [msg, setMsg]         = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createSupabaseBrowser()

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/portal` },
    })
    if (error) setMsg(error.message)
    setLoading(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal` },
    })
    setLoading(false)
    if (error) setMsg(error.message)
    else {
      setOtpSent(true)
      setMsg('ส่งรหัสไปที่อีเมลแล้ว — กดลิงก์ในอีเมล หรือกรอกรหัสด้านล่าง')
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    setLoading(false)
    if (error) setMsg(error.message)
    else window.location.href = '/portal'
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#1a1510', border: '1px solid #3a3020', borderRadius: 14, padding: '36px 32px', width: '100%', maxWidth: 400 }}>
        <div style={{ fontFamily: "'Cinzel',serif", color: '#d4aa50', textAlign: 'center', fontSize: 18, marginBottom: 8 }}>MYTHSENSUS</div>
        <div style={{ textAlign: 'center', color: '#9a8a72', fontSize: 13, marginBottom: 28 }}>เข้าสู่ระบบเพื่อเข้าถึง Portal</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#0a0806', borderRadius: 8, padding: 4 }}>
          {(['login', 'magic'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                background: mode === m ? '#2a2010' : 'transparent',
                color:      mode === m ? '#d4aa50' : '#6a5a42' }}>
              {m === 'login' ? 'Google / LINE' : 'Magic Link'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={handleGoogle} disabled={loading}
              style={{ background: '#fff', color: '#1a1a1a', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>G</span> เข้าสู่ระบบด้วย Google
            </button>
            <button disabled
              style={{ background: '#0f4a2f', color: '#2aba6a', border: '1px solid #1a6a40', padding: '12px', borderRadius: 8, cursor: 'not-allowed', opacity: 0.7 }}>
              LINE Login (เร็วๆ นี้)
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ background: '#0a0806', border: '1px solid #3a3020', color: '#f0e8d0', padding: '12px', borderRadius: 8, fontSize: 14 }} />
              <button type="submit" disabled={loading}
                style={{ background: 'linear-gradient(135deg,#8a6010,#d4aa50)', color: '#0a0806', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                {loading ? 'กำลังส่ง...' : otpSent ? 'ส่งรหัสใหม่' : 'ส่งรหัส / Magic Link'}
              </button>
            </form>

            {otpSent && (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, paddingTop: 14, borderTop: '1px solid #2a2010' }}>
                <div style={{ fontSize: 12, color: '#9a8a72', textAlign: 'center' }}>หรือกรอกรหัสจากอีเมล</div>
                <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={8} placeholder="รหัส"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required
                  style={{ background: '#0a0806', border: '1px solid #3a3020', color: '#f0e8d0', padding: '12px', borderRadius: 8, fontSize: 20, letterSpacing: 6, textAlign: 'center', fontFamily: 'monospace' }} />
                <button type="submit" disabled={loading || otp.length < 6}
                  style={{ background: '#2a2010', color: '#d4aa50', border: '1px solid #3a3020', padding: '12px', borderRadius: 8, cursor: otp.length >= 6 ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: otp.length >= 6 ? 1 : 0.5 }}>
                  {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส'}
                </button>
              </form>
            )}
          </div>
        )}

        {msg && (
          <div style={{ marginTop: 16, padding: 12, background: '#0a1a0e', border: '1px solid #1a6a40', borderRadius: 8, fontSize: 13, color: '#4aaa4a', textAlign: 'center' }}>
            {msg}
          </div>
        )}

        <button onClick={onClose}
          style={{ display: 'block', width: '100%', marginTop: 20, background: 'transparent', border: 'none', color: '#4a3a2a', cursor: 'pointer', fontSize: 13 }}>
          ปิด
        </button>
      </div>
    </div>
  )
}
