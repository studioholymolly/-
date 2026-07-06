-- ============================================================
-- Studio-app schema migrations — run these in your Supabase
-- SQL editor BEFORE deploying the matching app version.
-- Each migration is idempotent (uses IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- 2026-04-25 · Phase 2 · project memo per submission
-- Stores the free-form Project Memo a client writes alongside their selections.
alter table submissions add column if not exists memo text;


-- 2026-04-25 · Phase 3 · per-photo favorites (찜하기 ❤️) for two-stage selection
create table if not exists photo_favorites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, photo_id)
);

create index if not exists photo_favorites_project_idx on photo_favorites(project_id);

alter table photo_favorites enable row level security;

drop policy if exists "photo_favorites_public_read" on photo_favorites;
create policy "photo_favorites_public_read" on photo_favorites for select using (true);

drop policy if exists "photo_favorites_public_insert" on photo_favorites;
create policy "photo_favorites_public_insert" on photo_favorites for insert with check (true);

drop policy if exists "photo_favorites_public_delete" on photo_favorites;
create policy "photo_favorites_public_delete" on photo_favorites for delete using (true);


-- 2026-04-25 · Phase 4 · optional 4-digit access code per project
-- When set, the client share page shows a code gate before content.
alter table projects add column if not exists access_code text;


-- 2026-07-06 · BX/UX revamp · public inquiries (촬영 문의) from the new /inquiry page
-- Anyone can submit an inquiry; only the logged-in studio can read them.
create table if not exists inquiries (
  id             uuid primary key default gen_random_uuid(),
  shoot_type     text not null,
  name           text not null,
  contact        text not null,
  preferred_date date,
  budget         text,
  reference_url  text,
  message        text not null,
  status         text not null default 'new',
  created_at     timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on inquiries(created_at desc);

alter table inquiries enable row level security;

drop policy if exists "inquiries_public_insert" on inquiries;
create policy "inquiries_public_insert" on inquiries for insert with check (true);

drop policy if exists "inquiries_studio_read" on inquiries;
create policy "inquiries_studio_read" on inquiries for select using (auth.role() = 'authenticated');

-- 참고 자료 링크 (PDF/PPT는 드라이브·노션 링크로 공유; 기존 DB용)
alter table inquiries add column if not exists reference_url text;
