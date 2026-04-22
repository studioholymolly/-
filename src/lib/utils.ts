import { ProjectStatus } from './types'

export function getShareUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/c/${token}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '초안',
  selecting: '셀렉 중',
  selection_done: '셀렉 완료',
  studio_editing: '보정 중',
  client_reviewing: '검토 중',
  completed: '완료',
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-700 border border-zinc-300',
  selecting: 'bg-blue-50 text-blue-700 border border-blue-200',
  selection_done: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  studio_editing: 'bg-violet-50 text-violet-700 border border-violet-200',
  client_reviewing: 'bg-amber-50 text-amber-700 border border-amber-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
}

/** The steps that appear on the dashboard filter bar + per-project status editor, in workflow order. */
export const WORKFLOW_STATUSES: ProjectStatus[] = [
  'draft',
  'selecting',
  'selection_done',
  'studio_editing',
  'client_reviewing',
  'completed',
]
