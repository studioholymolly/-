import type { Metadata } from 'next'
import { Noto_Sans_KR, Archivo } from 'next/font/google'
import './globals.css'
import { STUDIO_NAME } from '@/lib/brand'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${STUDIO_NAME} — 찍는 순간, 홀리몰리!`,
    template: `%s · ${STUDIO_NAME}`,
  },
  description:
    '인물부터 브랜드까지, 촬영·셀렉·보정·전달의 전 과정을 함께하는 사진 스튜디오.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
