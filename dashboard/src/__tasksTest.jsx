// 업무 페이지 프로젝트별 뷰 시각 검증용 하네스 — /__tasks_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import { AuthCtx } from './auth.jsx'
import Tasks from './pages/Tasks.jsx'
import { getState, addItem, today, addDays } from './data.js'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 UI 검증
const U1 = 'u-sumin', U2 = 'u-doyoung'
getState().members.push(
  { id: U1, name: '이수민', role: 'admin', active: true },
  { id: U2, name: '안도영', role: 'staff', active: true },
)

const P1 = '우지커피 가을 시즌 메뉴 촬영'
const P2 = '에익스나인 세럼 촬영'
addItem('projects', { name: P1, stage: 'shoot' }, U1)
addItem('projects', { name: P2, stage: 'retouch' }, U1)

const T = (title, project, owner, priority, due, extra = {}) =>
  addItem('tasks', { title, project, owner, priority, due, done: false, repeat: '', ...extra }, U1)

T('장비 점검·렌탈 확인', P1, U1, '보통', today())
T('소품·배경 준비', P1, U1, '보통', addDays(today(), 2))
T('현장·조명 세팅', P1, U1, '높음', addDays(today(), 7))
T('컨셉 기획·레퍼런스 정리', P1, U1, '보통', addDays(today(), -3))
T('원본 백업 업로드', P1, U1, '높음', addDays(today(), 8), { done: true })
T('셀렉 (컷 선별) 요청', P2, U1, '보통', addDays(today(), 1))
T('리터칭·수정 진행', P2, U1, '보통', addDays(today(), 5))
T('마케팅 콘텐츠 제작 (릴스·핀)', P2, U2, '낮음', addDays(today(), 12))
T('보정본 백업 업로드', P2, U1, '높음', addDays(today(), 7), { done: true })
T('세금계산서 발행', '', U1, '보통', addDays(today(), 3))
T('스튜디오 청소', '', U2, '낮음', '')

const user = { id: U1, name: '이수민', role: 'admin', active: true }
createRoot(document.getElementById('root')).render(
  <AuthCtx.Provider value={{ user, isAdmin: true, booting: false, notice: null, login: () => {}, signup: () => {}, logout: () => {} }}>
    <Tasks />
  </AuthCtx.Provider>
)
