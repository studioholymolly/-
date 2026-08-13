# AEO / GEO 조사 리포트

> 조사일: 2026-08-05
> 대상: 스튜디오 홀리몰리 웹사이트(Next.js 16, Vercel `icn1`)
> 범위: 개념 정리 → 2026년 시장 데이터 → 엔진별 작동 원리 → 근거 있는 최적화 기법 → 통하지 않는 것 → 측정 → 현재 사이트 진단 → 실행안

---

## 0. 3분 요약

1. **AEO와 GEO는 사실상 같은 작업의 다른 이름이다.** AEO는 "질문에 대한 답변으로 추출되기"에, GEO는 "AI 답변 안에서 브랜드가 추천·인용되기"에 무게를 둔다. 실행 항목은 80% 이상 겹친다. SEO를 대체하는 게 아니라 **SEO 위에 얹히는 레이어**다. 크롤링·인덱싱이 안 되면 AEO/GEO도 0이다.
2. **아직 트래픽의 주력은 아니다.** 2026년 기준 AI 검색 엔진 전체가 만드는 리퍼럴은 전체 검색 리퍼럴의 **0.29%** 수준이고 구글이 여전히 ~87.6%를 보낸다. 다만 **정보성 질의의 15~20%**가 AI 쪽으로 이동했고, AI 경유 유입의 전환율이 오가닉 대비 **약 5배(14.2% vs 2.8%)**로 보고된다. 즉 **양은 적지만 질이 높은 채널**이다.
3. **가장 근거가 탄탄한 기법은 3가지다.** 프린스턴/IIT 델리 GEO 논문(KDD 2024)이 1만 개 질의로 검증한 결과, ① 인용 가능한 **통계·수치 추가**, ② **전문가 인용문(따옴표)** 삽입, ③ **출처 명시(인라인 시테이션)** 가 가시성을 **+30~40%** 올렸다. 반대로 **키워드 스터핑은 -10%**로 오히려 해가 된다.
4. **링크보다 언급이 중요해졌다.** Ahrefs의 7.5만 브랜드 분석에서 AI 가시성과의 상관계수는 **브랜드 멘션 0.664 vs 백링크 0.218**. LLM은 링크 그래프가 아니라 텍스트를 학습하기 때문이다. → 자사 사이트만 고치는 것으로는 한계가 있고, **외부 언급(리뷰·커뮤니티·기사·디렉토리)** 이 함께 쌓여야 한다.
5. **`llms.txt`는 지금 시점에서 투자 우선순위가 낮다.** 구글이 2026년 공식적으로 "생성형 AI 기능 노출에 llms.txt·청킹·AI 전용 리라이팅은 필요 없다"고 정리했고, 5.15억 건의 LLM 봇 트래픽 분석에서 실제 크롤러가 `/llms.txt`를 건드리는 비율은 통계적으로 무시할 수준이었다. 만드는 데 30분이면 되니 해도 되지만, **여기에 전략을 걸면 안 된다.**
6. **우리 사이트의 현실적 진단: 지금은 인용될 재료 자체가 거의 없다.** 랜딩 1페이지 + 문의 폼 구조라 AI가 뽑아 쓸 수 있는 "질문–답변 단위"가 없고, `robots.ts`·`sitemap.ts`·JSON-LD·OG 메타가 전부 없다. **콘텐츠 이전에 기술 기반부터가 비어 있는 상태**다. (→ 8장)

---

## 1. 용어 정리 — SEO / AEO / GEO

| | SEO | AEO | GEO |
|---|---|---|---|
| 목표 | SERP 상위 노출 → 클릭 | 질문에 대한 **답변으로 추출**됨 | AI 생성 답변 안에서 **브랜드가 인용·추천**됨 |
| 성과 지표 | 순위, CTR, 세션 | 피처드 스니펫, AI 오버뷰 인용, 음성검색 응답 | 인용 점유율(Share of Voice), 브랜드 언급률, 감성 |
| 주요 수단 | 키워드, 백링크, 기술 SEO | Q&A 구조, FAQ, 정의문, 스키마 | 사실 밀도, 통계/인용문, 외부 언급, 엔티티 정합성 |
| 한 줄 | **발견되게** 한다 | **추출되게** 한다 | **추천되게** 한다 |

