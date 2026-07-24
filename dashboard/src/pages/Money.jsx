import { useState } from 'react'
import { useAuth } from '../auth.jsx'
import { useStore } from '../useStore.js'
import { addItem, updateItem, removeItem, moneySummary } from '../data.js'
import { Won, Modal, SuggestInput, MoneyInput } from '../ui.jsx'

export default function Money() {
  const { user } = useAuth()
  const s = useStore()
  const m = moneySummary()
  const [tab, setTab] = useState('deals')
  const [add, setAdd] = useState(false)
  const [edit, setEdit] = useState(null)
  const [editExp, setEditExp] = useState(null)

  return (
    <>
      <div className="notice" style={{ marginBottom: 16 }}>
        <span>🔒</span>
        <span><b>관리자 전용 화면입니다.</b> 이 페이지의 모든 금액은 직원(도영) 계정에는 메뉴에서도, 데이터에서도 나타나지 않습니다.</span>
      </div>

      <div className="grid" style={{ marginBottom: 18 }}>
        <Kpi cls="col3" label="7월 매출" v={m.sales} trend="▲ 18%" />
        <Kpi cls="col3" label="미수금" v={m.receivable} sub={`${s.deals.filter((d) => d.balance > 0).length}건 잔액`} strong />
        <Kpi cls="col3" label="외주비" v={m.outsource} sub="3.3%·계산서" />
        <Kpi cls="col3" label="월 순이익" v={m.net} sub="매출−외주−지출" />
      </div>

      <div className="ph">
        <div style={{ display: 'flex', gap: 6 }}>
          {[['deals', '거래·정산'], ['recv', '미수금'], ['expenses', '지출·손익']].map(([k, v]) => (
            <button key={k} className={'btn sm' + (tab === k ? ' primary' : '')} onClick={() => setTab(k)}>{v}</button>
          ))}
        </div>
        <span className="sp" />
        {tab !== 'expenses'
          ? <button className="btn primary sm" onClick={() => setAdd('deal')}>＋ 거래 추가</button>
          : <button className="btn primary sm" onClick={() => setAdd('exp')}>＋ 지출 추가</button>}
      </div>

      {tab === 'deals' && <DealsTable deals={s.deals} onEdit={setEdit} />}
      {tab === 'recv' && <DealsTable deals={s.deals.filter((d) => d.balance > 0)} recvOnly onEdit={setEdit} />}
      {tab === 'expenses' && <Expenses s={s} m={m} onEdit={setEditExp} />}

      {add === 'deal' && <DealForm onClose={() => setAdd(false)} onSave={(d) => { addItem('deals', d, user.id); setAdd(false) }} />}
      {add === 'exp' && <ExpForm onClose={() => setAdd(false)} onSave={(d) => { addItem('expenses', d, user.id); setAdd(false) }} />}
      {edit && <DealForm initial={edit} onClose={() => setEdit(null)} onSave={(d) => { updateItem('deals', edit.id, d); setEdit(null) }} />}
      {editExp && <ExpForm initial={editExp} onClose={() => setEditExp(null)} onSave={(d) => { updateItem('expenses', editExp.id, d); setEditExp(null) }} />}
    </>
  )
}

function Kpi({ cls, label, v, sub, trend, strong }) {
  return (
    <div className={'tile ' + cls}>
      <div className="tile-h"><span className="ic">₩</span><span className="t">{label}</span></div>
      <div className="kfig num" style={{ fontSize: 22 }}><Won v={v} /></div>
      <div className="ksub">{trend && <span className="trend up">{trend}</span>}{strong && v > 0 && <span className="trend dn">확인 필요</span>}{sub}</div>
    </div>
  )
}

function statDot(status) {
  const map = { 완료: 'k', 진행중: 'm', 잔금대기: 'm', 계약금대기: 'o' }
  return map[status] || 'o'
}

const DEAL_STATUSES = ['계약금대기', '진행중', '잔금대기', '완료']

// 입금은 O/X — 입금완료면 거래금액 전액 입금·잔금 0, 미입금이면 전액이 미수 잔금
export function isPaid(deal) { return (deal.deposit || 0) > 0 }
function paidPatch(deal, paid) {
  return paid
    ? { deposit: deal.amount || 0, balance: 0 }
    : { deposit: 0, balance: deal.amount || 0 }
}

// 완료로 바꾸면 돈이 다 들어온 것 — 입금·잔금을 자동 정리해서 상단 카드에 바로 반영
function statusPatch(deal, status) {
  return status === '완료'
    ? { status, ...paidPatch(deal, true) }
    : { status }
}

