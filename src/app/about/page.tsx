import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import SiteFooter from '@/components/site/SiteFooter'
import SiteNav from '@/components/site/SiteNav'
import { breadcrumbSchema, webPageSchema } from '@/lib/jsonld'
import {
  BRAND,
  CONTACT_EMAIL,
  CONTENT_UPDATED,
  NAP,
  SERVICE_CATALOG,
  SITE_URL,
} from '@/lib/site'

const PAGE_URL = `${SITE_URL}/about`

const DESCRIPTION =
  '스튜디오 홀리몰리(STUDIO HOLYMOLLY)는 뷰티, 제품, F&B, 의류, 인물 촬영과 영상·BX 디자인을 진행하는 서울의 크리에이티브 스튜디오입니다. 촬영 후에는 전용 온라인 갤러리로 셀렉부터 전달까지 링크 하나로 진행합니다.'

export const metadata: Metadata = {
  title: '스튜디오 소개',
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: '스튜디오 소개 — 스튜디오 홀리몰리',
    description: DESCRIPTION,
    url: '/about',
  },
}

export default function AboutPage() {
  return (
    <div className="hm-page">
      <JsonLd
        data={webPageSchema({
          url: PAGE_URL,
          name: '스튜디오 소개',
          description: DESCRIPTION,
          dateModified: `${CONTENT_UPDATED}-01`,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: '홈', path: '/' },
          { name: '스튜디오 소개', path: '/about' },
        ])}
      />

      <SiteNav />

      <main className="hm-doc">
        <div className="hm-container">
          <header className="hm-doc-head">
            <span className="hm-label-xs">About</span>
            <h1>스튜디오 홀리몰리</h1>
            <p className="hm-doc-lead">
              브랜드의 모든 장면을 만드는 크리에이티브 스튜디오입니다.
            </p>
            <p className="hm-updated">최종 업데이트 {CONTENT_UPDATED}</p>
          </header>

          <section className="hm-doc-section">
            <h2>어떤 스튜디오인가요?</h2>
            <p className="hm-faq-answer">
              스튜디오 홀리몰리(STUDIO HOLYMOLLY)는 뷰티, 제품, F&amp;B, 의류, 인물
              촬영과 영상 제작, BX 디자인을 진행하는 크리에이티브 스튜디오입니다.
              코스메틱 상세페이지 컷부터 시즌 룩북, 브랜드 필름까지 브랜드가 필요로
              하는 장면을 한 팀에서 만듭니다.
            </p>
            <p className="hm-doc-body">
              촬영만 하고 끝나는 대신 브랜드 경험 전체를 함께 봅니다. 비주얼
              아이덴티티부터 콘텐츠 시스템까지 설계가 필요한 프로젝트라면 BX
              디자이너와 함께 방향성부터 잡습니다.
            </p>
          </section>

          <section className="hm-doc-section">
            <h2>무엇을 하나요?</h2>
            <div className="hm-rows">
              {SERVICE_CATALOG.map((s, i) => (
                <div key={s.name} className="hm-row">
                  <span className="num hm-display">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <span className="arr" aria-hidden="true">
                    →
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="hm-doc-section">
            <h2>촬영이 끝난 뒤가 다릅니다</h2>
            <p className="hm-faq-answer">
              촬영이 끝나면 전용 온라인 갤러리 링크를 보내드립니다. 모바일에서도
              마음에 드는 컷을 하트로 찜하고 클릭으로 셀렉할 수 있으며, 선택한 컷은
              실시간으로 스튜디오에 전달됩니다. 사진을 고르러 스튜디오에 다시
              방문하실 필요가 없습니다.
            </p>
            <p className="hm-doc-body">
              보정이 어디까지 진행됐는지, 완성본은 언제 오는지도 같은 갤러리에서
              확인하실 수 있습니다. 기본 톤 보정을 마친 JPG 원본은 촬영 다음 날,
              셀렉하신 컷의 정밀 보정본은 셀렉일로부터 7일 뒤가 기본 납기입니다.
            </p>
          </section>

          <section className="hm-doc-section">
            <h2>어떻게 진행되나요?</h2>
            <ol className="hm-doc-steps">
              <li>
                <strong>사전 상담</strong> — 컨셉과 무드, 컷 구성을 맞춥니다. 컷 수가
                정해지면 필요한 일정과 예산이 함께 정해집니다.
              </li>
              <li>
                <strong>촬영</strong> — 하프데이(실촬영 4시간, 7~8컷) 또는
                원데이(실촬영 8시간, 12~15컷) 기준으로 진행합니다.
              </li>
              <li>
                <strong>온라인 셀렉</strong> — 전용 갤러리 링크에서 클릭 몇 번으로
                컷을 고릅니다.
              </li>
              <li>
                <strong>보정과 전달</strong> — 셀렉일로부터 7일 뒤 정밀 보정본을
                전달드립니다.
              </li>
            </ol>
          </section>

          <section className="hm-doc-section">
            <h2>기본 정보</h2>
            <table className="hm-table">
              <tbody>
                <tr>
                  <td>상호</td>
                  <td>
                    {BRAND.name} ({BRAND.alternateName})
                  </td>
                </tr>
                <tr>
                  <td>분야</td>
                  <td>상업 사진 촬영, 영상 제작, BX 디자인</td>
                </tr>
                {NAP.street && (
                  <tr>
                    <td>소재지</td>
                    <td>
                      {[NAP.region, NAP.locality, NAP.street].filter(Boolean).join(' ')}
                      {NAP.lotNumberAddress && (
                        <>
                          <br />
                          <span className="hm-addr-alt">
                            지번 · {NAP.lotNumberAddress}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                )}
                {NAP.phone && (
                  <tr>
                    <td>전화</td>
                    <td>
                      <a className="hm-textlink" href={`tel:${NAP.phone.replace(/-/g, '')}`}>
                        {NAP.phone}
                      </a>
                    </td>
                  </tr>
                )}
                <tr>
                  <td>이메일</td>
                  <td>
                    <a className="hm-textlink" href={`mailto:${CONTACT_EMAIL}`}>
                      {CONTACT_EMAIL}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>서비스 지역</td>
                  <td>전국 (출장비 서울 10만 · 경기 20만 원, 그 외 협의)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <aside className="hm-doc-cta">
            <h2>함께할 프로젝트가 있으신가요?</h2>
            <p>
              몇 가지만 알려주시면 24시간 안에 답장드립니다. 촬영 기획안이 아직
              없어도 괜찮습니다.
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
