import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { addItem, updateItem, removeItem, getConfig } from '../data.js'
import { Modal, Avatar, SuggestInput } from '../ui.jsx'

/* 공용 리스트 페이지 골격 — 고객사 / 외주 / 콘텐츠 (모두 협업 작성)
   행 클릭 → 수정 모달 · filterKey 지정 시 카테고리 필터 탭 표시 */
function ListPage({ title, hint, coll, columns, fields, defaults, render, filterKey, filterOptions }) {
  const { user } = useAuth()
  const s = useStore()
  const [add, setAdd] = useState(false)
  const [edit, setEdit] = useState(null)
  const [filter, setFilter] = useState('전체')
  const all = s[coll]
  const kinds = filterKey
    ? [...new Set([...(filterOptions || []), ...all.map((r) => r[filterKey]).filter(Boolean)])]
    : []
  const rows = filterKey && filter !== '전체' ? all.filter((r) => r[filterKey] === filter) : all

  return (
    <>
      <div className="ph">
        <h3>{title}</h3>
        <span className="mut3" style={{ fontSize: 12 }}>{hint}</span>
        <span className="sp" />
        <button className="btn primary sm" onClick={() => setAdd(true)}>＋ 추가</button>
      </div>

      {filterKey && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className={'btn sm' + (filter === '전체' ? ' primary' : '')} onClick={() => setFilter('전체')}>전체 {all.length}</button>
          {kinds.map((k) => (
            <button key={k} className={'btn sm' + (filter === k ? ' primary' : '')} onClick={() => setFilter(k)}>
              {k} {all.filter((r) => r[filterKey] === k).length}
            </button>
          ))}
        </div>
      )}

      <div className="tbl-wrap">
        <table className="tb">
          <thead><tr>{columns.map((c) => <th key={c.k} className={c.r ? 'r' : ''}>{c.label}</th>)}<th>작성</th><th /></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => setEdit(row)} style={{ cursor: 'pointer' }}>
                {columns.map((c) => <td key={c.k} className={c.r ? 'r' : ''}>{render ? render(c.k, row) : row[c.k]}</td>)}
                <td><Avatar id={row.createdBy} /></td>
                <td><button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); removeItem(coll, row.id) }} style={{ color: 'var(--ink-3)' }}>✕</button></td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={columns.length + 2} className="mut3" style={{ textAlign: 'center', padding: 24, fontSize: 12 }}>
                {filter !== '전체' ? `${filter} 항목이 없습니다` : '아직 항목이 없습니다 — 우측 상단 ＋ 추가'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {add && <ItemForm title={`${title} 추가`} saveLabel="추가" fields={fields} initial={defaults}
        onClose={() => setAdd(false)}
        onSave={(d) => { addItem(coll, d, user.id); setAdd(false) }} />}

      {edit && <ItemForm title={`${edit.name || edit.title || title} 수정`} saveLabel="저장" fields={fields}
        initial={Object.fromEntries(fields.map((fl) => [fl.k, edit[fl.k] ?? '']))}
        onClose={() => setEdit(null)}
        onSave={(d) => { updateItem(coll, edit.id, d); setEdit(null) }} />}
    </>
  )
}

