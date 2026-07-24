/* ============================================================
   데이터 계층 (Store) — Supabase 실시간 동기화
   - 로그인하면 initData()가 전체 데이터를 불러오고 실시간 구독 시작
   - 쓰기는 화면에 즉시 반영(낙관적) 후 Supabase에 저장
   - 다른 사람의 변경은 실시간 이벤트로 자동 반영
   - 🔒 deals/expenses/quotes는 RLS로 관리자만 — 직원에겐 서버가 안 내려줌
============================================================ */
import { createClient } from '@supabase/supabase-js'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.js'

const LEGACY_KEY = 'holymolly.ops.v1' // 예전 localStorage 데이터 (클라우드 이관용)

export const ROLE_LABEL = { admin: '관리자 · 전체 권한', staff: '직원 · 매출 제외' }

// ---- 파이프라인 단계 (기본값 — 커스텀에서 수정 가능) ----
export const STAGES = [
  { id: 'inquiry', name: '문의 접수' },
  { id: 'contract', name: '계약·준비' },
  { id: 'shoot', name: '촬영' },
  { id: 'retouch', name: '셀렉·리터칭' },
  { id: 'revise', name: '수정 중' },
  { id: 'delivered', name: '납품 완료' },
  { id: 'marketing', name: '마케팅 진행' },
]

// ---- 커스텀 가능한 기본 설정 ----
function defaultConfig() {
  return {
    kinds: ['룩북', '제품', '프로필', '광고'],
    channels: ['릴스', '스레드', '핀터레스트', '홈페이지', '유튜브 숏츠'],
    vendorKinds: ['스타일리스트', '헤어·메이크업', '리터처', '디자인'],
    clientCategories: ['의류·패션', '뷰티', 'F&B', '리빙·소품', '주얼리·액세서리', '기타'],
    stages: STAGES.map((s) => ({ ...s })),
    template: null, // null이면 TEMPLATE_TASKS 기본값
    integrations: { slackWebhook: '', slackProject: true, slackTask: true, slackDelivered: true, aiKey: '', aiModel: 'claude-opus-4-8' },
    modules: [], // 커스텀 모듈 {id, name, url}
    projectFields: [], // 프로젝트 폼 커스텀 필드 {id, label, type: text|select|date|check, options[]}
    vendorFields: [], // 외주 폼 커스텀 필드 (같은 구조)
  }
}
// 저장된 설정에 없는 새 키는 기본값으로 채움 (예: 이전 버전에서 저장된 설정)
export function getConfig() { return { ...defaultConfig(), ...(state.config || {}) } }

// ---- 사이드바 메뉴 (기본값 — 커스텀에서 이름·아이콘·숨김·순서 편집) ----
export const BASE_NAV = [
  { id: 'home', label: '홈 대시보드', ic: '◎', group: 'ws', locked: true },
  { id: 'inquiries', label: '촬영 문의', ic: '✉', group: 'ws' },
  { id: 'projects', label: '프로젝트 보드', ic: '▤', group: 'ws' },
  { id: 'projectdb', label: '프로젝트 DB', ic: '▣', group: 'ws' },
  { id: 'tasks', label: '업무', ic: '✓', group: 'ws' },
  { id: 'review', label: '주간 리뷰', ic: '◔', group: 'ws' },
  { id: 'clients', label: '고객사 DB', ic: '◈', group: 'ws' },
  { id: 'vendors', label: '외주 관리', ic: '◇', group: 'ws' },
  { id: 'content', label: '콘텐츠', ic: '▷', group: 'ws' },
  { id: 'studio', label: '납품 메시지', ic: '◫', group: 'ws' },
  { id: 'ads', label: '메타 광고', ic: '⚑', group: 'ws' },
  { id: 'money', label: '매출·정산', ic: '₩', group: 'admin', adminOnly: true },
  { id: 'docs', label: '견적·계약서', ic: '✎', group: 'admin', adminOnly: true },
  { id: 'team', label: '팀 관리', ic: '◉', group: 'admin', adminOnly: true },
  { id: 'custom', label: '커스텀', ic: '🎛', group: 'sys', locked: true },
  { id: 'settings', label: '설정 · 데이터', ic: '⚙', group: 'sys' },
]
export const DEFAULT_GROUP_NAMES = { ws: '워크스페이스', admin: '관리자 전용', sys: '시스템' }

// 커스텀 반영된 최종 메뉴
export function effectiveNav() {
  const ov = getConfig().nav || {}          // { items: {id:{label,ic,hidden}}, order: [ids] }
  const items = ov.items || {}
  let list = BASE_NAV.map((n) => ({ ...n, ...(items[n.id] || {}), adminOnly: n.adminOnly, locked: n.locked }))
  if (ov.order && ov.order.length) {
    const pos = Object.fromEntries(ov.order.map((id, i) => [id, i]))
    list = [...list].sort((a, b) => (pos[a.id] ?? 99) - (pos[b.id] ?? 99))
  }
  return list
}
export function navGroupNames() {
  return { ...DEFAULT_GROUP_NAMES, ...((getConfig().nav || {}).groupNames || {}) }
}
export function updateNav(patch) {
  const cur = getConfig().nav || {}
  updateConfig({ nav: { ...cur, ...patch } })
}
export function updateNavItem(id, itemPatch) {
  const cur = getConfig().nav || {}
  const items = { ...(cur.items || {}), [id]: { ...((cur.items || {})[id] || {}), ...itemPatch } }
  updateConfig({ nav: { ...cur, items } })
}
export function getStages() { return getConfig().stages }
export function getTemplate() { return getConfig().template || TEMPLATE_TASKS }
export function updateConfig(patch) {
  state = { ...state, config: { ...getConfig(), ...patch } }
  notify()
  saveConfig()
}
function saveConfig() {
  supabase.from('app_config').upsert({ id: 'main', data: state.config, updated_at: new Date().toISOString() })
    .then(({ error }) => logErr('config', error))
}

// ---- 홈 위젯 배치 (사용자별 — 클라우드 저장이라 어느 기기서든 유지) ----
// layout = { order: [keys], hidden: {key:true}, sizes: {key: 4|6|8|12}, custom: [{id,type,title,data}] }
export function homeLayout(uid) {
  const all = getConfig().homeLayout || {}
  return all[uid] || {}
}
export function setHomeLayout(uid, layout) {
  const all = getConfig().homeLayout || {}
  updateConfig({ homeLayout: { ...all, [uid]: layout } })
}

// ---- 우선순위 ----
export const PRIORITIES = ['높음', '보통', '낮음']

// ---- 소통 기록 채널 ----
export const COMM_CHANNELS = ['카톡채널', '개인카톡', '메일', '전화', '대면', '홈페이지', '기타']

