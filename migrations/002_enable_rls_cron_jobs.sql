-- =============================================================================
-- Migration 002: Enable RLS on cron_jobs
-- Mencerminkan state production: RLS aktif, read-only untuk publik.
-- Menggantikan "disable row level security" di migration 001.
-- Idempotent: aman di-rerun.
-- =============================================================================

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.cron_jobs enable row level security;

-- =============================================================================
-- POLICIES
-- SELECT untuk anon + authenticated. Tanpa policy INSERT/UPDATE/DELETE,
-- semua operasi tulis via anon key ditolak (service_role tetap bypass RLS).
-- =============================================================================
drop policy if exists "Allow public read access to cron_jobs" on public.cron_jobs;
create policy "Allow public read access to cron_jobs"
  on public.cron_jobs
  for select
  to anon, authenticated
  using (true);
