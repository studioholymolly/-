'use client'

import { useState } from 'react'
import { submitRevision } from '@/lib/actions/selections'

export default function RevisionForm({ shareToken }: { shareToken: string }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')
    const result = await submitRevision(shareToken, message)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: 24, background: 'rgba(20,83,45,0.3)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: 12 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
        <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>수정 요청을 전달했습니다</p>
        <p style={{ fontSize: 12, color: '#7070a0', marginTop: 4 }}>스튜디오에서 확인 후 업데이트됩니다.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, background: '#111115', border: '1px solid #28282e', borderRadius: 12 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>수정 요청</h3>
      <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>⚠️ 수정 요청은 1회만 가능합니다</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="전체적인 수정 요청 사항을 입력해 주세요"
          rows={4}
          style={{
            width: '100%', background: '#18181e', border: '1px solid #28282e',
            color: '#f0f0f4', padding: '10px 12px',
            borderRadius: 8, fontSize: 13, resize: 'vertical',
            fontFamily: 'inherit', outline: 'none', marginBottom: 10,
            boxSizing: 'border-box',
          }}
        />
        {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !message.trim()}
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: loading || !message.trim() ? '#374151' : '#ef4444',
            color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700,
            cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '전송 중...' : '수정 요청 보내기'}
        </button>
      </form>
    </div>
  )
}
