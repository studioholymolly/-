import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { getStages, getConfig, getTemplate, addItem, updateItem, removeItem, removeProject, moveProject, addTemplateTasks, archiveProject, dday, getMember, getChecklist, today } from '../data.js'
import { Modal, Avatar, MemberSelect, SuggestInput } from '../ui.jsx'
import { AttachmentEditor, CustomFields, ProjectDetail, OutsourceEditor } from '../ProjectBits.jsx'

export default function Projects() {
  const { user } = useAuth()
  const s = useStore()
  const [drag, setDrag] = useState(null)
  const [view, setView] = useState(null)   // 상세 보기 중 프로젝트 id
  const [edit, setEdit] = useState(null)   // 편집 중 프로젝트
  const [addTo, setAddTo] = useState(null) // 새 카드 추가할 단계

  function onDrop(stage) {
    if (drag) { moveProject(drag, stage, user.id); setDrag(null) }
  }

  // 프로젝트별 연결 업무 진행률
  function progress(name) {
    const linked = s.tasks.filter((t) => t.project === name)
    if (!linked.length) return null
    const doneN = linked.filter((t) => t.done).length
    return { done: doneN, total: linked.length, pct: Math.round((doneN / linked.length) * 100) }
  }

  // 항상 최신 데이터로 (실시간 반영)
  const viewing = view ? s.projects.find((x) => x.id === view) : null

  return (
    <>
      <div className="ph">
        <h3>프로젝트 파이프라인</h3>
        <span className="mut3" style={{ fontSize: 12 }}>카드 클릭 = 상세 보기 · 끌어서 단계 이동 · 완료 건은 상세에서 🗄 보관</span>
        <span className="sp" />
        <button className="btn primary sm" onClick={() => setAddTo(getStages()[0].id)}>＋ 새 프로젝트</button>
      </div>

      <div className="kb-scroll">
        <div className="kb">
          {getStages().map((st, sti) => {
            // 커스텀에서 단계가 삭제돼 소속 컬럼이 없어진 카드는 첫 컬럼에 표시 (안 보이는 카드 방지)
            const knownIds = getStages().map((x) => x.id)
            const cards = s.projects.filter((p) => !p.archived && (p.stage === st.id || (sti === 0 && !knownIds.includes(p.stage))))
            return (
              <div key={st.id} className="kcol"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(st.id)}>
                <div className="kcol-h">
                  <span className="stg" style={{ background: cards.length ? 'var(--ink)' : 'var(--g4)' }} />
                  <span className="nm">{st.name}</span>
                  <span className="ct">{cards.length}</span>
                </div>
                <div className="kcol-body">
                  {cards.map((p) => {
                    const pg = progress(p.name)
                    const dd = p.due && st.id !== 'delivered' && st.id !== 'marketing' ? dday(p.due) : null
                    const needBackup = ['retouch', 'revise', 'delivered', 'marketing'].includes(st.id) && (!p.origBackup || !p.editBackup)
                    const ckItems = getChecklist(st.id)
                    const ckDone = ckItems.filter((_, ci) => (p.checks || {})[st.id + ':' + ci]).length
                    const cmtN = s.comments ? s.comments.filter((c) => c.project === p.name).length : 0
                    const attN = (p.attachments || []).length
                    return (
                      <div key={p.id} className={'kcard' + (drag === p.id ? ' drag' : '')}
                        draggable
                        onDragStart={() => setDrag(p.id)}
                        onDragEnd={() => setDrag(null)}
                        onClick={() => setView(p.id)}>
                        <div className="kt">{p.name}</div>
                        <div className="kmeta">
                          <span className="tag mid">{p.client}</span>
                          <span className="tag">{p.kind}</span>
                          {dd && <span className={'dd ' + dd.level}>{dd.label}</span>}
                          {needBackup && <span className="tag solid" title="원본/보정본 백업 미완료">⛨ 백업!</span>}
                          {ckItems.length > 0 && (
                            <span className={'tag' + (ckDone === ckItems.length ? ' solid' : '')} title="단계 체크리스트 — 카드를 열어 체크">
                              ☑ {ckDone}/{ckItems.length}
                            </span>
                          )}
                          {cmtN > 0 && <span className="tag" title="댓글">💬 {cmtN}</span>}
                          {attN > 0 && <span className="tag" title="첨부">📎 {attN}</span>}
                          {p.tags?.map((t) => <span key={t} className="tag solid">{t}</span>)}
                        </div>
                        {pg && (
                          <div className="kprog">
                            <span className="kprog-track"><span className="kprog-fill" style={{ width: pg.pct + '%' }} /></span>
                            <span className="kprog-n num">{pg.done}/{pg.total}</span>
                          </div>
                        )}
                        <div className="kby">
                          <Avatar id={p.owner} /> 담당 {p.shootDate && <span>· 촬영 {p.shootDate}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button className="addc" onClick={() => setAddTo(st.id)}>＋ 카드 추가</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 상세 보기 — 카드 클릭 시 */}
      {viewing && (
        <ProjectDetail p={viewing} user={user}
          onClose={() => setView(null)}
          onEdit={() => { setEdit(viewing); setView(null) }}
          onArchive={() => { archiveProject(viewing.id, user.id); setView(null) }} />
      )}

      {addTo && <ProjectForm stage={addTo} taskCount={0} user={user} onClose={() => setAddTo(null)}
        onSave={(data, withTasks) => {
          addItem('projects', { ...data, stage: addTo, tags: [], createdAt: today(), stageAt: today() }, user.id)
          if (withTasks) addTemplateTasks({ ...data }, user.id)
          setAddTo(null)
        }} />}

      {edit && <ProjectForm project={edit} user={user}
        taskCount={s.tasks.filter((t) => t.project === edit.name).length}
        onClose={() => setEdit(null)}
        onSave={(data) => { updateItem('projects', edit.id, data); setEdit(null) }}
        onDelete={() => {
          const n = s.tasks.filter((t) => t.project === edit.name).length
          const msg = n
            ? `'${edit.name}' 프로젝트를 삭제할까요?\n연결된 업무 ${n}건도 함께 삭제됩니다.`
            : `'${edit.name}' 프로젝트를 삭제할까요?`
          if (!confirm(msg)) return
          removeProject(edit.id, user.id); setEdit(null)
        }}
        onTemplate={(data) => { const n = addTemplateTasks({ ...edit, ...data }, user.id); setEdit(null); return n }} />}
    </>
  )
}

/* ---- 프로젝트 등록·편집 폼 (홈에서도 재사용) ---- */
export function ProjectForm({ project, stage, taskCount, user, onClose, onSave, onDelete, onTemplate }) {
  const store = useStore()
  const [f, setF] = useState({
    name: project?.name || '', client: project?.client || '', kind: project?.kind || (getConfig().kinds[0] || '제품'),
    owner: project?.owner || user.id, shootDate: project?.shootDate || '', due: project?.due || '',
    note: project?.note || '',
    outsource: project?.outsource || {},
    origBackup: project?.origBackup || false, editBackup: project?.editBackup || false,
    attachments: project?.attachments || [],
    custom: project?.custom || {},
  })
  const [withTasks, setWithTasks] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const stName = getStages().find((x) => x.id === (project?.stage || stage))?.name

  return (
    <Modal title={project ? '프로젝트 편집' : '새 프로젝트'} onClose={onClose}
      footer={
        <>
          {onDelete && <button className="btn sm" onClick={onDelete} style={{ marginRight: 'auto' }}>삭제</button>}
          <button className="btn sm" onClick={onClose}>취소</button>
          <button className="btn primary sm" onClick={() => f.name && onSave(f, withTasks)}>{project ? '저장' : '추가'}</button>
        </>
      }>
      <div><label className="fl">프로젝트명 (촬영 건)</label><input value={f.name} autoFocus placeholder="예: 마뗑킴 SS 룩북" onChange={set('name')} /></div>
      <div className="field-row">
        <div><label className="fl">고객사</label>
          <SuggestInput value={f.client} placeholder="브랜드명 — 고객사 DB에서 제안" onChange={set('client')}
            options={(store.clients || []).map((c) => c.name)} /></div>
        <div><label className="fl">촬영 종류</label>
          <select value={f.kind} onChange={set('kind')}>
            {getConfig().kinds.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div><label className="fl">담당</label>
          <MemberSelect value={f.owner} onChange={set('owner')} />
        </div>
        <div><label className="fl">진행 단계</label><input value={stName} disabled /></div>
      </div>
      <div className="field-row">
        <div><label className="fl">촬영일</label><input type="date" value={f.shootDate} onChange={set('shootDate')} /></div>
        <div><label className="fl">납품 예정</label><input type="date" value={f.due} onChange={set('due')} /></div>
      </div>

      {/* 외주 담당 — 외주 관리 탭에서 등록한 인력 중 선택 (최대 3명) */}
      <OutsourceEditor value={f.outsource} onChange={(v) => setF({ ...f, outsource: v })} />

      {/* 커스텀 필드 — 커스텀 페이지 > 프로젝트 폼에서 항목 추가 */}
      <CustomFields values={f.custom} onChange={(v) => setF({ ...f, custom: v })} />

      <div><label className="fl">메모</label><textarea rows={2} value={f.note} placeholder="레퍼런스·외주·특이사항" onChange={set('note')} /></div>

      {/* 기획안 첨부 — PDF·PPTX·링크 */}
      <AttachmentEditor list={f.attachments} onChange={(v) => setF({ ...f, attachments: v })} />

      {/* 백업 체크 — 가장 사고 잦은 지점 */}
      <div className="bk-row">
        <label className="bk"><input type="checkbox" style={{ width: 'auto' }} checked={f.origBackup}
          onChange={(e) => setF({ ...f, origBackup: e.target.checked })} /> ⛨ 원본 백업 완료</label>
        <label className="bk"><input type="checkbox" style={{ width: 'auto' }} checked={f.editBackup}
          onChange={(e) => setF({ ...f, editBackup: e.target.checked })} /> ⛨ 보정본 백업 완료</label>
      </div>

      {/* 표준 업무 — 버튼을 눌러야만 추가 (자동 생성 없음) */}
      {!project ? (
        <div className="tmpl-opt" style={{ alignItems: 'center' }}>
          <button type="button" className={'btn sm' + (withTasks ? ' primary' : '')} onClick={() => setWithTasks(!withTasks)}>
            {withTasks ? `✓ 표준 업무 ${getTemplate().length}개 추가 예정` : `📋 표준 업무 ${getTemplate().length}개 추가`}
          </button>
          <span className="mut3" style={{ fontSize: 12 }}>
            {withTasks
              ? '저장 시 공정 체크리스트가 업무에 추가됩니다 · 다시 누르면 취소'
              : '누르지 않으면 업무는 추가되지 않습니다 (목록·담당은 커스텀에서 설정)'}
          </span>
        </div>
      ) : (
        <div className="tmpl-opt" style={{ alignItems: 'center' }}>
          <button type="button" className="btn sm" onClick={() => onTemplate && onTemplate(f)}>📋 표준 업무 {getTemplate().length}개 추가</button>
          <span className="mut3" style={{ fontSize: 12 }}>{taskCount > 0 ? `현재 연결된 업무 ${taskCount}개` : '이 프로젝트에 연결된 업무 없음'}</span>
        </div>
      )}

      <div className="notice"><span>ℹ️</span><span>댓글은 카드 <b>상세 보기</b>에서, 금액·정산은 <b>관리자 전용 ‘매출·정산’</b>에서 관리합니다.</span></div>
    </Modal>
  )
}
