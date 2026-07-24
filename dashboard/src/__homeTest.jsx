// 홈 파이프라인 위젯 브랜드명 표시 검증용 하네스 — /__home_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import { AuthCtx } from './auth.jsx'
import Home from './pages/Home.jsx'
import { getState, addItem } from './data.js'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 UI 검증
const U1 = 'u-sumin'
getState().members.push({ id: U1, name: '이수민', role: 'admin', active: true })

addItem('projects', { name: '우지커피 시즌 화보', client: '우지커피', kind: '제품', stage: 'contract', owner: U1 }, U1)
addItem('projects', { name: '아이리버 신제품', client: '아이리버', kind: '광고', stage: 'contract', owner: U1 }, U1)
addItem('projects', { name: '트라이브 브랜드 필름', client: 'TRYBE', kind: '영상', stage: 'retouch', owner: U1 }, U1)
addItem('projects', { name: '노프리즘 룩북', client: '노프리즘', kind: '패션', stage: 'revise', owner: U1 }, U1)
// 5건 이상 → "+n" 오버플로 확인용
addItem('projects', { name: 'A', client: '브랜드A', kind: '제품', stage: 'shoot', owner: U1 }, U1)
addItem('projects', { name: 'B', client: '브랜드B', kind: '제품', stage: 'shoot', owner: U1 }, U1)
addItem('projects', { name: 'C', client: '브랜드C', kind: '제품', stage: 'shoot', owner: U1 }, U1)
addItem('projects', { name: 'D', client: '브랜드D', kind: '제품', stage: 'shoot', owner: U1 }, U1)
addItem('projects', { name: 'E', client: '브랜드E', kind: '제품', stage: 'shoot', owner: U1 }, U1)

const user = { id: U1, name: '이수민', role: 'admin', active: true }
createRoot(document.getElementById('root')).render(
  <AuthCtx.Provider value={{ user, isAdmin: true, booting: false, notice: null, login: () => {}, signup: () => {}, logout: () => {} }}>
    <div style={{ padding: 24 }}><Home go={() => {}} /></div>
  </AuthCtx.Provider>
)
