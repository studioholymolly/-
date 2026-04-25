'use client'

import { useEffect, useRef, useState } from 'react'
import { STUDIO_NAME } from '@/lib/brand'
import { verifyAccessCode } from '@/lib/actions/projects'

const PREFIX = 'studio-app:access-ok:'

export function isAccessOk(shareToken: string): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(PREFIX + shareToken) === '1'
}

export default function AccessCodeGate({
  shareToken, visitorName, onSuccess,
}: {
  shareToken: string
  visitorName: string
  onSuccess: () => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  async function submit() {
    if (!/^\d{4}$/.test(code)) {
      setError('4자리 숫자 코드를 입력해주세요.')
      return
    }
    setBusy(true); setError('')
    try {
      const res = await verifyAccessCode(shareToken, code)
      if (res.ok) {
        window.sessionStorage.setItem(PREFIX + shareToken, '1')
        onSuccess()
      } else {
        setError('코드가 일치하지 않습니다.')
      }
    } catch {
      setError('확인 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
        zIndex: 245, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        style={{
          background: '#fafafa', border: '1px solid #e0e0e5', borderRadius: 16,
          width: '100%', maxWidth: 420, padding: '28px 24px 22px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#6b6b80', textTransform: 'uppercase', marginBottom: 8 }}>
            {STUDIO_NAME}
          </div>
          {visitorName && (
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#22c55e', marginBottom: 4 }}>
              {visitorName}님, 환영합니다!
            </h2>
          )}
          <p style={{ fontSize: 13, color: '#6b6b80', lineHeight: 1.6 }}>
            전달받은 4자리 코드를 입력해주세요.
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={code}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4)
            setCode(v); if (error) setError('')
          }}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="0 0 0 0"
          style={{
            width: '100%', padding: '14px',
            background: '#ffffff', border: `1px solid ${error ? '#ef4444' : '#22c55e'}`,
            borderRadius: 10, fontSize: 22, color: '#0a0a0c', textAlign: 'center',
            letterSpacing: '0.5em', outline: 'none', fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        />

        <button
          onClick={submit}
          disabled={busy}
          style={{
            width: '100%', marginTop: 14,
            background: busy ? '#9ca3af' : '#0a0a0c', color: '#fff', border: 'none',
            padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 800,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >{busy ? '확인 중...' : '컨펌 시작'}</button>

        {error && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, fontSize: 12, color: '#ef4444', textAlign: 'center', fontWeight: 700,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
