import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5473, strictPort: true },
  // 모노레포 루트(Next.js)의 postcss.config를 상위 탐색으로 집어오지 않도록 차단
  css: { postcss: { plugins: [] } },
})
