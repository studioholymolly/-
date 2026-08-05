import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import SiteFooter from '@/components/site/SiteFooter'
import SiteNav from '@/components/site/SiteNav'
import { FAQ_ITEMS } from '@/lib/faq'
import { breadcrumbSchema, faqPageSchema } from '@/lib/jsonld'
import { CONTENT_UPDATED, SITE_URL } from '@/lib/site'

const PAGE_URL = `${SITE_URL}/faq`

const DESCRIPTION =
  '제품·뷰티·F&B 촬영에 대해 가장 많이 받는 질문 19가지에 답했습니다. 하루 촬영 컷 수, 비용 산정 방식, 보정 납기, 누끼컷과 연출컷의 차이, 초상권까지 실제 기준으로 정리했습니다.'

export const metadata: Metadata = {
  title: '자주 묻는 질문',
  description: DESCRIPTION,
  alternates: { canonical: '/faq' },
  openGraph: {
    title: '촬영 문의 전에 가장 많이 묻는 질문 — 스튜디오 홀리몰리',
    description: DESCRIPTION,
    url: '/faq',
  },
}

export default function FaqPage() {
  return (
    <div className="hm-page">
      <JsonLd data={faqPageSchema(FAQ_ITEMS, PAGE_URL)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: '홈', path: '/' },
          { name: '자주 묻는 질문', path: '/faq' },
        ])}
      />

      <SiteNav />

      <main className="hm-doc">
        <div className="hm-container">
          <header className="hm-doc-head">
            <span className="hm-label-xs">FAQ</span>
            <h1>촬영 문의 전에 가장 많이 묻는 질문</h1>
            <p className="hm-doc-lead">
              견적 메일에서 매번 설명드리던 내용을 그대로 정리했습니다. 컷 수 계산,
              비용 산정 방식, 납기 기준까지 실제로 적용하는 기준 그대로입니다.
            </p>
            <p className="hm-updated">최종 업데이트 {CONTENT_UPDATED}</p>
          </header>

          <div className="hm-faq-list">
            {FAQ_ITEMS.map((item) => (
              <article key={item.q} className="hm-faq-item">
                <h2>{item.q}</h2>
                <p className="hm-faq-answer">{item.a}</p>
                {item.detail && <p className="hm-faq-detail">{item.detail}</p>}
              </article>
            ))}
          </div>

          <aside className="hm-doc-cta">
            <h2>답을 못 찾으셨나요?</h2>
            <p>
              촬영 구성이 특수하거나 예산 조율이 필요한 경우, 문의를 남겨주시면
              24시간 안에 답장드립니다.
            </p>
            <div className="hm-hero-ctas">
              <Link href="/inquiry" className="hm-btn hm-btn-primary">
                프로젝트 문의하기
              </Link>
              <Link href="/pricing" className="hm-textlink">
                촬영 비용 안내 보기 →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