핵심 오해 정정 두 가지:

- **"GEO는 AI에 우리 브랜드를 학습시키는 것"** 이라는 국내 블로그 설명이 많은데, 절반만 맞다. 실제 인용의 대부분은 **학습된 지식이 아니라 실시간 검색(RAG)** 을 통해 일어난다. 즉 지금 당장 영향을 줄 수 있는 지점은 "모델 학습"이 아니라 **"질의 시점에 검색되어 뽑히는 것"** 이다.
- **AEO와 GEO를 굳이 분리해 예산을 짜지 말 것.** 실무에서는 하나의 작업 목록으로 관리하고, 지표만 두 갈래(추출됨 / 추천됨)로 본다.

---

## 2. 2026년 시장 데이터 (수치는 출처와 함께)

**규모·점유율**
- 글로벌 AI 챗 어시스턴트 점유율: ChatGPT ~60.7%, Gemini ~15%, Copilot ~13.2% (2026년 1월 기준)
- ChatGPT Search 주간 질의 2.5~5억 건 / Perplexity 주간 ~5천만 건
- AI 플랫폼이 가져간 **정보성 질의 비중 15~20%** (2026 Q1), 단 전체 질의량의 ~80%는 여전히 구글

**노출·클릭**
- 구글 AI 오버뷰 노출률: 정보성 질의의 25~30% (2024년 초 ~8%에서 상승). 일부 조사는 전체 검색의 48%까지 보고 — **조사마다 편차가 크므로 범위로 이해할 것**
- AI 오버뷰가 뜨면 CTR이 15% → 8%로 하락
- Perplexity의 인용 소스 CTR 18~22% (UI에서 출처를 크게 노출하기 때문에 구글 AI 오버뷰보다 높음)

**리퍼럴**
- AI 챗봇 리퍼럴 중 ChatGPT 79.8%, Perplexity 11.8%
- 그러나 **AI 검색 전체의 검색 리퍼럴 점유율은 0.29%**, 구글이 87.6%
- AI 경유 트래픽 전환율 14.2% vs 오가닉 2.8%

> **해석:** "AI가 검색을 대체했다"는 서사는 2026년 8월 현재 과장이다. 하지만 **고관여·비교검토형 질의**(예: "제품 촬영 스튜디오 추천", "룩북 촬영 견적 얼마")는 정확히 AI로 옮겨가는 유형이고, B2B 촬영 문의는 이 유형에 속한다. 볼륨이 아니라 **리드 품질** 관점에서 접근해야 한다.

> **데이터 신뢰도 주의:** 위 수치 중 상당수는 GEO 툴 벤더 블로그에서 나온다. 벤더는 시장을 크게 그릴 유인이 있다. 학술 근거가 있는 것은 GEO 논문(KDD 2024)과 Ahrefs 대규모 분석 정도이며, 나머지는 **방향성 참고용**으로만 쓸 것.

---

## 3. 엔진별 작동 방식 (여기가 실무의 핵심)

