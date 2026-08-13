# AEO · GEO · GPTO 심화 조사 + 스튜디오 홀리몰리 실행안

> 작성일: 2026-08-05 · 1차 리포트(`aeo-geo-research.md`)의 후속
> 이 문서는 **"그래서 우리 스튜디오는 뭘 하면 되는가"** 에 답하는 실행 문서입니다.

---

## 0. 먼저, 결론부터

이번 심화 조사에서 **1차 리포트의 권고를 뒤집는 발견이 두 개** 나왔습니다.

**발견 ①  "스튜디오 추천" 키워드는 AI 검색으로 못 잡습니다.**
네이버 AI 브리핑은 **추천·비교 같은 상업형 키워드에서 노출이 제한**되고, 원인·이유형 정보 키워드에서만 안정적으로 뜹니다. ChatGPT 쪽도 마찬가지로 **로컬 업체 추천 질의에서 실제 추천된 업체는 1.2%**에 불과합니다(구글 로컬 3-pack은 35.9%). 즉 **"서울 제품 촬영 스튜디오 추천"을 노리는 건 승산이 낮습니다.**

**발견 ②  대신 우리가 이미 가진 "숫자"가 최고의 무기입니다.**
GEO 논문이 검증한 최고 효과 기법이 **구체적 통계·수치 추가(+30~40%)** 인데, 우리 견적표에는 업계 누구도 공개하지 않는 숫자가 이미 있습니다.

> 1컷 평균 30분 · 7~8컷이면 하프데이 · 12~15컷이면 원데이 · 납기는 셀렉일+7일

**"제품 촬영 하루에 몇 컷 찍나요?"** 같은 정보형 질문에 이 숫자로 답하는 페이지는, 현재 한국어 웹에 사실상 없습니다. 경쟁이 비어 있는 자리입니다.

**→ 전략 전환: "우리를 추천해달라"가 아니라 "촬영에 대한 질문에 우리가 답한다."**
추천은 못 얻어도, 답변의 출처로 인용되면 브랜드가 노출됩니다. 그게 GEO의 원래 정의이기도 합니다.

---

## 1. GPTO — 먼저 정직하게 짚고 갑니다

**GPTO(GPT Optimization / Generative Pre-trained Transformer Optimization)는 업계 표준 용어가 아닙니다.**

조사해 보니 이 용어를 밀고 있는 곳은 사실상 한 마케팅 에이전시(Conversionia) 계열이고, 학술 문헌·구글 공식 문서·주요 업계 매체 어디에도 확립된 개념으로 등장하지 않습니다. 내용을 뜯어보면 **GEO에서 ChatGPT만 떼어낸 것**이고, "authority engineering", "AI trust modeling" 같은 표현은 실체 있는 기법이라기보다 **서비스 판매용 포장**에 가깝습니다.

| 용어 | 지위 | 실체 |
|---|---|---|
| SEO | 확립 | 검색 순위 최적화 |
| AEO | 준확립 | 답변으로 추출되기 |
| GEO | **학술 근거 있음** (KDD 2024 논문) | AI 답변에 인용되기 |
| **GPTO** | **벤더 조어** | GEO의 ChatGPT 특화 리브랜딩 |
| AIO / LEO / SEO 2.0 | 벤더 조어 | 같은 것의 다른 이름들 |

**실무 판단:** GPTO라는 이름으로 별도 예산이나 별도 작업을 잡을 필요 없습니다. 다만 **"ChatGPT는 Bing 인덱스를 쓴다"** 는 사실 하나는 GPTO 논의에서 건질 만한 실용 포인트이고, 이건 이미 P0에 반영돼 있습니다(Bing 웹마스터 등록).

> 앞으로 "GPTO 대행 해드립니다" 류 제안이 오면 — 이건 GEO입니다. 새로운 게 아닙니다.

---

## 2. 심화 조사에서 새로 확인된 사실

### 2-1. 로컬 추천 질의의 냉정한 현실
- ChatGPT가 실제로 추천한 로컬 업체 비율 **1.2%** vs 구글 로컬 3-pack 노출 **35.9%**
- AI 로컬 추천의 1차 데이터 소스는 **Google Business Profile**
- 업계 통용 기준선: **리뷰 30개 이상 · 평점 4.3 이상** (경쟁 심한 카테고리는 100개+)
- 백링크보다 **일관된 NAP + 리뷰 + 커뮤니티 언급**이 더 강하게 작동

### 2-2. 네이버 AI 브리핑의 노출 규칙 (국내에서 가장 중요)
- 상위 10개 문서 인용 의존율 **84.0%** (문제해결형 89.4%)
- **원인·이유형 정보 키워드 → 안정적 노출**
- **추천·비교 등 상업형 키워드 → 노출 제한**

