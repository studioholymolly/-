import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Modal } from '../ui.jsx'
import { useStore } from '../useStore.js'
import { useAuth } from '../auth.jsx'
import { addItem, removeItem, addDays, today, updateConfig } from '../data.js'

/* ============================================================
   견적서 · 계약서 발급기
   - 단가표 프리셋 → 항목 추가 → 자동 합계·VAT → A4 인쇄/PDF
   - 견적서에서 "계약서 만들기"로 금액·고객 자동 이관
   - 저장은 quotes 컬렉션(관리자 전용 RLS) 재사용, docType으로 구분
============================================================ */

const SUPPLIER = {
  studio: 'STUDIO HOLYMOLLY',
  studioKo: '스튜디오 홀리몰리',
  tagline: 'Commercial Visual Studio · Photo · Film · Directing · Branding',
  ceo: '이수민',
  biz: '421-08-02671',
  addr: '서울특별시 강남구 언주로65길 29, B1층',
  account: '카카오뱅크 3333-22-7543305 (이수민)',
  phone: '010-8236-9368',
  email: 'studio_holymolly@naver.com',
}

// 2026 단가표 (촬영 견적표 기준)
const PRESETS = [
  { cat: '촬영비', name: '하프데이_포토그래퍼', desc: '4시간 기준', price: 1500000 },
  { cat: '촬영비', name: '하프데이_스타일리스트', desc: '4시간 기준', price: 700000 },
  { cat: '촬영비', name: '원데이_포토그래퍼', desc: '8시간 기준', price: 3000000 },
  { cat: '촬영비', name: '원데이_스타일리스트', desc: '8시간 기준', price: 1200000 },
  { cat: '기획비', name: '촬영 기획', desc: '무드보드·컨셉·컷 촬영 제안', price: 1000000 },
  { cat: '보정·편집', name: '제품 정밀 보정', desc: '1컷 기준 · 추가 수정 1회 포함', price: 100000 },
  { cat: '보정·편집', name: '인물 정밀 보정', desc: '1컷 기준 · 추가 수정 1회 포함', price: 100000 },
  { cat: '보정·편집', name: '영상·GIF 편집', desc: '1클립 기준 · 색보정·컷 편집 포함', price: 100000 },
  { cat: '보정·편집', name: 'ASAP 긴급 보정', desc: '일반 납기(셀렉일 +7일)보다 단축 납품', price: 300000 },
  { cat: '촬영비', name: '초과 시간_포토그래퍼', desc: '1시간 단위 가산', price: 300000 },
  { cat: '촬영비', name: '초과 시간_스타일리스트', desc: '1시간 단위 가산', price: 150000 },
  { cat: '출장비', name: '출장비_서울', desc: '외부 촬영 시', price: 100000 },
  { cat: '출장비', name: '출장비_경기권', desc: '외부 촬영 시', price: 200000 },
  { cat: '재료비', name: '촬영 연출 비용', desc: '프롭에 필요 재료비 · 영수증 첨부 추후 청구', price: 0 },
]
const CATS = ['촬영비', '기획비', '보정·편집', '재료비', '출장비', '스타일리스트', '외주', '기타']

// 견적 항목 구역 판별: 위쪽(촬영) / 아래쪽(스타일리스트·외주) — 저장된 group이 우선, 없으면 이름·구분으로 추론
export function itemGroup(it) {
  if (it && it.group) return it.group
  return it && (/스타일리스트|외주/.test(it.name || '') || it.cat === '재료비' || it.cat === '외주' || it.cat === '스타일리스트') ? 'outsource' : 'shoot'
}

// 옵션 버튼 그룹 — 견적표(RATE CARD) 구성 그대로, 인덱스는 PRESETS 기준
const PRESET_GROUPS = [
  { label: 'HALF DAY · 4시간', items: [0, 1] },
  { label: 'ONE DAY · 8시간', items: [2, 3] },
  { label: 'ADD-ON · 추가 옵션', items: [4, 5, 6, 7, 8, 9, 10] },
  { label: '출장·재료', items: [11, 12, 13] },
]

// 기본 단가표 (그룹 + 항목 자체 포함) — 커스텀(app_config.docPresets)이 없을 때 사용
const DEFAULT_GROUPS = PRESET_GROUPS.map((g) => ({ label: g.label, items: g.items.map((i) => ({ ...PRESETS[i] })) }))

const DEFAULT_NOTES = [
  '본 견적서의 유효기간은 발행일로부터 30일입니다.',
  '모든 금액은 부가가치세(VAT 10%)가 별도로 표기되어 있습니다.',
  '촬영 진행 확정 시 견적 금액의 50%를 선입금으로 진행되며, 잔금은 작업 완료 후 정산됩니다.',
  '촬영 일정 확정 후 클라이언트 사유로 인한 취소 시 위약금이 발생할 수 있습니다.',
  '스튜디오 및 장비 이용료는 포함입니다.',
]

// 영상 단가표 — 제작 단계별 3구역 (2026 영상 견적표 기준)
const DEFAULT_VIDEO_GROUPS = [
  {
    label: '제작 전 준비단계',
    items: [
      { name: '기획/콘티/사전준비', unit: '1편', price: 2000000, note: '' },
      { name: '로케이션 섭외', unit: '1편', price: 1000000, note: '' },
    ],
  },
  {
    label: '동영상 제작',
    items: [
      { name: '연출', unit: '1편', price: 1000000, note: '' },
      { name: '촬영', unit: '1편', price: 1800000, note: '장비 포함' },
      { name: '조명', unit: '1편', price: 1500000, note: '장비 포함' },
      { name: '헤어 및 메이크업', unit: '1편', price: 1500000, note: '' },
      { name: '미술 및 소품', unit: '1편', price: 2000000, note: '' },
      { name: '현장 진행(식대 및 비품)', unit: '1편', price: 300000, note: '' },
    ],
  },
  {
    label: '제작 후 마무리',
    items: [
      { name: '편집', unit: '1편', price: 1500000, note: '' },
      { name: 'DI', unit: '1편', price: 1000000, note: '' },
    ],
  },
]

const VIDEO_NOTES = [
  '본 견적서의 유효기간은 발행일로부터 30일입니다.',
  '모든 금액은 부가가치세(VAT 10%)가 별도로 표기되어 있습니다.',
  '제작 진행 확정 시 견적 금액의 50%를 선입금으로 진행되며, 잔금은 작업 완료 후 정산됩니다.',
  '촬영 일정 확정 후 클라이언트 사유로 인한 취소 시 위약금이 발생할 수 있습니다.',
  '촬영 장비 및 편집 툴 사용료는 포함입니다.',
]

const fmt = (n) => (Number(n) || 0).toLocaleString('ko-KR')

// 날짜 → "2026년 7월 6일"
function kdate(d) {
  if (!d) return '____년 __월 __일'
  const [y, m, dd] = d.split('-').map(Number)
  return `${y}년 ${m}월 ${dd}일`
}

// 금액 → 한글 (4,620,000 → 사백육십이만)
const KD = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
const KU = ['', '십', '백', '천']
const KG = ['', '만', '억', '조']
export function korAmount(n) {
  n = Math.floor(Number(n) || 0)
  if (n <= 0) return '영'
  let out = ''
  for (let gi = 0; n > 0; gi++) {
    let g = n % 10000, part = ''
    for (let i = 0; g > 0; i++) {
      const d = g % 10
      if (d) part = KD[d] + KU[i] + part
      g = Math.floor(g / 10)
    }
    if (part) out = part + KG[gi] + out
    n = Math.floor(n / 10000)
  }
  return out
}

const emptyItem = () => ({ cat: '촬영비', name: '', desc: '', qty: 1, price: 0 })

// 문서번호 자동 부여 — 저장된 발급 내역에서 올해 최대 번호 +1 (견적 HM-2026-001 / 영상 HM-V-2026-001 / 계약 HM-C-2026-001)
function nextDocNo(docs, type, dateStr) {
  const year = (dateStr || today()).slice(0, 4)
  const prefix = type === 'contract' ? `HM-C-${year}-` : type === 'video' ? `HM-V-${year}-` : `HM-${year}-`
  let max = 0
  docs.forEach((d) => {
    if (d.docNo && d.docNo.startsWith(prefix)) {
      const n = parseInt(d.docNo.slice(prefix.length), 10)
      if (n > max) max = n
    }
  })
  return prefix + String(max + 1).padStart(3, '0')
}

function initQuote() {
  return { docNo: '', client: '', manager: '', phone: '', date: today(), items: [emptyItem()], notes: [...DEFAULT_NOTES], discountAmt: 0, discountPct: 0 }
}
function initVideo() {
  return { docNo: '', client: '', manager: '', phone: '', date: today(), items: [], notes: [...VIDEO_NOTES], discountAmt: 0, discountPct: 0 }
}
function initContract() {
  const t = today()
  return {
    docNo: '', client: '', ceo: '', addr: '', phone: '',
    total: 0, depositPct: 50,
    retouchFee: 100000, reviseFee: 10000, // 보정 1컷 / 초과 수정 1컷 단가 (제8조)
    cDate: t, termStart: t, termEnd: '',
    workStart: '', workEnd: '', delivDate: '',
    depositDue: '', balanceDue: '',
    portfolio: 'allow', // allow | after | deny — 포트폴리오 게재 조항
    signG: '', signE: '', // 서명 이미지 (dataURL)
  }
}

function quoteTotals(q) {
  const subtotal = q.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
  // 네고(할인) — %할인 먼저 계산 후 금액 할인 합산, 할인 적용가에 VAT 부과
  const discPct = Math.round(subtotal * (Number(q.discountPct) || 0) / 100)
  const discount = Math.min(subtotal, discPct + (Number(q.discountAmt) || 0))
  const net = subtotal - discount
  const vat = Math.round(net * 0.1)
  return { subtotal, discPct, discount, net, vat, total: net + vat }
}

