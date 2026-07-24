// 문의 정보 컴포넌트 시각 검증용 하네스 — /__inq_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import { InquiryInfo, InquirySummary } from './InquiryBits.jsx'
import './styles.css'

// 슬리피솔 실제 접수 내용을 본뜬 샘플
const SAMPLE = {
  brand: '슬리피솔 (리솔)',
  manager: '허이영',
  contact: '010-7562-1208',
  contactPref: '이메일',
  shootType: '제품, 뷰티',
  items: '슬리피솔 플러스 1종 x 10-13컷 내외',
  purposes: ['상세페이지', '광고', '기타'],
  concept: '제품 일부가 투명하게 리뉴얼 되면서 해당 부분 안내를 위해 촬영\n원하는 무드) clean, 은은하게 분위기 있는 무드, 차분한 느낌',
  planStatus: '가이드 작성',
  plan: {
    intro: '슬리피솔 – 미세전류로 수면을 비롯 일상 컨디션에 도움을 주는 웰니스 디바이스 브랜드입니다.',
    shots: '제품 단독컷 - 정면 / 측면 / 반측면 / 로우앵클컷 / 클로즈업컷\noption) 연출 - 공중에 떠있는 제품 컷 / 과학, 수면, 웰니스 관련 소품 연출컷',
    formats: ['인스타 피드 (1:1)', '릴스·숏츠 (세로)', '상세페이지', '홈페이지 배너', '인쇄물·현수막'],
    props: '제품은 촬영 전이나 당일 지참하겠습니다 / 모델 불필요',
  },
  shootDate: '2026-07-30',
  dueDate: '2026-08-03',
  refUrls: [
    'https://www.instagram.com/p/DOsdocZAO1O/',
    'https://www.instagram.com/p/Da-C6Vazjw9/?utm_source=ig_web_copy_link',
    'https://www.instagram.com/sleepisol/',
  ],
  etc: '제품 단일 컷과 소품 연출컷의 단가 차이가 있을까요?',
  planner: true, // 접수 경로 표시 확인용
  futureField: '폼에 나중에 추가된 항목도 캐치올로 표시되는지 확인', // 캐치올 확인용
}

createRoot(document.getElementById('root')).render(
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <h3>문의 상세 렌더 테스트</h3>
    <InquirySummary d={SAMPLE} />
    <InquiryInfo d={SAMPLE} budget="미정 · 상담 후 결정" />
  </div>
)