이게 왜 결정적이냐면, 우리가 처음에 노리려던 키워드가 정확히 후자였기 때문입니다. **콘텐츠 주제를 "추천받기"에서 "설명하기"로 옮겨야 합니다.**

### 2-3. 엔티티 — AI가 우리를 "존재하는 회사"로 아는가
- 감사 대상 기업의 **61%가 AI 지식그래프에 엔티티 자체가 없음** (Wikidata 없음 + Organization 스키마 없음)
- LLM 인용 데이터 기준 우선순위 소스: **Wikidata > LinkedIn > Crunchbase > 커뮤니티/리뷰**
- **상호명 표기 하나만 달라도 다른 회사로 인식**됩니다

우리 케이스를 점검해 보면 표기가 최소 4가지입니다:

```
스튜디오 홀리몰리 / 홀리몰리 / STUDIO HOLYMOLLY / studio_holymolly
```

지금 상태로는 AI가 이걸 **서로 다른 4개 엔티티**로 볼 수 있습니다. 표준 표기 하나를 정하고 전 채널에 문자 단위로 통일하는 게 **비용 0원, 효과 큰** 작업입니다.

> 권장 표준형: **`스튜디오 홀리몰리 (STUDIO HOLYMOLLY)`** — 한글 정식명을 주(主)로, 영문을 괄호 병기. 웹사이트·JSON-LD·네이버 플레이스·인스타·스레드·메일 서명·세금계산서까지 동일하게.

---

## 3. 스튜디오 홀리몰리 실행안

### 3-1. 우리가 쥔 카드 (경쟁사가 공개하지 않는 것)

견적표를 GEO 관점에서 다시 보면, 이건 가격표가 아니라 **인용 가능한 팩트 자산**입니다.

| 우리가 아는 숫자 | 이게 답이 되는 질문 |
|---|---|
| 1컷 평균 30분 | "제품 촬영 한 컷에 얼마나 걸리나요?" |
| 7~8컷 = 하프데이(4h), 12~15컷 = 원데이(8h) | "제품 20종인데 며칠 잡아야 하나요?" |
| 원데이는 중식 1시간 제외 실촬영 8시간 | "8시간이면 점심시간 포함인가요?" |
| 원본은 기본 톤 보정 JPG, **촬영 다음 날** 전달 | "사진 언제 받나요?" |
| 정밀 보정 납기 = **셀렉일 + 7일** | "보정본까지 얼마나 걸리나요?" |
| 누끼컷 / 연출컷 정의와 단가 차이 | "누끼컷이 뭔가요? 연출컷이랑 뭐가 다른가요?" |
| 최소 진행 단위 4시간 | "2시간만 찍을 순 없나요?" |
| 출장비 서울 10만 / 경기 20만 | "지방 촬영도 가능한가요?" |
| 소품·재료비 실비 별도 (영수증 첨부) | "견적에 소품비 포함인가요?" |
| 모델 사용 시 사용 범위·기간 확인 필요 | "모델 초상권은 어떻게 되나요?" |

**이 표가 곧 콘텐츠 기획안입니다.** 새로 만들 게 아니라, 이미 매일 메일로 답하고 있는 내용을 공개 페이지로 옮기는 작업입니다.

### 3-2. 페이지 설계

#### ① `/faq` — 최우선. 여기서 대부분의 인용이 나옵니다
형식은 **답변 캡슐**(ChatGPT 인용 페이지의 72.4%가 가진 구조)로 고정:

```markdown
## 제품 촬영은 하루에 몇 컷 정도 찍나요?

1컷당 평균 30분이 기준입니다. 하프데이(4시간)는 7~8컷,
원데이(8시간)는 12~15컷이 적정선입니다. 컷 구성이 복잡하거나
소품 세팅이 많으면 컷당 소요 시간이 늘어납니다.

[이어서 상세 설명 — 메인컷/루틴컷/종합컷 구성 차이 등]
```

규칙 3가지:
- H2는 **질문 그대로**
- 바로 아래 **40~60단어, 그것만 떼어내도 말이 되는 답변**
- 대명사("이건", "위에서 말한") 금지 — 추출되면 문맥이 끊깁니다

15~20문항, `FAQPage` JSON-LD 필수.

#### ② `/guide/촬영-비용` — 가격 공개 수위는 사장님 판단 필요
GEO 관점에서는 **숫자가 있어야 인용**됩니다. 다만 B2B에서 전면 공개는 협상력 손실이 있어 **세 가지 선택지**를 정리했습니다.

