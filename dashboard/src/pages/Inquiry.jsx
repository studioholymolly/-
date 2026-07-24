/* ============================================================
   공개 촬영 문의 페이지 (/inquiry) — 로그인 없이 접근
   - 링크트리형 랜딩 → 소개/진행 과정/견적/FAQ/문의 폼(4스텝)
   - 콘텐츠는 Supabase inquiry_site에서 로드 (없으면 기본값)
     → 대시보드 [촬영 문의 → 폼 콘텐츠 편집]에서 수정
   - AuthProvider·data.js와 완전 격리 (supabase 클라이언트만 사용)
   - 예산은 inquiry_budgets로 분리 저장 (관리자만 조회 가능)
   - 파일 업로드는 Turnstile 검증 후 Edge Function 서명 URL로만
============================================================ */
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase.js'
import { DEFAULT_SITE, mergeSite } from '../inquirySite.js'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
const MAX_FILES = 3
const MAX_SIZE = 20 * 1024 * 1024
const MAX_TOTAL = 50 * 1024 * 1024

// crypto.randomUUID는 보안 컨텍스트 전용 — 일부 인앱 브라우저 대비 폴백
function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const VIEWS = ['home', 'about', 'process', 'pricing', 'info', 'form', 'schedule', 'location']
// ?embed=1 — 홈페이지(studioholymolly.com) iframe 임베드 모드: 랜딩으로 돌아가는 버튼을 숨긴다
const EMBED = new URLSearchParams(window.location.search).get('embed') === '1'

// 기획안 도우미(/planner) 연동
const PLANNER_URL = '/planner' + (EMBED ? '?embed=1' : '')
// 레퍼런스 파인더(/reference) — 도우미와 동일하게 같은 탭에서 이동 (뒤로가기 버튼으로 복귀)
const REFERENCE_URL = '/reference' + (EMBED ? '?embed=1' : '')
// ?planner=1 — 도우미에서 "이 기획안 그대로 문의하기"로 넘어온 경우: localStorage 핸드오프를 폼 초기값으로
const PLANNER_HANDOFF = (() => {
  try {
    if (new URLSearchParams(window.location.search).get('planner') !== '1') return null
    return JSON.parse(localStorage.getItem('hm_planner_handoff') || 'null')
  } catch (_) { return null }
})()

