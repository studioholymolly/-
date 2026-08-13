import Link from 'next/link'
import LogoSymbol from '@/components/brand/LogoSymbol'
import { BRAND } from '@/lib/site'

/**
 * 공개 콘텐츠 페이지(FAQ·비용 안내·소개)의 상단 내비게이션.
 *
 * 새 페이지들이 서로, 그리고 홈과 링크로 이어져 있어야 크롤러가 타고
 * 들어옵니다. sitemap 만으로는 부족합니다.
 */
export default function SiteNav() {
  return (
    <nav className="hm-nav">
      <div className="hm-container hm-nav-inner">
        <Link href="/" className="hm-logo" aria-label={BRAND.name}>
          <LogoSymbol size={30} />
          <span className="hm-wordmark hm-display hm-hide-sm">
            {BRAND.alternateName}
          </span>
        </Link>
        <div className="hm-nav-links">
          <Link href="/faq" className="hm-hide-sm">
            자주 묻는 질문
          </Link>
          <Link href="/pricing" className="hm-hide-sm">
            촬영 비용
          </Link>
          <Link href="/inquiry" className="hm-btn hm-btn-primary hm-nav-cta">
            프로젝트 문의
          </Link>
        </div>
      </div>
    </nav>
  )
}
