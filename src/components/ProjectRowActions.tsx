'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteProject } from '@/lib/actions/projects'

interface Props {
  projectId: string
  projectName: string
}

/**
 * Inline row actions shown on the dashboard — lets the studio edit or delete a project
 * without having to open the project detail page first. Stops event propagation so clicking
 * these buttons doesn't also trigger the outer <Link> that opens the project.
 */
export default function ProjectRowActions({ projectId, projectName }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const ok = window.confirm(`"${projectName}" 프로젝트를 삭제하시겠습니까?\n\n업로드된 사진, 셀렉 기록 등 모든 데이터가 영구 삭제됩니다.`)
    if (!ok) return
    const again = window.confirm('정말 삭제합니다. 되돌릴 수 없습니다. 계속하시겠습니까?')
    if (!again) return
    startTransition(async () => {
      await deleteProject(projectId)
      router.refresh()
    })
  }

  const btnStyle: React.CSSProperties = {
    background: 'var(--s2)', border: '1px solid var(--bd2)',
    color: 'var(--tx)', padding: '6px 12px',
    borderRadius: 7, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: 4,
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
      <Link
        href={`/projects/${projectId}#settings`}
        onClick={e => e.stopPropagation()}
        style={btnStyle}
        aria-label="편집"
      >
        ✏️ 편집
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        style={{
          ...btnStyle,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.35)',
          color: '#dc2626',
          opacity: isPending ? 0.5 : 1,
        }}
        aria-label="삭제"
      >
        🗑 {isPending ? '삭제 중...' : '삭제'}
      </button>
    </div>
  )
}
