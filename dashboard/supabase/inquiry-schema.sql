-- ============================================================
-- 촬영 문의 폼 — Supabase 스키마 확장
-- 실행: Supabase 대시보드 → SQL Editor → 전체 붙여넣기 → Run
-- (기존 schema.sql 실행 후에 실행할 것 — is_member/is_admin 함수 필요)
-- ============================================================

-- ---------- 1) 문의 테이블 ----------
-- data에는 예산이 들어가지 않는다 (예산은 inquiry_budgets — 관리자 전용)
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  status text not null default 'new' check (status in ('new', 'replied', 'converted', 'archived')),
  created_at timestamptz default now()
);

-- 🔒 예산 — deals와 같은 원칙: 직원에게는 서버가 아예 안 내려줌
create table if not exists public.inquiry_budgets (
  id uuid primary key references public.inquiries(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now()
);

-- ---------- 2) RLS (동작별 분리 — 익명은 넣기만, 읽기는 팀원/관리자) ----------
alter table public.inquiries enable row level security;
alter table public.inquiry_budgets enable row level security;

-- 익명 제출: 필수 키 존재 + 허니팟 비어 있음 검증
drop policy if exists "inquiries_anon_insert" on public.inquiries;
create policy "inquiries_anon_insert" on public.inquiries for insert
  to anon, authenticated
  with check (
    data ? 'brand' and data ? 'manager' and data ? 'contact'
    and ((data->>'hp') is null or (data->>'hp') = '')
    and status = 'new'
  );

drop policy if exists "inquiries_member_select" on public.inquiries;
create policy "inquiries_member_select" on public.inquiries for select
  to authenticated using (public.is_member());

drop policy if exists "inquiries_member_update" on public.inquiries;
create policy "inquiries_member_update" on public.inquiries for update
  to authenticated using (public.is_member()) with check (public.is_member());

-- 파기는 관리자만 (개인정보 라이프사이클)
drop policy if exists "inquiries_admin_delete" on public.inquiries;
create policy "inquiries_admin_delete" on public.inquiries for delete
  to authenticated using (public.is_admin());

-- 예산: 익명은 넣을 수만 있고, 조회·삭제는 관리자만 (직원은 0행)
-- 예산 값은 짧은 텍스트만 허용 (임의 대용량/쓰레기 값 차단 — 선택지는 폼이 제한)
drop policy if exists "inquiry_budgets_anon_insert" on public.inquiry_budgets;
create policy "inquiry_budgets_anon_insert" on public.inquiry_budgets for insert
  to anon, authenticated
  with check (
    data ? 'budget'
    and char_length(data->>'budget') between 1 and 40
  );

drop policy if exists "inquiry_budgets_admin_select" on public.inquiry_budgets;
create policy "inquiry_budgets_admin_select" on public.inquiry_budgets for select
  to authenticated using (public.is_admin());

drop policy if exists "inquiry_budgets_admin_delete" on public.inquiry_budgets;
create policy "inquiry_budgets_admin_delete" on public.inquiry_budgets for delete
  to authenticated using (public.is_admin());

-- ---------- 3) 첨부파일 버킷 (비공개 · 서버 중재 업로드 전용) ----------
-- anon insert 정책 없음: 업로드는 Edge Function(inquiry-upload-url)이 발급한
-- signed upload URL로만 가능 → 경로 추측·덮어쓰기·비용 폭탄 차단
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inquiry-files', 'inquiry-files', false,
  20971520, -- 20MB
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png', 'image/jpeg', 'image/webp'
  ]
)
on conflict (id) do nothing;

-- 조회(서명 URL 생성)는 팀원만, 삭제(파기)는 관리자만
drop policy if exists "inquiry_files_member_select" on storage.objects;
create policy "inquiry_files_member_select" on storage.objects for select
  to authenticated using (bucket_id = 'inquiry-files' and public.is_member());

drop policy if exists "inquiry_files_admin_delete" on storage.objects;
create policy "inquiry_files_admin_delete" on storage.objects for delete
  to authenticated using (bucket_id = 'inquiry-files' and public.is_admin());

-- ---------- 4) 폼 콘텐츠 (랜딩·진행과정·견적·FAQ — 대시보드에서 편집) ----------
-- 공개 페이지가 익명으로 읽어야 하므로 별도 테이블 (app_config는 민감 설정 포함이라 분리)
create table if not exists public.inquiry_site (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.inquiry_site enable row level security;

drop policy if exists "inquiry_site_public_read" on public.inquiry_site;
create policy "inquiry_site_public_read" on public.inquiry_site for select
  to anon, authenticated using (true);

drop policy if exists "inquiry_site_admin_write" on public.inquiry_site;
create policy "inquiry_site_admin_write" on public.inquiry_site for insert
  to authenticated with check (public.is_admin());
drop policy if exists "inquiry_site_admin_update" on public.inquiry_site;
create policy "inquiry_site_admin_update" on public.inquiry_site for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- 5) 실시간 (대시보드 뱃지용 — inquiry_budgets는 불필요) ----------
alter publication supabase_realtime add table public.inquiries;

-- ---------- 6) 공개 촬영 스케줄 (/inquiry 촬영 스케줄 달력) ----------
-- 익명 방문자에게 "예약된 날짜"만 노출한다 — 프로젝트명·고객명·내용은 절대 내려가지 않음.
-- security definer로 projects RLS를 우회하되 반환값을 날짜 하나로 제한.
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
    and (data->>'shootDate')::date >= (date_trunc('month', now()) )::date
$$;

revoke all on function public.inquiry_busy_dates() from public;
grant execute on function public.inquiry_busy_dates() to anon, authenticated;
