import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { getStages, getConfig, unarchiveProject, archiveProject, getMember } from '../data.js'
import { ProjectDetail } from '../ProjectBits.jsx'

/* ============================================================
   프로젝트 DB — 완료·보관된 촬영 건의 아카이브
   검색 · 종류/연도/상태 필터 · 첨부 바로 열기 · 보드로 복원
============================================================ */
export default function ProjectDB() {
  const { user } = useAuth()
  const s = useStore()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('전체')
  const [year, setYear] = useState('전체')
  const [scope, setScope] = useState('archived') // archived | active | all
  const [view, setView] = useState(null)

  const stName = (id) => getStages().find((x) => x.id === id)?.name || id
  const dateOf = (p) => p.archivedAt || p.shootDate || p.createdAt || ''

  const all = s.projects
  const archivedN = all.filter((p) => p.archived).length
  const years = [...new Set(all.map((p) => dateOf(p).slice(0, 4)).filter(Boolean))].sort().reverse()

  let list = all.filter((p) => (scope === 'all' ? true : scope === 'archived' ? p.archived : !p.archived))
  if (kind !== '전체') list = list.filter((p) => p.kind === kind)
  if (year !== '전체') list = list.filter((p) => dateOf(p).startsWith(year))
  if (q.trim()) {
    const k = q.trim().toLowerCase()
    list = list.filter((p) => (p.name + ' ' + p.client + ' ' + (p.note || '')).toLowerCase().includes(k))
  }
  list = [...list].sort((a, b) => dateOf(b).localeCompare(dateOf(a)))

  return (
    <>
      <div className="ph">
        <h3>프로젝트 DB</h3>
        <span className="mut3" style={{ fontSize: 12 }}>완료된 촬영 건이 쌓이는 곳 — 보드에서 🗄 보관하면 여기로 옵니다</span>
        <span className="sp" />
        <span className="mut3 num" style={{ fontSize: 12 }}>보관 {archivedN} · 전체 {all.length}</span>
      </div>

      {/* 필터 바 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <input value={q} placeholder="⌕ 프로젝트·고객사·메모 검색" onChange={(e) => setQ(e.target.value)}
          style={{ flex: '1 1 220px', maxWidth: 320, padding: '8px 12px', fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {[['archived', '보관됨'], ['active', '진행 중'], ['all', '전체']].map(([v, label]) => (
            <button key={v} className={'btn sm' + (scope === v ? ' primary' : '')} onClick={() => setScope(v)}>{label}</button>
          ))}
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: 120, padding: '7px 10px', fontSize: 13 }}>
          <option>전체</option>
          {getConfig().kinds.map((k) => <option key={k}>{k}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 100, padding: '7px 10px', fontSize: 13 }}>
          <option>전체</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🗄</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{scope === 'archived' ? '아직 보관된 프로젝트가 없습니다' : '조건에 맞는 프로젝트가 없습니다'}</div>
          <div className="mut" style={{ fontSize: 13 }}>프로젝트 보드에서 완료된 카드를 열고 <b>🗄 DB로 보관</b>을 누르면 여기에 쌓입니다.</div>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tb">
            <thead><tr><th>프로젝트</th><th>고객사</th><th>종류</th><th>담당</th><th>촬영일</th><th>납품</th><th>첨부</th><th>상태</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} onClick={() => setView(p)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td className="mut">{p.client}</td>
                  <td><span className="tag">{p.kind}</span></td>
                  <td className="mut" style={{ fontSize: 12.5 }}>{getMember(p.owner)?.name || '—'}</td>
                  <td className="mono mut" style={{ fontSize: 12 }}>{p.shootDate || '—'}</td>
                  <td className="mono mut" style={{ fontSize: 12 }}>{p.due || '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {(p.attachments || []).length === 0 ? <span className="mut3">—</span> : (
                      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(p.attachments || []).map((a) => (
                          <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="tag" title={a.name}
                            style={{ textDecoration: 'none' }}>
                            {a.type === 'link' ? '🔗' : /\.pdf$/i.test(a.name) ? '📄' : '📊'}
                          </a>
                        ))}
                      </span>
                    )}
                  </td>
                  <td>
                    {p.archived
                      ? <span className="pill line">보관 {p.archivedAt || ''}</span>
                      : <span className="pill solid">{stName(p.stage)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && <ProjectDetail p={s.projects.find((x) => x.id === view.id) || view} user={user}
        onClose={() => setView(null)}
        onRestore={() => { unarchiveProject(view.id, user.id); setView(null) }}
        onArchive={() => { archiveProject(view.id, user.id); setView(null) }} />}
    </>
  )
}
