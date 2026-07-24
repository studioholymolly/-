/* ============================================================
   Supabase 연결
   - anon key는 원래 프론트에 공개되는 값 (보안은 RLS가 담당)
   - 매출·정산·지출·견적서는 서버(RLS)에서 관리자만 통과 — 원천 차단
============================================================ */
import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://nzutcgwrknvgogsuphpr.supabase.co'
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dXRjZ3dya252Z29nc3VwaHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTc1NzYsImV4cCI6MjA5ODc3MzU3Nn0.9RbZicwBbGDebKV3EHao0BD3gEiH84q5ibICL2OdwvA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
