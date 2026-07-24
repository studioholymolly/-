// 앱 셸(사이드바·상단바) 모바일 드로어 검증용 하네스 — /__shell_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import { AuthCtx } from './auth.jsx'
import App from './App.jsx'
import { getState, addItem } from './data.js'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 UI 검증
const U1 = 'u-sumin'
const s = getState()
s.loaded = true
s.members.push({ id: U1, name: '이수민', role: 'admin', active: true })

addItem('projects', { name: '우지커피 시즌 화보', client: '우지커피', kind: '제품', stage: 'contract', owner: U1 }, U1)
addItem('projects', { name: '트라이브 브랜드 필름', client: 'TRYBE', kind: '영상', stage: 'retouch', owner: U1 }, U1)
addItem('tasks', { title: '견적서 발송', due: '2026-07-24', owner: U1 }, U1)

const user = { id: U1, name: '이수민', role: 'admin', active: true }
createRoot(document.getElementById('root')).render(
  <AuthCtx.Provider value={{ user, isAdmin: true, booting: false, notice: null, login: () => {}, signup: () => {}, logout: () => {} }}>
    <App />
  </AuthCtx.Provider>
)
