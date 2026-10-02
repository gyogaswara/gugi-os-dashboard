# Gugi OS Dashboard — Backlog

Single source of truth buat roadmap, ideas, dan changelog. 
Editable via GitHub web dari HP.

## 🎯 Next (Sedang Dikerjakan atau Siap Dieksekusi)

### Sprint 2 — DONE (lihat Done, Oct 2)

### Sprint 3 — Orchestration Governance
- [ ] Hermes design unified task_id system
- [ ] Hermes design chat execution tracking
- [ ] Hermes design structured output rule (populate input/output_summary, completed_at, duration)
- [ ] Chat trigger integration ke agent_executions
- [ ] Approval workflow bidirectional (dashboard klik → Hermes react)
  - [ ] Bikin tabel `approvals` di Supabase (schema TBD)
  - [ ] Hermes push approval baru ke Supabase
  - [ ] Build halaman /approvals dengan Realtime (WebSocket)
  - [ ] Approve/Reject buttons yang update Supabase
  - [ ] Push notif ke Telegram tiap ada approval baru

### Infrastructure Fixes (Gugi side)
- [ ] Hermes: refresh cron_jobs.next_run_at tiap cron jalan (12 active cron punya next_run_at lewat, Brief jadi cuma nampilin yang masih future)
- [ ] Hermes: isi cron_jobs.last_reviewed_at saat governance review (sekarang kosong di 26 cron, jadi semua kena "Review governance")
- [ ] Investigasi LVN-004 Signal Hunter (last run failed 13 hari lalu)
- [ ] Fix Telegram thread 11681 (INBOX cron)
- [ ] Fix Telegram thread 11345 (CNT-PUB cron)
- [ ] Hermes: delivery gagal harus dicatat status `error`, bukan `ok` 
  (INBOX execution status `ok` padahal error_message "thread_id 11681 not found")
- [ ] Define SOUL agent-finance
- [ ] Define SOUL agent-levi
- [ ] Configure model agent-writer
- [ ] Configure model agent-producer

### Security Reminders
- Rotate Supabase Management token tiap 90 hari — next: ~24 Dec 2026 (85 days from Oct 2)

## 💡 Ideas (Belum di-Prioritize)

### Feature Ideas
- Pindahkan template prompt ke tabel prompt_templates kalau sudah stabil (editable dari HP)
- Sidebar desktop bisa dilipat jadi mode ikon
- Mobile responsive polish untuk /cron page (mostly OK tapi bisa lebih baik)
- Filter/search di /cron (by category, by status, by agent)
- Group cron jobs by category dengan collapsible sections
- Cron detail view — klik row buat liat full governance context 
  (background, process_steps, dll)
- Edit governance context langsung dari dashboard (butuh Auth dulu)
- Skill inventory page (list semua skills_used dari semua cron)
- Cost tracker per agent per model
- Delegasi suggestions: "cron X mirip cron Y, mungkin bisa di-merge"
- /agents: workload view (dari scope awal Sprint 2, belum dibikin)
- /tasks: timeline view + grouping by agent (dari scope awal Sprint 2, belum dibikin)

### Governance Reviews (dari feedback Hermes waktu populate cron)
- Review LVN-006: tim masih pake Lark Command Center gak?
- Review LVN-003: script upstream levner-crm-summary.py masih jalan gak?
- Review BND series: 7 cron bunda mau di-merge jadi 1 dengan logic 
  hari-based?

### Infrastructure
- Add Supabase Auth (magic link) — biar dashboard bukan public
- Setup GitHub Codespaces buat mobile coding (kalo suatu hari perlu)
- Add error monitoring (Sentry free tier?)
- Add analytics — Vercel Analytics vs Plausible

### Polish
- Naming consistency policy Supabase: "Allow public read" vs 
  "Allow public read access to cron_jobs" — standardize

### Long-term Vision (Sprint 4+)
- Research: Inter-agent communication upgrade (tmux spawn pattern, ACP, event bus). 
  Prerequisite: Sprint 3 done, min 3 agents active. Trigger: dashboard data nunjukin bottleneck.
- Multi-agent activation (writer, producer, scoper, liaison, postman, finance, levi)
- Auto-post LinkedIn (Maton API) + IG (Composio)
- Delete 5 skeleton agents di Hermes side (optional cleanup)
- Today's Brief page (merge Calendar + TickTick + cron status)
- Integrasi ke agent lain (bukan cuma Hermes)
- Dashboard multi-user (untuk team Levner)
- API buat external system query cron status Gugi

## ✅ Done

