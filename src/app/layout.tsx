import type { Metadata } from 'next'
import { Noto_Sans_KR, Jost } from 'next/font/google'
import './globals.css'
import { BRAND, SITE_URL, SITE_VERIFICATION } from '@/lib/site'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  // metadataBase 가 있어야 하위 페이지에서 상대 경로로 canonical·OG 이미지를
  // 쓸 수 있습니다. 자체 도메인을 붙이면 NEXT_PUBLIC_SITE_URL 만 바꾸면 됩니다.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: [
    '제품 촬영',
    '뷰티 촬영',
    '화장품 촬영',
    'F&B 촬영',
    '음식 촬영',
    '룩북 촬영',
    '상세페이지 촬영',
    '누끼컷',
    '연출컷',
    '브랜드 필름',
    'BX 디자인',
    '촬영 스튜디오',
    BRAND.name,
    BRAND.alternateName,
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: SITE_VERIFICATION.google || undefined,
    other: {
      ...(SITE_VERIFICATION.naver
        ? { 'naver-site-verification': SITE_VERIFICATION.naver }
        : {}),
      ...(SITE_VERIFICATION.bing ? { 'msvalidate.01': SITE_VERIFICATION.bing } : {}),
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  )
}
