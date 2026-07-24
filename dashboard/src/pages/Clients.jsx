import { useMemo, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import {
  addItem, updateItem, removeItem, addCommLog, logsForClient,
  COMM_CHANNELS, today, getConfig,
} from '../data.js'
import { Modal, Avatar, SuggestInput } from '../ui.jsx'
import { ItemForm } from './Lists.jsx'
import { aiEnabled, aiComplete, aiErrorMessage } from '../mollyAI.js'

/* ============================================================
   고객사 DB + 업체별 소통 타임라인
   - 행 클릭 → 타임라인 패널 (기록·결정사항·관련 프로젝트)
   - 🐥 AI 붙여넣기: 카톡·메일 대화를 붙여넣으면 몰리가 기록으로 정리
   - 금액·견적이 언급된 기록은 [관리자만] 체크 → 직원에겐 서버가 안 내려줌
============================================================ */

const clientFields = () => [
  { k: 'name', label: '브랜드명', ph: '예: 마뗑킴' },
  { k: 'contacts', label: '담당자 (여러 명 등록 가능)', type: 'contacts' },
  { k: 'instagram', label: '인스타그램' },
  { k: 'category', label: '카테고리', options: getConfig().clientCategories, optional: true },
  { k: 'source', label: '유입 경로', options: ['인스타그램', '소개', '검색', '홈페이지', '기타'], optional: true },
  { k: 'bizno', label: '사업자번호' },
  { k: 'taxEmail', label: '세금계산서 이메일' },
  { k: 'kind', label: '구분', options: ['신규', '거래중', '기존'] },
  { k: 'note', label: '비고' },
]
const CLIENT_DEFAULTS = { name: '', contacts: [{ name: '', phone: '', email: '', kakao: '' }], instagram: '', category: '', source: '', bizno: '', taxEmail: '', kind: '신규', note: '', shoots: 0, lastAt: today() }

// 기존 데이터(담당자·연락처가 단일 필드)도 담당자 목록으로 읽음
function clientContacts(c) {
  const list = c.contacts?.length
    ? c.contacts
    : [{ name: c.contact || '', phone: c.phone || '', email: c.email || '', kakao: c.kakao || '' }]
  return list.filter((ct) => ct.name || ct.phone || ct.email || ct.kakao)
}

// 저장 전 정리: 빈 담당자 제거 + 검색·견적서·내보내기가 쓰는 평면 필드(contact/phone/email/kakao) 동기화
function normalizeClient(d) {
  const contacts = (d.contacts || [])
    .map((ct) => ({ name: (ct.name || '').trim(), phone: (ct.phone || '').trim(), email: (ct.email || '').trim(), kakao: (ct.kakao || '').trim() }))
    .filter((ct) => ct.name || ct.phone || ct.email || ct.kakao)
  return {
    ...d, contacts,
    contact: contacts.map((ct) => ct.name).filter(Boolean).join(', '),
    phone: contacts[0]?.phone || '', email: contacts[0]?.email || '', kakao: contacts[0]?.kakao || '',
  }
}

const CHANNEL_PILL = { 카톡채널: 'solid', 개인카톡: 'solid', 메일: 'mid', 전화: 'mid', 대면: 'mid', 홈페이지: 'line', 기타: 'line' }

export default function Clients() {
  const { user, isAdmin } = useAuth()
  const s = useStore()
  const [filter, setFilter] = useState('전체')
  const [add, setAdd] = useState(false)
  const [selId, setSelId] = useState(null) // 타임라인 패널 대상
  const [paste, setPaste] = useState(false)

  const all = s.clients
  const kinds = [...new Set(['신규', '거래중', '기존', ...all.map((r) => r.kind).filter(Boolean)])]
  const rows = filter !== '전체' ? all.filter((r) => r.kind === filter) : all
  const logCount = (name) => (s.commlogs || []).filter((l) => l.client === name).length
  const sel = all.find((c) => c.id === selId)

  return (
    <>
      <div className="ph">
        <h3>고객사 DB</h3>
        <span className="mut3" style={{ fontSize: 12 }}>브랜드 히스토리 · 소통 타임라인 · 행을 누르면 타임라인</span>
        <span className="sp" />
        <button className="btn sm" onClick={() => setPaste(true)}>🐥 대화 붙여넣기</button>
        <button className="btn primary sm" onClick={() => setAdd(true)}>＋ 추가</button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button className={'btn sm' + (filter === '전체' ? ' primary' : '')} onClick={() => setFilter('전체')}>전체 {all.length}</button>
        {kinds.map((k) => (
          <button key={k} className={'btn sm' + (filter === k ? ' primary' : '')} onClick={() => setFilter(k)}>
            {k} {all.filter((r) => r.kind === k).length}
          </button>
        ))}
      </div>

      <div className="tbl-wrap">
        <table className="tb">
          <thead><tr>
            <th>브랜드</th><th>담당자</th><th>연락처</th><th>구분</th>
            <th className="r">촬영수</th><th className="r">기록</th><th>최근 접점</th><th />
          </tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => setSelId(row.id)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 650 }}>{row.name}</td>
                <td>{clientContacts(row).map((c) => c.name).filter(Boolean).join(', ')}</td>
                <td>{row.phone || row.email || clientContacts(row)[0]?.phone || clientContacts(row)[0]?.email}</td>
                <td><span className={'pill ' + (row.kind === '신규' ? 'solid' : 'line')}>{row.kind}</span></td>
                <td className="r">{row.shoots}</td>
                <td className="r">{logCount(row.name) ? <span className="pill mid">🕐 {logCount(row.name)}</span> : <span className="mut3">—</span>}</td>
                <td>{row.lastAt}</td>
                <td><button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); removeItem('clients', row.id) }} style={{ color: 'var(--ink-3)' }}>✕</button></td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={8} className="mut3" style={{ textAlign: 'center', padding: 24, fontSize: 12 }}>
                {filter !== '전체' ? `${filter} 항목이 없습니다` : '아직 항목이 없습니다 — 우측 상단 ＋ 추가'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {add && <ItemForm title="고객사 추가" saveLabel="추가" fields={clientFields()} initial={CLIENT_DEFAULTS}
        onClose={() => setAdd(false)}
        onSave={(d) => { addItem('clients', normalizeClient(d), user.id); setAdd(false) }} />}

      {sel && <ClientPanel client={sel} user={user} isAdmin={isAdmin} store={s} onClose={() => setSelId(null)} />}

      {paste && <PasteModal user={user} isAdmin={isAdmin} clientNames={all.map((c) => c.name)} onClose={() => setPaste(false)} />}
    </>
  )
}

