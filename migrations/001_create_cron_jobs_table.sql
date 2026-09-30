-- =============================================================================
-- Migration 001: Create cron_jobs table
-- Data source utama dashboard monitoring cron job Hermes Agent
-- =============================================================================

create table if not exists public.cron_jobs (
  -- ---------------------------------------------------------------------------
  -- CORE IDENTITY
  -- ---------------------------------------------------------------------------
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,               -- contoh: 'LVN-004'
  name              text not null,
  description       text,
  category          text check (category in ('levner', 'academy', 'esg', 'personal', 'bunda', 'completed')),
  owner             text default 'gugi',

  -- ---------------------------------------------------------------------------
  -- GOVERNANCE CONTEXT
  -- ---------------------------------------------------------------------------
  background        text,                               -- kenapa cron ini ada
  input_detail      text,                               -- dari mana input, format apa
  process_steps     text,                               -- step-by-step yang dilakukan
  output_detail     text,                               -- format output, disimpan di mana
  skills_used       text[],                             -- array nama skill
  skill_tags        text[],                             -- array tag
  notes             text,

  -- ---------------------------------------------------------------------------
  -- EXECUTION CONFIG
  -- ---------------------------------------------------------------------------
  schedule_cron     text,                               -- contoh: '30 23 * * *'
  schedule_human    text,                               -- contoh: 'Daily 23:30 WIB'
  agent_name        text,
  model             text,                               -- contoh: 'deepseek-v4-flash'
  hermes_job_id     text,

  -- ---------------------------------------------------------------------------
  -- RUNTIME STATE
  -- ---------------------------------------------------------------------------
  status            text default 'active' check (status in ('active', 'paused', 'error', 'completed')),
  last_run_at       timestamptz,
  last_run_status   text check (last_run_status in ('success', 'failed', 'skipped')),
  last_run_error    text,
  next_run_at       timestamptz,

  -- ---------------------------------------------------------------------------
  -- GOVERNANCE STATE
  -- ---------------------------------------------------------------------------
  review_frequency  text default 'quarterly' check (review_frequency in ('weekly', 'monthly', 'quarterly', 'on-demand')),
  last_reviewed_at  timestamptz,

  -- ---------------------------------------------------------------------------
  -- AUDIT TRAIL
  -- ---------------------------------------------------------------------------
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- =============================================================================
-- TRIGGER: auto-update updated_at setiap row di-update
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cron_jobs_updated_at on public.cron_jobs;
create trigger trg_cron_jobs_updated_at
  before update on public.cron_jobs
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- INDEXES
-- Catatan: constraint UNIQUE pada kolom code sudah otomatis membuat
-- unique index (cron_jobs_code_key), jadi tidak perlu dibuat terpisah.
-- =============================================================================
create index if not exists idx_cron_jobs_category    on public.cron_jobs (category);
create index if not exists idx_cron_jobs_status      on public.cron_jobs (status);
create index if not exists idx_cron_jobs_next_run_at on public.cron_jobs (next_run_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- V1: RLS dinonaktifkan (single-user, belum perlu policy)
-- =============================================================================
alter table public.cron_jobs disable row level security;
