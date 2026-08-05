import Link from 'next/link'
import LogoSymbol from '@/components/brand/LogoSymbol'
import { BRAND, CONTACT_EMAIL, NAP } from '@/lib/site'

/**
 * 사이트 공통 푸터.
 *
 * 랜딩과 콘텐츠 페이지가 같은 마크업을 쓰도록 분리했습니다. 주소·전화는
 * 환경변수에 값이 들어오면 자동으로 나타납니다 — 사람 눈에 보이는 정보와
 * 구조화 데이터가 같은 소스를 봐야 AI 가 같은 사업자로 인식합니다.
 */
export default function SiteFooter() {
  return (
    <footer className="hm-footer">
      <div className="hm-container hm-footer-inner">
        <div>
          <div className="hm-footer-brand-row">
            <LogoSymbol size={34} />
            <div>
              <div className="brand hm-wordmark hm-display">{BRAND.alternateName}</div>
              <div className="brand-ko">{BRAND.name}</div>
            </div>
          </div>
          <div className="sub">
            뷰티 · 제품 · F&amp;B · 의류 · 인물 · 영상 · BX 디자인
            <br />
            브랜드의 모든 장면을 만드는 크리에이티브 스튜디오.
            {(NAP.street || NAP.phone) && (
              <>
                <br />
                {[NAP.region, NAP.locality, NAP.street].filter(Boolean).join(' ')}
                {NAP.street && NAP.phone ? ' · ' : ''}
                {NAP.phone}
              </>
            )}
          </div>
        </div>
        <div className="hm-footer-links">
          <Link href="/faq">자주 묻는 질문</Link>
          <Link href="/pricing">촬영 비용 안내</Link>
          <Link href="/about">스튜디오 소개</Link>
          <Link href="/inquiry">프로젝트 문의</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <Link href="/login" className="dim">
            Admin
          </Link>
        </div>
      </div>
      <div className="hm-footer-mark hm-display" aria-hidden="true">
        {BRAND.alternateName}
      </div>
    </footer>
  )
}