/* ---- 타임라인 패널: 고객사 정보 + 관련 프로젝트 + 소통 기록 ---- */
function ClientPanel({ client, user, isAdmin, store, onClose }) {
  const [editInfo, setEditInfo] = useState(false)
  const logs = logsForClient(client.name)
  const projects = (store.projects || []).filter((pj) => pj.client === client.name)
  const contacts = clientContacts(client)
  const fields = clientFields()

  return (
    <Modal wide title={`◈ ${client.name} — 소통 타임라인`} onClose={onClose}
      footer={<button className="btn sm" onClick={onClose}>닫기</button>}>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className={'pill ' + (client.kind === '신규' ? 'solid' : 'line')}>{client.kind}</span>
        {client.category && <span className="pill line">{client.category}</span>}
        {client.instagram && <span className="mut3" style={{ fontSize: 12.5 }}>@{client.instagram.replace(/^@/, '')}</span>}
        {!contacts.length && <span className="mut3" style={{ fontSize: 12.5 }}>연락처 정보 없음</span>}
        <span className="sp" />
        <button className="btn ghost sm" onClick={() => setEditInfo(true)}>✎ 정보 수정</button>
      </div>
      {contacts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: -4 }}>
          {contacts.map((c, i) => (
            <span key={i} className="mut3" style={{ fontSize: 12.5 }}>
              👤 {[c.name, c.phone, c.email, c.kakao && `카톡 ${c.kakao}`].filter(Boolean).join(' · ')}
            </span>
          ))}
        </div>
      )}
      {client.note && <div className="notice" style={{ marginTop: -4 }}>{client.note}</div>}

      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {projects.map((pj) => (
            <span key={pj.id} className="tag mid" title={pj.archived ? '보관됨' : ''}>
              📸 {pj.name}{pj.shootDate ? ` · ${pj.shootDate}` : ''}
            </span>
          ))}
        </div>
      )}

      <LogForm client={client.name} user={user} isAdmin={isAdmin} />

      <div className="tl">
        {logs.map((l) => <LogItem key={l.id} log={l} />)}
        {!logs.length && (
          <div className="mut3" style={{ textAlign: 'center', padding: 20, fontSize: 12.5 }}>
            아직 소통 기록이 없습니다 — 위에서 첫 기록을 남기거나, 목록의 「🐥 대화 붙여넣기」로 카톡 내용을 정리해보세요.
          </div>
        )}
      </div>

      {editInfo && <ItemForm title={`${client.name} 수정`} saveLabel="저장" fields={fields}
        initial={{
          ...Object.fromEntries(fields.map((fl) => [fl.k, client[fl.k] ?? ''])),
          contacts: contacts.length ? contacts.map((c) => ({ ...c })) : [{ name: '', phone: '', email: '', kakao: '' }],
        }}
        onClose={() => setEditInfo(false)}
        onSave={(d) => { updateItem('clients', client.id, normalizeClient(d)); setEditInfo(false) }} />}
    </Modal>
  )
}

