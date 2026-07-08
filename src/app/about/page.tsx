import type { Metadata } from 'next'
import Link from 'next/link'
import LogoSymbol from '@/components/brand/LogoSymbol'
import { STUDIO_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: '회사소개 — 스튜디오 홀리몰리',
  description:
    '서울 역삼의 비주얼 디렉션 스튜디오. 뷰티 · 제품 · F&B · 라이프스타일 · 패션 · 인물 — 사진과 영상, BX 디자인까지 브랜드가 보여지는 모든 장면을 만듭니다.',
}

const CONTACT_EMAIL = 'studio.holymolly@gmail.com'
const PORTFOLIO_URL = 'https://studioholymolly.myportfolio.com/'
const INSTAGRAM_URL = 'https://www.instagram.com/studio_holymolly/'
const THREADS_URL = 'https://www.threads.com/@studio_holymolly'

const FACTS = [
  {
    label: 'Studio',
    value: STUDIO_NAME,
    sub: 'Visual Direction Studio',
  },
  {
    label: 'Field',
    value: 'Photo · Film · Branding',
    sub: '기획부터 촬영, 브랜드 경험 설계까지',
  },
  {
    label: 'Location',
    value: '서울 강남구 역삼동 783-2, B1',
    sub: '스튜디오 및 로케이션 촬영',
  },
  {
    label: 'Contact',
    value: CONTACT_EMAIL,
    sub: '@studio_holymolly',
    href: `mailto:${CONTACT_EMAIL}`,
  },
]

const SERVICES = [
  {
    num: '01',
    title: '뷰티 & 제품',
    body: '코스메틱의 제형과 컬러, 제품의 형태와 소재를 정교하게 담아냅니다. 스마트스토어 컷부터 브랜드 캠페인까지, 제품이 팔리게 하는 컷을 만듭니다.',
  },
  {
    num: '02',
    title: 'F&B & 라이프스타일',
    body: '시즐과 온도, 쓰는 장면과 먹는 순간. 제품이 놓일 실제 삶의 장면을 만들어 브랜드에 생활의 온도를 더합니다.',
  },
  {
    num: '03',
    title: '패션 & 인물',
    body: '시즌 룩북과 커머스 화보, 그리고 브랜드를 이끄는 사람들. 브랜드의 결을 인물과 착장으로 옮깁니다.',
  },
  {
    num: '04',
    title: '영상',
    body: '브랜드 필름, 커머스 영상, 소셜 콘텐츠. 사진과 같은 무드를 무빙으로 확장해 채널 전체의 톤을 맞춥니다.',
  },
  {
    num: '05',
    title: 'BX 디자인',
    body: '촬영을 넘어 브랜드 경험을 설계합니다. 비주얼 아이덴티티부터 콘텐츠 시스템까지, 장면이 브랜드가 되도록.',
  },
]

const STRENGTHS = [
  {
    num: '01',
    title: '디렉션이 있는 촬영',
    body: '찍기 전에 설계합니다. 레퍼런스 정리부터 무드보드, 세팅 계획까지 — 촬영은 기획의 마지막 단계입니다.',
  },
  {
    num: '02',
    title: '질감에 강한 스튜디오',
    body: '뷰티의 제형, F&B의 시즐, 패브릭의 결. 클로즈업에서 무너지지 않는 디테일을 만듭니다.',
  },
  {
    num: '03',
    title: '현장에서 한 컷 더',
    body: '촬영이 잘 풀리는 날, 계획에 없던 세팅을 그 자리에서 추가하는 팀입니다. 같은 예산에서 얻어가는 컷이 늘어납니다.',
  },
  {
    num: '04',
    title: '원본부터 다른 퀄리티',
    body: '톤 정리만 거친 원본을 그대로 보여드릴 수 있는 촬영을 지향합니다. 보정은 원본을 살리는 마지막 손질입니다.',
  },
]

