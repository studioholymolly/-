/* ============================================================
   촬영 기획안 도우미 (/planner) — 로그인 없이 접근하는 공개 페이지
   실제 촬영 기획안(시안보드) 구조 기반:
   - 컷 시트가 본체: 컷마다 배경지 색(스와치) · 소품 · 레퍼런스 이미지 · 연출 노트 · 역할(KV/필수/얼터)
   - 제품 정보(실물 사진 REAL IMAGE + 샘플 수량), 톤&무드(배경지 톤 + 무드 레퍼런스)
   - 상세페이지 구조 순서로 컷 제안: 누끼 → 메인 KV → 연출 → 제형·질감 → 디테일 → 사용컷
   - 문서 구성: SHOT LIST(전체 컷 체크리스트 표) → 컷당 1페이지 상세
     (좌: 제품 실물·배경지 스와치 / 중: 레퍼런스 크게 / 우: 촬영 포인트·필요 소품 리스트)
   - 마지막에 스태프용 준비물 체크리스트(배경지·소품·샘플)
   - 출력: 웹 미리보기 → PDF(인쇄) · PPTX(pptxgenjs 지연 로드, 이미지 포함)
   - "이 기획안 그대로 문의하기" → localStorage 핸드오프(이미지 제외) → /inquiry 자동 채움
   - Inquiry.jsx처럼 대시보드 코드와 완전 격리 (supabase 클라이언트만 공유)
============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase.js'
import { DEFAULT_SITE, mergeSite } from '../inquirySite.js'

const EMBED = new URLSearchParams(window.location.search).get('embed') === '1'
const inquiryUrl = (extra = '') => '/inquiry?' + [EMBED ? 'embed=1' : '', extra].filter(Boolean).join('&')

/* ---------- 선택지 데이터 ----------
   업종·목적·무드·모델 선택지는 inquirySite(폼 콘텐츠 편집기 [도우미] 탭)에서 관리.
   무드 식별자는 key가 있으면 key, 편집기에서 새로 만든 항목은 name을 쓴다 */
const moodId = (m) => m.key || m.name
const MAX_MOODS = 2
const MAX_MOOD_REFS = 4
const MAX_PRODUCT_IMGS = 4

/* ---------- 배경지 프리셋 (컷별 선택) ---------- */
const BG_PRESETS = [
  { key: 'none', label: '배경 X (누끼)', color: null },
  { key: 'white', label: '화이트', color: '#FFFFFF' },
  { key: 'ivory', label: '아이보리', color: '#F3EDE2' },
  { key: 'lgray', label: '라이트 그레이', color: '#DCDCE0' },
  { key: 'gray', label: '그레이', color: '#A6A6AC' },
  { key: 'black', label: '블랙', color: '#141416' },
]

/* ---------- 컷 라이브러리 — 상세페이지 구조 순서 ----------
   role: 'kv'=메인 키비주얼, 'req'=필수, 'alt'=얼터컷(시간 되면)
   bg: 'none'|'white'|'ivory'|'mood0'(무드 밝은 톤)|'mood1'(무드 중간 톤)
   use: 상세페이지에서 쓰이는 위치 (스태프·브랜드 모두에게 목적 전달) */
const SHOT_SETS = {
  beauty: [
    { name: '누끼컷 (정면 · 단상자/용기 각 1)', role: 'req', bg: 'none', props: '',
      desc: '배경 없이 제품만 — 캡 유/무 각 1컷', use: '썸네일 · 상세페이지 스펙 영역' },
    { name: '메인 키비주얼 연출컷', role: 'kv', bg: 'mood1', props: '무드 소품 (스톤·아크릴·유리 오브제)',
      desc: '가장 공들이는 한 장 — 무드 배경지 위 소품 스타일링, 제품이 주인공', use: '상세페이지 인트로 후킹 · 광고 소재' },
    { name: '제품 단독 연출컷', role: 'req', bg: 'mood0', props: '',
      desc: '배경지 위 제품 단독 — 정면·기울임 등 구도 변주 2~3장', use: '상세페이지 본문 · SNS 피드' },
    { name: '제형 · 텍스처 컷', role: 'req', bg: 'white', props: '유리판, 스포이드, 제형 벌크(여분)',
      desc: '제형을 짜거나 떨어뜨린 클로즈업 — 질감·발림성이 보이게', use: '상세페이지 제형 섹션' },
    { name: '디테일 클로즈업', role: '', bg: 'mood0', props: '',
      desc: '용기 로고·캡·패키지 소재감을 가까이에서', use: '상세페이지 디테일 · 신뢰 섹션' },
    { name: '라인업 · 구성컷', role: '', bg: 'mood0', props: '',
      desc: '전 제품(또는 구성품)을 한 화면에 — 시리즈감 전달', use: '상세페이지 구성 안내 · 기획전' },
    { name: '사용 장면 (손 연출)', role: 'alt', bg: 'mood0', props: '핸드 모델(자체 or 요청)',
      desc: '손에 들거나 바르는 장면 — 실사용 상상을 돕는 컷', use: '상세페이지 사용법 · 릴스' },
  ],
  food: [
    { name: '누끼컷 (메뉴 단독)', role: 'req', bg: 'none', props: '',
      desc: '배경 없이 메뉴만 — 메뉴판·배달앱용', use: '메뉴판 · 배달앱 썸네일' },
    { name: '메인 키비주얼 (대표 메뉴)', role: 'kv', bg: 'mood1', props: '그릇·커트러리·패브릭 (스타일리스트 협의)',
      desc: '대표 메뉴의 가장 맛있어 보이는 각도 — 김·윤기 살아있게', use: '상세페이지 인트로 · 광고 소재' },
    { name: '탑뷰 상차림컷', role: 'req', bg: 'mood0', props: '테이블 매트, 사이드 메뉴',
      desc: '위에서 내려다본 풀 세팅 — 구성이 한눈에', use: '상세페이지 구성 · SNS' },
    { name: '시즐컷', role: 'req', bg: 'mood1', props: '소스·치즈 여분 (연출용)',
      desc: '치즈 늘어남·소스 붓기·단면 등 식욕 자극 순간 포착', use: '상세페이지 포인트 · 릴스' },
    { name: '재료 · 조리 과정컷', role: '', bg: 'mood0', props: '주요 원재료 (신선한 상태로)',
      desc: '신선한 재료와 만드는 과정 — 신뢰를 만드는 컷', use: '상세페이지 재료·신뢰 섹션' },
    { name: '플레이팅 · 공간 연출컷', role: 'alt', bg: 'mood0', props: '매장 소품·조명',
      desc: '매장 분위기나 테이블 무드와 함께', use: 'SNS · 홈페이지 배너' },
  ],
  fashion: [
    { name: '누끼컷 (앞/뒤 각 1)', role: 'req', bg: 'none', props: '',
      desc: '제품 앞·뒷면 프로필 컷 — 컬러별 각 1세트', use: '썸네일 · 상세페이지 스펙' },
    { name: '메인 키비주얼 연출컷', role: 'kv', bg: 'mood1', props: '무드 소품 (오브제·패브릭)',
      desc: '시즌 컨셉을 담은 대표 한 장', use: '상세페이지 인트로 · 룩북 표지' },
    { name: '소재 · 디테일 클로즈업', role: 'req', bg: 'mood0', props: '',
      desc: '스티치·로고·부자재 등 소재감이 잘 보이게', use: '상세페이지 디테일 섹션' },
    { name: '스타일링 연출컷', role: 'req', bg: 'mood0', props: '스타일링 소품 (함께 매치할 제품·잡화)',
      desc: '실제 사용 상황처럼 소품과 함께 배치', use: '상세페이지 본문 · SNS' },
    { name: '콘텐츠컷 (구성·언박싱)', role: 'alt', bg: 'ivory', props: '패키지·구성품 일체',
      desc: '왓츠인마이백·언박싱류 콘텐츠 컷', use: 'SNS · 릴스' },
  ],
  model: [
    { name: '모델 전신컷', role: 'req', bg: 'mood0', props: '의상 (사전 협의)',
      desc: '착용·사용 모습이 한눈에 보이는 기본 전신', use: '룩북 · 상세페이지' },
    { name: '메인 키비주얼 (모델+제품)', role: 'kv', bg: 'mood1', props: '의상·헤메 컨셉 협의',
      desc: '카메라 응시, 제품과 함께한 클로즈업 — 대표 컷', use: '상세페이지 인트로 · 광고' },
    { name: '상반신 · 클로즈업', role: 'req', bg: 'mood0', props: '',
      desc: '표정과 제품이 함께 보이는 컷', use: '상세페이지 · SNS' },
    { name: '제품 사용 장면', role: 'req', bg: 'mood0', props: '',
      desc: '모델이 제품을 실제로 사용하는 자연스러운 장면', use: '상세페이지 사용법 섹션' },
    { name: '디테일 포인트컷 (손·포인트)', role: 'alt', bg: 'none', props: '',
      desc: '손·입술 등 제품이 닿는 부분 클로즈업', use: '상세페이지 디테일' },
  ],
  video: [
    { name: '씬1 — 오프닝 훅 (3초)', role: 'kv', bg: 'mood1', props: '훅 연출 소품',
      desc: '스크롤을 멈추게 하는 첫 장면 — 가장 임팩트 있는 연출', use: '릴스·숏츠 도입부' },
    { name: '씬2 — 제품 등장 시퀀스', role: 'req', bg: 'mood0', props: '',
      desc: '제품이 매력적으로 드러나는 메인 장면 (회전·슬라이드)', use: '본편 메인' },
    { name: '씬3 — 사용 · 시연 장면', role: 'req', bg: 'mood0', props: '시연 준비물',
      desc: '기능과 사용법이 보이는 실사용 장면', use: '본편 · 상세페이지 GIF' },
    { name: '씬4 — 디테일 인서트', role: '', bg: 'none', props: '',
      desc: '질감·디테일을 담은 짧은 삽입 컷', use: '컷 전환용 인서트' },
    { name: '씬5 — 엔딩 · 로고 프레임', role: 'req', bg: 'mood0', props: '로고 파일(AI/PNG) 전달',
      desc: '브랜드 로고와 메시지로 마무리', use: '엔딩 프레임' },
  ],
}
// 촬영 유형 라벨은 대시보드에서 편집될 수 있어(inquiry_site) 키워드로 컷 세트를 고른다
function shotSetFor(type) {
  const t = type || ''
  if (/음식|푸드/.test(t)) return SHOT_SETS.food
  if (/모델|인물/.test(t)) return SHOT_SETS.model
  if (/영상/.test(t)) return SHOT_SETS.video
  if (/패션|잡화|가방|의류/.test(t)) return SHOT_SETS.fashion
  if (/라이프|컨셉|브랜딩/.test(t)) return SHOT_SETS.fashion
  return SHOT_SETS.beauty
}
// 목적별 추가 제안 컷
const PURPOSE_EXTRA_SHOTS = {
  '상세페이지': { name: '사이즈 · 스펙 비교컷', role: '', bg: 'white', props: '크기 비교용 오브제(동전·손 등)',
    desc: '크기 비교·구성 나열 등 정보 전달용', use: '상세페이지 스펙 섹션' },
  '릴스·숏츠': { name: '세로형 (9:16) 전용 컷', role: '', bg: 'mood0', props: '',
    desc: '세로 화면 구도로 별도 촬영', use: '릴스·숏츠 업로드용' },
  '메뉴판·인쇄물': { name: '고해상 인쇄용 컷', role: '', bg: 'white', props: '',
    desc: '크게 인쇄해도 선명한 여백 있는 구도', use: '메뉴판 · 현수막' },
}