function LogItem({ log }) {
  return (
    <div className="tl-item">
      <div className="tl-date">{log.date}</div>
      <div className="tl-body">
        <div className="tl-meta">
          <span className={'pill ' + (CHANNEL_PILL[log.channel] || 'line')}>{log.channel}</span>
          {log.adminOnly && <span className="tl-lock">🔒 관리자만</span>}
          <Avatar id={log.createdBy} />
          <span className="sp" />
          <button className="btn ghost sm" onClick={() => removeItem('commlogs', log.id)} style={{ color: 'var(--ink-3)' }}>✕</button>
        </div>
        <div className="tl-sum">{log.summary}</div>
        {log.decisions && <div className="tl-dec">📌 <b>결정</b> — {log.decisions}</div>}
        {log.link && <div style={{ marginTop: 4 }}><a href={log.link} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>🔗 관련 링크</a></div>}
      </div>
    </div>
  )
}

/* ---- 기록 추가 폼 (패널 안에서 바로) ---- */
function LogForm({ client, user, isAdmin }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ date: today(), channel: COMM_CHANNELS[0], summary: '', decisions: '', link: '', adminOnly: false })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  if (!open) return <button className="btn sm" onClick={() => setOpen(true)} style={{ alignSelf: 'flex-start' }}>＋ 소통 기록 추가</button>

  const save = () => {
    if (!f.summary.trim()) return
    addCommLog({ client, date: f.date, channel: f.channel, summary: f.summary.trim(), decisions: f.decisions.trim(), link: f.link.trim(), ...(f.adminOnly ? { adminOnly: true } : {}) }, user.id)
    setF({ date: today(), channel: f.channel, summary: '', decisions: '', link: '', adminOnly: false })
    setOpen(false)
  }

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="field-row">
        <div><label className="fl">날짜</label><input type="date" value={f.date} onChange={set('date')} /></div>
        <div><label className="fl">채널</label>
          <select value={f.channel} onChange={set('channel')}>{COMM_CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
      </div>
      <div><label className="fl">오간 내용</label>
        <textarea rows={3} value={f.summary} onChange={set('summary')} placeholder="예: 룩북 컷수 20컷으로 조정 요청, 모델 컨펌은 금요일까지 주기로" style={{ width: '100%', resize: 'vertical' }} />
      </div>
      <div className="field-row">
        <div><label className="fl">결정된 사항 (선택)</label><input value={f.decisions} onChange={set('decisions')} placeholder="예: 20컷 확정 · 금요일 모델 컨펌" /></div>
        <div><label className="fl">링크 (선택)</label><input value={f.link} onChange={set('link')} placeholder="https://" /></div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isAdmin && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={f.adminOnly} onChange={set('adminOnly')} />
            🔒 관리자만 (금액·견적 언급)
          </label>
        )}
        <span className="sp" />
        <button className="btn sm" onClick={() => setOpen(false)}>취소</button>
        <button className="btn primary sm" onClick={save} disabled={!f.summary.trim()}>기록 저장</button>
      </div>
    </div>
  )
}

