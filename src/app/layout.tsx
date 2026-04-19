import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '스튜디오 홀리몰리',
  description: '사진 스튜디오 클라이언트 협업 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