| 엔진 | 소스 확보 방식 | 특징 | 우리가 할 일 |
|---|---|---|---|
| **ChatGPT Search** | 주로 **Bing 인덱스** + 자체 크롤러(OAI-SearchBot) | 인용의 47.9%가 위키피디아. 인용된 페이지의 **72.4%가 "답변 캡슐"**(H2 아래 40~60단어 자립형 답변)을 포함. 스키마 마크업이 가장 강한 예측 변수 | **Bing 웹마스터 도구 등록**, H2+짧은 답변 구조, JSON-LD |
| **Perplexity** | **자체 인덱스(500억+ 페이지)** + 실시간 크롤링 | 질의당 ~10개 후보를 보고 3~4개만 인용. **신선도 가중치가 가장 높음** — 12개월 내 갱신 콘텐츠가 3.2배 더 인용됨. 최다 인용 소스의 46.7%가 **Reddit** | 정기 갱신(날짜 명시), 커뮤니티 언급 확보 |
| **Google AI Overviews / AI Mode** | 구글 인덱스 + E-E-A-T | 기존 SEO 상위권과 강한 상관. 구글은 "AI 전용 최적화 필요 없다"는 입장 | **정석 SEO가 곧 GEO** |
| **Claude** | 구조화된 정밀 검색 | 명확히 구조화된 문서 선호 | 문서 구조 명료화 |
| **네이버 AI 브리핑** | 네이버 검색 상위 문서 | **상위 10개 문서 의존율 평균 84.0%**, 문제해결형 키워드에서는 89.4% | 국내는 **네이버 상위 노출이 곧 AI 브리핑 노출**. 블로그·플레이스·지식스니펫 유지가 여전히 유효 |

**가장 중요한 발견:** ChatGPT와 Perplexity에 **동시에 인용되는 사이트는 11%뿐이다.** 한 엔진에서의 성과가 다른 엔진을 예측하지 못한다. → 채널별로 따로 측정해야 한다.

**크롤러 통제 (robots.txt)** — 2026년에는 두 종류를 구분해야 한다:
- **학습용**: `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`, `Applebot-Extended`, `Amazonbot`
- **검색/인용용**: `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Perplexity-User`

학습은 막고 검색 인용은 허용하는 선택이 가능하다. **우리 같은 B2B 스튜디오는 전부 허용이 맞다** — 노출이 자산이고 막을 독점 콘텐츠가 없다.

---

## 4. 근거 있는 최적화 기법

### 4-1. 프린스턴 GEO 논문 (KDD 2024, Aggarwal et al., arXiv:2311.09735)
9개 데이터셋 · 약 1만 개 질의 · GEO-Bench로 9가지 콘텐츠 변형을 A/B 테스트한 유일한 대규모 학술 근거.

| 기법 | 가시성 변화 |
|---|---|
| 통계·수치 추가 (Statistics Addition) | **+30~40%** |
| 인용문 추가 (Quotation Addition) | **+41%** (최고) |
| 출처 인용 (Cite Sources) | **+30%** |
| 유창성/가독성 개선 | +15~30% |
| 권위적 어조 | 소폭 상승 |
| **키워드 스터핑** | **-10% (역효과)** |

전체적으로 최적화된 콘텐츠는 **+22~41%**의 가시성 향상. 특히 도메인 파워가 약한 사이트일수록 효과가 컸다 — **작은 스튜디오에 유리한 구조**다.

> 비판점도 알아둘 것: 이 실험은 GPT-3.5 + 구글 top-5 파이프라인을 시뮬레이션한 것이라 2026년의 실제 엔진과는 차이가 있다. 방향은 유효하되 수치를 그대로 믿지는 말 것.

### 4-2. 구조 — "답변 캡슐(Answer Capsule)"
ChatGPT 인용 페이지의 72.4%가 가진 패턴:

```
## 제품 촬영 비용은 얼마인가요?

제품 촬영은 컷당 3~5만 원, 반일(4시간) 기준 60~90만 원 선입니다.
컷 수, 스타일링 유무, 모델 사용 여부에 따라 달라집니다.
(40~60단어, 앞뒤 문맥 없이 그 자체로 완결)
```

규칙: **H2를 질문형으로**, 바로 아래 **40~60단어 자립형 답변**, 그다음에 상세 설명. 대명사("이것", "위에서 말한")를 쓰면 추출 시 의미가 깨진다.

