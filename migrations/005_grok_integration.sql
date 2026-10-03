-- =============================================================================
-- Migration 005: Grok integration tables
-- Menambah topic bank (content_topics), audit trail Grok (grok_activity_log),
-- dan kolom Grok di content_pipeline. Hermes tidak terpengaruh:
-- producer_system default 'hermes' dan semua kolom baru nullable/ber-default.
-- Idempotent: aman di-rerun.
-- Dashboard read-only: RLS aktif, cuma policy SELECT. Penulisan oleh Grok
-- lewat service_role / Management API (bypass RLS), bukan lewat anon key.
-- =============================================================================

-- =============================================================================
-- TABLE: content_topics (topic bank dari Sandi/Grok)
-- =============================================================================
create table if not exists public.content_topics (
  id                  uuid primary key default gen_random_uuid(),
  topic               text not null,
  description         text,
  category            text,
  sources             jsonb default '[]'::jsonb,        -- daftar sumber riset
  researched_by       text default 'sandi',
  researched_at       timestamptz default now(),
  status              text not null default 'fresh' check (status in ('fresh', 'picked', 'used', 'archived')),
  picked_at           timestamptz,
  used_in_content_id  uuid references public.content_pipeline (id) on delete set null,
  relevance_score     numeric,                          -- skala ditentukan Grok/Sandi
  tags                text[],
  metadata            jsonb default '{}'::jsonb
);

create index if not exists idx_content_topics_status        on public.content_topics (status);
create index if not exists idx_content_topics_category      on public.content_topics (category);
create index if not exists idx_content_topics_researched_at on public.content_topics (researched_at desc);

-- =============================================================================
-- TABLE: grok_activity_log (audit trail aktivitas Grok bot)
-- =============================================================================
create table if not exists public.grok_activity_log (
  id                    uuid primary key default gen_random_uuid(),
  actor                 text not null check (actor in ('sandi', 'warta', 'rupa', 'user', 'chief_of_staff')),
  action                text not null,                  -- contoh: 'research_topics', 'draft_post'
  subject               text,                           -- ringkasan objek aktivitas
  channel               text,
  status                text not null default 'completed'
                          check (status in ('completed', 'in_progress', 'pending_approval', 'failed', 'skipped')),
  content_pipeline_id   uuid references public.content_pipeline (id) on delete set null,
  payload               jsonb default '{}'::jsonb,
  requires_user_action  boolean not null default false,
  user_action_url       text,                           -- deeplink ke Grok chat
  user_response         text,
  user_responded_at     timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists idx_grok_activity_created_at on public.grok_activity_log (created_at desc);
create index if not exists idx_grok_activity_actor      on public.grok_activity_log (actor);
create index if not exists idx_grok_activity_status     on public.grok_activity_log (status);
create index if not exists idx_grok_activity_content    on public.grok_activity_log (content_pipeline_id);
create index if not exists idx_grok_activity_needs_user on public.grok_activity_log (created_at desc)
  where requires_user_action;

-- =============================================================================
-- ALTER content_pipeline: kolom Grok
-- =============================================================================
alter table public.content_pipeline
  add column if not exists producer_system      text default 'hermes',
  add column if not exists source_topic_id      uuid references public.content_topics (id) on delete set null,
  add column if not exists buffer_post_id       text,
  add column if not exists buffer_scheduled_at  timestamptz,
  add column if not exists engagement_metrics   jsonb,
  add column if not exists pending_question     text,
  add column if not exists user_answer          text,
  add column if not exists user_answered_at     timestamptz;

create index if not exists idx_cp_producer_system on public.content_pipeline (producer_system);
create index if not exists idx_cp_source_topic    on public.content_pipeline (source_topic_id);

-- Workflow Grok butuh dua status baru. Constraint lama cuma mengizinkan
-- new/approved/rejected/hold/in_progress/done, jadi dilebarkan (nilai lama
-- tetap valid, Hermes tidak terpengaruh).
alter table public.content_pipeline drop constraint if exists content_pipeline_status_check;
alter table public.content_pipeline
  add constraint content_pipeline_status_check
  check (status in ('new', 'approved', 'rejected', 'hold', 'in_progress', 'done',
                    'waiting_user_answer', 'pending_approval'));

-- =============================================================================
-- ROW LEVEL SECURITY: read-only untuk anon, tanpa policy tulis
-- =============================================================================
alter table public.content_topics    enable row level security;
alter table public.grok_activity_log enable row level security;

drop policy if exists "Allow public read access to content_topics" on public.content_topics;
create policy "Allow public read access to content_topics"
  on public.content_topics
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public read access to grok_activity_log" on public.grok_activity_log;
create policy "Allow public read access to grok_activity_log"
  on public.grok_activity_log
  for select
  to anon, authenticated
  using (true);