// ---- 표준 업무 템플릿 (촬영 공정 — 마인드맵 기반) ----
// off: 촬영일 기준 마감 오프셋(일). 촬영일 없으면 마감 비움.
export const TEMPLATE_TASKS = [
  { title: '계약서 작성·발송', off: -14, pr: '높음' },
  { title: '컨셉 기획·레퍼런스 정리', off: -10, pr: '보통' },
  { title: '외주 섭외 (스타일리스트·헤메)', off: -10, pr: '높음' },
  { title: '장비 점검·렌탈 확인', off: -7, pr: '보통' },
  { title: '소품·배경 준비', off: -5, pr: '보통' },
  { title: '현장·조명 세팅', off: 0, pr: '높음' },
  { title: '원본 백업 업로드', off: 1, pr: '높음' },
  { title: '셀렉 (컷 선별) 요청', off: 3, pr: '보통' },
  { title: '리터칭·수정 진행', off: 7, pr: '보통' },
  { title: '보정본 백업 업로드', off: 9, pr: '높음' },
  { title: '최종 납품', off: 10, pr: '높음' },
  { title: '마케팅 콘텐츠 제작 (릴스·핀)', off: 14, pr: '낮음' },
]

// ---- 단계별 체크리스트 (부주의 방지 — 단계마다 5개 이하 유지) ----
// 체크 상태는 프로젝트에 checks: {'stageId:번호': true} 로 저장
export const STAGE_CHECKLISTS = {
  inquiry: ['문의 회신 (24시간 내)', '촬영 범위·일정·수량 파악', '견적서 발송'],
  contract: ['계약서 서명 확인', '계약금 입금 확인', '샷리스트·레퍼런스 확정', '외주 섭외 (스타일리스트·헤메)', '장비·스튜디오 예약'],
  shoot: ['장비·배터리·메모리 점검', '샷리스트 지참·현장 체크', '원본 백업 업로드'],
  retouch: ['셀렉 요청 발송', '리터칭 진행', '보정본 백업 업로드'],
  revise: ['수정 요청 정리·회신', '수정본 발송'],
  delivered: ['최종 파일 납품', '잔금·세금계산서 확인', '리뷰·소개 요청 (납품 2주 후)'],
  marketing: ['릴스·핀 콘텐츠 제작', '포트폴리오 업로드'],
}
export function getChecklist(stageId) {
  const ov = getConfig().checklists || {}
  return ov[stageId] || STAGE_CHECKLISTS[stageId] || []
}

// 로컬(한국) 기준 YYYY-MM-DD — toISOString은 UTC라 저녁~새벽에 하루가 밀린다
export function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(dateStr, n) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}

// D-Day 계산: due 대비 오늘
export function dday(due) {
  if (!due) return null
  const t = new Date(today() + 'T00:00:00')
  const d = new Date(due + 'T00:00:00')
  const diff = Math.round((d - t) / 86400000)
  if (diff === 0) return { label: 'D-DAY', level: 'today', diff }
  if (diff > 0) return { label: 'D-' + diff, level: diff <= 3 ? 'soon' : 'normal', diff }
  return { label: '+' + Math.abs(diff) + '일 지남', level: 'over', diff }
}

