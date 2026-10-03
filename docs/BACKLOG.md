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
- [ ] Hermes: sync cron_jobs baca daftar cron dari Hermes langsung, bukan cron-data.json (file statis hardcoded, tidak ikut ter-update). Kendala dari Hermes: tool cronjob list butuh auth dari cron agent. Lihat ADR-008
- [ ] Soft delete cron: status 'deleted' di cron_jobs, sync menandai cron yang tidak ada lagi di Hermes (bukan hard delete otomatis), dashboard menyembunyikan status 'deleted'. Menunggu keputusan Gugi (perubahan schema)
- [ ] Audit timezone: scheduler Hermes jalan di UTC tapi schedule_human ditulis seolah WIB (contoh: "0 1 * * 1,3,5" tertulis 01:00 WIB, aslinya 08:00 WIB; ESG-001 tertulis 00:00 WIB, last_run 00:01 UTC). Cek ke-24 cron, perbaiki label, putuskan tampilan di dashboard (konversi dari schedule_cron ke WIB?)
- [ ] Verifikasi counter sync_log: 3 sync manual 2 Okt semuanya inserted/updated/skipped = 0 (kemungkinan filenya tidak berubah, atau penghitung belum akurat)
- [ ] Aksi dashboard "Hapus cron" (prompt 2-step: hapus di scheduler Hermes + Supabase sekaligus). Tunggu mekanisme sync/soft delete diputuskan
- [ ] Hapus ACD-001 + ACD-002 dari cron-data.json supaya tidak ke-upsert ulang oleh sync berikutnya (row Supabase sudah terhapus 2 Okt)
- [ ] Hermes: agent_executions untuk delivery gagal harus status 'error' (prompt: docs/prompts/hermes-patch-status-error.md)
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

### Grok integration — keputusan terbuka
- Mekanisme tulis Grok ke Supabase (anon key read-only; Grok butuh service_role atau Edge Function). Belum didefinisikan
- grok_activity_log (payload, user_response, user_action_url) sekarang terbaca publik lewat anon key karena dashboard tanpa login. Pertimbangkan Auth/repo private sebelum data sensitif masuk, atau jangan taruh data sensitif di kolom itu
- Status "Needs your action" dianggap selesai kalau user_responded_at terisi. Konfirmasi ke Gugi apakah itu aturan yang benar

### Feature Ideas
- Pindahkan template prompt ke tabel prompt_templates kalau sudah stabil (editable dari HP)
- Sidebar mode ikon (collapse sebagian) sebagai alternatif hide penuh
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

### Oct 3, 2026 — Tombol prompt "copy to Grok"
- Konten Grok dapat tombol prompt per kondisi: Jawab pertanyaan (Waiting Answer), Revisi draft + Approve (Pending Approval), Kembangkan jadi draft / Ganti angle (Idea), Review draft (Drafting), Jadwalkan di Buffer (Ready), Ubah jadwal (Scheduled), Tarik engagement (Published). Topik: Riset lebih dalam, Jadikan konten
- Semua card (Hermes dan Grok) punya Copy reference: blok konteks tanpa instruksi buat ditempel di chat mana pun
- Sapaan "Bro" (satu chat, tanpa nama bot), pengenal = code di Supabase (teks topik buat topik), Grok yang menulis balik ke Supabase. Aksi tulis tetap 2-step
- Checkbox + aksi batch sekarang buat semua konten; pilihan campur Hermes + Grok diberi awalan label
- Prompt di src/lib/grok-prompts.ts

### Oct 3, 2026 — Integrasi Grok (content workflow)
- Migration 005 (applied ke production via Supabase): tabel content_topics + grok_activity_log, 8 kolom Grok di content_pipeline (producer_system default hermes, buffer_*, engagement_metrics, pending_question, user_answer, dll), RLS + SELECT anon saja. CHECK status content_pipeline dilebarkan dengan waiting_user_answer + pending_approval (nilai lama tetap valid)
- /content-stream: feed aktivitas Grok (Needs your action + timeline per hari, filter actor/status/range, expand payload)
- /content: 8 kolom (Topics, Ideas, Waiting Answer, Drafting, Pending Approval, Ready, Scheduled, Published), view Kanban/Kalender/List, pertanyaan di Waiting Answer, preview draft di Pending Approval, metrik di Published, badge Buffer, badge via Grok/Hermes, filter producer
- /topics: browse topic bank (filter status + kategori, sources, used in)
- Nav: Content jadi primary, plus Stream dan Topics. Tombol prompt Hermes + aksi batch cuma buat konten Hermes (Hermes diparkir untuk workflow Grok)
- Belum diisi data: content_topics dan grok_activity_log masih kosong sampai Grok mulai menulis

### Oct 2, 2026 — Pilih banyak konten + aksi batch di /content
- Checkbox di tiap card (Kanban + Kalender) dan checkbox pilih-semua di header kolom Kanban
- Bar melayang dengan aksi batch: Review, Tindak lanjuti notes, Develop jadi draft, Tarik performa. Satu prompt gabungan, item yang tidak cocok dilewati (jumlah yang berlaku tampil di tombol). Aksi tulis tetap 2-step
- Yang dihitung cuma item yang tampil di filter aktif
- Prompt batch di src/lib/bulk-prompts.ts

### Oct 2, 2026 — Sidebar bisa disembunyikan
- Tombol sembunyikan di header sidebar, tombol kecil di pojok kiri atas buat membuka lagi (desktop + tablet, md ke atas). Pilihan disimpan di localStorage
- Komponen AppShell memegang state sidebar dan menggeser konten

### Oct 2, 2026 — Tombol prompt di semua cron
- Tiap cron punya menu "Prompt" (desktop) / tombol langsung (mobile): "Cek status" (read-only), "Jalankan sekarang" (2-step, konfirmasi dulu karena run manual bisa kirim pesan sungguhan), plus "Investigasi gagal" dan "Review governance" sesuai kondisi
- Komponen ActionMenu (dropdown posisi fixed) di action-buttons.tsx
- Prompt patch status error buat Hermes: docs/prompts/hermes-patch-status-error.md (belum dijalankan Gugi)

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
