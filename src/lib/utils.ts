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
  studio_editing: '보정 중',
  client_reviewing: '검토 중',
  completed: '완료',
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: 'bg-zinc-800 text-zinc-400',
  selecting: 'bg-blue-900 text-blue-300',
  studio_editing: 'bg-violet-900 text-violet-300',
  client_reviewing: 'bg-amber-900 text-amber-300',
  completed: 'bg-green-900 text-green-300',
}