// ---- 예시 데이터 (전체 초기화 시 사용) ----
// ownerA=관리자(대표), ownerB=직원 계정 id로 치환됨
function seed(ownerA, ownerB) {
  const a = ownerA, b = ownerB || ownerA
  return {
    config: defaultConfig(),
    projects: [
      { id: p(), name: '아모레 신제품 문의', client: '아모레퍼시픽', kind: '제품', stage: 'inquiry', owner: a, tags: ['신규'], shootDate: '', due: '', origBackup: false, editBackup: false, createdBy: a, createdAt: '2026-07-04', note: '' },
      { id: p(), name: '29CM 브랜드컷', client: '29CM', kind: '광고', stage: 'inquiry', owner: b, tags: [], shootDate: '', due: '', origBackup: false, editBackup: false, createdBy: b, createdAt: '2026-07-03', note: '' },
      { id: p(), name: '마뗑킴 SS 룩북', client: '마뗑킴', kind: '룩북', stage: 'contract', owner: b, tags: ['계약'], shootDate: '2026-07-09', due: '2026-07-20', origBackup: false, editBackup: false, createdBy: a, createdAt: '2026-06-28', note: '스타일리스트 김지원 섭외 완료' },
      { id: p(), name: '설화수 프로필 촬영', client: '설화수', kind: '프로필', stage: 'contract', owner: a, tags: [], shootDate: '2026-07-10', due: '2026-07-18', origBackup: false, editBackup: false, createdBy: a, createdAt: '2026-06-30', note: '' },
      { id: p(), name: '탬버린즈 제품컷', client: '탬버린즈', kind: '제품', stage: 'shoot', owner: b, tags: [], shootDate: '2026-07-07', due: '2026-07-15', origBackup: false, editBackup: false, createdBy: b, createdAt: '2026-06-25', note: '' },
      { id: p(), name: '젠틀몬스터 광고컷', client: '젠틀몬스터', kind: '광고', stage: 'retouch', owner: a, tags: [], shootDate: '2026-06-28', due: '2026-07-08', origBackup: true, editBackup: false, createdBy: a, createdAt: '2026-06-15', note: '리터처 이현우 진행' },
      { id: p(), name: '무신사 22FW 룩북', client: '무신사', kind: '룩북', stage: 'revise', owner: b, tags: ['수정2회'], shootDate: '2026-06-24', due: '2026-07-06', origBackup: false, editBackup: true, createdBy: b, createdAt: '2026-06-10', note: '' },
      { id: p(), name: '쿤달 헤어라인', client: '쿤달', kind: '제품', stage: 'delivered', owner: a, tags: [], shootDate: '2026-06-20', due: '2026-06-30', origBackup: true, editBackup: true, createdBy: a, createdAt: '2026-06-05', note: '' },
    ],
    comments: [
      { id: p(), project: '무신사 22FW 룩북', who: a, text: '수정 2회차 언제 마감 가능해요? 고객사가 8일까지 요청.', at: '2026-07-04' },
      { id: p(), project: '무신사 22FW 룩북', who: b, text: '리터처님 7일 오전까지 주신다고 했어요. 8일 납품 가능!', at: '2026-07-05' },
    ],
    tasks: [
      { id: p(), title: '탬버린즈 조명 리스트 확정', done: false, owner: b, due: '2026-07-06', priority: '높음', project: '탬버린즈 제품컷', repeat: '', createdBy: b },
      { id: p(), title: '설화수 프롭리스트 피드백 회신', done: false, owner: a, due: '2026-07-06', priority: '보통', project: '설화수 프로필 촬영', repeat: '', createdBy: a },
      { id: p(), title: '무신사 보정본 백업 업로드', done: false, owner: b, due: '2026-07-07', priority: '높음', project: '무신사 22FW 룩북', repeat: '', createdBy: a },
      { id: p(), title: '마뗑킴 계약서 발송', done: true, owner: a, due: '2026-07-02', priority: '높음', project: '마뗑킴 SS 룩북', repeat: '', createdBy: a },
      { id: p(), title: '6월 외주 3.3% 취합 → 세무사', done: false, owner: a, due: '2026-07-08', priority: '높음', project: '', repeat: '매월', createdBy: a },
      { id: p(), title: '릴스 업로드 (주 1~2회)', done: false, owner: b, due: '2026-07-09', priority: '낮음', project: '', repeat: '매주', createdBy: b },
    ],
    deals: [
      { id: p(), project: '탬버린즈 제품컷', client: '탬버린즈', amount: 4200000, outsource: 900000, deposit: 4200000, balance: 0, taxInvoice: false, status: '잔금대기', month: '2026-07', createdBy: a },
      { id: p(), project: '마뗑킴 SS 룩북', client: '마뗑킴', amount: 6800000, outsource: 1600000, deposit: 0, balance: 6800000, taxInvoice: false, status: '계약금대기', month: '2026-07', createdBy: a },
      { id: p(), project: '젠틀몬스터 광고컷', client: '젠틀몬스터', amount: 8500000, outsource: 2100000, deposit: 4250000, balance: 4250000, taxInvoice: true, status: '진행중', month: '2026-06', createdBy: a },
      { id: p(), project: '무신사 22FW 룩북', client: '무신사', amount: 7200000, outsource: 1800000, deposit: 7200000, balance: 0, taxInvoice: true, status: '완료', month: '2026-06', createdBy: a },
      { id: p(), project: '쿤달 헤어라인', client: '쿤달', amount: 3400000, outsource: 600000, deposit: 3400000, balance: 0, taxInvoice: true, status: '완료', month: '2026-05', createdBy: a },
    ],
    expenses: [
      { id: p(), name: '스튜디오 월세', cat: '고정비', amount: 2200000, month: '2026-07', createdBy: a },
      { id: p(), name: '직원 급여', cat: '고정비', amount: 2800000, month: '2026-07', createdBy: a },
      { id: p(), name: '어도비·구독료', cat: '고정비', amount: 180000, month: '2026-07', createdBy: a },
      { id: p(), name: '마케팅 광고비', cat: '변동비', amount: 640000, month: '2026-07', createdBy: a },
      { id: p(), name: '소품·배경 구매', cat: '변동비', amount: 320000, month: '2026-07', createdBy: a },
    ],
    clients: [
      { id: p(), name: '무신사', contact: '김민지 MD', kind: '기존', shoots: 4, lastAt: '2026-06-24', createdBy: a },
      { id: p(), name: '탬버린즈', contact: '이수아 브랜드팀', kind: '기존', shoots: 3, lastAt: '2026-07-07', createdBy: b },
      { id: p(), name: '설화수', contact: '박준영', kind: '신규', shoots: 1, lastAt: '2026-07-10', createdBy: a },
      { id: p(), name: '젠틀몬스터', contact: '정하늘', kind: '기존', shoots: 2, lastAt: '2026-06-28', createdBy: a },
    ],
    vendors: [
      { id: p(), name: '김지원', kind: '스타일리스트', settle: '3.3%', contact: '010-****-1234', createdBy: a },
      { id: p(), name: '박서연 실장', kind: '헤어·메이크업', settle: '3.3%', contact: '010-****-5678', createdBy: b },
      { id: p(), name: '이현우', kind: '리터처', settle: '계산서', contact: 'retouch@studio.com', createdBy: a },
    ],
    contents: [
      { id: p(), title: '쿤달 헤어라인 릴스', project: '쿤달 헤어라인', channel: '릴스', status: '업로드', createdBy: b },
      { id: p(), title: '무신사 룩북 핀터레스트', project: '무신사 22FW 룩북', channel: '핀터레스트', status: '편집중', createdBy: b },
      { id: p(), title: '젠틀몬스터 스레드', project: '젠틀몬스터 광고컷', channel: '릴스', status: '미제작', createdBy: a },
    ],
    commlogs: [
      { id: p(), client: '탬버린즈', date: '2026-07-05', channel: '카톡채널', summary: '제품컷 소품 추가 요청 — 유리 트레이 2종, 촬영 당일 지참하기로.', decisions: '소품 2종 스튜디오에서 준비', createdBy: b },
      { id: p(), client: '마뗑킴', date: '2026-07-03', channel: '메일', summary: 'SS 룩북 무드보드 컨펌 완료. 모델 헤어는 내추럴 웨이브로 확정.', decisions: '무드보드 v2 확정 · 헤어 내추럴 웨이브', createdBy: a },
      { id: p(), client: '마뗑킴', date: '2026-06-30', channel: '개인카톡', summary: '견적 조율 — 컷수 20컷 기준으로 최종 합의.', decisions: '20컷 기준 계약 진행', adminOnly: true, createdBy: a },
      { id: p(), client: '설화수', date: '2026-07-02', channel: '전화', summary: '프로필 촬영 의상 3벌 준비, 오전 10시 입실 안내.', decisions: '', createdBy: a },
    ],
    quotes: [],
    activity: [],
  }
}

let n = 0
function p() { n += 1; return 'id' + Date.now().toString(36) + '_' + n }

/* ============================================================
   저장소 (pub/sub) — 클라우드 동기화
============================================================ */
const COLLS = ['projects', 'tasks', 'comments', 'deals', 'expenses', 'clients', 'vendors', 'contents', 'quotes', 'activity', 'commlogs']

function emptyState() {
  // inquiryCount: 신규 문의 뱃지 — inquiries는 COLLS에 넣지 않는다
  // (스키마가 {id,data}와 다르고, 익명 원본이 store에 섞이면 안 됨 — 목록은 Inquiries.jsx에서 별도 조회)
  const s = { loaded: false, config: defaultConfig(), members: [], inquiryCount: 0 }
  COLLS.forEach((c) => { s[c] = [] })
  return s
}
let state = emptyState()
const subs = new Set()
function notify() { subs.forEach((fn) => fn()) }
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn) }
export function getState() { return state }

function logErr(where, error) {
  if (error) console.warn('[supabase:' + where + ']', error.message)
}

// ---- 최초 로드: 전체 데이터 가져오기 + 실시간 구독 ----
let channel = null
export async function initData() {
  const queries = [
    supabase.from('app_config').select('data').eq('id', 'main').maybeSingle(),
    supabase.from('profiles').select('*').order('created_at'),
    ...COLLS.map((c) => {
      let q = supabase.from(c).select('id,data').order('created_at', { ascending: false })
      if (c === 'activity') q = q.limit(60)
      return q
    }),
  ]
  const [cfgRes, profRes, ...collRes] = await Promise.all(queries)
  const next = emptyState()
  next.loaded = true
  const def = defaultConfig()
  const cfg = cfgRes.data?.data
  if (cfg) next.config = { ...def, ...cfg, integrations: { ...def.integrations, ...(cfg.integrations || {}) } }
  next.members = (profRes.data || []).map(profToMember)
  COLLS.forEach((c, i) => {
    logErr(c, collRes[i].error)
    next[c] = (collRes[i].data || []).map((r) => r.data)
  })
  state = next
  notify()
  startRealtime()
  refreshInquiryCount()
}

