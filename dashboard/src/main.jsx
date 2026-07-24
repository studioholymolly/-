import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './auth.jsx'
import App from './App.jsx'
import './styles.css'

// 공개 페이지들은 지연 로드 — 대시보드 번들에서 분리, /inquiry 방문자도 필요한 코드만 받음
const InquiryPage = lazy(() => import('./pages/Inquiry.jsx'))
const PlannerPage = lazy(() => import('./pages/Planner.jsx'))
const ReferencePage = lazy(() => import('./pages/Reference.jsx'))

const Docs = lazy(() => import('./pages/Docs.jsx'))
function DocsDev() {
  return (
    <Suspense fallback={null}>
      <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto' }}><Docs /></div>
    </Suspense>
  )
}

// /inquiry — 외부 고객용 공개 문의 페이지 (로그인·스토어 부트스트랩 없이 완전 격리)
const isInquiry = window.location.pathname === '/inquiry'
// /planner — 촬영 기획안 도우미 (문의 페이지와 같은 공개·격리 구조)
const isPlanner = window.location.pathname === '/planner'
// /reference — 촬영 레퍼런스 파인더 (핀터레스트 검색 링크 조합, 공개·격리 구조)
const isReference = window.location.pathname === '/reference'
// /docs-dev — 견적·계약서 화면 개발용 미리보기 (dev 빌드에서만, 배포엔 포함 안 됨)
const isDocsDev = import.meta.env.DEV && window.location.pathname === '/docs-dev'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDocsDev ? (
      <DocsDev />
    ) : isInquiry ? (
      <Suspense fallback={null}><InquiryPage /></Suspense>
    ) : isPlanner ? (
      <Suspense fallback={null}><PlannerPage /></Suspense>
    ) : isReference ? (
      <Suspense fallback={null}><ReferencePage /></Suspense>
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </StrictMode>
)
