import { useRef, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { exportJSON, importJSON, resetAll, today, legacyLocalInfo, migrateLegacyToCloud } from '../data.js'

export default function Settings() {
  const { user, isAdmin } = useAuth()
  const s = useStore()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [busy, setBusy] = useState(false)
  const legacy = legacyLocalInfo()

  const counts = [
    ['프로젝트', s.projects.length], ['업무', s.tasks.length], ['고객사', s.clients.length],
    ['외주', s.vendors.length], ['콘텐츠', s.contents.length], ['거래', s.deals.length],
    ['지출', s.expenses.length], ['팀원', (s.members || []).length], ['댓글', (s.comments || []).length],
  ]
  const size = Math.round(exportJSON().length / 1024)

  function download() {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `holymolly-backup-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('✓ 백업 파일이 다운로드됐습니다. 안전한 곳(구글 드라이브 등)에 보관하세요.')
  }

  function onImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        setBusy(true)
        await importJSON(String(reader.result))
        setMsg('✓ 데이터를 클라우드에 복원했습니다. 모든 기기에 즉시 반영됩니다.')
      } catch (err) {
        setMsg('✕ 가져오기 실패: ' + err.message)
      } finally { setBusy(false) }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function migrate() {
    try {
      setBusy(true)
      await migrateLegacyToCloud(user.id)
      setMsg('✓ 예전 데이터를 클라우드로 옮겼습니다. 이제 어느 컴퓨터에서든 같은 데이터가 보입니다.')
    } catch (err) {
      setMsg('✕ 이관 실패: ' + err.message)
    } finally { setBusy(false) }
  }

  return (
    <>
      <div className="ph"><h3>설정 · 데이터</h3></div>

      <div className="grid">
        <div className="tile col6">
          <div className="tile-h"><span className="ic">▦</span><span className="t">클라우드 데이터</span>
            <span className="sp" /><span className="mut3 mono" style={{ fontSize: 11 }}>{size} KB · 실시간 동기화 중</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {counts.map(([k, v]) => (
              <div key={k} style={{ background: 'var(--panel-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px' }}>
                <div className="mut3" style={{ fontSize: 11, fontWeight: 650 }}>{k}</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 800 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tile col6">
          <div className="tile-h"><span className="ic">⛨</span><span className="t">백업 · 복원</span></div>
          <p className="mut" style={{ fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
            모든 스튜디오 데이터를 JSON 파일 하나로 내보냅니다. <b>주 1회 백업을 권장</b>합니다.
            {isAdmin ? ' 가져오기는 클라우드 데이터를 백업 파일 내용으로 교체합니다.' : ' 가져오기·초기화는 관리자만 가능합니다.'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={download}>⬇ 전체 백업 다운로드</button>
            {isAdmin && (
              <>
                <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>⬆ 백업 가져오기</button>
                <input ref={fileRef} type="file" accept=".json,application/json" onChange={onImport} style={{ display: 'none' }} />
              </>
            )}
          </div>
          {msg && <div className="notice" style={{ marginTop: 12 }}><span>{msg.startsWith('✓') ? '✅' : '⚠️'}</span><span>{msg}</span></div>}
        </div>

        {isAdmin && legacy && (
          <div className="tile col6">
            <div className="tile-h"><span className="ic">☁</span><span className="t">예전 데이터 이관</span>
              <span className="sp" /><span className="owner-pill">🔒 관리자</span></div>
            <p className="mut" style={{ fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
              이 브라우저에 클라우드 이전 데이터가 남아 있습니다 —
              프로젝트 <b>{legacy.projects}</b> · 업무 <b>{legacy.tasks}</b> · 거래 <b>{legacy.deals}</b>건.
              클라우드로 올리면 현재 클라우드 데이터를 <b>교체</b>합니다.
            </p>
            <button className="btn primary" disabled={busy} onClick={migrate}>
              {busy ? '옮기는 중…' : '☁ 클라우드로 이관하기'}
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="tile col6">
            <div className="tile-h"><span className="ic">!</span><span className="t">위험 구역</span>
              <span className="sp" /><span className="owner-pill">🔒 관리자</span></div>
            <p className="mut" style={{ fontSize: 13, margin: '0 0 12px' }}>
              모든 데이터를 지우고 예시 데이터로 되돌립니다. 되돌릴 수 없습니다 — 먼저 백업하세요.
            </p>
            {!confirmReset ? (
              <button className="btn" onClick={() => setConfirmReset(true)}>전체 초기화…</button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn primary" disabled={busy} onClick={async () => {
                  setBusy(true)
                  await resetAll(user.id)
                  setBusy(false)
                  setConfirmReset(false); setMsg('✓ 초기화되었습니다.')
                }}>정말 초기화</button>
                <button className="btn" onClick={() => setConfirmReset(false)}>취소</button>
              </div>
            )}
          </div>
        )}

        <div className="tile col6">
          <div className="tile-h"><span className="ic">↗</span><span className="t">저장 방식</span></div>
          <p className="mut" style={{ fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            데이터는 <b>Supabase 클라우드</b>에 저장되고 모든 기기·팀원에게 실시간으로 공유됩니다.
            매출·정산·지출·견적서는 서버 권한(RLS)으로 <b>관리자에게만</b> 전송됩니다 —
            직원 계정은 화면만이 아니라 데이터 자체가 차단됩니다.
          </p>
        </div>
      </div>
    </>
  )
}