/* ---------- /inquiry 폼 선택지로의 매핑 (핸드오프용) ---------- */
const PURPOSE_TO_INQUIRY = {
  '상세페이지': '상세페이지', 'SNS 콘텐츠': 'SNS 콘텐츠', '릴스·숏츠': '유튜브 숏츠', '광고 소재': '광고',
}
const PURPOSE_TO_FORMAT = {
  'SNS 콘텐츠': '인스타 피드 (1:1)', '릴스·숏츠': '릴스·숏츠 (세로)', '상세페이지': '상세페이지',
  '홈페이지·배너': '홈페이지 배너', '메뉴판·인쇄물': '인쇄물·현수막',
}

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/* 업로드 이미지 → 리사이즈된 JPEG dataURL (기획안 문서·PPTX 삽입용) */
function readImage(file, max = 1100) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽지 못했어요')) }
    img.src = url
  })
}

/* 무드 선택 기준으로 컷의 bg 제안 키를 실제 색으로 변환 */
function resolveBg(bgKey, moods) {
  if (bgKey === 'none') return { label: '배경 X (누끼)', color: null }
  const preset = BG_PRESETS.find((b) => b.key === bgKey)
  if (preset) return { label: preset.label, color: preset.color }
  const m = moods[0]
  if (!m) return { label: '화이트나 아이보리 톤', color: '#F5F2EA' }
  if (bgKey === 'mood1') return { label: `${m.name.split(' · ')[0]} 무드 톤`, color: m.colors[1] }
  return { label: `${m.name.split(' · ')[0]} 무드 라이트 톤`, color: m.colors[0] }
}

const ROLE_BADGE = { kv: '메인 KV', req: '필수', alt: '얼터컷 (시간 되면)' }

/* ---------- 선택값 → 기획안 문서 조립 ---------- */
export function buildDoc(p, S) {
  const moods = (S.planner || DEFAULT_SITE.planner).moods.filter((m) => p.moods.includes(moodId(m)))
  const accent = moods[0]?.colors[2] || '#0a0a0a'
  const purposeTxt = p.purposes.join(' · ') || '상담 후 결정'
  const shots = p.shots.filter((s) => s.on)
  // 배경지 총괄 — 같은 색끼리 묶어 컷 번호 나열 (스태프 준비용)
  const bgMap = new Map()
  shots.forEach((s, i) => {
    const k = s.bg.color || 'none'
    if (!bgMap.has(k)) bgMap.set(k, { ...s.bg, cuts: [] })
    bgMap.get(k).cuts.push(i + 1)
  })
  const propsList = shots.map((s, i) => s.props && { cut: i + 1, name: s.shotName || s.name, props: s.props }).filter(Boolean)
  const productImgs = p.productImgs || []
  return {
    accent, moods, shots,
    cover: {
      label: 'SHOOT PROPOSAL',
      title: `${p.brand} 촬영 기획안`,
      sub: [p.industry, p.shootType, purposeTxt].filter(Boolean).join('  ·  '),
      date: todayStr(),
      total: shots.length,
      keywords: [...new Set([...(p.brandMood?.keywords || []), ...moods.flatMap((m) => m.keywords)])].slice(0, 6),
    },
    product: {
      img: productImgs[0] || null,
      imgs: productImgs,
      rows: [
        ['브랜드', p.brand + (p.industry ? ` (${p.industry})` : '')],
        ['제품 · 아이템', p.intro || '—'],
        ['촬영 유형', p.shootType],
        ['목적 · 사용처', purposeTxt],
        ['샘플 필요 수량', p.sampleQty || '상담 시 협의'],
        ['샘플 전달', p.delivery || '상담 시 협의'],
        ['모델', p.model || '필요 없음 · 협의'],
      ],
    },
    tone: {
      lines: [
        p.brandMood?.summary ? `[브랜드 무드 — 소개서 기반 분석] ${p.brandMood.summary}` : '',
        ...moods.map((m) => `[${m.name}] ${m.desc}`),
        moods.length === 2 ? `${moods[0].name}을 기본으로 하되, 일부 컷에서 ${moods[1].name} 무드로 변주해 활용 폭을 넓힙니다.` : '',
      ].filter(Boolean),
      refs: p.moodRefs,
    },
    prep: {
      bgs: [...bgMap.values()],
      props: propsList,
      etc: [
        p.sampleQty ? `제품 샘플 ${p.sampleQty}` : '제품 샘플 (수량 협의)',
        p.delivery || '',
        '로고 파일(AI·PNG), 상세페이지 초안이 있다면 함께 전달해 주세요.',
      ].filter(Boolean),
    },
    schedule: [
      ['희망 촬영일', p.shootDate || '미정 (협의)'],
      ['결과물 필요일', p.dueDate || '미정 (협의)'],
      ['예산 범위', p.budget || '미정 · 상담 후 결정'],
    ],
    closing: {
      steps: ['문의 접수 · 상담', '견적서 · 계약서 전달', '촬영일 확정 (선금 50%)', '촬영 진행 · 현장 컨펌', '결과물 납품 (원본 다음 날 · 보정본 +7일)'],
      studio: S.studio.name,
      contact: [S.contact.phone, S.contact.email, S.contact.website].filter(Boolean),
      address: S.contact.location || '',
    },
  }
}

/* 컷 페이지 우측 "포인트" 불릿 — 설명을 짧은 항목으로 쪼갠다 */
const cutPoints = (sh) => [...sh.desc.split(' — '), sh.note && `메모: ${sh.note}`].filter(Boolean)
const cutProps = (sh) => (sh.props ? sh.props.split(',').map((t) => t.trim()).filter(Boolean) : [])
const docHeader = (plan) => `[${plan.brand}]  |  ${plan.intro ? plan.intro + ' ' : ''}촬영 기획안`