// 로그아웃 시 구독 해제 + 화면 데이터 비우기
export function teardownData() {
  if (channel) { supabase.removeChannel(channel); channel = null }
  state = emptyState()
  notify()
}

function profToMember(pr) {
  return { id: pr.id, name: pr.name, role: pr.role, title: pr.title || '', active: pr.active, email: pr.email || '' }
}

// ---- 실시간: 다른 컴퓨터의 변경을 그대로 반영 ----
function startRealtime() {
  if (channel) supabase.removeChannel(channel)
  channel = supabase
    .channel('holymolly-db')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      const t = payload.table
      if (t === 'profiles') {
        const row = payload.new
        if (payload.eventType === 'DELETE') {
          state = { ...state, members: state.members.filter((m) => m.id !== payload.old?.id) }
        } else if (row) {
          const m = profToMember(row)
          const exists = state.members.some((x) => x.id === m.id)
          state = { ...state, members: exists ? state.members.map((x) => (x.id === m.id ? m : x)) : [...state.members, m] }
        }
        notify(); return
      }
      if (t === 'app_config') {
        if (payload.new?.data) { state = { ...state, config: payload.new.data }; notify() }
        return
      }
      if (t === 'inquiries') { refreshInquiryCount(); return } // 뱃지 신호만 — store에 원본을 담지 않음
      if (!COLLS.includes(t)) return
      if (payload.eventType === 'DELETE') {
        const id = payload.old?.id
        if (id) state = { ...state, [t]: state[t].filter((x) => x.id !== id) }
      } else {
        const item = payload.new?.data
        if (!item) return
        const exists = state[t].some((x) => x.id === item.id)
        state = { ...state, [t]: exists ? state[t].map((x) => (x.id === item.id ? item : x)) : [item, ...state[t]] }
      }
      notify()
    })
    .subscribe()
}

// ---- 클라우드 쓰기 (낙관적: 화면 먼저, 저장은 뒤에서) ----
function saveRow(coll, item) {
  supabase.from(coll).upsert({ id: item.id, data: item }).then(({ error }) => logErr(coll, error))
}
function dropRow(coll, id) {
  supabase.from(coll).delete().eq('id', id).then(({ error }) => logErr(coll, error))
}

/* ============================================================
   멤버 (팀 관리) — Supabase Auth 계정 + profiles
============================================================ */
export function activeMembers() { return (state.members || []).filter((m) => m.active) }
export function getMember(id) { return (state.members || []).find((m) => m.id === id) }

// 관리자가 팀원 계정을 직접 생성 (보조 클라이언트로 signUp — 내 세션은 유지)
export async function addMember({ name, title, role, email, pass }, actor) {
  const temp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await temp.auth.signUp({
    email, password: pass, options: { data: { name, title } },
  })
  if (error) return error.message
  if (!data.user || data.user.identities?.length === 0) return '이미 가입된 이메일입니다.'
  // 프로필 확정: 이름·직함·권한 + 활성화 (관리자 권한으로)
  const { error: e2 } = await supabase.from('profiles')
    .update({ name, title: title || '', role, active: true }).eq('id', data.user.id)
  if (e2) return e2.message
  logActivity(actor, `팀원 추가: ${name} (${role === 'admin' ? '관리자' : '직원'})`)
  notify()
  return null
}

export function updateMember(id, patch, actor) {
  state = { ...state, members: state.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }
  if (patch.active === false) {
    const m = getMember(id)
    logActivity(actor, `팀원 비활성화: ${m?.name || id}`)
  }
  notify()
  const allowed = {}
  ;['name', 'title', 'role', 'active'].forEach((k) => { if (k in patch) allowed[k] = patch[k] })
  supabase.from('profiles').update(allowed).eq('id', id).then(({ error }) => logErr('profiles', error))
}

// 내 비밀번호 변경
export async function changeOwnPassword(pw) {
  const { error } = await supabase.auth.updateUser({ password: pw })
  return error ? error.message : null
}
// 다른 팀원: 재설정 메일 발송
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  return error ? error.message : null
}

/* ============================================================
   댓글
============================================================ */
export function addComment(project, who, text) {
  const c = { id: p(), project, who, text, at: today() }
  state = { ...state, comments: [...(state.comments || []), c] }
  saveRow('comments', c)
  logActivity(who, `💬 ${project}: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`)
  notify()
}
export function commentsFor(project) {
  return (state.comments || []).filter((c) => c.project === project)
}

/* ============================================================
   피드백 보드 (홈 위젯 — 팀 공유)
   - comments 테이블에 project='__feedback__' 행으로 저장 (별도 테이블 불필요)
   - 체크(확인 완료)·댓글은 팀원 누구나 — 실시간 동기화로 서로의 반응이 바로 보임
============================================================ */
export const FEEDBACK_KEY = '__feedback__'
export function feedbackItems() {
  return (state.comments || [])
    .filter((c) => c.project === FEEDBACK_KEY)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
}
export function addFeedback(who, text) {
  const f = { id: p(), project: FEEDBACK_KEY, who, text, at: today(), done: false, replies: [] }
  state = { ...state, comments: [f, ...(state.comments || [])] }
  saveRow('comments', f)
  logActivity(who, `📌 피드백 남김: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`)
  notify()
}
export function toggleFeedback(id, actor) {
  const f = (state.comments || []).find((c) => c.id === id)
  if (!f) return
  const done = !f.done
  updateItem('comments', id, done ? { done: true, doneBy: actor, doneAt: today() } : { done: false, doneBy: null, doneAt: null })
  if (done) logActivity(actor, `📌 피드백 확인 완료: ${f.text.slice(0, 30)}${f.text.length > 30 ? '…' : ''}`)
}
export function replyFeedback(id, who, text) {
  const f = (state.comments || []).find((c) => c.id === id)
  if (!f) return
  updateItem('comments', id, { replies: [...(f.replies || []), { id: p(), who, text, at: today() }] })
  logActivity(who, `📌 피드백 댓글: ${text.slice(0, 30)}${text.length > 30 ? '…' : ''}`)
}
export function removeFeedback(id) { removeItem('comments', id) }

/* ============================================================
   소통 기록 (commlogs) — 업체별 타임라인
   - 카톡·메일·전화로 오간 내용을 업체 기준으로 아카이빙
   - adminOnly=true(금액·견적 언급)는 RLS가 직원에게 안 내려줌
============================================================ */
export function addCommLog(entry, actor) {
  const log = { id: p(), createdBy: actor, date: today(), ...entry }
  state = { ...state, commlogs: [log, ...(state.commlogs || [])] }
  saveRow('commlogs', log)
  // 고객사 최근 접점 자동 갱신 — 미등록 브랜드면 신규로 자동 생성
  const c = state.clients.find((x) => x.name === log.client)
  if (c) {
    if ((log.date || '') > (c.lastAt || '')) updateItem('clients', c.id, { lastAt: log.date })
  } else if (log.client) {
    const nc = { id: p(), name: log.client, contact: '', kind: '신규', shoots: 0, lastAt: log.date, note: '소통 기록에서 자동 생성', createdBy: actor }
    state = { ...state, clients: [nc, ...state.clients] }
    saveRow('clients', nc)
  }
  logActivity(actor, `소통 기록: ${log.client} (${log.channel})`)
  notify()
  return log
}

