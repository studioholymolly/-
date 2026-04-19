'use client'

import { useState } from 'react'
import { getShareUrl } from '@/lib/utils'

export default function ShareLinkButton({ token, clientEmail }: { token: string; clientEmail: string }) {
  const [copied, setCopied] = useState(false)
  const url = getShareUrl(token)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function openEmail() {
    const subject = encodeURIComponent('사진 셀렉 링크입니다')
    const body = encodeURIComponent(`안녕하세요 😊\n\n아래 링크에서 사진을 확인하고 선택해 주세요.\n\n${url}\n\n감사합니다.`)
    window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`)
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>클라이언트 링크</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <code style={{
          flex: 1, background: 'var(--s3)', border: '1px solid var(--bd)',
          padding: '8px 12px', borderRadius: 6,
          fontSize: 12, color: 'var(--vio-l)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{url}</code>
        <button onClick={copy} style={{
          background: copied ? '#14532d' : 'var(--vio)',
          border: 'none', color: '#fff',
          padding: '8px 14px', borderRadius: 6,
          fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{copied ? '✓ 복사됨' : '링크 복사'}</button>
        <button onClick={openEmail} style={{
          background: 'var(--s3)', border: '1px solid var(--bd2)',
          color: 'var(--tx)', padding: '8px 14px',
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>이메일 열기</button>
      </div>
    </div>
  )
}