/* ---------- PPTX 내보내기 (pptxgenjs — 클릭 시에만 지연 로드) ---------- */
async function exportPptx(doc, plan) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'
  const INK = '0A0A0A', MUT = '75757B', LINE = 'E4E4E7'
  const AC = doc.accent.replace('#', '')
  const W = 13.33
  let pageNo = 0
  const foot = (s) => {
    pageNo += 1
    s.addText(`${plan.brand} 촬영 기획안  ·  made with ${doc.closing.studio} 기획안 도우미`, {
      x: 0.6, y: 7.02, w: 9, h: 0.3, fontSize: 9, color: MUT })
    s.addText(String(pageNo).padStart(2, '0'), { x: W - 1.2, y: 7.02, w: 0.6, h: 0.3, fontSize: 9, color: MUT, align: 'right' })
  }
  const heading = (s, t, extra) => {
    s.addText(t, { x: 0.6, y: 0.45, w: 8, h: 0.6, fontSize: 22, color: INK, bold: true })
    if (extra) s.addText(extra, { x: W - 3.6, y: 0.57, w: 3, h: 0.4, fontSize: 11, color: MUT, align: 'right' })
    s.addShape('line', { x: 0.6, y: 1.15, w: W - 1.2, h: 0, line: { color: LINE, width: 1 } })
  }

  // 1) 표지
  let s = pptx.addSlide()
  s.addShape('rect', { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: AC } })
  s.addText(doc.cover.label, { x: 0.9, y: 1.4, w: 11, h: 0.4, fontSize: 13, color: MUT, charSpacing: 6, bold: true })
  s.addText(doc.cover.title, { x: 0.9, y: 2.0, w: 11.5, h: 1.6, fontSize: 42, color: INK, bold: true })
  s.addText(doc.cover.sub, { x: 0.9, y: 3.6, w: 11.5, h: 0.5, fontSize: 14, color: MUT })
  s.addText(`총 ${doc.cover.total}컷`, { x: 0.9, y: 4.25, w: 3, h: 0.5, fontSize: 15, color: INK, bold: true })
  doc.cover.keywords.forEach((k, i) => {
    s.addText('#' + k, { x: 0.9 + i * 1.75, y: 5.0, w: 1.65, h: 0.42, fontSize: 11, color: INK,
      align: 'center', valign: 'middle', line: { color: LINE, width: 1 }, shape: 'roundRect', rectRadius: 0.2 })
  })
  s.addText(doc.cover.date, { x: 0.9, y: 6.2, w: 4, h: 0.4, fontSize: 12, color: MUT })
  foot(s)

  // 2) PRODUCT
  s = pptx.addSlide()
  heading(s, 'PRODUCT — 제품 정보')
  doc.product.rows.forEach(([k, v], i) => {
    const y = 1.5 + i * 0.66
    s.addText(k, { x: 0.7, y, w: 2.5, h: 0.5, fontSize: 12, color: MUT, bold: true })
    s.addText(String(v), { x: 3.3, y, w: 5.6, h: 0.5, fontSize: 13, color: INK })
    s.addShape('line', { x: 0.7, y: y + 0.54, w: 8.2, h: 0, line: { color: 'F0F0F2', width: 0.75 } })
  })
  if (doc.product.imgs.length) {
    s.addText('REAL IMAGE', { x: 9.5, y: 1.5, w: 3.2, h: 0.35, fontSize: 10.5, color: MUT, bold: true, align: 'center', charSpacing: 3 })
    const imgs = doc.product.imgs.slice(0, 4)
    if (imgs.length === 1) {
      s.addImage({ data: imgs[0], x: 9.5, y: 1.95, w: 3.2, h: 3.6, sizing: { type: 'contain', w: 3.2, h: 3.6 } })
    } else if (imgs.length === 2) {
      imgs.forEach((im, i) => s.addImage({ data: im, x: 9.5, y: 1.95 + i * 1.85, w: 3.2, h: 1.75, sizing: { type: 'contain', w: 3.2, h: 1.75 } }))
    } else {
      imgs.forEach((im, i) => s.addImage({ data: im, x: 9.5 + (i % 2) * 1.65, y: 1.95 + Math.floor(i / 2) * 1.85, w: 1.55, h: 1.75, sizing: { type: 'contain', w: 1.55, h: 1.75 } }))
    }
  }
  foot(s)

  // 3) TONE & MOOD
  s = pptx.addSlide()
  heading(s, 'TONE & MOOD — 톤 · 배경지')
  s.addText(doc.tone.lines.map((t) => ({ text: t, options: { breakLine: true, paraSpaceAfter: 8 } })), {
    x: 0.7, y: 1.45, w: 7.2, h: 2.5, fontSize: 12.5, color: INK, valign: 'top', lineSpacingMultiple: 1.25 })
  doc.moods.forEach((m, mi) => {
    const y = 4.2 + mi * 1.3
    s.addText(m.name, { x: 0.7, y, w: 3, h: 0.4, fontSize: 12, color: INK, bold: true })
    m.colors.forEach((c, ci) => {
      s.addShape('roundRect', { x: 3.8 + ci * 1.1, y: y - 0.02, w: 0.95, h: 0.55, rectRadius: 0.06,
        fill: { color: c.replace('#', '') }, line: { color: LINE, width: 1 } })
    })
    s.addText('쨍한 원색보다 탁도가 있는 톤 다운 컬러로', { x: 7.4, y, w: 5, h: 0.5, fontSize: 10.5, color: MUT })
  })
  if (doc.tone.refs.length) {
    doc.tone.refs.slice(0, 4).forEach((r, i) => {
      s.addImage({ data: r, x: 8.4 + (i % 2) * 2.3, y: 1.45 + Math.floor(i / 2) * 2.3, w: 2.15, h: 2.15, sizing: { type: 'cover', w: 2.15, h: 2.15 } })
    })
  }
  foot(s)

  // 4) SHOT LIST — 전체 컷을 표 하나로 (현장 체크리스트)
  const CUT = /영상/.test(plan.shootType) ? 'SCENE' : 'CUT'
  s = pptx.addSlide()
  heading(s, 'SHOT LIST — 전체 컷', `총 ${doc.shots.length}컷 · ${CUT}당 1페이지 상세`)
  const th = (t) => ({ text: t, options: { bold: true, fontSize: 9.5, color: MUT, fill: { color: 'F7F7F8' } } })
  const slRows = [
    ['✓', 'NO.', '컷', '배경지', '소품 · 원물', '역할'].map(th),
    ...doc.shots.map((sh, i) => [
      { text: '☐', options: { align: 'center', fontSize: 12 } },
      { text: String(i + 1).padStart(2, '0'), options: { color: MUT } },
      { text: sh.name, options: { bold: true } },
      { text: sh.bg.label },
      { text: sh.props || '—', options: { color: '525257' } },
      { text: ROLE_BADGE[sh.role] || '', options: { color: sh.role === 'kv' ? AC : MUT, bold: !!sh.role } },
    ]),
  ]
  s.addTable(slRows, { x: 0.6, y: 1.45, w: W - 1.2, colW: [0.5, 0.66, 4.3, 2.4, 3.24, 1.03],
    fontSize: 10.5, color: INK, valign: 'middle', rowH: 0.36,
    border: { type: 'solid', color: 'EDEDEF', pt: 0.75 } })
  foot(s)

  // 5) CUT 상세 — 슬라이드당 1컷 (좌: 제품·배경지 / 중: 레퍼런스 크게 / 우: 포인트·소품)
  doc.shots.forEach((sh, i) => {
    s = pptx.addSlide()
    const no = String(i + 1).padStart(2, '0')
    const badge = ROLE_BADGE[sh.role]
    s.addText(docHeader(plan), { x: 0.6, y: 0.12, w: 9, h: 0.28, fontSize: 8.5, color: MUT })
    heading(s, `${CUT} ${no} — ${sh.name}`, `${badge ? badge + '  ·  ' : ''}${i + 1} / ${doc.shots.length}`)
    // 좌측 사이드 — 제품 실물 · 배경지
    const sideLbl = (t, y) => {
      s.addText(t, { x: 0.6, y, w: 1.9, h: 0.3, fontSize: 10.5, color: '525257', bold: true })
      s.addShape('line', { x: 0.6, y: y + 0.33, w: 1.9, h: 0, line: { color: LINE, width: 0.75 } })
    }
    sideLbl('제품', 1.45)
    if (doc.product.img) s.addImage({ data: doc.product.img, x: 0.6, y: 1.9, w: 1.9, h: 1.9, sizing: { type: 'contain', w: 1.9, h: 1.9 } })
    else s.addText('실물 사진 미첨부', { x: 0.6, y: 2.65, w: 1.9, h: 0.4, fontSize: 9, color: MUT, align: 'center' })
    sideLbl('배경지', 4.05)
    if (sh.bg.color) s.addShape('roundRect', { x: 0.6, y: 4.5, w: 1.9, h: 1.25, rectRadius: 0.08, fill: { color: sh.bg.color.replace('#', '') }, line: { color: LINE, width: 1 } })
    else {
      s.addShape('roundRect', { x: 0.6, y: 4.5, w: 1.9, h: 1.25, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 1, dashType: 'dash' } })
      s.addText('배경 X', { x: 0.6, y: 4.9, w: 1.9, h: 0.4, fontSize: 9.5, color: MUT, align: 'center' })
    }
    s.addText(sh.bg.label, { x: 0.6, y: 5.82, w: 1.9, h: 0.55, fontSize: 9.5, color: INK, bold: true })
    // 중앙 — 레퍼런스 이미지 크게
    const RX = 2.95, RW = 4.85, RY = 1.45, RH = 5.25
    if (sh.ref) s.addImage({ data: sh.ref, x: RX, y: RY, w: RW, h: RH, sizing: { type: 'contain', w: RW, h: RH } })
    else {
      s.addShape('roundRect', { x: RX, y: RY, w: RW, h: RH, rectRadius: 0.08,
        fill: { color: sh.bg.color ? sh.bg.color.replace('#', '') : 'FAFAFA' }, line: { color: LINE, width: 1, dashType: sh.bg.color ? 'solid' : 'dash' } })
      s.addText('레퍼런스 이미지 자리\n(카톡·메일로 전달 가능)', { x: RX, y: RY + RH / 2 - 0.4, w: RW, h: 0.8, fontSize: 10, color: MUT, align: 'center' })
    }
    // 우측 — 촬영컷 포인트 · 필요 소품
    const TX = 8.25, TW = 4.45
    const infoT = (t, y) => {
      s.addText(t, { x: TX, y, w: TW, h: 0.34, fontSize: 12.5, color: INK, bold: true })
      s.addShape('line', { x: TX, y: y + 0.4, w: TW, h: 0, line: { color: '0A0A0A', width: 1.25 } })
    }
    infoT('촬영컷 포인트 및 설명', 1.45)
    const pts = cutPoints(sh)
    s.addText(pts.map((t) => ({ text: t, options: { bullet: { code: '2013' }, breakLine: true, paraSpaceAfter: 7 } })),
      { x: TX + 0.05, y: 1.98, w: TW - 0.05, h: 2.1, fontSize: 10.5, color: '1A1A1A', valign: 'top', lineSpacingMultiple: 1.2 })
    if (sh.use) s.addText(`사용처 — ${sh.use}`, { x: TX, y: 4.15, w: TW, h: 0.4, fontSize: 9.5, color: MUT })
    infoT('필요 소품 리스트', 5.0)
    const props = cutProps(sh)
    s.addText((props.length ? props : ['별도 소품 없음 — 스튜디오 기본 소품으로 진행'])
      .map((t) => ({ text: t, options: { bullet: { code: '2013' }, breakLine: true, paraSpaceAfter: 6 } })),
      { x: TX + 0.05, y: 5.53, w: TW - 0.05, h: 1.35, fontSize: 10.5, color: '1A1A1A', valign: 'top', lineSpacingMultiple: 1.2 })
    foot(s)
  })

  // 5) 준비물 체크리스트
  s = pptx.addSlide()
  heading(s, 'PREP — 준비물 체크리스트')
  s.addText('배경지', { x: 0.7, y: 1.4, w: 3, h: 0.4, fontSize: 13, color: INK, bold: true })
  doc.prep.bgs.forEach((b, i) => {
    const y = 1.9 + i * 0.55
    if (b.color) s.addShape('roundRect', { x: 0.7, y, w: 0.42, h: 0.36, rectRadius: 0.05, fill: { color: b.color.replace('#', '') }, line: { color: LINE, width: 1 } })
    else s.addShape('roundRect', { x: 0.7, y, w: 0.42, h: 0.36, rectRadius: 0.05, fill: { color: 'FFFFFF' }, line: { color: LINE, width: 1, dashType: 'dash' } })
    s.addText(`${b.label} — 컷 ${b.cuts.join(', ')}`, { x: 1.25, y: y - 0.05, w: 5.2, h: 0.45, fontSize: 11.5, color: INK })
  })
  s.addText('소품 · 원물', { x: 7.0, y: 1.4, w: 3, h: 0.4, fontSize: 13, color: INK, bold: true })
  const propLines = doc.prep.props.length
    ? doc.prep.props.map((pr) => ({ text: `컷 ${pr.cut} — ${pr.props}`, options: { breakLine: true, paraSpaceAfter: 4 } }))
    : [{ text: '별도 소품 없음 — 스튜디오 기본 소품으로 진행', options: {} }]
  s.addText(propLines, { x: 7.0, y: 1.9, w: 5.6, h: 2.8, fontSize: 11, color: '525257', valign: 'top' })
  s.addText('브랜드에서 전달해 주세요', { x: 7.0, y: 4.9, w: 5, h: 0.4, fontSize: 13, color: INK, bold: true })
  s.addText(doc.prep.etc.map((t) => ({ text: '· ' + t, options: { breakLine: true, paraSpaceAfter: 3 } })),
    { x: 7.0, y: 5.4, w: 5.6, h: 1.4, fontSize: 10.5, color: '525257', valign: 'top' })
  s.addText('일정 · 예산', { x: 0.7, y: 4.9, w: 3, h: 0.4, fontSize: 13, color: INK, bold: true })
  doc.schedule.forEach(([k, v], i) => {
    s.addText(`${k} — ${v}`, { x: 0.7, y: 5.4 + i * 0.42, w: 5.6, h: 0.4, fontSize: 11, color: '525257' })
  })
  foot(s)

  // 6) 진행 안내
  s = pptx.addSlide()
  heading(s, '진행 안내')
  doc.closing.steps.forEach((st, i) => {
    const y = 1.55 + i * 0.78
    s.addShape('roundRect', { x: 0.7, y, w: 0.52, h: 0.52, rectRadius: 0.26, fill: { color: 'FFFFFF' }, line: { color: AC, width: 1.5 } })
    s.addText(String(i + 1), { x: 0.7, y, w: 0.52, h: 0.52, fontSize: 13, color: INK, bold: true, align: 'center', valign: 'middle' })
    s.addText(st, { x: 1.45, y: y + 0.03, w: 7, h: 0.5, fontSize: 13.5, color: INK, valign: 'middle' })
  })
  s.addText(doc.closing.studio, { x: 8.9, y: 1.65, w: 3.8, h: 0.45, fontSize: 15, color: INK, bold: true })
  s.addText([...doc.closing.contact, doc.closing.address].filter(Boolean)
    .map((t) => ({ text: t, options: { breakLine: true, paraSpaceAfter: 4 } })),
    { x: 8.9, y: 2.2, w: 4.1, h: 2.4, fontSize: 11.5, color: '525257', valign: 'top' })
  foot(s)

  await pptx.writeFile({ fileName: `${plan.brand} 촬영 기획안.pptx` })
}