const PROCESS = [
  {
    num: '01',
    title: '상담 · 기획',
    body: '문의 주시면 24시간 안에 답장드립니다. 목적과 무드를 듣고, 레퍼런스와 세팅 방향, 견적을 제안합니다.',
  },
  {
    num: '02',
    title: '촬영',
    body: '역삼 스튜디오 또는 로케이션에서. 현장에서 컷을 함께 확인하며, 좋은 장면이 보이면 그 자리에서 더 만듭니다.',
  },
  {
    num: '03',
    title: '셀렉 · 리터칭',
    body: '촬영 컷을 정리해 보내드리고, 고르신 컷을 정성껏 보정합니다. 피드백을 주고받으며 디테일을 다듬습니다.',
  },
  {
    num: '04',
    title: '전달',
    body: '합의된 일정에 고해상도 완성본을 전달합니다. 사용하실 채널에 맞춘 포맷 정리도 함께합니다.',
  },
]

const WORKS_LINKS = [
  {
    num: '01',
    title: 'Portfolio',
    body: '작업물 전체는 포트폴리오 사이트에서 보실 수 있습니다.',
    href: PORTFOLIO_URL,
  },
  {
    num: '02',
    title: 'Instagram',
    body: '@studio_holymolly — 최근 작업과 현장 컷을 올립니다.',
    href: INSTAGRAM_URL,
  },
  {
    num: '03',
    title: 'Threads',
    body: '촬영 뒷이야기와 보정 전 원본 컷도 여기서 공개합니다.',
    href: THREADS_URL,
  },
]

