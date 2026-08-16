// Docs(견적·계약서) 시각 검증용 하네스 — /__docs_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { createRoot } from 'react-dom/client'
import Docs from './pages/Docs.jsx'
import { getState } from './data.js'
import './styles.css'

// 한눈에 보기·발급 내역 시각 검증용 목 데이터 (첫 렌더 전에 심어야 반영됨)
getState().quotes.push(
  {
    id: 'mock1', docType: 'quote', docNo: 'HM-2026-003', client: '탬버린즈', manager: '김주희', phone: '010-1234-5678', date: '2026-07-21',
    items: [
      { cat: '촬영비', name: '하프데이_포토그래퍼', qty: 1, price: 1500000 },
      { cat: '촬영비', name: '하프데이_스타일리스트', qty: 1, price: 700000 },
      { cat: '보정·편집', name: '제품 정밀 보정', qty: 8, price: 100000 },
    ],
    discountAmt: 100000, discountPct: 0, subtotal: 3000000, discount: 100000, vat: 290000, total: 3190000,
  },
  {
    id: 'mock2', docType: 'video', docNo: 'HM-V-2026-001', client: '마뗑킴', manager: '이담당', phone: '', date: '2026-07-15',
    items: [
      { stage: '동영상 제작', name: '연출', qty: 1, price: 1000000 },
      { stage: '동영상 제작', name: '촬영', qty: 1, price: 1800000 },
      { stage: '제작 후 마무리', name: '편집', qty: 2, price: 1500000 },
    ],
    discountAmt: 0, discountPct: 0, subtotal: 5800000, discount: 0, vat: 580000, total: 6380000,
  },
  {
    id: 'mock3', docType: 'contract', docNo: 'HM-C-2026-002', client: '설화수', phone: '010-9876-5432', date: '2026-07-10',
    total: 4620000, depositPct: 50, cDate: '2026-07-10', workStart: '2026-07-20', workEnd: '2026-07-21', delivDate: '2026-08-01',
  },
  {
    id: 'mock4', docType: 'receipt', docNo: 'HM-R-2026-001', client: '탬버린즈', manager: '김주희', phone: '010-1234-5678',
    project: '탬버린즈 25FW 제품컷', date: '2026-07-25', periodFrom: '2026-07-20', periodTo: '2026-07-21',
    items: [
      { date: '2026-07-20', cat: '프롭·소품', place: '방산시장 대성유리', name: '유리 트레이 2종', qty: 2, price: 34000, pay: '법인카드', note: '' },
      { date: '2026-07-20', cat: '원물·식자재', place: '이마트 성수점', name: '촬영용 생화·과일', qty: 1, price: 78600, pay: '법인카드', note: '' },
      { date: '2026-07-21', cat: '교통·주차', place: '스튜디오 주차장', name: '촬영 당일 주차', qty: 1, price: 18000, pay: '개인카드', note: '스타일리스트 차량' },
      { date: '2026-07-21', cat: '식대', place: '연남동 소반', name: '스태프 5인 중식', qty: 1, price: 62000, pay: '법인카드', note: '' },
    ],
    vatMode: 'included', prepaid: 100000,
    subtotal: 226600, vat: 0, prepaidAmt: 100000, due: 126600, total: 226600,
  },
)

createRoot(document.getElementById('root')).render(<Docs />)
