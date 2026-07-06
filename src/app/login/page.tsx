'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import LogoSymbol from '@/components/brand/LogoSymbol'
import { STUDIO_NAME } from '@/lib/brand'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--bd)',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <LogoSymbol size={44} />
          </div>
          <h1 className="hm-wordmark hm-display" style={{ fontSize: 17, color: 'var(--tx)', marginBottom: 4 }}>
            STUDIO. HOLYMOLLY
          </h1>
          <p style={{ fontSize: 13, color: 'var(--mu)' }}>{STUDIO_NAME} — 관리자 로그인</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>이메일</label>
            <input
              name="email"
              type="email"
              required
              placeholder="studio@example.com"
              style={{
                width: '100%', padding: '10px 13px',
                background: 'var(--s2)', border: '1px solid var(--bd)',
                borderRadius: 8, color: 'var(--tx)', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>비밀번호</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 13px',
                background: 'var(--s2)', border: '1px solid var(--bd)',
                borderRadius: 8, color: 'var(--tx)', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 13px', marginBottom: 16,
              color: '#ef4444', fontSize: 13,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#444' : '#111',
              border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--mu)', textDecoration: 'none' }}>
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
