import type { Metadata } from 'next'
import './globals.css'
import { STUDIO_NAME } from '@/lib/brand'

export const metadata: Metadata = {
  title: STUDIO_NAME,
  description: '사진 스튜디오 클라이언트 협업 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