/* ============================================================ */
const STEP_TITLES = ['브랜드 · 제품', '촬영 목적', '무드 · 배경지', '컷 시트', '일정 · 예산']

export default function PlannerPage() {
  const [site, setSite] = useState(DEFAULT_SITE)
  const [step, setStep] = useState(0) // 0~4 위저드, 5 = 완성(미리보기)
  const [err, setErr] = useState('')
  const savedRef = useRef(false)
  const [aiMood, setAiMood] = useState(false) // /api/brand-mood 활성 여부 (ANTHROPIC_API_KEY 있을 때만 노출)
  const [p, setP] = useState({
    brand: '', industry: '', intro: '', productImgs: [], brandMood: null, sampleQty: '',
    shootType: '', purposes: [],
    moods: [], moodRefs: [],
    shots: [], shotsBase: '',
    shootDate: '', dueDate: '', budget: '', model: '', delivery: '',
  })
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }))
  const setShot = (i, patch) => setP((s) => ({ ...s, shots: s.shots.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  // 선택지 데이터 — 대시보드 [도우미] 탭에서 편집된 값 (없으면 기본값)
  const PL = site.planner || DEFAULT_SITE.planner
  const pickedMoods = (ids) => PL.moods.filter((m) => ids.includes(moodId(m)))

  useEffect(() => {
    supabase.from('inquiry_site').select('data').eq('id', 'main').maybeSingle()
      .then(({ data }) => { if (data?.data) setSite(mergeSite(data.data)) })
      .catch(() => {})
    // 브랜드 소개서 AI 분석 — 서버에 키가 설정된 경우에만 업로드 UI 노출
    fetch('/api/brand-mood').then((r) => r.json())
      .then((j) => setAiMood(!!j.enabled)).catch(() => {})
  }, [])
  useEffect(() => { document.title = `${site.studio.name} · 촬영 기획안 도우미` }, [site.studio.name])
  useEffect(() => { window.scrollTo(0, 0) }, [step])
  // 인쇄(PDF 저장)는 완성 화면에서만 — 견적서 인쇄 규칙(#root 숨김·세로 A4)과 겹치지 않게 body 클래스로 구분
  useEffect(() => {
    document.body.classList.toggle('pl-mode', step === 5)
    return () => document.body.classList.remove('pl-mode')
  }, [step])

  // 컷 시트 진입 시 유형·목적·무드 조합이 바뀌었으면 컷 다시 제안 (사용자 편집분은 조합 유지 시 보존)
  function suggestShots(prev) {
    const key = prev.shootType + '|' + prev.purposes.join(',') + '|' + prev.moods.join(',')
    if (prev.shotsBase === key && prev.shots.length) return prev
    const moods = pickedMoods(prev.moods)
    const base = shotSetFor(prev.shootType)
    const extras = prev.purposes.map((pu) => PURPOSE_EXTRA_SHOTS[pu]).filter(Boolean)
    const shots = [...base, ...extras].map((sh) => ({
      name: sh.name, desc: sh.desc, role: sh.role, use: sh.use,
      bg: resolveBg(sh.bg, moods), props: sh.props || '',
      on: sh.role !== 'alt', ref: null, note: '', custom: false,
    }))
    return { ...prev, shots, shotsBase: key }
  }

  function validate(i) {
    if (i === 0 && !p.brand.trim()) return '브랜드명(회사명)을 입력해 주세요.'
    if (i === 1 && !p.shootType) return '촬영 유형을 선택해 주세요.'
    if (i === 1 && !p.purposes.length) return '촬영 목적을 1개 이상 선택해 주세요.'
    if (i === 2 && !p.moods.length) return '마음에 드는 무드를 1~2개 골라주세요.'
    if (i === 3 && !p.shots.some((s) => s.on)) return '컷을 1개 이상 선택해 주세요.'
    return ''
  }
  function next() {
    const e = validate(step)
    if (e) { setErr(e); return }
    setErr('')
    if (step === 2) setP((s) => suggestShots(s))
    setStep((s) => s + 1)
  }

  const donePlan = useMemo(() => ({
    ...p, brand: p.brand.trim(), intro: p.intro.trim(),
    shots: p.shots.filter((s) => s.on),
  }), [p])
  const doc = useMemo(() => (step === 5 ? buildDoc(donePlan, site) : null), [step, donePlan, site])

  // 완성 시 1회 익명 저장 — 이미지 제외(RLS 20KB 제한), 테이블 없으면 조용히 무시
  useEffect(() => {
    if (step !== 5 || savedRef.current) return
    savedRef.current = true
    const lite = {
      ...donePlan, productImgs: undefined, moodRefs: undefined,
      brandMood: donePlan.brandMood ? { ...donePlan.brandMood, fileName: undefined } : undefined,
      shots: donePlan.shots.map(({ ref, ...rest }) => ({ ...rest, hasRef: !!ref })),
      createdAt: new Date().toISOString(),
    }
    supabase.from('planner_plans').insert({ data: JSON.parse(JSON.stringify(lite)) })
      .then(() => {}).catch(() => {})
  }, [step, donePlan])

  // /inquiry 폼으로 핸드오프 — localStorage 용량 때문에 이미지는 제외하고 텍스트로 전달
  function goInquiry() {
    const validPurposes = site.form.purposes || []
    const validFormats = site.form.planFormats || []
    const handoff = {
      brand: donePlan.brand,
      shootType: donePlan.shootType,
      purposes: [...new Set(donePlan.purposes.map((x) => PURPOSE_TO_INQUIRY[x] || '기타'))].filter((x) => validPurposes.includes(x)),
      concept: doc.tone.lines.join('\n'),
      planIntro: [donePlan.intro || `${donePlan.industry || ''} 브랜드 ${donePlan.brand}`.trim(),
        donePlan.sampleQty && `샘플 ${donePlan.sampleQty}`].filter(Boolean).join(' / '),
      planShots: doc.shots.map((s, i) =>
        `${i + 1}. ${s.name}${ROLE_BADGE[s.role] ? ` [${ROLE_BADGE[s.role]}]` : ''} — 배경지: ${s.bg.label}${s.props ? ` / 소품: ${s.props}` : ''}${s.ref ? ' / 레퍼런스 이미지 있음(파일 첨부 예정)' : ''}`
      ).join('\n'),
      planFormats: [...new Set(donePlan.purposes.map((x) => PURPOSE_TO_FORMAT[x]).filter(Boolean))].filter((x) => validFormats.includes(x)),
      planProps: [donePlan.model, donePlan.delivery].filter(Boolean).join(' / '),
      shootDate: donePlan.shootDate, dueDate: donePlan.dueDate, budget: donePlan.budget,
    }
    try { localStorage.setItem('hm_planner_handoff', JSON.stringify(handoff)) } catch (_) {}
    window.location.href = inquiryUrl('view=form&planner=1')
  }

  const S = site
  const pct = step >= 5 ? 100 : Math.round(((step + 1) / (STEP_TITLES.length + 1)) * 100)

  /* ---------- 완성 화면 ---------- */
  if (step === 5) {
    return (
      <div className="inq-bg">
        <style>{'@media print{@page{size:A4 landscape;margin:0}}'}</style>
        <div className="inq-wrap pl-wide">
          <div className="inq-sub-h pl-noprint">
            <button className="btn sm" onClick={() => setStep(3)}>← 컷 수정</button>
            <h2>기획안이 완성됐어요 🎉</h2>
          </div>
          <div className="pl-actions pl-noprint">
            <button className="btn primary" onClick={() => window.print()}>📄 PDF로 저장</button>
            <button className="btn" onClick={() => exportPptx(doc, donePlan).catch(() => alert('PPTX 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'))}>📊 PPT로 다운로드</button>
            <button className="btn" onClick={() => { savedRef.current = false; setStep(0); window.scrollTo(0, 0) }}>↺ 처음부터 다시</button>
          </div>
          <div className="pl-guide card pl-noprint">
            <b>📌 이 기획안은 '초안'이에요 — 다운로드해서 직접 수정해 완성해 주세요</b>
            <p>
              도우미가 만들어 드린 건 기획안의 뼈대예요. <b>PPT로 다운로드</b>하면 PowerPoint·구글 슬라이드에서
              문구·레퍼런스 이미지·컷 구성을 자유롭게 고칠 수 있으니, 브랜드 상황에 맞게 다듬은 뒤 촬영 문의에 첨부해 주세요.
            </p>
            <p className="mut3">
              PDF 저장: 인쇄 창에서 대상(프린터)을 <b>"PDF로 저장"</b>으로 선택하세요 · PPT에는 업로드한 이미지까지 그대로 들어가요
            </p>
          </div>

          <PlanDocScaler>
            <PlanDocument doc={doc} plan={donePlan} />
          </PlanDocScaler>

          <div className="pl-cta-box card pl-noprint">
            <b>이 기획안, 그대로 촬영으로 이어가 볼까요?</b>
            <p>아래 버튼을 누르면 기획안 내용이 문의 폼에 자동으로 채워져요.<br />레퍼런스 이미지는 문의 마지막 단계에서 파일·링크로 첨부하실 수 있습니다.</p>
            <button className="btn primary inq-cta" onClick={goInquiry}>✏️ 이 기획안 그대로 문의하기</button>
          </div>
          <div className="inq-foot mut3 pl-noprint">© {S.studio.name}</div>
        </div>
      </div>
    )
  }

  /* ---------- 위저드 ---------- */
  return (
    <div className="inq-bg">
      <div className="inq-wrap">
        <div className="inq-sub-h">
          <button className="btn sm" onClick={step === 0 ? () => (window.location.href = inquiryUrl()) : () => setStep(step - 1)}>
            ← {step === 0 ? '문의 페이지' : '이전'}
          </button>
          <h2>촬영 기획안 도우미</h2>
        </div>
        {step === 0 && (
          <div className="pl-intro card">
            🐥 <b>기획안, 써본 적 없어도 괜찮아요.</b> 선택만 하면 포토그래퍼·스타일리스트가 보고 준비할 수 있는 <b>실무형 촬영 기획안</b>(컷별 배경지·소품·레퍼런스)이 완성됩니다.
          </div>
        )}
        <div className="inq-prog"><div className="inq-prog-bar" style={{ width: pct + '%' }} /></div>
        <div className="inq-steps" aria-label={`${STEP_TITLES.length}단계 중 ${step + 1}단계`}>
          {STEP_TITLES.map((t, i) => (
            <div key={t} className={'inq-sdot' + (i === step ? ' on' : i < step ? ' done' : '')}>
              <span className="num">{i < step ? '✓' : i + 1}</span>
              <small>{t}</small>
            </div>
          ))}
        </div>

        <div className="inq-form card">
          {step === 0 && (
            <>
              <Field label="브랜드명 (회사명) *">
                <input value={p.brand} autoComplete="organization" onChange={(e) => set('brand', e.target.value)} placeholder="예: 홀리몰리 코스메틱" />
              </Field>
              <Field label="업종">
                <Chips options={PL.industries} value={p.industry} onPick={(v) => set('industry', v === p.industry ? '' : v)} />
              </Field>
              <Field label="촬영할 제품 · 아이템">
                <input value={p.intro} onChange={(e) => set('intro', e.target.value)} placeholder="예: 비건 립밤 3종 (단상자 + 용기)" />
                <small className="mut3">기획안 표지와 제품 정보에 들어가요.</small>
              </Field>
              <Field label={`제품 실물 사진 (선택 · 최대 ${MAX_PRODUCT_IMGS}장)`}>
                <MultiImagePick list={p.productImgs} max={MAX_PRODUCT_IMGS} onChange={(v) => set('productImgs', v)} />
                <small className="mut3">휴대폰으로 찍은 사진도 좋아요 — 기획안 'REAL IMAGE'로 들어가요. 여러 제품을 한 번에 촬영하고 싶다면 제품별로 올려주세요.</small>
              </Field>
              {aiMood && (
                <Field label="브랜드 소개서 (선택) — AI가 브랜드 무드를 분석해 기획안에 넣어드려요">
                  <BrandDeckPick value={p.brandMood} brand={p.brand}
                    onChange={(v) => set('brandMood', v)} onErr={setErr} />
                  <small className="mut3">PDF·이미지(3MB 이하)로 올려주시면 소개서에서 브랜드 무드·톤 키워드를 뽑아 TONE & MOOD 페이지에 자동으로 들어가요. 분석 결과는 직접 수정할 수 있어요.</small>
                </Field>
              )}
              <Field label="촬영용 샘플 수량">
                <input value={p.sampleQty} onChange={(e) => set('sampleQty', e.target.value)} placeholder="예: 단상자+용기 각 5개 (여분 포함)" />
                <small className="mut3">제형·시즐 연출이 있으면 여분 샘플이 꼭 필요해요. 모르면 비워두세요.</small>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="어떤 촬영인가요? *">
                <Chips options={S.form.shootTypes} value={p.shootType} onPick={(v) => set('shootType', v)} />
              </Field>
              <Field label="결과물을 어디에 쓰실 건가요? (복수 선택) *">
                <Chips multi options={PL.purposes} value={p.purposes}
                  onPick={(v) => set('purposes', p.purposes.includes(v) ? p.purposes.filter((x) => x !== v) : [...p.purposes, v])} />
                <small className="mut3">상세페이지를 고르면 상세페이지 구조(후킹 KV → 제형 → 스펙) 순서로 컷을 짜드려요.</small>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label={`끌리는 무드를 골라주세요 (최대 ${MAX_MOODS}개) *`}>
                <div className="pl-moods">
                  {PL.moods.map((m) => {
                    const id = moodId(m)
                    const on = p.moods.includes(id)
                    return (
                      <button key={id} type="button" className={'pl-mood' + (on ? ' on' : '')}
                        onClick={() => {
                          if (on) set('moods', p.moods.filter((x) => x !== id))
                          else if (p.moods.length < MAX_MOODS) set('moods', [...p.moods, id])
                          else setErr(`무드는 최대 ${MAX_MOODS}개까지 고를 수 있어요. 다른 무드를 해제하고 선택해 주세요.`)
                        }}>
                        <span className="pl-mood-sw">
                          {m.colors.map((c) => <i key={c} style={{ background: c }} />)}
                        </span>
                        <b>{m.name}</b>
                        <small>{m.keywords.map((k) => '#' + k).join(' ')}</small>
                        {on && <span className="pl-mood-chk">✓</span>}
                      </button>
                    )
                  })}
                </div>
                <small className="mut3">고른 무드의 컬러가 컷별 배경지 색 제안에 그대로 쓰여요.</small>
              </Field>
              <Field label={`무드 레퍼런스 이미지 (선택 · 최대 ${MAX_MOOD_REFS}장)`}>
                <MultiImagePick list={p.moodRefs} max={MAX_MOOD_REFS} onChange={(v) => set('moodRefs', v)} />
                <small className="mut3">핀터레스트·인스타에서 저장한 "이런 느낌!" 이미지를 올려주세요. 톤&무드 페이지에 들어가요.</small>
                <a className="btn sm" href="/reference" target="_blank" rel="noreferrer" style={{ marginTop: 8, textDecoration: 'none', display: 'inline-block' }}>
                  📌 레퍼런스 이미지 찾기 — 키워드로 핀터레스트 모아보기
                </a>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <div className="pl-intro card" style={{ marginBottom: 14 }}>
                ✂️ 컷마다 <b>배경지 색 · 소품 · 레퍼런스 이미지</b>를 채울 수 있어요. 레퍼런스가 있으면 촬영 결과가 훨씬 정확해집니다. (없으면 비워두세요 — 상담에서 함께 찾아드려요)
              </div>
              <Field label={`컷 시트 (${p.shots.filter((s) => s.on).length}컷 선택됨)`}>
                <div className="pl-cuts">
                  {p.shots.map((sh, i) => (
                    <CutCard key={i} sh={sh} i={i} moods={pickedMoods(p.moods)}
                      onPatch={(patch) => setShot(i, patch)}
                      onRemove={sh.custom ? () => set('shots', p.shots.filter((_, j) => j !== i)) : null}
                      onErr={setErr} />
                  ))}
                </div>
              </Field>
              <AddShot onAdd={(name, desc) => set('shots', [...p.shots, {
                name, desc, role: '', use: '', bg: resolveBg('mood0', pickedMoods(p.moods)),
                props: '', on: true, ref: null, note: '', custom: true,
              }])} />
            </>
          )}

          {step === 4 && (
            <>
              <Field label="희망 촬영일 (미정이면 비워두세요)">
                <input type="date" value={p.shootDate} onChange={(e) => set('shootDate', e.target.value)} />
              </Field>
              <Field label="결과물 필요일">
                <input type="date" value={p.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
              </Field>
              <Field label="예산 범위">
                <div className="inq-chips col">
                  {S.form.budgetRanges.map((b) => (
                    <button key={b} type="button" className={'inq-chip' + (p.budget === b ? ' on' : '')}
                      onClick={() => set('budget', b === p.budget ? '' : b)}>
                      {b}
                      {b === S.form.budgetPopular && <span className="inq-pop">가장 많이 선택</span>}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="모델이 필요한가요?">
                <Chips options={PL.modelOptions} value={p.model} onPick={(v) => set('model', v === p.model ? '' : v)} />
              </Field>
              <Field label="샘플 · 소품 전달 방법">
                <input value={p.delivery} onChange={(e) => set('delivery', e.target.value)} placeholder="예: 제품·소품은 촬영 이틀 전 택배로 보낼게요" />
              </Field>
            </>
          )}

          {err && <div className="inq-err" role="alert">⚠ {err}</div>}
          <div className="inq-form-f">
            <button className="btn primary inq-cta" onClick={next}>
              {step === STEP_TITLES.length - 1 ? '기획안 만들기 ✨' : '다음 →'}
            </button>
          </div>
        </div>
        <div className="inq-foot mut3">© {S.studio.name}</div>
      </div>
    </div>
  )
}

/* ---------- 컷 편집 카드 ---------- */
function CutCard({ sh, i, moods, onPatch, onRemove, onErr }) {
  const [open, setOpen] = useState(false)
  // 배경지 선택지: 프리셋 + 선택 무드 컬러
  const bgOptions = [
    ...BG_PRESETS,
    ...moods.flatMap((m, mi) => m.colors.slice(0, 2).map((c, ci) => ({
      key: `m${mi}${ci}`, label: `${m.name.split(' · ')[0]} 톤${ci ? ' (딥)' : ''}`, color: c,
    }))),
  ]
  const badge = ROLE_BADGE[sh.role]
  return (
    <div className={'pl-cut' + (sh.on ? ' on' : '')}>
      <div className="pl-cut-h">
        <input type="checkbox" checked={sh.on} onChange={() => onPatch({ on: !sh.on })} aria-label="컷 포함" />
        <button type="button" className="pl-cut-t" onClick={() => setOpen(!open)}>
          <b>{sh.name} {badge && <em className={'pl-role ' + sh.role}>{badge}</em>}</b>
          <small>{sh.desc}</small>
          <span className="pl-cut-meta">
            <i className="pl-sw" style={sh.bg.color ? { background: sh.bg.color } : { background: '#fff', borderStyle: 'dashed' }} />
            {sh.bg.label}{sh.props ? ` · 소품 ${sh.props.split(',').length}` : ''}{sh.ref ? ' · 📎 레퍼런스' : ''}
          </span>
        </button>
        <span className="pl-cut-arr" onClick={() => setOpen(!open)}>{open ? '⌃' : '⌄'}</span>
        {onRemove && <button type="button" className="x" onClick={onRemove}>✕</button>}
      </div>
      {open && sh.on && (
        <div className="pl-cut-body">
          <div className="pl-cut-lbl">배경지 색</div>
          <div className="pl-bgchips">
            {bgOptions.map((b) => (
              <button key={b.key} type="button" className={'pl-bgchip' + (sh.bg.label === b.label ? ' on' : '')}
                onClick={() => onPatch({ bg: { label: b.label, color: b.color } })} title={b.label}>
                <i style={b.color ? { background: b.color } : { background: '#fff', borderStyle: 'dashed' }} />
                <small>{b.label}</small>
              </button>
            ))}
            <label className="pl-bgchip custom">
              <input type="color" value={sh.bg.color || '#eeeeee'}
                onChange={(e) => onPatch({ bg: { label: `커스텀 (${e.target.value})`, color: e.target.value } })} />
              <small>직접 선택</small>
            </label>
          </div>
          <div className="pl-cut-lbl">소품 · 원물</div>
          <input value={sh.props} onChange={(e) => onPatch({ props: e.target.value })}
            placeholder="예: 유리 오브제, 아크릴 스탠드, 원물(레몬)" />
          <div className="pl-cut-lbl">레퍼런스 이미지 (이 컷의 "이런 느낌" 1장)</div>
          <ImagePick value={sh.ref} onChange={(v) => onPatch({ ref: v })} onErr={onErr} label="핀터레스트·인스타 저장 이미지" />
          <div className="pl-cut-lbl">메모 (포토그래퍼에게)</div>
          <input value={sh.note} onChange={(e) => onPatch({ note: e.target.value })}
            placeholder="예: 로고가 꼭 정면으로 보이게 / 제형은 흐르기 직전 느낌으로" />
        </div>
      )}
    </div>
  )
}

/* ---------- 모바일 대응 — 문서를 접지 않고 데스크톱 가로 레이아웃 그대로 축소해서 보여준다.
   화면 폭이 문서 기준 폭(844px = .pl-wide 880px − inq-wrap 좌우 패딩 36px)보다 좁으면
   그 비율만큼 zoom을 걸어 PPT 미리보기처럼 통째로 스케일 다운. 인쇄 시엔 CSS에서 zoom 해제 ---------- */
const PL_DOC_W = 844
function PlanDocScaler({ children }) {
  const boxRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const calc = () => {
      const w = boxRef.current?.clientWidth || 0
      setZoom(w && w < PL_DOC_W ? w / PL_DOC_W : 1)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return (
    <div ref={boxRef}>
      <div className="pl-doczoom" style={zoom < 1 ? { zoom, width: PL_DOC_W } : undefined}>
        {children}
      </div>
    </div>
  )
}

/* ---------- 기획안 문서 (웹 미리보기 = 인쇄(PDF) 원본) ---------- */
function PlanDocument({ doc, plan }) {
  const ac = doc.accent
  let pg = 0
  const foot = () => {
    pg += 1
    return (
      <div className="pl-pg-foot">
        <span>{plan.brand} 촬영 기획안 · made with {doc.closing.studio} 기획안 도우미</span>
        <span className="num">{String(pg).padStart(2, '0')}</span>
      </div>
    )
  }
  const CUT = /영상/.test(plan.shootType) ? 'SCENE' : 'CUT'
  return (
    <div className="pl-doc">
      {/* 표지 */}
      <section className="pl-pg pl-cover" style={{ borderLeft: `10px solid ${ac}` }}>
        <div className="pl-cover-lbl">{doc.cover.label}</div>
        <h1>{doc.cover.title}</h1>
        <div className="pl-cover-sub">{doc.cover.sub}</div>
        <div className="pl-cover-total num">총 {doc.cover.total}컷</div>
        <div className="pl-cover-kw">{doc.cover.keywords.map((k) => <span key={k}>#{k}</span>)}</div>
        <div className="pl-cover-date num">{doc.cover.date}</div>
        {foot()}
      </section>

      {/* PRODUCT */}
      <section className="pl-pg">
        <h2>PRODUCT — 제품 정보</h2>
        <div className="pl-prod">
          <div className="pl-ov">
            {doc.product.rows.map(([k, v]) => (
              <div key={k} className="pl-ov-row"><span>{k}</span><b>{v}</b></div>
            ))}
          </div>
          {doc.product.imgs.length > 0 && (
            <figure className="pl-real">
              <figcaption>REAL IMAGE</figcaption>
              <div className={'pl-real-grid' + (doc.product.imgs.length > 1 ? ' multi' : '')}>
                {doc.product.imgs.map((im, i) => <img key={i} src={im} alt={'제품 실물 ' + (i + 1)} />)}
              </div>
            </figure>
          )}
        </div>
        {foot()}
      </section>

      {/* TONE & MOOD */}
      <section className="pl-pg">
        <h2>TONE & MOOD — 톤 · 배경지</h2>
        <div className="pl-concept">
          <div className="pl-concept-tx">
            {doc.tone.lines.map((t, i) => <p key={i}>{t}</p>)}
            <div className="pl-mood-swrow">
              {doc.moods.map((m) => (
                <div key={m.key} className="pl-mood-doc">
                  <b>{m.name}</b>
                  <span className="pl-mood-sw big">{m.colors.map((c) => <i key={c} style={{ background: c }} />)}</span>
                  <small>쨍한 원색 X — 탁도 있는 톤</small>
                </div>
              ))}
            </div>
          </div>
          {doc.tone.refs.length > 0 && (
            <div className="pl-refgrid">
              {doc.tone.refs.map((r, i) => <img key={i} src={r} alt={'무드 레퍼런스 ' + (i + 1)} />)}
              <small>전반적인 무드 ref.</small>
            </div>
          )}
        </div>
        {foot()}
      </section>

      {/* SHOT LIST — 전체 컷 한눈에 (현장 체크리스트) */}
      <section className="pl-pg">
        <h2>SHOT LIST — 전체 컷 <em className="num">총 {doc.shots.length}컷 · {CUT}당 1페이지 상세</em></h2>
        <table className="pl-table pl-sl">
          <thead>
            <tr><th className="chk">✓</th><th>NO.</th><th>컷</th><th>배경지</th><th>소품 · 원물</th><th>역할</th></tr>
          </thead>
          <tbody>
            {doc.shots.map((sh, i) => (
              <tr key={i}>
                <td className="chk"><span className="pl-chkbox" /></td>
                <td className="num">{String(i + 1).padStart(2, '0')}</td>
                <td><b>{sh.name}</b></td>
                <td><i className="pl-sw" style={sh.bg.color ? { background: sh.bg.color } : { background: '#fff', borderStyle: 'dashed' }} /> {sh.bg.label}</td>
                <td>{sh.props || '—'}</td>
                <td>{ROLE_BADGE[sh.role] ? <em className={'pl-role ' + sh.role} style={sh.role === 'kv' ? { color: ac, borderColor: ac } : {}}>{ROLE_BADGE[sh.role]}</em> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <small className="pl-sl-hint">현장에서 촬영이 끝난 컷은 ✓ 체크 — 상세 내용은 다음 페이지부터 컷당 1페이지로 이어집니다.</small>
      </section>

      {/* CUT 상세 — 페이지당 1컷 (좌: 제품·배경지 / 중: 레퍼런스 / 우: 포인트·소품) */}
      {doc.shots.map((sh, i) => {
        const no = String(i + 1).padStart(2, '0')
        const pts = cutPoints(sh)
        const props = cutProps(sh)
        return (
          <section key={'cut' + i} className="pl-pg pl-cutpg">
            <div className="pl-cutpg-brand">{docHeader(plan)}</div>
            <h2>
              {CUT} {no} — {sh.name}
              {ROLE_BADGE[sh.role] && <em className={'pl-role ' + sh.role} style={sh.role === 'kv' ? { color: ac, borderColor: ac } : {}}>{ROLE_BADGE[sh.role]}</em>}
              <em className="num">{i + 1} / {doc.shots.length}</em>
            </h2>
            <div className="pl-cutpg-grid">
              <aside className="pl-cutpg-side">
                <div className="pl-side-blk">
                  <div className="pl-side-lbl">제품</div>
                  {doc.product.img
                    ? <img className="pl-side-prod" src={doc.product.img} alt="제품 실물" />
                    : <div className="pl-side-prod ph"><span>실물 사진<br />미첨부</span></div>}
                </div>
                <div className="pl-side-blk">
                  <div className="pl-side-lbl">배경지</div>
                  <div className={'pl-side-bg' + (sh.bg.color ? '' : ' none')} style={sh.bg.color ? { background: sh.bg.color } : {}}>
                    {!sh.bg.color && <span>배경 X</span>}
                  </div>
                  <small>{sh.bg.label}</small>
                </div>
              </aside>
              <div className="pl-cutpg-ref">
                {sh.ref
                  ? <img src={sh.ref} alt={sh.name + ' 레퍼런스'} />
                  : <div className="pl-cutpg-ph" style={sh.bg.color ? { background: sh.bg.color } : {}}>
                      <span>레퍼런스 이미지 자리<br />(카톡·메일로 전달 가능)</span>
                    </div>}
              </div>
              <div className="pl-cutpg-info">
                <b className="pl-info-t">촬영컷 포인트 및 설명</b>
                <ul>{pts.map((t, j) => <li key={j}>{t}</li>)}</ul>
                {sh.use && <div className="pl-info-use"><span>사용처</span>{sh.use}</div>}
                <b className="pl-info-t">필요 소품 리스트</b>
                <ul>
                  {props.length
                    ? props.map((t, j) => <li key={j}>{t}</li>)
                    : <li className="mut">별도 소품 없음 — 스튜디오 기본 소품으로 진행</li>}
                </ul>
              </div>
            </div>
            {foot()}
          </section>
        )
      })}

      {/* PREP — 준비물 체크리스트 */}
      <section className="pl-pg">
        <h2>PREP — 준비물 체크리스트</h2>
        <div className="pl-prep">
          <div>
            <b className="pl-prep-t">배경지</b>
            {doc.prep.bgs.map((b, i) => (
              <div key={i} className="pl-prep-row">
                <i className="pl-sw" style={b.color ? { background: b.color } : { background: '#fff', borderStyle: 'dashed' }} />
                <span>{b.label}</span>
                <small className="num">컷 {b.cuts.join(', ')}</small>
              </div>
            ))}
            <b className="pl-prep-t" style={{ marginTop: 18 }}>일정 · 예산</b>
            {doc.schedule.map(([k, v]) => (
              <div key={k} className="pl-prep-row"><span>{k}</span><small>{v}</small></div>
            ))}
          </div>
          <div>
            <b className="pl-prep-t">소품 · 원물</b>
            {doc.prep.props.length
              ? doc.prep.props.map((pr, i) => (
                <div key={i} className="pl-prep-row"><small className="num">컷 {pr.cut}</small><span>{pr.props}</span></div>
              ))
              : <div className="pl-prep-row"><span className="mut3">별도 소품 없음 — 스튜디오 기본 소품으로 진행</span></div>}
            <b className="pl-prep-t" style={{ marginTop: 18 }}>브랜드에서 전달해 주세요</b>
            {doc.prep.etc.map((t, i) => <div key={i} className="pl-prep-row"><span>· {t}</span></div>)}
          </div>
        </div>
        {foot()}
      </section>

      {/* 진행 안내 */}
      <section className="pl-pg">
        <h2>진행 안내</h2>
        <div className="pl-close">
          <ol className="pl-steps-doc">
            {doc.closing.steps.map((s, i) => (
              <li key={i}><span className="num" style={{ borderColor: ac }}>{i + 1}</span>{s}</li>
            ))}
          </ol>
          <div className="pl-studio">
            <b>{doc.closing.studio}</b>
            {doc.closing.contact.map((c) => <span key={c}>{c}</span>)}
            {doc.closing.address && <span>{doc.closing.address}</span>}
          </div>
        </div>
        {foot()}
      </section>
    </div>
  )
}

/* ---------- 이미지 업로드 (1장) ---------- */
function ImagePick({ value, onChange, label, onErr }) {
  const ref = useRef(null)
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { onChange(await readImage(file)) } catch (_) { onErr?.('이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.') }
  }
  return value ? (
    <div className="pl-imgprev">
      <img src={value} alt="업로드 이미지" />
      <button type="button" className="x" onClick={() => onChange(null)}>✕ 삭제</button>
    </div>
  ) : (
    <>
      <button type="button" className="inq-file-btn" onClick={() => ref.current?.click()}>
        🖼 이미지 선택 {label && <small className="mut3">{label}</small>}
      </button>
      <input ref={ref} type="file" hidden accept="image/png,image/jpeg,image/webp,image/heic" onChange={pick} />
    </>
  )
}

/* ---------- 이미지 업로드 (여러 장) ---------- */
function MultiImagePick({ list, max, onChange }) {
  const ref = useRef(null)
  async function pick(e) {
    const files = Array.from(e.target.files || []).slice(0, max - list.length)
    e.target.value = ''
    const imgs = []
    for (const f of files) { try { imgs.push(await readImage(f, 900)) } catch (_) {} }
    if (imgs.length) onChange([...list, ...imgs])
  }
  return (
    <div>
      <div className="pl-refpick">
        {list.map((img, i) => (
          <div key={i} className="pl-refpick-it">
            <img src={img} alt={'레퍼런스 ' + (i + 1)} />
            <button type="button" className="x" onClick={() => onChange(list.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {list.length < max && (
          <button type="button" className="pl-refpick-add" onClick={() => ref.current?.click()}>＋</button>
        )}
      </div>
      <input ref={ref} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/heic" onChange={pick} />
    </div>
  )
}

/* ---------- 브랜드 소개서 업로드 → AI 무드 분석 ---------- */
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(String(r.result).split(',')[1] || '')
  r.onerror = () => reject(new Error('read fail'))
  r.readAsDataURL(file)
})

function BrandDeckPick({ value, brand, onChange, onErr }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { onErr('브랜드 소개서는 3MB 이하의 PDF나 이미지로 올려주세요. (용량이 크면 핵심 페이지만 캡처해서 올려도 좋아요)'); return }
    setBusy(true)
    onErr('')
    try {
      const data = await fileToBase64(file)
      const res = await fetch('/api/brand-mood', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: file.type === 'application/pdf' ? 'pdf' : 'image',
          media_type: file.type, data, brand: brand || '',
        }),
      })
      const j = await res.json()
      if (!res.ok || j.error || !j.summary) throw new Error(j.error || 'analyze fail')
      onChange({ summary: j.summary, keywords: j.keywords || [], fileName: file.name })
    } catch (_) {
      onErr('소개서 분석에 실패했어요. 파일을 확인하거나 잠시 후 다시 시도해 주세요.')
    }
    setBusy(false)
  }
  if (busy) return <div className="pl-deck busy">🔎 소개서를 읽고 브랜드 무드를 분석하고 있어요… (10초 정도 걸려요)</div>
  if (value) {
    return (
      <div className="pl-deck done">
        <div className="pl-deck-h">
          <span>📄 {value.fileName || '브랜드 소개서'} — 분석 완료</span>
          <button type="button" className="x" onClick={() => onChange(null)}>✕ 삭제</button>
        </div>
        {value.keywords.length > 0 && (
          <div className="pl-deck-kw">{value.keywords.map((k) => <em key={k}>#{k}</em>)}</div>
        )}
        <textarea rows={3} value={value.summary}
          onChange={(e) => onChange({ ...value, summary: e.target.value })}
          placeholder="분석된 브랜드 무드 — 자유롭게 수정하세요" />
      </div>
    )
  }
  return (
    <>
      <button type="button" className="inq-file-btn" onClick={() => ref.current?.click()}>
        📄 브랜드 소개서 올리기 <small className="mut3">PDF · 이미지 (3MB 이하)</small>
      </button>
      <input ref={ref} type="file" hidden accept="application/pdf,image/jpeg,image/png,image/webp" onChange={pick} />
    </>
  )
}

function AddShot({ onAdd }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  return (
    <div className="pl-addshot">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="컷 직접 추가 — 이름 (예: 패키지 개봉컷)" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="설명 (선택)" />
      <button type="button" className="btn sm" disabled={!name.trim()}
        onClick={() => { onAdd(name.trim(), desc.trim()); setName(''); setDesc('') }}>+ 추가</button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="inq-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Chips({ options, value, onPick, multi }) {
  const on = (o) => (multi ? value.includes(o) : value === o)
  return (
    <div className="inq-chips">
      {options.map((o) => (
        <button key={o} type="button" className={'inq-chip' + (on(o) ? ' on' : '')} onClick={() => onPick(o)}>{o}</button>
      ))}
    </div>
  )
}
