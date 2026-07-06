import type { Metadata } from 'next'
import { Noto_Sans_KR, Jost } from 'next/font/google'
import './globals.css'
import { STUDIO_NAME } from '@/lib/brand'

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
  title: {
    default: `${STUDIO_NAME} — Creative Studio`,
    template: `%s · ${STUDIO_NAME}`,
  },
  description:
    '뷰티, 제품, F&B, 의류, 인물, 영상, BX 디자인 — 브랜드의 모든 장면을 만드는 크리에이티브 스튜디오.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  )
}
