'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { STUDIO_NAME, STUDIO_SHORT_NAME } from '@/lib/brand'

const CONTACT_EMAIL = 'studio.holymolly@gmail.com'

const MARQUEE_ITEMS = [
  'PROFILE', '✳', 'BRAND', '✳', 'PRODUCT', '✳', 'LOOKBOOK', '✳',
  'SNAP', '✳', 'HOLY MOLY!', '✳',
]

const SERVICES = [
  {
    span: 'hm-tile-3',
    emoji: '📸',
    title: '프로필 & 증명',
    body: '나를 가장 나답게. 배우·아나운서 프로필부터 링크드인용 비즈니스 프로필까지, 카메라 앞이 어색한 분도 편안하게 이끌어 드려요.',
  },
  {
    span: 'hm-tile-3',
    emoji: '🧥',
    title: '브랜드 & 룩북',
    body: '브랜드의 결을 읽고 화보로 옮깁니다. 시즌 룩북, 캠페인, 콘텐츠용 화보까지 톤앤무드를 함께 설계해요.',
  },
  {
    span: 'hm-tile-2',
    emoji: '🫙',
    title: '제품 촬영',
    body: '스마트스토어부터 상세페이지까지, 팔리는 제품 컷을 만듭니다.',
  },
  {
    span: 'hm-tile-2',
    emoji: '🎉',
    title: '스냅 & 행사',
    body: '행사·팝업·브랜드 이벤트의 생생한 순간을 놓치지 않고 기록해요.',
  },
]

const STEPS = [
  {
    num: '01',
    title: '촬영',
    body: '사전 상담으로 컨셉과 무드를 맞춘 뒤, 편안한 분위기에서 촬영해요.',
  },
  {
    num: '02',
    title: '온라인 셀렉',
    body: '전용 갤러리 링크에서 마음에 드는 컷을 클릭 몇 번으로 선택해요. 어디서든, 모바일에서도.',
  },
  {
    num: '03',
    title: '리터칭',
    body: '선택한 컷을 정성껏 보정하고, 피드백을 주고받으며 디테일을 다듬어요.',
  },
  {
    num: '04',
    title: '전달',
    body: '고해상도 완성본을 온라인으로 바로 받아보세요. 한 번에 ZIP 다운로드도 가능해요.',
  },
]

