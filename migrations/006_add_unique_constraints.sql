-- =============================================================================
-- Migration 006: UNIQUE constraints untuk upsert reliability
-- content_topics.topic harus unik supaya upsert (ON CONFLICT (topic)) dari
-- Grok/Sandi tidak menghasilkan topik dobel.
-- content_pipeline.code sudah UNIQUE sejak awal (content_pipeline_code_key);
-- tidak ada perubahan, cuma diverifikasi (query di bagian bawah).
-- Idempotent: aman di-rerun.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'content_topics_topic_unique'
      and conrelid = 'public.content_topics'::regclass
  ) then
    alter table public.content_topics
      add constraint content_topics_topic_unique unique (topic);
  end if;
end
$$;

-- Verifikasi (jalankan manual):
-- select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
-- from pg_constraint
-- where contype = 'u'
--   and conrelid in ('public.content_topics'::regclass, 'public.content_pipeline'::regclass);
