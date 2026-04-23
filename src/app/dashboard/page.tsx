import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/actions/notifications'
import Navbar from '@/components/Navbar'
import DashboardViews from '@/components/dashboard/DashboardViews'
import { WORKFLOW_STATUSES, STATUS_LABELS } from '@/lib/utils'
import { Project, ProjectStatus } from '@/lib/types'

interface DashboardSearchParams {
  status?: string
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const sp = await searchParams
  const activeFilter: ProjectStatus | null =
    sp.status && WORKFLOW_STATUSES.includes(sp.status as ProjectStatus)
      ? (sp.status as ProjectStatus)
      : null

  const [projectsRes, unreadCount] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('studio_id', user.id)
      .order('created_at', { ascending: false }),
    getUnreadCount(),
  ])

  const allProjects: Project[] = projectsRes.data || []
  const visibleProjects = activeFilter
    ? allProjects.filter(p => p.status === activeFilter)
    : allProjects

  // Count per status for the filter cards
  const countByStatus: Record<ProjectStatus, number> = {
    draft: 0, selecting: 0, selection_done: 0,
    studio_editing: 0, client_reviewing: 0, completed: 0,
  }
  for (const p of allProjects) countByStatus[p.status]++

  // Stat cards shown across the top (order = workflow)
  const statCards: Array<{
    key: ProjectStatus | 'all'
    label: string
    value: number
    color: string
  }> = [
    { key: 'all', label: '전체', value: allProjects.length, color: '#a78bfa' },
    { key: 'selecting', label: '셀렉 중', value: countByStatus.selecting, color: '#60a5fa' },
    { key: 'selection_done', label: '셀렉 완료', value: countByStatus.selection_done, color: '#34d399' },
    { key: 'studio_editing', label: '보정 중', value: countByStatus.studio_editing, color: '#a78bfa' },
    { key: 'client_reviewing', label: '검토 중', value: countByStatus.client_reviewing, color: '#fbbf24' },
    { key: 'completed', label: '완료', value: countByStatus.completed, color: '#22c55e' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar unreadCount={unreadCount} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>프로젝트</h1>
            <p style={{ fontSize: 13, color: 'var(--mu)' }}>
              {activeFilter
                ? <>필터: <b style={{ color: 'var(--tx)' }}>{STATUS_LABELS[activeFilter]}</b> · {visibleProjects.length}개 · <Link href="/dashboard" style={{ color: 'var(--vio-l)' }}>전체 보기</Link></>
                : <>전체 {allProjects.length}개 프로젝트</>
              }
            </p>
          </div>
          <Link href="/projects/new" style={{
            background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
            color: '#fff', padding: '10px 20px',
            borderRadius: 8, fontSize: 14, fontWeight: 700,
            textDecoration: 'none',
          }}>+ 새 프로젝트 만들기</Link>
        </div>

        {/* Clickable stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 10,
          marginBottom: 28,
        }}>
          {statCards.map(s => {
            const isActive = (s.key === 'all' && !activeFilter) || s.key === activeFilter
            const href = s.key === 'all' ? '/dashboard' : `/dashboard?status=${s.key}`
            return (
              <Link key={s.key} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: isActive ? 'var(--s2)' : 'var(--s1)',
                  border: `1px solid ${isActive ? s.color : 'var(--bd)'}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  transition: 'border-color .15s, background .15s',
                  cursor: 'pointer',
                  height: '100%',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: isActive ? 'var(--tx)' : 'var(--mu)', marginTop: 2, fontWeight: isActive ? 700 : 400 }}>{s.label}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Views: list / calendar / gantt */}
        <DashboardViews projects={visibleProjects} activeFilter={activeFilter} />
      </div>
    </div>
  )
}