### 4-3. 구조화 데이터 (JSON-LD)
- FAQPage / HowTo / QAPage 스키마가 있는 페이지는 AI 요약 등장 빈도가 **20~30% 높음**
- Organization / Person 스키마는 신뢰성(E-E-A-T) 신호로 특히 중요
- Bing Copilot은 구조화 데이터를 명시적으로 해석에 사용

**단, 스키마는 단독으로 인용을 유발하지 않는다.** 콘텐츠가 이미 괜찮고 어느 정도 랭킹이 있을 때 증폭기로 작동한다. 구글도 "GEO를 위한 스키마 과용"은 불필요하다고 명시했다.

### 4-4. 신선도
Perplexity 기준 12개월 내 갱신 콘텐츠가 **3.2배** 더 인용됨. 일부 가이드는 7~14일 주기 갱신을 권하나 이는 미디어 기준이고, **B2B 스튜디오는 분기 1회 + 가격/서비스 변경 시 즉시**면 충분하다. 갱신 시 본문에 **"최종 업데이트: 2026-08"** 같은 명시적 날짜를 남길 것.

### 4-5. 오프사이트 — 여기가 진짜 승부처
- 브랜드 멘션 상관계수 **0.664** vs 백링크 **0.218** (Ahrefs, 7.5만 브랜드)
- Perplexity 최다 인용 소스의 46.7%가 Reddit → 국내 등가물은 **네이버 카페/블로그, 브런치, 디스콰이엇, 커뮤니티, 업계 디렉토리**
- 자사 사이트 = "우리가 뭐라 말하는가", 외부 언급 = "남들이 뭐라 말하는가". LLM은 후자를 더 신뢰한다.

---

## 5. 통하지 않는 것 (돈·시간 낭비 목록)

| 항목 | 실태 |
|---|---|
| `llms.txt` | 구글 공식 "불필요". 5.15억 건 봇 트래픽 중 `/llms.txt` 요청 비율 무시 가능 수준. 사이트 채택률은 ~10%인데 **엔진 지원은 사실상 없음** |
| 키워드 스터핑 | GEO 논문에서 **-10%** 역효과 확인 |
| 인위적 멘션 구매 | 구글이 "inauthentic mentions는 도움되지 않는다"고 명시. 스팸 시스템이 차단 |
| 콘텐츠 청킹 / AI 전용 리라이팅 | 구글 공식 "불필요" |
| 스키마 남용 | 콘텐츠와 불일치하는 마크업은 오히려 신뢰 손상 |
| 페이지에 숨긴 프롬프트 삽입 | 프롬프트 인젝션은 OWASP LLM Top 10 **1위 위협**. 시도 시 제재 대상이며 브랜드 리스크가 큼. **하지 말 것** |

---

## 6. 측정 방법

3계층으로 나눠 본다. 툴 없이 시작할 수 있는 1·2번부터 하면 된다.

**1) 서버/엣지 로그 — 무료, 가장 정직**
Vercel 로그에서 User-Agent 기준으로 `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended` 방문을 집계. "AI가 우리 사이트를 읽고 있는가"에 대한 직접 증거.

**2) 리퍼럴 추적 — 무료**
Analytics에서 referrer가 `chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`인 세션을 분리 집계. 볼륨은 작아도 **전환율이 높으므로 반드시 별도 세그먼트로 관리**.

**3) 프롬프트 세트 추적 — 수동 or 툴**
우리 고객이 실제로 물어볼 질문 20~30개를 고정 목록으로 만들어 월 1회 각 엔진에 직접 질의하고 기록:
- "서울 제품 촬영 스튜디오 추천"
- "화장품 상세페이지 촬영 비용"
- "룩북 촬영 스튜디오 어디"
- "F&B 메뉴 촬영 잘하는 곳"

기록 항목: 언급 여부 / 인용 URL / 경쟁사 목록 / 어조. 목표치는 업계 기준 **추적 프롬프트의 60~70%에서 등장**.

