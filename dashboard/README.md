# 홀리몰리 운영 대시보드 — 원본 소스

`holymolly-ops.vercel.app`(Vercel 프로젝트 `holymolly-dashboard`, Root Directory=`dashboard`)로 배포되는
Vite + React 앱의 **원본 소스**입니다. 이전에는 빌드 결과물(번들)만 이 저장소에 있었지만,
이제 소스가 정식으로 여기 있으므로 **번들 패치 없이 소스를 고치고 push하면 Vercel이 빌드**합니다.

## 구성
- `src/` — 대시보드 SPA (탭별 페이지는 `src/pages/`)
- `api/` — Vercel 서버리스 함수: `meta.js`(메타 광고 프록시 · `q=all&preset=last_7d|last_30d|last_90d`, 게재 위치 `placement` 포함), `brand-mood.js`, `inquiry-upload.js`, `notify-inquiry.js`
- `public/brand/` — 로고 에셋
- `__*_test.html` + `src/__*Test.jsx` — 페이지별 목데이터 하네스 (`npx vite` 후 `/__ads_test.html` 등, 배포에는 미포함)

## 로컬 개발
```bash
npm install
npx vite        # http://localhost:5473
npx vite build  # dist/
```

## 환경변수 (Vercel 프로젝트에 설정됨)
`META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` — 메타 광고 프록시용. Supabase는 공개 anon 키 폴백 내장(RLS 보호).
