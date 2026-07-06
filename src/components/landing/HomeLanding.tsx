'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { STUDIO_NAME, STUDIO_SHORT_NAME } from '@/lib/brand'
import LogoSymbol from '@/components/brand/LogoSymbol'

const CONTACT_EMAIL = 'studio.holymolly@gmail.com'

const MARQUEE_ITEMS = ['Beauty', 'Product', 'F&B', 'Fashion', 'People', 'Film', 'BX Design']

const SERVICES = [
  {
    num: '01',
    title: '뷰티',
    body: '코스메틱과 뷰티 브랜드의 질감, 컬러, 무드를 정교하게 담아냅니다.',
  },
  {
    num: '02',
    title: '제품',
    body: '스마트스토어부터 상세페이지까지, 제품이 팔리게 하는 컷을 만듭니다.',
  },
  {
    num: '03',
    title: 'F&B',
    body: '시즐과 온도까지. 음식과 음료를 가장 맛있는 순간으로 기록합니다.',
  },
  {
    num: '04',
    title: '의류',
    body: '시즌 룩북, 캠페인, 커머스 화보까지 브랜드의 결을 화보로 옮깁니다.',
  },
  {
    num: '05',
    title: '인물',
    body: '브랜드를 이끄는 사람들, 캠페인 속 인물을 자연스럽게 담습니다.',
  },
  {
    num: '06',
    title: '영상',
    body: '브랜드 필름, 커머스 영상, 소셜 콘텐츠까지 무빙으로 확장합니다.',
  },
  {
    num: '07',
    title: 'BX 디자인',
    body: '촬영을 넘어 브랜드 경험을 설계합니다. 비주얼 아이덴티티부터 콘텐츠 시스템까지.',
  },
]

const WORKFLOW = [
  {
    num: '01',
    title: '하트로 찜',
    body: '전용 갤러리에서 마음에 드는 컷을 먼저 찜해두고 천천히 고를 수 있습니다.',
  },
  {
    num: '02',
    title: '클릭으로 셀렉',
    body: '어디서든, 모바일에서도. 선택한 컷은 실시간으로 스튜디오에 전달됩니다.',
  },
  {
    num: '03',
    title: '진행 상황 확인',
    body: '보정이 어디까지 왔는지, 완성본은 언제 오는지 갤러리에서 바로 확인합니다.',
  },
]

const STEPS = [
  {
    num: '01',
    title: '촬영',
    body: '사전 상담으로 컨셉과 무드를 맞춘 뒤, 편안한 분위기에서 촬영합니다.',
  },
  {
    num: '02',
    title: '온라인 셀렉',
    body: '전용 갤러리 링크에서 마음에 드는 컷을 클릭 몇 번으로 선택합니다.',
  },
  {
    num: '03',
    title: '리터칭',
    body: '선택한 컷을 정성껏 보정하고, 피드백을 주고받으며 디테일을 다듬습니다.',
  },
  {
    num: '04',
    title: '전달',
    body: '고해상도 완성본을 온라인으로 바로 받아봅니다. ZIP 일괄 다운로드 지원.',
  },
]

function KineticTitle({ lines }: { lines: string[] }) {
  let letterIndex = 0
  return (
    <h1 className="hm-hero-title hm-display hm-wordmark" aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.split('').map((ch, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="hm-letter"
              style={{ animationDelay: `${0.035 * letterIndex++}s` }}
            >
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}

export default function HomeLanding() {
  useEffect(() => {
    const els = document.querySelectorAll('.hm-reveal')
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12 }
    )
    // Reveal elements already in view in the same frame the hidden state
    // activates (.hm-js), so nothing visible ever flashes out.
    const viewportBottom = window.innerHeight
    els.forEach(el => {
      if (el.getBoundingClientRect().top < viewportBottom) {
        el.classList.add('is-visible')
      } else {
        observer.observe(el)
      }
    })
    document.documentElement.classList.add('hm-js')
    return () => {
      observer.disconnect()
      document.documentElement.classList.remove('hm-js')
    }
  }, [])

  return (
    <div className="hm-page">
      <nav className="hm-nav">
        <div className="hm-container hm-nav-inner">
          <Link href="/" className="hm-logo" aria-label={STUDIO_NAME}>
            <LogoSymbol size={30} />
            <span className="hm-wordmark hm-display hm-hide-sm">STUDIO. HOLYMOLLY</span>
          </Link>
          <div className="hm-nav-links">
            <a href="#services" className="hm-hide-sm">Services</a>
            <a href="#process" className="hm-hide-sm">Process</a>
            <Link href="/inquiry" className="hm-btn hm-btn-primary hm-nav-cta">
              프로젝트 문의
            </Link>
          </div>
        </div>
      </nav>

      <header className="hm-hero">
        <div className="hm-container">
          <span className="hm-label-xs">Creative Studio — {STUDIO_NAME}</span>
          <KineticTitle lines={['STUDIO.', 'HOLYMOLLY']} />
          <div className="hm-hero-foot">
            <div>
              <p className="hm-hero-sub">브랜드가 보여지는 모든 장면을 만듭니다.</p>
              <p className="hm-hero-body">
                뷰티, 제품, F&amp;B, 의류, 인물 — 그리고 영상과 BX 디자인까지.
                {' '}{STUDIO_SHORT_NAME}는 촬영에서 끝나지 않고 셀렉, 리터칭,
                전달까지 전 과정을 함께합니다.
              </p>
            </div>
            <div className="hm-hero-ctas">
              <Link href="/inquiry" className="hm-btn hm-btn-primary">
                프로젝트 문의하기
              </Link>
              <a href="#process" className="hm-textlink">
                프로세스 보기 ↓
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="hm-marquee" aria-hidden="true">
        <div className="hm-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="hm-display">
              {item} <span className="dot">—</span>
            </span>
          ))}
        </div>
      </div>

      <section id="services" className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head hm-reveal">
            <span className="hm-label-xs">Services</span>
            <h2>이런 작업을 함께합니다</h2>
          </div>
          <div className="hm-rows hm-reveal">
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
          <span className="hm-label-xs hm-reveal">Client Gallery</span>
          <h2 className="hm-reveal">
            촬영 후가 더 편한 스튜디오.
            <br />
            셀렉부터 전달까지, 링크 하나로.
          </h2>
          <p className="hm-reveal">
            촬영이 끝나면 전용 온라인 갤러리 링크를 보내드립니다.
            사진을 고르러 스튜디오에 다시 올 필요가 없습니다.
          </p>
          <div className="hm-band-feats hm-reveal">
            {WORKFLOW.map(f => (
              <div key={f.num}>
                <div className="num hm-display">{f.num}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head hm-reveal">
            <span className="hm-label-xs">Process</span>
            <h2>촬영부터 전달까지, 네 걸음</h2>
          </div>
          <div className="hm-steps hm-reveal">
            {STEPS.map(step => (
              <div key={step.num} className="hm-step">
                <span className="num hm-display">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-outro">
        <div className="hm-container hm-reveal">
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
              뷰티 · 제품 · F&amp;B · 의류 · 인물 · 영상 · BX 디자인
              <br />
              브랜드의 모든 장면을 만드는 크리에이티브 스튜디오.
            </div>
          </div>
          <div className="hm-footer-links">
            <Link href="/inquiry">프로젝트 문의</Link>
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
