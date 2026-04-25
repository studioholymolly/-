'use client'

import { useEffect, useRef, useState } from 'react'
import { STUDIO_NAME } from '@/lib/brand'

const PREFIX = 'studio-app:visitor-name:'

export function loadVisitorName(shareToken: string): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(PREFIX + shareToken) ?? ''
}

export function saveVisitorName(shareToken: string, name: string) {
  if (typeof window === 'undefined') return
  const trimmed = name.trim()
  if (trimmed) window.localStorage.setItem(PREFIX + shareToken, trimmed)
  else window.localStorage.removeItem(PREFIX + shareToken)
}

export default function VisitorNameGate({
  initial = '', confirmLabel = '다음', title, description, onSave, onClose,
}: {
  initial?: string
  confirmLabel?: string
  title?: string
  description?: string
  onSave: (name: string) => void
  onClose?: () => void
}) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) { setError('이름을 입력해주세요'); return }
    onSave(trimmed)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        zIndex: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
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
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{title || '방문자 설정'}</h2>
          <p style={{ fontSize: 13, color: '#6b6b80', lineHeight: 1.6 }}>
            {description || '리뷰를 진행할 담당자님의\n이름이나 직책을 입력해 주세요.'}
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); if (error) setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="예: 김디자이너"
          maxLength={30}
          style={{
            width: '100%', padding: '12px 14px',
            background: '#ffffff', border: `1px solid ${error ? '#ef4444' : '#22c55e'}`,
            borderRadius: 10, fontSize: 15, color: '#0a0a0c', textAlign: 'center',
            outline: 'none', fontWeight: 600,
          }}
        />
        {error && (
          <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', marginTop: 8 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                flex: 1, background: '#f3f3f5', border: '1px solid #e0e0e5', color: '#0a0a0c',
                padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >취소</button>
          )}
          <button
            onClick={submit}
            style={{
              flex: 2, background: '#0a0a0c', color: '#fff', border: 'none',
              padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
