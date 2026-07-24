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
)

createRoot(document.getElementById('root')).render(<Docs />)
