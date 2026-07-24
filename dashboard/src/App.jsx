import { useEffect, useState, lazy, Suspense } from 'react'
import { useAuth } from './auth.jsx'
import { useStore } from './useStore.js'
import { inboxFor, getConfig, effectiveNav, navGroupNames, BASE_NAV } from './data.js'
import CommandK from './CommandK.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'

// 홈·로그인 외 페이지는 지연 로드 — 첫 화면에 필요한 JS만 내려받아 초기 로딩 단축
const Custom = lazy(() => import('./pages/Custom.jsx'))
const Projects = lazy(() => import('./pages/Projects.jsx'))
const ProjectDB = lazy(() => import('./pages/ProjectDB.jsx'))
const Tasks = lazy(() => import('./pages/Tasks.jsx'))
const Money = lazy(() => import('./pages/Money.jsx'))
const Team = lazy(() => import('./pages/Team.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Studio = lazy(() => import('./pages/Studio.jsx'))
const Inquiries = lazy(() => import('./pages/Inquiries.jsx'))
const Docs = lazy(() => import('./pages/Docs.jsx'))
const Ads = lazy(() => import('./pages/Ads.jsx'))
const Clients = lazy(() => import('./pages/Clients.jsx'))
const Review = lazy(() => import('./pages/Review.jsx'))
const Vendors = lazy(() => import('./pages/Lists.jsx').then((m) => ({ default: m.Vendors })))
const Content = lazy(() => import('./pages/Lists.jsx').then((m) => ({ default: m.Content })))

// 메뉴 정의는 data.js의 BASE_NAV — 커스텀 페이지에서 이름·아이콘·숨김·순서 편집
// 카운트 배지만 여기서 계산
const COUNTS = {
  inquiries: (s) => s.inquiryCount, // 신규 문의 — store가 아닌 전용 slice (실시간 갱신)
  projects: (s) => s.projects.filter((p) => !p.archived).length,
  projectdb: (s) => s.projects.filter((p) => p.archived).length,
  tasks: (s) => s.tasks.filter((t) => !t.done).length,
  clients: (s) => s.clients.length,
  vendors: (s) => s.vendors.length,
  content: (s) => s.contents.length,
}

const PAGES = { home: Home, inquiries: Inquiries, projects: Projects, projectdb: ProjectDB, tasks: Tasks, review: Review, money: Money, team: Team, custom: Custom, settings: Settings, studio: Studio, clients: Clients, vendors: Vendors, content: Content, docs: Docs, ads: Ads }
const TITLES = { home: '홈 대시보드', inquiries: '촬영 문의', projects: '프로젝트 보드', projectdb: '프로젝트 DB', tasks: '업무', review: '주간 리뷰', money: '매출·정산', team: '팀 관리', custom: '커스텀', settings: '설정 · 데이터', studio: '납품 메시지', clients: '고객사 DB', vendors: '외주 관리', content: '콘텐츠', docs: '견적서 · 계약서', ads: '메타 광고' }
const CRUMBS = {
  home: '오늘 챙길 것 · 파이프라인 · 이번 주 촬영',
  inquiries: '공개 폼 접수 · 답변 · 프로젝트 전환 — 예산은 관리자만',
  projects: '문의 → 납품 파이프라인 · 카드를 끌어 단계 이동',
  projectdb: '완료된 촬영 건 아카이브 · 검색 · 기획안 첨부 보기',
  tasks: '간트 · 월간 달력 · 우선순위 · D-Day · 루틴',
  review: '주 1회 30분 — 숫자 · 할 일 · 정체 · 다음 7일',
  money: '거래·미수금·정산 · 관리자 전용',
  ads: '인스타그램·페이스북 광고 성과를 쉬운 그래프로 — 전 팀원 공개',
  team: '팀원 추가 · 권한 · 비활성화',
  custom: '선택지 · 단계 · 템플릿 · 위젯 · 연동 · 모듈 — 전부 편집',
  settings: '백업 · 복원 · 데이터 현황',
  clients: '브랜드 히스토리 · 소통 타임라인 · 대화 붙여넣기 정리',
  vendors: '스타일리스트·헤메·리터처·디자인',
  content: '릴스·스레드·핀터레스트·홈페이지',
  studio: '드라이브 링크 → 카톡 전달 문안 자동 완성',
  docs: '단가표 프리셋 → 자동 합계 → A4 인쇄·PDF — 관리자 전용',
}

export default function App() {
  const { user, logout, isAdmin, booting } = useAuth()
  const store = useStore()
  const [page, setPage] = useState('home')
  const [cmdk, setCmdk] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false) // 모바일 드로어

  // 페이지 이동 시 모바일 드로어·알림함 닫기 (모바일엔 mouseleave가 없음)
  function go(id) { setPage(id); setNavOpen(false); setInboxOpen(false) }

  // ⌘K / Ctrl+K 전역 단축키
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setCmdk((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (booting) return <div className="login-wrap"><div className="mut3">…</div></div>
  if (!user) return <Login />
  if (!store.loaded) {
    return (
      <div className="login-wrap">
        <div style={{ textAlign: 'center' }}>
          <img src="/brand/simbol-bk.png" alt="" style={{ width: 56, margin: '0 auto 12px', display: 'block' }} />
          <div className="mut" style={{ fontSize: 13 }}>클라우드 데이터를 불러오는 중…</div>
        </div>
      </div>
    )
  }

  const nav = effectiveNav()
  const groupNames = navGroupNames()
  const visibleNav = nav.filter((n) => (!n.adminOnly || isAdmin) && (!n.hidden || n.locked))
  const groups = [...new Set(visibleNav.map((n) => n.group))]
  // 접근 가드는 BASE_NAV 기준 — 커스텀으로 잠금을 풀 수 없음
  const blocked = BASE_NAV.find((n) => n.id === page)?.adminOnly && !isAdmin
  const Page = PAGES[page] || Home
  const inbox = inboxFor(user.id)
  const urgent = inbox.filter((i) => i.kind === 'over' || i.kind === 'due').length
  const modules = getConfig().modules || []
  const activeModule = page.startsWith('mod:') ? modules.find((m) => 'mod:' + m.id === page) : null

  return (
    <div className="shell">
      {navOpen && <div className="side-scrim" onClick={() => setNavOpen(false)} />}
      <aside className={'side' + (navOpen ? ' open' : '')}>
        <div className="sbrand">
          <img className="sbrand-img" src="/brand/simbol-wh.png" alt="" />
          <div><b>홀리몰리</b><small>studio ops</small></div>
        </div>

        {groups.map((g) => (
          <div key={g}>
            <div className="snav-lbl">{groupNames[g] || g}</div>
            {visibleNav.filter((n) => n.group === g).map((n) => (
              <button key={n.id} className={'snav' + (page === n.id ? ' on' : '')} onClick={() => go(n.id)}>
                <span className="ic">{n.ic}</span>{n.label}
                {n.adminOnly ? <span className="lockbadge">관리자</span>
                  : COUNTS[n.id] ? <span className="cnt">{COUNTS[n.id](store)}</span> : null}
              </button>
            ))}
          </div>
        ))}

        {/* 커스텀 모듈 — 커스텀 페이지에서 추가한 외부 서비스 */}
        {modules.length > 0 && (
          <div>
            <div className="snav-lbl">모듈</div>
            {modules.map((mo) => (
              <button key={mo.id} className={'snav' + (page === 'mod:' + mo.id ? ' on' : '')} onClick={() => go('mod:' + mo.id)}>
                <span className="ic">◫</span>{mo.name}
              </button>
            ))}
          </div>
        )}

        <div className="side-foot">
          <div className="ava">{user.name[0]}</div>
          <div><b>{user.name}</b><small>{isAdmin ? '👑 관리자' : '🧑‍💼 직원'}</small></div>
          <button className="out" onClick={logout} title="로그아웃">⎋</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button className="btn sm menubtn" onClick={() => setNavOpen(true)} aria-label="메뉴 열기">☰</button>
          <div>
            <h2>{activeModule ? activeModule.name : (nav.find((n) => n.id === page)?.label || TITLES[page])}</h2>
            <div className="crumb">{activeModule ? '커스텀 모듈' : CRUMBS[page]}</div>
          </div>
          <div className="sp" />

          <button className="btn sm searchbtn" onClick={() => setCmdk(true)}>
            ⌕ 검색 <span className="kbd">⌘K</span>
          </button>

          {/* 알림함 */}
          <div style={{ position: 'relative' }}>
            <button className={'btn sm' + (inboxOpen ? ' primary' : '')} onClick={() => setInboxOpen((v) => !v)} aria-label="알림함">
              ◔ 알림{urgent > 0 && <span className="bellcnt num">{urgent}</span>}
            </button>
            {inboxOpen && (
              <div className="inbox" onMouseLeave={() => setInboxOpen(false)}>
                <div className="inbox-h">나에게 온 것 <span className="mut3 num">{inbox.length}</span></div>
                {inbox.length === 0 && <div className="inbox-empty">지금은 조용합니다 ✓</div>}
                {inbox.map((it, i) => (
                  <button key={i} className="inbox-row" onClick={() => {
                    setPage(it.kind === 'comment' ? 'projects' : 'tasks')
                    setInboxOpen(false)
                  }}>
                    <span className={'stripe2 ' + it.kind} />
                    <span className="tx">{it.text}<small>{it.sub}</small></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {activeModule ? (
          <div className="mod-frame">
            <div className="mod-frame-bar">
              <span className="mut3" style={{ fontSize: 11.5 }}>{activeModule.url}</span>
              <a className="btn sm" href={activeModule.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>↗ 새 탭에서 열기</a>
            </div>
            <iframe src={activeModule.url} title={activeModule.name} />
          </div>
        ) : (
          <div className="content">
            {blocked ? <AdminGate /> : (
              <Suspense fallback={<div className="mut" style={{ padding: 24 }}>불러오는 중…</div>}>
                <Page go={setPage} />
              </Suspense>
            )}
          </div>
        )}
      </main>

      <CommandK open={cmdk} onClose={() => setCmdk(false)} go={setPage} user={user} isAdmin={isAdmin} />
    </div>
  )
}

function AdminGate() {
  return (
    <div className="card gate">
      <div className="lk">🔒</div>
      <h3>관리자 전용 페이지입니다</h3>
      <p>매출·정산·팀 관리 등은 관리자만 볼 수 있습니다.<br />직원 계정으로는 접근할 수 없습니다.</p>
    </div>
  )
}