export default function InquiryPage() {
  // ?view=form 처럼 URL로 특정 화면을 바로 열 수 있음 (웹사이트 임베드용)
  const [view, setView] = useState(() => {
    const v = new URLSearchParams(window.location.search).get('view')
    return VIEWS.includes(v) ? v : 'home'
  }) // home | about | process | pricing | info | form | done
  const [site, setSite] = useState(DEFAULT_SITE)

  useEffect(() => {
    supabase.from('inquiry_site').select('data').eq('id', 'main').maybeSingle()
      .then(({ data }) => { if (data?.data) setSite(mergeSite(data.data)) })
      .catch(() => {})
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [view])
  // 공개 페이지 탭 제목 — 대시보드 기본 title('운영 대시보드')이 고객에게 노출되지 않게
  useEffect(() => { document.title = `${site.studio.name} · 촬영 문의` }, [site.studio.name])

  const S = site

  return (
    <div className="inq-bg">
      <div className="inq-wrap">
        {view === 'home' && <Landing S={S} go={setView} />}

        {view === 'about' && (
          <SubPage title="스튜디오 소개" go={setView} cta={S.studio.ctaLabel}>
            <div className="inq-about card">
              {S.about.paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            </div>
            <div className="inq-notes card">
              <b className="inq-notes-t">주요 업무</b>
              {S.about.services.map((s, i) => <p key={i}>· {s}</p>)}
              {S.about.clients && <p className="inq-clients">함께한 브랜드 — {S.about.clients}</p>}
            </div>
            <ContactCard S={S} />
          </SubPage>
        )}

        {view === 'process' && (
          <SubPage title="촬영 진행 과정" go={setView} cta={S.studio.ctaLabel}>
            {groupSteps(S.processSteps).map((g, gi) => (
              <div key={gi}>
                {g.tag && <div className="inq-ph">{g.tag}</div>}
                <div className="inq-tl card">
                  {g.items.map((s) => (
                    <div key={s.n} className="inq-step">
                      <div className="inq-step-n num">{String(s.n).padStart(2, '0')}</div>
                      <div className="inq-step-b">
                        <b>{s.title}</b>
                        <p>{s.desc}</p>
                        {s.img && <img src={s.img} alt={s.title} loading="lazy" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </SubPage>
        )}

        {view === 'pricing' && (
          <SubPage title="촬영 견적 · 옵션 안내" go={setView} cta={S.studio.ctaLabel}>
            {S.pricingItems.map((it, i) => (
              <div key={i} className="inq-price card">
                <div className="inq-price-h">
                  <b>{it.title}</b>
                  <span className={'pill ' + (/원|만|₩|\d/.test(it.price || '') ? 'solid' : 'line')}>{it.price}</span>
                </div>
                <p>{it.desc}</p>
                {it.img && <img src={it.img} alt={it.title} loading="lazy" />}
              </div>
            ))}
            <div className="inq-notes card">
              <b className="inq-notes-t">📌 참고해 주세요</b>
              {S.pricingNotes.map((n, i) => <p key={i}>· {n}</p>)}
            </div>
          </SubPage>
        )}

        {view === 'info' && (
          <SubPage title="상세 안내 · FAQ" go={setView} cta={S.studio.ctaLabel}>
            {S.infoItems.map((it, i) => (
              <details key={i} className="inq-faq card" open={i === 0}>
                <summary><span className="inq-faq-q">Q</span>{it.q}<span className="inq-faq-arr">⌄</span></summary>
                <p>{it.a}</p>
              </details>
            ))}
            <ContactCard S={S} />
          </SubPage>
        )}

        {view === 'schedule' && (
          <SubPage title="촬영 스케줄" go={setView} cta={S.studio.ctaLabel}>
            <ScheduleCalendar S={S} />
          </SubPage>
        )}

        {view === 'location' && (
          <SubPage title="스튜디오 위치 · 오시는 길" go={setView} cta={S.studio.ctaLabel}>
            <LocationCard S={S} />
          </SubPage>
        )}

        {view === 'form' && <InquiryForm S={S} onDone={() => setView('done')} onBack={() => setView('home')} />}
        {view === 'done' && <Done S={S} go={setView} />}
        <div className="inq-foot mut3">© {S.studio.name}</div>
      </div>
    </div>
  )
}

/* ---------- 랜딩 (링크트리 스타일) ---------- */
function Landing({ S, go }) {
  // 상단 고정 버튼 3개 — 문구·표시 여부는 폼 콘텐츠 편집기 [랜딩 버튼] 탭에서 관리
  const LF = S.landingFixed || {}
  const inq = LF.inquiry || {}
  const pl = LF.planner || {}
  const rf = LF.reference || {}
  return (
    <>
      <div className="inq-hero">
        <img className="inq-logo-img" src="/brand/simbol-bk.png" alt={S.studio.name} />
        <h1>{S.studio.name}</h1>
        <div className="mut inq-tagline">{S.studio.tagline}</div>
      </div>
      <div className="inq-links">
        <button className="inq-link primary" onClick={() => go('form')}>
          <span className="inq-link-ic">{inq.ic || '✏️'}</span>
          <span className="inq-link-t"><b>{inq.title || '촬영 문의 등록하기'}</b><small>{inq.desc || S.studio.replyPromise}</small></span>
          <span className="inq-link-a">→</span>
        </button>
        {pl.on !== false && (
          <button className="inq-link card" onClick={() => (window.location.href = PLANNER_URL)}>
            <span className="inq-link-ic">{pl.ic || '🐥'}</span>
            <span className="inq-link-t"><b>{pl.title || '촬영 기획안 도우미'}</b><small>{pl.desc}</small></span>
            <span className="inq-link-a">→</span>
          </button>
        )}
        {rf.on !== false && (
          <button className="inq-link card" onClick={() => (window.location.href = REFERENCE_URL)}>
            <span className="inq-link-ic">{rf.ic || '📌'}</span>
            <span className="inq-link-t"><b>{rf.title || '촬영 레퍼런스 모아보기'}</b><small>{rf.desc}</small></span>
            <span className="inq-link-a">→</span>
          </button>
        )}
        {S.landing.map((l, i) => {
          // kakao·website는 기본 정보의 URL, link는 버튼에 직접 넣은 URL로 연결
          const href =
            l.view === 'kakao' ? (S.contact.kakaoChatUrl || S.contact.kakaoUrl)
            : l.view === 'website' ? S.contact.website
            : l.view === 'link' ? l.href
            : ''
          if (['kakao', 'website', 'link'].includes(l.view) && !href) return null
          const inner = (
            <>
              <span className="inq-link-ic">{l.ic}</span>
              <span className="inq-link-t"><b>{l.title}</b><small>{l.desc}</small></span>
              <span className="inq-link-a">{href ? '↗' : '→'}</span>
            </>
          )
          return href ? (
            <a key={i} className="inq-link card" href={href} target="_blank" rel="noreferrer">{inner}</a>
          ) : (
            <button key={i} className="inq-link card" onClick={() => go(l.view)}>{inner}</button>
          )
        })}
      </div>
    </>
  )
}

/* ---------- 촬영 스케줄 ----------
   schedule.embedUrl(구글 캘린더 임베드)이 있으면 그대로 보여주고,
   없으면 예약된 "날짜"만 Supabase RPC(inquiry_busy_dates)로 받아 자체 달력 표시.
   (자체 달력엔 프로젝트명·고객 정보가 서버에서부터 내려오지 않는다) */
function ScheduleCalendar({ S }) {
  if (S.schedule?.embedUrl) {
    return (
      <>
        <iframe className="inq-embed card" src={S.schedule.embedUrl} title="촬영 스케줄" loading="lazy" />
        {S.schedule?.note && (
          <div className="inq-notes card">
            <b className="inq-notes-t">📌 참고해 주세요</b>
            <p>{S.schedule.note}</p>
          </div>
        )}
      </>
    )
  }
  return <BusyDatesCalendar S={S} />
}

function BusyDatesCalendar({ S }) {
  const d0 = new Date()
  const todayStr = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`
  const [ym, setYm] = useState(todayStr.slice(0, 7))
  const [busy, setBusy] = useState(null) // null=로딩, Set=완료
  const [fail, setFail] = useState(false)

  useEffect(() => {
    supabase.rpc('inquiry_busy_dates')
      .then(({ data, error }) => {
        if (error) { setFail(true); setBusy(new Set()) }
        else setBusy(new Set((data || []).map((r) => String(r.busy_date))))
      })
      .catch(() => { setFail(true); setBusy(new Set()) })
  }, [])

  const [y, m] = ym.split('-').map(Number)
  const startDow = new Date(y, m - 1, 1).getDay()
  const daysIn = new Date(y, m, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysIn; d++) cells.push(`${ym}-${String(d).padStart(2, '0')}`)

  // 이번 달 ~ +N개월까지만 넘겨볼 수 있게
  const maxMonths = Math.max(1, Number(S.schedule?.months) || 3)
  const ymOf = (diff) => {
    const d = new Date(d0.getFullYear(), d0.getMonth() + diff, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const canPrev = ym > ymOf(0)
  const canNext = ym < ymOf(maxMonths)
  const nav = (diff) => {
    const d = new Date(y, m - 1 + diff, 1)
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <>
      <div className="inq-cal card">
        <div className="inq-cal-h">
          <button className="btn sm" onClick={() => nav(-1)} disabled={!canPrev} aria-label="이전 달">←</button>
          <b className="num">{y}년 {m}월</b>
          <button className="btn sm" onClick={() => nav(1)} disabled={!canNext} aria-label="다음 달">→</button>
        </div>
        <div className="inq-cal-dow">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <span key={d} className={i === 0 ? 'sun' : ''}>{d}</span>
          ))}
        </div>
        <div className="inq-cal-grid">
          {cells.map((date, i) => {
            if (!date) return <span key={'e' + i} className="inq-cal-d empty" />
            const isPast = date < todayStr
            const isBusy = !!busy && busy.has(date)
            return (
              <span key={date} className={
                'inq-cal-d' + (date === todayStr ? ' today' : '') + (isPast ? ' past' : '') + (isBusy ? ' busy' : '')
              }>
                <em className="num">{Number(date.slice(8))}</em>
                {isBusy && <i aria-label="촬영 예약 있음" />}
              </span>
            )
          })}
        </div>
        <div className="inq-cal-legend">
          <span><i className="dot" />촬영 예약 있음</span>
          <span><i className="ring" />문의 가능</span>
        </div>
        {busy === null && <div className="mut3 inq-cal-msg">예약 현황을 불러오는 중…</div>}
        {fail && <div className="mut3 inq-cal-msg">예약 현황을 불러오지 못했어요 — 원하시는 날짜로 문의 주시면 바로 확인해 드립니다.</div>}
      </div>
      <div className="inq-notes card">
        <b className="inq-notes-t">📌 참고해 주세요</b>
        <p>{S.schedule?.note}</p>
      </div>
    </>
  )
}

/* ---------- 스튜디오 위치 · 오시는 길 ---------- */
function LocationCard({ S }) {
  const P = S.place || {}
  const [copied, setCopied] = useState(false)
  const fullAddr = [P.address, P.addressDetail].filter(Boolean).join(' ')

  async function copyAddr() {
    try {
      await navigator.clipboard.writeText(fullAddr)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (_) {
      prompt('주소를 복사해 주세요', fullAddr) // 클립보드 미지원 인앱 브라우저 폴백
    }
  }

  return (
    <>
      <div className="inq-loc card">
        <div className="inq-loc-pin">📍</div>
        <b>{S.studio.name}</b>
        <p>{fullAddr}</p>
        <div className="inq-loc-btns">
          {P.naverMapUrl && (
            <a className="btn primary inq-loc-map" href={P.naverMapUrl} target="_blank" rel="noreferrer">
              🧭 네이버 지도로 보기
            </a>
          )}
          <button className="btn" onClick={copyAddr}>{copied ? '복사됨 ✓' : '주소 복사'}</button>
        </div>
      </div>
      {(P.notes || []).length > 0 && (
        <div className="inq-notes card">
          <b className="inq-notes-t">🚗 오시는 길 안내</b>
          {P.notes.map((n, i) => <p key={i}>· {n}</p>)}
        </div>
      )}
      <ContactCard S={S} />
    </>
  )
}

/* 진행 과정 스텝을 tag(촬영 전/후)별 연속 구간으로 묶는다 */
function groupSteps(steps) {
  const groups = []
  steps.forEach((s, i) => {
    const last = groups[groups.length - 1]
    const tag = s.tag || ''
    if (!last || last.tag !== tag) groups.push({ tag, items: [] })
    groups[groups.length - 1].items.push({ ...s, n: i + 1 })
  })
  return groups
}

function ContactCard({ S }) {
  const c = S.contact
  return (
    <div className="inq-contact card">
      {c.phone && <a href={'tel:' + c.phone}>📞 {c.phone}</a>}
      {c.email && <a href={'mailto:' + c.email}>✉️ {c.email}</a>}
      {c.website && <a href={c.website} target="_blank" rel="noreferrer">🌐 포트폴리오 보기</a>}
      {c.location && <span>📍 {c.location}</span>}
    </div>
  )
}

function SubPage({ title, go, cta, children }) {
  return (
    <>
      <div className="inq-sub-h">
        <button className="btn sm" onClick={() => go('home')}>← 처음으로</button>
        <h2>{title}</h2>
      </div>
      {children}
      <button className="btn primary inq-cta" onClick={() => go('form')}>{cta || '✏️ 촬영 문의 등록하기'}</button>
    </>
  )
}

function Done({ S, go }) {
  return (
    <div className="inq-done card">
      <div className="inq-done-ic">✓</div>
      <h2>문의가 접수되었습니다!</h2>
      <p>{S.studio.replyPromise}</p>
      <div className="inq-done-next">
        <div><span className="num">1</span>담당자가 문의 내용을 확인합니다</div>
        <div><span className="num">2</span>선택하신 방법(카톡·전화·메일)으로 연락드립니다</div>
        <div><span className="num">3</span>상담 후 맞춤 견적서를 보내드립니다</div>
      </div>
      <a className="btn" href={S.contact.kakaoChatUrl || S.contact.kakaoUrl} target="_blank" rel="noreferrer">💬 카카오톡 채널 바로가기</a>
      {!EMBED && <button className="btn ghost" onClick={() => go('home')}>처음으로</button>}
    </div>
  )
}

/* ---------- 5스텝 문의 폼 ----------
   질문 문구·표시 여부는 form.fields(폼 콘텐츠 편집기)에서 관리 — 숨긴 항목은 필수 검증도 해제 */
const STEP_TITLES = ['기본 정보', '촬영 내용', '기획안', '일정 · 예산', '자료 · 동의']

// 기획안 분기 — 값(v)은 로직 분기 키라 고정, 문구는 폼 콘텐츠 편집기에서 수정
function planStatusOptions(F) {
  const t = F.planTexts || {}
  return [
    { v: '기획안 있음', ...t.have },
    { v: '가이드 작성', ...t.guide },
    { v: '상담하며 결정', ...t.later },
  ]
}

function InquiryForm({ S, onDone, onBack }) {
  const F = S.form
  const stepTitles = Array.isArray(F.stepTitles) && F.stepTitles.length === 5 ? F.stepTitles : STEP_TITLES
  // 항목 설정 헬퍼 — on(표시 여부) / L(질문 문구) / PH(입력 예시)
  const FF = F.fields || {}
  const on = (k) => FF[k]?.on !== false
  const L = (k) => FF[k]?.label || ''
  const PH = (k) => FF[k]?.ph || ''
  const [step, setStep] = useState(0)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const startAt = useRef(Date.now())
  const turnstile = useRef({ token: '', widgetId: null })
  // 기획안 도우미에서 넘어온 값은 초기값으로 채워두고, 사용자는 연락처만 추가하면 된다
  const H = PLANNER_HANDOFF
  const [f, setF] = useState({
    brand: H?.brand || '', manager: '', contact: '', contactPref: F.contactPrefs[0] || '카카오톡',
    shootType: H?.shootType || '', items: '', purposes: H?.purposes || [], concept: H?.concept || '', videoLen: '', videoEdit: '',
    planStatus: H ? '가이드 작성' : '', planIntro: H?.planIntro || '', planShots: H?.planShots || '',
    planFormats: H?.planFormats || [], planProps: H?.planProps || '',
    shootDate: H?.shootDate || '', dueDate: H?.dueDate || '', budget: H?.budget || '',
    refUrls: [''], etc: '', agree: false, hp: '',
  })
  const [files, setFiles] = useState([])
  const [contactErr, setContactErr] = useState('') // 연락처 인라인 검증 (blur 시)
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const contactOk = (c) => /^[\d\-+() ]{9,}$/.test(c) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)
  function checkContact(v) {
    const c = v.trim()
    setContactErr(c && !contactOk(c) ? '전화번호 또는 이메일 형식으로 입력해 주세요. (예: 010-0000-0000)' : '')
  }

  function validate(i) {
    if (i === 0) {
      if (on('brand') && !f.brand.trim()) return '브랜드명(회사명)을 입력해 주세요.'
      if (on('manager') && !f.manager.trim()) return '담당자 성함을 입력해 주세요.'
      const c = f.contact.trim() // 연락처는 항상 필수 (회신 수단)
      const okPhone = /^[\d\-+() ]{9,}$/.test(c)
      const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)
      if (!okPhone && !okMail) return '연락처는 전화번호 또는 이메일 형식으로 입력해 주세요.'
    }
    if (i === 1 && on('shootType') && !f.shootType) return '촬영 유형을 선택해 주세요.'
    if (i === 2 && on('planStatus') && !f.planStatus) return '기획안 준비 상태를 선택해 주세요. (아직 없어도 괜찮아요!)'
    if (i === 3 && on('budget') && !f.budget) return '예산 범위를 선택해 주세요. (미정도 괜찮아요)'
    if (i === 4 && !f.agree) return '개인정보 수집·이용에 동의해 주세요.'
    return ''
  }

  function next() {
    const e = validate(step)
    if (e) { setErr(e); return }
    setErr('')
    setStep((s) => s + 1)
  }

  function pickFiles(list) {
    const arr = [...files, ...Array.from(list)]
    if (arr.length > MAX_FILES) { setErr(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있어요.`); return }
    let total = 0
    for (const file of arr) {
      if (file.size > MAX_SIZE) { setErr(`"${file.name}" — 파일당 20MB까지 가능해요.`); return }
      total += file.size
    }
    if (total > MAX_TOTAL) { setErr('전체 첨부 용량은 50MB까지예요. 큰 파일은 링크로 공유해 주세요.'); return }
    setErr('')
    setFiles(arr)
  }

  async function submit() {
    const e = validate(4)
    if (e) { setErr(e); return }
    if (f.hp) return // honeypot — 봇 무시
    if (Date.now() - startAt.current < 3000) { setErr('입력 내용을 한 번 더 확인해 주세요.'); return }
    setBusy(true); setErr('')
    try {
      const id = makeId()
      const data = {
        brand: f.brand.trim(), manager: f.manager.trim(), contact: f.contact.trim(),
        contactPref: f.contactPref, shootType: f.shootType, items: f.items.trim(),
        purposes: f.purposes, concept: f.concept.trim(),
        videoLen: f.videoLen.trim(), videoEdit: f.videoEdit,
        planStatus: f.planStatus,
        plan: f.planStatus === '가이드 작성' ? {
          intro: f.planIntro.trim(), shots: f.planShots.trim(),
          formats: f.planFormats, props: f.planProps.trim(),
        } : null,
        shootDate: f.shootDate, dueDate: f.dueDate,
        refUrls: f.refUrls.map((u) => u.trim()).filter(Boolean),
        etc: f.etc.trim(), files: [],
        planner: PLANNER_HANDOFF ? true : undefined, // 기획안 도우미 경유 표시
        submittedAt: new Date().toISOString(),
      }
      // 1) 문의 본문 (예산 제외)
      const { error: e1 } = await supabase.from('inquiries').insert({ id, data, status: 'new' })
      if (e1) throw new Error('접수 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.')
      // 2) 예산 — 관리자 전용 테이블 (실패해도 접수는 유지)
      const { error: e2 } = await supabase.from('inquiry_budgets').insert({ id, data: { budget: f.budget } })
      if (e2) console.warn('budget insert failed', e2.message)
      // 2.5) 슬랙 알림 — 실패해도 접수와 무관 (keepalive: 탭을 바로 닫아도 전송 유지, 예산 제외)
      try {
        fetch('/api/notify-inquiry', {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { ...data, fileCount: files.length } }),
        }).catch(() => {})
      } catch (_) {}
      // 3) 첨부파일 — Edge Function 서명 URL 경유 (실패 시 접수는 유지, 안내만)
      if (files.length) {
        const failMsg = await uploadFiles(id, files)
        if (failMsg) {
          alert('문의는 접수되었지만 파일 업로드에 실패했어요.\n(' + failMsg + ')\n레퍼런스는 카카오톡 채널로 보내주시면 됩니다!')
        }
      }
      try { localStorage.removeItem('hm_planner_handoff') } catch (_) {} // 접수 완료 — 핸드오프 소비
      onDone()
    } catch (ex) {
      setErr(ex.message || '접수 중 오류가 발생했어요.')
    } finally {
      setBusy(false)
    }
  }

  // 실패 시 사유 문자열, 성공 시 '' 반환. Turnstile 토큰은 1회용 — 사용 후 reset
  // (서명 URL 발급은 Vercel 서버 함수 /api/inquiry-upload — Supabase Edge Function 미배포 대체)
  async function uploadFiles(inquiryId, list) {
    try {
      const res = await fetch('/api/inquiry-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId,
          turnstileToken: turnstile.current.token,
          files: list.map((x) => ({ name: x.name, size: x.size, type: x.type })),
        }),
      })
      const out = await res.json().catch(() => ({}))
      if (window.turnstile && turnstile.current.widgetId != null) {
        window.turnstile.reset(turnstile.current.widgetId) // 토큰은 1회 소비 — 재시도 대비 재발급
        turnstile.current.token = ''
      }
      if (!res.ok || !out.uploads) return out.error || '업로드 준비 실패'
      for (let i = 0; i < out.uploads.length; i++) {
        const u = out.uploads[i]
        const { error } = await supabase.storage.from('inquiry-files')
          .uploadToSignedUrl(u.path, u.token, list[i], u.contentType ? { contentType: u.contentType } : undefined)
        if (error) return '파일 전송 실패'
      }
      return ''
    } catch (_) {
      return '네트워크 오류'
    }
  }

  const pct = Math.round(((step + 1) / stepTitles.length) * 100)
  const errRef = useRef(null)
  useEffect(() => { if (err) errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [err])

  return (
    <>
      <div className="inq-sub-h">
        {(step > 0 || !EMBED) && (
          <button className="btn sm" onClick={step === 0 ? onBack : () => setStep(step - 1)}>← {step === 0 ? '처음' : '이전'}</button>
        )}
        <h2>촬영 문의 등록</h2>
      </div>
      <div className="inq-prog"><div className="inq-prog-bar" style={{ width: pct + '%' }} /></div>
      <div className="inq-steps" aria-label={`${stepTitles.length}단계 중 ${step + 1}단계`}>
        {stepTitles.map((t, i) => (
          <div key={t} className={'inq-sdot' + (i === step ? ' on' : i < step ? ' done' : '')}>
            <span className="num">{i < step ? '✓' : i + 1}</span>
            <small>{t}</small>
          </div>
        ))}
      </div>

      <div className="inq-form card">
        {/* honeypot — 화면에 보이지 않는 봇 트랩 */}
        <input className="inq-hp" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={f.hp} onChange={(e) => set('hp', e.target.value)} placeholder="회사 홈페이지" />

        {step === 0 && (
          <>
            {on('brand') && (
              <Field label={L('brand')}>
                <input value={f.brand} autoComplete="organization" onChange={(e) => set('brand', e.target.value)} placeholder={PH('brand')} />
              </Field>
            )}
            {on('manager') && (
              <Field label={L('manager')}>
                <input value={f.manager} autoComplete="name" onChange={(e) => set('manager', e.target.value)} placeholder={PH('manager')} />
              </Field>
            )}
            <Field label={L('contact')}>
              <input value={f.contact} autoComplete="tel"
                onChange={(e) => { set('contact', e.target.value); if (contactErr) checkContact(e.target.value) }}
                onBlur={(e) => checkContact(e.target.value)}
                aria-invalid={!!contactErr}
                placeholder={PH('contact')} />
              {contactErr && <small className="inq-field-err" role="alert">⚠ {contactErr}</small>}
            </Field>
            {on('contactPref') && (
              <Field label={L('contactPref')}>
                <Chips options={F.contactPrefs} value={f.contactPref} onPick={(v) => set('contactPref', v)} />
              </Field>
            )}
          </>
        )}

        {step === 1 && (
          <>
            {on('shootType') && (
              <Field label={L('shootType')}>
                <Chips options={F.shootTypes} value={f.shootType} onPick={(v) => set('shootType', v)} />
              </Field>
            )}
            {f.shootType === '영상' && (
              <>
                {on('videoLen') && (
                  <Field label={L('videoLen')}>
                    <input value={f.videoLen} onChange={(e) => set('videoLen', e.target.value)} placeholder={PH('videoLen')} />
                  </Field>
                )}
                {on('videoEdit') && (
                  <Field label={L('videoEdit')}>
                    <Chips options={F.videoEditOptions || ['편집까지', '촬영 원본만', '상담 후 결정']} value={f.videoEdit} onPick={(v) => set('videoEdit', v)} />
                  </Field>
                )}
              </>
            )}
            {on('items') && (
              <Field label={L('items')}>
                <input value={f.items} onChange={(e) => set('items', e.target.value)} placeholder={PH('items')} />
              </Field>
            )}
            {on('purposes') && (
              <Field label={L('purposes')}>
                <Chips multi options={F.purposes} value={f.purposes}
                  onPick={(v) => set('purposes', f.purposes.includes(v) ? f.purposes.filter((x) => x !== v) : [...f.purposes, v])} />
              </Field>
            )}
            {on('concept') && (
              <Field label={L('concept')}>
                <textarea rows={4} value={f.concept} onChange={(e) => set('concept', e.target.value)}
                  placeholder={PH('concept')} />
              </Field>
            )}
          </>
        )}

        {step === 2 && (
          <>
            {PLANNER_HANDOFF && (
              <div className="inq-review" style={{ marginBottom: 14 }}>
                <b>🐥 기획안 도우미에서 만든 기획안을 불러왔어요 ✓</b>
                <p>아래 내용이 자동으로 채워졌습니다. 수정하실 부분만 고치고 다음으로 넘어가세요.</p>
              </div>
            )}
            {on('planStatus') && (
            <Field label={L('planStatus')}>
              <div className="inq-chips col">
                {planStatusOptions(F).map((p) => (
                  <button key={p.v} type="button" className={'inq-chip' + (f.planStatus === p.v ? ' on' : '')}
                    onClick={() => set('planStatus', p.v)}>
                    {p.label}
                    <small style={{ display: 'block', fontWeight: 400, opacity: .75, marginTop: 2 }}>{p.desc}</small>
                  </button>
                ))}
              </div>
            </Field>
            )}

            {f.planStatus === '기획안 있음' && (
              <Field label={`기획안 첨부 (PDF·PPT·이미지 / 개당 20MB · 최대 ${MAX_FILES}개)`}>
                <FileArea files={files} onPick={pickFiles} onRemove={(i) => setFiles(files.filter((_, j) => j !== i))} />
                <small className="mut3">쓰시던 회사 양식 그대로 올려주시면 됩니다. 파일이 크면 마지막 단계의 링크 첨부를 이용해 주세요.</small>
              </Field>
            )}

            {f.planStatus === '가이드 작성' && (
              <>
                <div className="inq-review" style={{ marginBottom: 4 }}>
                  <b>🐥 간단 기획안 가이드</b>
                  <p>{F.planTexts?.guideIntro}</p>
                </div>
                <Field label="① 브랜드·제품 한 줄 소개">
                  <input value={f.planIntro} onChange={(e) => set('planIntro', e.target.value)}
                    placeholder="예: 비건 립밤 브랜드예요. 이번에 신제품 3종이 나와요" />
                </Field>
                <Field label="② 꼭 나와야 하는 컷 · 장면">
                  <textarea rows={3} value={f.planShots} onChange={(e) => set('planShots', e.target.value)}
                    placeholder={'예: 제품 단독컷 3종\n손에 들고 있는 연출컷\n발림성이 보이는 질감컷'} />
                </Field>
                <Field label="③ 사진을 사용할 곳 (복수 선택)">
                  <Chips multi options={F.planFormats || []} value={f.planFormats}
                    onPick={(v) => set('planFormats', f.planFormats.includes(v) ? f.planFormats.filter((x) => x !== v) : [...f.planFormats, v])} />
                </Field>
                <Field label="④ 준비물 · 모델 필요 여부">
                  <input value={f.planProps} onChange={(e) => set('planProps', e.target.value)}
                    placeholder="예: 제품은 택배로 보낼게요. 모델은 필요 없어요" />
                </Field>
                <Field label="참고 자료가 있다면 첨부해 주세요 (선택)">
                  <FileArea files={files} onPick={pickFiles} onRemove={(i) => setFiles(files.filter((_, j) => j !== i))} />
                </Field>
              </>
            )}

            {f.planStatus === '상담하며 결정' && (
              <div className="inq-review">
                <b>부담 갖지 않으셔도 돼요 🙌</b>
                <p>{F.planTexts?.laterNote}</p>
              </div>
            )}

            {/* 기획안이 없는 분들에게 도우미 안내 — 도우미 경유·기획안 보유 시엔 숨김 */}
            {!PLANNER_HANDOFF && f.planStatus !== '기획안 있음' && (
              <button type="button" className="inq-link card" style={{ marginTop: 4 }}
                onClick={() => (window.location.href = PLANNER_URL)}>
                <span className="inq-link-ic">🐥</span>
                <span className="inq-link-t"><b>3분 기획안 도우미 써보기</b><small>선택만 하면 PPT·PDF 기획안이 만들어지고, 그대로 문의로 이어져요</small></span>
                <span className="inq-link-a">→</span>
              </button>
            )}
          </>
        )}

        {step === 3 && (
          <>
            {on('shootDate') && (
              <Field label={L('shootDate')}>
                <input type="date" value={f.shootDate} onChange={(e) => set('shootDate', e.target.value)} />
              </Field>
            )}
            {on('dueDate') && (
              <Field label={L('dueDate')}>
                <input type="date" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
              </Field>
            )}
            {on('budget') && (
              <Field label={L('budget')}>
                <div className="inq-chips col">
                  {F.budgetRanges.map((b) => (
                    <button key={b} type="button" className={'inq-chip' + (f.budget === b ? ' on' : '')}
                      onClick={() => set('budget', b)}>
                      {b}
                      {b === F.budgetPopular && <span className="inq-pop">가장 많이 선택</span>}
                    </button>
                  ))}
                </div>
                <small className="mut3">예산 정보는 대표에게만 전달됩니다.</small>
              </Field>
            )}
          </>
        )}

        {step === 4 && (
          <>
            {on('refUrls') && (
              <Field label={L('refUrls')}>
                {f.refUrls.map((u, i) => (
                  <input key={i} value={u} style={{ marginBottom: 6 }}
                    onChange={(e) => set('refUrls', f.refUrls.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder="https://" />
                ))}
                {f.refUrls.length < 5 && (
                  <button type="button" className="btn sm" onClick={() => set('refUrls', [...f.refUrls, ''])}>+ 링크 추가</button>
                )}
              </Field>
            )}
            {on('etc') && (
              <Field label={L('etc')}>
                <textarea rows={3} value={f.etc} onChange={(e) => set('etc', e.target.value)}
                  placeholder={PH('etc')} />
              </Field>
            )}
            {files.length > 0 && TURNSTILE_SITE_KEY && <Turnstile store={turnstile} />}
            <div className="inq-review">
              <b>입력 내용 확인</b>
              <p>{[f.brand, f.manager, f.contact].filter(Boolean).join(' · ')} {on('contactPref') && <em>({f.contactPref} 회신)</em>}</p>
              <p>{f.shootType}{f.items ? ` · ${f.items}` : ''}{f.purposes.length ? ` · ${f.purposes.join(', ')}` : ''}</p>
              {(f.planStatus || files.length > 0) && (
                <p>{f.planStatus ? `기획안: ${f.planStatus}` : '기획안 별도 없음'}{files.length ? ` · 📎 ${files.length}개 첨부` : ''}</p>
              )}
              <p>{f.shootDate ? `촬영 희망일 ${f.shootDate}` : '촬영일 미정'}{f.dueDate ? ` · 마감 ${f.dueDate}` : ''}{f.budget ? ` · 예산 ${f.budget}` : ''}</p>
              <small>수정하려면 왼쪽 위 [← 이전]으로 돌아가세요.</small>
            </div>
            <label className="inq-agree">
              <input type="checkbox" checked={f.agree} onChange={(e) => set('agree', e.target.checked)} />
              <span><b>개인정보 수집·이용 동의 (필수)</b><small>{F.privacyNotice}</small></span>
            </label>
          </>
        )}

        {err && <div className="inq-err" role="alert" ref={errRef}>⚠ {err}</div>}

        <div className="inq-form-f">
          {step < stepTitles.length - 1
            ? <button className="btn primary inq-cta" onClick={next}>다음 →</button>
            : <button className="btn primary inq-cta" disabled={busy} onClick={submit}>{busy ? '접수 중…' : '문의 접수하기 ✓'}</button>}
        </div>
      </div>
    </>
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

function FileArea({ files, onPick, onRemove }) {
  const ref = useRef(null)
  return (
    <div>
      <button type="button" className="inq-file-btn" onClick={() => ref.current?.click()}>
        📎 파일 선택 <small className="mut3">또는 위 링크로 첨부해 주세요</small>
      </button>
      <input ref={ref} type="file" multiple hidden
        accept=".pdf,.ppt,.pptx,image/png,image/jpeg,image/webp"
        onChange={(e) => { onPick(e.target.files); e.target.value = '' }} />
      {files.map((file, i) => (
        <div key={i} className="inq-file-row">
          <span className="inq-file-name">{file.name}</span>
          <span className="mut3 num">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
          <button type="button" className="x" onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
    </div>
  )
}

/* Cloudflare Turnstile — 파일 업로드 시에만 표시 (VITE_TURNSTILE_SITE_KEY 필요) */
function Turnstile({ store }) {
  const ref = useRef(null)
  useEffect(() => {
    function render() {
      if (window.turnstile && ref.current && !ref.current.dataset.done) {
        ref.current.dataset.done = '1'
        store.current.widgetId = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (t) => { store.current.token = t },
          'expired-callback': () => { store.current.token = '' },
        })
      }
    }
    if (window.turnstile) { render(); return }
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = render
    document.head.appendChild(s)
  }, [store])
  return <div ref={ref} style={{ marginBottom: 12 }} />
}