| 안 | 공개 수준 | GEO 효과 | 리스크 |
|---|---|---|---|
| A. 전면 공개 | 견적표 그대로 | 최상 | 경쟁사 참고, 예산 조율 여지 축소 |
| **B. 구간 + 변수 (권장)** | "하프데이 150만~220만 원선, 구성에 따라 변동" + **컷수 산정 기준은 그대로 공개** | 상 | 낮음 |
| C. 비공개 유지 | 문의 유도만 | 없음 | AI 답변에서 완전 배제 |

**B안을 권합니다.** 핵심은 *가격*이 아니라 **"1컷 30분 / 7~8컷 하프데이"라는 산정 로직**이 인용된다는 점입니다. 로직이 인용되면 금액 없이도 우리가 출처가 됩니다. 그리고 이 로직은 경쟁사가 베껴도 손해가 없습니다 — 오히려 우리가 원출처로 남습니다.

#### ③ `/work/[slug]` — 공개 사례 3~5개
클라이언트 갤러리(`/c/[token]`)는 지금처럼 **토큰 보호 유지**가 맞습니다. 별도로 공개용 사례 페이지를 만들되, 사진만 걸지 말고 **숫자를 넣어야** 인용됩니다.

> "코스메틱 브랜드 A · 제품 12종 · 원데이 촬영 · 메인 15컷 + 상세 30컷 · 셀렉 후 7일 납품"

`CreativeWork` 스키마 적용.

#### ④ `/about` — 엔티티 페이지
AI가 "이 회사가 뭐 하는 곳인지" 판단하는 근거 페이지. 정식 상호·설립·대표·소재지·서비스 범위·연락처를 **산문으로** 서술 + `ProfessionalService` JSON-LD.

### 3-3. 사이트 밖 작업 (효과는 여기가 더 큽니다)

브랜드 멘션 상관 **0.664** vs 백링크 **0.218** 이었던 걸 기억하면, 우선순위는 이렇습니다.

| 순위 | 작업 | 이유 | 난이도 |
|---|---|---|---|
| 1 | **네이버 플레이스 등록·완성** | 국내 로컬 질의의 1차 소스. 지역명+카테고리 키워드, 동 이름, 부가정보(주차·촬영 가능 품목)까지 채울 것 | 낮음 |
| 2 | **상호 표기 통일** | 4가지 표기 → 1가지. 웹·플레이스·인스타·스레드·메일 서명 전부 | 매우 낮음 |
| 3 | **Google Business Profile** | AI 로컬 추천의 1차 데이터 소스 | 낮음 |
| 4 | **실사용 리뷰 축적** | 기준선 30개 / 4.3점. 촬영 종료 시 갤러리 전달 메일에 리뷰 링크 첨부하는 게 가장 자연스러움 | 중간 |
| 5 | **Wikidata 항목 생성** | 소규모 브랜드가 지식그래프에 들어가는 가장 현실적인 입구 | 중간 |
| 6 | **스레드·인스타 캡션에 산문형 언급** | LLM은 해시태그가 아니라 **문장**을 학습. "스튜디오 홀리몰리는 뷰티·제품 촬영을 하는…" 형태를 주기적으로 | 낮음 |

> ⑥은 이미 운영 중인 `thread-post`·`reels-caption` 워크플로에 한 줄만 얹으면 되는 작업입니다. 캡션에 **"스튜디오 홀리몰리 + 무엇을 하는 곳"** 을 문장으로 넣는 습관.

### 3-4. 하지 말 것
- `llms.txt` 만들기 (구글 공식 "불필요", 크롤러가 안 읽음)
- "GPTO 대행" 외주 계약
- 리뷰·언급 구매 (구글이 명시적으로 무효 처리)
- "서울 제품촬영 스튜디오 추천" 키워드에 콘텐츠 몰아넣기 (AI 브리핑 노출 제한 구간)
- 페이지에 AI용 숨김 텍스트 (OWASP LLM 위협 1위, 제재 대상)

---

## 4. 타임라인

| 시기 | 작업 | 주체 |
|---|---|---|
| **1주차** | robots.ts · sitemap.ts · metadataBase/OG · JSON-LD(ProfessionalService + Service×7) | 개발 |
| **1주차** | 상호 표기 통일, Google/Bing/네이버 서치어드바이저 등록 | 사장님 30분 |
| **2~3주차** | `/faq` 15~20문항 작성 + FAQPage 스키마 | 콘텐츠 + 개발 |
| **3~4주차** | `/guide/촬영-비용`(B안), `/about` | 콘텐츠 |
| **4~6주차** | `/work` 공개 사례 3~5개 | 콘텐츠 |
| **상시** | 네이버 플레이스, 리뷰 요청 루틴, 캡션 언급 습관 | 운영 |
| **월 1회** | 프롬프트 20개 수동 점검 | 15분 |

