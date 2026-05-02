'use client'
import { useState, useRef, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface OranumResponse {
  spokesperson: string
  origin: string
  agree_count: number
  warn_count: number
  neutral_count: number
  message: string
  consensus_note: string
}

const EXAMPLE_QUESTIONS = [
  'ควรเปลี่ยนงานตอนนี้ไหม?',
  'ปีนี้มีโอกาสด้านการเงินไหม?',
  'ความสัมพันธ์นี้เหมาะสมกับฉันหรือเปล่า?',
  'ธุรกิจที่กำลังคิดอยู่ ควรเริ่มหรือยัง?',
]

export default function OrganumPage() {
  const supabase = createSupabaseBrowser()
  const [question, setQuestion] = useState('')
  const [result, setResult]     = useState<OranumResponse | null>(null)
  const [history, setHistory]   = useState<{ question: string; response: OranumResponse; created_at: string }[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [count, setCount]       = useState(0)
  const [isSub, setIsSub]       = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: sub } = await supabase.from('subscriptions').select('tier').eq('user_id', user.id).eq('status', 'active').maybeSingle()
      setIsSub(sub?.tier === 'sub')
      const today = new Date().toISOString().split('T')[0]
      const { count: c } = await supabase.from('organum_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', `${today}T00:00:00Z`)
      setCount(c ?? 0)
      const { data: h } = await supabase.from('organum_sessions').select('question,response,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      setHistory((h ?? []) as typeof history)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/organum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.limit_reached) setCount(5)
        setError(data.error)
        return
      }
      setResult(data)
      setCount(c => c + 1)
      setHistory(h => [{ question, response: data, created_at: new Date().toISOString() }, ...h.slice(0, 9)])
      setQuestion('')
    } catch {
      setError('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const limitReached = !isSub && count >= 5

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 6 }}>DIVINE ORACLE</div>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, color: '#d4aa50' }}>108 Organum</h1>
        <p style={{ fontSize: 13, color: '#6a5a42', marginTop: 6 }}>
          108 เทพจากทุกมิโธโลจีลงคะแนนให้คุณ
          {!isSub && <span style={{ marginLeft: 8, color: '#4a3a2a' }}>({count}/5 คำถามวันนี้)</span>}
          {isSub && <span style={{ marginLeft: 8, color: '#4aaa4a' }}>Unlimited ✓</span>}
        </p>
      </div>

      {/* Example questions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {EXAMPLE_QUESTIONS.map(q => (
          <button key={q} onClick={() => { setQuestion(q); textRef.current?.focus() }}
            style={{ background: '#111009', border: '1px solid #2a2010', color: '#9a8a72', padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Question form */}
      <form onSubmit={handleAsk} style={{ marginBottom: 32 }}>
        <textarea ref={textRef} value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="ถามเทพ 108 องค์... (อะไรก็ได้)"
          disabled={limitReached || loading}
          style={{
            width: '100%', background: '#0a0806', border: '1px solid #3a3020', color: '#f0e8d0',
            padding: '14px', borderRadius: 10, fontSize: 14, resize: 'vertical', minHeight: 80,
            boxSizing: 'border-box', fontFamily: "'Sarabun',sans-serif",
            opacity: limitReached ? 0.4 : 1,
          }} />

        {limitReached ? (
          <div style={{ marginTop: 12, background: '#0a0f14', border: '1px solid #204060', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
            <div style={{ color: '#9a8a72', fontSize: 13, marginBottom: 12 }}>ครบ 5 คำถามของวันแล้ว — Subscribe เพื่อถามไม่จำกัด</div>
            <a href="/portal/billing" style={{ background: 'linear-gradient(135deg,#0a3050,#1060a0)', color: '#4090c0', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
              Subscribe $9/เดือน →
            </a>
          </div>
        ) : (
          <button type="submit" disabled={loading || !question.trim()}
            style={{
              width: '100%', marginTop: 12, background: question.trim() && !loading ? 'linear-gradient(135deg,#8a6010,#d4aa50)' : '#1a1510',
              color: question.trim() && !loading ? '#0a0806' : '#4a3a2a',
              border: 'none', padding: '13px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            }}>
            {loading ? '✦ กำลังให้เทพลงคะแนน...' : '✦ ถามเทพ 108 องค์'}
          </button>
        )}

        {error && <p style={{ color: '#f0a080', fontSize: 13, marginTop: 10 }}>{error}</p>}
      </form>

      {/* Result */}
      {result && (
        <div style={{ background: '#1a1510', border: '1px solid #3a3020', borderRadius: 14, padding: '24px', marginBottom: 32 }}>
          {/* Consensus bars */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div style={{ background: '#1a3a10', borderRadius: 8, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#4aaa4a' }}>🌟 {result.agree_count}</div>
              <div style={{ fontSize: 11, color: '#2a6a2a', marginTop: 2 }}>เห็นด้วย</div>
            </div>
            <div style={{ background: '#2a2a10', borderRadius: 8, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#aaaa4a' }}>〰 {result.neutral_count}</div>
              <div style={{ fontSize: 11, color: '#6a6a2a', marginTop: 2 }}>กลางๆ</div>
            </div>
            <div style={{ background: '#3a1510', borderRadius: 8, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#aa5a4a' }}>⚠ {result.warn_count}</div>
              <div style={{ fontSize: 11, color: '#6a3a2a', marginTop: 2 }}>เตือน</div>
            </div>
          </div>

          {/* Spokesperson */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#6a5a42', marginBottom: 6 }}>SPOKESPERSON</div>
            <div style={{ fontSize: 16, color: '#d4aa50', fontWeight: 700 }}>{result.spokesperson}</div>
            <div style={{ fontSize: 12, color: '#6a5a42' }}>{result.origin}</div>
          </div>

          {/* Message */}
          <div style={{ background: '#0a0806', border: '1px solid #2a2010', borderRadius: 10, padding: '16px' }}>
            <p style={{ fontSize: 14, color: '#c8c0a8', lineHeight: 1.9 }}>{result.message}</p>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: '#4a3a2a', fontStyle: 'italic' }}>
            {result.consensus_note}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#6a5a42', marginBottom: 14 }}>คำถามก่อนหน้า</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(result ? 1 : 0).map((h, i) => (
              <div key={i} style={{ background: '#111009', border: '1px solid #1a1510', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 13, color: '#9a8a72', marginBottom: 4 }}>{h.question}</div>
                <div style={{ fontSize: 12, color: '#4a3a2a' }}>
                  🌟 {h.response.agree_count} · 〰 {h.response.neutral_count} · ⚠ {h.response.warn_count} · {h.response.spokesperson}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
