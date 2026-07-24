import { useState } from 'react'
import { useStore } from '../useStore.js'

/* ============================================================
   납품 메시지 생성기 — API·AI 필요 없음
   고객사 선택(고객사 DB) → 드라이브 링크 → 카톡 문안 완성
============================================================ */

function copy(text, setMsg) {
  navigator.clipboard.writeText(text).then(
    () => setMsg('✓ 복사됐습니다 — 카톡에 붙여넣으세요'),
    () => setMsg('복사 실패 — 직접 선택해서 복사해주세요')
  )
  setTimeout(() => setMsg(''), 2500)
}

export default function Studio() {
  const s = useStore()
  const [f, setF] = useState({ client: '', title: '', link: '', kind: '보정본', cuts: '', expiry: '2주간', review: true })
  const [out, setOut] = useState('')
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  function build() {
    const client = f.client || '고객사'
    const name = f.title || '촬영 건'
    const lines = [
      `안녕하세요, ${client} 담당자님! 스튜디오 홀리몰리입니다 🙂`,
      ``,
      `[${name}] ${f.kind} 전달드립니다.`,
      ``,
      `📁 다운로드 링크`,
      f.link || '(구글드라이브 링크)',
      ``,
      `· ${f.kind}${f.cuts ? ` ${f.cuts}컷` : ''}이 포함되어 있습니다.`,
      `· 링크는 ${f.expiry} 유지될 예정이니 기간 내 다운로드 부탁드립니다.`,
      `· 파일 확인 후 이상이 있거나 수정이 필요하시면 편하게 말씀해주세요!`,
    ]
    if (f.review) lines.push(``, `작업물이 마음에 드셨다면, 후기 한 줄이 저희에게 큰 힘이 됩니다 🙏`)
    lines.push(``, `감사합니다!`, `스튜디오 홀리몰리 드림`)
    setOut(lines.join('\n'))
  }

  return (
    <div className="grid">
      <div className="tile col5">
        <div className="tile-h"><span className="ic">📦</span><span className="t">전달 정보</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="fl">고객사</label>
            <select value={f.client} onChange={set('client')}>
              <option value="">— 선택 (고객사 DB에서 불러옴) —</option>
              {[...s.clients].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((c) => (
                <option key={c.id} value={c.name}>{c.name}{c.contact ? ` (${c.contact})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="fl">촬영 건 이름 (선택)</label>
            <input value={f.title} placeholder="예: 26FW 룩북 — 비워두면 '촬영 건'으로 표기" onChange={set('title')} />
          </div>
          <div>
            <label className="fl">구글드라이브 링크</label>
            <input value={f.link} placeholder="https://drive.google.com/…" onChange={set('link')} />
          </div>
          <div className="field-row">
            <div><label className="fl">파일 종류</label>
              <select value={f.kind} onChange={set('kind')}>{['보정본', '원본', '셀렉용 시안', '최종 납품본'].map((k) => <option key={k}>{k}</option>)}</select></div>
            <div><label className="fl">컷 수 (선택)</label><input value={f.cuts} placeholder="예: 30" onChange={set('cuts')} /></div>
          </div>
          <div className="field-row">
            <div><label className="fl">링크 유지 기간</label>
              <select value={f.expiry} onChange={set('expiry')}>{['1주간', '2주간', '한 달간', '별도 안내 시까지'].map((k) => <option key={k}>{k}</option>)}</select></div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12.5, fontWeight: 650, paddingBottom: 9 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={f.review} onChange={set('review')} /> 후기 요청 포함
              </label>
            </div>
          </div>
          <button className="btn primary" onClick={build}>📝 메시지 만들기</button>
          <div className="notice"><span>ℹ️</span><span>고객사 목록은 <b>고객사 DB</b>에서 불러옵니다 — 없는 고객사는 고객사 DB에서 먼저 추가하세요. 만든 메시지는 자유롭게 수정한 뒤 복사하세요.</span></div>
        </div>
      </div>
      <div className="tile col7">
        <div className="tile-h"><span className="ic">💬</span><span className="t">카톡으로 보낼 메시지</span></div>
        <textarea rows={14} value={out} onChange={(e) => setOut(e.target.value)} placeholder="왼쪽 정보를 채우고 ‘메시지 만들기’ — 카톡에 붙여넣기만 하면 됩니다" />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn primary sm" disabled={!out} onClick={() => copy(out, setMsg)}>📋 복사</button>
        </div>
        {msg && <div className="mut3" style={{ fontSize: 12, marginTop: 8 }}>{msg}</div>}
      </div>
    </div>
  )
}
