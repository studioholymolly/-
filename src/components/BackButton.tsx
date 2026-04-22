'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      style={{
        background: 'var(--s2)', border: '1px solid var(--bd2)',
        color: 'var(--tx)', padding: '7px 14px',
        borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      ← 뒤로
    </button>
  )
}
