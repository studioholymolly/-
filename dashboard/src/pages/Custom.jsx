import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { getConfig, updateConfig, getTemplate, getStages, notifySlack, buildICS, PRIORITIES, today, effectiveNav, navGroupNames, updateNav, updateNavItem, DEFAULT_GROUP_NAMES, homeLayout, setHomeLayout, activeMembers } from '../data.js'

/* ============================================================
   커스텀 — 모든 것을 사이트 안에서 편집
   목록(촬영종류·채널·외주구분) · 파이프라인 단계 · 표준 업무 템플릿
   홈 위젯 · 연동(슬랙·구글캘린더·메일) · 커스텀 모듈
============================================================ */

// 홈 위젯 정의 (사용자별 켜기/끄기 — 배치·크기·커스텀 위젯은 홈의 ⚙ 위젯 편집에서)
export const HOME_WIDGETS = [
  ['kpi-active', '진행 중 프로젝트'], ['kpi-shoot', '이번 달 촬영·납품'], ['kpi-money', '이번 달 매출 / 내 담당 업무'], ['kpi-backup', '백업 완료율'],
  ['todo', '내 투두리스트'], ['memo', '메모장'], ['feedback', '피드백 보드 (팀 공유)'], ['molly', '몰리 (대화 비서)'], ['pipeline', '파이프라인'], ['alerts', '지금 챙길 것'],
  ['week', '이번 주 (미니 달력)'], ['shoots', '이번 주 촬영 리스트'], ['content', '콘텐츠 발행'], ['activity', '최근 활동'], ['side', '매출 추이 / 이번 주 마감'],
]
const KPI_KEYS = ['kpi-active', 'kpi-shoot', 'kpi-money', 'kpi-backup']
// 클라우드 저장 (config.homeLayout[uid].hidden) — 어느 기기서든 내 설정 유지
// 예전 'kpi' 묶음으로 숨겨둔 경우도 분리된 4개 타일에 그대로 반영 (개별 설정이 있으면 그게 우선)
export function widgetPrefs(uid) {
  const hidden = homeLayout(uid).hidden || {}
  const isHidden = (k) => (k in hidden) ? hidden[k] === true : (KPI_KEYS.includes(k) && hidden.kpi === true)
  return Object.fromEntries(HOME_WIDGETS.map(([k]) => [k, !isHidden(k)]))
}
export function setWidgetPref(uid, key, on) {
  const l = homeLayout(uid)
  setHomeLayout(uid, { ...l, hidden: { ...(l.hidden || {}), [key]: !on } })
}

