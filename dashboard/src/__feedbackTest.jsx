// 홈 피드백 보드(팀 공유) 검증용 하네스 — /__feedback_test.html 에서만 사용 (배포 번들에 포함되지 않음)
// 같은 store를 공유하는 두 계정(관리자 수민 · 직원 도영) 화면을 나란히 렌더 — 체크·댓글이 서로에게 보이는지 확인
import { createRoot } from 'react-dom/client'
import { AuthCtx } from './auth.jsx'
import Home from './pages/Home.jsx'
import { getState, addFeedback, replyFeedback, toggleFeedback, setHomeLayout } from './data.js'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 UI 검증
const A = 'u-sumin', B = 'u-doyoung'
getState().members.push(
  { id: A, name: '이수민', role: 'admin', active: true },
  { id: B, name: '김도영', role: 'staff', active: true },
)

// 시나리오: 수민이 피드백 2건 → 도영이 1건은 체크, 1건에는 댓글
addFeedback(A, '릴스 썸네일 폰트가 너무 작아요 — 다음 편부터 키워주세요!')
addFeedback(A, '탬버린즈 보정본 2차 셀렉 오늘 중으로 부탁해요')
const items = getState().comments.filter((c) => c.project === '__feedback__')
toggleFeedback(items.find((f) => f.text.includes('셀렉')).id, B)
replyFeedback(items.find((f) => f.text.includes('썸네일')).id, B, '넵! 다음 릴스부터 24pt로 올릴게요 👍')

// 도영 계정: 예전 'kpi' 묶음 키가 들어간 저장 배치 → 4개 타일로 제자리 분리되는지(마이그레이션) 검증
setHomeLayout(B, { order: ['week', 'kpi', 'todo'] })

function Pane({ id, name, role }) {
  const user = { id, name, role, active: true }
  return (
    <AuthCtx.Provider value={{ user, isAdmin: role === 'admin', booting: false, notice: null, login: () => {}, signup: () => {}, logout: () => {} }}>
      <div style={{ flex: 1, minWidth: 0, border: '1px solid #ccc', borderRadius: 12, padding: 16, overflow: 'auto' }}>
        <b style={{ fontSize: 13 }}>[{role === 'admin' ? '관리자' : '직원'}] {name} 화면</b>
        <Home go={() => {}} />
      </div>
    </AuthCtx.Provider>
  )
}

createRoot(document.getElementById('root')).render(
  <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start' }}>
    <Pane id={A} name="이수민" role="admin" />
    <Pane id={B} name="김도영" role="staff" />
  </div>
)