유료 툴(Profound, Peec AI, Frase, Ahrefs Brand Radar 등)은 이 3번을 자동화하는 것. **월 20~30개 프롬프트 규모면 수동으로 충분하다** — 툴은 나중에.

---

## 7. 현재 사이트 진단

`src/` 기준 실제 확인 결과.

### 잘 되어 있는 것
- 랜딩(`src/components/landing/HomeLanding.tsx`)이 `'use client'`이지만 Next.js가 SSR하므로 **HTML에 텍스트가 실려 나간다** — 크롤러가 읽을 수 있다. (SPA로 만들었다면 여기서 이미 끝났을 문제)
- `<html lang="ko">` 설정됨 (`src/app/layout.tsx:30`)
- 서비스 7종·프로세스·워크플로가 **의미 있는 한국어 산문**으로 작성돼 있음 — 재료가 아예 없진 않음
- 리전이 `icn1`(서울)이라 국내 크롤러 응답 속도 유리
- `middleware.ts`의 리다이렉트는 **로그인 사용자에만 적용**되므로 크롤러 접근을 막지 않음 ✅

### 비어 있는 것 (심각도 순)

| # | 항목 | 현재 | 영향 |
|---|---|---|---|
| 1 | **인용 가능한 콘텐츠 부재** | 랜딩 1P + `/inquiry` 뿐. FAQ·가격·사례·가이드 페이지 없음 | AI가 뽑아 쓸 "질문–답변 단위"가 0. **가장 큰 문제** |
| 2 | **JSON-LD 전무** | 없음 | Organization / ProfessionalService / Service / FAQPage 모두 미설정 → 엔티티 인식 실패 |
| 3 | **`robots.ts` / `sitemap.ts` 없음** | `src/app/`에 파일 없음 | 크롤러 안내 부재. AI 크롤러 명시적 허용도 못 함 |
| 4 | **`metadataBase` / OG 없음** | `layout.tsx:18-27`에 title·description만 | OG 이미지·canonical·`alternates` 부재 → 공유·중복 판정 취약 |
| 5 | **NAP 정보 없음** | 주소·전화번호·영업시간 없음(이메일만) | 로컬 질의("서울 ○○ 스튜디오")에서 후보군 자체에 못 들어감 |
| 6 | **가격 정보 비공개** | `quote-app/`은 내부 견적 도구 | "촬영 비용 얼마" 류 질의는 AI 검색에서 가장 흔한 유형인데 답할 재료가 없음 |
| 7 | **검색엔진 등록 미확인** | 검증 메타태그 없음 | Google Search Console / **Bing 웹마스터**(=ChatGPT 인덱스) / 네이버 서치어드바이저 |
| 8 | **포트폴리오 페이지 없음** | 클라이언트 갤러리는 토큰 보호(`/c/[token]`) — 이건 맞는 설계 | 공개용 사례 페이지가 별도로 필요 |

---

## 8. 실행 로드맵

### P0 — 기반 (반나절, 코드 작업)
1. `src/app/robots.ts` — 전 크롤러 허용, `/dashboard`·`/projects`·`/c/` 차단, sitemap 지정
2. `src/app/sitemap.ts` — 공개 라우트 등록
3. `layout.tsx`에 `metadataBase`, `openGraph`, `alternates.canonical`, `keywords` 보강 + OG 이미지 1장
4. **JSON-LD 삽입** — `ProfessionalService`(= 스튜디오 엔티티: 이름·주소·연락처·서비스 목록·영업시간) + `Service` × 7 (기존 `SERVICES` 배열 재사용 가능)
5. Google Search Console / Bing 웹마스터 / 네이버 서치어드바이저 등록 (**Bing = ChatGPT 인용 경로**라 국내 사업자가 가장 자주 빠뜨리는 항목)