/* ============================================================
   🐥 대화 붙여넣기 — 카톡·메일 원문을 몰리가 기록으로 정리
   1) 붙여넣기 → 2) AI 정리 → 3) 확인·수정 → 4) 일괄 저장
============================================================ */
function parseSystemPrompt(clientNames, isAdmin) {
  return [
    `너는 촬영 스튜디오 '홀리몰리'의 소통 기록 정리 도우미야.`,
    `사용자가 붙여넣은 카톡/메일/문자 대화 원문을 읽고, 업체별 소통 기록 항목으로 정리해.`,
    `오늘 날짜: ${today()}`,
    `등록된 고객사: ${clientNames.join(', ') || '(없음)'}`,
    ``,
    `규칙:`,
    `- 반드시 아래 형식의 JSON만 출력해. 다른 텍스트·마크다운·코드펜스 금지.`,
    `- {"entries":[{"client":"브랜드명","date":"YYYY-MM-DD","channel":"카톡채널|개인카톡|메일|전화|대면|홈페이지|기타","summary":"오간 내용 요약 (1~3문장)","decisions":"결정된 사항, 없으면 빈 문자열","adminOnly":false}]}`,
    `- client: 등록된 고객사 이름과 일치하면 그 이름 그대로, 새 업체면 대화에서 파악한 브랜드명.`,
    `- date: 대화에서 파악되면 그 날짜, 모르면 오늘.`,
    `- 주제·날짜가 다른 대화가 섞여 있으면 항목을 나눠도 돼 (보통 1~3개).`,
    `- summary는 사실만 간결하게. 담당자 이름·기한·요청사항을 놓치지 마.`,
    isAdmin
      ? `- 금액·견적·할인·정산이 언급된 항목은 adminOnly를 true로 표시해.`
      : `- adminOnly는 항상 false.`,
  ].join('\n')
}

