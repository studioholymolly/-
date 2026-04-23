-- =========================================================
-- 스튜디오 홀리몰리 - Supabase 스키마
-- Supabase 대시보드 → SQL Editor에서 전체 실행하세요
-- =========================================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================
-- TABLE: projects
-- =========================================================
create table if not exists projects (
  id                 uuid primary key default uuid_generate_v4(),
  studio_id          uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  client_name        text not null,
  client_email       text not null default '',
  deadline           date,
  custom_message     text,
  status             text not null default 'draft',
  share_token        text not null unique default encode(gen_random_bytes(24), 'hex'),
  drive_link         text,
  drive_link_originals text,
  revision_used      boolean not null default false,
  unread_for_studio  boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists projects_studio_id_idx on projects(studio_id);
create index if not exists projects_share_token_idx on projects(share_token);

-- =========================================================
-- TABLE: photos (original photos)
-- =========================================================
create table if not exists photos (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  sort_order   integer not null default 0,
  width        integer,
  height       integer,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

create index if not exists photos_project_id_idx on photos(project_id, sort_order);

-- =========================================================
-- TABLE: retouched_photos
-- =========================================================
create table if not exists retouched_photos (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists retouched_photos_project_id_idx on retouched_photos(project_id);

-- =========================================================
-- TABLE: selections
-- =========================================================
create table if not exists selections (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  photo_id     uuid not null references photos(id) on delete cascade,
  status       text not null default 'selected',
  comment      text,
  submitted_at timestamptz,
  unique(project_id, photo_id)
);

-- Migration (기존 DB에 선택 코멘트 컬럼 추가)
alter table selections add column if not exists comment text;

create index if not exists selections_project_id_idx on selections(project_id);

-- =========================================================
-- TABLE: annotations (pin comments on photos)
-- =========================================================
create table if not exists annotations (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  photo_id     uuid not null references photos(id) on delete cascade,
  pin_number   integer not null,
  x_pct        numeric(6,3) not null,
  y_pct        numeric(6,3) not null,
  comment      text,
  created_at   timestamptz not null default now()
);

create index if not exists annotations_project_photo_idx on annotations(project_id, photo_id);

-- =========================================================
-- TABLE: revision_requests (max 1 per project)
-- =========================================================
create table if not exists revision_requests (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade unique,
  message      text not null,
  created_at   timestamptz not null default now()
);

-- =========================================================
-- TABLE: notifications
-- =========================================================
create table if not exists notifications (
  id           uuid primary key default uuid_generate_v4(),
  studio_id    uuid not null references auth.users(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  type         text not null,
  message      text not null,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_studio_id_idx on notifications(studio_id, is_read, created_at desc);

-- =========================================================
-- AUTO-UPDATE updated_at
-- =========================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table projects          enable row level security;
alter table photos            enable row level security;
alter table retouched_photos  enable row level security;
alter table selections        enable row level security;
alter table annotations       enable row level security;
alter table revision_requests enable row level security;
alter table notifications     enable row level security;

-- projects: studio sees only their own; public can read by token (filtered in code)
create policy "projects_studio_all" on projects
  for all using (auth.uid() = studio_id);
create policy "projects_public_read" on projects
  for select using (true);

-- photos
create policy "photos_studio_all" on photos
  for all using (
    exists (select 1 from projects where projects.id = photos.project_id and projects.studio_id = auth.uid())
  );
create policy "photos_public_read" on photos for select using (true);

-- retouched_photos
create policy "retouched_studio_all" on retouched_photos
  for all using (
    exists (select 1 from projects where projects.id = retouched_photos.project_id and projects.studio_id = auth.uid())
  );
create policy "retouched_public_read" on retouched_photos for select using (true);

-- selections: studio full; anon can insert/update (client submits)
create policy "selections_studio_all" on selections
  for all using (
    exists (select 1 from projects where projects.id = selections.project_id and projects.studio_id = auth.uid())
  );
create policy "selections_public_insert" on selections for insert with check (true);
create policy "selections_public_update" on selections for update using (true);

-- annotations
create policy "annotations_studio_all" on annotations
  for all using (
    exists (select 1 from projects where projects.id = annotations.project_id and projects.studio_id = auth.uid())
  );
create policy "annotations_public_insert" on annotations for insert with check (true);
create policy "annotations_public_read" on annotations for select using (true);

-- revision_requests
create policy "revision_studio_all" on revision_requests
  for all using (
    exists (select 1 from projects where projects.id = revision_requests.project_id and projects.studio_id = auth.uid())
  );
create policy "revision_public_insert" on revision_requests for insert with check (true);

-- notifications
create policy "notifications_studio_all" on notifications
  for all using (auth.uid() = studio_id);

-- =========================================================
-- STORAGE BUCKETS (Storage → Buckets에서 직접 생성하세요)
-- =========================================================
-- 1. "originals" 버킷 생성 (private)
-- 2. "retouched" 버킷 생성 (private)
--
-- Storage Policies (각 버킷에 추가):
-- originals: authenticated 사용자만 업로드/다운로드
-- retouched: authenticated 사용자 업로드, 서명된 URL로 다운로드
