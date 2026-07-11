# 홀리몰리 studio ops (holymolly-ops)

`holymolly-ops.vercel.app`에 배포되는 스튜디오 운영 대시보드 (Vite + React + Supabase).

이 소스는 Vercel 배포 번들에서 복원한 것입니다 — 원본 소스가 GitHub에 백업된 적이
없어, 배포된 프로덕션 번들(minified)을 식별자 보존 방식으로 되살렸습니다.
`src/main.jsx` 상단의 vendor shim이 번들의 압축 식별자(E=react, a=jsx-runtime,
In=Anthropic 등)를 실제 패키지 import로 매핑합니다.

- 개발: `npm install && npm run dev`
- 빌드: `npm run build`
- 배포: Vercel 프로젝트 `holymolly-dashboard` (production 도메인 holymolly-ops.vercel.app)
- 데이터: Supabase (`app_config`, `projects`, `tasks`, `deals`, `expenses`, ... 테이블에
  `{id, data}` JSON 행으로 저장) — 코드 재배포는 데이터에 영향 없음
