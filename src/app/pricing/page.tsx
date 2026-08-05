import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import SiteFooter from '@/components/site/SiteFooter'
import SiteNav from '@/components/site/SiteNav'
import { breadcrumbSchema, ORGANIZATION_ID, webPageSchema } from '@/lib/jsonld'
import { CONTENT_UPDATED, SITE_URL } from '@/lib/site'

const PAGE_URL = `${SITE_URL}/pricing`

const DESCRIPTION =
  '촬영 비용이 어떻게 계산되는지 기준을 공개합니다. 1컷 평균 30분, 하프데이 7~8컷, 원데이 12~15컷. 하프데이 150만~220만 원선, 원데이 300만~420만 원선이며 구성에 따라 달라집니다.'

export const metadata: Metadata = {
  title: '촬영 비용 안내',
  description: DESCRIPTION,
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: '촬영 비용은 어떻게 계산되나요 — 스튜디오 홀리몰리',
    description: DESCRIPTION,
    url: '/pricing',
  },
}

/** 데이 패키지 — 금액은 구간으로만 공개합니다. */
const PACKAGES = [
  {
    num: '01',
    name: '하프데이',
    time: '실촬영 4시간',
    cuts: '7~8컷',
    range: '150만 ~ 220만 원',
    note: '포토그래퍼 단독 구성에서 스타일리스트 포함 구성까지의 범위입니다.',
  },
  {
    num: '02',
    name: '원데이',
    time: '실촬영 8시간 (중식 1시간 별도)',
    cuts: '12~15컷',
    range: '300만 ~ 420만 원',
    note: '컷 수가 많거나 구성이 다양하면 스타일리스트 포함 구성을 권해드립니다.',
  },
  {
    num: '03',
    name: '다일 (2일 이상)',
    time: '원데이 기준 × 일수',
    cuts: '일자별 12~15컷',
    range: '원데이 단가 × 일수',
    note: '분량이 많을 때 하루에 몰아넣기보다 나누는 편이 각 컷의 완성도에 유리합니다.',
  },
] as const

/** 컷당 단가 — 데이 패키지로 묶기 애매한 소량·추가 촬영. */
const PER_CUT = [
  { name: '누끼컷', price: '10만 원', desc: '배경 없이 제품만 따낸 컷. 촬영과 리터칭 포함.' },
  { name: '기본 연출컷', price: '30만 원', desc: '소품과 배경으로 분위기를 만든 기본 구성.' },
  { name: '연출컷 (소품·세팅 다수)', price: '50만 원', desc: '세팅 규모가 큰 연출. 스타일리스트 포함.' },
] as const

/** 추가 옵션 — 촬영비와 별도로 붙는 항목. */
const OPTIONS = [
  { name: '제품 정밀 보정', price: '10만 원 / 컷', desc: '먼지·문안 합성·수평수직·색감·톤. 수정 1회 포함.' },
  { name: '인물 정밀 보정', price: '10만 원 / 컷', desc: '잡티·피부톤·헤어·이목구비. 수정 1회 포함.' },
  { name: '촬영 기획', price: '100만 원', desc: '무드보드·컨셉·컷 구성 제안. 제품 또는 브랜드 소개서가 필요합니다.' },
  { name: '영상·GIF 편집', price: '10만 원 / 클립', desc: '촬영 현장에서 함께 담은 소재의 편집.' },
  { name: '시간 초과', price: '포토 30만 · 스타일리스트 15만 / 시', desc: '실촬영 기준 시간을 넘길 경우 1시간 단위 가산.' },
  { name: '긴급 보정 (ASAP)', price: '30만 원', desc: '기본 납기(셀렉일 +7일)보다 앞당겨야 할 때.' },
  { name: '출장비', price: '서울 10만 · 경기 20만 원', desc: '그 외 지역은 개별 협의합니다.' },
] as const

