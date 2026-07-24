/* ============================================================
   촬영 문의함 — 외부 공개 폼(/inquiry)으로 접수된 문의 관리
   - 목록은 store가 아닌 on-demand 조회 (실시간 이벤트 오면 재조회)
   - 예산은 관리자에게만 표시 (직원은 RLS가 서버에서 차단)
   - 프로젝트로 전환 → 보드 '문의 접수' 단계 카드 자동 생성
============================================================ */
import { useEffect, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import {
  fetchInquiries, fetchInquiryBudget, setInquiryStatus,
  convertInquiry, destroyInquiry,
} from '../data.js'
import { Modal } from '../ui.jsx'
import { InquiryInfo, InquirySummary } from '../InquiryBits.jsx'
import InquiryEditor from './InquiryEditor.jsx'

const STATUS = [
  { id: 'new', label: '신규' },
  { id: 'replied', label: '답변 완료' },
  { id: 'converted', label: '전환됨' },
  { id: 'archived', label: '보관' },
]
const stLabel = (s) => STATUS.find((x) => x.id === s)?.label || s

export default function Inquiries({ go }) {
  const { user, isAdmin } = useAuth()
  const s = useStore()
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState('new')
  const [sel, setSel] = useState(null)
  const [editing, setEditing] = useState(false)

  async function load() { setRows(await fetchInquiries()) }
  useEffect(() => { load() }, [s.inquiryCount]) // 새 문의 실시간 이벤트 → 재조회

  const list = (rows || []).filter((r) => (filter === 'all' ? true : r.status === filter))
  const formUrl = window.location.origin + '/inquiry'

  if (editing) return <InquiryEditor actor={user.id} onClose={() => setEditing(false)} />

  return (
    <>
      <div className="ph">
        <h3>촬영 문의</h3>
        <span className="mut3" style={{ fontSize: 12 }}>공개 폼으로 접수된 외부 문의 · 예산은 관리자만 표시</span>
        <span className="sp" />
        {isAdmin && <button className="btn sm" onClick={() => setEditing(true)}>🎛 폼 콘텐츠 편집</button>}
        <button className="btn sm" onClick={() => { navigator.clipboard?.writeText(formUrl); alert('폼 주소를 복사했습니다!\n' + formUrl) }}>
          🔗 폼 주소 복사
        </button>
        <a className="btn sm" href="/inquiry" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>↗ 폼 열기</a>
      </div>

      <div className="who-row" style={{ maxWidth: 520 }}>
        {[...STATUS, { id: 'all', label: '전체' }].map((f) => (
          <button key={f.id} className={'who' + (filter === f.id ? ' on' : '')} onClick={() => setFilter(f.id)}>
            <b>{f.label}</b>
            <small>{(rows || []).filter((r) => (f.id === 'all' ? true : r.status === f.id)).length}건</small>
          </button>
        ))}
      </div>

      {rows === null && <div className="mut3" style={{ padding: 20 }}>불러오는 중…</div>}
      {rows !== null && list.length === 0 && (
        <div className="card gate">
          <div className="lk">✉</div>
          <h3>{filter === 'new' ? '신규 문의가 없습니다' : '해당 문의가 없습니다'}</h3>
          <p>카톡 채널 하단 메뉴에 폼 주소를 연결하면<br />고객 문의가 이곳으로 접수됩니다.</p>
        </div>
      )}

      <div className="grid">
        {list.map((r) => {
          const d = r.data || {}
          return (
            <button key={r.id} className="tile col6 inq-row" onClick={() => setSel(r)} style={{ textAlign: 'left', cursor: 'pointer' }}>
              <div className="tile-h" style={{ marginBottom: 8 }}>
                <span className={'pill ' + (r.status === 'new' ? 'solid' : r.status === 'converted' ? 'mid' : 'line')}>{stLabel(r.status)}</span>
                <b style={{ fontSize: 14 }}>{d.brand || '(브랜드 미상)'}</b>
                <span className="sp" />
                <span className="mut3 num" style={{ fontSize: 11 }}>{String(r.created_at).slice(0, 10)}</span>
              </div>
              <div className="mut" style={{ fontSize: 12.5 }}>
                {d.shootType || '-'}{d.items ? ` · ${d.items}` : ''}{(d.purposes || []).length ? ` · ${d.purposes.join(', ')}` : ''}
              </div>
              <div className="mut3" style={{ fontSize: 12, marginTop: 4 }}>
                {d.manager || '-'} · {d.contact || '-'}
                {d.shootDate ? ` · 촬영 희망 ${d.shootDate}` : ''}
                {d.planStatus ? ` · 📋 ${d.planStatus}` : ''}
                {(d.files || []).length ? ` · 📎${d.files.length}` : ''}
              </div>
            </button>
          )
        })}
      </div>

      {sel && (
        <Detail inq={sel} isAdmin={isAdmin} actor={user.id} go={go}
          onClose={() => setSel(null)}
          onChanged={() => { setSel(null); load() }} />
      )}
    </>
  )
}

function Detail({ inq, isAdmin, actor, go, onClose, onChanged }) {
  const d = inq.data || {}
  const [budget, setBudget] = useState(null)
  useEffect(() => { if (isAdmin) fetchInquiryBudget(inq.id).then(setBudget) }, [inq.id, isAdmin])

  return (
    <Modal title={`문의 — ${d.brand || ''}`} onClose={onClose}
      footer={
        <>
          {isAdmin && (
            <button className="btn sm" style={{ color: 'var(--ink-3)' }}
              onClick={async () => {
                if (!confirm('이 문의와 첨부파일을 완전히 파기할까요?\n(개인정보 보관 기간 만료 시 사용)')) return
                await destroyInquiry(inq, actor); onChanged()
              }}>파기</button>
          )}
          <span className="sp" style={{ flex: 1 }} />
          {inq.status === 'new' && (
            <button className="btn sm" onClick={async () => { await setInquiryStatus(inq.id, 'replied', actor); onChanged() }}>
              답변 완료로
            </button>
          )}
          {inq.status !== 'converted' && (
            <button className="btn primary sm" onClick={async () => {
              await convertInquiry(inq, actor); onChanged(); go && go('projects')
            }}>▤ 프로젝트로 전환</button>
          )}
          {inq.status !== 'archived' && inq.status !== 'new' && (
            <button className="btn sm" onClick={async () => { await setInquiryStatus(inq.id, 'archived', actor); onChanged() }}>보관</button>
          )}
        </>
      }>
      {/* 접수 메타 + 핵심 요약 칩 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className={'pill ' + (inq.status === 'new' ? 'solid' : inq.status === 'converted' ? 'mid' : 'line')}>{stLabel(inq.status)}</span>
        <span className="mut3 num" style={{ fontSize: 12 }}>{String(inq.created_at).slice(0, 16).replace('T', ' ')} 접수</span>
      </div>
      <InquirySummary d={d} />
      <InquiryInfo d={d} budget={isAdmin ? (budget || '확인 중…') : '🔒 관리자만 표시'} />
    </Modal>
  )
}