### Oct 2, 2026 — Sync health indicator + /sync-log
- Tabel sync_log (setup Hermes): heartbeat sync Hermes → Supabase. Cron harian 06:00 WIB (cron_jobs + agents), manual on-demand (4 tabel)
- Komponen SyncHealthIndicator di header Brief: hijau (<24 jam + success), kuning (24-72 jam atau partial), merah (>72 jam atau failed), abu-abu (belum ada row / query gagal). Klik buka /sync-log
- Halaman /sync-log: summary, filter type + status, tabel (mobile card), expand detail (error lengkap + metadata), "Show more" per 25 row
- Logika level di src/lib/sync-health.ts (murni, dites dengan 8 skenario)
- Catatan: sync_log masih kosong saat deploy, jadi indikator tampil abu-abu "Sync not configured" sampai sync pertama jalan

### Oct 2, 2026 — /cron polish + Today's Brief
- /cron: dipindah ke pattern /agents + /tasks (summary cards, filter category + status, search, mobile card view, expand row buat governance detail lengkap)
- Tombol aksi di /cron: "Investigasi gagal" (last run failed), "Review governance" (belum pernah direview atau lewat interval weekly/monthly/quarterly; on-demand tidak dihitung)
- Home / jadi Today's Brief (versi internal): Needs attention (cron gagal + eksekusi dengan error + data basi) lengkap dengan tombol aksi, summary 4 area, upcoming crons, recent executions, content pipeline, agents
- Nav: label Home → Brief

### Oct 2, 2026 — Navigation + Action Buttons
- Navigasi global: sidebar kiri di desktop, bottom tab bar di mobile (Home, Cron, Agents, Tasks, Content). Approvals tampil "soon" di sidebar saja
- Tombol aksi "copy prompt ke Hermes" (dashboard tetap read-only, Gugi paste manual ke Telegram): content idea → draft, content draft → review, published (LinkedIn/Threads) → tarik performa, task dengan error_message → diagnosa, agent idle → cek kesiapan
- Template prompt hardcoded di src/lib/prompts.ts, campur Indonesia + Inggris, aksi tulis pakai pola 2-step (show dulu, eksekusi setelah approve)

### Oct 2, 2026 — Sprint 2: Content Pipeline UI
- Halaman /content — Kanban (6 stage, Archived dilipat) + Kalender (bulan, fallback scheduled_at → published_at, bucket Undated)
- Preset C (card dengan stripe warna kiri per stage), filter channel + status + search, expand card inline
- Landing page: link Content Pipeline aktif
- Catatan: scheduled_at masih kosong di semua row, jadi Kalender saat ini pakai published_at

### Oct 1–2, 2026 — Sprint 2: Agents + Execution Log
Backend (Hermes side, Oct 1):
- Tabel content_pipeline live (23 kolom, 16 rows initial data)
- Supabase Management API setup (Hermes autonomous DDL/migration)
- Tabel agents (14 agents: 1 active, 8 idle, 5 deprecated)
- Tabel agent_executions (28 executions: 25 ok, 3 unknown)

Dashboard (Oct 2):
- Halaman /agents — summary cards, status filter, search, mobile card view
- Halaman /tasks (Execution Log) — summary cards, type + status filter, search, 
  expandable row detail, mobile card view
- Landing page navigation update (Cron Jobs, Agents, Tasks)

### Sept 30, 2026 — Sprint 1: Cron Monitor LIVE
- Supabase project provisioned (region Seoul)
- Table cron_jobs dengan 27-field governance schema
- 26 real cron dari Hermes populated
- RLS enabled + SELECT policy untuk anon
- Next.js 15 project init dengan TypeScript + Tailwind
- Halaman /cron nampilin 26 cron dengan status badges + last run
- Halaman landing / dengan navigation
- Light mode locked, browser tab title updated
- Git repo pushed to github.com/gyogaswara/gugi-os-dashboard
- Deployed to Vercel: https://gugi-os-dashboard.vercel.app
- Full CI/CD pipeline: git push → auto-deploy

## 📝 How to Use This File

- **Idea baru**? Tulis di "Ideas" section. Gak perlu detail, cukup 
  one-liner.
- **Siap dikerjain**? Pindahin dari "Ideas" ke "Next" dengan sub-tasks.
- **Selesai**? Pindahin dari "Next" ke "Done" dengan tanggal dan short 
  description.
- **Edit dari HP**: buka github.com/gyogaswara/gugi-os-dashboard/blob/main/docs/BACKLOG.md
  → klik pensil → edit → commit.