export default function Custom() {
  const { user, isAdmin } = useAuth()
  useStore()
  const cfg = getConfig()
  const [, force] = useState(0)
  const rerender = () => force((x) => x + 1)

  return (
    <>
      <div className="notice" style={{ marginBottom: 18 }}>
        <span>🎛</span>
        <span><b>이 페이지에서 대시보드의 모든 것을 커스텀합니다.</b> 선택지·파이프라인 단계·표준 업무·홈 위젯·연동·모듈 — 바꾸는 즉시 전체 화면에 반영됩니다.</span>
      </div>

      <div className="grid">
        {/* ---- 내 홈 위젯 ---- */}
        <div className="tile col6">
          <div className="tile-h"><span className="ic">◎</span><span className="t">내 홈 위젯</span>
            <span className="sp" /><span className="mut3" style={{ fontSize: 11 }}>{user.name}님 전용 — 위치·크기·메모/링크 위젯은 홈의 <b>⚙ 위젯 편집</b></span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {HOME_WIDGETS.map(([k, label]) => {
              const on = widgetPrefs(user.id)[k] !== false
              return (
                <label key={k} className="trow" style={{ cursor: 'pointer' }}>
                  <button className={'cbx' + (on ? ' done' : '')} onClick={(e) => { e.preventDefault(); setWidgetPref(user.id, k, !on); rerender() }}>{on ? '✓' : ''}</button>
                  <span className="tt" style={{ textDecoration: 'none' }}>{label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* ---- 연동 ---- */}
        <div className="tile col6">
          <div className="tile-h"><span className="ic">⇄</span><span className="t">연동</span></div>
          <Integrations isAdmin={isAdmin} cfg={cfg} rerender={rerender} />
        </div>

        {/* ---- 선택지 목록들 ---- */}
        {isAdmin ? (
          <>
            <NavEditor className="col12" rerender={rerender} />
            <ListEditor className="col3" title="촬영 종류" hint="프로젝트 폼의 선택지" items={cfg.kinds} onChange={(v) => { updateConfig({ kinds: v }); rerender() }} />
            <ListEditor className="col3" title="콘텐츠 채널" hint="콘텐츠 폼의 선택지" items={cfg.channels} onChange={(v) => { updateConfig({ channels: v }); rerender() }} />
            <ListEditor className="col3" title="외주 구분" hint="외주 폼의 선택지" items={cfg.vendorKinds} onChange={(v) => { updateConfig({ vendorKinds: v }); rerender() }} />
            <ListEditor className="col3" title="고객사 카테고리" hint="고객사 폼의 선택지" items={cfg.clientCategories} onChange={(v) => { updateConfig({ clientCategories: v }); rerender() }} />
            <FieldEditor className="col12" rerender={rerender} cfgKey="projectFields" idPrefix="pf" icon="▤" title="프로젝트 폼"
              hint="프로젝트 등록 폼에 나만의 항목 추가 — 기획안 첨부(PDF·PPTX·링크)는 기본 내장"
              example={<>아직 추가한 항목이 없습니다. 예: <b>촬영 장소</b>(텍스트), <b>결과물 컷수</b>(텍스트), <b>수정 횟수</b>(선택지: 1회,2회,무제한), <b>착수금 입금</b>(체크박스)</>}
              note="* 추가한 항목은 프로젝트 등록·편집 폼과 프로젝트 DB 상세에 바로 나타납니다. 항목을 삭제해도 이미 입력된 값은 데이터에 남습니다." />
            <FieldEditor className="col12" rerender={rerender} cfgKey="vendorFields" idPrefix="vf" icon="◇" title="외주 폼"
              hint="외주 추가·수정 폼에 나만의 항목 추가 — 주민등록번호(정산 3.3% 선택 시)는 기본 내장"
              example={<>아직 추가한 항목이 없습니다. 예: <b>포트폴리오 링크</b>(텍스트), <b>등급</b>(선택지: S,A,B), <b>첫 협업일</b>(날짜), <b>계약서 수령</b>(체크박스)</>}
              note="* 추가한 항목은 외주 관리의 추가·수정 폼(행 클릭)에 바로 나타납니다. 항목을 삭제해도 이미 입력된 값은 데이터에 남습니다." />
            <StageEditor className="col6" rerender={rerender} />
            <TemplateEditor className="col6" rerender={rerender} />
            <ModuleEditor className="col12" cfg={cfg} rerender={rerender} />
          </>
        ) : (
          <div className="tile col12">
            <div className="tile-h"><span className="ic">🔒</span><span className="t">전체 설정 (관리자 전용)</span></div>
            <p className="mut" style={{ fontSize: 13, margin: 0 }}>촬영 종류·파이프라인 단계·표준 업무 템플릿·모듈 등 팀 전체에 적용되는 설정은 관리자만 수정할 수 있습니다.</p>
          </div>
        )}
      </div>
    </>
  )
}

/* ---- 사이드바 메뉴 편집기 ---- */
function NavEditor({ className, rerender }) {
  const nav = effectiveNav()
  const groupNames = navGroupNames()

  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= nav.length) return
    const order = nav.map((n) => n.id); [order[i], order[j]] = [order[j], order[i]]
    updateNav({ order }); rerender()
  }
  function renameGroup(g, v) {
    const cur = (getConfig().nav || {}).groupNames || {}
    updateNav({ groupNames: { ...cur, [g]: v } }); rerender()
  }
  function reset() { updateNav({ items: {}, order: null, groupNames: {} }); rerender() }

  return (
    <div className={'tile ' + className}>
      <div className="tile-h"><span className="ic">☰</span><span className="t">사이드바 메뉴</span>
        <span className="sp" />
        <button className="btn ghost sm" onClick={reset}>기본값 복원</button>
      </div>

      {/* 그룹 이름 변경 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.keys(DEFAULT_GROUP_NAMES).map((g) => (
          <div key={g} style={{ flex: '1 1 150px' }}>
            <label className="fl">{DEFAULT_GROUP_NAMES[g]} 그룹 이름</label>
            <input value={groupNames[g]} onChange={(e) => renameGroup(g, e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
          </div>
        ))}
      </div>

      {/* 메뉴 항목: 아이콘·이름·숨김·순서 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {nav.map((n, i) => (
          <div key={n.id} style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: n.hidden && !n.locked ? 0.45 : 1 }}>
            <input value={n.ic} onChange={(e) => { updateNavItem(n.id, { ic: e.target.value.slice(0, 2) }); rerender() }}
              style={{ width: 44, padding: '6px 0', fontSize: 13, textAlign: 'center' }} title="아이콘 (문자·이모지)" />
            <input value={n.label} onChange={(e) => { updateNavItem(n.id, { label: e.target.value }); rerender() }}
              style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
            <span className="mut3" style={{ fontSize: 10.5, width: 74 }}>{groupNames[n.group]}</span>
            {n.adminOnly && <span className="pill line" style={{ fontSize: 9.5 }}>🔒 관리자</span>}
            <button className="btn ghost sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn ghost sm" onClick={() => move(i, 1)} disabled={i === nav.length - 1}>↓</button>
            <button className="btn ghost sm" disabled={n.locked}
              title={n.locked ? '홈과 커스텀은 숨길 수 없습니다' : n.hidden ? '다시 보이기' : '메뉴에서 숨기기'}
              onClick={() => { updateNavItem(n.id, { hidden: !n.hidden }); rerender() }}
              style={{ color: 'var(--ink-3)', width: 58 }}>
              {n.locked ? '고정' : n.hidden ? '숨김됨' : '숨기기'}
            </button>
          </div>
        ))}
      </div>
      <span className="mut3" style={{ fontSize: 11, marginTop: 10, display: 'block' }}>
        * 이름·아이콘을 바꿔도 <b>매출·정산과 팀 관리의 관리자 잠금은 유지</b>됩니다. 숨긴 메뉴는 여기서 다시 켤 수 있어요.
      </span>
    </div>
  )
}

/* ---- 단순 목록 편집기 (추가/이름변경/삭제) ---- */
function ListEditor({ className, title, hint, items, onChange }) {
  const [nw, setNw] = useState('')
  function rename(i, v) { const c = [...items]; c[i] = v; onChange(c) }
  function del(i) { onChange(items.filter((_, j) => j !== i)) }
  function add(e) { e.preventDefault(); if (nw.trim() && !items.includes(nw.trim())) { onChange([...items, nw.trim()]); setNw('') } }
  return (
    <div className={'tile ' + className}>
      <div className="tile-h"><span className="ic">≡</span><span className="t">{title}</span>
        <span className="sp" /><span className="mut3" style={{ fontSize: 11 }}>{hint}</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <input value={it} onChange={(e) => rename(i, e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
            <button className="btn ghost sm" disabled={items.length <= 1} onClick={() => del(i)} style={{ color: 'var(--ink-3)' }}>✕</button>
          </div>
        ))}
        <form onSubmit={add} style={{ display: 'flex', gap: 6 }}>
          <input value={nw} placeholder="새 항목 추가" onChange={(e) => setNw(e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
          <button className="btn sm" type="submit">＋</button>
        </form>
      </div>
    </div>
  )
}

/* ---- 폼 커스텀 필드 편집기 (프로젝트 폼 · 외주 폼 공용) ---- */
const FIELD_TYPES = [['text', '한 줄 텍스트'], ['select', '선택지'], ['date', '날짜'], ['check', '체크박스']]

function FieldEditor({ className, rerender, cfgKey, idPrefix, icon, title, hint, example, note }) {
  const fields = getConfig()[cfgKey] || []
  const [f, setF] = useState({ label: '', type: 'text', options: '' })

  function save(next) { updateConfig({ [cfgKey]: next }); rerender() }
  function edit(i, k, v) {
    const c = fields.map((x) => ({ ...x }))
    c[i][k] = k === 'options' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v
    save(c)
  }
  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const c = fields.map((x) => ({ ...x })); [c[i], c[j]] = [c[j], c[i]]; save(c)
  }
  function del(i) { save(fields.filter((_, j) => j !== i)) }
  function add(e) {
    e.preventDefault()
    if (!f.label.trim()) return
    save([...fields, {
      id: idPrefix + Date.now().toString(36),
      label: f.label.trim(),
      type: f.type,
      options: f.type === 'select' ? f.options.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }])
    setF({ label: '', type: 'text', options: '' })
  }

  return (
    <div className={'tile ' + className}>
      <div className="tile-h"><span className="ic">{icon}</span><span className="t">{title}</span>
        <span className="sp" /><span className="mut3" style={{ fontSize: 11 }}>{hint}</span></div>

      {fields.length === 0 && (
        <p className="mut" style={{ fontSize: 12.5, margin: '0 0 10px' }}>{example}</p>
      )}

      {fields.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {fields.map((fd, i) => (
            <div key={fd.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input value={fd.label} onChange={(e) => edit(i, 'label', e.target.value)} style={{ flex: '1 1 140px', padding: '6px 10px', fontSize: 13 }} />
              <select value={fd.type} onChange={(e) => edit(i, 'type', e.target.value)} style={{ width: 110, padding: '6px 6px', fontSize: 12 }}>
                {FIELD_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
              {fd.type === 'select' ? (
                <input value={(fd.options || []).join(', ')} placeholder="선택지 (쉼표로 구분)"
                  onChange={(e) => edit(i, 'options', e.target.value)} style={{ flex: '2 1 180px', padding: '6px 10px', fontSize: 12.5 }} />
              ) : <span style={{ flex: '2 1 180px' }} />}
              <button className="btn ghost sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="btn ghost sm" onClick={() => move(i, 1)} disabled={i === fields.length - 1}>↓</button>
              <button className="btn ghost sm" onClick={() => del(i)} style={{ color: 'var(--ink-3)' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input value={f.label} placeholder={cfgKey === 'vendorFields' ? '새 항목 이름 (예: 포트폴리오 링크)' : '새 항목 이름 (예: 촬영 장소)'} onChange={(e) => setF({ ...f, label: e.target.value })} style={{ flex: '1 1 160px', padding: '6px 10px', fontSize: 13 }} />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} style={{ width: 110, padding: '6px 6px', fontSize: 12 }}>
          {FIELD_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        {f.type === 'select' && (
          <input value={f.options} placeholder="선택지 (쉼표로 구분)" onChange={(e) => setF({ ...f, options: e.target.value })} style={{ flex: '1 1 160px', padding: '6px 10px', fontSize: 12.5 }} />
        )}
        <button className="btn primary sm" type="submit">＋ 항목 추가</button>
      </form>
      <span className="mut3" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>{note}</span>
    </div>
  )
}

/* ---- 파이프라인 단계 편집기 ---- */
function StageEditor({ className, rerender }) {
  const s = useStore()
  const stages = getStages()
  const [nw, setNw] = useState('')
  const usedBy = (id) => s.projects.filter((p) => p.stage === id).length

  function save(next) { updateConfig({ stages: next }); rerender() }
  function rename(i, v) { const c = stages.map((x) => ({ ...x })); c[i].name = v; save(c) }
  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= stages.length) return
    const c = stages.map((x) => ({ ...x })); [c[i], c[j]] = [c[j], c[i]]; save(c)
  }
  function del(i) { if (usedBy(stages[i].id) === 0 && stages.length > 2) save(stages.filter((_, j) => j !== i)) }
  function add(e) {
    e.preventDefault()
    if (!nw.trim()) return
    save([...stages, { id: 'st' + Date.now().toString(36), name: nw.trim() }])
    setNw('')
  }

  return (
    <div className={'tile ' + className}>
      <div className="tile-h"><span className="ic">▥</span><span className="t">파이프라인 단계</span>
        <span className="sp" /><span className="mut3" style={{ fontSize: 11 }}>칸반 열 — 순서·이름·추가·삭제</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stages.map((st, i) => {
          const n = usedBy(st.id)
          return (
            <div key={st.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="mono mut3" style={{ fontSize: 11, width: 16, textAlign: 'right' }}>{i + 1}</span>
              <input value={st.name} onChange={(e) => rename(i, e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
              <span className="mut3 mono" style={{ fontSize: 10.5, width: 34 }}>{n > 0 ? n + '건' : ''}</span>
              <button className="btn ghost sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="btn ghost sm" onClick={() => move(i, 1)} disabled={i === stages.length - 1}>↓</button>
              <button className="btn ghost sm" onClick={() => del(i)} disabled={n > 0 || stages.length <= 2}
                title={n > 0 ? '이 단계에 프로젝트가 있어 삭제할 수 없습니다' : '삭제'} style={{ color: 'var(--ink-3)' }}>✕</button>
            </div>
          )
        })}
        <form onSubmit={add} style={{ display: 'flex', gap: 6 }}>
          <input value={nw} placeholder="새 단계 추가 (예: 시안 컨펌)" onChange={(e) => setNw(e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
          <button className="btn sm" type="submit">＋</button>
        </form>
        <span className="mut3" style={{ fontSize: 11 }}>* 프로젝트가 들어있는 단계는 삭제할 수 없습니다. ‘납품 완료’ 단계는 콘텐츠 자동 생성 트리거로 쓰입니다.</span>
      </div>
    </div>
  )
}

/* ---- 표준 업무 템플릿 편집기 ---- */
function TemplateEditor({ className, rerender }) {
  const tpl = getTemplate()
  const [nw, setNw] = useState('')
  function save(next) { updateConfig({ template: next }); rerender() }
  function edit(i, k, v) { const c = tpl.map((x) => ({ ...x })); c[i][k] = k === 'off' ? Number(v || 0) : v; save(c) }
  function del(i) { save(tpl.filter((_, j) => j !== i)) }
  function add(e) { e.preventDefault(); if (nw.trim()) { save([...tpl, { title: nw.trim(), off: 0, pr: '보통' }]); setNw('') } }

  return (
    <div className={'tile ' + className}>
      <div className="tile-h"><span className="ic">📋</span><span className="t">표준 업무 템플릿</span>
        <span className="sp" /><span className="mut3" style={{ fontSize: 11 }}>새 프로젝트에 자동 생성 — 담당을 정해두면 각자에게 자동 배분</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {tpl.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input value={t.title} onChange={(e) => edit(i, 'title', e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 12.5 }} />
            <span className="mut3" style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>촬영일</span>
            <input type="number" value={t.off} onChange={(e) => edit(i, 'off', e.target.value)}
              style={{ width: 58, padding: '6px 6px', fontSize: 12.5, textAlign: 'center' }} title="촬영일 기준 일수 (음수=이전)" />
            <span className="mut3" style={{ fontSize: 10.5 }}>일</span>
            <select value={t.pr} onChange={(e) => edit(i, 'pr', e.target.value)} style={{ width: 70, padding: '6px 4px', fontSize: 12 }}>
              {PRIORITIES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <select value={t.who || ''} onChange={(e) => edit(i, 'who', e.target.value)}
              style={{ width: 108, padding: '6px 4px', fontSize: 12 }} title="이 업무를 항상 맡을 사람">
              <option value="">프로젝트 담당</option>
              {activeMembers().map((mb) => <option key={mb.id} value={mb.id}>{mb.role === 'admin' ? '👑 ' : ''}{mb.name}</option>)}
            </select>
            <button className="btn ghost sm" onClick={() => del(i)} style={{ color: 'var(--ink-3)' }}>✕</button>
          </div>
        ))}
      </div>
      <span className="mut3" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
        * 담당을 <b>프로젝트 담당</b>으로 두면 그 프로젝트의 담당자에게, 특정 팀원을 고르면 어떤 프로젝트든 <b>항상 그 사람에게</b> 생성됩니다.
      </span>
      <form onSubmit={add} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input value={nw} placeholder="새 표준 업무 추가" onChange={(e) => setNw(e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
        <button className="btn sm" type="submit">＋</button>
      </form>
    </div>
  )
}

/* ---- 연동 (슬랙 / 구글 캘린더 / 메일) ---- */
function Integrations({ isAdmin, cfg, rerender }) {
  const ig = cfg.integrations
  const [testMsg, setTestMsg] = useState('')

  function set(patch) { updateConfig({ integrations: { ...ig, ...patch } }); rerender() }
  function downloadICS() {
    const blob = new Blob([buildICS()], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `holymolly-calendar-${today()}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  function testSlack() {
    const ok = notifySlack('👋 홀리몰리 대시보드 연동 테스트입니다!')
    setTestMsg(ok ? '✓ 전송했습니다 — 슬랙 채널을 확인하세요.' : '✕ 올바른 Webhook URL을 먼저 입력하세요.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Slack */}
      <div>
        <label className="fl">슬랙 자동 알림 {!isAdmin && <span className="mut3">(설정은 관리자)</span>}</label>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input value={ig.slackWebhook} placeholder="https://hooks.slack.com/services/…"
              onChange={(e) => set({ slackWebhook: e.target.value.trim() })} style={{ flex: 1, fontSize: 12 }} />
            <button className="btn sm" onClick={testSlack}>테스트</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[['slackProject', '새 프로젝트'], ['slackTask', '새 업무'], ['slackDelivered', '납품 완료']].map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={ig[k]} disabled={!isAdmin}
                onChange={(e) => set({ [k]: e.target.checked })} /> {label}
            </label>
          ))}
        </div>
        {testMsg && <div className="mut3" style={{ fontSize: 11.5, marginTop: 6 }}>{testMsg}</div>}
        <div className="mut3" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
          슬랙 워크스페이스 → 앱 → <b>Incoming Webhooks</b> 추가 → 채널 선택 후 URL을 붙여넣으면
          프로젝트·업무 등록과 납품 완료가 자동으로 채널에 올라갑니다.
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line-2)' }} />

      {/* Google Calendar */}
      <div>
        <label className="fl">구글 캘린더</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn sm" onClick={downloadICS}>⬇ 캘린더 파일(.ics) 내보내기</button>
        </div>
        <div className="mut3" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
          구글 캘린더 → 설정 → <b>가져오기</b>에 이 파일을 올리면 촬영·납품·업무 일정이 들어갑니다.
          캘린더 페이지에서 일정마다 <b>‘구글 캘린더에 추가’</b> 버튼도 쓸 수 있어요.
          실시간 양방향 동기화는 Supabase 연결 단계에서 지원됩니다.
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line-2)' }} />

      {/* Molly AI — 선택 사항, 연결 없이도 전 기능 작동 */}
      <div>
        <label className="fl">(선택) 몰리 AI 연결 🐥 <span className="pill line" style={{ marginLeft: 4 }}>안 써도 됨</span></label>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input type="password" value={ig.aiKey} placeholder="비워두면 기본 몰리로 작동 (현재 설정)"
              onChange={(e) => set({ aiKey: e.target.value.trim() })} style={{ flex: 1, fontSize: 12 }} />
            <select value={ig.aiModel || 'claude-opus-4-8'} onChange={(e) => set({ aiModel: e.target.value })}
              style={{ width: 170, fontSize: 12 }} title="몰리가 쓰는 두뇌 모델">
              <option value="claude-haiku-4-5">Haiku 4.5 · 절약</option>
              <option value="claude-sonnet-5">Sonnet 5 · 균형</option>
              <option value="claude-opus-4-8">Opus 4.8 · 최고성능</option>
            </select>
          </div>
        )}
        <div className="mut3" style={{ fontSize: 11, lineHeight: 1.5 }}>
          {ig.aiKey
            ? <><b style={{ color: 'var(--ink)' }}>✓ AI 모드 켜짐</b> — 직원용 몰리에게는 금액 데이터가 전달되지 않습니다.</>
            : <>지금은 <b>API 연결 없이</b> 운영 중 — 몰리(오늘 할 일·백업·촬영 일정·프로젝트 현황 조회·농담)를 포함한 모든 기능이 정상 작동합니다. 나중에 원하면 여기에 키만 넣으면 몰리가 자유대화형으로 업그레이드돼요.</>}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line-2)' }} />

      {/* Mail */}
      <div>
        <label className="fl">메일 알림 <span className="pill line" style={{ marginLeft: 4 }}>Supabase 단계</span></label>
        <div className="mut3" style={{ fontSize: 11, lineHeight: 1.5 }}>
          "메일이 오면 대시보드에 알림"은 서버가 메일함을 감시해야 해서 브라우저만으로는 불가능합니다.
          Supabase 연결 시 Gmail 연동으로 함께 켜집니다. (준비된 로드맵에 포함)
        </div>
      </div>
    </div>
  )
}

/* ---- 커스텀 모듈 (외부 서비스 임베드) ---- */
function ModuleEditor({ className, cfg, rerender }) {
  const [f, setF] = useState({ name: '', url: '' })
  function add(e) {
    e.preventDefault()
    if (!f.name.trim() || !f.url.trim()) return
    let url = f.url.trim()
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    updateConfig({ modules: [...cfg.modules, { id: 'mod' + Date.now().toString(36), name: f.name.trim(), url }] })
    setF({ name: '', url: '' })
    rerender()
  }
  function del(id) { updateConfig({ modules: cfg.modules.filter((m) => m.id !== id) }); rerender() }

  return (
    <div className={'tile ' + className}>
      <div className="tile-h"><span className="ic">◫</span><span className="t">커스텀 모듈</span>
        <span className="sp" /><span className="mut3" style={{ fontSize: 11 }}>외부 서비스·직접 만든 툴을 사이드바에 붙이기</span></div>
      <p className="mut" style={{ fontSize: 12.5, margin: '0 0 12px', lineHeight: 1.6 }}>
        이름과 주소(URL)만 넣으면 사이드바 <b>‘모듈’</b> 그룹에 메뉴가 생기고, 대시보드 안에서 그 화면이 열립니다.
        노션 페이지, 구글 시트/캘린더, 피그마, 나중에 직접 만들 서비스 — 뭐든 붙일 수 있어요.
        (일부 사이트는 임베드를 막아둔 경우 ‘새 탭에서 열기’로 열립니다)
      </p>
      {cfg.modules.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {cfg.modules.map((m) => (
            <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--panel-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '8px 12px' }}>
              <b style={{ fontSize: 13 }}>{m.name}</b>
              <span className="mut3 mono" style={{ fontSize: 11, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.url}</span>
              <button className="btn ghost sm" onClick={() => del(m.id)} style={{ color: 'var(--ink-3)' }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={add} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={f.name} placeholder="모듈 이름 (예: 스튜디오 노션)" onChange={(e) => setF({ ...f, name: e.target.value })} style={{ flex: '1 1 160px' }} />
        <input value={f.url} placeholder="주소 (예: notion.so/…)" onChange={(e) => setF({ ...f, url: e.target.value })} style={{ flex: '2 1 240px' }} />
        <button className="btn primary sm" type="submit">＋ 모듈 추가</button>
      </form>
    </div>
  )
}
