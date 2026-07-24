import { useState } from 'react'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { login, signup, notice } = useAuth()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setErr(''); setInfo('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        if (!name.trim()) { setErr('이름을 입력하세요.'); return }
        if (pass.length < 6) { setErr('비밀번호는 6자 이상이어야 합니다.'); return }
        const msg = await signup(email.trim(), pass, name.trim())
        if (msg === 'CONFIRM_EMAIL') setInfo('확인 메일을 보냈습니다. 메일함에서 링크를 누른 뒤 로그인하세요.')
        else if (msg) setErr(msg)
      } else {
        const msg = await login(email.trim(), pass)
        if (msg) setErr(msg)
      }
    } finally { setBusy(false) }
  }

  return (
    <div className="login-wrap">
      <div className="login">
        <div className="brand">
          <img className="logo-img" src="/brand/simbol-bk.png" alt="STUDIO HOLYMOLLY" />
          <div>
            <h1>스튜디오 홀리몰리</h1>
            <div className="sub">운영 대시보드 · {mode === 'signup' ? '첫 가입' : '로그인'}</div>
          </div>
        </div>

        <form className="card login-card" onSubmit={submit}>
          {mode === 'signup' && (
            <div className="field">
              <label className="fl">이름</label>
              <input value={name} placeholder="예: 수민" onChange={(e) => { setName(e.target.value); setErr('') }} />
            </div>
          )}

          <div className="field">
            <label className="fl">이메일</label>
            <input type="email" value={email} autoFocus placeholder="studio.holymolly@gmail.com"
              onChange={(e) => { setEmail(e.target.value); setErr('') }} />
          </div>

          <div className="field">
            <label className="fl">비밀번호</label>
            <input type="password" value={pass} placeholder={mode === 'signup' ? '6자 이상' : '비밀번호를 입력하세요'}
              onChange={(e) => { setPass(e.target.value); setErr('') }} />
          </div>

          {err && <div className="err">{err}</div>}
          {(info || notice) && <div className="hint" style={{ textAlign: 'left' }}>{info || notice}</div>}

          <button className="btn primary" type="submit" disabled={busy}
            style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {busy ? '처리 중…' : mode === 'signup' ? '가입하기' : '로그인'}
          </button>

          <div className="hint">
            {mode === 'login' ? (
              <>처음이신가요? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setErr('') }}><b>대표 계정 만들기</b></a> · 팀원 계정은 관리자의 <b>팀 관리</b>에서</>
            ) : (
              <>이미 계정이 있나요? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setErr('') }}><b>로그인</b></a></>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