export function logsForClient(name) {
  return (state.commlogs || [])
    .filter((l) => l.client === name)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

/* ============================================================
   전체 데이터 교체/내보내기 (백업 · 이관)
============================================================ */
export function exportJSON() { return JSON.stringify(state, null, 2) }

export async function importJSON(text) {
  const parsed = JSON.parse(text)
  if (!parsed.projects) throw new Error('형식이 올바르지 않습니다')
  await pushAll(parsed)
}

// 클라우드 전체 교체: 각 테이블 비우고 다시 채움 (관리자 전용 화면에서만 호출)
async function pushAll(s) {
  const def = defaultConfig()
  const cfg = { ...def, ...(s.config || {}), integrations: { ...def.integrations, ...((s.config || {}).integrations || {}) } }
  await supabase.from('app_config').upsert({ id: 'main', data: cfg })
  const base = Date.now()
  for (const c of COLLS) {
    const { error: delErr } = await supabase.from(c).delete().neq('id', '')
    logErr(c + ':clear', delErr)
    const list = s[c] || []
    // 목록 순서 보존: 앞쪽 항목이 최신이 되도록 created_at을 계단식으로
    const rows = list.map((it, i) => ({
      id: it.id, data: it, created_at: new Date(base - i * 1000).toISOString(),
    }))
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from(c).upsert(rows.slice(i, i + 200))
      logErr(c + ':push', error)
    }
  }
  state = { ...state, config: cfg, ...Object.fromEntries(COLLS.map((c) => [c, s[c] || []])) }
  notify()
}

// ---- 예전 localStorage 데이터 → 클라우드 이관 ----
export function legacyLocalInfo() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s.projects) return null
    return { projects: (s.projects || []).length, tasks: (s.tasks || []).length, deals: (s.deals || []).length }
  } catch (e) { return null }
}

export async function migrateLegacyToCloud(actor) {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) throw new Error('이 브라우저에 예전 데이터가 없습니다')
  const legacy = JSON.parse(raw)
  // 예전 멤버 id('sumin','doyoung' 등) → 새 계정 id 매핑 (이름 기준, 없으면 나에게)
  const map = {}
  ;(legacy.members || []).forEach((lm) => {
    const hit = state.members.find((m) => m.name === lm.name)
    if (hit) map[lm.id] = hit.id
  })
  const fix = (v) => map[v] || actor
  const fixColl = (list, keys) => (list || []).map((it) => {
    const out = { ...it }
    keys.forEach((k) => { if (out[k]) out[k] = fix(out[k]) })
    return out
  })
  const converted = {
    config: legacy.config,
    projects: fixColl(legacy.projects, ['owner', 'createdBy']),
    tasks: fixColl(legacy.tasks, ['owner', 'createdBy']),
    comments: fixColl(legacy.comments, ['who']),
    deals: fixColl(legacy.deals, ['createdBy']),
    expenses: fixColl(legacy.expenses, ['createdBy']),
    clients: fixColl(legacy.clients, ['createdBy']),
    vendors: fixColl(legacy.vendors, ['createdBy']),
    contents: fixColl(legacy.contents, ['createdBy']),
    quotes: fixColl(legacy.quotes, ['createdBy']),
    activity: fixColl(legacy.activity, ['who']),
    commlogs: fixColl(legacy.commlogs, ['createdBy']),
  }
  await pushAll(converted)
  logActivity(actor, '예전 로컬 데이터를 클라우드로 이관')
}

/* ============================================================
   뮤테이션 (양쪽 다 작성 가능 → 실시간 공유)
============================================================ */
export function addItem(coll, item, actor) {
  const full = { id: p(), createdBy: actor, ...item }
  state = { ...state, [coll]: [full, ...state[coll]] }
  saveRow(coll, full)
  logActivity(actor, `${collLabel(coll)} 추가: ${item.name || item.title || item.project || ''}`)
  notify()
  // 슬랙 자동 알림 (연동 설정 시)
  const ig = getConfig().integrations
  const who = getMember(actor)?.name || ''
  if (coll === 'projects' && ig.slackProject) {
    notifySlack(`📸 새 프로젝트: *${item.name}* (${item.client || '고객사 미정'})${item.shootDate ? ` · 촬영 ${item.shootDate}` : ''} — ${who}`)
  }
  if (coll === 'tasks' && ig.slackTask) {
    notifySlack(`✅ 새 업무: *${item.title}* (담당 ${getMember(item.owner)?.name || '?'}${item.due ? `, 마감 ${item.due}` : ''}) — ${who}`)
  }
}

export function updateItem(coll, id, patch) {
  state = { ...state, [coll]: state[coll].map((it) => (it.id === id ? { ...it, ...patch } : it)) }
  const it = state[coll].find((x) => x.id === id)
  if (it) saveRow(coll, it)
  notify()
}
export function removeItem(coll, id) {
  state = { ...state, [coll]: state[coll].filter((it) => it.id !== id) }
  dropRow(coll, id)
  notify()
}

// 프로젝트 삭제 시 이름이 연결된 업무도 함께 삭제 (보드에서 지운 프로젝트의 업무가 업무 탭에 남는 문제 방지)
export function removeProject(id, actor) {
  const pj = state.projects.find((x) => x.id === id)
  if (!pj) return
  const linked = state.tasks.filter((t) => t.project === pj.name)
  state = {
    ...state,
    projects: state.projects.filter((x) => x.id !== id),
    tasks: state.tasks.filter((t) => t.project !== pj.name),
  }
  dropRow('projects', id)
  linked.forEach((t) => dropRow('tasks', t.id))
  logActivity(actor, `프로젝트 삭제: ${pj.name}${linked.length ? ` (연결 업무 ${linked.length}건 함께 삭제)` : ''}`)
  notify()
}

// ---- 프로젝트 DB (보관) ----
export function archiveProject(id, actor) {
  const pj = state.projects.find((x) => x.id === id)
  updateItem('projects', id, { archived: true, archivedAt: today() })
  if (pj) logActivity(actor, `프로젝트 DB로 보관: ${pj.name}`)
}
export function unarchiveProject(id, actor) {
  const pj = state.projects.find((x) => x.id === id)
  updateItem('projects', id, { archived: false })
  if (pj) logActivity(actor, `보드로 복원: ${pj.name}`)
}