function PaidToggle({ deal }) {
  const paid = isPaid(deal)
  return (
    <button
      className={'paid-toggle' + (paid ? ' on' : '')}
      onClick={(e) => { e.stopPropagation(); updateItem('deals', deal.id, paidPatch(deal, !paid)) }}
      title="클릭하면 입금완료 ↔ 미입금 전환 — 바로 저장됩니다"
    >
      {paid
        ? <><span className="dot k" />입금완료</>
        : <><span className="dot o" style={{ border: '1.5px solid var(--g4)' }} />미입금</>}
    </button>
  )
}

function StatusSelect({ deal }) {
  return (
    <select
      className={'stat-select' + (deal.status === '완료' ? ' done' : '')}
      value={deal.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => updateItem('deals', deal.id, statusPatch(deal, e.target.value))}
      title="상태를 바꾸면 바로 저장됩니다"
    >
      {DEAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
    </select>
  )
}

export function DealsTable({ deals, recvOnly, onEdit }) {
  return (
    <div className="tbl-wrap">
      <table className="tb">
        <thead>
          <tr>
            <th>프로젝트</th><th>고객사</th><th className="r">거래금액</th><th className="r">외주송금</th>
            <th className="r">순매출</th><th className="r">{recvOnly ? '미수 잔금' : '입금'}</th><th>계산서</th><th>상태</th><th />
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d.id} onClick={() => onEdit(d)} style={{ cursor: 'pointer' }} title="클릭해서 수정">
              <td style={{ fontWeight: 650 }}>{d.project}</td>
              <td className="mut">{d.client}</td>
              <td className="r"><Won v={d.amount} /></td>
              <td className="r mut">−<Won v={d.outsource} /></td>
              <td className="r" style={{ fontWeight: 750 }}><Won v={d.amount - d.outsource} /></td>
              <td className="r">{recvOnly ? <Won v={d.balance} /> : <PaidToggle deal={d} />}</td>
              <td>{d.taxInvoice ? <span className="stat"><span className="dot k" />발행</span> : <span className="stat mut3"><span className="dot o" style={{ border: '1.5px solid var(--g4)' }} />미발행</span>}</td>
              <td><StatusSelect deal={d} /></td>
              <td><button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); removeItem('deals', d.id) }} style={{ color: 'var(--ink-3)' }}>✕</button></td>
            </tr>
          ))}
          {deals.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 24 }}>해당 건이 없습니다 ✓</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Expenses({ s, m, onEdit }) {
  const cats = ['고정비', '변동비']
  return (
    <>
      <div className="tbl-wrap" style={{ marginBottom: 18 }}>
        <table className="tb">
          <thead><tr><th>항목</th><th>구분</th><th>월</th><th className="r">금액</th><th /></tr></thead>
          <tbody>
            {s.expenses.map((e) => (
              <tr key={e.id} onClick={() => onEdit(e)} style={{ cursor: 'pointer' }} title="클릭해서 수정">
                <td style={{ fontWeight: 650 }}>{e.name}</td>
                <td><span className={'pill ' + (e.cat === '고정비' ? 'line' : 'mid')}>{e.cat}</span></td>
                <td className="mut">{e.month}</td>
                <td className="r"><Won v={e.amount} /></td>
                <td><button className="btn ghost sm" onClick={(ev) => { ev.stopPropagation(); removeItem('expenses', e.id) }} style={{ color: 'var(--ink-3)' }}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ padding: 18, maxWidth: 420 }}>
        <div className="tile-h"><span className="ic">◐</span><span className="t">7월 손익 요약</span></div>
        <PL label="매출 (입금)" v={m.revenue} />
        <PL label="− 외주비" v={-m.outsource} />
        <PL label="− 지출" v={-m.expense} />
        <div style={{ borderTop: '1px solid var(--line)', margin: '8px 0' }} />
        <PL label="= 순이익" v={m.net} bold />
      </div>
    </>
  )
}
function PL({ label, v, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontWeight: bold ? 800 : 500, fontSize: bold ? 15 : 13.5 }}>
      <span className={bold ? '' : 'mut'}>{label}</span>
      <span className="money">{v < 0 ? '−' : ''}₩{Math.abs(v).toLocaleString('ko-KR')}</span>
    </div>
  )
}