export default function Docs() {
  const store = useStore()
  const auth = useAuth() || {}
  const user = auth.user
  const [tab, setTab] = useState('quote') // quote | video | contract | history
  const [quote, setQuote] = useState(initQuote)
  const [video, setVideo] = useState(initVideo)
  const [contract, setContract] = useState(initContract)
  const [savedMsg, setSavedMsg] = useState('')

  const tq = quoteTotals(quote)
  const tv = quoteTotals(video)
  const uq = (patch) => setQuote((q) => ({ ...q, ...patch }))
  const uv = (patch) => setVideo((v) => ({ ...v, ...patch }))
  const uc = (patch) => setContract((c) => ({ ...c, ...patch }))

  // 단가표 — 편집본이 저장돼 있으면 그걸, 없으면 기본값 (app_config로 모든 기기 동기화)
  const presetGroups = (store.config?.docPresets?.length ? store.config.docPresets : DEFAULT_GROUPS)
  const videoGroups = (store.config?.videoPresets?.length ? store.config.videoPresets : DEFAULT_VIDEO_GROUPS)

  // 옵션 버튼 클릭 — 이미 담긴 항목이면 수량 +1, 아니면 새 행 추가
  function addPresetItem(p) {
    setQuote((q) => {
      const idx = q.items.findIndex((it) => it.name === p.name)
      if (idx >= 0) return { ...q, items: q.items.map((it, j) => (j === idx ? { ...it, qty: (Number(it.qty) || 0) + 1 } : it)) }
      return { ...q, items: [...q.items.filter((it) => it.name || Number(it.price) > 0), { ...p, qty: 1 }] }
    })
  }
  // 옵션 버튼의 − 클릭 — 수량 −1, 1에서 누르면 항목 제거
  function decPresetItem(p) {
    setQuote((q) => {
      const idx = q.items.findIndex((it) => it.name === p.name)
      if (idx < 0) return q
      const qty = Number(q.items[idx].qty) || 0
      const items = qty > 1
        ? q.items.map((it, j) => (j === idx ? { ...it, qty: qty - 1 } : it))
        : q.items.filter((_, j) => j !== idx)
      return { ...q, items: items.length ? items : [emptyItem()] }
    })
  }
  function setItem(i, patch) {
    setQuote((q) => ({ ...q, items: q.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }))
  }
  function delItem(i) {
    setQuote((q) => ({ ...q, items: q.items.length > 1 ? q.items.filter((_, j) => j !== i) : [emptyItem()] }))
  }

  // 영상 견적 — 옵션 버튼 클릭 시 담기 (이미 담긴 항목이면 수량 +1)
  function addVideoItem(stage, p) {
    setVideo((v) => {
      const idx = v.items.findIndex((it) => it.name === p.name && it.stage === stage)
      if (idx >= 0) return { ...v, items: v.items.map((it, j) => (j === idx ? { ...it, qty: (Number(it.qty) || 0) + 1 } : it)) }
      return { ...v, items: [...v.items, { stage, name: p.name, unit: p.unit || '1편', note: p.note || '', qty: 1, price: p.price }] }
    })
  }
  function decVideoItem(stage, p) {
    setVideo((v) => {
      const idx = v.items.findIndex((it) => it.name === p.name && it.stage === stage)
      if (idx < 0) return v
      const qty = Number(v.items[idx].qty) || 0
      const items = qty > 1
        ? v.items.map((it, j) => (j === idx ? { ...it, qty: qty - 1 } : it))
        : v.items.filter((_, j) => j !== idx)
      return { ...v, items }
    })
  }
  function setVideoItem(i, patch) {
    setVideo((v) => ({ ...v, items: v.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }))
  }
  function delVideoItem(i) {
    setVideo((v) => ({ ...v, items: v.items.filter((_, j) => j !== i) }))
  }

  // 견적 → 계약서로 이관 (사진·영상 공통)
  function toContract() {
    const src = tab === 'video'
      ? { client: video.client, phone: video.phone, total: tv.total }
      : { client: quote.client, phone: quote.phone, total: tq.total }
    setContract((c) => ({ ...c, client: src.client || c.client, phone: src.phone || c.phone, total: src.total, cDate: today() }))
    setTab('contract')
  }

  // 고객사 DB에서 선택 — 이름·담당자·연락처는 DB에서, 주소·대표자는 이전 발급 문서에서 재사용
  function pickClient(name) {
    if (!name) return
    const c = (store.clients || []).find((x) => x.name === name)
    if (!c) return
    const prev = (store.quotes || []).find((d) => d.client === name) // 최신순 정렬이라 첫 건이 가장 최근
    const phone = c.phone || (c.contacts || []).find((ct) => ct.phone)?.phone || (prev && prev.phone) || ''
    if (tab === 'quote') {
      uq({ client: c.name, manager: c.contact || '', phone })
    } else if (tab === 'video') {
      uv({ client: c.name, manager: c.contact || '', phone })
    } else {
      uc({ client: c.name, phone, addr: (prev && prev.addr) || '', ceo: (prev && prev.ceo) || '' })
    }
  }

  function flash(msg) { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 2500) }

  // 문서번호 — 저장 전엔 다음 번호를 미리 보여주고, 저장 시점에 확정
  const quoteNo = quote.docNo || nextDocNo(store.quotes || [], 'quote', quote.date)
  const videoNo = video.docNo || nextDocNo(store.quotes || [], 'video', video.date)
  const contractNo = contract.docNo || nextDocNo(store.quotes || [], 'contract', contract.cDate)

  function saveQuote() {
    if (!user) return alert('로그인 후 저장할 수 있습니다.')
    setQuote((q) => ({ ...q, docNo: quoteNo }))
    addItem('quotes', {
      docType: 'quote', docNo: quoteNo, client: quote.client, manager: quote.manager, phone: quote.phone,
      date: quote.date, items: quote.items.filter((it) => it.name), notes: quote.notes,
      discountAmt: Number(quote.discountAmt) || 0, discountPct: Number(quote.discountPct) || 0,
      subtotal: tq.subtotal, discount: tq.discount, vat: tq.vat, total: tq.total,
    }, user.id)
    flash(`${quoteNo} 저장했습니다 ✓`)
  }
  function saveVideo() {
    if (!user) return alert('로그인 후 저장할 수 있습니다.')
    setVideo((v) => ({ ...v, docNo: videoNo }))
    addItem('quotes', {
      docType: 'video', docNo: videoNo, client: video.client, manager: video.manager, phone: video.phone,
      date: video.date, items: video.items.filter((it) => it.name), notes: video.notes,
      discountAmt: Number(video.discountAmt) || 0, discountPct: Number(video.discountPct) || 0,
      subtotal: tv.subtotal, discount: tv.discount, vat: tv.vat, total: tv.total,
    }, user.id)
    flash(`${videoNo} 저장했습니다 ✓`)
  }
  function saveContract() {
    if (!user) return alert('로그인 후 저장할 수 있습니다.')
    setContract((c) => ({ ...c, docNo: contractNo }))
    addItem('quotes', { docType: 'contract', ...contract, docNo: contractNo, date: contract.cDate }, user.id)
    flash(`${contractNo} 저장했습니다 ✓`)
  }
  function loadDoc(d) {
    if (d.docType === 'contract') {
      const { id, docType, createdBy, date, ...rest } = d
      setContract({ ...initContract(), ...rest })
      setTab('contract')
    } else if (d.docType === 'video') {
      setVideo({
        docNo: d.docNo || '', client: d.client || '', manager: d.manager || '', phone: d.phone || '',
        date: d.date || today(), items: d.items || [],
        notes: d.notes && d.notes.length ? d.notes : [...VIDEO_NOTES],
        discountAmt: d.discountAmt || 0, discountPct: d.discountPct || 0,
      })
      setTab('video')
    } else {
      setQuote({
        docNo: d.docNo || '', client: d.client || '', manager: d.manager || '', phone: d.phone || '',
        date: d.date || today(), items: (d.items && d.items.length ? d.items : [emptyItem()]),
        notes: d.notes && d.notes.length ? d.notes : [...DEFAULT_NOTES],
        discountAmt: d.discountAmt || 0, discountPct: d.discountPct || 0,
      })
      setTab('quote')
    }
  }

  // 인쇄·PDF 저장 — 브라우저가 document.title을 PDF 기본 파일명으로 쓰므로 인쇄 동안만 바꿔치기
  function printDoc() {
    const label = tab === 'contract' ? '계약서' : '견적서'
    const client = (tab === 'contract' ? contract.client : tab === 'video' ? video.client : quote.client) || '고객미입력'
    const date = ((tab === 'contract' ? contract.cDate : tab === 'video' ? video.date : quote.date) || today()).replaceAll('-', '')
    const prev = document.title
    document.title = `${label}_${date}_${client}`
    window.print()
    setTimeout(() => { document.title = prev }, 1000)
  }

  const deposit = Math.round((Number(contract.total) || 0) * (Number(contract.depositPct) || 0) / 100)
  const balance = (Number(contract.total) || 0) - deposit
  const reviseEnd = contract.workEnd ? addDays(contract.delivDate || contract.workEnd, 5) : ''
  const payDeadline = contract.balanceDue || (contract.workEnd ? addDays(contract.workEnd, 20) : '')
  const termEnd = contract.termEnd || contract.balanceDue || contract.workEnd

  const paper = tab === 'contract'
    ? <ContractPaper c={contract} docNo={contractNo} deposit={deposit} balance={balance} reviseEnd={reviseEnd} payDeadline={payDeadline} termEnd={termEnd} />
    : tab === 'video'
      ? <VideoPaper v={video} docNo={videoNo} t={tv} groups={videoGroups} />
      : <QuotePaper q={quote} docNo={quoteNo} t={tq} />

  return (
    <div className="docs-wrap">
      <div className="docs-tabs">
        <button className={'btn sm' + (tab === 'quote' ? ' primary' : '')} onClick={() => setTab('quote')}>사진 견적서</button>
        <button className={'btn sm' + (tab === 'video' ? ' primary' : '')} onClick={() => setTab('video')}>영상 견적서</button>
        <button className={'btn sm' + (tab === 'contract' ? ' primary' : '')} onClick={() => setTab('contract')}>계약서</button>
        <button className={'btn sm' + (tab === 'glance' ? ' primary' : '')} onClick={() => setTab('glance')}>한눈에 보기</button>
        <button className={'btn sm' + (tab === 'history' ? ' primary' : '')} onClick={() => setTab('history')}>발급 내역 <span className="num">{(store.quotes || []).length}</span></button>
        <div className="sp" />
        {savedMsg && <span className="docs-saved">{savedMsg}</span>}
        {tab !== 'history' && tab !== 'glance' && (
          <>
            {(tab === 'quote' || tab === 'video') && <button className="btn sm" onClick={toContract}>이 견적으로 계약서 만들기 →</button>}
            <button className="btn sm" onClick={tab === 'quote' ? saveQuote : tab === 'video' ? saveVideo : saveContract}>저장</button>
            <button className="btn sm primary" onClick={printDoc}>⎙ 인쇄 · PDF 저장</button>
          </>
        )}
      </div>

      {tab === 'history' ? (
        <History docs={store.quotes || []} onLoad={loadDoc} />
      ) : tab === 'glance' ? (
        <Glance docs={store.quotes || []} onLoad={loadDoc} />
      ) : tab === 'quote' ? (
        <div className="docs-grid docs-grid3">
          <div className="docs-form card">
            <QuoteForm q={quote} uq={uq} addPresetItem={addPresetItem} decPresetItem={decPresetItem} clients={store.clients || []} onPick={pickClient} presetGroups={presetGroups} />
          </div>
          <div className="docs-form card">
            <QuoteCart q={quote} uq={uq} setItem={setItem} delItem={delItem} t={tq} />
          </div>
          <div className="docs-preview">
            <FitZoom>{paper}</FitZoom>
          </div>
        </div>
      ) : tab === 'video' ? (
        <div className="docs-grid docs-grid3">
          <div className="docs-form card">
            <VideoForm v={video} uv={uv} addVideoItem={addVideoItem} decVideoItem={decVideoItem} clients={store.clients || []} onPick={pickClient} groups={videoGroups} />
          </div>
          <div className="docs-form card">
            <VideoCart v={video} uv={uv} setItem={setVideoItem} delItem={delVideoItem} t={tv} groups={videoGroups} />
          </div>
          <div className="docs-preview">
            <FitZoom>{paper}</FitZoom>
          </div>
        </div>
      ) : (
        <div className="docs-grid">
          <div className="docs-form card">
            <ContractForm c={contract} uc={uc} deposit={deposit} balance={balance} clients={store.clients || []} onPick={pickClient} />
          </div>
          <div className="docs-preview">
            <FitZoom>{paper}</FitZoom>
          </div>
        </div>
      )}

      {/* 인쇄 전용 마운트 — 화면에선 숨김, 인쇄 시 이것만 출력 */}
      {createPortal(<div className="print-mount">{paper}</div>, document.body)}
    </div>
  )
}