function PasteModal({ user, isAdmin, clientNames, onClose }) {
  const [text, setText] = useState('')
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [entries, setEntries] = useState(null) // 파싱 결과 (수정 가능)
  const canAI = useMemo(() => aiEnabled(), [])

  const parse = async () => {
    setBusy(true); setErr('')
    try {
      const content = (hint ? `[업체 힌트: ${hint}]\n` : '') + text
      const out = await aiComplete({ system: parseSystemPrompt(clientNames, isAdmin), content, maxTokens: 2000 })
      const m = out.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(m ? m[0] : out)
      const list = (parsed.entries || []).map((e, i) => ({
        _i: i, include: true,
        client: e.client || hint || '',
        date: /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') ? e.date : today(),
        channel: COMM_CHANNELS.includes(e.channel) ? e.channel : '기타',
        summary: e.summary || '',
        decisions: e.decisions || '',
        adminOnly: isAdmin && !!e.adminOnly,
      })).filter((e) => e.summary)
      if (!list.length) throw new Error('정리할 내용을 찾지 못했어요')
      setEntries(list)
    } catch (e) {
      setErr(e instanceof SyntaxError ? '몰리가 형식을 잘못 뱉었어요 🥲 한 번만 다시 눌러주세요!' : (e?.status ? aiErrorMessage(e) : (e.message || '정리에 실패했어요')))
    } finally { setBusy(false) }
  }

  const saveAll = () => {
    const picked = entries.filter((e) => e.include && e.client && e.summary)
    picked.forEach((e) => addCommLog({
      client: e.client.trim(), date: e.date, channel: e.channel,
      summary: e.summary.trim(), decisions: e.decisions.trim(),
      ...(e.adminOnly ? { adminOnly: true } : {}),
    }, user.id))
    onClose()
  }

  const upd = (i, patch) => setEntries(entries.map((e) => (e._i === i ? { ...e, ...patch } : e)))

  return (
    <Modal wide title="🐥 대화 붙여넣기 → 소통 기록" onClose={onClose}
      footer={entries
        ? <>
            <button className="btn sm" onClick={() => setEntries(null)}>← 다시 붙여넣기</button>
            <button className="btn primary sm" onClick={saveAll} disabled={!entries.some((e) => e.include && e.client && e.summary)}>
              {entries.filter((e) => e.include && e.client && e.summary).length}건 저장
            </button>
          </>
        : <>
            <button className="btn sm" onClick={onClose}>취소</button>
            <button className="btn primary sm" onClick={parse} disabled={!canAI || busy || !text.trim()}>
              {busy ? '몰리가 정리 중…' : '🐥 몰리에게 정리 시키기'}
            </button>
          </>}>

      {!entries && (
        <>
          <div className="notice">
            카톡·메일에서 대화를 복사해 그대로 붙여넣으면, 몰리가 <b>업체·날짜·내용·결정사항</b>으로 정리해줍니다.
            저장 전에 확인·수정할 수 있어요.
          </div>
          {!canAI && (
            <div className="notice">⚠️ AI 키가 없어요 — <b>커스텀 → 연동</b>에서 API 키를 넣으면 사용할 수 있습니다. (수동 기록은 각 업체 타임라인에서 가능)</div>
          )}
          <div>
            <label className="fl">업체 힌트 (선택 — 어느 업체와의 대화인지 알면 지정)</label>
            <SuggestInput value={hint} onChange={(e) => setHint(e.target.value)} options={clientNames} placeholder="예: 마뗑킴" />
          </div>
          <div>
            <label className="fl">대화 원문</label>
            <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={'[오후 2:31] 마뗑킴 김담당: 실장님 룩북 컷수 20컷으로 조정 가능할까요?\n[오후 2:40] 나: 네 가능합니다! 대신 일정은…'}
              style={{ width: '100%', resize: 'vertical', fontSize: 12.5 }} />
          </div>
          {err && <div className="notice">🥲 {err}</div>}
        </>
      )}

      {entries && (
        <>
          <div className="notice">몰리가 정리한 {entries.length}건입니다 — 내용을 확인하고 저장하세요. 체크를 풀면 그 항목은 저장하지 않아요.</div>
          {entries.map((e) => (
            <div key={e._i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, opacity: e.include ? 1 : 0.45 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={e.include} onChange={(ev) => upd(e._i, { include: ev.target.checked })} />
                <SuggestInput value={e.client} onChange={(ev) => upd(e._i, { client: ev.target.value })} options={clientNames} placeholder="브랜드명" style={{ width: 150 }} />
                <input type="date" value={e.date} onChange={(ev) => upd(e._i, { date: ev.target.value })} style={{ width: 140 }} />
                <select value={e.channel} onChange={(ev) => upd(e._i, { channel: ev.target.value })} style={{ width: 110 }}>
                  {COMM_CHANNELS.map((c) => <option key={c}>{c}</option>)}
                </select>
                {isAdmin && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={e.adminOnly} onChange={(ev) => upd(e._i, { adminOnly: ev.target.checked })} /> 🔒
                  </label>
                )}
              </div>
              <textarea rows={2} value={e.summary} onChange={(ev) => upd(e._i, { summary: ev.target.value })} style={{ width: '100%', resize: 'vertical', fontSize: 12.5 }} />
              <input value={e.decisions} onChange={(ev) => upd(e._i, { decisions: ev.target.value })} placeholder="📌 결정된 사항 (선택)" style={{ fontSize: 12.5 }} />
            </div>
          ))}
        </>
      )}
    </Modal>
  )
}
