-- ============================================================
-- 촬영 기획안 도우미 (/planner) — 선택 저장 테이블 (선택 사항)
-- 실행: Supabase 대시보드 → SQL Editor → 전체 붙여넣기 → Run
-- (기존 schema.sql 실행 후에 실행할 것 — is_member/is_admin 함수 필요)
--
-- ⚠️ 이 테이블은 없어도 기획안 도우미는 정상 동작합니다.
--    완성된 기획안을 익명으로 기록해 "어떤 브랜드가 어떤 기획안을
--    만들었는지" 리드 데이터를 남기고 싶을 때만 실행하세요.
-- ============================================================

create table if not exists public.planner_plans (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  created_at timestamptz default now()
);

alter table public.planner_plans enable row level security;

-- 익명은 넣기만 — 브랜드명 필수 + 과도한 크기 차단
drop policy if exists "planner_plans_anon_insert" on public.planner_plans;
create policy "planner_plans_anon_insert" on public.planner_plans for insert
  to anon, authenticated
  with check (
    data ? 'brand'
    and char_length(data->>'brand') between 1 and 80
    and pg_column_size(data) < 20000
  );

-- 조회는 팀원, 파기는 관리자
drop policy if exists "planner_plans_member_select" on public.planner_plans;
create policy "planner_plans_member_select" on public.planner_plans for select
  to authenticated using (public.is_member());

drop policy if exists "planner_plans_admin_delete" on public.planner_plans;
create policy "planner_plans_admin_delete" on public.planner_plans for delete
  to authenticated using (public.is_admin());
