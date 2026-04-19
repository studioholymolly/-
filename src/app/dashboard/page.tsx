import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/actions/notifications'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { Project } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('studio_id', user.id)
    .order('created_at', { ascending: false })

  const unreadCount = await getUnreadCount()
  const projectList: Project[] = projects || []

  const stats = {
    total: projectList.length,
    active: projectList.filter(p => p.status !== 'completed' && p.status !== 'draft').length,
    selecting: projectList.filter(p => p.status === 'selecting').length,
    completed: projectList.filter(p => p.status === 'completed').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar unreadCount={unreadCount} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>프로젝트</h1>
            <p style={{ fontSize: 13, color: 'var(--mu)' }}>전체 {stats.total}개 프로젝트</p>
          </div>
          <Link href="/projects/new" style={{
            background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
            color: '#fff', padding: '10px 20px',
            borderRadius: 8, fontSize: 14, fontWeight: 700,
            textDecoration: 'none',
          }}>+ 새 프로젝트 만들기</Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
          marginBottom: 28,
        }}>
          {[
            { label: '전체', value: stats.total, color: '#a78bfa' },
            { label: '진행 중', value: stats.active, color: '#60a5fa' },
            { label: '셀렉 중', value: stats.selecting, color: '#34d399' },
            { label: '완료', value: stats.completed, color: '#6b7280' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--s1)', border: '1px solid var(--bd)',
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Project list */}
        {projectList.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: 'var(--s1)', border: '1px solid var(--bd)',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>프로젝트가 없습니다</h3>
            <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 20 }}>첫 프로젝트를 만들어 클라이언트와 협업을 시작하세요</p>
            <Link href="/projects/new" style={{
              background: 'var(--vio)', color: '#fff',
              padding: '10px 20px', borderRadius: 8,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>+ 새 프로젝트 만들기</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projectList.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--s1)', border: `1px solid ${project.unread_for_studio ? 'var(--vio)' : 'var(--bd)'}`,
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border-color 0.15s',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {project.unread_for_studio && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--vio)', flexShrink: 0,
                        display: 'inline-block',
                      }} />
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 3 }}>
                        {project.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                        {project.client_name} · {project.client_email}
                        {project.deadline ? ` · 마감 ${formatDate(project.deadline)}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <StatusBadge status={project.status} />
                    <span style={{ fontSize: 12, color: 'var(--mu)' }}>{formatDate(project.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
