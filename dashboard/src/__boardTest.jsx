// 프로젝트 보드 유령 카드(삭제된 단계 소속) 복구 검증용 하네스 — /__board_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import { AuthCtx } from './auth.jsx'
import Projects from './pages/Projects.jsx'
import { getState, addItem, updateConfig } from './data.js'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 UI 검증
const U1 = 'u-sumin'
getState().members.push({ id: U1, name: '이수민', role: 'admin', active: true })

// 커스텀에서 '문의 접수' 단계를 삭제한 상황 재현 (사용자 보드와 동일)
updateConfig({
  stages: [
    { id: 'contract', name: '준비' },
    { id: 'shoot', name: '촬영' },
    { id: 'retouch', name: '셀렉·리터칭' },
    { id: 'revise', name: '수정 중' },
    { id: 'delivered', name: '납품 완료' },
  ],
})

addItem('projects', { name: '정상 카드 (준비)', client: '우지커피', kind: '제품', stage: 'contract', owner: U1 }, U1)
addItem('projects', { name: '유령 카드 (삭제된 inquiry 단계)', client: '아이리버', kind: '광고', stage: 'inquiry', owner: U1 }, U1)

const user = { id: U1, name: '이수민', role: 'admin', active: true }
createRoot(document.getElementById('root')).render(
  <AuthCtx.Provider value={{ user, isAdmin: true, booting: false, notice: null, login: () => {}, signup: () => {}, logout: () => {} }}>
    <div style={{ padding: 24 }}><Projects /></div>
  </AuthCtx.Provider>
)