export function DealForm({ onClose, onSave, initial }) {
  const store = useStore()
  const [f, setF] = useState(initial
    ? { project: initial.project || '', client: initial.client || '', amount: initial.amount || 0, outsource: initial.outsource || 0, paid: isPaid(initial), taxInvoice: !!initial.taxInvoice, status: initial.status || '계약금대기', month: initial.month || new Date().toISOString().slice(0, 7) }
    : { project: '', client: '', amount: 0, outsource: 0, paid: false, taxInvoice: false, status: '계약금대기', month: new Date().toISOString().slice(0, 7) })
  // 저장 시 O/X를 금액으로 환산 — 입금완료=전액 입금, 미입금=전액 미수 (상단 카드가 이 금액을 합산)
  const save = () => {
    if (!f.project) return
    const { paid, ...rest } = f
    onSave({ ...rest, deposit: paid ? f.amount : 0, balance: paid ? 0 : f.amount })
  }
  const set = (k, num) => (e) => setF({ ...f, [k]: num ? Number(e.target.value || 0) : e.target.value })
  // 프로젝트를 고르면 그 프로젝트의 고객사가 자동으로 채워짐
  const setProject = (e) => {
    const v = e.target.value
    const pj = (store.projects || []).find((p) => p.name === v)
    setF({ ...f, project: v, client: pj?.client || f.client })
  }
  return (
    <Modal title={initial ? '거래 수정 (금액 · 관리자 전용)' : '새 거래 (금액 · 관리자 전용)'} onClose={onClose}
      footer={<><button className="btn sm" onClick={onClose}>취소</button><button className="btn primary sm" onClick={save}>{initial ? '저장' : '추가'}</button></>}>
      <div><label className="fl">프로젝트명</label>
        <SuggestInput value={f.project} autoFocus placeholder="연결할 촬영 건 — 프로젝트 보드·DB에서 제안" onChange={setProject}
          options={(store.projects || []).map((p) => p.name)} /></div>
      <div className="field-row">
        <div><label className="fl">고객사</label>
          <SuggestInput value={f.client} placeholder="고객사 DB에서 제안" onChange={set('client')}
            options={(store.clients || []).map((c) => c.name)} /></div>
        <div><label className="fl">귀속 월</label><input type="month" value={f.month} onChange={set('month')} /></div>
      </div>
      <div className="field-row">
        <div><label className="fl">거래금액</label><MoneyInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} /></div>
        <div><label className="fl">외주송금</label><MoneyInput value={f.outsource} onChange={(v) => setF({ ...f, outsource: v })} /></div>
      </div>
      <div className="field-row">
        <div><label className="fl">입금</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className={'btn sm' + (!f.paid ? ' primary' : '')} onClick={() => setF({ ...f, paid: false })}>✕ 미입금</button>
            <button type="button" className={'btn sm' + (f.paid ? ' primary' : '')} onClick={() => setF({ ...f, paid: true })}>◯ 입금완료</button>
          </div>
        </div>
        <div><label className="fl">상태</label>
          <select value={f.status} onChange={(e) => { const status = e.target.value; setF(status === '완료' ? { ...f, status, paid: true } : { ...f, status }) }}>
            {DEAL_STATUSES.map((st) => <option key={st}>{st}</option>)}
          </select></div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={f.taxInvoice} onChange={(e) => setF({ ...f, taxInvoice: e.target.checked })} /> 세금계산서 발행 완료
      </label>
    </Modal>
  )
}
function ExpForm({ onClose, onSave, initial }) {
  const [f, setF] = useState(initial
    ? { name: initial.name || '', cat: initial.cat || '고정비', amount: initial.amount || 0, month: initial.month || '2026-07' }
    : { name: '', cat: '고정비', amount: 0, month: '2026-07' })
  const set = (k, num) => (e) => setF({ ...f, [k]: num ? Number(e.target.value || 0) : e.target.value })
  return (
    <Modal title={initial ? '지출 수정 (관리자 전용)' : '새 지출 (관리자 전용)'} onClose={onClose}
      footer={<><button className="btn sm" onClick={onClose}>취소</button><button className="btn primary sm" onClick={() => f.name && onSave(f)}>{initial ? '저장' : '추가'}</button></>}>
      <div><label className="fl">항목</label><input value={f.name} autoFocus placeholder="예: 스튜디오 월세" onChange={set('name')} /></div>
      <div className="field-row">
        <div><label className="fl">구분</label><select value={f.cat} onChange={set('cat')}><option>고정비</option><option>변동비</option></select></div>
        <div><label className="fl">금액</label><MoneyInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} /></div>
      </div>
    </Modal>
  )
}
