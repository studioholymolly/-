# AEO/GEO 1순위 작업 — 완료 보고 & 중대 발견

> 작업일: 2026-08-05 · 브랜치 `claude/aeo-geo-investigation-b8n4wj`
> 앞선 두 문서(`aeo-geo-research.md`, `aeo-geo-gpto-실행안.md`)의 실행 결과입니다.

---

## ⚠️ 먼저 — 조사 중 발견한 구조적 문제

작업하면서 **이 저장소에 웹앱이 두 개** 있고, **실제로 서비스되는 쪽은 제가 최적화한 쪽이 아니라는 사실**을 확인했습니다. 이건 앞선 두 리포트의 전제를 흔드는 발견이라 먼저 씁니다.

### 저장소 안의 두 앱

| | 루트 (`src/`) | `dashboard/` |
|---|---|---|
| 기술 | Next.js 16 (서버 렌더링) | Vite + React (클라이언트 렌더링) |
| 패키지명 | `studio-app` | `holymolly-ops` |
| 최근 작업 | 2026-07-07 | **2026-07-24** |
| 내용 | 랜딩 + 문의 + 갤러리 + 대시보드 | 운영 대시보드 + `/inquiry` `/planner` `/reference` |
| **Vercel 배포** | **없음** | **✅ 배포 중** |

Vercel 프로젝트 `holymolly-dashboard`(framework: vite, Root Directory: `dashboard`)가 아래 도메인을 서빙합니다.

```
holymolly-ops.vercel.app
inquiry.studioholymolly.com   ← 실제 고객이 보는 주소
```

### 실서비스 HTML을 직접 받아본 결과

`https://holymolly-ops.vercel.app/inquiry` 의 원본 HTML 전문입니다.

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>스튜디오 홀리몰리 · 운영 대시보드</title>
    <meta property="og:title" content="스튜디오 홀리몰리 · 촬영 스튜디오" />
    ...
  </head>
  <body>
    <div id="root"></div>   ← 본문 끝. 글자가 한 자도 없습니다.
  </body>