export function ItemForm({ title, saveLabel, fields, initial, onClose, onSave }) {
  const [f, setF] = useState(initial)
  const set = (k, type) => (e) => setF({ ...f, [k]: type === 'check' ? e.target.checked : e.target.value })
  return (
    <Modal title={title} onClose={onClose}
      footer={<><button className="btn sm" onClick={onClose}>취소</button><button className="btn primary sm" onClick={() => onSave(f)}>{saveLabel}</button></>}>
      {fields.filter((fl) => !fl.show || fl.show(f)).map((fl) => {
        const v = f[fl.k] ?? (fl.type === 'check' ? false : '')
        if (fl.type === 'contacts') {
          const list = Array.isArray(v) && v.length ? v : [{ name: '', phone: '', email: '', kakao: '' }]
          const updC = (i, key) => (e) => setF({ ...f, [fl.k]: list.map((c, j) => (j === i ? { ...c, [key]: e.target.value } : c)) })
          return (
            <div key={fl.k}>
              <label className="fl">{fl.label}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map((c, i) => (
                  <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input value={c.name || ''} placeholder={`담당자 ${i + 1} 이름 (예: 김주연 과장님)`} onChange={updC(i, 'name')} />
                      {list.length > 1 && (
                        <button className="btn ghost sm" onClick={() => setF({ ...f, [fl.k]: list.filter((_, j) => j !== i) })}
                          style={{ color: 'var(--ink-3)', flexShrink: 0 }} title="이 담당자 삭제">✕</button>
                      )}
                    </div>
                    <div className="field-row">
                      <input value={c.phone || ''} placeholder="연락처" onChange={updC(i, 'phone')} />
                      <input value={c.email || ''} placeholder="이메일" onChange={updC(i, 'email')} />
                    </div>
                    <input value={c.kakao || ''} placeholder="카카오톡 ID" onChange={updC(i, 'kakao')} />
                  </div>
                ))}
                <button className="btn sm" style={{ alignSelf: 'flex-start' }}
                  onClick={() => setF({ ...f, [fl.k]: [...list, { name: '', phone: '', email: '', kakao: '' }] })}>
                  ＋ 담당자 추가
                </button>
              </div>
            </div>
          )
        }
        if (fl.type === 'check') {
          return (
            <label key={fl.k} className="fl" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={!!v} onChange={set(fl.k, 'check')} /> {fl.label}
            </label>
          )
        }
        const opts = fl.options ? (fl.options.includes(v) || !v ? fl.options : [v, ...fl.options]) : null
        return (
          <div key={fl.k}>
            <label className="fl">{fl.label}</label>
            {opts
              ? <select value={v} onChange={set(fl.k)}>{fl.optional && <option value="">—</option>}{opts.map((o) => <option key={o}>{o}</option>)}</select>
              : fl.suggest
                ? <SuggestInput value={v} placeholder={fl.ph || ''} onChange={set(fl.k)} options={fl.suggest} />
                : <input type={fl.type === 'date' ? 'date' : 'text'} value={v} placeholder={fl.ph || ''} onChange={set(fl.k)} />}
          </div>
        )
      })}
    </Modal>
  )
}

// 고객사 DB는 소통 타임라인이 붙으면서 전용 페이지로 분리 → pages/Clients.jsx

export function Vendors() {
  const cfg = getConfig()
  return <ListPage title="외주 관리" hint="스타일리스트 · 헤메 · 리터처 · 디자인 (단가는 관리자 정산에서) · 행을 누르면 수정"
    coll="vendors"
    filterKey="kind" filterOptions={cfg.vendorKinds}
    columns={[{ k: 'name', label: '이름' }, { k: 'kind', label: '구분' }, { k: 'settle', label: '정산 방식' }, { k: 'contact', label: '연락처' }, { k: 'account', label: '계좌번호' }]}
    render={(k, row) => k === 'settle' ? <span className="pill mid">{row.settle}</span> : row[k]}
    fields={[
      { k: 'name', label: '이름' },
      { k: 'kind', label: '구분', options: cfg.vendorKinds },
      { k: 'settle', label: '정산 방식', options: ['3.3%', '계산서'] },
      { k: 'rrn', label: '주민등록번호 (3.3% 원천징수 신고용)', ph: '000000-0000000', show: (f) => f.settle === '3.3%' },
      { k: 'contact', label: '연락처' },
      { k: 'account', label: '계좌번호', ph: '예: 카카오뱅크 3333-00-0000000' },
      ...(cfg.vendorFields || []).map((fd) => ({
        k: fd.id, label: fd.label, type: fd.type, optional: true,
        options: fd.type === 'select' ? (fd.options || []) : undefined,
      })),
    ]}
    defaults={{ name: '', kind: cfg.vendorKinds[0], settle: '3.3%', contact: '', account: '', rrn: '' }} />
}

export function Content() {
  const s = useStore()
  const projectNames = (s.projects || []).map((p) => p.name)
  return <ListPage title="콘텐츠" hint="납품 완료 건에서 릴스·스레드·핀터레스트·홈페이지 발행 · 행을 누르면 수정"
    coll="contents"
    columns={[{ k: 'title', label: '콘텐츠' }, { k: 'project', label: '소재 촬영 건' }, { k: 'channel', label: '채널' }, { k: 'status', label: '상태' }]}
    render={(k, row) => k === 'status'
      ? <span className={'pill ' + (row.status === '업로드' ? 'solid' : row.status === '미제작' ? 'line' : 'mid')}>{row.status}</span>
      : k === 'channel' ? <span className="tag mid">{row.channel}</span> : row[k]}
    fields={[{ k: 'title', label: '콘텐츠명' }, { k: 'project', label: '소재 촬영 건', suggest: projectNames, ph: '프로젝트 보드·DB에서 제안' }, { k: 'channel', label: '채널', options: getConfig().channels }, { k: 'status', label: '상태', options: ['미제작', '편집중', '업로드'] }]}
    defaults={{ title: '', project: '', channel: getConfig().channels[0], status: '미제작' }} />
}