// ---- 파일 업로드 (Supabase Storage — 'files' 공개 버킷) ----
export async function uploadFile(file, folder = 'attachments') {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${folder}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { error } = await supabase.storage.from('files').upload(path, file, { upsert: false })
  if (error) return { error: error.message }
  const { data } = supabase.storage.from('files').getPublicUrl(path)
  return { url: data.publicUrl, name: file.name, size: file.size }
}

export function moveProject(id, stage, actor) {
  const proj = state.projects.find((x) => x.id === id)
  // stageAt: 정체 감지용 · deliveredAt: 납품 후 팔로업(리뷰·재촬영 제안) 기준일
  updateItem('projects', id, { stage, stageAt: today(), ...(stage === 'delivered' ? { deliveredAt: today() } : {}) })
  if (proj) logActivity(actor, `${proj.name} → ${getStages().find((s) => s.id === stage)?.name}`)
  if (proj && stage === 'delivered' && getConfig().integrations.slackDelivered) {
    notifySlack(`📦 납품 완료: *${proj.name}* (${proj.client}) — ${getMember(actor)?.name || ''}`)
  }
  // 자동화: 납품 완료로 이동 → 마케팅 콘텐츠 카드 자동 생성 (없을 때만)
  if (proj && stage === 'delivered') {
    const exists = state.contents.some((c) => c.project === proj.name)
    if (!exists) {
      const card = { id: p(), title: proj.name + ' 릴스', project: proj.name, channel: '릴스', status: '미제작', createdBy: actor }
      state = { ...state, contents: [card, ...state.contents] }
      saveRow('contents', card)
      logActivity(actor, `자동 생성: ${proj.name} 콘텐츠 카드 (납품 완료 트리거)`)
    }
  }
  notify()
}

export function toggleTask(id, actor) {
  const t = state.tasks.find((x) => x.id === id)
  if (!t) return
  const nowDone = !t.done
  updateItem('tasks', id, { done: nowDone })
  // 루틴 업무: 완료 시 다음 회차 자동 생성 (매주 +7일 / 매월 +1개월)
  if (nowDone && t.repeat) {
    const base = t.due || today()
    const next = t.repeat === '매주' ? addDays(base, 7) : addMonths(base, 1)
    const dup = state.tasks.some((x) => x.title === t.title && x.due === next && !x.done)
    if (!dup) {
      const nt = { ...t, id: p(), done: false, due: next, createdBy: actor }
      state = { ...state, tasks: [nt, ...state.tasks] }
      saveRow('tasks', nt)
      logActivity(actor, `루틴 다음 회차 생성: ${t.title} (${next})`)
      notify()
    }
  }
}

function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return fmtDate(d)
}

// 프로젝트에 표준 업무 연결 생성 (템플릿은 커스텀에서 수정 가능)
// tt.who가 지정돼 있으면 그 팀원에게, 없으면 프로젝트 담당자에게 배분
export function addTemplateTasks(project, actor) {
  const items = getTemplate().map((tt) => ({
    id: p(),
    title: tt.title,
    done: false,
    owner: (tt.who && getMember(tt.who)?.active) ? tt.who : (project.owner || actor),
    due: project.shootDate ? addDays(project.shootDate, tt.off) : '',
    priority: tt.pr,
    project: project.name,
    repeat: '',
    createdBy: actor,
  }))
  state = { ...state, tasks: [...items, ...state.tasks] }
  supabase.from('tasks').upsert(items.map((it) => ({ id: it.id, data: it })))
    .then(({ error }) => logErr('tasks', error))
  logActivity(actor, `${project.name}에 표준 업무 ${items.length}개 생성`)
  notify()
  return items.length
}

function logActivity(who, text) {
  const entry = { id: p(), who, text, at: today() }
  state = { ...state, activity: [entry, ...(state.activity || [])].slice(0, 40) }
  saveRow('activity', entry)
}
function collLabel(c) {
  return ({ projects: '프로젝트', tasks: '업무', deals: '거래', expenses: '지출', clients: '고객사', vendors: '외주', contents: '콘텐츠', quotes: '견적서', commlogs: '소통 기록' })[c] || c
}
export function today() { return fmtDate(new Date()) } // 한국 로컬 기준 (UTC 아님)

// 전체 초기화 → 예시 데이터 (관리자 전용)
export async function resetAll(actor) {
  const admins = activeMembers().filter((m) => m.role === 'admin')
  const staffs = activeMembers().filter((m) => m.role === 'staff')
  const a = admins[0]?.id || actor
  const b = staffs[0]?.id || a
  await pushAll(seed(a, b))
}

/* ============================================================
   촬영 문의 (inquiries) — 외부 공개 폼 접수분
   - store에 담지 않고 화면에서 필요할 때 조회 (익명 원본 격리)
   - 예산(inquiry_budgets)은 RLS로 관리자만 — 직원 요청은 빈 결과
============================================================ */
export async function refreshInquiryCount() {
  // 개수 + 가장 오래된 신규 문의 접수 시각 (응답 대기 시간 리마인더용)
  const { data, count, error } = await supabase
    .from('inquiries').select('created_at', { count: 'exact' }).eq('status', 'new')
    .order('created_at', { ascending: true }).limit(1)
  if (error) { logErr('inquiries:count', error); return }
  const oldest = data?.[0]?.created_at || null
  if (state.inquiryCount !== (count || 0) || state.inquiryOldest !== oldest) {
    state = { ...state, inquiryCount: count || 0, inquiryOldest: oldest }
    notify()
  }
}

export async function fetchInquiries() {
  const { data, error } = await supabase
    .from('inquiries').select('id,data,status,created_at')
    .order('created_at', { ascending: false })
  logErr('inquiries', error)
  return data || []
}

// 예산 — 관리자만 결과가 옴 (직원은 RLS가 빈 결과를 반환)
export async function fetchInquiryBudget(id) {
  const { data } = await supabase.from('inquiry_budgets').select('data').eq('id', id).maybeSingle()
  return data?.data?.budget || null
}

export async function setInquiryStatus(id, status, actor) {
  const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)
  logErr('inquiries:status', error)
  if (!error && actor) {
    const label = { replied: '답변 완료', converted: '프로젝트 전환', archived: '보관', new: '신규' }[status] || status
    logActivity(actor, `문의 상태 변경: ${label}`)
  }
  refreshInquiryCount()
  return !error
}

