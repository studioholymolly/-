// 업무 탭 통합(간트 기본 + 월간=촬영만 + 프로젝트명 클릭 시 업무 펼침) 검증용 하네스
// /__gantt_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import { AuthCtx } from './auth.jsx'
import Tasks from './pages/Tasks.jsx'
import { getState, addItem, today } from './data.js'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 UI 검증
const A = 'u-sumin', B = 'u-doyoung'
getState().members.push(
  { id: A, name: '이수민', role: 'admin', active: true },
  { id: B, name: '김도영', role: 'staff', active: true },
)

const ym = today().slice(0, 7)
addItem('projects', { name: '마뗑킴 SS 룩북', client: '마뗑킴', kind: '룩북', stage: 'shoot', owner: A, shootDate: `${ym}-09`, due: `${ym}-24` }, A)
addItem('projects', { name: '탬버린즈 제품컷', client: '탬버린즈', kind: '제품', stage: 'retouch', owner: B, shootDate: `${ym}-15`, due: `${ym}-28` }, A)
addItem('projects', { name: '납품만 있는 건', client: '쿤달', kind: '제품', stage: 'revise', owner: A, shootDate: '', due: `${ym}-20` }, A)

addItem('tasks', { title: '조명 리스트 확정', owner: B, priority: '높음', due: `${ym}-08`, project: '마뗑킴 SS 룩북', done: false, repeat: '' }, A)
addItem('tasks', { title: '셀렉 요청 발송', owner: A, priority: '보통', due: `${ym}-18`, project: '마뗑킴 SS 룩북', done: false, repeat: '' }, A)
addItem('tasks', { title: '계약서 발송', owner: A, priority: '높음', due: `${ym}-02`, project: '마뗑킴 SS 룩북', done: true, repeat: '' }, A)
addItem('tasks', { title: '보정본 백업', owner: B, priority: '높음', due: `${ym}-26`, project: '탬버린즈 제품컷', done: false, repeat: '' }, A)

const user = { id: A, name: '이수민', role: 'admin', active: true }
createRoot(document.getElementById('root')).render(
  <AuthCtx.Provider value={{ user, isAdmin: true, booting: false, notice: null, login: () => {}, signup: () => {}, logout: () => {} }}>
    <div style={{ padding: 24 }}><Tasks /></div>
  </AuthCtx.Provider>
)
