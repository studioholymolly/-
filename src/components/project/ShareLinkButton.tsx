'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getShareUrl } from '@/lib/utils'
import { regenerateShareToken } from '@/lib/actions/projects'
import { STUDIO_NAME } from '@/lib/brand'

type Phase = 'selecting' | 'reviewing'

interface Props {
  projectId: string
  projectName: string
  token: string
  clientEmail: string
  clientName?: string
  phase?: Phase
}

export default function ShareLinkButton({ projectId, projectName, token, clientEmail, clientName, phase = 'selecting' }: Props) {
  const [copied, setCopied] = useState(false)
  const [kakaoCopied, setKakaoCopied] = useState(false)
  const [justIssued, setJustIssued] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const url = getShareUrl(token)

  // 카카오톡 안내 메시지 — 단계별로 문구가 바뀝니다 (초기 셀렉 vs 보정본 검토)
  const kakaoMessage = phase === 'reviewing'
    ? [
        `안녕하세요${clientName ? ` ${clientName}님` : ''} 😊`,
        `<${projectName}> 보정본이 준비되었습니다. 아래 링크에서 확인해 주세요.`,
        ``,
        `👉 ${url}`,
        ``,
        `링크에서 보정본을 확인하시고 "수정 없음" 또는 "수정 있음"을 선택해 주세요.`,
        `수정이 필요한 사진이 있으시면 해당 사진에 핀을 추가해 수정 방향을 남겨주시면 됩니다. (수정 요청은 1회 가능합니다)`,
        ``,
        `감사합니다 🙏`,
        `— ${STUDIO_NAME}`,
      ].join('\n')
    : [
        `안녕하세요${clientName ? ` ${clientName}님` : ''} 😊`,
        `<${projectName}> 사진 셀렉 링크를 보내드립니다.`,
        ``,
        `👉 ${url}`,
        ``,
        `위 링크에서 마음에 드시는 사진을 선택하고, 보정이 필요한 부분은 각 사진에 핀을 추가해 남겨주세요.`,
        `셀렉 완료 후 "셀렉 완료 전송" 버튼을 눌러주시면 됩니다.`,
        ``,
        `감사합니다 🙏`,
        `— ${STUDIO_NAME}`,
      ].join('\n')

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function copyKakao() {
    await navigator.clipboard.writeText(kakaoMessage)
    setKakaoCopied(true)
    setTimeout(() => setKakaoCopied(false), 2500)
  }

  function openEmail() {
    const subjectText = phase === 'reviewing'
      ? `보정본 확인 링크 — ${projectName}`
      : `사진 셀렉 링크 — ${projectName}`
    const subject = encodeURIComponent(subjectText)
    const body = encodeURIComponent(kakaoMessage)
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

      {/* 카카오톡 안내 메시지 템플릿 */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--mu)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            💬 카카오톡 안내 메시지
          </p>
          <button onClick={copyKakao} style={{
            background: kakaoCopied ? '#14532d' : '#fee500',
            border: 'none', color: kakaoCopied ? '#fff' : '#3a1d1d',
            padding: '7px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{kakaoCopied ? '✓ 복사됨' : '📋 메시지 복사'}</button>
        </div>
        <textarea
          readOnly
          value={kakaoMessage}
          onFocus={e => e.currentTarget.select()}
          rows={9}
          style={{
            width: '100%', background: 'var(--s3)', border: '1px solid var(--bd)',
            color: 'var(--tx)', padding: '10px 12px', borderRadius: 6,
            fontSize: 12, fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', lineHeight: 1.6,
          }}
        />
        <p style={{ fontSize: 10, color: 'var(--mu)', marginTop: 6, lineHeight: 1.5 }}>
          💡 메시지 복사 버튼을 누른 뒤 카카오톡에 붙여넣기 하세요
        </p>
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
