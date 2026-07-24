import { useEffect, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { today, addDays, dday, getStages, getMember, fetchInquiries, fmtDate } from '../data.js'
import { Won, Avatar } from '../ui.jsx'
import { buildReminders, ReminderList } from '../Reminders.jsx'

/* ============================================================
   주간 리뷰 — 주 1회 30분, 이 한 화면으로 보고 미팅을 대체
   ① 이번 주 숫자  ② 지금 할 일  ③ 정체 프로젝트  ④ 다음 7일
============================================================ */

// 이번 주 월요일 (한국 업무 주 기준)
function weekStart(t = today()) {
  const d = new Date(t + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7 // 월=0 … 일=6
  d.setDate(d.getDate() - dow)
  return fmtDate(d)
}

export default function Review({ go }) {
  const s = useStore()
  const auth = useAuth() || {}
  const { user, isAdmin } = auth
  const [inqWeek, setInqWeek] = useState(null) // 이번 주 접수된 문의 수
  useEffect(() => {
    fetchInquiries().then((rows) => {
      const start = weekStart()
      setInqWeek(rows.filter((r) => (r.created_at || '').slice(0, 10) >= start).length)
    })
  }, [])
  return <ReviewBody s={s} isAdmin={isAdmin} user={user} inqWeek={inqWeek} go={go} />
}

// 본문 분리 — 데이터 주입이 가능해 로그인 없이도 검증 가능
export function ReviewBody({ s, isAdmin, user, inqWeek, go }) {
  const t = today()
  const start = weekStart(t)
  const end = addDays(start, 6)
  const live = (s.projects || []).filter((p) => !p.archived)

  // ① 이번 주 숫자
  const shootsWeek = live.filter((p) => p.shootDate && p.shootDate >= start && p.shootDate <= end)
  const duesWeek = live.filter((p) => p.due && p.due >= start && p.due <= end)
  const ym = t.slice(0, 7)
  const monthPaid = (s.deals || []).filter((d) => d.month === ym).reduce((a, d) => a + (d.deposit || 0), 0)
  const receivable = (s.deals || []).reduce((a, d) => a + (d.balance || 0), 0)
  const tasksDoneWeek = (s.tasks || []).filter((tk) => tk.done).length // 완료 누적 (완료일 기록이 없어 근사)

  // ② 지금 할 일
  const reminders = buildReminders(s, isAdmin)

  // ③ 정체 프로젝트 — 단계에 머문 지 오래된 것 (문의 2일+, 그 외 7일+)
  const stalled = live
    .filter((p) => p.stage !== 'delivered' && p.stage !== 'marketing')
    .map((p) => {
      const since = p.stageAt || p.createdAt
      if (!since) return null
      const days = Math.round((new Date(t + 'T00:00:00') - new Date(since + 'T00:00:00')) / 86400000)
      const limit = p.stage === 'inquiry' ? 2 : 7
      return days >= limit ? { p, days } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.days - a.days)

  // ④ 다음 7일 — 촬영·납품·업무 마감
  const in7 = addDays(t, 7)
  const upcoming = [
    ...live.filter((p) => p.shootDate && p.shootDate >= t && p.shootDate <= in7).map((p) => ({ date: p.shootDate, ic: '📸', label: `촬영 · ${p.name}`, owner: p.owner })),
    ...live.filter((p) => p.due && p.due >= t && p.due <= in7).map((p) => ({ date: p.due, ic: '📦', label: `납품 · ${p.name}`, owner: p.owner })),
    ...(s.tasks || []).filter((tk) => !tk.done && tk.due && tk.due >= t && tk.due <= in7).map((tk) => ({ date: tk.due, ic: '✓', label: tk.title, owner: tk.owner })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const stName = (id) => getStages().find((x) => x.id === id)?.name || id

  return (
    <>
      <div className="ph">
        <h3>주간 리뷰</h3>
        <span className="mut3" style={{ fontSize: 12 }}>{start.slice(5).replace('-', '/')} ~ {end.slice(5).replace('-', '/')} · 주 1회 30분, 이 화면이 보고 미팅을 대신합니다</span>
        <span className="sp" />
      </div>

      {/* ① 이번 주 숫자 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 14 }}>
        <div className="tile">
          <div className="tile-h"><span className="ic">✉</span><span className="t">이번 주 신규 문의</span></div>
          <div className="kfig num">{inqWeek == null ? '—' : inqWeek}<span className="u"> 건</span></div>
          <div className="ksub">{s.inquiryCount > 0 ? `${s.inquiryCount}건 답변 대기 중` : '대기 중인 문의 없음'}</div>
        </div>
        <div className="tile">
          <div className="tile-h"><span className="ic">📸</span><span className="t">이번 주 촬영 · 납품</span></div>
          <div className="kfig num">{shootsWeek.length}<span className="u"> 촬영</span> · {duesWeek.length}<span className="u"> 납품</span></div>
          <div className="ksub">{shootsWeek[0] ? shootsWeek[0].name + (shootsWeek.length > 1 ? ` 외 ${shootsWeek.length - 1}` : '') : '이번 주 촬영 없음'}</div>
        </div>
        {isAdmin ? (
          <>
            <div className="tile">
              <div className="tile-h"><span className="ic">₩</span><span className="t">이번 달 입금</span><span className="sp" /><span className="owner-pill">🔒</span></div>
              <div className="kfig num" style={{ fontSize: 24 }}><Won v={monthPaid} /></div>
            </div>
            <div className="tile">
              <div className="tile-h"><span className="ic">!</span><span className="t">미수금</span><span className="sp" /><span className="owner-pill">🔒</span></div>
              <div className="kfig num" style={{ fontSize: 24, color: receivable > 0 ? '#d33' : undefined }}><Won v={receivable} /></div>
            </div>
          </>
        ) : (
          <div className="tile">
            <div className="tile-h"><span className="ic">✓</span><span className="t">완료된 업무 (누적)</span></div>
            <div className="kfig num">{tasksDoneWeek}<span className="u"> 건</span></div>
          </div>
        )}
      </div>

      <div className="grid">
        {/* ② 지금 할 일 */}
        <div className="col6">
          <div className="tile">
            <div className="tile-h"><span className="ic">!</span><span className="t">지금 할 일</span><span className="sp" />
              {reminders.length > 0 && <span className="mut3 num" style={{ fontSize: 11 }}>{reminders.length}건</span>}</div>
            <ReminderList items={reminders} go={go} limit={0} />
          </div>

          {/* ③ 정체 프로젝트 */}
          <div className="tile" style={{ marginTop: 14 }}>
            <div className="tile-h"><span className="ic">⏸</span><span className="t">한 단계에 오래 머문 프로젝트</span><span className="sp" />
              {stalled.length > 0 && <span className="mut3 num" style={{ fontSize: 11 }}>{stalled.length}건</span>}</div>
            <div className="alist">
              {stalled.length === 0 && (
                <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>정체된 프로젝트가 없습니다 ✓</div>
              )}
              {stalled.map(({ p, days }) => (
                <div key={p.id} className="arow" onClick={() => go && go('projects')} style={{ cursor: 'pointer' }}>
                  <span className="stripe" style={{ background: days >= 14 ? '#d33' : 'var(--ink)' }} />
                  <span className="tx">{p.name}<small>{stName(p.stage)} 단계 · {days}일째 그대로</small></span>
                  <Avatar id={p.owner} />
                </div>
              ))}
            </div>
            {stalled.length > 0 && (
              <div className="mut3" style={{ fontSize: 11.5, marginTop: 8 }}>
                왜 막혔는지, 누가 풀 수 있는지만 이야기하세요 — 상태 보고는 화면이 이미 했습니다.
              </div>
            )}
          </div>
        </div>

        {/* ④ 다음 7일 */}
        <div className="col6">
          <div className="tile">
            <div className="tile-h"><span className="ic">▦</span><span className="t">다음 7일</span><span className="sp" />
              <button className="btn ghost sm" onClick={() => go && go('tasks')}>간트 →</button></div>
            <div className="alist">
              {upcoming.length === 0 && (
                <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>다음 7일 일정이 없습니다</div>
              )}
              {upcoming.slice(0, 12).map((ev, i) => {
                const dd = dday(ev.date)
                return (
                  <div key={i} className="arow">
                    <span className="tag" style={{ flexShrink: 0 }}>{ev.date.slice(5).replace('-', '/')}</span>
                    <span className="rem-ic">{ev.ic}</span>
                    <span className="tx" style={{ fontWeight: 600, fontSize: 12.5 }}>{ev.label}</span>
                    {dd && <span className={'dd ' + dd.level}>{dd.label}</span>}
                    <Avatar id={ev.owner} />
                  </div>
                )
              })}
              {upcoming.length > 12 && <div className="mut3" style={{ fontSize: 11.5, padding: '6px 0' }}>외 {upcoming.length - 12}건 — 달력에서 확인</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
