# Architecture Decision Records — Gugi OS

## ADR-001: Observatory-first mission control stage
**Date**: 2026-10-01
**Context**: Mission control bisa Observatory (watch only), Cockpit (watch + control), atau Command Center (watch + control + plan).
**Decision**: Observatory first, roadmap Cockpit → Command Center.
**Rationale**: Validate schema integrity sebelum build mutation layer. Lower risk architecture.

## ADR-002: Schema Observatory-ready, Cockpit-prepared
**Date**: 2026-10-01
**Context**: Pure Observatory schema butuh refactor saat upgrade Cockpit (migration pain).
**Decision**: Design schema sekarang dengan extensibility hooks (parent_task_id, metadata jsonb, clipboard_context).
**Rationale**: +10% effort now, -50% effort during Cockpit upgrade.

## ADR-003: Hermes master, dashboard display
**Date**: 2026-10-01
**Context**: Dashboard bisa master (push config ke Hermes) atau display (read Hermes state).
**Decision**: Observatory stage = Hermes master, dashboard pure display.
**Rationale**: Simplicity, lower bug surface, consistent dengan Observatory choice.

## ADR-004: Hybrid documentation (GitHub + Notion)
**Date**: 2026-10-01
**Context**: Pure GitHub butuh manual commit (friction). Pure Notion kehilangan version control.
**Decision**: GitHub untuk ADR + Backlog (rare update, close to code). Notion untuk Module Registry + Session Log + Data Flow (frequent update, live-maintained by Claude).

## ADR-005: Supabase Management API (High-risk access)
**Date**: 2026-10-01
**Context**: Hermes butuh autonomous DDL execution. Supabase punya Personal Access Token tapi all-or-nothing (42 capabilities), bukan fine-grained.
**Decision**: Accept high-risk Management token untuk personal use. Rotate 90 hari.
**Rationale**: Personal project, trust Hermes, migration frequency rendah tapi autonomy valuable. Alternative (connection string) butuh effort setup lebih di Hermes side.

## ADR-006: Schema Opsi B simplify (post Hermes interview)
**Date**: 2026-10-02
**Context**: Hermes interview reveal cuma 14% schema target bisa populate. 4 field critical kosong: completed_at, duration_seconds, input_summary, output_summary.
**Decision**: Simplify schema sesuai realita (Opsi B). Keep Cockpit-prepared hooks sebagai null fields. Upgrade ke Opsi C saat Sprint 3 orchestration governance jalan.
**Rationale**: Observatory goal = validate dengan realita, bukan aspiration. Dashboard yang jalan dengan data limited > tunggu 2 minggu untuk schema ideal.

## ADR-007: Inter-agent protocol parked (tmux spawn, ACP)
**Date**: 2026-10-02
**Context**: Hobbyist AI tech FOMO — ingin adopt tmux spawn pattern dan ACP protocol untuk inter-agent communication.
**Decision**: Park ke Sprint 4+ evaluation stage. Current file bridge + cron chain acceptable.
**Rationale**: Fleet mostly ornamental (1 active dari 14). Advanced protocol solve problem yang belum lo punya. Build observability dulu (Sprint 2-3), biarin data tunjukin bottleneck, baru pilih protocol.

## ADR-008: Sync cron_jobs dari file statis, penghapusan cron tidak ter-propagate
**Date**: 2026-10-02
**Status**: Proposed (belum diputuskan Gugi)
**Context**: Gugi menghapus ACD-001 dan ACD-002 lewat Hermes. Cron hilang dari scheduler Hermes tapi row-nya tetap ada di Supabase setelah sync. Hermes mengonfirmasi sync cron_jobs berupa UPSERT dari cron-data.json (file hardcoded), bukan baca daftar cron live. Sync tidak pernah menghapus, sync_log juga tidak punya hitungan deleted. Akibat sampingan: next_run_at basi, last_reviewed_at kosong, counter sync selalu 0, dan indikator Sync Health hijau hanya berarti skrip sync jalan, bukan data cocok dengan Hermes.
**Options**:
1. Soft delete: sync menandai status='deleted' untuk cron yang tidak ada di Hermes. Riwayat aman, bisa di-recover. Butuh logika compare daftar Hermes vs Supabase.
2. Sync live: baca daftar cron langsung dari Hermes (cronjob list), bukan JSON. Selalu akurat, tapi butuh auth untuk cron agent.
3. Hard delete otomatis: bersih tapi riwayat hilang, agent_executions jadi orphan, dan berisiko menghapus massal kalau list gagal atau kosong.
**Proposed decision**: Sync live dulu (sumber data benar), lalu soft delete sebagai mekanisme penghapusan. Hindari hard delete otomatis. Dashboard menyembunyikan status 'deleted'. Penghapusan manual one-off (ACD-001/002) boleh DELETE setelah SELECT dulu dan approve.
**Rationale**: Soft delete saja tidak cukup kalau sumbernya file statis, karena sync tidak tahu cron mana yang dihapus. Menunggu keputusan Gugi sebelum ubah schema.
