<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 운영 메모 (사용자 지침)

- **노션(Notion)은 더 이상 사용하지 않는다.** 지출·매출·일정 등 어떤 데이터도 노션에 등록하지 말 것.
- 지출 등록 요청("지출등록" + 영수증/거래내역 캡처)은 **스튜디오 대시보드**(`dashboard/`, 매출·정산 → 지출·손익 탭)가 대상이다. 데이터는 Supabase `expenses` 테이블(`{id, data: {name, cat(고정비|변동비), amount, month(YYYY-MM), createdBy}}`)에 저장되며, RLS로 관리자 계정만 쓸 수 있다.

## 지출등록 자동화 (Claude 실행 절차)

캡처에서 사용처·금액·거래일을 읽고 아래 API를 호출한다. 일회성 결제는 `cat: 변동비`.

- 엔드포인트: `POST https://holymolly-ops.vercel.app/api/expense-add`
  - 헤더 `x-expense-token: $EXPENSE_API_TOKEN` (Claude 환경변수 — 값을 코드·커밋·PR에 절대 남기지 말 것)
  - 바디(JSON): `{ name, amount, cat: "고정비"|"변동비", month?: "YYYY-MM", memo? }` (month 생략 시 KST 기준 이번 달)
- 실행 환경 프록시가 외부 요청을 차단해 POST가 안 되면: Vercel MCP의 `web_fetch_vercel_url`(GET)로 폴백 —
  `https://holymolly-ops.vercel.app/api/expense-add?token=<토큰>&name=<항목>&amount=<금액>&cat=변동비&month=YYYY-MM`
- `EXPENSE_API_TOKEN` 환경변수가 없으면 임의로 우회하지 말고 사용자에게 요청할 것.
- 응답 `503`은 Vercel 환경변수 미설정 상태라는 뜻이다.
