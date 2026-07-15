# 스튜디오 홀리몰리 운영 대시보드 (재배포본)

`holymolly-ops.vercel.app` 대시보드를 기존과 동일하게 재배포하기 위한 정적 빌드 결과물입니다.
배포된 프로덕션 번들을 복원하고 **견적서 항목만 촬영비 5 / 외주 5 두 구역(최대 10개)**으로 패치했습니다.

## 구성
- `index.html`, `assets/*` — 실제 프로덕션 빌드 (견적서 5/5 패치 반영)
- `api/env.js` — Supabase 공개 설정을 Vercel 환경변수에서 런타임 주입 (키는 저장소에 미포함)
- `api/meta.js` — 메타 광고 프록시 (관측 동작 기반 복원)
- `brand/*` — 로고
- `vercel.json` — 빌드 없이 정적 + 서버리스 함수로 서빙

## Vercel 설정
- **Root Directory**: `dashboard`
- Framework: Other (vercel.json에서 `framework: null`로 지정)
- 필요한 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `META_AD_ACCOUNT_ID`, `META_ACCESS_TOKEN`