// 문의 → 프로젝트 보드 '문의 접수' 단계 카드 생성 (단계가 커스텀에서 삭제됐으면 첫 단계로)
export async function convertInquiry(inq, actor) {
  const d = inq.data || {}
  const stages = getStages()
  const stage = stages.some((s) => s.id === 'inquiry') ? 'inquiry' : stages[0].id
  // 촬영 유형이 프로젝트 종류 선택지에 있으면 그대로, 없으면 첫 선택지 (유형은 메모에 보존)
  const kinds = getConfig().kinds || []
  const kind = kinds.includes(d.shootType) ? d.shootType : (kinds[0] || '')
  addItem('projects', {
    name: `${d.brand || '신규 문의'} ${d.shootType || ''}`.trim(),
    client: d.brand || '',
    kind,
    stage,
    owner: actor,
    tags: ['외부문의'],
    shootDate: d.shootDate || '',
    due: d.dueDate || '',
    origBackup: false, editBackup: false,
    createdAt: today(),
    // 문의 원본을 구조화된 스냅샷으로 보존 — 상세 화면에서 섹션별로 렌더 (메모 통짜 X)
    inquiryId: inq.id,
    inquiry: { at: inq.created_at, ...d },
    note: '',
  }, actor)
  // 소통 타임라인에도 접수 이력 기록 — 업체 히스토리의 시작점
  if (d.brand) {
    addCommLog({
      client: d.brand, channel: '홈페이지',
      summary: `촬영 문의 접수${d.shootType ? ` — ${d.shootType}` : ''}${d.manager ? ` (담당 ${d.manager})` : ''}`,
      decisions: '',
    }, actor)
  }
  await setInquiryStatus(inq.id, 'converted', actor)
}

// ---- 폼 콘텐츠 (inquiry_site) — 공개 페이지 랜딩·과정·견적·FAQ, 관리자만 수정 ----
export async function fetchInquirySite() {
  const { data, error } = await supabase.from('inquiry_site').select('data').eq('id', 'main').maybeSingle()
  logErr('inquiry_site', error)
  return data?.data || null
}
export async function saveInquirySite(siteData, actor) {
  const { error } = await supabase.from('inquiry_site')
    .upsert({ id: 'main', data: siteData, updated_at: new Date().toISOString() })
  logErr('inquiry_site:save', error)
  if (!error) logActivity(actor, '문의 폼 콘텐츠 수정')
  return error ? error.message : null
}

// 첨부파일 다운로드 링크 (비공개 버킷 — 서명 URL, 팀원만 생성 가능)
export async function inquiryFileUrl(path) {
  const { data, error } = await supabase.storage.from('inquiry-files').createSignedUrl(path, 3600)
  if (error) { logErr('inquiry-files', error); return null }
  return data.signedUrl
}

// 파기 — 첨부파일 + 예산(cascade) + 문의 행 일괄 삭제 (관리자 전용, RLS 강제)
export async function destroyInquiry(inq, actor) {
  const paths = (inq.data?.files || []).map((x) => x.path).filter(Boolean)
  if (paths.length) {
    const { error } = await supabase.storage.from('inquiry-files').remove(paths)
    logErr('inquiry-files:remove', error)
  }
  const { error } = await supabase.from('inquiries').delete().eq('id', inq.id)
  logErr('inquiries:delete', error)
  if (!error) logActivity(actor, `문의 파기: ${inq.data?.brand || inq.id}`)
  refreshInquiryCount()
  return !error
}

/* ============================================================
   슬랙 · 캘린더 연동
============================================================ */
export function notifySlack(text) {
  const url = getConfig().integrations.slackWebhook
  if (!url || !url.startsWith('https://hooks.slack.com/')) return false
  try {
    fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ text }) })
  } catch (e) { /* 알림 실패는 조용히 무시 */ }
  return true
}

