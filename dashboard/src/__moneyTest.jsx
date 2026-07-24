// 매출·정산 인라인 상태 변경 + KPI 실시간 재계산 검증용 하네스 — /__money_test.html 에서만 사용 (배포 번들에 포함되지 않음)
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { addItem, updateItem, moneySummary } from './data.js'
import { useStore } from './useStore.js'
import { DealsTable, DealForm } from './pages/Money.jsx'
import { Won } from './ui.jsx'
import './styles.css'

// supabase 저장은 미인증이라 조용히 실패 — 로컬 상태만 채워서 UI 검증
const U = 'test-user'
addItem('deals', { project: '260702_TWW', client: 'TWW', amount: 5995000, outsource: 0, deposit: 0, balance: 5995000, taxInvoice: true, status: '잔금대기', month: '2026-07' }, U)
addItem('deals', { project: '코니 입체 썸네일', client: '코니바이에린', amount: 5700000, outsource: 0, deposit: 0, balance: 5700000, taxInvoice: false, status: '잔금대기', month: '2026-07' }, U)

function Harness() {
  const s = useStore()
  const m = moneySummary()
  const [edit, setEdit] = useState(null)
  return (
    <div style={{ padding: 24 }}>
      <div className="grid" style={{ marginBottom: 18 }}>
        <K label="매출" v={m.sales} />
        <K label="입금" v={m.revenue} />
        <K label="미수금" v={m.receivable} />
        <K label="순이익" v={m.net} />
      </div>
      <DealsTable deals={s.deals} onEdit={setEdit} />
      {edit && <DealForm initial={edit} onClose={() => setEdit(null)} onSave={(d) => { updateItem('deals', edit.id, d); setEdit(null) }} />}
    </div>
  )
}
function K({ label, v }) {
  return (
    <div className="tile col4" data-kpi={label}>
      <div className="tile-h"><span className="ic">₩</span><span className="t">{label}</span></div>
      <div className="kfig num" style={{ fontSize: 22 }}><Won v={v} /></div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Harness />)
