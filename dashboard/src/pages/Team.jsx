import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { addMember, updateMember, changeOwnPassword, sendPasswordReset, ROLE_LABEL } from '../data.js'
import { Modal } from '../ui.jsx'

export default function Team() {
  const { user } = useAuth()
  const s = useStore()
  const [add, setAdd] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const members = s.members || []
  const adminCount = members.filter((m) => m.active && m.role === 'admin').length

  async function resetMail(m) {
    if (!m.email) { setMsg('✕ 이메일 정보가 없습니다.'); return }
    const err = await sendPasswordReset(m.email)
    setMsg(err ? '✕ ' + err : `✓ ${m.name}님(${m.email})에게 비밀번호 재설정 메일을 보냈습니다.`)
  }

  return (
    <>
      <div className="ph">
        <h3>팀 관리</h3>
        <span className="mut3" style={{ fontSize: 12 }}>인원 제한 없음 — 100명도 OK. 직원은 매출·정산에 접근할 수 없습니다</span>
        <span className="sp" />
        <button className="btn primary sm" onClick={() => setAdd(true)}>＋ 팀원 추가</button>
      </div>

      <div className="tbl-wrap">
        <table className="tb">
          <thead><tr><th>이름</th><th>이메일</th><th>직함</th><th>권한</th><th>상태</th><th>비밀번호</th><th /></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ opacity: m.active ? 1 : 0.45 }}>
                <td style={{ fontWeight: 700 }}>{m.role === 'admin' ? '👑 ' : ''}{m.name}{m.id === user.id && <span className="mut3" style={{ fontWeight: 500 }}> (나)</span>}</td>
                <td className="mut" style={{ fontSize: 12.5 }}>{m.email || '—'}</td>
                <td className="mut">{m.title || '—'}</td>
                <td>
                  <select value={m.role} disabled={m.id === user.id}
                    onChange={(e) => updateMember(m.id, { role: e.target.value }, user.id)}
                    style={{ width: 150, padding: '5px 8px', fontSize: 12.5 }}>
                    <option value="admin">{ROLE_LABEL.admin}</option>
                    <option value="staff">{ROLE_LABEL.staff}</option>
                  </select>
                </td>
                <td>
                  <span className={'pill ' + (m.active ? 'solid' : 'line')}>{m.active ? '활성' : '비활성'}</span>
                </td>
                <td>
                  {m.id === user.id
                    ? <button className="btn sm" onClick={() => setPwOpen(true)}>변경</button>
                    : <button className="btn sm" onClick={() => resetMail(m)}>재설정 메일</button>}
                </td>
                <td>
                  {m.id !== user.id && (
                    <button className="btn ghost sm"
                      disabled={m.active && m.role === 'admin' && adminCount <= 1}
                      onClick={() => updateMember(m.id, { active: !m.active }, user.id)}>
                      {m.active ? '비활성화' : '다시 활성화'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {msg && <div className="notice" style={{ marginTop: 12 }}><span>{msg.startsWith('✓') ? '✅' : '⚠️'}</span><span>{msg}</span></div>}

      <div className="notice" style={{ marginTop: 14 }}>
        <span>🔒</span>
        <span><b>권한 규칙:</b> 관리자 = 매출·정산·지출·팀 관리 포함 전체. 직원 = 금액 데이터가 <b>서버에서부터</b> 차단됩니다.
          퇴사자는 삭제 대신 <b>비활성화</b>하세요 — 작성 기록(담당·활동)이 보존되고, 로그인도 즉시 막힙니다.</span>
      </div>

      {add && <AddMemberForm onClose={() => setAdd(false)} actor={user.id}
        onDone={(m) => { setAdd(false); setMsg(m) }} />}
      {pwOpen && <PwForm onClose={() => setPwOpen(false)} onDone={(m) => { setPwOpen(false); setMsg(m) }} />}
    </>
  )
}

function AddMemberForm({ onClose, onDone, actor }) {
  const [f, setF] = useState({ name: '', title: '', role: 'staff', email: '', pass: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr('') }

  async function save() {
    if (!f.name.trim()) { setErr('이름을 입력하세요.'); return }
    if (!f.email.trim() || !f.email.includes('@')) { setErr('이메일을 입력하세요 — 로그인 아이디가 됩니다.'); return }
    if (f.pass.length < 6) { setErr('초기 비밀번호는 6자 이상이어야 합니다.'); return }
    setBusy(true)
    const msg = await addMember({ ...f, name: f.name.trim(), email: f.email.trim() }, actor)
    setBusy(false)
    if (msg) { setErr(msg); return }
    onDone(`✓ ${f.name.trim()} 계정이 만들어졌습니다. 이메일·비밀번호를 본인에게 전달하세요.`)
  }

  return (
    <Modal title="팀원 추가" onClose={onClose}
      footer={<><button className="btn sm" onClick={onClose}>취소</button>
        <button className="btn primary sm" disabled={busy} onClick={save}>{busy ? '만드는 중…' : '계정 만들기'}</button></>}>
      <div className="field-row">
        <div><label className="fl">이름</label><input value={f.name} autoFocus placeholder="예: 하늘" onChange={set('name')} /></div>
        <div><label className="fl">직함 (선택)</label><input value={f.title} placeholder="예: 포토그래퍼" onChange={set('title')} /></div>
      </div>
      <div className="field-row">
        <div><label className="fl">이메일 (로그인 아이디)</label><input type="email" value={f.email} placeholder="haneul@gmail.com" onChange={set('email')} /></div>
        <div><label className="fl">초기 비밀번호 (6자 이상)</label><input value={f.pass} placeholder="본인이 나중에 변경 가능" onChange={set('pass')} /></div>
      </div>
      <div className="field-row">
        <div><label className="fl">권한</label>
          <select value={f.role} onChange={set('role')}>
            <option value="staff">직원 · 매출 제외</option>
            <option value="admin">관리자 · 전체 권한</option>
          </select>
        </div>
        <div />
      </div>
      {err && <div className="err">{err}</div>}
    </Modal>
  )
}

function PwForm({ onClose, onDone }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    if (pw.length < 6) { setErr('6자 이상이어야 합니다.'); return }
    setBusy(true)
    const msg = await changeOwnPassword(pw)
    setBusy(false)
    if (msg) { setErr(msg); return }
    onDone('✓ 비밀번호가 변경되었습니다.')
  }
  return (
    <Modal title="내 비밀번호 변경" onClose={onClose}
      footer={<><button className="btn sm" onClick={onClose}>취소</button>
        <button className="btn primary sm" disabled={busy} onClick={save}>{busy ? '변경 중…' : '변경'}</button></>}>
      <div><label className="fl">새 비밀번호 (6자 이상)</label><input type="password" value={pw} autoFocus onChange={(e) => { setPw(e.target.value); setErr('') }} /></div>
      {err && <div className="err">{err}</div>}
    </Modal>
  )
}
