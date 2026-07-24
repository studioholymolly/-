import { useRef, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { getStages, moneySummary, backupStats, monthShootStats, weekEvents, monthlyRevenue, dday, today, updateItem, addItem, toggleTask, addTemplateTasks, homeLayout, setHomeLayout, getMember, feedbackItems, addFeedback, toggleFeedback, replyFeedback, removeFeedback } from '../data.js'
import { Won, Avatar, Modal } from '../ui.jsx'
import { ProjectDetail } from '../ProjectBits.jsx'
import { ProjectForm } from './Projects.jsx'
import { buildReminders, ReminderList } from '../Reminders.jsx'
import Molly from '../Molly.jsx'

/* ============================================================
   홈 대시보드 — 위젯 시스템
   ⚙ 위젯 편집: 드래그로 위치 이동 · ⇔ 크기 · ✕ 숨기기 · ＋ 추가(내장/메모/링크/임베드)
   배치는 사용자별로 클라우드에 저장 — 어느 기기서든 내 배치 유지
============================================================ */

export default function Home({ go }) {
  const { user, isAdmin } = useAuth()
  const s = useStore()
  const m = isAdmin ? moneySummary() : null
  const [editMode, setEditMode] = useState(false)
  const [cwForm, setCwForm] = useState(null)  // 'new-note' | 'new-links' | 'new-embed' | 기존 위젯 객체
  const [view, setView] = useState(null)      // 촬영 리스트에서 클릭한 프로젝트 id
  const [editP, setEditP] = useState(null)
  const [todoTxt, setTodoTxt] = useState('')  // 투두 위젯 빠른 추가
  const [memoDraft, setMemoDraft] = useState(null) // 메모장 입력 중 값 (null=저장본 표시)
  const memoTimer = useRef(null)
  const [dragKey, setDragKey] = useState(null)     // 드래그 중인 위젯 key
  const [dragOrder, setDragOrder] = useState(null) // 드래그 중 임시 순서 (놓으면 저장)

  // ---- 전부 실데이터 계산 ----
  const live = s.projects.filter((p) => !p.archived)
  const active = live.filter((p) => p.stage !== 'delivered' && p.stage !== 'marketing').length
  const bk = backupStats()
  const ms = monthShootStats()
  const week = weekEvents()
  const weekShoots = week.reduce((a, d) => a + d.shoots.length, 0)
  const stageCounts = getStages().map((st) => ({ ...st, n: live.filter((p) => p.stage === st.id).length }))
  const bottleneck = [...stageCounts].filter((x) => x.id !== 'delivered' && x.id !== 'marketing').sort((a, b) => b.n - a.n)[0]
  const contentDone = s.contents.filter((c) => c.status === '업로드').length
  const contentPct = Math.round((contentDone / Math.max(s.contents.length, 1)) * 1000) / 10
  const noContent = live.filter((p) => (p.stage === 'delivered' || p.stage === 'marketing') && !s.contents.some((c) => c.project === p.name)).length
  const myOpen = s.tasks.filter((t) => t.owner === user.id && !t.done)
  const reminders = buildReminders(s, isAdmin)
  const rev = isAdmin ? monthlyRevenue(6) : []
  const maxRev = Math.max(...rev.map((r) => r.sum), 1)
  const upDD = ms.upcoming ? dday(ms.upcoming.shootDate) : null
  const dateLabel = today().replace(/-/g, '.').replace(/^(\d{4})\./, '$1년 ').replace(/(\d{2})\.(\d{2})$/, (x, mm, dd2) => `${Number(mm)}월 ${Number(dd2)}일`)
  const weekShootList = week.flatMap((d) => d.shoots.map((pj) => ({ date: d.date, dnum: d.dnum, isToday: d.isToday, pj })))
  const viewing = view ? s.projects.find((x) => x.id === view) : null

  // 투두 위젯: 내 미완료 업무 (마감 임박 → 우선순위 순)
  const PRO = { 높음: 0, 보통: 1, 낮음: 2 }
  const myTodo = s.tasks.filter((t) => !t.done && t.owner === user.id)
    .sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')) || (PRO[a.priority ?? '보통'] - PRO[b.priority ?? '보통']))
  function quickAddTodo(e) {
    e.preventDefault()
    if (!todoTxt.trim()) return
    addItem('tasks', { title: todoTxt.trim(), owner: user.id, priority: '보통', due: '', repeat: '', done: false, project: '' }, user.id)
    setTodoTxt('')
  }
  // 메모장: 입력 멈추면 0.7초 뒤 자동 저장 (사용자별)
  function onMemoChange(v) {
    setMemoDraft(v)
    clearTimeout(memoTimer.current)
    memoTimer.current = setTimeout(() => {
      setHomeLayout(user.id, { ...homeLayout(user.id), memo: v })
    }, 700)
  }

  // ---- 위젯 정의 ----
  // KPI 4종은 각각 독립 위젯 — 개별 이동·크기·숨기기 가능 (예전 'kpi' 묶음 배치는 아래서 자동 변환)
  const DEFS = [
    {
      key: 'kpi-active', label: '진행 중 프로젝트', col: 3,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">▤</span><span className="t">진행 중 프로젝트</span></div>
          <div className="kfig num">{active}<span className="u"> 건</span></div>
          <div className="ksub">{bottleneck && bottleneck.n > 0 ? <>몰린 곳: <b>{bottleneck.name}</b> {bottleneck.n}건</> : '병목 없음'}</div>
        </>
      ),
    },
    {
      key: 'kpi-shoot', label: '이번 달 촬영·납품', col: 3,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">▦</span><span className="t">이번 달 촬영·납품</span></div>
          <div className="kfig num">{ms.shoots}<span className="u"> 촬영</span> · {ms.dues}<span className="u"> 납품</span></div>
          <div className="ksub">{ms.upcoming ? <>임박: <b>{ms.upcoming.name}</b> {upDD && <span className={'dd ' + upDD.level}>{upDD.label}</span>}</> : '예정된 촬영 없음'}</div>
        </>
      ),
    },
    {
      key: 'kpi-money', label: isAdmin ? '이번 달 매출' : '내 담당 업무', col: 3,
      content: () => isAdmin ? (
        <>
          <div className="tile-h"><span className="ic">₩</span><span className="t">이번 달 매출</span><span className="sp" /><span className="owner-pill">🔒 관리자</span></div>
          <div className="kfig num" style={{ fontSize: 24 }}><Won v={rev[rev.length - 1]?.sum || 0} /></div>
          <div className="ksub">미수금 <Won v={m.receivable} /></div>
        </>
      ) : (
        <>
          <div className="tile-h"><span className="ic">✓</span><span className="t">내 담당 업무</span></div>
          <div className="kfig num">{myOpen.length}<span className="u"> 건</span></div>
          <div className="ksub">{myOpen.filter((t) => t.due && t.due <= today()).length}건 오늘 마감·지남</div>
        </>
      ),
    },
    {
      key: 'kpi-backup', label: '백업 완료율', col: 3,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">⛨</span><span className="t">백업 완료율</span></div>
          <div className="kfig num">{bk.pct}<span className="u"> %</span></div>
          <div className="ksub">{bk.missing.length > 0 ? <span className="trend dn">{bk.missing.length}건 누락</span> : <span className="trend up">누락 없음</span>}</div>
        </>
      ),
    },
    {
      key: 'pipeline', label: '파이프라인', col: 8,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">▥</span><span className="t">파이프라인</span><span className="sp" />
            <button className="btn ghost sm" onClick={() => go('projects')}>보드 열기 →</button></div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {stageCounts.map((st) => {
              const pjs = live.filter((p) => p.stage === st.id)
              return (
                <div key={st.id} style={{ flex: '1 0 96px', minWidth: 96 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--ink-2)' }}>{st.name}</span>
                    <b className="mono" style={{ fontSize: 15 }}>{st.n}</b>
                  </div>
                  <div style={{ height: 4, borderRadius: 3, background: st.n ? 'var(--ink)' : 'var(--g2)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                    {pjs.slice(0, 4).map((p) => (
                      <button key={p.id} className="tag mid" onClick={() => setView(p.id)} title={p.name}
                        style={{ cursor: 'pointer', width: '100%', boxSizing: 'border-box', padding: '5px 8px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.client || p.name}
                      </button>
                    ))}
                    {pjs.length > 4 && (
                      <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>+{pjs.length - 4}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ),
    },
    {
      key: 'alerts', label: '지금 할 일', col: 4,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">!</span><span className="t">지금 할 일</span>
            <span className="sp" />
            {reminders.length > 0 && <span className="mut3 num" style={{ fontSize: 11 }}>{reminders.length}건</span>}</div>
          <ReminderList items={reminders} go={go} />
        </>
      ),
    },
    {
      key: 'todo', label: '내 투두리스트', col: 4,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">✓</span><span className="t">내 투두리스트</span>
            <span className="sp" /><button className="btn ghost sm" onClick={() => go('tasks')}>업무 →</button></div>
          <form onSubmit={quickAddTodo} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input value={todoTxt} placeholder="＋ 할 일 입력 후 Enter" onChange={(e) => setTodoTxt(e.target.value)}
              style={{ flex: 1, padding: '7px 10px', fontSize: 12.5 }} />
          </form>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {myTodo.slice(0, 7).map((t) => {
              const dd = dday(t.due)
              return (
                <div key={t.id} className="trow" style={{ padding: '7px 0' }}>
                  <button className="cbx" onClick={() => toggleTask(t.id, user.id)} aria-label="완료" />
                  <span className="tt" style={{ fontSize: 12.5 }}>
                    {t.project && <span className="tag" style={{ marginRight: 6 }}>{t.project.slice(0, 10)}</span>}
                    {t.title}
                  </span>
                  {dd && <span className={'dd ' + dd.level}>{dd.label}</span>}
                </div>
              )
            })}
            {myTodo.length === 0 && (
              <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>내 할 일이 없습니다 ✓</div>
            )}
            {myTodo.length > 7 && (
              <button className="btn ghost sm" onClick={() => go('tasks')} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                전체 {myTodo.length}개 보기 →
              </button>
            )}
          </div>
        </>
      ),
    },
    {
      key: 'memo', label: '메모장', col: 4,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">✎</span><span className="t">메모장</span>
            <span className="sp" /><span className="mut3" style={{ fontSize: 10.5 }}>{memoDraft !== null && memoDraft !== (layout.memo || '') ? '저장 중…' : '✓ 자동 저장'}</span></div>
          <textarea rows={8} value={memoDraft ?? (layout.memo || '')} placeholder={'자유롭게 메모하세요 — 입력을 멈추면 자동 저장됩니다.\n(내 계정 전용 메모장)'}
            onChange={(e) => onMemoChange(e.target.value)}
            style={{ width: '100%', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.7, resize: 'vertical', background: 'var(--panel-2)' }} />
        </>
      ),
    },
    {
      key: 'feedback', label: '피드백 보드 (팀 공유)', col: 4,
      content: () => <FeedbackBoard user={user} isAdmin={isAdmin} />,
    },
    { key: 'molly', label: '몰리 (대화 비서)', col: 4, cls: 'molly-tile', content: () => <Molly user={user} isAdmin={isAdmin} /> },
    {
      key: 'week', label: '이번 주 (미니 달력)', col: 4,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">▦</span><span className="t">이번 주</span><span className="sp" />
            <button className="btn ghost sm" onClick={() => go('tasks')}>간트 →</button></div>
          <div className="cal">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => <div key={d} className="dw">{d}</div>)}
            {week.map((d) => (
              <div key={d.date} className={'cd' + (d.isToday ? ' tdy' : '')}>
                {d.dnum}
                {d.shoots.length > 0 && <span className="ev" />}
                {d.shoots.length === 0 && d.dues.length > 0 && <span className="ev o" />}
              </div>
            ))}
          </div>
          <div className="ksub" style={{ marginTop: 11 }}>
            {week.flatMap((d) => d.shoots.map((pj) => `${Number(d.date.slice(8))}일 ${pj.name.slice(0, 8)}`)).slice(0, 3).join(' · ') || '이번 주 촬영 없음'}
          </div>
        </>
      ),
    },
    {
      key: 'shoots', label: '이번 주 촬영 리스트', col: 4,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">📸</span><span className="t">이번 주 촬영</span>
            <span className="sp" /><span className="mut3 num" style={{ fontSize: 11 }}>{weekShootList.length}건</span></div>
          <div className="alist">
            {weekShootList.length === 0 && (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>이번 주 촬영이 없습니다</div>
            )}
            {weekShootList.map(({ date, dnum, isToday, pj }) => (
              <div key={pj.id + date} className={'arow' + (isToday ? ' hi' : '')} onClick={() => setView(pj.id)}
                style={{ cursor: 'pointer' }} title="클릭하면 상세 보기">
                {isToday
                  ? <span className="tag solid" style={{ flexShrink: 0 }}>오늘 촬영</span>
                  : <span className="tag" style={{ flexShrink: 0 }}>{['일', '월', '화', '수', '목', '금', '토'][new Date(date + 'T00:00:00').getDay()]} {dnum}일</span>}
                <span className="tx" style={{ fontWeight: 650, fontSize: 12.5 }}>
                  {pj.name}
                  <small>{pj.client} · 담당 {s.members.find((mm) => mm.id === pj.owner)?.name || '—'}{(pj.attachments || []).length > 0 ? ` · 📎 ${pj.attachments.length}` : ''}</small>
                </span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      key: 'content', label: '콘텐츠 발행', col: 4,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">▷</span><span className="t">콘텐츠 발행</span></div>
          <div className="kfig num">{Math.round(contentPct)}<span className="u"> %</span></div>
          <div className="ksub" style={{ marginTop: 10 }}>
            <span className="tag solid">업로드 {contentDone}</span>
            <span className="tag mid">편집중 {s.contents.filter((c) => c.status === '편집중').length}</span>
            <span className="tag">미제작 {s.contents.filter((c) => c.status === '미제작').length}</span>
          </div>
        </>
      ),
    },
    {
      key: 'activity', label: '최근 활동', col: 4,
      content: () => (
        <>
          <div className="tile-h"><span className="ic">↻</span><span className="t">최근 활동</span></div>
          <div className="alist">
            {(s.activity || []).slice(0, 5).map((a) => (
              <div className="arow" key={a.id}>
                <Avatar id={a.who} />
                <span className="tx" style={{ fontWeight: 550, fontSize: 12.5 }}>{a.text}<small>{a.at}</small></span>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      key: 'side', label: isAdmin ? '월별 매출 추이' : '이번 주 마감', col: 4,
      content: () => isAdmin ? (
        <>
          <div className="tile-h"><span className="ic">₩</span><span className="t">월별 매출 추이</span><span className="sp" /><span className="owner-pill">🔒 관리자</span></div>
          <div className="bars">
            {rev.map((r, i) => (
              <div key={r.ym} className={'b' + (i === rev.length - 1 ? ' hot' : '')}>
                <div className="col" style={{ height: Math.max(Math.round((r.sum / maxRev) * 100), 3) + '%' }} title={`₩${r.sum.toLocaleString()}`} />
                <small>{r.label}</small>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="tile-h"><span className="ic">◷</span><span className="t">이번 주 마감</span></div>
          <div className="alist">
            {s.tasks.filter((t) => !t.done && t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4).map((t) => (
              <div className="arow" key={t.id}><Avatar id={t.owner} /><span className="tx" style={{ fontWeight: 600, fontSize: 12.5 }}>{t.title}<small>{t.due}</small></span></div>
            ))}
          </div>
        </>
      ),
    },
  ]

  // ---- 배치 계산 (사용자별 저장값 적용) ----
  const layout = homeLayout(user.id)
  // 예전 'kpi' 묶음 위젯으로 저장된 배치 → 분리된 4개 타일로 자동 변환 (제자리 유지)
  const KPI_KEYS = ['kpi-active', 'kpi-shoot', 'kpi-money', 'kpi-backup']
  const hidden = { ...(layout.hidden || {}) }
  if (hidden.kpi) KPI_KEYS.forEach((k) => { if (!(k in hidden)) hidden[k] = true })
  const sizes = layout.sizes || {}
  const customWidgets = layout.custom || []
  const allDefs = [...DEFS, ...customWidgets.map((cw) => ({ key: 'cw:' + cw.id, label: cw.title || '커스텀 위젯', col: 4, custom: cw }))]
  const defKeys = allDefs.map((d) => d.key)
  const savedOrder = (layout.order || []).flatMap((k) => (k === 'kpi' ? KPI_KEYS : [k])).filter((k) => defKeys.includes(k))
  const order = [...savedOrder, ...defKeys.filter((k) => !savedOrder.includes(k))]
  const ordered = order.map((k) => allDefs.find((d) => d.key === k))
  const visible = ordered.filter((d) => !hidden[d.key])
  const hiddenList = ordered.filter((d) => hidden[d.key] && !d.custom)

  // 저장 직전에 최신 배치를 다시 읽음 — 메모 자동저장과 겹쳐도 서로 덮어쓰지 않게
  function saveLayout(patch) { setHomeLayout(user.id, { ...homeLayout(user.id), ...patch }) }
  // ---- 드래그로 위치 이동: 끌면서 실시간 미리보기, 놓는 순간 저장 ----
  function onDragStart(e, key) {
    setDragKey(key)
    setDragOrder(visible.map((d) => d.key))
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', key) // Firefox는 setData 없으면 드래그 자체가 안 됨
  }
  function onDragOver(e, key) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!dragKey || key === dragKey) return
    setDragOrder((prev) => {
      const cur = prev || visible.map((d) => d.key)
      const from = cur.indexOf(dragKey), to = cur.indexOf(key)
      if (from < 0 || to < 0 || from === to) return cur
      const next = [...cur]
      next.splice(from, 1)
      next.splice(to, 0, dragKey)
      return next
    })
  }
  function onDragEnd() {
    if (dragOrder) saveLayout({ order: [...dragOrder, ...ordered.filter((d) => hidden[d.key]).map((d) => d.key)] })
    setDragKey(null)
    setDragOrder(null)
  }
  function resize(key, cur) {
    const cyc = [3, 4, 6, 8, 12]
    const i = cyc.indexOf(cur)
    saveLayout({ sizes: { ...sizes, [key]: cyc[(i + 1) % cyc.length] } })
  }
  function hideW(key) { saveLayout({ hidden: { ...hidden, [key]: true } }) }
  function showW(key) { saveLayout({ hidden: { ...hidden, [key]: false } }) }
  function saveCustom(cw) {
    const exists = customWidgets.some((x) => x.id === cw.id)
    saveLayout({ custom: exists ? customWidgets.map((x) => (x.id === cw.id ? cw : x)) : [...customWidgets, cw] })
    setCwForm(null)
  }
  function delCustom(id) {
    saveLayout({ custom: customWidgets.filter((x) => x.id !== id), order: order.filter((k) => k !== 'cw:' + id) })
  }

  return (
    <>
      <div className="ph">
        <h3>안녕하세요, {user.name}님 👋</h3>
        <span className="mut3" style={{ fontSize: 12 }}>{dateLabel} · 이번 주 촬영 {weekShoots}건</span>
        <span className="sp" />
        <button className={'btn sm' + (editMode ? ' primary' : '')} onClick={() => setEditMode((v) => !v)}>
          {editMode ? '✓ 편집 완료' : '⚙ 위젯 편집'}
        </button>
      </div>

      {editMode && (
        <div className="notice" style={{ marginBottom: 14 }}>
          <span>⚙</span>
          <span><b>위젯 편집 모드</b> — 위젯을 <b>마우스로 잡아 끌어서</b> 원하는 자리에 놓으면 이동, <b>⇔</b>로 크기 조절(¼→⅓→½→⅔→가로 전체), <b>✕</b>로 숨기기.
            아래 <b>＋ 위젯 추가</b>에서 다시 켜거나 메모·링크·임베드 위젯을 만들 수 있어요. 배치는 <b>{user.name}님 전용</b>으로 저장됩니다.</span>
        </div>
      )}

      <div className="grid">
        {(dragOrder ? dragOrder.map((k) => visible.find((d) => d.key === k)).filter(Boolean) : visible).map((d) => {
          const col = sizes[d.key] || d.col
          return (
            <div key={d.key}
              className={(d.bare ? '' : 'tile ') + 'col' + col + (d.cls ? ' ' + d.cls : '')}
              draggable={editMode}
              onDragStart={editMode ? (e) => onDragStart(e, d.key) : undefined}
              onDragOver={editMode ? (e) => onDragOver(e, d.key) : undefined}
              onDrop={editMode ? (e) => e.preventDefault() : undefined}
              onDragEnd={editMode ? onDragEnd : undefined}
              style={{
                position: 'relative',
                cursor: editMode ? 'grab' : undefined,
                opacity: dragKey === d.key ? 0.35 : 1,
                outline: dragKey === d.key ? '2px dashed var(--ink)' : undefined,
                outlineOffset: 2,
                transition: 'opacity .15s',
              }}>
              {editMode && (
                <div style={{ position: 'absolute', top: -9, right: 10, zIndex: 6, display: 'flex', gap: 1, background: 'var(--ink)', borderRadius: 8, padding: '2px 5px', boxShadow: 'var(--sh)' }}>
                  <span title="잡아서 끌면 이동" style={{ color: '#fff', fontSize: 11, lineHeight: '21px', padding: '0 4px', cursor: 'grab', userSelect: 'none' }}>⠿</span>
                  <WBtn onClick={() => resize(d.key, col)} title="크기 조절">⇔</WBtn>
                  {d.custom && <WBtn onClick={() => setCwForm(d.custom)} title="내용 편집">✏</WBtn>}
                  {d.custom
                    ? <WBtn onClick={() => delCustom(d.custom.id)} title="위젯 삭제">🗑</WBtn>
                    : <WBtn onClick={() => hideW(d.key)} title="숨기기">✕</WBtn>}
                </div>
              )}
              {d.custom ? <CustomWidgetBody cw={d.custom} /> : d.content()}
            </div>
          )
        })}

        {editMode && (
          <div className="col12" style={{ border: '1.5px dashed var(--line)', borderRadius: 'var(--r)', padding: '14px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <b style={{ fontSize: 12.5 }}>＋ 위젯 추가</b>
            {hiddenList.map((d) => (
              <button key={d.key} className="btn sm" onClick={() => showW(d.key)}>＋ {d.label}</button>
            ))}
            {hiddenList.length > 0 && <span style={{ borderLeft: '1px solid var(--line-2)', height: 18 }} />}
            <button className="btn sm" onClick={() => setCwForm('new-note')}>✎ 메모 위젯</button>
            <button className="btn sm" onClick={() => setCwForm('new-links')}>🔗 링크 모음</button>
            <button className="btn sm" onClick={() => setCwForm('new-embed')}>◫ 외부 임베드</button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="notice" style={{ marginTop: 16 }}>
          <span>🔒</span>
          <span><b>직원 계정으로 로그인되어 있습니다.</b> 매출·정산·금액 관련 화면과 데이터는 관리자에게만 표시됩니다.</span>
        </div>
      )}

      {/* 커스텀 위젯 만들기/편집 */}
      {cwForm && <CwForm initial={cwForm} onClose={() => setCwForm(null)} onSave={saveCustom} />}

      {/* 촬영 리스트에서 클릭 → 상세 보기 → ✏ 편집 */}
      {viewing && (
        <ProjectDetail p={viewing} user={user}
          onClose={() => setView(null)}
          onEdit={() => { setEditP(viewing); setView(null) }} />
      )}
      {editP && (
        <ProjectForm project={editP} user={user}
          taskCount={s.tasks.filter((t) => t.project === editP.name).length}
          onClose={() => setEditP(null)}
          onSave={(data) => { updateItem('projects', editP.id, data); setEditP(null) }}
          onTemplate={(data) => { const n = addTemplateTasks({ ...editP, ...data }, user.id); setEditP(null); return n }} />
      )}
    </>
  )
}

/* ---- 피드백 보드 위젯 (팀 공유 — 체크·댓글 실시간 동기화) ---- */
function FeedbackBoard({ user, isAdmin }) {
  const [txt, setTxt] = useState('')
  const [replyFor, setReplyFor] = useState(null) // 댓글 입력창이 열린 피드백 id
  const [replyTxt, setReplyTxt] = useState('')
  const [showDone, setShowDone] = useState(false)
  const items = feedbackItems()
  const open = items.filter((f) => !f.done)
  const closed = items.filter((f) => f.done)

  function submit(e) {
    e.preventDefault()
    if (!txt.trim()) return
    addFeedback(user.id, txt.trim())
    setTxt('')
  }
  function sendReply(e, id) {
    e.preventDefault()
    if (!replyTxt.trim()) return
    replyFeedback(id, user.id, replyTxt.trim())
    setReplyTxt('')
    setReplyFor(null)
  }

  const row = (f) => {
    const replies = f.replies || []
    return (
      <div key={f.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line-2)' }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <button className={'cbx' + (f.done ? ' done' : '')} onClick={() => toggleFeedback(f.id, user.id)}
            title={f.done ? `확인: ${getMember(f.doneBy)?.name || ''} (${f.doneAt || ''}) — 누르면 해제` : '확인했으면 체크'}
            style={{ marginTop: 1 }}>{f.done ? '✓' : ''}</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.55, whiteSpace: 'pre-wrap', ...(f.done ? { color: 'var(--ink-3)', textDecoration: 'line-through' } : {}) }}>{f.text}</div>
            <div className="mut3" style={{ fontSize: 10.5, marginTop: 3, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Avatar id={f.who} /> {getMember(f.who)?.name || '?'} · {f.at}
              {f.done && f.doneBy && <span>· ✓ {getMember(f.doneBy)?.name} 확인</span>}
              <button className="btn ghost sm" style={{ padding: '0 6px', fontSize: 10.5 }}
                onClick={() => { setReplyFor(replyFor === f.id ? null : f.id); setReplyTxt('') }}>
                💬 댓글{replies.length > 0 ? ` ${replies.length}` : ' 달기'}
              </button>
              {(f.who === user.id || isAdmin) && (
                <button className="btn ghost sm" style={{ padding: '0 4px', fontSize: 10.5 }} title="피드백 삭제"
                  onClick={() => { if (confirm('이 피드백을 삭제할까요?')) removeFeedback(f.id) }}>🗑</button>
              )}
            </div>
            {replies.map((r) => (
              <div key={r.id} style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginTop: 5, paddingLeft: 7, borderLeft: '2px solid var(--line-2)' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}>{getMember(r.who)?.name || '?'}</span>
                <span style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', minWidth: 0 }}>{r.text}</span>
                <span className="mut3" style={{ fontSize: 10, flexShrink: 0 }}>{r.at}</span>
              </div>
            ))}
            {replyFor === f.id && (
              <form onSubmit={(e) => sendReply(e, f.id)} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input autoFocus value={replyTxt} placeholder="댓글 입력 후 Enter" onChange={(e) => setReplyTxt(e.target.value)}
                  style={{ flex: 1, padding: '6px 9px', fontSize: 12 }} />
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="tile-h"><span className="ic">📌</span><span className="t">피드백 보드</span>
        <span className="sp" />
        <span className="mut3" style={{ fontSize: 10.5 }}>팀 공유 · {open.length > 0 ? `미확인 ${open.length}건` : '모두 확인 ✓'}</span></div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <input value={txt} placeholder="＋ 피드백 입력 후 Enter — 팀원 모두에게 보여요" onChange={(e) => setTxt(e.target.value)}
          style={{ flex: 1, padding: '7px 10px', fontSize: 12.5 }} />
      </form>
      <div>
        {open.map(row)}
        {items.length === 0 && (
          <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>
            아직 피드백이 없습니다 — 첫 피드백을 남겨보세요 ✍
          </div>
        )}
        {closed.length > 0 && (
          <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => setShowDone((v) => !v)}>
            {showDone ? '▾ 확인 완료 접기' : `▸ 확인 완료 ${closed.length}건 보기`}
          </button>
        )}
        {showDone && closed.map(row)}
      </div>
    </>
  )
}

/* ---- 편집 모드 미니 버튼 ---- */
function WBtn({ children, onClick, disabled, title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ background: 'transparent', border: 'none', color: '#fff', width: 22, height: 21, fontSize: 11, lineHeight: 1, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, padding: 0 }}>
      {children}
    </button>
  )
}

/* ---- 커스텀 위젯 본문 (메모 / 링크 모음 / 외부 임베드) ---- */
function CustomWidgetBody({ cw }) {
  const d = cw.data || {}
  const icon = cw.type === 'note' ? '✎' : cw.type === 'links' ? '🔗' : '◫'
  const fallbackTitle = cw.type === 'note' ? '메모' : cw.type === 'links' ? '링크 모음' : '임베드'
  return (
    <>
      <div className="tile-h"><span className="ic">{icon}</span><span className="t">{cw.title || fallbackTitle}</span></div>
      {cw.type === 'note' && (
        d.text
          ? <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7 }}>{d.text}</div>
          : <span className="mut3" style={{ fontSize: 12 }}>편집 모드에서 ✏를 눌러 내용을 입력하세요</span>
      )}
      {cw.type === 'links' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(d.items || []).length === 0 && <span className="mut3" style={{ fontSize: 12 }}>편집 모드에서 ✏를 눌러 링크를 추가하세요</span>}
          {(d.items || []).map((it, i) => (
            <a key={i} href={it.url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', background: 'var(--panel-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '7px 10px', textDecoration: 'none' }}>
              🔗 <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span> ↗
            </a>
          ))}
        </div>
      )}
      {cw.type === 'embed' && (
        d.url
          ? <iframe src={d.url} title={cw.title || 'embed'} style={{ width: '100%', height: (d.height || 320) + 'px', border: '1px solid var(--line-2)', borderRadius: 8, background: '#fff' }} />
          : <span className="mut3" style={{ fontSize: 12 }}>편집 모드에서 ✏를 눌러 주소를 입력하세요</span>
      )}
    </>
  )
}

/* ---- 커스텀 위젯 만들기/편집 폼 ---- */
function CwForm({ initial, onClose, onSave }) {
  const isNew = typeof initial === 'string'
  const type = isNew ? initial.replace('new-', '') : initial.type
  const cw = isNew ? null : initial
  const d = cw?.data || {}
  const [f, setF] = useState({
    title: cw?.title || '',
    text: d.text || '',
    links: (d.items || []).map((it) => `${it.label} ${it.url}`).join('\n'),
    url: d.url || '',
    height: d.height || 320,
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const typeName = type === 'note' ? '✎ 메모' : type === 'links' ? '🔗 링크 모음' : '◫ 외부 임베드'

  function save() {
    let data
    if (type === 'note') data = { text: f.text }
    else if (type === 'links') {
      data = {
        items: f.links.split('\n').map((line) => {
          const t = line.trim()
          if (!t) return null
          const sp = t.lastIndexOf(' ')
          let label = t, url = t
          if (sp > 0) { label = t.slice(0, sp).trim(); url = t.slice(sp + 1).trim() }
          if (!/^https?:\/\//.test(url)) url = 'https://' + url
          return { label: label || url, url }
        }).filter(Boolean),
      }
    } else {
      let url = f.url.trim()
      if (url && !/^https?:\/\//.test(url)) url = 'https://' + url
      data = { url, height: Number(f.height) || 320 }
    }
    onSave({ id: cw?.id || 'cw' + Date.now().toString(36), type, title: f.title.trim(), data })
  }

  return (
    <Modal title={(isNew ? '새 위젯 — ' : '위젯 편집 — ') + typeName} onClose={onClose}
      footer={<><button className="btn sm" onClick={onClose}>취소</button>
        <button className="btn primary sm" onClick={save}>{isNew ? '추가' : '저장'}</button></>}>
      <div><label className="fl">위젯 이름</label>
        <input value={f.title} autoFocus placeholder={type === 'note' ? '예: 오늘의 공지' : type === 'links' ? '예: 자주 쓰는 링크' : '예: 스튜디오 노션'} onChange={set('title')} /></div>

      {type === 'note' && (
        <div><label className="fl">내용</label>
          <textarea rows={6} value={f.text} placeholder="팀에게 남길 메모, 체크리스트, 공지…" onChange={set('text')} /></div>
      )}
      {type === 'links' && (
        <div><label className="fl">링크 목록 <span className="mut3" style={{ fontWeight: 500 }}>(한 줄에 하나 — “이름 주소” 순서)</span></label>
          <textarea rows={6} value={f.links} placeholder={'구글 드라이브 drive.google.com/…\n촬영 견적표 docs.google.com/…\n인스타그램 instagram.com/studio'} onChange={set('links')} /></div>
      )}
      {type === 'embed' && (
        <>
          <div><label className="fl">주소 (URL)</label>
            <input value={f.url} placeholder="notion.so/… · docs.google.com/… · calendar.google.com/…" onChange={set('url')} /></div>
          <div style={{ maxWidth: 160 }}><label className="fl">높이 (px)</label>
            <input type="number" value={f.height} onChange={set('height')} /></div>
          <div className="mut3" style={{ fontSize: 11.5 }}>* 일부 사이트는 임베드를 막아둬서 화면이 비어 보일 수 있어요 — 그런 경우 ‘커스텀 모듈’(사이드바)을 쓰세요.</div>
        </>
      )}
    </Modal>
  )
}