/* ---------------- A4 미리보기 — 칸 폭에 맞춰 자동 축척 (잘림 방지) ---------------- */
const A4_PX = 794 // 210mm @ 96dpi
function FitZoom({ children }) {
  const ref = useRef(null)
  const [z, setZ] = useState(0.68)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const w = el.clientWidth - 46 // 좌우 패딩 22px + 보더
      if (w > 0) setZ(Math.min(1, Math.max(0.3, w / A4_PX)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return <div className="doc-zoom" ref={ref} style={{ '--doczoom': z }}>{children}</div>
}

/* ---------------- 견적서 입력 폼 ---------------- */
function ClientPicker({ clients, onPick }) {
  return (
    <div className="ed-field docs-clientpick">
      <label>◈ 고객사 DB에서 선택 — 아래 칸 자동 작성</label>
      <select value="" onChange={(e) => onPick(e.target.value)} disabled={!clients.length}>
        <option value="">
          {clients.length ? '고객사를 선택하세요…' : '고객사 DB가 비어 있습니다 — 사이드바 [고객사 DB]에서 먼저 추가'}
        </option>
        {clients.map((c) => <option key={c.id} value={c.name}>{c.name}{c.contact ? ` · ${c.contact}` : ''}</option>)}
      </select>
    </div>
  )
}

function QuoteForm({ q, uq, addPresetItem, decPresetItem, clients, onPick, presetGroups }) {
  // 단가표 편집 — 열 때 사본(draft)을 만들어 수정하고, 저장 시 app_config.docPresets에 반영
  const [draft, setDraft] = useState(null)
  const editing = draft !== null
  const startEdit = () => setDraft(presetGroups.map((g) => ({ label: g.label, items: g.items.map((it) => ({ ...it })) })))
  const setGroup = (gi, patch) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, ...patch } : g)))
  const setPreset = (gi, ii, patch) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, items: g.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : g)))
  const addPreset = (gi) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, items: [...g.items, { cat: '기타', name: '', desc: '', price: 0 }] } : g)))
  const delPreset = (gi, ii) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g)))
  const addGroup = () => setDraft((d) => [...d, { label: '새 그룹', items: [{ cat: '기타', name: '', desc: '', price: 0 }] }])
  const delGroup = (gi) => {
    if (confirm(`"${draft[gi].label || '이 그룹'}" 그룹과 안의 옵션을 모두 삭제할까요?`)) setDraft((d) => d.filter((_, i) => i !== gi))
  }
  const saveEdit = () => {
    const cleaned = draft
      .map((g) => ({ label: g.label.trim() || '그룹', items: g.items.filter((it) => it.name.trim()) }))
      .filter((g) => g.items.length)
    updateConfig({ docPresets: cleaned })
    setDraft(null)
  }
  const resetPresets = () => {
    if (!confirm('단가표를 기본값으로 되돌릴까요? 편집한 내용이 모두 사라집니다.')) return
    updateConfig({ docPresets: null })
    setDraft(null)
  }
  return (
    <div className="docs-form-in">
      <div className="docs-sec">수신 정보</div>
      <ClientPicker clients={clients} onPick={onPick} />
      <div className="ed-row2">
        <div className="ed-field"><label>Client (회사·브랜드)</label><input value={q.client} onChange={(e) => uq({ client: e.target.value })} placeholder="예: 클랑" /></div>
        <div className="ed-field"><label>담당자</label><input value={q.manager} onChange={(e) => uq({ manager: e.target.value })} placeholder="예: 김주희 님" /></div>
      </div>
      <div className="ed-row2">
        <div className="ed-field"><label>연락처</label><input value={q.phone} onChange={(e) => uq({ phone: e.target.value })} placeholder="010-0000-0000" /></div>
        <div className="ed-field"><label>견적일자</label><input type="date" value={q.date} onChange={(e) => uq({ date: e.target.value })} /></div>
      </div>

      <div className="docs-sec docs-sec-row">
        <span>
          {editing ? '단가표 편집' : '견적 항목 — 옵션을 눌러 담으세요'}{' '}
          <span className="mut3" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
            {editing ? '(품명이 비면 저장 시 제외됩니다)' : '(다시 누르면 수량 +1 · − 로 빼기)'}
          </span>
        </span>
        {editing ? (
          <span style={{ display: 'flex', gap: 6, flex: 'none' }}>
            <button className="btn sm ghost" onClick={() => setDraft(null)}>취소</button>
            <button className="btn sm primary" onClick={saveEdit}>✓ 저장</button>
          </span>
        ) : (
          <button className="btn sm ghost" style={{ flex: 'none' }} onClick={startEdit} title="옵션 버튼의 이름·설명·단가를 수정합니다">✎ 단가 편집</button>
        )}
      </div>
      {editing ? (
        <>
          {draft.map((g, gi) => (
            <div key={gi} className="docs-pe-group">
              <div className="docs-pe-ghead">
                <input value={g.label} onChange={(e) => setGroup(gi, { label: e.target.value })} placeholder="그룹 이름 (예: 출장·재료)" />
                <button className="btn sm ghost" onClick={() => delGroup(gi)} title="그룹 삭제">✕ 그룹</button>
              </div>
              {g.items.map((p, ii) => (
                <div className="docs-item" key={ii}>
                  <div className="docs-item-row1">
                    <select value={p.cat} onChange={(e) => setPreset(gi, ii, { cat: e.target.value })} style={{ width: 96, flex: 'none' }}>
                      {CATS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input value={p.name} onChange={(e) => setPreset(gi, ii, { name: e.target.value })} placeholder="품명 (예: 출장비_서울)" />
                    <button className="btn sm ghost" onClick={() => delPreset(gi, ii)} title="옵션 삭제">✕</button>
                  </div>
                  <div className="docs-item-row2">
                    <input value={p.desc} onChange={(e) => setPreset(gi, ii, { desc: e.target.value })} placeholder="내용 (예: 외부 촬영 시)" />
                    <span className="docs-price-in">
                      <input className="num" inputMode="numeric" value={Number(p.price) ? fmt(p.price) : ''} placeholder="0"
                        onChange={(e) => setPreset(gi, ii, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} title="단가 (0이면 '별도' 표기)" />
                      <span className="docs-price-won">원</span>
                    </span>
                  </div>
                </div>
              ))}
              <button className="btn sm ghost" onClick={() => addPreset(gi)}>+ 옵션 추가</button>
            </div>
          ))}
          <div className="docs-preset-row">
            <button className="btn sm" onClick={addGroup}>+ 그룹 추가</button>
            <span className="sp" style={{ flex: 1 }} />
            <button className="btn sm ghost" onClick={resetPresets}>기본값 복원</button>
          </div>
        </>
      ) : (
        <>
          {presetGroups.map((g, gi) => (
            <div key={gi} className="docs-chip-group">
              <div className="docs-chip-lbl">{g.label}</div>
              <div className="docs-chips">
                {g.items.map((p, pi) => {
                  const inCart = q.items.find((it) => it.name === p.name)
                  return (
                    <div key={pi} className={'docs-chip' + (inCart ? ' on' : '')} role="button" tabIndex={0}
                      onClick={() => addPresetItem(p)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addPresetItem(p) } }}>
                      <b>{p.name.replace('_', ' · ')}</b>
                      <small className="num">{p.price ? fmt(p.price) + '원' : '별도'}{inCart ? ` × ${inCart.qty}` : ''}</small>
                      {inCart && (
                        <span className="docs-chip-minus" title="수량 빼기 (1에서 누르면 삭제)"
                          onClick={(e) => { e.stopPropagation(); decPresetItem(p) }}>−</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="docs-preset-row">
            <button className="btn sm" onClick={() => uq({ items: [...q.items, emptyItem()] })}>+ 직접 입력</button>
          </div>
        </>
      )}

    </div>
  )
}

/* ---------------- 담긴 항목 (실제 견적에 들어가는 내용) ---------------- */
function QuoteCart({ q, uq, setItem, delItem, t }) {
  const live = q.items.filter((it) => it.name || Number(it.price) || Number(it.qty))
  const itemRow = (it, i) => (
    <div className="docs-item" key={i}>
      <div className="docs-item-row1">
        <select value={it.cat} onChange={(e) => setItem(i, { cat: e.target.value })} style={{ width: 96, flex: 'none' }}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="품명" />
        <button className="btn sm ghost" onClick={() => delItem(i)} title="삭제">✕</button>
      </div>
      <div className="docs-item-row2">
        <input value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} placeholder="내용 (예: 8시간 기준)" />
        <button className="btn sm ghost docs-qty-btn" onClick={() => setItem(i, { qty: Math.max(0, (Number(it.qty) || 0) - 1) })} title="수량 −1">−</button>
        <input className="num" type="number" min="0" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} title="수량" style={{ width: 56, flex: 'none' }} />
        <button className="btn sm ghost docs-qty-btn" onClick={() => setItem(i, { qty: (Number(it.qty) || 0) + 1 })} title="수량 +1">＋</button>
        <span className="docs-price-in">
          <input className="num" inputMode="numeric" value={Number(it.price) ? fmt(it.price) : ''} placeholder="0"
            onChange={(e) => setItem(i, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} title="단가" />
          <span className="docs-price-won">원</span>
        </span>
        <span className="docs-item-sum num">{fmt((Number(it.qty) || 0) * (Number(it.price) || 0))}원</span>
      </div>
    </div>
  )
  const rowsOf = (g) => q.items.map((it, i) => [it, i]).filter(([it]) => (itemGroup(it) === 'outsource') === (g === 'outsource')).map(([it, i]) => itemRow(it, i))
  const addTo = (g) => () => uq({ items: [...q.items, { cat: g === 'outsource' ? '외주' : '촬영비', name: '', desc: '', qty: 1, price: 0, group: g }] })
  return (
    <div className="docs-form-in">
      {live.length === 0 && (
        <p className="mut3" style={{ fontSize: 12.5, lineHeight: 1.7, padding: '8px 0' }}>
          아직 담긴 항목이 없습니다 — 왼쪽 옵션 버튼을 눌러 담아보세요.
        </p>
      )}
      <div className="docs-sec">① 포토그래퍼 촬영비 <span className="mut3" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>— 견적서 위쪽 구역 · 권장 5</span></div>
      {rowsOf('shoot')}
      <button className="btn sm ghost" onClick={addTo('shoot')}>+ 촬영 항목 추가</button>
      <div className="docs-sec">② 스타일리스트 · 외주 <span className="mut3" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>— 견적서 아래쪽 구역 · 권장 5</span></div>
      {rowsOf('outsource')}
      <button className="btn sm ghost" onClick={addTo('outsource')}>+ 외주 항목 추가</button>

      <div className="docs-sec">네고 · 할인 <span className="mut3" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(공급가액에서 차감 — %와 금액 동시 적용 가능)</span></div>
      <div className="ed-row2">
        <div className="ed-field"><label>할인율 (%)</label><input className="num" type="number" min="0" max="100" value={q.discountPct} onChange={(e) => uq({ discountPct: e.target.value })} placeholder="예: 10" /></div>
        <div className="ed-field"><label>할인 금액 (원)</label><input className="num" type="number" min="0" step="10000" value={q.discountAmt} onChange={(e) => uq({ discountAmt: e.target.value })} placeholder="예: 200000" /></div>
      </div>

      <div className="docs-totals">
        <div><span>공급가액</span><b className="num">{fmt(t.subtotal)} 원</b></div>
        {t.discount > 0 && (
          <>
            <div className="docs-disc"><span>네고 할인{Number(q.discountPct) > 0 ? ` (${q.discountPct}%${Number(q.discountAmt) > 0 ? ' + 금액' : ''})` : ''}</span><b className="num">− {fmt(t.discount)} 원</b></div>
            <div><span>할인 적용가</span><b className="num">{fmt(t.net)} 원</b></div>
          </>
        )}
        <div><span>부가세 10%</span><b className="num">{fmt(t.vat)} 원</b></div>
        <div className="grand"><span>총 결제금액</span><b className="num">{fmt(t.total)} 원</b></div>
      </div>

      <div className="docs-sec">안내사항</div>
      {q.notes.map((n, i) => (
        <div className="docs-note-row" key={i}>
          <input value={n} onChange={(e) => uq({ notes: q.notes.map((x, j) => (j === i ? e.target.value : x)) })} />
          <button className="btn sm ghost" onClick={() => uq({ notes: q.notes.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button className="btn sm ghost" onClick={() => uq({ notes: [...q.notes, ''] })}>+ 안내 추가</button>
    </div>
  )
}

/* ---------------- 영상 견적서 입력 폼 ---------------- */
function VideoForm({ v, uv, addVideoItem, decVideoItem, clients, onPick, groups }) {
  // 단가표 편집 — 사진 견적과 동일 패턴, app_config.videoPresets에 저장
  const [draft, setDraft] = useState(null)
  const editing = draft !== null
  const startEdit = () => setDraft(groups.map((g) => ({ label: g.label, items: g.items.map((it) => ({ ...it })) })))
  const setGroup = (gi, patch) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, ...patch } : g)))
  const setPreset = (gi, ii, patch) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, items: g.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : g)))
  const addPreset = (gi) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, items: [...g.items, { name: '', unit: '1편', price: 0, note: '' }] } : g)))
  const delPreset = (gi, ii) => setDraft((d) => d.map((g, i) => (i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g)))
  const addGroup = () => setDraft((d) => [...d, { label: '새 단계', items: [{ name: '', unit: '1편', price: 0, note: '' }] }])
  const delGroup = (gi) => {
    if (confirm(`"${draft[gi].label || '이 단계'}" 단계와 안의 옵션을 모두 삭제할까요?`)) setDraft((d) => d.filter((_, i) => i !== gi))
  }
  const saveEdit = () => {
    const cleaned = draft
      .map((g) => ({ label: g.label.trim() || '단계', items: g.items.filter((it) => it.name.trim()) }))
      .filter((g) => g.items.length)
    updateConfig({ videoPresets: cleaned })
    setDraft(null)
  }
  const resetPresets = () => {
    if (!confirm('영상 단가표를 기본값으로 되돌릴까요? 편집한 내용이 모두 사라집니다.')) return
    updateConfig({ videoPresets: null })
    setDraft(null)
  }
  return (
    <div className="docs-form-in">
      <div className="docs-sec">수신 정보</div>
      <ClientPicker clients={clients} onPick={onPick} />
      <div className="ed-row2">
        <div className="ed-field"><label>Client (회사·브랜드)</label><input value={v.client} onChange={(e) => uv({ client: e.target.value })} placeholder="예: 클랑" /></div>
        <div className="ed-field"><label>담당자</label><input value={v.manager} onChange={(e) => uv({ manager: e.target.value })} placeholder="예: 김주희 님" /></div>
      </div>
      <div className="ed-row2">
        <div className="ed-field"><label>연락처</label><input value={v.phone} onChange={(e) => uv({ phone: e.target.value })} placeholder="010-0000-0000" /></div>
        <div className="ed-field"><label>견적일자</label><input type="date" value={v.date} onChange={(e) => uv({ date: e.target.value })} /></div>
      </div>

      <div className="docs-sec docs-sec-row">
        <span>
          {editing ? '영상 단가표 편집' : '견적 항목 — 옵션을 눌러 담으세요'}{' '}
          <span className="mut3" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
            {editing ? '(품명이 비면 저장 시 제외됩니다)' : '(다시 누르면 수량 +1 · − 로 빼기)'}
          </span>
        </span>
        {editing ? (
          <span style={{ display: 'flex', gap: 6, flex: 'none' }}>
            <button className="btn sm ghost" onClick={() => setDraft(null)}>취소</button>
            <button className="btn sm primary" onClick={saveEdit}>✓ 저장</button>
          </span>
        ) : (
          <button className="btn sm ghost" style={{ flex: 'none' }} onClick={startEdit} title="옵션 버튼의 이름·단위·단가·비고를 수정합니다">✎ 단가 편집</button>
        )}
      </div>
      {editing ? (
        <>
          {draft.map((g, gi) => (
            <div key={gi} className="docs-pe-group">
              <div className="docs-pe-ghead">
                <input value={g.label} onChange={(e) => setGroup(gi, { label: e.target.value })} placeholder="단계 이름 (예: 동영상 제작)" />
                <button className="btn sm ghost" onClick={() => delGroup(gi)} title="단계 삭제">✕ 단계</button>
              </div>
              {g.items.map((p, ii) => (
                <div className="docs-item" key={ii}>
                  <div className="docs-item-row1">
                    <input value={p.name} onChange={(e) => setPreset(gi, ii, { name: e.target.value })} placeholder="품명 (예: 촬영)" />
                    <input value={p.unit || ''} onChange={(e) => setPreset(gi, ii, { unit: e.target.value })} placeholder="단위" style={{ width: 64, flex: 'none' }} />
                    <button className="btn sm ghost" onClick={() => delPreset(gi, ii)} title="옵션 삭제">✕</button>
                  </div>
                  <div className="docs-item-row2">
                    <input value={p.note || ''} onChange={(e) => setPreset(gi, ii, { note: e.target.value })} placeholder="비고 (예: 장비 포함)" />
                    <span className="docs-price-in">
                      <input className="num" inputMode="numeric" value={Number(p.price) ? fmt(p.price) : ''} placeholder="0"
                        onChange={(e) => setPreset(gi, ii, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} title="단가 (0이면 '별도' 표기)" />
                      <span className="docs-price-won">원</span>
                    </span>
                  </div>
                </div>
              ))}
              <button className="btn sm ghost" onClick={() => addPreset(gi)}>+ 옵션 추가</button>
            </div>
          ))}
          <div className="docs-preset-row">
            <button className="btn sm" onClick={addGroup}>+ 단계 추가</button>
            <span className="sp" style={{ flex: 1 }} />
            <button className="btn sm ghost" onClick={resetPresets}>기본값 복원</button>
          </div>
        </>
      ) : (
        <>
          {groups.map((g, gi) => (
            <div key={gi} className="docs-chip-group">
              <div className="docs-chip-lbl">{gi + 1}. {g.label}</div>
              <div className="docs-chips">
                {g.items.map((p, pi) => {
                  const inCart = v.items.find((it) => it.name === p.name && it.stage === g.label)
                  return (
                    <div key={pi} className={'docs-chip' + (inCart ? ' on' : '')} role="button" tabIndex={0}
                      onClick={() => addVideoItem(g.label, p)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addVideoItem(g.label, p) } }}>
                      <b>{p.name}</b>
                      <small className="num">{p.price ? fmt(p.price) + '원' : '별도'}{inCart ? ` × ${inCart.qty}` : ''}{p.note ? ` · ${p.note}` : ''}</small>
                      {inCart && (
                        <span className="docs-chip-minus" title="수량 빼기 (1에서 누르면 삭제)"
                          onClick={(e) => { e.stopPropagation(); decVideoItem(g.label, p) }}>−</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

/* ---------------- 영상 견적 — 담긴 항목 ---------------- */
function VideoCart({ v, uv, setItem, delItem, t, groups }) {
  const labels = groups.map((g) => g.label)
  const itemRow = (it, i) => (
    <div className="docs-item" key={i}>
      <div className="docs-item-row1">
        <input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="품명" />
        <input value={it.note || ''} onChange={(e) => setItem(i, { note: e.target.value })} placeholder="비고" style={{ width: 110, flex: 'none' }} />
        <button className="btn sm ghost" onClick={() => delItem(i)} title="삭제">✕</button>
      </div>
      <div className="docs-item-row2">
        <input value={it.unit || ''} onChange={(e) => setItem(i, { unit: e.target.value })} placeholder="단위" style={{ width: 64, flex: 'none' }} />
        <button className="btn sm ghost docs-qty-btn" onClick={() => setItem(i, { qty: Math.max(0, (Number(it.qty) || 0) - 1) })} title="수량 −1">−</button>
        <input className="num" type="number" min="0" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} title="수량" style={{ width: 56, flex: 'none' }} />
        <button className="btn sm ghost docs-qty-btn" onClick={() => setItem(i, { qty: (Number(it.qty) || 0) + 1 })} title="수량 +1">＋</button>
        <span className="docs-price-in">
          <input className="num" inputMode="numeric" value={Number(it.price) ? fmt(it.price) : ''} placeholder="0"
            onChange={(e) => setItem(i, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} title="단가" />
          <span className="docs-price-won">원</span>
        </span>
        <span className="docs-item-sum num">{fmt((Number(it.qty) || 0) * (Number(it.price) || 0))}원</span>
      </div>
    </div>
  )
  const rowsOf = (label) => v.items.map((it, i) => [it, i]).filter(([it]) => (it.stage || labels[0]) === label).map(([it, i]) => itemRow(it, i))
  const others = v.items.map((it, i) => [it, i]).filter(([it]) => !labels.includes(it.stage || labels[0]))
  const addTo = (label) => () => uv({ items: [...v.items, { stage: label, name: '', unit: '1편', note: '', qty: 1, price: 0 }] })
  return (
    <div className="docs-form-in">
      {v.items.length === 0 && (
        <p className="mut3" style={{ fontSize: 12.5, lineHeight: 1.7, padding: '8px 0' }}>
          아직 담긴 항목이 없습니다 — 왼쪽 옵션 버튼을 눌러 담아보세요.
        </p>
      )}
      {labels.map((label, gi) => (
        <div key={label}>
          <div className="docs-sec">{'①②③④⑤⑥⑦⑧⑨'[gi] || '·'} {label}</div>
          {rowsOf(label)}
          <button className="btn sm ghost" onClick={addTo(label)}>+ 항목 추가</button>
        </div>
      ))}
      {others.length > 0 && (
        <div>
          <div className="docs-sec">기타</div>
          {others.map(([it, i]) => itemRow(it, i))}
        </div>
      )}

      <div className="docs-sec">네고 · 할인 <span className="mut3" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(공급가액에서 차감 — %와 금액 동시 적용 가능)</span></div>
      <div className="ed-row2">
        <div className="ed-field"><label>할인율 (%)</label><input className="num" type="number" min="0" max="100" value={v.discountPct} onChange={(e) => uv({ discountPct: e.target.value })} placeholder="예: 10" /></div>
        <div className="ed-field"><label>할인 금액 (원)</label><input className="num" type="number" min="0" step="10000" value={v.discountAmt} onChange={(e) => uv({ discountAmt: e.target.value })} placeholder="예: 200000" /></div>
      </div>

      <div className="docs-totals">
        <div><span>공급가액</span><b className="num">{fmt(t.subtotal)} 원</b></div>
        {t.discount > 0 && (
          <>
            <div className="docs-disc"><span>네고 할인{Number(v.discountPct) > 0 ? ` (${v.discountPct}%${Number(v.discountAmt) > 0 ? ' + 금액' : ''})` : ''}</span><b className="num">− {fmt(t.discount)} 원</b></div>
            <div><span>할인 적용가</span><b className="num">{fmt(t.net)} 원</b></div>
          </>
        )}
        <div><span>부가세 10%</span><b className="num">{fmt(t.vat)} 원</b></div>
        <div className="grand"><span>총 결제금액</span><b className="num">{fmt(t.total)} 원</b></div>
      </div>

      <div className="docs-sec">안내사항</div>
      {v.notes.map((n, i) => (
        <div className="docs-note-row" key={i}>
          <input value={n} onChange={(e) => uv({ notes: v.notes.map((x, j) => (j === i ? e.target.value : x)) })} />
          <button className="btn sm ghost" onClick={() => uv({ notes: v.notes.filter((_, j) => j !== i) })}>✕</button>
        </div>
      ))}
      <button className="btn sm ghost" onClick={() => uv({ notes: [...v.notes, ''] })}>+ 안내 추가</button>
    </div>
  )
}

/* ---------------- 영상 견적서 A4 ---------------- */
export function VideoPaper({ v, docNo, t, groups }) {
  const labels = groups.map((g) => g.label)
  const live = v.items.filter((it) => it.name || Number(it.price) > 0)
  // 단계별 구역 — 단가표의 단계 순서대로, 구역당 최소 2행 (빈 견적도 표 형태 유지)
  const sections = labels.map((label) => {
    const items = live.filter((it) => (it.stage || labels[0]) === label)
    const rows = [...items]
    while (rows.length < 2) rows.push(null)
    return { label, rows }
  })
  const etc = live.filter((it) => !labels.includes(it.stage || labels[0]))
  if (etc.length) sections.push({ label: '기타', rows: etc })
  const cells = (it) => it ? (
    <>
      <td>{it.name}</td>
      <td className="c">{it.spec || ''}</td>
      <td className="c">{it.unit || ''}</td>
      <td className="c num">{Number(it.qty) || ''}</td>
      <td className="r num">{Number(it.price) ? fmt(it.price) : '별도'}</td>
      <td className="r num">{(Number(it.qty) || 0) * (Number(it.price) || 0) ? fmt((Number(it.qty) || 0) * (Number(it.price) || 0)) : '-'}</td>
      <td className="c">{it.note || ''}</td>
    </>
  ) : (
    <><td /><td /><td /><td /><td /><td /><td /></>
  )
  return (
    <div className="paperA4">
      <div className="dp-head">
        <h1>견 적 서</h1>
        <img className="dp-wordmark" src="/brand/wordmark-line.png" alt="STUDIO. HOLYMOLLY" />
        <div className="dp-sub">{SUPPLIER.tagline}</div>
        <div className="dp-sub">{SUPPLIER.email} · {SUPPLIER.phone}</div>
      </div>

      <div className="dp-parties">
        <div>
          <div className="dp-plabel">FROM · 공급자</div>
          <table className="dp-ptable"><tbody>
            <tr><th>상호</th><td>{SUPPLIER.studio}</td></tr>
            <tr><th>대표자</th><td>{SUPPLIER.ceo}</td></tr>
            <tr><th>사업자</th><td className="num">{SUPPLIER.biz}</td></tr>
            <tr><th>계좌</th><td>{SUPPLIER.account}</td></tr>
          </tbody></table>
        </div>
        <div>
          <div className="dp-plabel">TO · 수신 <span className="dp-docno num">NO. {docNo}</span></div>
          <table className="dp-ptable"><tbody>
            <tr><th>Client</th><td>{v.client || '—'}</td></tr>
            <tr><th>담당자</th><td>{v.manager || '—'}</td></tr>
            <tr><th>연락처</th><td className="num">{v.phone || '—'}</td></tr>
            <tr><th>견적일자</th><td className="num">{kdate(v.date)}</td></tr>
          </tbody></table>
        </div>
      </div>

      <table className="dp-items">
        <thead>
          <tr><th style={{ width: '6%' }}>연번</th><th style={{ width: '25%' }}>품명</th><th style={{ width: '8%' }}>규격</th><th style={{ width: '8%' }}>단위</th><th style={{ width: '7%' }}>수량</th><th style={{ width: '13%' }}>단가</th><th style={{ width: '13%' }}>금액</th><th>비고</th></tr>
        </thead>
        <tbody>
          {sections.map((sec, si) => (
            <VideoSection key={sec.label} no={si + 1} label={sec.label} rows={sec.rows} cells={cells} />
          ))}
        </tbody>
      </table>

      <div className="dp-sums">
        <div><span>공급가액 · Subtotal</span><b className="num">{fmt(t.subtotal)} 원</b></div>
        {t.discount > 0 && (
          <>
            <div className="disc"><span>네고 할인 · Discount{Number(v.discountPct) > 0 ? ` (${v.discountPct}%)` : ''}</span><b className="num">− {fmt(t.discount)} 원</b></div>
            <div><span>할인 적용가 · Net</span><b className="num">{fmt(t.net)} 원</b></div>
          </>
        )}
        <div><span>부가세 (10%) · VAT</span><b className="num">{fmt(t.vat)} 원</b></div>
        <div className="grand"><span>합계 · TOTAL (VAT 포함)</span><b className="num">{fmt(t.total)} 원</b></div>
      </div>

      {v.notes.filter(Boolean).length > 0 && (
        <div className="dp-notes">
          <div className="dp-plabel">안내사항 · NOTES</div>
          {v.notes.filter(Boolean).map((n, i) => <p key={i}>{i + 1}. {n}</p>)}
        </div>
      )}

      <div className="dp-foot">
        <img className="dp-foot-mark" src="/brand/simbol-bk.png" alt="" />
        STUDIO. HOLYMOLLY · COMMERCIAL VISUAL STUDIO · EST. 2024
      </div>
    </div>
  )
}

// 단계 구역 — 첫 행의 연번 칸을 rowSpan으로 묶고, 단계명은 굵은 헤더 행으로 (첨부 견적서 양식 그대로)
function VideoSection({ no, label, rows, cells }) {
  return (
    <>
      <tr className="dp-secrow">
        <td className="c num" rowSpan={rows.length + 1} style={{ verticalAlign: 'middle', fontWeight: 700 }}>{no}</td>
        <td colSpan={7} style={{ fontWeight: 700, fontSize: 10, textAlign: 'left', padding: '4px 8px', background: '#f0f0f2', color: '#0a0a0a' }}>{label}</td>
      </tr>
      {rows.map((it, k) => <tr key={k}>{cells(it)}</tr>)}
    </>
  )
}

/* ---------------- 계약서 입력 폼 ---------------- */
function ContractForm({ c, uc, deposit, balance, clients, onPick }) {
  const [signing, setSigning] = useState(null) // 'G' | 'E' | null
  return (
    <div className="docs-form-in">
      <div className="docs-sec">의뢰인 (갑)</div>
      <ClientPicker clients={clients} onPick={onPick} />
      <div className="ed-row2">
        <div className="ed-field"><label>회사명</label><input value={c.client} onChange={(e) => uc({ client: e.target.value })} placeholder="예: 클랑" /></div>
        <div className="ed-field"><label>대표자</label><input value={c.ceo} onChange={(e) => uc({ ceo: e.target.value })} /></div>
      </div>
      <div className="ed-row2">
        <div className="ed-field"><label>주소</label><input value={c.addr} onChange={(e) => uc({ addr: e.target.value })} /></div>
        <div className="ed-field"><label>연락처</label><input value={c.phone} onChange={(e) => uc({ phone: e.target.value })} /></div>
      </div>

      <div className="docs-sec">금액</div>
      <div className="ed-row2">
        <div className="ed-field"><label>기본 촬영비 (VAT 포함 · 선금 산정 기준)</label><input className="num" type="number" min="0" step="10000" value={c.total} onChange={(e) => uc({ total: e.target.value })} /></div>
        <div className="ed-field"><label>선금 비율 (%)</label><input className="num" type="number" min="0" max="100" value={c.depositPct} onChange={(e) => uc({ depositPct: e.target.value })} /></div>
      </div>
      <div className="ed-row2">
        <div className="ed-field"><label>정밀 보정 단가 (1컷)</label><input className="num" type="number" min="0" step="10000" value={c.retouchFee} onChange={(e) => uc({ retouchFee: e.target.value })} /></div>
        <div className="ed-field"><label>추가 수정 단가 (1컷)</label><input className="num" type="number" min="0" step="1000" value={c.reviseFee} onChange={(e) => uc({ reviseFee: e.target.value })} /></div>
      </div>
      <div className="docs-totals">
        <div><span>선금 ({c.depositPct || 0}%)</span><b className="num">{fmt(deposit)} 원</b></div>
        <div><span>잔금 (예정 — 총 제작비 확정 후 정산)</span><b className="num">{fmt(balance)} 원</b></div>
        <div className="grand"><span>한글 표기</span><b>일금 {korAmount(c.total)} 원정</b></div>
      </div>
      <p className="mut3" style={{ fontSize: 12, lineHeight: 1.6 }}>
        총 제작비는 "기본 촬영비 + 초과 촬영비 + 재료비 + 추가 보정비"로 촬영 완료 후 확정됩니다. (계약서 제4조)
      </p>

      <div className="docs-sec">일정</div>
      <div className="ed-row2">
        <div className="ed-field"><label>계약일</label><input type="date" value={c.cDate} onChange={(e) => uc({ cDate: e.target.value })} /></div>
        <div className="ed-field"><label>계약금 지급 기한</label><input type="date" value={c.depositDue} onChange={(e) => uc({ depositDue: e.target.value })} /></div>
      </div>
      <div className="ed-row2">
        <div className="ed-field"><label>작업 시작일 (촬영)</label><input type="date" value={c.workStart} onChange={(e) => uc({ workStart: e.target.value })} /></div>
        <div className="ed-field"><label>작업 마감일 (납품)</label><input type="date" value={c.workEnd} onChange={(e) => uc({ workEnd: e.target.value })} /></div>
      </div>
      <div className="ed-row2">
        <div className="ed-field"><label>정밀 보정본 납품일</label><input type="date" value={c.delivDate} onChange={(e) => uc({ delivDate: e.target.value })} /></div>
        <div className="ed-field"><label>잔금 지급 기한</label><input type="date" value={c.balanceDue} onChange={(e) => uc({ balanceDue: e.target.value })} /></div>
      </div>
      <p className="mut3" style={{ fontSize: 12, lineHeight: 1.6 }}>
        수정 요구 기한(납품일 +5일)과 계약기간 만료일은 위 날짜에서 자동 계산되어 계약서 본문에 들어갑니다.
      </p>

      <div className="docs-sec">포트폴리오 게재 (제9조)</div>
      <div className="ed-field">
        <select value={c.portfolio} onChange={(e) => uc({ portfolio: e.target.value })}>
          <option value="allow">허용 — 스튜디오 홈페이지·SNS 게재 가능</option>
          <option value="after">출시 후 허용 — 제품 정식 공개 이후 게재 가능</option>
          <option value="deny">비허용 — 갑의 서면 동의 없이 게재 불가</option>
        </select>
      </div>

      <div className="docs-sec">전자 서명 <span className="mut3" style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(무료 — 화면에 직접 그려 도장 대신 인쇄)</span></div>
      <div className="docs-sign-row">
        <div className="docs-sign-slot">
          <span>갑 (의뢰인)</span>
          {c.signG ? <img src={c.signG} alt="갑 서명" /> : <em>미서명</em>}
          <div>
            <button className="btn sm" onClick={() => setSigning('G')}>{c.signG ? '다시 서명' : '✍ 서명'}</button>
            {c.signG && <button className="btn sm ghost" onClick={() => uc({ signG: '' })}>지우기</button>}
          </div>
        </div>
        <div className="docs-sign-slot">
          <span>을 (스튜디오)</span>
          {c.signE ? <img src={c.signE} alt="을 서명" /> : <em>미서명</em>}
          <div>
            <button className="btn sm" onClick={() => setSigning('E')}>{c.signE ? '다시 서명' : '✍ 서명'}</button>
            {c.signE && <button className="btn sm ghost" onClick={() => uc({ signE: '' })}>지우기</button>}
          </div>
        </div>
      </div>

      {signing && (
        <SignPad
          title={signing === 'G' ? '갑 (의뢰인) 서명' : '을 (스튜디오) 서명'}
          onClose={() => setSigning(null)}
          onSave={(dataUrl) => { uc(signing === 'G' ? { signG: dataUrl } : { signE: dataUrl }); setSigning(null) }}
        />
      )}
    </div>
  )
}

/* ---------------- 서명 패드 (캔버스 — 외부 서비스·비용 없음) ---------------- */
function SignPad({ title, onClose, onSave }) {
  const ref = useRef(null)
  const drawn = useRef(false)
  useEffect(() => {
    const cv = ref.current
    const dpr = window.devicePixelRatio || 1
    cv.width = 460 * dpr; cv.height = 180 * dpr
    const ctx = cv.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0a0a0a'
    let down = false
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    const start = (e) => { down = true; ctx.beginPath(); ctx.moveTo(...pos(e)); cv.setPointerCapture(e.pointerId) }
    const move = (e) => { if (!down) return; ctx.lineTo(...pos(e)); ctx.stroke(); drawn.current = true }
    const end = () => { down = false }
    cv.addEventListener('pointerdown', start)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', end)
    return () => { cv.removeEventListener('pointerdown', start); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', end) }
  }, [])
  function clear() {
    const cv = ref.current
    cv.getContext('2d').clearRect(0, 0, cv.width, cv.height)
    drawn.current = false
  }
  return (
    <Modal title={title} onClose={onClose}
      footer={<>
        <button className="btn sm" onClick={clear}>모두 지우기</button>
        <button className="btn sm" onClick={onClose}>취소</button>
        <button className="btn primary sm" onClick={() => { if (!drawn.current) return alert('서명을 그려주세요.'); onSave(ref.current.toDataURL('image/png')) }}>서명 확정</button>
      </>}>
      <p className="mut3" style={{ fontSize: 12, marginTop: 0 }}>마우스·터치·펜으로 아래 영역에 서명하세요.</p>
      <canvas ref={ref} className="docs-signpad" style={{ width: 460, height: 180 }} />
    </Modal>
  )
}

/* ---------------- 견적서 A4 ---------------- */
export function QuotePaper({ q, docNo, t }) {
  // 촬영/외주 두 구역으로 분리, 각 구역 5행 확보 (A4 1장 기준 최대 10행)
  const all = q.items.filter((it) => it.name || Number(it.price) > 0)
  const shoot = all.filter((it) => itemGroup(it) !== 'outsource')
  const out = all.filter((it) => itemGroup(it) === 'outsource')
  while (shoot.length < 5) shoot.push(null)
  while (out.length < 5) out.push(null)
  const cells = (it) => it ? (
    <>
      <td className="c">{it.cat}</td>
      <td>{it.name}</td>
      <td className="dp-desc">{it.desc}</td>
      <td className="c num">{Number(it.qty) || ''}</td>
      <td className="r num">{Number(it.price) ? fmt(it.price) : it.cat === '재료비' ? '별도' : ''}</td>
      <td className="r num">{(Number(it.qty) || 0) * (Number(it.price) || 0) ? fmt((Number(it.qty) || 0) * (Number(it.price) || 0)) : '-'}</td>
    </>
  ) : (
    <><td /><td /><td /><td /><td /><td /></>
  )
  const secRow = (label, key) => (
    <tr className="dp-secrow" key={key}>
      <td colSpan={7} style={{ background: '#f0f0f2', fontWeight: 700, fontSize: 9, letterSpacing: '0.05em', padding: '3px 8px', textAlign: 'left', color: '#0a0a0a' }}>{label}</td>
    </tr>
  )
  return (
    <div className="paperA4">
      <div className="dp-head">
        <h1>견 적 서</h1>
        <img className="dp-wordmark" src="/brand/wordmark-line.png" alt="STUDIO. HOLYMOLLY" />
        <div className="dp-sub">{SUPPLIER.tagline}</div>
        <div className="dp-sub">{SUPPLIER.email} · {SUPPLIER.phone}</div>
      </div>

      <div className="dp-parties">
        <div>
          <div className="dp-plabel">FROM · 공급자</div>
          <table className="dp-ptable"><tbody>
            <tr><th>상호</th><td>{SUPPLIER.studio}</td></tr>
            <tr><th>대표자</th><td>{SUPPLIER.ceo}</td></tr>
            <tr><th>사업자</th><td className="num">{SUPPLIER.biz}</td></tr>
            <tr><th>계좌</th><td>{SUPPLIER.account}</td></tr>
          </tbody></table>
        </div>
        <div>
          <div className="dp-plabel">TO · 수신 <span className="dp-docno num">NO. {docNo}</span></div>
          <table className="dp-ptable"><tbody>
            <tr><th>Client</th><td>{q.client || '—'}</td></tr>
            <tr><th>담당자</th><td>{q.manager || '—'}</td></tr>
            <tr><th>연락처</th><td className="num">{q.phone || '—'}</td></tr>
            <tr><th>견적일자</th><td className="num">{kdate(q.date)}</td></tr>
          </tbody></table>
        </div>
      </div>

      <table className="dp-items">
        <thead>
          <tr><th style={{ width: '6%' }}>NO</th><th style={{ width: '11%' }}>구분</th><th style={{ width: '24%' }}>품명</th><th>내용</th><th style={{ width: '7%' }}>수량</th><th style={{ width: '14%' }}>단가</th><th style={{ width: '14%' }}>합계</th></tr>
        </thead>
        <tbody>
          {secRow('① 포토그래퍼 촬영비', 'sh')}
          {shoot.map((it, k) => <tr key={'s' + k}><td className="c num">{k + 1}</td>{cells(it)}</tr>)}
          {secRow('② 스타일리스트 · 외주', 'oh')}
          {out.map((it, k) => <tr key={'o' + k}><td className="c num">{shoot.length + k + 1}</td>{cells(it)}</tr>)}
        </tbody>
      </table>

      <div className="dp-sums">
        <div><span>공급가액 · Subtotal</span><b className="num">{fmt(t.subtotal)} 원</b></div>
        {t.discount > 0 && (
          <>
            <div className="disc"><span>네고 할인 · Discount{Number(q.discountPct) > 0 ? ` (${q.discountPct}%)` : ''}</span><b className="num">− {fmt(t.discount)} 원</b></div>
            <div><span>할인 적용가 · Net</span><b className="num">{fmt(t.net)} 원</b></div>
          </>
        )}
        <div><span>부가세 (10%) · VAT</span><b className="num">{fmt(t.vat)} 원</b></div>
        <div className="grand"><span>총 결제금액 · TOTAL (VAT 포함)</span><b className="num">{fmt(t.total)} 원</b></div>
      </div>

      {q.notes.filter(Boolean).length > 0 && (
        <div className="dp-notes">
          <div className="dp-plabel">안내사항 · NOTES</div>
          {q.notes.filter(Boolean).map((n, i) => <p key={i}>{i + 1}. {n}</p>)}
        </div>
      )}

      <div className="dp-foot">
        <img className="dp-foot-mark" src="/brand/simbol-bk.png" alt="" />
        STUDIO. HOLYMOLLY · COMMERCIAL VISUAL STUDIO · EST. 2024
      </div>
    </div>
  )
}

/* ---------------- 계약서 A4 ---------------- */
export function ContractPaper({ c, docNo, deposit, balance, reviseEnd, payDeadline, termEnd }) {
  const gap = <span className="dp-blank">{'　'}</span>
  return (
    <div className="paperA4 contract">
      <div className="dc-no num">NO. {docNo}</div>
      <img className="dc-mark" src="/brand/simbol-bk.png" alt="" />
      <h1 className="dc-title">사진·영상 촬영 업무대행 계약서</h1>
      <p className="dc-intro">
        의뢰인 <b>{c.client || '________'}</b> (이하 “갑”이라 한다)과 대행업체 <b>{SUPPLIER.studioKo}</b> (이하 “을”이라 한다)는
        다음과 같이 사진·영상 촬영 업무대행에 관하여 계약을 체결한다.
      </p>

      <h3>제 1 조 【 계약의 목적 】</h3>
      <p>본 계약은 “갑”이 “을”에게 전자상거래용 사진·영상 제작 및 납품에 대한 촬영 업무대행을 위임함에 있어 상호 신뢰로써 업무를 진행하며, “을”은 “갑”의 업무를 성실히 수행하고 동반자로서 양사 간의 이익을 도모함에 있다.</p>

      <h3>제 2 조 【 대행범위 및 촬영품목 】</h3>
      <p>1. 대행범위 : 사진 및 영상 촬영의 제작·관리로서, 그 범위는 “갑”이 필요한 사진 및 영상을 제작·납품하는 것으로 한다.</p>
      <p>2. 촬영품목 : “갑”이 운영하는 사이트 및 광고·마케팅에 사용될 디지털 사진 및 영상.</p>

      <h3>제 3 조 【 전제조건 및 납품 】</h3>
      <p>1. 사진 및 영상 촬영 업무를 효과적으로 수행하기 위하여 “갑”은 “을”에게 필요한 정보 및 자료를 제공하고, “을”은 이를 일절 외부에 누설하지 아니한다.</p>
      <p>2. “을”은 보정 대상 이미지 확인을 위해 저해상도 이미지 전체를 촬영 후 1영업일 이내 “갑”에게 공유하고, “갑”이 최종 보정 대상 이미지를 선정한 후 7영업일 이내 최종 보정본을 납품한다.</p>
      <p>3. 최종 납품물은 인쇄 및 온라인 사용이 가능한 고해상도 이미지 파일(JPG 또는 PNG)로 제공한다.</p>

      <h3>제 4 조 【 지불조건 및 대금의 구성 】</h3>
      <p>1. 기본 촬영비 : 금 <b className="num">{fmt(c.total)}원</b>(부가세 포함). 본 금액은 계약된 촬영 시간을 기준으로 한 순수 촬영비로서, 계약 시간 초과 촬영비 및 원물·프롭 스타일링 재료 구매비는 포함되지 아니한다.</p>
      <p>2. 초과 촬영비 : 촬영 시간이 초과하는 경우 발생하며, 사전에 상호 협의한 기준에 따라 촬영 종료 후 산정하여 별도 청구한다.</p>
      <p>3. 재료비 : 촬영에 필요한 원물 및 프롭 스타일링 재료 구매비는 기본 촬영비에 포함되지 아니하며, “을”이 실제 지출한 금액을 영수증 첨부하여 실비로 청구한다.</p>
      <p>4. 총 제작비 : 촬영 완료 후 확정되며, “기본 촬영비 + 초과 촬영비 + 재료비 + 추가 보정비”의 합계로 한다. 따라서 잔금 지급 시 정산되는 총 제작비는 본 계약 체결 시점의 기본 촬영비와 상이할 수 있다.</p>
      <p>5. 선금 : 기본 촬영비의 {c.depositPct || 0}%인 금 <b className="num">{fmt(deposit)}원</b>(부가세 포함)을 계약금으로 하며, “갑”은 {c.depositDue ? <b>{kdate(c.depositDue)}</b> : '계약 체결일'}까지 “을”에게 지급한다.</p>
      <p>6. 잔금 : “총 제작비 − 선금”으로 산정하며, “갑”은 모든 촬영 및 납품이 완료된 후 {payDeadline ? <b>{kdate(payDeadline)}</b> : '납품 완료일로부터 20일 이내'}까지 일시불로 지급한다. “을”은 제3조에 따라 최종 결과물을 납품한다.</p>

      <h3>제 5 조 【 계약기간 】</h3>
      <p>본 계약은 <b>{kdate(c.termStart)}</b>부터 <b>{kdate(termEnd)}</b>까지로 하며, 추후 별도의 서면상 내용이 없을 시 계약은 자동 만료된다.</p>

      <div className="dc-box">
        <p><b>작업 내용</b></p>
        <p>· 작업기간(사진 촬영·보정·수정 및 납품) : {c.workStart ? kdate(c.workStart) : gap} ~ {c.workEnd ? kdate(c.workEnd) : gap}</p>
        <p>· 정밀 보정본 납품 일자 : {c.delivDate ? kdate(c.delivDate) : '“갑”의 최종 셀렉(사진 선택) 완료일로부터 7영업일 이내'}</p>
        <p>· 작업기간 외 수정 및 재수정 요구 기한 : 정밀 보정본 납품일로부터 최대 5일 이내{reviseEnd ? <> — <b>{kdate(reviseEnd)}</b>까지</> : null}</p>
        <p>· 기본 촬영비(선금 산정 기준) : 일금 <b>{korAmount(c.total)}</b> 원정 (<b className="num">{fmt(c.total)}원</b>, 부가세 포함)</p>
        <p>· 선금 ({c.depositPct || 0}%) : 일금 <b>{korAmount(deposit)}</b> 원정 (<b className="num">{fmt(deposit)}원</b>)</p>
        <p>· 총 제작비 : 기본 촬영비 + 초과 촬영비 + 재료비 + 추가 보정비 (촬영 완료 후 확정)</p>
        <p>· 잔금(총 제작비 − 선금) 지급 마감일 : {payDeadline ? <b>{kdate(payDeadline)}</b> : gap} (작업 마감일로부터 최대 20일 이내)</p>
      </div>

      <h3>제 6 조 【 촬영 일정의 변경·취소 및 위약금 】</h3>
      <p>1. “갑”은 촬영일 7일 전까지 위약금 없이 일정 변경 또는 취소를 요청할 수 있으며, 취소 시 기지급된 계약금은 전액 환불한다.</p>
      <p>2. 촬영일 6일 전부터 3일 전까지 취소 시 계약금의 50%를, 촬영일 2일 전부터 당일 취소 시 계약금 전액을 위약금으로 한다.</p>
      <p>3. 일정 변경은 1회에 한하여 무료로 하며, 2회차부터는 상호 협의하여 진행한다.</p>
      <p>4. “을”의 귀책사유로 촬영이 불가한 경우 “을”은 계약금 전액을 즉시 환불하거나, 상호 협의하여 일정을 재조정한다.</p>
      <p>5. 촬영을 위해 이미 지출된 소품·재료비 등 실비는 위약금과 별도로 “갑”이 부담한다.</p>

      <h3>제 7 조 【 발주 취소 및 일방적 해지 】</h3>
      <p>1. “갑”은 정당한 사유 없이 일방적으로 계약을 해지할 수 없다.</p>
      <p>2. “을”의 귀책사유가 아닌 “갑”의 사정으로 촬영이 취소되거나 계약이 해지되는 경우, 기지급된 선금은 제6조의 위약금 기준에 따라 처리하며, 취소 시점까지 “을”이 진행한 작업분(사전 기획, 일정 확보, 촬영 및 보정 진행분 등)에 대하여는 별도로 정산하여 지급한다.</p>
      <p>3. “갑”이 촬영 결과물을 수령한 이후에는 일방적으로 계약을 파기할 수 없으며, 이 경우 “갑”은 총 제작비 전액을 “을”에게 지급한다.</p>

      <h3>제 8 조 【 보정·수정 및 추가 비용 】</h3>
      <p>1. 보정 비용 : 정밀 보정은 1컷당 금 <b className="num">{fmt(c.retouchFee)}원</b>의 보정 비용이 발생한다.</p>
      <p>2. 수정 횟수 : 보정 완료본에 대한 수정은 컷당 1회를 기본 포함하며, 이를 초과하는 추가 수정을 요청하는 경우 1컷당 금 <b className="num">{fmt(c.reviseFee)}원</b>의 비용이 발생한다.</p>
      <p>3. 수정 요구 기한 및 범위 : 작업 계약기간 외 수정 요구는 정밀 보정본 납품일로부터 최대 5일 이내에 가능하다. 실질적인 수정 작업 범위는 사전에 협의된 레퍼런스 내에서 가능하며, 그 외 다른 방향성의 배경 및 소품 합성 요구는 본 조의 수정 범위에 포함되지 아니한다.</p>
      <p>4. 귀책에 따른 처리 : “을”의 귀책으로 인한 하자의 수정은 무상으로 진행하되, “갑”의 방향 변경 또는 추가 요청에 따른 수정은 본 조 제1항·제2항에 따라 별도 비용이 발생한다.</p>

      <h3>제 9 조 【 결과물의 포트폴리오 사용 】</h3>
      {c.portfolio === 'deny' ? (
        <p>“을”은 “갑”의 서면 동의 없이 본 계약으로 제작된 결과물을 외부에 공개·게재하지 아니한다.</p>
      ) : c.portfolio === 'after' ? (
        <p>“을”은 본 계약으로 제작된 결과물을 “을”의 포트폴리오(홈페이지·SNS 등)에 게재할 수 있다. 단, 게재는 “갑”의 제품 정식 공개 이후로 하며, “갑”이 별도로 비공개를 요청한 결과물은 게재하지 아니한다.</p>
      ) : (
        <p>“을”은 본 계약으로 제작된 결과물을 “을”의 포트폴리오(홈페이지·SNS 등)에 게재할 수 있다. 단, “갑”이 사전에 비공개를 요청한 결과물은 게재하지 아니한다.</p>
      )}

      <h3>제 10 조 【 관할법원 】</h3>
      <p>본 계약에 따른 민·형사상 분쟁의 해결은 “갑”의 소재지 관할 법원으로 하며, 기타 본 계약서에 명시되지 않은 사항에 대해서는 일반 관례에 따른다.</p>

      <p className="dc-close">위와 같이 계약을 체결하고 계약서 2통을 작성, 서명 날인 후 “갑”과 “을”이 각각 1통씩 보관한다.</p>
      <p className="dc-date">계약일자 : <b>{kdate(c.cDate)}</b></p>

      <div className="dc-signs">
        <table className="dc-sign"><tbody>
          <tr><th rowSpan={4}>(갑)</th><td>주　　소</td><td>{c.addr || ''}</td></tr>
          <tr><td>회 사 명</td><td>{c.client || ''}</td></tr>
          <tr><td>대 표 자</td><td className="dc-sign-cell">{c.ceo || ''} <span className="dc-seal">(인)</span>{c.signG && <img className="dc-sign-img" src={c.signG} alt="" />}</td></tr>
          <tr><td>연 락 처</td><td className="num">{c.phone || ''}</td></tr>
        </tbody></table>
        <table className="dc-sign"><tbody>
          <tr><th rowSpan={4}>(을)</th><td>주　　소</td><td>{SUPPLIER.addr}</td></tr>
          <tr><td>회 사 명</td><td>{SUPPLIER.studioKo}</td></tr>
          <tr><td>대 표 자</td><td className="dc-sign-cell">{SUPPLIER.ceo} <span className="dc-seal">(인)</span>{c.signE && <img className="dc-sign-img" src={c.signE} alt="" />}</td></tr>
          <tr><td>연 락 처</td><td className="num">{SUPPLIER.phone}</td></tr>
        </tbody></table>
      </div>
    </div>
  )
}

/* ---------------- 발급 내역 ---------------- */
/* ---------------- 한눈에 보기 — 발급 문서 내용을 클릭 없이 펼쳐서 조회 ---------------- */
const DOC_LABEL = { quote: '사진 견적서', video: '영상 견적서', contract: '계약서' }

function Glance({ docs, onLoad }) {
  const [filter, setFilter] = useState('all')
  if (!docs.length) {
    return <div className="card gate"><div className="lk">👁</div><h3>발급 내역이 없습니다</h3><p>견적서·계약서를 작성하고 저장하면 여기서 내용을 한눈에 볼 수 있습니다.</p></div>
  }
  const typeOf = (d) => d.docType === 'contract' ? 'contract' : d.docType === 'video' ? 'video' : 'quote'
  const counts = { all: docs.length, quote: 0, video: 0, contract: 0 }
  let sumAll = 0
  docs.forEach((d) => { counts[typeOf(d)]++; sumAll += Number(d.total) || 0 })
  const shown = filter === 'all' ? docs : docs.filter((d) => typeOf(d) === filter)
  const sumShown = shown.reduce((s, d) => s + (Number(d.total) || 0), 0)
  return (
    <div className="docs-glance-wrap">
      <div className="docs-glance-sum card">
        {['all', 'quote', 'video', 'contract'].map((k) => (
          <button key={k} className={'btn sm' + (filter === k ? ' primary' : '')} onClick={() => setFilter(k)}>
            {k === 'all' ? '전체' : DOC_LABEL[k]} <span className="num">{counts[k]}</span>
          </button>
        ))}
        <span className="sp" />
        <span className="mut3">표시 합계</span>
        <b className="num">₩{fmt(filter === 'all' ? sumAll : sumShown)}</b>
      </div>
      <div className="docs-glance">
        {shown.map((d) => <GlanceCard key={d.id} d={d} type={typeOf(d)} onLoad={onLoad} />)}
      </div>
    </div>
  )
}

function GlanceCard({ d, type, onLoad }) {
  const items = (d.items || []).filter((it) => it.name)
  const deposit = Math.round((Number(d.total) || 0) * (Number(d.depositPct) || 0) / 100)
  return (
    <div className="card dg-card">
      <div className="dg-head">
        <span className={'pill ' + (type === 'contract' ? 'solid' : 'mid')}>{DOC_LABEL[type]}</span>
        {d.docNo && <span className="mono mut" style={{ fontSize: 11.5 }}>{d.docNo}</span>}
        <span className="sp" />
        <span className="mut3 num">{d.date}</span>
      </div>
      <div className="dg-client">
        <b>{d.client || '(고객 미입력)'}</b>
        {(d.manager || d.phone) && <span className="mut3"> · {[d.manager, d.phone].filter(Boolean).join(' · ')}</span>}
      </div>
      {type === 'contract' ? (
        <div className="dg-items">
          <div className="dg-row"><span>계약금 ({d.depositPct || 0}%)</span><span className="num">₩{fmt(deposit)}</span></div>
          <div className="dg-row"><span>잔금</span><span className="num">₩{fmt((Number(d.total) || 0) - deposit)}</span></div>
          {(d.workStart || d.workEnd) && <div className="dg-row"><span>작업 기간</span><span className="num">{d.workStart || '?'} ~ {d.workEnd || '?'}</span></div>}
          {d.delivDate && <div className="dg-row"><span>납품일</span><span className="num">{d.delivDate}</span></div>}
        </div>
      ) : (
        <div className="dg-items">
          {items.length ? items.map((it, i) => (
            <div className="dg-row" key={i}>
              <span className="dg-name">{it.name}{Number(it.qty) > 1 ? ` ×${it.qty}` : ''}</span>
              <span className="num">₩{fmt((Number(it.qty) || 0) * (Number(it.price) || 0))}</span>
            </div>
          )) : <div className="dg-row mut3">항목 없음</div>}
          {Number(d.discount) > 0 && <div className="dg-row dg-disc"><span>할인</span><span className="num">−₩{fmt(d.discount)}</span></div>}
          {Number(d.vat) > 0 && <div className="dg-row"><span className="mut3">VAT 10%</span><span className="num mut3">₩{fmt(d.vat)}</span></div>}
        </div>
      )}
      <div className="dg-total">
        <span>{type === 'contract' ? '계약 총액' : '합계 (VAT 포함)'}</span>
        <b className="num">₩{fmt(d.total)}</b>
      </div>
      <div className="dg-foot">
        <button className="btn sm" onClick={() => onLoad(d)}>불러오기</button>
      </div>
    </div>
  )
}

function History({ docs, onLoad }) {
  if (!docs.length) {
    return <div className="card gate"><div className="lk">🗂</div><h3>발급 내역이 없습니다</h3><p>견적서·계약서를 작성하고 저장하면 여기에 쌓입니다.</p></div>
  }
  return (
    <div className="card" style={{ padding: 14 }}>
      {docs.map((d) => (
        <div className="docs-hrow" key={d.id}>
          <span className={'pill ' + (d.docType === 'contract' ? 'solid' : 'mid')}>{d.docType === 'contract' ? '계약서' : d.docType === 'video' ? '영상 견적서' : '사진 견적서'}</span>
          {d.docNo && <span className="mono mut" style={{ fontSize: 12 }}>{d.docNo}</span>}
          <b>{d.client || '(고객 미입력)'}</b>
          <span className="mut3 num">{d.date}</span>
          <span className="sp" />
          <span className="num" style={{ fontWeight: 700 }}>₩{fmt(d.total)}</span>
          <button className="btn sm" onClick={() => onLoad(d)}>불러오기</button>
          <button className="btn sm ghost" onClick={() => { if (confirm('이 문서를 삭제할까요?')) removeItem('quotes', d.id) }}>삭제</button>
        </div>
      ))}
    </div>
  )
}