export default function AboutPage() {
  return (
    <div className="hm-page">
      <nav className="hm-nav">
        <div className="hm-container hm-nav-inner">
          <Link href="/" className="hm-logo" aria-label={STUDIO_NAME}>
            <LogoSymbol size={30} />
            <span className="hm-wordmark hm-display hm-hide-sm">STUDIO. HOLYMOLLY</span>
          </Link>
          <div className="hm-nav-links">
            <Link href="/" className="hm-hide-sm">
              홈
            </Link>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hm-hide-sm"
            >
              Portfolio ↗
            </a>
            <Link href="/inquiry" className="hm-btn hm-btn-primary hm-nav-cta">
              프로젝트 문의
            </Link>
          </div>
        </div>
      </nav>

      <header className="hm-about-hero">
        <div className="hm-container">
          <span className="hm-label-xs">About — Company Profile</span>
          <h1 className="hm-display hm-wordmark">
            We Make
            <br />
            Every Scene
          </h1>
          <p className="hm-lede">
            브랜드가 보여지는 모든 장면을 만듭니다.
          </p>
          <p className="hm-lede-sub">
            스튜디오 홀리몰리는 서울 역삼의 비주얼 디렉션 스튜디오입니다.
            컷 한 장을 찍는 일보다, 그 컷이 브랜드 안에서 어떻게 보일지를
            먼저 생각합니다. 사진과 영상, 그리고 BX 디자인까지 — 하나의
            무드로 이어지는 장면을 설계합니다.
          </p>
        </div>
      </header>

      <section className="hm-section" style={{ paddingTop: 0 }}>
        <div className="hm-container">
          <div className="hm-facts">
            {FACTS.map(f => (
              <div key={f.label} className="hm-fact">
                <span className="hm-label-xs">{f.label}</span>
                <div className="v">
                  {f.href ? <a href={f.href}>{f.value}</a> : f.value}
                </div>
                <div className="s">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section" style={{ paddingTop: 0 }}>
        <div className="hm-container">
          <div className="hm-section-head">
            <span className="hm-label-xs">Perspective</span>
            <h2>
              질감이 전부인 카테고리에서
              <br />
              시작했습니다
            </h2>
          </div>
          <p className="hm-lede-sub" style={{ maxWidth: 640 }}>
            뷰티와 F&amp;B — 화면 속 질감이 곧 구매가 되는 카테고리에서
            출발해, 제품 · 라이프스타일 · 패션 · 인물로 영역을 넓혀왔습니다.
            촬영 전 기획 단계에서 무드와 톤을 함께 설계하고, 현장에서는
            계획에 없던 장면도 그 자리에서 만들어냅니다. 그렇게 찍은 컷이
            상세페이지가 되고, 캠페인이 되고, 브랜드의 얼굴이 됩니다.
          </p>
        </div>
      </section>

      <section id="services" className="hm-section" style={{ paddingTop: 0 }}>
        <div className="hm-container">
          <div className="hm-section-head">
            <span className="hm-label-xs">Services</span>
            <h2>이런 작업을 함께합니다</h2>
          </div>
          <div className="hm-rows">
            {SERVICES.map(s => (
              <div key={s.num} className="hm-row">
                <span className="num hm-display">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <span className="arr" aria-hidden="true">→</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-band">
        <div className="hm-container">
          <span className="hm-label-xs">Selected Works</span>
          <h2>
            말보다 컷이 빠릅니다.
            <br />
            작업물은 여기서 보세요.
          </h2>
          <p>
            카테고리별 작업물과 최근 프로젝트는 포트폴리오 사이트와
            SNS 채널에 계속 업데이트하고 있습니다.
          </p>
          <div className="hm-band-feats">
            {WORKS_LINKS.map(w => (
              <a
                key={w.num}
                href={w.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <div className="num hm-display">{w.num}</div>
                <h3>{w.title} ↗</h3>
                <p>{w.body}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head">
            <span className="hm-label-xs">Why Holymolly</span>
            <h2>홀리몰리와 찍으면 다른 것</h2>
          </div>
          <div className="hm-steps">
            {STRENGTHS.map(s => (
              <div key={s.num} className="hm-step">
                <span className="num hm-display">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="hm-section" style={{ paddingTop: 0 }}>
        <div className="hm-container">
          <div className="hm-section-head">
            <span className="hm-label-xs">Process</span>
            <h2>상담부터 전달까지, 네 걸음</h2>
          </div>
          <div className="hm-steps">
            {PROCESS.map(step => (
              <div key={step.num} className="hm-step">
                <span className="num hm-display">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section" style={{ paddingTop: 0 }}>
        <div className="hm-container">
          <div className="hm-section-head">
            <span className="hm-label-xs">Studio</span>
            <h2>역삼에 있습니다</h2>
          </div>
          <p className="hm-lede-sub" style={{ maxWidth: 640 }}>
            서울 강남구 역삼동 783-2 지하 1층. 제품 · 뷰티 · F&amp;B 촬영에
            맞춘 세팅으로 운영하며, 컨셉에 따라 로케이션 촬영도 진행합니다.
            방문 상담은 이메일 또는 문의 폼으로 일정을 잡아주세요.
          </p>
        </div>
      </section>

      <section className="hm-outro">
        <div className="hm-container">
          <LogoSymbol size={44} className="hm-outro-symbol" />
          <span className="hm-label-xs">Contact</span>
          <h2 className="hm-display">Start a Project</h2>
          <div className="hm-hero-ctas">
            <Link href="/inquiry" className="hm-btn hm-btn-primary">
              프로젝트 문의하기
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hm-textlink">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      <footer className="hm-footer">
        <div className="hm-container hm-footer-inner">
          <div>
            <div className="hm-footer-brand-row">
              <LogoSymbol size={34} />
              <div>
                <div className="brand hm-wordmark hm-display">STUDIO. HOLYMOLLY</div>
                <div className="brand-ko">{STUDIO_NAME}</div>
              </div>
            </div>
            <div className="sub">
              뷰티 · 제품 · F&amp;B · 라이프스타일 · 패션 · 인물 · 영상 · BX 디자인
              <br />
              서울 강남구 역삼동 783-2, B1
            </div>
          </div>
          <div className="hm-footer-links">
            <Link href="/inquiry">프로젝트 문의</Link>
            <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <Link href="/login" className="dim">
              Admin
            </Link>
          </div>
        </div>
        <div className="hm-footer-mark hm-display" aria-hidden="true">
          STUDIO. HOLYMOLLY
        </div>
      </footer>
    </div>
  )
}
