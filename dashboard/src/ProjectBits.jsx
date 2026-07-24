import { useRef, useState } from 'react'
import { Modal, Avatar } from './ui.jsx'
import { useStore } from './useStore.js'
import { getStages, getConfig, getMember, updateItem, commentsFor, addComment, uploadFile, dday, getChecklist } from './data.js'
import { InquiryInfo, InquirySummary } from './InquiryBits.jsx'

/* ============================================================
   프로젝트 공용 조각 — 보드·프로젝트 DB·홈에서 함께 사용
   AttachmentEditor(첨부) · CustomFields(커스텀 필드) · ProjectDetail(상세 보기)
============================================================ */

/* ---- 첨부 (기획안 PDF·PPTX 파일 / 링크) ---- */
export function AttachmentEditor({ list, onChange }) {
  const fileRef = useRef(null)
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setErr('50MB 이하 파일만 올릴 수 있습니다.'); return }
    setBusy(true); setErr('')
    const r = await uploadFile(file)
    setBusy(false)
    if (r.error) { setErr('업로드 실패: ' + r.error); return }
    onChange([...list, { id: 'a' + Date.now().toString(36), type: 'file', name: r.name, url: r.url, size: r.size }])
  }
  function addLink() {
    let url = link.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    let name = url
    try { name = new URL(url).hostname.replace('www.', '') } catch (e) {}
    onChange([...list, { id: 'a' + Date.now().toString(36), type: 'link', name, url }])
    setLink('')
  }

  return (
    <div>
      <label className="fl">📎 기획안·첨부 <span className="mut3" style={{ fontWeight: 500 }}>(PDF · PPTX · 링크)</span></label>
      {list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
          {list.map((a) => (
            <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--panel-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '6px 10px' }}>
              <span style={{ fontSize: 13 }}>{a.type === 'link' ? '🔗' : /\.pdf$/i.test(a.name) ? '📄' : /\.(ppt|pptx|key)$/i.test(a.name) ? '📊' : '📁'}</span>
              <a href={a.url} target="_blank" rel="noreferrer"
                style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {a.name}
              </a>
              {a.size ? <span className="mut3 mono" style={{ fontSize: 10.5 }}>{Math.round(a.size / 1024 / 102.4) / 10}MB</span> : null}
              <button type="button" className="btn ghost sm" style={{ color: 'var(--ink-3)' }}
                onClick={() => onChange(list.filter((x) => x.id !== a.id))}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" className="btn sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? '올리는 중…' : '⬆ 파일 업로드'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" onChange={onFile} style={{ display: 'none' }} />
        <input value={link} placeholder="또는 링크 붙여넣기 (드라이브·노션·피그마)" onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
          style={{ flex: '1 1 200px', padding: '6px 10px', fontSize: 12.5 }} />
        <button type="button" className="btn sm" onClick={addLink}>＋</button>
      </div>
      {err && <div className="err" style={{ marginTop: 6 }}>{err}</div>}
    </div>
  )
}

/* ---- 커스텀 필드 렌더 (커스텀 페이지 > 프로젝트 폼에서 정의) ---- */
export function CustomFields({ values, onChange }) {
  const fields = getConfig().projectFields || []
  if (!fields.length) return null
  const set = (id, v) => onChange({ ...values, [id]: v })
  return (
    <div className="field-row" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: 10 }}>
      {fields.map((fd) => {
        const v = values[fd.id] ?? (fd.type === 'check' ? false : '')
        if (fd.type === 'check') {
          return (
            <label key={fd.id} className="bk" style={{ alignSelf: 'end' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={!!v} onChange={(e) => set(fd.id, e.target.checked)} /> {fd.label}
            </label>
          )
        }
        return (
          <div key={fd.id}>
            <label className="fl">{fd.label}</label>
            {fd.type === 'select' ? (
              <select value={v} onChange={(e) => set(fd.id, e.target.value)}>
                <option value="">—</option>
                {(fd.options || []).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={fd.type === 'date' ? 'date' : 'text'} value={v} onChange={(e) => set(fd.id, e.target.value)} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---- 외주 담당 선택 (헤메·스타일리스트·리터처 — 외주 관리 탭에서 등록한 인력 중 선택) ---- */
export const OUTSOURCE_ROLES = [
  { k: 'hmu', label: '헤어·메이크업 실장', match: ['헤어', '메이크업', '헤메'] },
  { k: 'stylist', label: '스타일리스트', match: ['스타일'] },
  { k: 'retouch', label: '리터처', match: ['리터'] },
]

export function OutsourceEditor({ value, onChange }) {
  const s = useStore()
  const vendors = s.vendors || []
  const val = value || {}
  return (
    <div>
      <label className="fl">🤝 외주 담당 <span className="mut3" style={{ fontWeight: 500 }}>(외주 관리 탭에서 등록한 인력)</span></label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {OUTSOURCE_ROLES.map((r) => {
          const mine = vendors.filter((v) => r.match.some((m) => (v.kind || '').includes(m)))
          const others = vendors.filter((v) => !mine.includes(v))
          const cur = val[r.k] || ''
          return (
            <div key={r.k}>
              <label className="fl" style={{ fontSize: 11 }}>{r.label}</label>
              <select value={cur} onChange={(e) => onChange({ ...val, [r.k]: e.target.value })}>
                <option value="">— 미지정</option>
                {cur && !vendors.some((v) => v.name === cur) && <option value={cur}>{cur}</option>}
                {mine.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                {others.length > 0 && (
                  <optgroup label="다른 구분">
                    {others.map((v) => <option key={v.id} value={v.name}>{v.name} ({v.kind})</option>)}
                  </optgroup>
                )}
              </select>
            </div>
          )
        })}
      </div>
      {!vendors.length && (
        <div className="mut3" style={{ fontSize: 11.5, marginTop: 4 }}>등록된 외주 인력이 없습니다 — 외주 관리 탭에서 먼저 추가하세요</div>
      )}
    </div>
  )
}

/* ---- 프로젝트 상세 보기 (읽기 중심 — 편집은 ✏ 버튼으로) ---- */
/* ---- 단계 체크리스트 — 체크 상태는 프로젝트에 저장 (checks: {'단계:번호': true}) ---- */
export function StageChecklist({ p }) {
  const items = getChecklist(p.stage)
  if (!items.length) return null
  const checks = p.checks || {}
  const doneN = items.filter((_, i) => checks[p.stage + ':' + i]).length
  return (
    <div className="chk-wrap">
      <div className="fl" style={{ marginBottom: 6 }}>
        ☑ 단계 체크리스트 <span className="mut3 num">{doneN}/{items.length}</span>
      </div>
      {items.map((label, i) => {
        const k = p.stage + ':' + i
        return (
          <label key={k} className={'chk-item' + (checks[k] ? ' on' : '')}>
            <input type="checkbox" checked={!!checks[k]}
              onChange={() => updateItem('projects', p.id, { checks: { ...checks, [k]: !checks[k] } })} />
            <span>{label}</span>
          </label>
        )
      })}
    </div>
  )
}

export function ProjectDetail({ p, user, onClose, onEdit, onArchive, onRestore }) {
  const [cmt, setCmt] = useState('')
  const stName = getStages().find((x) => x.id === p.stage)?.name || p.stage
  const thread = commentsFor(p.name)
  const fields = getConfig().projectFields || []
  const ddDue = p.due && !p.archived ? dday(p.due) : null
  const ddShoot = p.shootDate && !p.archived ? dday(p.shootDate) : null

  return (
    <Modal title={p.name} onClose={onClose}
      footer={
        <>
          {p.archived && onRestore && <button className="btn sm" onClick={onRestore} style={{ marginRight: 'auto' }}>↩ 보드로 복원</button>}
          {!p.archived && onArchive && <button className="btn sm" onClick={onArchive} style={{ marginRight: 'auto' }}>🗄 DB로 보관</button>}
          {onEdit && <button className="btn sm" onClick={onEdit}>✏ 편집</button>}
          <button className="btn primary sm" onClick={onClose}>닫기</button>
        </>
      }>
      {/* 핵심 정보 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['고객사', p.client || '—'], ['촬영 종류', p.kind],
          ['담당', getMember(p.owner)?.name || '—'],
          ['단계', p.archived ? `보관됨 (${p.archivedAt || ''})` : stName]].map(([k, v]) => (
          <div key={k}>
            <div className="mut3" style={{ fontSize: 11, fontWeight: 650 }}>{k}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
        <div>
          <div className="mut3" style={{ fontSize: 11, fontWeight: 650 }}>촬영일</div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
            {p.shootDate || '—'} {ddShoot && ddShoot.diff >= 0 && <span className={'dd ' + ddShoot.level}>{ddShoot.label}</span>}
          </div>
        </div>
        <div>
          <div className="mut3" style={{ fontSize: 11, fontWeight: 650 }}>납품 예정</div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
            {p.due || '—'} {ddDue && <span className={'dd ' + ddDue.level}>{ddDue.label}</span>}
          </div>
        </div>
        {OUTSOURCE_ROLES.map((r) => {
          const n = (p.outsource || {})[r.k]
          if (!n) return null
          return (
            <div key={r.k}>
              <div className="mut3" style={{ fontSize: 11, fontWeight: 650 }}>외주 · {r.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n}</div>
            </div>
          )
        })}
        {fields.map((fd) => {
          const v = (p.custom || {})[fd.id]
          return (
            <div key={fd.id}>
              <div className="mut3" style={{ fontSize: 11, fontWeight: 650 }}>{fd.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{fd.type === 'check' ? (v ? '✓' : '—') : (v || '—')}</div>
            </div>
          )
        })}
      </div>

      {/* 외부 문의에서 전환된 프로젝트 — 문의 원본을 섹션별로 정리해서 표시 */}
      {p.inquiry && (
        <div>
          <div className="fl" style={{ marginBottom: 6 }}>
            ✉ 문의 내용 <span className="mut3" style={{ fontWeight: 500 }}>({String(p.inquiry.at || '').slice(0, 10)} 접수)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InquirySummary d={p.inquiry} />
            <InquiryInfo d={p.inquiry} />
          </div>
        </div>
      )}

      {p.note && (
        <div>
          <div className="mut3" style={{ fontSize: 11, fontWeight: 650, marginBottom: 3 }}>메모</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--panel-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '8px 12px' }}>{p.note}</div>
        </div>
      )}

      {/* 첨부 — 상세에서 바로 추가·삭제 가능 */}
      <AttachmentEditor list={p.attachments || []} onChange={(v) => updateItem('projects', p.id, { attachments: v })} />

      {/* 백업 현황 — 클릭으로 바로 토글 */}
      <div style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
        <button type="button" className={'pill ' + (p.origBackup ? 'solid' : 'line')} style={{ cursor: 'pointer' }}
          onClick={() => updateItem('projects', p.id, { origBackup: !p.origBackup })}>⛨ 원본 {p.origBackup ? '완료' : '미완'}</button>
        <button type="button" className={'pill ' + (p.editBackup ? 'solid' : 'line')} style={{ cursor: 'pointer' }}
          onClick={() => updateItem('projects', p.id, { editBackup: !p.editBackup })}>⛨ 보정본 {p.editBackup ? '완료' : '미완'}</button>
      </div>

      {/* 단계 체크리스트 — 이 단계에서 놓치면 안 되는 것들, 클릭으로 바로 토글 */}
      {!p.archived && <StageChecklist p={p} />}

      {/* 댓글 */}
      <div className="cthread">
        <div className="fl" style={{ marginBottom: 8 }}>💬 댓글 {thread.length > 0 && <span className="mut3 num">{thread.length}</span>}</div>
        {thread.map((c) => (
          <div className="cmt" key={c.id}>
            <Avatar id={c.who} />
            <div className="cbody">
              <div className="cwho">{getMember(c.who)?.name || '?'} <small>{c.at}</small></div>
              <div className="ctext">{c.text}</div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: thread.length ? 10 : 0 }}>
          <input value={cmt} placeholder="댓글 입력 후 Enter — 담당자 알림함에 표시됩니다"
            onChange={(e) => setCmt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && cmt.trim()) { addComment(p.name, user.id, cmt.trim()); setCmt('') }
            }} />
          <button type="button" className="btn sm" onClick={() => { if (cmt.trim()) { addComment(p.name, user.id, cmt.trim()); setCmt('') } }}>등록</button>
        </div>
      </div>
    </Modal>
  )
}
