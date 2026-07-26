<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 운영 메모 (사용자 지침)

- **노션(Notion)은 더 이상 사용하지 않는다.** 지출·매출·일정 등 어떤 데이터도 노션에 등록하지 말 것.
- 지출 등록 요청("지출등록" + 영수증/거래내역 캡처)은 **스튜디오 대시보드**(`dashboard/`, 매출·정산 → 지출·손익 탭)가 대상이다. 데이터는 Supabase `expenses` 테이블(`{id, data: {name, cat(고정비|변동비), amount, month(YYYY-MM), createdBy}}`)에 저장되며, RLS로 관리자 계정만 쓸 수 있다.
