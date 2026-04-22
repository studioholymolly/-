'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getShareUrl } from '@/lib/utils'
import { regenerateShareToken } from '@/lib/actions/projects'

interface Props {
  projectId: string
  token: string
  clientEmail: string
}

export default function ShareLinkButton({ projectId, token, clientEmail }: Props) {
  const [copied, setCopied] = useState(false)
  const [justIssued, setJustIssued] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
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

  function regenerate() {
    const ok = window.confirm('새 링크를 발급합니다.\n\n기존 링크는 즉시 무효가 되어 클라이언트가 접속할 수 없습니다.\n수정 사항을 반영한 새 링크를 클라이언트에게 다시 전달해야 합니다.\n\n계속하시겠습니까?')
    if (!ok) return
    startTransition(async () => {
      const res = await regenerateShareToken(projectId)
      if (res?.ok) {
        setJustIssued(true)
        setTimeout(() => setJustIssued(false), 3500)
        router.refresh()
      } else if (res?.error) {
        alert('발급 실패: ' + res.error)
      }
    })
  }

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>클라이언트 링크</p>
        {justIssued && <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>✓ 새 링크 발급됨</span>}
      </div>
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
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <p style={{ fontSize: 11, color: 'var(--mu)', lineHeight: 1.5, margin: 0 }}>
          사진을 추가하거나 정보를 수정했다면, 새 링크를 발급해 클라이언트에게 다시 보낼 수 있습니다. 기존 링크는 즉시 무효가 됩니다.
        </p>
        <button onClick={regenerate} disabled={isPending} style={{
          background: '#f59e0b', border: 'none', color: '#ffffff',
          padding: '8px 14px', borderRadius: 6,
          fontSize: 12, fontWeight: 700, cursor: isPending ? 'wait' : 'pointer', whiteSpace: 'nowrap',
          opacity: isPending ? 0.6 : 1,
        }}>{isPending ? '발급 중...' : '🔄 새 링크 발급'}</button>
      </div>
    </div>
  )
}