function KineticTitle({ text }: { text: string }) {
  let letterIndex = 0
  return (
    <h1 className="hm-hero-title hm-display" aria-label={text}>
      {text.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i}> </span>
        const delay = `${0.04 * letterIndex++}s`
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`hm-letter${ch === '!' ? ' hm-bang' : ''}`}
            style={{ animationDelay: delay }}
          >
            {ch}
          </span>
        )
      })}
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
          <Link href="/" className="hm-logo">
            <span className="ko">{STUDIO_NAME}</span>
            <span className="en hm-display">HOLYMOLLY!</span>
          </Link>
          <div className="hm-nav-links">
            <a href="#studio" className="hm-hide-sm">스튜디오</a>
            <a href="#process" className="hm-hide-sm">프로세스</a>
            <Link href="/inquiry" className="hm-btn hm-btn-primary hm-nav-cta">
              촬영 문의
            </Link>
          </div>
        </div>
      </nav>

      <header className="hm-hero hm-container">
        <div className="hm-eyebrow">PHOTO STUDIO — {STUDIO_NAME}</div>
        <KineticTitle text="HOLY MOLY!" />
        <p className="hm-hero-sub">
          찍는 순간, 나도 모르게 — <span className="hm-hl">홀리몰리!</span>
        </p>
        <p className="hm-hero-body">
          인물부터 브랜드까지, {STUDIO_SHORT_NAME}는 촬영에서 끝나지 않아요.
          온라인 셀렉, 리터칭, 전달까지 — 사진이 손에 쥐어지는 순간까지 전 과정을 함께합니다.
        </p>
        <div className="hm-hero-ctas">
          <Link href="/inquiry" className="hm-btn hm-btn-primary">
            촬영 문의하기 →
          </Link>
          <a href="#process" className="hm-btn hm-btn-ghost">
            프로세스 보기
          </a>
        </div>
      </header>

      <div className="hm-marquee" aria-hidden="true">
        <div className="hm-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className={item === '✳' ? '' : 'hm-display'}>{item}</span>
          ))}
        </div>
      </div>

      <section id="studio" className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head hm-reveal">
            <div className="en hm-display">WHAT WE SHOOT</div>
            <h2>이런 촬영을 함께해요</h2>
          </div>
          <div className="hm-bento">
            {SERVICES.map(s => (
              <div key={s.title} className={`hm-tile ${s.span} hm-reveal`}>
                <div className="hm-tile-emoji">{s.emoji}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
            <div className="hm-tile hm-tile-2 hm-tile-pop hm-tile-quote hm-reveal">
              <p className="q">&ldquo;홀리몰리&hellip;&rdquo;</p>
              <p>완성본을 받아본 고객님들이 가장 자주 남기는 한마디.</p>
            </div>
            <div className="hm-tile hm-tile-4 hm-tile-vio hm-reveal">
              <div className="hm-tile-emoji">🖥️</div>
              <h3>촬영 후가 더 편한 스튜디오</h3>
              <p>
                촬영이 끝나면 전용 온라인 갤러리 링크를 보내드려요. 마음에 드는 컷을
                하트로 찜하고, 클릭으로 셀렉하고, 보정 진행 상황까지 실시간으로 확인할 수 있어요.
              </p>
            </div>
            <div className="hm-tile hm-tile-2 hm-tile-quote hm-reveal">
              <p className="q">궁금한 게 있나요?</p>
              <p style={{ marginBottom: 18 }}>부담 없이 물어보세요. 24시간 안에 답장드려요.</p>
              <div>
                <Link href="/inquiry" className="hm-btn hm-btn-primary" style={{ padding: '10px 20px', fontSize: 13.5 }}>
                  문의하기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="hm-section" style={{ paddingTop: 0 }}>
        <div className="hm-container">
          <div className="hm-section-head hm-reveal">
            <div className="en hm-display">HOW IT WORKS</div>
            <h2>촬영부터 전달까지, 네 걸음</h2>
          </div>
          <div className="hm-steps">
            {STEPS.map(step => (
              <div key={step.num} className="hm-step hm-reveal">
                <div className="num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section" style={{ paddingTop: 0 }}>
        <div className="hm-container">
          <div className="hm-outro hm-reveal">
            <div className="en hm-display" style={{ fontSize: 13, letterSpacing: '0.2em', color: 'var(--hm-vio)', marginBottom: 12 }}>
              SAY HOLY MOLY!
            </div>
            <h2>
              다음 &ldquo;홀리몰리&rdquo;의 주인공은
              <br />
              당신입니다
            </h2>
            <p>촬영 종류와 일정만 알려주세요. 나머지는 저희가 준비할게요.</p>
            <Link href="/inquiry" className="hm-btn hm-btn-primary">
              촬영 문의하기 →
            </Link>
          </div>
        </div>
      </section>

      <footer className="hm-footer">
        <div className="hm-container hm-footer-inner">
          <div>
            <div className="brand">
              {STUDIO_NAME} <span className="hm-display" style={{ color: 'var(--hm-vio)', fontSize: 13 }}>HOLYMOLLY!</span>
            </div>
            <div className="sub">찍는 순간, 홀리몰리. 사진의 처음부터 끝까지 함께하는 스튜디오.</div>
          </div>
          <div className="hm-footer-links">
            <Link href="/inquiry">촬영 문의</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <Link href="/login" style={{ color: 'var(--hm-mute)', fontWeight: 500, fontSize: 12.5 }}>
              스튜디오 관리자
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
