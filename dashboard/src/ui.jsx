import { useEffect, useRef } from 'react'
import { getMember, activeMembers } from './data.js'

/* 자동완성 입력 — 다른 탭(고객사 DB·프로젝트 등)의 데이터를 제안하되 직접 입력도 허용 */
let dlSeq = 0
export function SuggestInput({ value, onChange, options, placeholder, style, autoFocus }) {
  const idRef = useRef(null)
  if (!idRef.current) { dlSeq += 1; idRef.current = 'dl_' + dlSeq }
  return (
    <>
      <input list={idRef.current} value={value} placeholder={placeholder} onChange={onChange} style={style} autoFocus={autoFocus} />
      <datalist id={idRef.current}>
        {[...new Set(options)].filter(Boolean).map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  )
}

export function Avatar({ id, k }) {
  const u = getMember(id)
  const name = u ? u.name[0] : '?'
  return <span className={'tinyava' + (k || (u?.role === 'admin' ? ' k' : ''))} title={u?.name}>{name}</span>
}

/* 담당자 선택 — 멤버가 몇 명이든 동적으로 */
export function MemberSelect({ value, onChange, style, allowAll }) {
  return (
    <select value={value} onChange={onChange} style={style}>
      {allowAll && <option value="">전체 담당</option>}
      {activeMembers().map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
  )
}

export function Won({ v }) {
  return <span className="money">₩{(v || 0).toLocaleString('ko-KR')}</span>
}

/* 금액 입력 — 0이면 빈칸으로 두고, 입력하면 1,000,000처럼 원단위 콤마로 표시 */
export function MoneyInput({ value, onChange, placeholder = '0', style }) {
  return (
    <input
      type="text" inputMode="numeric" placeholder={placeholder} style={style}
      value={value ? Number(value).toLocaleString('ko-KR') : ''}
      onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
    />
  )
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  )
}
