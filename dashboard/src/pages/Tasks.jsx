import { useMemo, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { addItem, updateItem, toggleTask, removeItem, dday, today, addDays, PRIORITIES, activeMembers, gcalLink, buildICS } from '../data.js'
import { MemberSelect, Avatar } from '../ui.jsx'

const PR_ORDER = { 높음: 0, 보통: 1, 낮음: 2 }

// 프로젝트 색 점: 이름 기반 고정 색 (스키마 변경 없이 칩·헤더·진행률 바 색을 통일)
const PROJECT_COLORS = ['#1D9E75', '#7F77DD', '#D85A30', '#378ADD', '#D4537E', '#BA7517', '#639922', '#534AB7']
function projColor(name) {
  if (!name || name === '__none') return 'var(--g4)'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PROJECT_COLORS[h % PROJECT_COLORS.length]
}

// 간트·월간용 프로젝트 고정 색상 — id 해시로 hue를 뽑아 어디서든 같은 색 (구 캘린더 탭에서 이관)
const gHue = (id) => {
  let h = 0
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return Math.floor(h * 137.508) % 360 // 골든앵글 — 비슷한 id끼리도 색이 확 벌어지게
}
const gColor = (id) => `hsl(${gHue(id)} 55% 42%)`
const gColorSoft = (id) => `hsl(${gHue(id)} 55% 42% / .16)`

export default function Tasks() {
  const { user } = useAuth()
  const s = useStore()
  const [f, setF] = useState({ title: '', owner: user.id, priority: '보통', due: '', repeat: '', project: '' })
  const [filter, setFilter] = useState('all') // all | today | mine | open | routine
  const [view, setView] = useState(() => localStorage.getItem('hm-tasks-view') || 'gantt') // gantt | month | list | byProject | byOwner | byPr | byDue
  const setV = (v) => { setView(v); localStorage.setItem('hm-tasks-view', v) }
  const [ownerFilter, setOwnerFilter] = useState('') // 100명 대비 담당자 필터
  const [projectFilter, setProjectFilter] = useState('') // 프로젝트별 필터
  const [collapsed, setCollapsed] = useState(() => new Set()) // 프로젝트별 뷰에서 접힌 그룹
  const [selMode, setSelMode] = useState(false) // 선택 모드 — 전체선택·일괄 삭제/완료
  const [selIds, setSelIds] = useState(() => new Set())

  // ---- 캘린더·간트 (구 캘린더 탭 이관) ----
  const now = today() // YYYY-MM-DD
  const [ym, setYm] = useState(now.slice(0, 7)) // YYYY-MM
  const [sel, setSel] = useState(now)
  const isCal = view === 'gantt' || view === 'month'
  const [gy, gm] = ym.split('-').map(Number)
  const daysIn = new Date(gy, gm, 0).getDate()
  function navMonth(diff) {
    const d = new Date(gy, gm - 1 + diff, 1)
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  // 월간 달력: 촬영 일자만 표시
  const shootEvents = useMemo(() => {
    const map = {}
    s.projects.filter((pj) => !pj.archived && pj.shootDate).forEach((pj) => {
      ;(map[pj.shootDate] = map[pj.shootDate] || []).push({ label: pj.name, sub: '촬영', owner: pj.owner, color: gColor(pj.id) })
    })
    return map
  }, [s])

  function toggleCollapse(name) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  // 업무에 연결된 프로젝트 목록 (보관된 프로젝트의 업무도 필터 가능하도록 업무 기준)
  const projectNames = [...new Set(s.tasks.map((t) => t.project).filter(Boolean))].sort()

  function add(e) {
    e.preventDefault()
    if (!f.title.trim()) return
    addItem('tasks', { ...f, title: f.title.trim(), done: false }, user.id)
    setF({ ...f, title: '', due: '' })
  }

  let list = [...s.tasks]
  if (filter === 'mine') list = list.filter((t) => t.owner === user.id)
  if (filter === 'open') list = list.filter((t) => !t.done)
  if (filter === 'today') list = list.filter((t) => !t.done && t.due && t.due <= today())
  if (filter === 'routine') list = list.filter((t) => t.repeat)
  if (ownerFilter) list = list.filter((t) => t.owner === ownerFilter)
  if (projectFilter) list = list.filter((t) => projectFilter === '__none' ? !t.project : t.project === projectFilter)

  // 정렬: 미완료 우선 → 우선순위 → 마감일
  list.sort((a, b) => (a.done - b.done) || (PR_ORDER[a.priority ?? '보통'] - PR_ORDER[b.priority ?? '보통']) || String(a.due || '9999').localeCompare(String(b.due || '9999')))

  const open = list.filter((t) => !t.done)
  const done = list.filter((t) => t.done)

  // ---- 선택 모드: 현재 화면에 보이는 업무만 전체선택 대상 (리스트 뷰는 완료 포함, 그룹 뷰는 미완료만) ----
  const visibleIds = (view === 'list' ? list : open).map((t) => t.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selIds.has(id))
  function toggleSel(id) {
    setSelIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const rowSel = (t) => selMode ? { selMode: true, sel: selIds.has(t.id), onSel: () => toggleSel(t.id) } : {}
  function bulkDelete() {
    if (!selIds.size) return
    if (!confirm(`선택한 업무 ${selIds.size}건을 삭제할까요?`)) return
    ;[...selIds].forEach((id) => removeItem('tasks', id))
    setSelIds(new Set())
  }
  function bulkDone() {
    if (!selIds.size) return
    ;[...selIds].forEach((id) => {
      const t = s.tasks.find((x) => x.id === id)
      if (t && !t.done) toggleTask(id, user.id)
    })
    setSelIds(new Set())
  }

  // 프로젝트 칩용 미완료 카운트 (다른 필터와 무관하게 전체 기준)
  const openCount = (name) => s.tasks.filter((t) => !t.done && (name === '' ? true : name === '__none' ? !t.project : t.project === name)).length
  const useChips = projectNames.length <= 8 // 프로젝트가 많아지면 드롭다운으로 폴백

  // 프로젝트별 그룹: 급한 마감 순 → 미완료 없는 그룹 → 프로젝트 없음
  const projectGroups = view === 'byProject' ? (() => {
    const names = [...new Set(list.map((t) => t.project || '__none'))]
    const groups = names.map((name) => {
      const all = list.filter((t) => (t.project || '__none') === name)
      const grpOpen = all.filter((t) => !t.done).sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')))
      const dues = grpOpen.filter((t) => t.due).map((t) => t.due).sort()
      return { name, open: grpOpen, doneN: all.length - grpOpen.length, total: all.length, urgent: dues.length ? dday(dues[0]) : null }
    })
    groups.sort((a, b) =>
      ((a.name === '__none') - (b.name === '__none')) ||
      ((a.open.length === 0) - (b.open.length === 0)) ||
      String(a.open[0]?.due || '9999').localeCompare(String(b.open[0]?.due || '9999')))
    return groups
  })() : []

  const first = new Date(gy, gm - 1, 1)
  const startDow = first.getDay()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysIn; d++) cells.push(`${ym}-${String(d).padStart(2, '0')}`)
  const selEvents = shootEvents[sel] || []

  return (
    <>
      <div className="ph">
        <h3>업무</h3>
        <span className="mut3" style={{ fontSize: 12 }}>간트 · 달력 · 우선순위·D-Day·루틴 — 수민·도영이 함께 씁니다</span>
        <span className="sp" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['gantt', '간트'], ['month', '월간 달력'], ['list', '리스트'], ['byProject', '프로젝트별'], ['byOwner', '담당자별'], ['byPr', '우선순위별'], ['byDue', '마감일별']].map(([k, v]) => (
            <button key={k} className={'btn sm' + (view === k ? ' primary' : '')} onClick={() => setV(k)}>{v}</button>
          ))}
          {!isCal && (
            <>
              <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)', margin: '0 4px' }} />
              {[['all', '전체'], ['today', '오늘'], ['mine', '내 담당'], ['open', '미완료'], ['routine', '루틴 ↻']].map(([k, v]) => (
                <button key={k} className={'btn sm' + (filter === k ? ' primary' : '')} onClick={() => setFilter(k)}>{v}</button>
              ))}
              <MemberSelect allowAll value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}
                style={{ width: 110, padding: '6px 8px', fontSize: 12.5 }} />
              {!useChips && (
                <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} title="프로젝트별 필터"
                  style={{ width: 130, padding: '6px 8px', fontSize: 12.5 }}>
                  <option value="">전체 프로젝트</option>
                  {projectNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  <option value="__none">프로젝트 없음</option>
                </select>
              )}
              <button className={'btn sm' + (selMode ? ' primary' : '')} title="여러 업무를 한 번에 선택해서 삭제·완료 처리"
                onClick={() => { setSelMode(!selMode); setSelIds(new Set()) }}>☑ 선택</button>
            </>
          )}
        </div>
      </div>

      {/* 간트·월간 공용 월 이동 바 */}
      {isCal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <b className="num" style={{ fontSize: 15, marginRight: 4 }}>{gy}년 {gm}월</b>
          <button className="btn sm" onClick={() => navMonth(-1)} aria-label="이전 달">←</button>
          <button className="btn sm" onClick={() => { setYm(now.slice(0, 7)); setSel(now) }}>오늘</button>
          <button className="btn sm" onClick={() => navMonth(1)} aria-label="다음 달">→</button>
          <span className="sp" />
          {view === 'gantt' && (
            <span className="legend">
              <span><i className="lg lg-shoot" />촬영</span>
              <span><i className="lg lg-due" />납품</span>
              <span><i className="lg lg-task" />업무 마감</span>
            </span>
          )}
          <button className="btn sm" title="구글 캘린더로 가져갈 .ics 파일 다운로드" onClick={() => {
            const blob = new Blob([buildICS()], { type: 'text/calendar' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob); a.download = `holymolly-calendar-${today()}.ics`; a.click()
            URL.revokeObjectURL(a.href)
          }}>⬇ 구글캘린더용</button>
        </div>
      )}

      {isCal ? (view === 'gantt' ? (
        <Gantt projects={s.projects} tasks={s.tasks} ym={ym} daysIn={daysIn} now={now} actor={user.id} />
      ) : (
        <div className="grid">
          <div className="col8">
            <div className="card mcal-wrap">
              <div className="mcal-head">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div key={d} className={'mdw' + (i === 0 ? ' sun' : '')}>{d}</div>
                ))}
              </div>
              <div className="mcal">
                {cells.map((date, i) => {
                  if (!date) return <div key={'e' + i} className="mday empty" />
                  const evs = shootEvents[date] || []
                  const dnum = Number(date.slice(8))
                  return (
                    <button key={date}
                      className={'mday' + (date === now ? ' today' : '') + (date === sel ? ' sel' : '')}
                      onClick={() => setSel(date)}>
                      <span className="dn num">{dnum}</span>
                      <span className="evs">
                        {evs.slice(0, 3).map((ev, j) => (
                          <span key={j} className="mev shoot">
                            <i style={{ background: ev.color }} />{ev.label}
                          </span>
                        ))}
                        {evs.length > 3 && <span className="more">+{evs.length - 3}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 선택한 날짜의 촬영 */}
          <div className="col4">
            <div className="tile">
              <div className="tile-h">
                <span className="ic">📸</span>
                <span className="t num">{sel.slice(5).replace('-', '/')} 촬영</span>
                <span className="sp" />
                <span className="mut3" style={{ fontSize: 11 }}>{selEvents.length}건</span>
              </div>
              {selEvents.length === 0 && (
                <div style={{ padding: '18px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>
                  이 날짜에 촬영이 없습니다
                </div>
              )}
              <div className="alist">
                {selEvents.map((ev, i) => (
                  <div className="arow hi" key={i}>
                    <span className="stripe" style={{ background: ev.color }} />
                    <span className="tx">{ev.label}<small>촬영</small></span>
                    <a className="btn ghost sm" title="구글 캘린더에 추가" target="_blank" rel="noreferrer"
                      href={gcalLink(`📸 ${ev.label}`, sel, '홀리몰리 대시보드')}
                      style={{ textDecoration: 'none', fontSize: 11 }}>G+</a>
                    <Avatar id={ev.owner} />
                  </div>
                ))}
              </div>
            </div>
            <div className="notice" style={{ marginTop: 12 }}>
              <span>ℹ️</span>
              <span>월간 달력에는 프로젝트의 <b>촬영 일자만</b> 표시됩니다. 납품·업무 마감 흐름은 <b>간트</b> 보기에서 확인하세요.</span>
            </div>
          </div>
        </div>
      )) : (
        <>
          {/* 프로젝트 필터 칩 — 미완료 카운트 상시 노출 */}
          {useChips && projectNames.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <span className="mut3" style={{ fontSize: 12, marginRight: 2 }}>프로젝트</span>
              <button className={'btn sm' + (projectFilter === '' ? ' primary' : '')} style={{ borderRadius: 999 }}
                onClick={() => setProjectFilter('')}>전체 <span className="num" style={{ opacity: .65 }}>{openCount('')}</span></button>
              {projectNames.map((n) => (
                <button key={n} className={'btn sm' + (projectFilter === n ? ' primary' : '')} style={{ borderRadius: 999 }}
                  onClick={() => setProjectFilter(projectFilter === n ? '' : n)}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: projColor(n), marginRight: 5, verticalAlign: 1 }} />
                  {n} <span className="num" style={{ opacity: .65 }}>{openCount(n)}</span>
                </button>
              ))}
              {s.tasks.some((t) => !t.project) && (
                <button className={'btn sm' + (projectFilter === '__none' ? ' primary' : '')} style={{ borderRadius: 999, color: projectFilter === '__none' ? undefined : 'var(--ink-3)' }}
                  onClick={() => setProjectFilter(projectFilter === '__none' ? '' : '__none')}>프로젝트 없음 <span className="num" style={{ opacity: .65 }}>{openCount('__none')}</span></button>
              )}
            </div>
          )}

          {/* 빠른 추가 */}
          <form className="card" style={{ padding: 12, display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }} onSubmit={add}>
            <input value={f.title} placeholder="새 업무를 입력하고 Enter" onChange={(e) => setF({ ...f, title: e.target.value })} style={{ flex: '2 1 200px' }} />
            <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} style={{ width: 92 }} title="우선순위">
              {PRIORITIES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <MemberSelect value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} style={{ width: 100 }} />
            <input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} style={{ width: 140 }} title="마감일" />
            <select value={f.repeat} onChange={(e) => setF({ ...f, repeat: e.target.value })} style={{ width: 96 }} title="반복">
              <option value="">반복 없음</option><option value="매주">매주 ↻</option><option value="매월">매월 ↻</option>
            </select>
            <select value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} style={{ width: 140 }} title="프로젝트 연결 (프로젝트 보드에서 불러옴)">
              <option value="">프로젝트 없음</option>
              {s.projects.filter((p) => !p.archived).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <button className="btn primary sm" type="submit">추가</button>
          </form>

          {/* 선택 모드 일괄 작업 바 */}
          {selMode && (
            <div className="card" style={{ padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12.5, fontWeight: 650, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" className="selcb" checked={allSelected}
                  onChange={(e) => setSelIds(e.target.checked ? new Set(visibleIds) : new Set())} />
                전체선택
              </label>
              <span className="mut3 num" style={{ fontSize: 12 }}>{selIds.size}개 선택됨</span>
              <span className="sp" />
              <button className="btn sm" disabled={!selIds.size} onClick={bulkDone}>✓ 완료 처리</button>
              <button className="btn sm" disabled={!selIds.size} onClick={bulkDelete}
                style={{ color: selIds.size ? 'var(--red, #c0392b)' : undefined }}>✕ 선택 삭제</button>
            </div>
          )}

          {view === 'byProject' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projectGroups.map((g) => {
                const label = g.name === '__none' ? '프로젝트 없음' : g.name
                const isCollapsed = collapsed.has(g.name)
                const pct = g.total ? Math.round((g.doneN / g.total) * 100) : 0
                return (
                  <div key={g.name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button onClick={() => toggleCollapse(g.name)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'var(--g1, transparent)', border: 0, borderBottom: isCollapsed || g.open.length === 0 ? 0 : '1px solid var(--line-2)', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>
                      <span className="mut3" style={{ fontSize: 11, width: 12 }}>{isCollapsed ? '▸' : '▾'}</span>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: projColor(g.name), flex: 'none' }} />
                      <span style={{ fontSize: 13.5, fontWeight: 750 }}>{label}</span>
                      <span className="mut3 num" style={{ fontSize: 12 }}>{g.doneN}/{g.total} 완료</span>
                      <span style={{ flex: '0 1 120px', height: 5, borderRadius: 999, background: 'var(--g3)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', width: pct + '%', height: '100%', borderRadius: 999, background: projColor(g.name) }} />
                      </span>
                      <span style={{ flex: 1 }} />
                      {g.open.length === 0
                        ? <span className="mut3" style={{ fontSize: 11.5 }}>모두 완료 ✓</span>
                        : g.urgent && <span className={'dd ddc ' + g.urgent.level}>가장 급한 마감 {g.urgent.label}</span>}
                      {isCollapsed && g.open.length > 0 && <span className="mut3" style={{ fontSize: 11 }}>접힘</span>}
                    </button>
                    {!isCollapsed && g.open.length > 0 && (
                      <div style={{ padding: '0 16px' }}>
                        {g.open.map((t) => <Row key={t.id} t={t} actor={user.id} hideProject {...rowSel(t)} />)}
                      </div>
                    )}
                  </div>
                )
              })}
              {projectGroups.length === 0 && <div className="card" style={{ padding: '4px 16px' }}><Empty /></div>}
            </div>
          ) : view === 'byOwner' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activeMembers().map((u) => {
                const mine = open.filter((t) => t.owner === u.id)
                if (mine.length === 0) return null
                return (
                  <div key={u.id}>
                    <div className="ph" style={{ marginBottom: 8, marginTop: 10 }}>
                      <h3 style={{ fontSize: 13.5 }}>{u.role === 'admin' ? '👑' : '🧑‍💼'} {u.name} <span className="mut3 num">{mine.length}</span></h3>
                    </div>
                    <div className="card" style={{ padding: '4px 16px' }}>
                      {mine.map((t) => <Row key={t.id} t={t} actor={user.id} {...rowSel(t)} />)}
                    </div>
                  </div>
                )
              })}
              {open.length === 0 && <div className="card" style={{ padding: '4px 16px' }}><Empty /></div>}
            </div>
          ) : view === 'byPr' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PRIORITIES.map((pr) => {
                const grp = open.filter((t) => (t.priority ?? '보통') === pr)
                if (grp.length === 0) return null
                return (
                  <div key={pr}>
                    <div className="ph" style={{ marginBottom: 8, marginTop: 10 }}>
                      <h3 style={{ fontSize: 13.5 }}>
                        <span className={'prio pr-' + ({ 높음: 'hi', 보통: 'md', 낮음: 'lo' }[pr])} style={{ marginRight: 6 }}>{pr}</span>
                        <span className="mut3 num">{grp.length}</span>
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '4px 16px' }}>
                      {grp.sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999'))).map((t) => <Row key={t.id} t={t} actor={user.id} {...rowSel(t)} />)}
                    </div>
                  </div>
                )
              })}
              {open.length === 0 && <div className="card" style={{ padding: '4px 16px' }}><Empty /></div>}
            </div>
          ) : view === 'byDue' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['🔴 마감 지남', (t) => t.due && t.due < today()],
                ['⚡ 오늘', (t) => t.due === today()],
                ['📅 이번 주 (7일 이내)', (t) => t.due && t.due > today() && t.due <= addDays(today(), 7)],
                ['🗓 나중', (t) => t.due && t.due > addDays(today(), 7)],
                ['— 기한 없음', (t) => !t.due],
              ].map(([label, test]) => {
                const grp = open.filter(test)
                if (grp.length === 0) return null
                return (
                  <div key={label}>
                    <div className="ph" style={{ marginBottom: 8, marginTop: 10 }}>
                      <h3 style={{ fontSize: 13.5 }}>{label} <span className="mut3 num">{grp.length}</span></h3>
                    </div>
                    <div className="card" style={{ padding: '4px 16px' }}>
                      {grp.sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999'))).map((t) => <Row key={t.id} t={t} actor={user.id} {...rowSel(t)} />)}
                    </div>
                  </div>
                )
              })}
              {open.length === 0 && <div className="card" style={{ padding: '4px 16px' }}><Empty /></div>}
            </div>
          ) : (
            <div className="card" style={{ padding: '4px 16px' }}>
              {open.map((t) => <Row key={t.id} t={t} actor={user.id} {...rowSel(t)} />)}
              {open.length === 0 && <Empty />}
            </div>
          )}

          {view === 'list' && done.length > 0 && (
            <>
              <div className="ph" style={{ marginTop: 20 }}><h3 style={{ color: 'var(--ink-3)' }}>완료 {done.length}</h3></div>
              <div className="card" style={{ padding: '4px 16px' }}>
                {done.map((t) => <Row key={t.id} t={t} actor={user.id} {...rowSel(t)} />)}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}

function Empty() {
  return <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>업무가 없습니다 ✓</div>
}

function Row({ t, actor, hideProject, selMode, sel, onSel }) {
  const dd = !t.done ? dday(t.due) : null
  const pr = t.priority ?? '보통'
  function cyclePriority() {
    const next = PRIORITIES[(PRIORITIES.indexOf(pr) + 1) % PRIORITIES.length]
    updateItem('tasks', t.id, { priority: next })
  }
  return (
    <div className={'trow' + (t.done ? ' done' : '')} style={selMode && sel ? { background: 'var(--panel-2)' } : undefined}>
      {selMode && <input type="checkbox" className="selcb" checked={!!sel} onChange={onSel} aria-label="업무 선택" />}
      <button className={'cbx' + (t.done ? ' done' : '')} onClick={() => toggleTask(t.id, actor)} aria-label="완료 토글">{t.done ? '✓' : ''}</button>
      <button className={'prio pr-' + ({ 높음: 'hi', 보통: 'md', 낮음: 'lo' }[pr])} onClick={cyclePriority}
        title="클릭해서 우선순위 변경">{pr}</button>
      <span className="tt">
        {t.project && !hideProject && <span className="tag" style={{ marginRight: 7 }}>{t.project}</span>}
        {t.title}
        {t.repeat && <span className="rep" title={t.repeat + ' 반복'}>↻ {t.repeat}</span>}
      </span>
      {dd && <span className={'dd ddc ' + dd.level}>{dd.label}</span>}
      <span className="mut3 mono" style={{ fontSize: 11 }}>{t.due || '—'}</span>
      <MemberSelect value={t.owner} onChange={(e) => updateItem('tasks', t.id, { owner: e.target.value })}
        style={{ width: 84, padding: '4px 6px', fontSize: 11.5 }} title="담당 변경" />
      <button className="btn ghost sm" onClick={() => removeItem('tasks', t.id)} aria-label="삭제" style={{ color: 'var(--ink-3)' }}>✕</button>
    </div>
  )
}

/* ---------------- 간트 차트 — 촬영일 → 납품일 막대, 프로젝트별 색상 (구 캘린더 탭 이관) ----------------
   프로젝트명을 클릭하면 해당 프로젝트의 업무 전체가 아래로 펼쳐짐 (완료 포함, 체크·수정 가능) */
export function Gantt({ projects, tasks, ym, daysIn, now, actor }) {
  const [expanded, setExpanded] = useState(() => new Set())
  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const first = `${ym}-01`
  const last = `${ym}-${String(daysIn).padStart(2, '0')}`
  const dow0 = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5)) - 1, 1).getDay() // 1일의 요일

  const rows = projects
    .filter((pj) => !pj.archived && (pj.shootDate || pj.due))
    .map((pj) => {
      const a = pj.shootDate || pj.due, b = pj.due || pj.shootDate
      const start = a <= b ? a : b, end = a <= b ? b : a
      if (end < first || start > last) return null // 이번 달과 겹치지 않음
      const s = start < first ? 1 : Number(start.slice(8))
      const e = end > last ? daysIn : Number(end.slice(8))
      return {
        pj, s, e,
        clipL: start < first, clipR: end > last,
        color: gColor(pj.id), soft: gColorSoft(pj.id),
        tip: `${pj.name}${pj.client ? ` · ${pj.client}` : ''}\n촬영 ${pj.shootDate || '—'} → 납품 ${pj.due || '—'}`,
      }
    })
    .filter(Boolean)
    .sort((x, y) => x.s - y.s || x.e - y.e)

  // 프로젝트명이 일치하는 미완료 업무 → 해당 행에 ▪ 마커
  const taskMarks = {}
  tasks.filter((t) => !t.done && t.due && t.due >= first && t.due <= last && t.project).forEach((t) => {
    ;(taskMarks[t.project] = taskMarks[t.project] || []).push(t)
  })

  const isWe = (d) => { const w = (dow0 + d - 1) % 7; return w === 0 || w === 6 }
  const todayD = now.slice(0, 7) === ym ? Number(now.slice(8)) : 0
  const cols = { gridTemplateColumns: `repeat(${daysIn}, 1fr)` }

  return (
    <div className="card gantt-wrap">
      <div className="gantt">
        <div className="gantt-hrow">
          <div className="gantt-corner">프로젝트</div>
          <div className="gantt-days" style={cols}>
            {Array.from({ length: daysIn }, (_, i) => (
              <div key={i} className={'gantt-dnum num' + (isWe(i + 1) ? ' we' : '') + (i + 1 === todayD ? ' today' : '')}>{i + 1}</div>
            ))}
          </div>
        </div>

        {rows.length === 0 && (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>
            이번 달에 촬영일·납품일이 잡힌 프로젝트가 없습니다
          </div>
        )}

        {rows.map((r) => {
          const isOpen = expanded.has(r.pj.id)
          const pjTasks = isOpen
            ? tasks.filter((t) => t.project === r.pj.name)
                .sort((a, b) => (a.done - b.done) || String(a.due || '9999').localeCompare(String(b.due || '9999')))
            : []
          return (
            <div key={r.pj.id}>
              <div className="gantt-row">
                <button className="gantt-label" onClick={() => toggleExpand(r.pj.id)}
                  title={r.tip + '\n\n클릭하면 이 프로젝트의 업무 전체가 펼쳐집니다'}
                  style={{ width: '100%', background: isOpen ? 'var(--panel-2)' : 'transparent', border: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>
                  <span className="mut3" style={{ fontSize: 10, flex: 'none' }}>{isOpen ? '▾' : '▸'}</span>
                  <i style={{ background: r.color }} />
                  <span className="gantt-name">{r.pj.name}</span>
                </button>
                <div className="gantt-line" style={cols}>
                  {Array.from({ length: daysIn }, (_, i) => (
                    <span key={i} className={'gantt-cell' + (isWe(i + 1) ? ' we' : '') + (i + 1 === todayD ? ' today' : '')} style={{ gridColumn: i + 1 }} />
                  ))}
                  <span className="gantt-bar" title={r.tip} style={{
                    gridColumn: `${r.s} / ${r.e + 1}`,
                    background: r.soft, color: r.color, boxShadow: `inset 0 0 0 1.5px ${r.color}`,
                    borderTopLeftRadius: r.clipL ? 0 : undefined, borderBottomLeftRadius: r.clipL ? 0 : undefined,
                    borderTopRightRadius: r.clipR ? 0 : undefined, borderBottomRightRadius: r.clipR ? 0 : undefined,
                  }}>
                    {!r.clipL && r.pj.shootDate && <b className="gm">●</b>}
                    <span className="gantt-bartx">{r.pj.name}</span>
                    {!r.clipR && r.pj.due && <b className="gm" style={{ marginLeft: 'auto' }}>○</b>}
                  </span>
                  {(taskMarks[r.pj.name] || []).map((t, i) => (
                    <span key={i} className="gantt-task" title={`▪ ${t.title} · 마감 ${t.due}`} style={{ gridColumn: Number(t.due.slice(8)), color: r.color }}>▪</span>
                  ))}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '2px 16px 10px', background: 'var(--panel-2)', borderBottom: '1px solid var(--line-2)' }}>
                  <div className="mut3" style={{ fontSize: 11, padding: '8px 0 2px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 3, background: r.color }} />
                    <b>{r.pj.name}</b> 업무 {pjTasks.filter((t) => !t.done).length}건 미완료 · {pjTasks.filter((t) => t.done).length}건 완료
                  </div>
                  {pjTasks.length === 0 && (
                    <div style={{ padding: '10px 0', color: 'var(--ink-3)', fontSize: 12.5 }}>
                      연결된 업무가 없습니다 — 리스트 보기에서 업무를 추가할 때 이 프로젝트를 연결하세요
                    </div>
                  )}
                  {pjTasks.map((t) => <Row key={t.id} t={t} actor={actor} hideProject />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="notice" style={{ margin: 10 }}>
        <span>ℹ️</span>
        <span>막대는 <b>촬영일(●) → 납품 예정일(○)</b> 구간, 미완료 업무 마감일은 ▪ 로 표시됩니다. <b>왼쪽 프로젝트명을 클릭</b>하면 그 프로젝트의 업무 전체가 펼쳐져요.</span>
      </div>
    </div>
  )
}
