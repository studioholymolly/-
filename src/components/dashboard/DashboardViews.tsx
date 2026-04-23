'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Project, ProjectStatus } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ProjectRowActions from '@/components/ProjectRowActions'
import { formatDate, STATUS_LABELS } from '@/lib/utils'

interface Props {
  projects: Project[]
  activeFilter: ProjectStatus | null
}

type View = 'list' | 'calendar' | 'gantt'

const STATUS_COLOR: Record<ProjectStatus, string> = {
  draft: '#9ca3af',
  selecting: '#60a5fa',
  selection_done: '#34d399',
  studio_editing: '#a78bfa',
  client_reviewing: '#fbbf24',
  completed: '#22c55e',
}

export default function DashboardViews({ projects, activeFilter }: Props) {
  const [view, setView] = useState<View>('list')

  return (
    <div>
      {/* View switcher */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 18,
        padding: 4, background: 'var(--s1)', border: '1px solid var(--bd)',
        borderRadius: 10, width: 'fit-content',
      }}>
        {([
          { k: 'list' as const, label: '📋 리스트' },
          { k: 'calendar' as const, label: '📅 캘린더' },
          { k: 'gantt' as const, label: '📊 간트' },
        ]).map(t => (
          <button
            key={t.k}
            type="button"
            onClick={() => setView(t.k)}
            style={{
              padding: '7px 14px', borderRadius: 7,
              fontSize: 12, fontWeight: 700,
              background: view === t.k ? 'var(--vio)' : 'transparent',
              color: view === t.k ? '#fff' : 'var(--mu)',
              border: 'none', cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}
      </div>

      {view === 'list' && <ListView projects={projects} activeFilter={activeFilter} />}
      {view === 'calendar' && <CalendarView projects={projects} />}
      {view === 'gantt' && <GanttView projects={projects} />}
    </div>
  )
}

/* --------------------------- LIST VIEW --------------------------- */
function ListView({ projects, activeFilter }: { projects: Project[]; activeFilter: ProjectStatus | null }) {
  if (projects.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 20px',
        background: 'var(--s1)', border: '1px solid var(--bd)',
        borderRadius: 16,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          {activeFilter ? `'${STATUS_LABELS[activeFilter]}' 상태의 프로젝트가 없습니다` : '프로젝트가 없습니다'}
        </h3>
        {!activeFilter && (
          <>
            <p style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 20 }}>첫 프로젝트를 만들어 클라이언트와 협업을 시작하세요</p>
            <Link href="/projects/new" style={{
              background: 'var(--vio)', color: '#fff',
              padding: '10px 20px', borderRadius: 8,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>+ 새 프로젝트 만들기</Link>
          </>
        )}
        {activeFilter && (
          <Link href="/dashboard" style={{
            background: 'var(--s2)', color: 'var(--tx)',
            border: '1px solid var(--bd2)',
            padding: '10px 20px', borderRadius: 8,
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>전체 보기</Link>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {projects.map(project => (
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
                  background: 'var(--vio)', flexShrink: 0, display: 'inline-block',
                }} />
              )}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 3 }}>
                  {project.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                  {project.client_name} · {project.client_email}
                  {project.retouching_start_date ? ` · 보정 시작 ${formatDate(project.retouching_start_date)}` : ''}
                  {project.deadline ? ` · 보정 마감 ${formatDate(project.deadline)}` : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <StatusBadge status={project.status} />
              <span style={{ fontSize: 12, color: 'var(--mu)' }}>{formatDate(project.created_at)}</span>
              <ProjectRowActions projectId={project.id} projectName={project.name} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

/* --------------------------- CALENDAR VIEW --------------------------- */
function CalendarView({ projects }: { projects: Project[] }) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Map YYYY-MM-DD → projects whose deadline falls on that day
  const projectsByDay = useMemo(() => {
    const map: Record<string, Project[]> = {}
    for (const p of projects) {
      if (!p.deadline) continue
      const key = p.deadline.slice(0, 10) // 'YYYY-MM-DD'
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return map
  }, [projects])

  function prevMonth() { setCursor(new Date(year, month - 1, 1)) }
  function nextMonth() { setCursor(new Date(year, month + 1, 1)) }
  function goToday() { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)) }

  const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 20 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={prevMonth} style={navBtn}>‹</button>
          <h3 style={{ fontSize: 16, fontWeight: 800, minWidth: 140, textAlign: 'center' }}>
            {year}년 {month + 1}월
          </h3>
          <button onClick={nextMonth} style={navBtn}>›</button>
        </div>
        <button onClick={goToday} style={{ ...navBtn, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
          오늘
        </button>
      </div>

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {weekdayLabels.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700,
            color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--mu)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            padding: '6px 0',
          }}>{d}</div>
        ))}
      </div>

      {/* Day grid — 6 rows × 7 cols = 42 cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: 42 }, (_, i) => {
          const dayNum = i - firstWeekday + 1
          const inMonth = dayNum >= 1 && dayNum <= daysInMonth
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          const dayProjects = inMonth ? (projectsByDay[key] || []) : []
          const isToday = inMonth && key === todayKey
          const weekday = i % 7
          return (
            <div key={i} style={{
              minHeight: 90,
              background: inMonth ? (isToday ? 'rgba(124,58,237,0.08)' : 'var(--s2)') : 'transparent',
              border: `1px solid ${isToday ? 'var(--vio)' : 'var(--bd)'}`,
              borderRadius: 8,
              padding: 6,
              opacity: inMonth ? 1 : 0.35,
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              {inMonth && (
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: isToday ? 'var(--vio-l)' : weekday === 0 ? '#ef4444' : weekday === 6 ? '#3b82f6' : 'var(--tx)',
                  marginBottom: 2,
                }}>
                  {dayNum}
                </div>
              )}
              {dayProjects.slice(0, 3).map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    background: STATUS_COLOR[p.status] + '22',
                    borderLeft: `3px solid ${STATUS_COLOR[p.status]}`,
                    color: 'var(--tx)',
                    padding: '2px 5px', borderRadius: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }} title={`${p.name} — ${STATUS_LABELS[p.status]}`}>
                    {p.name}
                  </div>
                </Link>
              ))}
              {dayProjects.length > 3 && (
                <div style={{ fontSize: 10, color: 'var(--mu)', fontWeight: 600, padding: '0 5px' }}>
                  +{dayProjects.length - 3}개 더
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {(Object.keys(STATUS_COLOR) as ProjectStatus[]).map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--mu)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[s] }} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'center', marginTop: 8 }}>
        프로젝트 보정 마감일 기준으로 표시됩니다
      </p>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'var(--s2)', border: '1px solid var(--bd2)',
  color: 'var(--tx)', padding: '6px 10px',
  borderRadius: 7, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', minWidth: 32,
}

/* --------------------------- GANTT VIEW --------------------------- */
function GanttView({ projects }: { projects: Project[] }) {
  // Only include projects with a deadline (needed to define end of bar)
  const scheduled = projects.filter(p => !!p.deadline)

  if (scheduled.length === 0) {
    return (
      <div style={{
        background: 'var(--s1)', border: '1px solid var(--bd)',
        borderRadius: 12, padding: 60, textAlign: 'center', color: 'var(--mu)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>간트차트로 표시할 프로젝트가 없습니다</p>
        <p style={{ fontSize: 12 }}>프로젝트에 <b>보정 마감일</b>을 설정하면 이곳에 타임라인이 표시됩니다</p>
      </div>
    )
  }

  // Use retouching_start_date when present, otherwise fall back to created_at for the bar start.
  const barStartMs = (p: Project) => new Date(p.retouching_start_date || p.created_at).getTime()

  // Sort by bar start ascending for display order
  const sorted = [...scheduled].sort((a, b) => barStartMs(a) - barStartMs(b))

  // Determine date range: earliest bar start → latest max(deadline, today)
  const nowMs = Date.now()
  let minMs = Infinity, maxMs = -Infinity
  for (const p of sorted) {
    const start = barStartMs(p)
    const end = Math.max(new Date(p.deadline!).getTime(), nowMs)
    if (start < minMs) minMs = start
    if (end > maxMs) maxMs = end
  }
  // Pad range by 1 day on each side
  const DAY = 24 * 60 * 60 * 1000
  minMs -= DAY
  maxMs += DAY
  const totalMs = maxMs - minMs

  // Build day tick marks — one tick per week
  const ticks: Array<{ ms: number; label: string }> = []
  const startDate = new Date(minMs)
  startDate.setHours(0, 0, 0, 0)
  // Round up to next Monday
  const dayOfWeek = startDate.getDay()
  const daysToMon = (8 - dayOfWeek) % 7 || 7
  const firstTick = new Date(startDate.getTime() + daysToMon * DAY)
  for (let t = firstTick.getTime(); t < maxMs; t += 7 * DAY) {
    const d = new Date(t)
    ticks.push({ ms: t, label: `${d.getMonth() + 1}/${d.getDate()}` })
  }

  const todayLeftPct = ((nowMs - minMs) / totalMs) * 100

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 20 }}>
      {/* Header: date axis */}
      <div style={{ display: 'flex', marginBottom: 6, paddingLeft: 220 }}>
        <div style={{ position: 'relative', flex: 1, height: 22, borderBottom: '1px solid var(--bd)' }}>
          {ticks.map(t => {
            const leftPct = ((t.ms - minMs) / totalMs) * 100
            return (
              <div key={t.ms} style={{
                position: 'absolute', left: `${leftPct}%`, top: 0, bottom: 0,
                borderLeft: '1px dashed var(--bd2)',
                fontSize: 10, color: 'var(--mu)', paddingLeft: 4, whiteSpace: 'nowrap',
              }}>{t.label}</div>
            )
          })}
          {/* today marker */}
          <div style={{
            position: 'absolute', left: `${todayLeftPct}%`, top: 0, bottom: -1000,
            borderLeft: '2px solid #ef4444', zIndex: 5,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', left: `calc(${todayLeftPct}% + 3px)`, top: 0,
            fontSize: 10, fontWeight: 800, color: '#ef4444',
          }}>오늘</div>
        </div>
      </div>

      {/* Project rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(p => {
          const start = barStartMs(p)
          const end = new Date(p.deadline!).getTime()
          const leftPct = Math.max(0, ((start - minMs) / totalMs) * 100)
          // Ensure minimum visible width
          const rawWidthPct = ((end - start) / totalMs) * 100
          const widthPct = Math.max(2, rawWidthPct)
          const overdue = end < nowMs && p.status !== 'completed'
          return (
            <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--s2)', border: '1px solid var(--bd)',
                borderRadius: 8, padding: '10px 12px',
                cursor: 'pointer',
              }}>
                {/* Left: project name */}
                <div style={{ width: 200, flexShrink: 0, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--tx)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={p.name}>{p.name}</div>
                  <div style={{
                    fontSize: 10, color: 'var(--mu)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.client_name} · {STATUS_LABELS[p.status]}
                  </div>
                </div>

                {/* Right: bar area */}
                <div style={{ position: 'relative', flex: 1, height: 26 }}>
                  <div style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    top: 3, bottom: 3,
                    background: `linear-gradient(90deg, ${STATUS_COLOR[p.status]}cc, ${STATUS_COLOR[p.status]})`,
                    borderRadius: 6,
                    boxShadow: overdue ? '0 0 0 2px #ef4444' : 'none',
                    display: 'flex', alignItems: 'center',
                    padding: '0 8px',
                    minWidth: 24,
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}>
                      {formatDate(p.deadline)}{overdue ? ' · 지연' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {(Object.keys(STATUS_COLOR) as ProjectStatus[]).map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--mu)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[s] }} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--mu)', textAlign: 'center', marginTop: 8 }}>
        보정 시작일(없으면 프로젝트 생성일)부터 보정 마감일까지의 기간을 표시합니다 · 마감이 지난 항목은 빨간 테두리로 강조됩니다
      </p>
    </div>
  )
}