</html>
```

**AI 검색 크롤러 입장에서 이 페이지는 백지입니다.** GPTBot·OAI-SearchBot·PerplexityBot·ClaudeBot은 대부분 자바스크립트를 실행하지 않고 HTML만 읽습니다. 구글은 렌더링을 하긴 하지만 지연과 비용이 붙습니다.

> 즉, **지금까지 세운 AEO/GEO 전략은 현재 배포된 사이트에는 적용될 대상 자체가 없었습니다.** 인용될 문장이 부족한 게 아니라, 아예 없었습니다.

### 함께 발견한 문제 2가지

1. **소스와 배포본이 어긋나 있었습니다.** 실서비스 HTML에는 `og:title` 등 공유 미리보기 태그가 있는데 저장소의 `dashboard/index.html` 에는 없었습니다. 손으로 번들을 패치했던 흔적으로 보입니다. **이 상태에서 누군가 `dashboard/` 를 수정해 push하면 Vercel이 소스로 재빌드하면서 그 태그들이 사라집니다.** → 이번에 소스에 복원해 두었습니다.

2. **루트 Next.js 앱이 빌드조차 되지 않는 상태였습니다.** `dashboard/supabase/functions`(Deno 런타임 코드)가 루트 TypeScript 검사 대상에 잡혀 `next build` 가 실패했습니다. 2026-07-24 커밋 이후로 계속 그랬습니다. → 이번에 고쳤습니다.

---

## ⛔ 정정 — 위 진단은 절반만 맞았습니다 (2026-08-05 추가 조사)

처음에 저는 "이 저장소에 앱이 둘 있고 그중 배포된 건 `dashboard/`"라고 정리한 뒤, **루트 Next.js 앱에 `studioholymolly.com` 을 연결하자**고 제안했습니다. **이 제안은 틀렸습니다.**

`studioholymolly.com` 은 **이미 운영 중인 진짜 홈페이지**입니다. 실행했다면 기존 사이트를 덮어썼을 것입니다.

### 실제 구조 — 웹 자산이 셋입니다

| # | 주소 | 정체 | 소스 위치 |
|---|---|---|---|
| **1** | **`studioholymolly.com`** | **공식 홈페이지.** 히어로 · Selected Work · Photography/Videography 소개 · Clients · Reviews · Stats · `/photo` · `/video` · `/contact` | **이 저장소에 없음** (별도 Vercel 프로젝트 `studioholymolly.vercel.app`) |
| 2 | `inquiry.studioholymolly.com` | 운영 대시보드 + 공개 문의 폼(`/inquiry` · `/planner` · `/reference`) | 이 저장소 `dashboard/` |
| 3 | — | Next.js 랜딩·갤러리 앱 | 이 저장소 `src/` · **배포된 곳 없음** |

### 공식 홈페이지(1번)의 실제 AEO/GEO 상태 — HTML을 직접 받아 확인

| 항목 | 상태 |
|---|---|
| `<title>` | ✅ "STUDIO HOLYMOLLY — 브랜드가 보여지는 모든 장면을 만듭니다" |
| `<meta description>` | ✅ "서울 역삼 비주얼 디렉션 스튜디오. 사진·영상·BX 디자인까지…" |
| `<h1>` / `<h2>` | ✅ HTML 안에 존재 (h1은 `sr-only`) |
| OG 태그 | ✅ 있음 |
| **구조화 데이터(JSON-LD)** | ❌ **없음** — 사업자 엔티티가 기계에 선언되지 않음 |
| **robots.txt** | ❌ **404** |
| **sitemap.xml** | ❌ 없음 |
| **본문 콘텐츠** | ⚠️ **자바스크립트로 채워짐.** `<p id="introText"></p>`, `<div id="services"></div>` 처럼 빈 껍데기만 HTML에 있고 실제 문장은 `HM.boot()` 이 나중에 채웁니다. 구글은 렌더링하지만 GPTBot·PerplexityBot 등은 대부분 못 읽습니다 |
| FAQ / 가격 페이지 | ❌ 없음 |

**진짜 문제는 `dashboard/` 가 아니라 여기였습니다.** 브랜드가 사는 사이트에 구조화 데이터도, robots.txt도, sitemap도, 인용될 Q&A도 없습니다.

### 그래서 실제로 해야 할 일

이번에 만든 것을 **`studioholymolly.com` 으로 옮기는 것**입니다. 루트 Next.js 앱에 도메인을 붙이는 게 아닙니다. 옮길 항목은 전부 스택과 무관하게 포팅됩니다.

1. **FAQ 19문항** — 순수 텍스트. 어떤 기술이든 그대로 들어갑니다 (`src/lib/faq.ts`)
2. **촬영 비용 안내** — 동일 (`src/app/pricing/page.tsx`)
3. **JSON-LD(ProfessionalService · FAQPage)** — 정적 HTML `<head>` 에 그대로 붙입니다
4. **robots.txt · sitemap.xml** — 정적 파일로 추가
5. **본문 정적 노출** — 최소한 서비스 소개 문장과 소재지·연락처만이라도 HTML에 직접 넣기. JS가 채우는 내용과 중복돼도 무방합니다

### 막힌 지점

**`studioholymolly.com` 의 소스 코드가 이 저장소에 없습니다.** 별도 GitHub 저장소인지, Vercel에 직접 올린 파일인지 확인이 필요합니다. 저장소 이름을 알려주시면 세션에 붙여 바로 작업하겠습니다.

### 이 저장소의 `src/` Next.js 앱은?

배포처가 없는 상태 그대로 둡니다. 이번 작업(robots · sitemap · JSON-LD · FAQ · 가격 · 소개)은 **참조 구현**으로 남습니다. 빌드가 깨져 있던 것과 `dashboard/index.html` 의 태그 유실 위험은 실제 버그였으므로 고친 값어치는 그대로입니다.

---

## 이번에 완료한 작업

### 1순위 (기반) — 전부 완료

| 항목 | 파일 | 내용 |
|---|---|---|
| 검색로봇 안내 | `src/app/robots.ts` | AI 크롤러 11종 명시적 허용, 고객 갤러리(`/c/`)·대시보드·로그인 차단, sitemap 위치 안내 |
| 사이트 지도 | `src/app/sitemap.ts` | 공개 5개 페이지 등록 |
| 메타데이터 | `src/app/layout.tsx` | `metadataBase`, canonical, OpenGraph, Twitter 카드, 검색엔진 색인 정책, 키워드 14종 |
| 소유확인 | `src/app/layout.tsx` | 구글·네이버·빙 인증 코드를 환경변수로 넣으면 자동 반영 |
| 공유 이미지 | `src/app/opengraph-image.tsx` | 브랜드 톤 그대로 자동 생성 (1200×630) |
| 사업자 정보 | `src/lib/site.ts` | 상호·연락처·서비스·공개 라우트 단일 소스 |
| 구조화 데이터 | `src/lib/jsonld.ts` + `src/components/JsonLd.tsx` | ProfessionalService, FAQPage, WebPage, BreadcrumbList, AggregateOffer |
| 상호 통일 | `src/lib/site.ts` | `스튜디오 홀리몰리 (STUDIO. HOLYMOLLY)` 를 표준형으로 확정, 푸터·구조화 데이터가 같은 값 참조 |

### 2순위 (콘텐츠) — 앞당겨 완료

| 페이지 | 파일 | 내용 |
|---|---|---|
| `/faq` | `src/app/faq/page.tsx` + `src/lib/faq.ts` | **19문항**. 전부 답변 캡슐 형식(H2 질문 → 자립형 답변 → 부연). 본문과 FAQPage 구조화 데이터가 같은 배열을 공유해 불일치 원천 차단 |
| `/pricing` | `src/app/pricing/page.tsx` | **나안(구간+변수)** 그대로 적용. 계산 로직 전면 공개, 금액은 구간으로. 데이 패키지·컷당 단가·추가 옵션·포함/미포함·협의 영역 |
| `/about` | `src/app/about/page.tsx` | 엔티티 페이지. 상호·분야·서비스 지역·연락처를 산문과 표로 |

공통: 각 페이지에 `최종 업데이트` 표기(신선도 신호), 내부 링크 연결(내비게이션·푸터), 페이지별 canonical·OG.

### 함께 정리한 것

- `tsconfig.json` — `dashboard`·`quote-app` 을 타입 검사에서 제외해 **루트 빌드 복구**
- `middleware.ts` — `robots.txt`·`sitemap.xml`·OG 이미지는 인증 미들웨어를 타지 않도록 제외 (크롤러 응답 속도)
- `SiteFooter` / `SiteNav` 컴포넌트로 분리 — 랜딩과 새 페이지가 같은 마크업 공유
- `dashboard/index.html` — **실서비스 앱에 대한 최소 조치**: 사라질 뻔한 og 태그 복원 + meta description + ProfessionalService 구조화 데이터 + `<noscript>` 본문. 자바스크립트를 실행하지 않는 크롤러도 최소한 "무엇을 하는 스튜디오인지"는 읽을 수 있게 됐습니다. React 앱 동작에는 영향이 없습니다

### 검증

```
✓ next build 통과 — /faq /pricing /about /robots.txt /sitemap.xml /opengraph-image 전부 생성
✓ 서버 렌더링 확인 — "1컷당 평균 30분" 이 HTML 원본에 그대로 실려 나감
✓ 구조화 데이터 확인 — FAQPage·ProfessionalService·AggregateOffer 출력 확인
✓ eslint — 새 파일 0건 (기존 159건은 손대지 않음, 변경 전후 동일)
✓ vite build 통과 — dashboard 앱 정상, 메타·noscript 빌드 산출물에 반영 확인
```

---

## 사장님이 하실 일 (총 40분쯤)

### 지금 바로 (계정 작업 — 제가 못 하는 영역)

1. **Google Search Console** 등록 → 발급 코드를 Vercel 환경변수 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 에
2. **Bing 웹마스터 도구** 등록 → `NEXT_PUBLIC_BING_SITE_VERIFICATION`
   - **ChatGPT가 Bing 인덱스를 씁니다.** 국내 사업자가 가장 자주 빠뜨리는 항목입니다
3. **네이버 서치어드바이저** 등록 → `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`
4. 세 곳 모두에 `sitemap.xml` 제출

### 확인 완료된 내용 (2026-08-05 반영)

| 항목 | 결정 | 반영 |
|---|---|---|
| 가격 구간 공개 | 승인 | 하프데이 150만~220만, 원데이 300만~420만 원 그대로 게시 |
| 부가세 | **별도 표기** | `/pricing` 본문 2곳 + 구조화 데이터 `valueAddedTaxIncluded: false` |
| 영상·BX 금액 | 비공개 유지 | 개별 협의로만 안내 |

### 소재지·연락처 (반영 완료)

```
도로명   서울특별시 강남구 언주로65길 29, 지하 1층   ← 표준 표기
지번     서울특별시 강남구 역삼동 783-2, 지하 1층    ← 사람용 보조 표기
전화     010-8236-9368
```

**도로명주소를 표준으로 씁니다.** 구조화 데이터(기계가 읽는 정보)에는 도로명만 넣었습니다. 두 주소를 함께 내보내면 AI 가 서로 다른 두 위치로 읽을 수 있기 때문입니다. 지번은 `/about` 페이지에 사람이 찾아올 때를 위한 보조 표기로만 뒀습니다.

> **네이버 플레이스·구글 비즈니스 프로필에도 도로명주소를 문자 단위로 똑같이** 넣어 주세요. `언주로65길 29, 지하 1층` — 띄어쓰기와 쉼표까지 동일해야 같은 사업자로 인식됩니다.

아직 비어 있는 값 (나중에 채우면 자동 반영):

| 값 | 환경변수 |
|---|---|
| 우편번호 | `NEXT_PUBLIC_STUDIO_POSTAL_CODE` |
| 네이버 플레이스 주소 | `NEXT_PUBLIC_NAVER_PLACE_URL` |

> **참고:** 등록하신 번호가 휴대전화라 웹에 공개되면 자동 수집 프로그램에 긁혀 스팸이 늘 수 있습니다. 지금은 그대로 반영해 뒀고, 대표번호를 따로 두고 싶으시면 `NEXT_PUBLIC_STUDIO_PHONE` 만 바꾸면 사이트 전체가 함께 바뀝니다.

---

## 다음 단계 (3순위)

배포 결정이 나면 이어서:

- `/work` 공개 사례 페이지 3~5개 (브랜드·컷 수·기간·결과를 숫자와 함께)
- 네이버 플레이스 등록·완성
- 리뷰 축적 루틴 (촬영 종료 시 갤러리 전달 메일에 리뷰 링크)
- Wikidata 항목 생성
- 월 1회 프롬프트 20개 점검 (`aeo-geo-gpto-실행안.md` 4장)