### P1 — 인용될 재료 만들기 (2~3주, 콘텐츠 작업)
6. **`/faq` 페이지 + FAQPage 스키마** — 답변 캡슐 형식(H2 질문 → 40~60단어 답변)으로 15~20문항
   - 제품 촬영 비용은 얼마인가요 / 촬영은 며칠 걸리나요 / 컷당 단가와 반일·종일 기준 / 스타일링·모델은 별도인가요 / 보정 범위와 재보정 횟수 / 원본 파일 제공 여부 / 저작권과 사용 범위 / 촬영 전 준비물 / 지방 출장 가능 여부 / 온라인 셀렉은 어떻게 하나요
7. **`/pricing` 또는 `/guide/촬영-비용`** — 구간별 가격대 공개. 4-1의 근거대로 **구체적 숫자가 인용을 부른다**. 정확한 견적이 아니어도 "범위 + 변수" 형식이면 충분
8. **`/work/[slug]` 공개 사례 페이지 3~5개** — 브랜드/목적/컷 수/기간/결과를 **수치와 함께** 서술. `CreativeWork` 스키마
9. 각 페이지에 **"최종 업데이트: YYYY-MM"** 명시

### P2 — 오프사이트 (지속)
10. 네이버 플레이스 등록 + NAP를 사이트·플레이스·SNS 전부 **문자 단위로 일치**시키기 (엔티티 정합성)
11. 업계 디렉토리·매칭 플랫폼 등재, 클라이언트 후기 확보
12. 스레드/인스타 캡션에서 **"스튜디오 홀리몰리 + 서비스 카테고리"** 를 문장으로 반복 노출 (해시태그가 아니라 **산문 안의 언급**이 LLM에 학습된다)
13. 월 1회 프롬프트 세트 20개 수동 점검 → 스프레드시트 기록

### 하지 말 것
- `llms.txt`에 시간 쓰기 (P2 이후 여유 있으면 30분 투자, 그 이상은 낭비)
- 키워드 반복
- 멘션 구매
- 페이지에 AI용 숨김 텍스트/프롬프트 삽입

---

## 9. 우선순위 한 줄 결론

> **콘텐츠가 없는 상태에서의 GEO 기술 작업은 빈 그릇에 라벨 붙이기다.**
> P0(기반)은 반나절이니 먼저 끝내고, 실제 효과는 **P1의 FAQ·가격·사례 페이지**에서 나온다.
> 국내 B2B 촬영 문의 기준으로는 **네이버 상위 노출(AI 브리핑 의존율 84%)** 과 **Bing 등록(ChatGPT 인용 경로)** 이 투자 대비 효율이 가장 높다.

---

## 출처