export default function PricingPage() {
  return (
    <div className="hm-page">
      <JsonLd
        data={{
          ...webPageSchema({
            url: PAGE_URL,
            name: '촬영 비용 안내',
            description: DESCRIPTION,
            dateModified: `${CONTENT_UPDATED}-01`,
          }),
          mainEntity: {
            '@type': 'Service',
            name: '상업 사진 촬영',
            serviceType: '제품·뷰티·F&B·의류·인물 촬영',
            provider: { '@id': ORGANIZATION_ID },
            areaServed: { '@type': 'Country', name: '대한민국' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'KRW',
              lowPrice: '1500000',
              highPrice: '4200000',
              offerCount: PACKAGES.length,
              valueAddedTaxIncluded: false,
              description:
                '하프데이(실촬영 4시간, 7~8컷) 150만~220만 원, 원데이(실촬영 8시간, 12~15컷) 300만~420만 원. 모두 부가세 별도이며 정밀 보정·소품 재료비는 따로 산정합니다.',
            },
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: '홈', path: '/' },
          { name: '촬영 비용 안내', path: '/pricing' },
        ])}
      />

      <SiteNav />

      <main className="hm-doc">
        <div className="hm-container">
          <header className="hm-doc-head">
            <span className="hm-label-xs">Pricing</span>
            <h1>촬영 비용은 이렇게 계산됩니다</h1>
            <p className="hm-doc-lead">
              금액보다 <strong>계산 방식</strong>을 먼저 공개합니다. 컷 수만 정해지면
              필요한 시간과 예산이 거의 그대로 나오기 때문입니다. 아래 기준은 실제
              견적에 적용하는 기준 그대로입니다.
            </p>
            <p className="hm-updated">최종 업데이트 {CONTENT_UPDATED}</p>
          </header>

          {/* 1 — 계산 기준. 이 페이지에서 가장 중요한 부분입니다. */}
          <section className="hm-doc-section">
            <h2>1. 컷 수로 시간을 계산합니다</h2>
            <p className="hm-faq-answer">
              1컷당 평균 30분이 기준입니다. 하프데이(실촬영 4시간)는 7~8컷,
              원데이(실촬영 8시간)는 12~15컷이 적정 분량입니다. 소품 세팅이 많거나
              구성이 복잡한 컷은 컷당 소요 시간이 더 늘어납니다.
            </p>
            <ul className="hm-doc-list">
              <li>
                <strong>제품 종수 × 컷 구성</strong> = 총 컷 수. 제품 10종을
                메인·디테일 2컷씩 담으면 20컷입니다.
              </li>
              <li>
                <strong>총 컷 수 ÷ 시간당 2컷</strong> = 필요 시간. 20컷이면 10시간,
                즉 원데이 하루로는 모자랍니다.
              </li>
              <li>
                최소 진행 단위는 <strong>하프데이 4시간</strong>입니다. 그보다 적은
                분량은 아래 컷당 단가로 안내드립니다.
              </li>
            </ul>
          </section>

          {/* 2 — 패키지 구간 */}
          <section className="hm-doc-section">
            <h2>2. 데이 패키지</h2>
            <p className="hm-faq-answer">
              하프데이는 150만~220만 원선, 원데이는 300만~420만 원선입니다(부가세
              별도). 같은 패키지 안에서 금액이 달라지는 이유는 스타일리스트 투입
              여부입니다. 포토그래퍼가 직접 스타일링하면 구간의 아래쪽, 전문
              스타일리스트가 붙으면 위쪽입니다.
            </p>
            <div className="hm-rows">
              {PACKAGES.map((p) => (
                <div key={p.num} className="hm-row hm-row-price">
                  <span className="num hm-display">{p.num}</span>
                  <h3>
                    {p.name}
                    <span className="hm-row-meta">
                      {p.time} · {p.cuts}
                    </span>
                  </h3>
                  <p>{p.note}</p>
                  <span className="hm-price hm-display">{p.range}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3 — 컷당 단가 */}
          <section className="hm-doc-section">
            <h2>3. 소량 촬영은 컷당 단가</h2>
            <p className="hm-faq-answer">
              데이 패키지로 묶기 애매한 소량 건, 본 촬영과 다른 날 진행하는 추가
              촬영에 적용합니다. 누끼컷은 배경 없이 제품만 따낸 컷, 연출컷은 소품과
              배경으로 분위기를 만든 컷입니다.
            </p>
            <table className="hm-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>단가</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                {PER_CUT.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="hm-display">{c.price}</td>
                    <td>{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 4 — 추가 옵션 */}
          <section className="hm-doc-section">
            <h2>4. 촬영비와 별도로 붙는 항목</h2>
            <p className="hm-faq-answer">
              촬영비에는 전체 컷의 기본 톤 보정까지 포함됩니다. 컷 단위로 다듬는
              정밀 보정, 연출용 소품·재료비, 출장비는 별도입니다. 전체 컷을 모두
              정밀 보정하실 필요는 없고, 크게 노출되는 컷만 고르셔도 됩니다.
            </p>
            <table className="hm-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>비용</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                {OPTIONS.map((o) => (
                  <tr key={o.name}>
                    <td>{o.name}</td>
                    <td className="hm-display">{o.price}</td>
                    <td>{o.desc}</td>
                  </tr>
                ))}
                <tr>
                  <td>소품·재료비</td>
                  <td className="hm-display">실비</td>
                  <td>연출에 쓰이는 소품과 재료는 영수증 첨부 후 실비로 정산합니다.</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 5 — 포함 / 미포함 */}
          <section className="hm-doc-section">
            <h2>5. 견적에 포함되는 것과 아닌 것</h2>
            <div className="hm-split">
              <div>
                <h3>포함됩니다</h3>
                <ul className="hm-doc-list">
                  <li>사전 상담과 컨셉 조율</li>
                  <li>촬영 진행 (포토그래퍼, 필요 시 스타일리스트)</li>
                  <li>전체 컷 기본 톤 보정</li>
                  <li>JPG 원본 전달 — 촬영 다음 날</li>
                  <li>전용 온라인 갤러리에서의 셀렉과 진행 상황 확인</li>
                </ul>
              </div>
              <div>
                <h3>별도입니다</h3>
                <ul className="hm-doc-list">
                  <li>정밀 보정 (컷당 10만 원, 수정 1회 포함)</li>
                  <li>연출용 소품·재료비 (실비)</li>
                  <li>출장비 (서울 10만 · 경기 20만 원)</li>
                  <li>RAW·PSD 파일 제공</li>
                  <li>모델 캐스팅과 초상권 (에이전시 견적)</li>
                  <li>헤어·메이크업</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6 — 개별 협의 영역 */}
          <section className="hm-doc-section">
            <h2>6. 개별 협의로 안내드리는 작업</h2>
            <p className="hm-faq-answer">
              브랜드 필름과 광고 영상, BX·브랜드 방향성 설계는 협업팀 구성에 따라
              견적이 크게 달라져 정찰가로 안내드리기 어렵습니다. 원하시는 결과물과
              사용 범위를 알려주시면 구성부터 함께 잡아 예상 견적을 드립니다.
            </p>
            <ul className="hm-doc-list">
              <li>브랜드 필름 · 광고용 컷다운 · 숏폼 콘텐츠</li>
              <li>BX 디자인, 콘텐츠 방향성 설계</li>
              <li>헤어·메이크업 팀 구성</li>
              <li>모델 캐스팅 (사용 범위와 기간을 함께 확정합니다)</li>
            </ul>
          </section>

          <aside className="hm-doc-cta">
            <h2>예산이 정해져 있으신가요?</h2>
            <p>
              생각하고 계신 예산을 알려주시면 어떤 구성으로 맞추는지 근거와 함께
              안내드립니다. 문의는 24시간 안에 답장드립니다.
            </p>
            <div className="hm-hero-ctas">
              <Link href="/inquiry" className="hm-btn hm-btn-primary">
                프로젝트 문의하기
              </Link>
              <Link href="/faq" className="hm-textlink">
                자주 묻는 질문 보기 →
              </Link>
            </div>
          </aside>

          <p className="hm-doc-footnote">
            위 금액은 모두 부가세 별도이며, 촬영 구성과 일정에 따라 조정될 수
            있습니다. 정확한 견적은 컷 구성이 정해진 뒤 확정해 드립니다.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
