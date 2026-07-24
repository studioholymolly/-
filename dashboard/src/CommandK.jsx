import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from './useStore.js'
import { addItem } from './data.js'

/* ⌘K / Ctrl+K 전역 검색 — 프로젝트·업무·고객사·외주·콘텐츠(·거래는 관리자만) */
export default function CommandK({ open, onClose, go, user, isAdmin }) {
  const s = useStore()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 30) }
  }, [open])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return []
    const hit = (str) => String(str || '').toLowerCase().includes(needle)
    const out = []
    s.projects.forEach((x) => { if (hit(x.name) || hit(x.client) || hit(x.note)) out.push({ page: x.archived ? 'projectdb' : 'projects', ic: x.archived ? '▣' : '▤', kind: x.archived ? '프로젝트 DB' : '프로젝트', label: x.name, sub: x.client }) })
    s.tasks.forEach((x) => { if (hit(x.title) || hit(x.project)) out.push({ page: 'tasks', ic: '✓', kind: '업무', label: x.title, sub: x.project || (x.done ? '완료' : '미완료') }) })
    s.clients.forEach((x) => { if (hit(x.name) || hit(x.contact)) out.push({ page: 'clients', ic: '◈', kind: '고객사', label: x.name, sub: x.contact }) })
    s.vendors.forEach((x) => { if (hit(x.name) || hit(x.kind)) out.push({ page: 'vendors', ic: '◇', kind: '외주', label: x.name, sub: x.kind }) })
    s.contents.forEach((x) => { if (hit(x.title) || hit(x.project)) out.push({ page: 'content', ic: '▷', kind: '콘텐츠', label: x.title, sub: x.channel }) })
    if (isAdmin) s.deals.forEach((x) => { if (hit(x.project) || hit(x.client)) out.push({ page: 'money', ic: '₩', kind: '거래', label: x.project, sub: x.status }) })
    return out.slice(0, 9)
  }, [q, s, isAdmin])

  // 마지막 줄: 검색어를 새 업무로 바로 추가
  const actions = q.trim() ? [{ action: 'newTask', ic: '＋', kind: '빠른 추가', label: `"${q.trim()}" 업무로 추가`, sub: '내 담당 · 보통' }] : []
  const rows = [...results, ...actions]

  useEffect(() => { setIdx((i) => Math.min(i, Math.max(rows.length - 1, 0))) }, [rows.length])

  function pick(row) {
    if (!row) return
    if (row.action === 'newTask') {
      addItem('tasks', { title: q.trim(), done: false, owner: user.id, due: '', priority: '보통', project: '', repeat: '' }, user.id)
      go('tasks')
    } else {
      go(row.page)
    }
    onClose()
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, rows.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); pick(rows[idx]) }
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null
  return (
    <div className="cmdk-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="전역 검색">
        <div className="cmdk-in">
          <span className="mut3">⌕</span>
          <input ref={inputRef} value={q} placeholder="프로젝트·업무·고객사·외주·콘텐츠 검색…"
            onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
          <span className="kbd">esc</span>
        </div>
        {rows.length > 0 && (
          <div className="cmdk-list">
            {rows.map((r, i) => (
              <button key={i} className={'cmdk-row' + (i === idx ? ' on' : '')}
                onMouseEnter={() => setIdx(i)} onClick={() => pick(r)}>
                <span className="ric">{r.ic}</span>
                <span className="rl">{r.label}<small>{r.sub}</small></span>
                <span className="rk">{r.kind}</span>
              </button>
            ))}
          </div>
        )}
        {q.trim() && rows.length === 0 && (
          <div className="cmdk-empty">검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  )
}
