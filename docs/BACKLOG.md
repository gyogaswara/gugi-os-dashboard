# Gugi OS Dashboard — Backlog

Single source of truth buat roadmap, ideas, dan changelog. 
Editable via GitHub web dari HP.

## 🎯 Next (Sedang Dikerjakan atau Siap Dieksekusi)

### Sprint 2 — IN PROGRESS (sisa: Content Pipeline UI)
Backend + /agents + /tasks udah selesai (lihat Done). Tinggal:
- [ ] /content page — View Kanban (group by stage): Ideas → Drafts → Ready → Scheduled → Published
- [ ] /content page — View Kalender (group by scheduled_at / published_at)
- [ ] Style: Preset C (left status stripe card)
- [ ] Landing page: aktifin link ke /content (placeholder "coming soon" udah ada)

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

### Oct 1–2, 2026 — Sprint 2 (partial): Agents + Execution Log
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
