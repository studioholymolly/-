-- ============================================================
-- Studio-app schema migrations — run these in your Supabase
-- SQL editor BEFORE deploying the matching app version.
-- Each migration is idempotent (uses IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- 2026-04-25 · Phase 2 · project memo per submission
-- Stores the free-form Project Memo a client writes alongside their selections.
alter table submissions add column if not exists memo text;
