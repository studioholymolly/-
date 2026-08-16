import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 빌드 시각을 앱에 새겨 넣는다 — "지금 보고 있는 화면이 최신 배포인지"를 설정 화면에서 바로 확인
const BUILD_STAMP = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

export default defineConfig({
  define: { __BUILD_STAMP__: JSON.stringify(BUILD_STAMP) },
  plugins: [react()],
  server: { port: 5473, strictPort: true },
  // 모노레포 루트(Next.js)의 postcss.config를 상위 탐색으로 집어오지 않도록 차단
  css: { postcss: { plugins: [] } },
})
