# 촬영 문의 폼 — 셋업 가이드

코드는 모두 준비되어 있습니다. 아래 순서대로 하면 문의 폼이 살아납니다.
(1~2단계만 해도 폼 접수 + 대시보드 확인까지 동작합니다. 3단계부터는 알림·파일 업로드용)

---

## 1. Supabase 스키마 실행 (필수 · 2분)

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 → **SQL Editor**
2. `supabase/inquiry-schema.sql` 파일 내용 전체를 붙여넣고 **Run**
3. 성공하면: `inquiries` / `inquiry_budgets` 테이블 + `inquiry-files` 버킷 생성 완료

**확인 방법**: SQL Editor에서
```sql
select count(*) from inquiries;  -- 0이 나오면 성공
```

## 1-1. 촬영 스케줄 달력 함수 (링크바이오 대체 후 필수 · 1분)

/inquiry의 **촬영 스케줄** 달력은 예약된 날짜만 익명에게 보여주는 DB 함수를 사용합니다.
`inquiry-schema.sql`를 다시 전체 실행하거나, 아래만 SQL Editor에 붙여넣고 **Run**:

```sql
create or replace function public.inquiry_busy_dates()
returns table (busy_date date)
language sql
stable
security definer
set search_path = public
as $$
  select distinct (data->>'shootDate')::date
  from public.projects
  where (data->>'archived') is distinct from 'true'
    and coalesce(data->>'shootDate', '') ~ '^\d{4}-\d{2}-\d{2}$'
    and (data->>'shootDate')::date >= (date_trunc('month', now()))::date
$$;

revoke all on function public.inquiry_busy_dates() from public;
grant execute on function public.inquiry_busy_dates() to anon, authenticated;
```

- 프로젝트명·고객명은 절대 내려가지 않고 **날짜만** 노출됩니다.
- 함수를 실행하기 전에는 달력에 "예약 현황을 불러오지 못했어요" 안내가 나옵니다 (페이지는 정상 동작).

## 2. 배포 (필수 · 1분)

```bash
npm run build   # 로컬 확인: npm run dev → http://localhost:5473/inquiry
```
Vercel에 push/배포하면 `https://<도메인>/inquiry` 로 폼이 열립니다.
- `vercel.json`에 `/inquiry` rewrite가 추가되어 있습니다. 배포 후 `/inquiry` 직접 접속을 꼭 확인하세요.

## 3. Slack 알림 (권장 · 5분)

1. Supabase 대시보드 → **Edge Functions** → 배포:
   ```bash
   npx supabase functions deploy notify-inquiry --no-verify-jwt
   ```
2. **Edge Functions → Secrets**에 추가:
   - `SLACK_WEBHOOK_URL` = 슬랙 Incoming Webhook 주소 (대시보드 커스텀 페이지에 넣은 것과 같은 값 사용 가능)
   - `RESEND_API_KEY` = (선택) [resend.com](https://resend.com) 무료 가입 후 API 키 → 이메일 알림 추가
   - `NOTIFY_EMAIL` = 알림 받을 이메일 (기본: studio.holymolly@gmail.com)
3. **Database → Webhooks → Create a new hook**:
   - Table: `inquiries` / Events: `INSERT`
   - Type: **Supabase Edge Function** → `notify-inquiry`

→ 이후 문의가 접수되면 Slack(+이메일)으로 즉시 알림이 옵니다.
대시보드 알림(사이드바 `촬영 문의` 뱃지)은 웹훅 없이도 실시간으로 동작합니다.

## 4. 파일 업로드 활성화 (선택 · 10분)

파일 업로드는 보안(비용 폭탄 방지)을 위해 Edge Function 경유로만 동작합니다.
링크 첨부는 이 단계 없이도 항상 동작합니다.

1. [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) 무료 가입 → 사이트 등록 → **Site Key / Secret Key** 발급
2. 함수 배포 + 시크릿:
   ```bash
   npx supabase functions deploy inquiry-upload-url --no-verify-jwt
   npx supabase secrets set TURNSTILE_SECRET_KEY=<시크릿 키>
   ```
3. Vercel → 프로젝트 → Settings → Environment Variables:
   - `VITE_TURNSTILE_SITE_KEY` = <사이트 키> → 재배포

→ 사이트 키가 없으면 폼에서 파일 업로드 보안 체크가 표시되지 않고,
서버(Edge Function)는 **시크릿 키가 없으면 업로드를 거부**합니다(fail-closed — 보안상 의도된 동작).
즉 4단계를 완료하기 전까지 파일 업로드는 닫혀 있고, 링크 첨부는 항상 동작합니다.

## 5. 카톡 채널 하단 메뉴 교체 (운영)

카카오 비즈니스 파트너센터 → 채널 → 하단 메뉴에서 기존 텍스트 템플릿 버튼을
**폼 링크 버튼**(`https://<도메인>/inquiry`)으로 교체하세요.
기존 9문항 텍스트는 "폼 작성이 어려우신 분용" 대안으로 남겨둬도 좋습니다.

## 6. 콘텐츠 수정 (수시 · 코드 수정 불필요)

폼의 모든 콘텐츠(랜딩 버튼·스튜디오 소개·진행 과정·견적·FAQ·폼 선택지·사진)는
**대시보드 → 촬영 문의 → 🎛 폼 콘텐츠 편집** (관리자 전용)에서 직접 추가·수정·삭제·순서 변경합니다.
- 저장하면 `/inquiry` 공개 페이지에 바로 반영됩니다 (Supabase `inquiry_site` 테이블).
- 사진은 URL 입력 또는 📎 업로드 버튼으로 첨부.
- 기본값은 카카오 채널·몰리봇의 실제 내용(견적 체계, 촬영 전/후 과정, 연락처 등)으로 채워져 있습니다.
- `src/inquirySite.js`는 저장된 값이 없을 때의 기본값입니다.

---

## 운영 메모

| 항목 | 내용 |
|---|---|
| 예산 보안 | 예산은 `inquiry_budgets` 별도 테이블 — 직원 계정에는 서버가 아예 안 내려줌 (매출 데이터와 동일 원칙) |
| Slack URL 두 곳 | 대시보드 내부 알림용(커스텀 페이지) / 문의 알림용(Supabase Secrets) — 같은 값을 넣으면 한 채널로 수렴 |
| 개인정보 | 폼에 고지: 처리 완료 후 1년 보관 후 파기. 문의 상세의 **파기** 버튼(관리자)으로 행+예산+첨부 일괄 삭제 |
| 스팸 | honeypot + 3초 타이머 + RLS 검증. 급증 시 Slack 경고(시간당 20건 초과). 문제 지속 시 Turnstile을 제출 전체로 확대 |
| 알림톡 | 나중에 문의량 늘면 "고객 접수확인 자동회신"용으로 도입 (비즈채널 인증 + 템플릿 심사 필요, 건당 ~13원) |