// ---- 구글 캘린더: ICS 내보내기 (가져오기용) ----
export function buildICS() {
  const esc = (s) => String(s || '').replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n')
  const dt = (d) => d.replace(/-/g, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HolyMolly//StudioOps//KO']
  liveProjects().forEach((pj) => {
    if (pj.shootDate) lines.push('BEGIN:VEVENT', `UID:shoot-${pj.id}@holymolly`, `DTSTART;VALUE=DATE:${dt(pj.shootDate)}`, `SUMMARY:📸 촬영 · ${esc(pj.name)}`, `DESCRIPTION:${esc(pj.client)}`, 'END:VEVENT')
    if (pj.due) lines.push('BEGIN:VEVENT', `UID:due-${pj.id}@holymolly`, `DTSTART;VALUE=DATE:${dt(pj.due)}`, `SUMMARY:📦 납품 · ${esc(pj.name)}`, 'END:VEVENT')
  })
  state.tasks.filter((t) => !t.done && t.due).forEach((t) => {
    lines.push('BEGIN:VEVENT', `UID:task-${t.id}@holymolly`, `DTSTART;VALUE=DATE:${dt(t.due)}`, `SUMMARY:✅ ${esc(t.title)}`, 'END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// 일정 하나를 구글 캘린더에 추가하는 링크
export function gcalLink(title, date, detail) {
  const d = date.replace(/-/g, '')
  const next = addDays(date, 1).replace(/-/g, '')
  const u = new URL('https://calendar.google.com/calendar/render')
  u.searchParams.set('action', 'TEMPLATE')
  u.searchParams.set('text', title)
  u.searchParams.set('dates', `${d}/${next}`)
  if (detail) u.searchParams.set('details', detail)
  return u.toString()
}

/* ============================================================
   실데이터 파생 계산 (홈 대시보드용)
============================================================ */
export function currentYM() { return today().slice(0, 7) }

// 백업 현황: 촬영이 끝난 단계(셀렉 이후)의 프로젝트만 대상
const BACKUP_STAGES = ['retouch', 'revise', 'delivered', 'marketing']
// 운영 화면용: 보관(DB행) 제외
export function liveProjects() { return state.projects.filter((pj) => !pj.archived) }
export function backupStats() {
  const targets = liveProjects().filter((pj) => BACKUP_STAGES.includes(pj.stage))
  let doneFlags = 0
  const missing = []
  targets.forEach((pj) => {
    if (pj.origBackup) doneFlags++; else missing.push(pj.name + ' 원본')
    if (pj.editBackup) doneFlags++; else missing.push(pj.name + ' 보정본')
  })
  const total = targets.length * 2
  return { pct: total ? Math.round((doneFlags / total) * 100) : 100, missing, total }
}

// 이번 달 촬영·납품 건수 + 가장 임박한 촬영
export function monthShootStats() {
  const ym = currentYM()
  const shoots = liveProjects().filter((pj) => (pj.shootDate || '').startsWith(ym)).length
  const dues = liveProjects().filter((pj) => (pj.due || '').startsWith(ym)).length
  const upcoming = liveProjects()
    .filter((pj) => pj.shootDate && pj.shootDate >= today())
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate))[0] || null
  return { shoots, dues, upcoming }
}

// 이번 주(일~토) 날짜·이벤트 — 홈 미니 캘린더
export function weekEvents() {
  const t = new Date(today() + 'T00:00:00')
  const start = new Date(t); start.setDate(t.getDate() - t.getDay())
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const date = fmtDate(d)
    const shoots = liveProjects().filter((pj) => pj.shootDate === date)
    const dues = liveProjects().filter((pj) => pj.due === date)
    days.push({ date, dnum: d.getDate(), shoots, dues, isToday: date === today() })
  }
  return days
}

// 월별 입금 합계 (최근 n개월) — 관리자 차트용
export function monthlyRevenue(n = 6) {
  const out = []
  const t = new Date(today() + 'T00:00:00')
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth() - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const sum = state.deals.filter((x) => x.month === ym).reduce((a, x) => a + (x.deposit || 0), 0)
    out.push({ ym, label: (d.getMonth() + 1) + '월', sum })
  }
  return out
}

// 알림함: 나에게 온 것 (마감 임박·지남, 내 프로젝트의 최근 댓글)
export function inboxFor(userId) {
  const items = []
  state.tasks.filter((t) => !t.done && t.owner === userId && t.due && t.due <= addDays(today(), 3)).forEach((t) => {
    const dd = dday(t.due)
    items.push({ kind: dd.diff < 0 ? 'over' : 'due', text: t.title, sub: `업무 마감 ${dd.label}`, at: t.due })
  })
  const myProjects = new Set(liveProjects().filter((pj) => pj.owner === userId).map((pj) => pj.name))
  ;(state.comments || []).filter((c) => myProjects.has(c.project) && c.who !== userId && c.at >= addDays(today(), -7)).forEach((c) => {
    items.push({ kind: 'comment', text: `${getMember(c.who)?.name || '?'}: ${c.text.slice(0, 40)}`, sub: `💬 ${c.project}`, at: c.at })
  })
  liveProjects().filter((pj) => pj.owner === userId && pj.shootDate && pj.shootDate >= today() && pj.shootDate <= addDays(today(), 3)).forEach((pj) => {
    items.push({ kind: 'shoot', text: pj.name, sub: `촬영 ${dday(pj.shootDate).label}`, at: pj.shootDate })
  })
  items.sort((a, b) => String(a.at).localeCompare(String(b.at)))
  return items
}

// ---- 몰리 AI용 데이터 스냅샷 (역할 필터 — 직원에겐 금액 데이터 자체를 안 담음) ----
export function buildMollySnapshot(userId, isAdmin) {
  const stName = (id) => getStages().find((s) => s.id === id)?.name || id
  const mName = (id) => getMember(id)?.name || id
  const snap = {
    오늘: today(),
    나: { 이름: mName(userId), 역할: isAdmin ? '관리자(대표)' : '직원' },
    팀원: activeMembers().map((m) => ({ 이름: m.name, 역할: m.role === 'admin' ? '관리자' : '직원', 직함: m.title || '' })),
    파이프라인단계: getStages().map((s) => s.name),
    프로젝트: state.projects.map((pj) => ({
      이름: pj.name, 고객사: pj.client, 종류: pj.kind, 단계: pj.archived ? '보관됨(프로젝트DB)' : stName(pj.stage),
      담당: mName(pj.owner), 촬영일: pj.shootDate || null, 납품예정: pj.due || null,
      원본백업: !!pj.origBackup, 보정본백업: !!pj.editBackup, 메모: pj.note || '',
    })),
    업무: state.tasks.map((t) => ({
      제목: t.title, 완료: !!t.done, 담당: mName(t.owner), 마감: t.due || null,
      우선순위: t.priority || '보통', 프로젝트: t.project || null, 반복: t.repeat || null,
    })),
    고객사: state.clients.map((c) => ({ 브랜드: c.name, 담당자: c.contact, 구분: c.kind, 촬영수: c.shoots, 최근접점: c.lastAt })),
    외주: state.vendors.map((v) => ({ 이름: v.name, 구분: v.kind, 정산방식: v.settle, 연락처: v.contact, 계좌번호: v.account || '' })),
    콘텐츠: state.contents.map((c) => ({ 제목: c.title, 소재: c.project, 채널: c.channel, 상태: c.status })),
    // 소통 기록: 직원의 state에는 adminOnly 행이 서버(RLS)에서 이미 빠져 있음
    소통기록: (state.commlogs || []).slice(0, 40).map((l) => ({
      업체: l.client, 날짜: l.date, 채널: l.channel, 내용: l.summary,
      결정사항: l.decisions || null, 링크: l.link || null, 작성자: mName(l.createdBy),
      ...(l.adminOnly ? { 관리자전용: true } : {}),
    })),
    최근댓글: (state.comments || []).filter((c) => c.project !== FEEDBACK_KEY).slice(-10).map((c) => ({ 프로젝트: c.project, 작성자: mName(c.who), 내용: c.text, 날짜: c.at })),
    피드백보드: feedbackItems().slice(0, 15).map((f) => ({
      작성자: mName(f.who), 내용: f.text, 날짜: f.at, 확인완료: !!f.done,
      ...(f.done && f.doneBy ? { 확인자: mName(f.doneBy) } : {}),
      댓글: (f.replies || []).map((r) => `${mName(r.who)}: ${r.text}`),
    })),
    최근활동: (state.activity || []).slice(0, 10).map((a) => ({ 누가: mName(a.who), 무엇: a.text, 날짜: a.at })),
  }
  if (isAdmin) {
    const m = moneySummary()
    snap.거래정산_관리자전용 = state.deals.map((d) => ({
      프로젝트: d.project, 고객사: d.client, 거래금액: d.amount, 외주송금: d.outsource,
      입금: d.deposit, 미수잔금: d.balance, 세금계산서발행: !!d.taxInvoice, 상태: d.status, 귀속월: d.month,
    }))
    snap.지출_관리자전용 = state.expenses.map((e) => ({ 항목: e.name, 구분: e.cat, 금액: e.amount, 월: e.month }))
    snap.손익요약_관리자전용 = { 입금합계: m.revenue, 미수금: m.receivable, 외주비: m.outsource, 지출: m.expense, 순이익: m.net }
    snap.견적서_관리자전용 = (state.quotes || []).slice(0, 10).map((qt) => ({
      고객사: qt.client, 프로젝트: qt.project, 날짜: qt.date, 합계: qt.total,
      항목: (qt.items || []).map((it) => `${it.name} ×${it.qty}`).join(', '),
    }))
  }
  return snap
}

// ---- 파생 계산 (금액: 관리자 전용에서만 호출) ----
export function moneySummary() {
  const s = state
  // 매출 = 이번 달(귀속 월) 모든 거래금액의 합산 — 입금 여부와 무관
  const month = new Date().toISOString().slice(0, 7)
  const sales = s.deals.reduce((a, d) => a + (d.month === month ? (d.amount || 0) : 0), 0)
  const revenue = s.deals.reduce((a, d) => a + (d.deposit || 0), 0)
  const receivable = s.deals.reduce((a, d) => a + (d.balance || 0), 0)
  const outsource = s.deals.reduce((a, d) => a + (d.outsource || 0), 0)
  const expense = s.expenses.reduce((a, e) => a + (e.amount || 0), 0)
  const net = revenue - outsource - expense
  const noTax = s.deals.filter((d) => d.deposit > 0 && !d.taxInvoice).length
  return { sales, revenue, receivable, outsource, expense, net, noTax }
}
