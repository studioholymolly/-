import type { Metadata } from 'next'
import Link from 'next/link'
import InquiryForm from '@/components/inquiry/InquiryForm'
import LogoSymbol from '@/components/brand/LogoSymbol'
import { STUDIO_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: '프로젝트 문의',
  description: '스튜디오 홀리몰리 프로젝트 문의 — 몇 가지만 알려주시면 24시간 안에 답장드립니다.',
}

export default function InquiryPage() {
  return (
    <div className="hm-page">
      <nav className="hm-nav">
        <div className="hm-container hm-nav-inner">
          <Link href="/" className="hm-logo" aria-label={STUDIO_NAME}>
            <LogoSymbol size={30} />
            <span className="hm-wordmark hm-display hm-hide-sm">STUDIO. HOLYMOLLY</span>
          </Link>
          <div className="hm-nav-links">
            <Link href="/">← 홈으로</Link>
          </div>
        </div>
      </nav>

      <main className="hm-form-wrap">
        <div className="hm-form-head">
          <span className="hm-label-xs">Contact</span>
          <div className="en hm-display">New Project</div>
          <p>
            아래 몇 가지만 알려주시면, <strong>24시간 안에</strong> 답장드립니다.
            <br />
            필수 항목은 네 개뿐입니다.
          </p>
        </div>
        <InquiryForm />
      </main>
    </div>
  )
}