### 월간 점검용 프롬프트 세트 (정보형 위주로 재구성)
1. 제품 촬영 한 컷에 시간이 얼마나 걸리나요
2. 제품 20종 촬영하려면 며칠 필요한가요
3. 누끼컷과 연출컷의 차이가 뭔가요
4. 상세페이지 촬영 견적은 어떻게 산정되나요
5. 촬영 후 보정본은 언제 받나요
6. 화장품 촬영에 스타일리스트가 꼭 필요한가요
7. 촬영 원본 파일은 받을 수 있나요
8. 촬영한 사진의 저작권과 사용 범위는 어떻게 되나요
9. 모델 촬영 시 초상권 사용 기간은 보통 어떻게 정하나요
10. 룩북 촬영은 보통 며칠 걸리나요

각 프롬프트를 ChatGPT / Perplexity / 네이버에 넣고 **① 우리 언급 여부 ② 인용된 URL ③ 경쟁사 목록**을 기록. 스프레드시트 한 장이면 충분합니다.

---

## 5. 한 문단 요약

> GPTO는 GEO의 다른 이름일 뿐이니 무시해도 됩니다. 로컬 추천 질의는 AI에서 승산이 낮으니(ChatGPT 로컬 추천율 1.2%, 네이버 AI 브리핑은 상업형 키워드 노출 제한) **"우리를 추천해달라"는 포기하고 "촬영에 대한 질문에 우리가 답하는" 쪽으로 전환**합니다. 우리 견적표의 산정 로직(1컷 30분 · 7~8컷 하프데이 · 셀렉+7일)은 한국어 웹에 공개된 적 없는 구체적 숫자이고, GEO 논문이 검증한 최고 효과 기법(통계 추가 +30~40%)에 정확히 부합합니다. **매일 메일로 답하던 내용을 `/faq` 페이지로 옮기는 것** — 이게 이번 작업의 90%입니다.

---

## 출처 (심화 조사분)

**GPTO**
- [What Is GPTO? The New Frontier of AI Search Optimization — Conversionia](https://conversionia.com/blog/what-is-gpto-the-new-frontier-of-ai-search-optimization)
- [Why GPTO Will Define Transportation Marketing in 2026 — Conversionia](https://conversionia.com/blog/why-gpto-will-define-transportation-marketing-in-2026-and-beyond)
- [SEO, GEO, AEO, and AIO: The Four Layers of Search Visibility in 2026 — Wild Coffee](https://wildcoffeemarketing.com/seo-geo-aeo-and-aio-the-four-layers-of-search-visibility-in-2026/)
- [FAQ on GEO and AEO: Where AI search and SEO overlap in 2026 — eMarketer](https://www.emarketer.com/content/faq-on-geo-aeo--where-ai-search-seo-overlap-2026)

**로컬 / 리뷰**
- [Local Business AI Search: The 2026 Playbook — EvolveAMZ](https://evolveamz.com/local-business-ai-search-guide/)
- [45% of Customers Are Using ChatGPT to Find Local Services Now — PushLeads](https://pushleads.com/45-of-customers-are-using-chatgpt-to-find-local-services-now-google-business-pro/)
- [AI Search Visibility for Local Service Businesses — PushLeads](https://pushleads.com/ai-search-visibility-for-local-service-businesses-why-your-google-page-one-ranki/)
- [How AI Search Recommends Local Businesses — Spartan SEM](https://spartansem.com/how-ai-search-recommends-local-businesses/)

**엔티티 / 지식그래프**
- [Cross-Platform Entity Consistency: The LLM-Era NAP — MLforSEO](https://www.mlforseo.com/machine-learning-implementation-guides/ai-search-optimisation/cross-platform-entity-consistency-the-llm-era/)
- [Build a Brand Entity AI Models Recognize (2026) — Ryze](https://www.get-ryze.ai/blog/building-an-entity-for-your-brand-that-ai-models-recognize)
- [Entity Recognition & Knowledge Graphs — Discovered Labs](https://discoveredlabs.com/blog/entity-recognition-knowledge-graphs-how-to-structure-your-brand-for-ai-understanding)

**국내 / 네이버**
- [네이버 'AI 브리핑', 어떤 상황에서 노출되나? 검색어 구조가 핵심 — SEO NEWS](https://seonews.co.kr/naver-ai-briefing-exposure-rules/)
- [네이버 AI 브리핑 노출 방법은? C-rank·AEO 최적화 가이드 — 리드젠랩](https://blog.lead-gen.team/naver-ai-briefing-seo-optimal-strategy)
- [2026년 네이버 플레이스 검색노출 정리 — 아이보스](https://www.i-boss.co.kr/ab-2987-514300)
- [네이버 플레이스 운영 완벽 가이드 2026 — OSC](https://oscsnm.com/naver-place-operation-guide-2026-4/)