**학술**
- [GEO: Generative Engine Optimization (arXiv:2311.09735)](https://arxiv.org/pdf/2311.09735) — Aggarwal et al., KDD 2024
- [GEO: Generative Engine Optimization — dblp](https://dblp.dagstuhl.de/rec/conf/kdd/AggarwalMRKND24.html)
- [The Princeton GEO Study: Methodology, Results and Critique](https://blckalpaca.at/en/knowledge-base/seo-geo/geo-generative-engine-optimization/the-princeton-geo-study-methodology-results-and-critique)

**개념·전략**
- [GEO, AEO, and SEO in 2026: The enterprise guide to AI visibility — WRITER](https://writer.com/blog/geo-aeo-optimization/)
- [What is Generative Engine Optimization? GEO vs AEO vs SEO Guide 2026 — Jasper](https://www.jasper.ai/blog/geo-aeo)
- [Answer Engine Optimization: The Complete AEO and GEO Guide for 2026 — Surmado](https://www.surmado.com/blog/answer-engine-optimization-aeo-geo-guide)
- [Generative Engine Optimization Best Practices 2026 — GenOptima](https://www.gen-optima.com/geo/generative-engine-optimization-best-practices-2026/)

**시장 데이터**
- [AI Search Engine Statistics 2026: Market Share Data — Digital Applied](https://www.digitalapplied.com/blog/ai-search-engine-statistics-2026-market-share)
- [Search Engine Market Share 2026: Google Still Sends 87.6% of Referrals](https://technologychecker.io/blog/search-engine-market-share)
- [AI Search in 2026: Every Stat You Need to Know — SERPs.io](https://serps.io/blog/ai-search-statistics-2026)
- [AI Search Engine Market Share 2026 — Presenc AI](https://presenc.ai/research/ai-search-engine-market-share-2026)

**엔진 작동 방식**
- [How ChatGPT, Google AI Overviews, and Perplexity Source Information in 2026 — Leapd](https://www.leapd.ai/blog/ai-visibility/how-chatgpt-google-ai-overviews-and-perplexity-source-information-in-2026)
- [AI Citation Patterns: How ChatGPT, Claude, and Perplexity Choose Sources — Discovered Labs](https://discoveredlabs.com/blog/ai-citation-patterns-how-chatgpt-claude-and-perplexity-choose-sources)
- [How Different AI Platforms Cite the Same Source Differently — ZipTie](https://ziptie.dev/blog/how-different-ai-platforms-cite-the-same-source-differently/)

**크롤러 / llms.txt**
- [Robots.txt & AI Crawlers in 2026: The Full Guide — DataImpulse](https://dataimpulse.com/blog/robots-txt-ai-crawlers/)
- [AI Crawler Access Control: The 2026 Decision Matrix — Digital Applied](https://www.digitalapplied.com/blog/ai-crawler-access-control-2026-robots-llms-txt-decision-matrix)
- [Debunking LLMs.txt Myths — Wix Studio AI Search Lab](https://www.wix.com/studio/ai-search-lab/llms-txt-myths)
- [Google officially debunks 5 GEO myths in 2026 — RevenueScope](https://www.revenuescope.jp/en/news/google-debunks-geo-myths-2026)

**구조화 데이터**
- [Structured Data for AI Citations: The 2026 Guide — LLMReach](https://www.llmreach.ai/blog/implement-structured-data-for-ai-2025-guide)
- [Schema and AI Search: What the Research Actually Says](https://www.lmpowelsonconsulting.com/post/schema-and-ai-search-what-the-research-actually-says)
- [How Schema Markup Affects LLM Citation — Derivatex](https://derivatex.agency/blog/schema-markup-llm-seo/)

**측정**
- [10 Best AI Visibility Tools in 2026 — Frase](https://www.frase.io/blog/the-10-best-ai-visibility-tools-in-2026)
- [AI Visibility Tools 2026: Track Your Brand Across LLMs — Digital Applied](https://www.digitalapplied.com/blog/ai-visibility-tools-2026-track-brand-chatgpt-perplexity-gemini)

**국내**
- [AI 기반 검색최적화(GEO/AEO) 국내 적용 현황 — 넥스트티](https://www.next-t.co.kr/blog/geo/ai-%EA%B8%B0%EB%B0%98-%EA%B2%80%EC%83%89%EC%B5%9C%EC%A0%81%ED%99%94geoaeo-%EA%B5%AD%EB%82%B4-%EC%A0%81%EC%9A%A9-%ED%98%84%ED%99%A9/)
- [2026년 6월 네이버 검색 시장 리포트 — SEO NEWS](https://seonews.co.kr/naver-search-report-june-2026/)
- [SEO GEO AEO 뜻, 차이 — 리드젠랩](https://blog.lead-gen.team/aeo-geo-leo-optimization)
- [AEO란? 답변 엔진 최적화 뜻과 GEO 차이 — 스튜디오 제이티](https://www.studio-jt.co.kr/seo-glossary/aeo/)

**보안**
- [Prompt injection: the OWASP #1 AI threat in 2026 — Securance](https://www.securance.com/blog/prompt-injection-the-owasp-1-ai-threat-in-2026/)
