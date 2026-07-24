-- ============================================================
-- 스튜디오 홀리몰리 운영 대시보드 — Supabase 스키마
-- 실행: Supabase 대시보드 → SQL Editor → 전체 붙여넣기 → Run
-- ============================================================

-- ---------- 1) 프로필 (팀원 계정 정보) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  title text default '',
  role text not null default 'staff' check (role in ('admin', 'staff')),
  active boolean not null default false,
  created_at timestamptz default now()
);

-- 가입 시 프로필 자동 생성
-- ⭐ 대표(수민) 이메일은 자동으로 관리자·활성화, 그 외는 "승인 대기" 직원
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when new.email = 'studio.holymolly@gmail.com' then 'admin' else 'staff' end,
    case when new.email = 'studio.holymolly@gmail.com' then true else false end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2) 권한 판별 함수 ----------
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and active)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and active)
$$;

-- ---------- 3) 데이터 테이블 ----------
-- 팀 공유 (활성 팀원 누구나)
create table if not exists public.projects  (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.tasks     (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.comments  (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.clients   (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.vendors   (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.contents  (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.activity  (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.app_config (id text primary key, data jsonb not null, updated_at timestamptz default now());

-- 🔒 금액 데이터 (관리자 전용 — 직원에게는 서버가 아예 안 내려줌)
create table if not exists public.deals    (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.expenses (id text primary key, data jsonb not null, created_at timestamptz default now());
create table if not exists public.quotes   (id text primary key, data jsonb not null, created_at timestamptz default now());

-- ---------- 4) RLS (행 단위 보안) ----------
alter table public.profiles   enable row level security;
alter table public.projects   enable row level security;
alter table public.tasks      enable row level security;
alter table public.comments   enable row level security;
alter table public.clients    enable row level security;
alter table public.vendors    enable row level security;
alter table public.contents   enable row level security;
alter table public.activity   enable row level security;
alter table public.app_config enable row level security;
alter table public.deals      enable row level security;
alter table public.expenses   enable row level security;
alter table public.quotes     enable row level security;

-- 프로필: 본인 행은 항상 조회 가능(승인 대기 확인용), 팀원이면 전체 조회. 수정은 관리자만
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_member());
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- 팀 공유 테이블: 활성 팀원 전부 읽기/쓰기
do $$
declare t text;
begin
  foreach t in array array['projects','tasks','comments','clients','vendors','contents','activity','app_config']
  loop
    execute format('drop policy if exists "member_all" on public.%I', t);
    execute format(
      'create policy "member_all" on public.%I for all using (public.is_member()) with check (public.is_member())', t);
  end loop;
end $$;

-- 🔒 금액 테이블: 관리자만 (직원 요청은 서버에서 빈 결과)
do $$
declare t text;
begin
  foreach t in array array['deals','expenses','quotes']
  loop
    execute format('drop policy if exists "admin_only" on public.%I', t);
    execute format(
      'create policy "admin_only" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ---------- 4.5) 파일 스토리지 (기획안 첨부 — PDF·PPTX 등) ----------
insert into storage.buckets (id, name, public) values ('files', 'files', true)
on conflict (id) do nothing;

drop policy if exists "files_member_insert" on storage.objects;
create policy "files_member_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and public.is_member());
drop policy if exists "files_member_delete" on storage.objects;
create policy "files_member_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and public.is_member());
drop policy if exists "files_public_read" on storage.objects;
create policy "files_public_read" on storage.objects for select
  using (bucket_id = 'files');

-- ---------- 5) 실시간 동기화 활성화 ----------
alter publication supabase_realtime add table
  public.profiles, public.projects, public.tasks, public.comments,
  public.clients, public.vendors, public.contents, public.activity,
  public.app_config, public.deals, public.expenses, public.quotes;
