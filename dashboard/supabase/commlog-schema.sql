-- ============================================================
-- 업체별 소통 기록 (commlogs) — 타임라인
-- 실행: Supabase 대시보드 → SQL Editor → 전체 붙여넣기 → Run
-- (schema.sql이 먼저 실행되어 있어야 합니다 — is_member/is_admin 함수 사용)
--
-- 🔒 adminOnly 표시된 기록(금액·견적 언급)은 서버(RLS)가
--    직원에게 아예 내려주지 않습니다 — deals/expenses와 같은 원칙.
-- ============================================================

create table if not exists public.commlogs (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table public.commlogs enable row level security;

-- 읽기: 활성 팀원 전체 — 단, adminOnly 기록은 관리자만
drop policy if exists "commlog_select" on public.commlogs;
create policy "commlog_select" on public.commlogs for select
  using (
    public.is_member()
    and (not coalesce((data->>'adminOnly')::boolean, false) or public.is_admin())
  );

-- 쓰기·수정·삭제: 같은 규칙 (직원은 adminOnly 기록을 만들거나 지울 수 없음)
drop policy if exists "commlog_insert" on public.commlogs;
create policy "commlog_insert" on public.commlogs for insert
  with check (
    public.is_member()
    and (not coalesce((data->>'adminOnly')::boolean, false) or public.is_admin())
  );

drop policy if exists "commlog_update" on public.commlogs;
create policy "commlog_update" on public.commlogs for update
  using (
    public.is_member()
    and (not coalesce((data->>'adminOnly')::boolean, false) or public.is_admin())
  )
  with check (
    public.is_member()
    and (not coalesce((data->>'adminOnly')::boolean, false) or public.is_admin())
  );

drop policy if exists "commlog_delete" on public.commlogs;
create policy "commlog_delete" on public.commlogs for delete
  using (
    public.is_member()
    and (not coalesce((data->>'adminOnly')::boolean, false) or public.is_admin())
  );

-- 실시간 동기화
alter publication supabase_realtime add table public.commlogs;
