# Gugi OS Dashboard — Backlog

Single source of truth buat roadmap, ideas, dan changelog. 
Editable via GitHub web dari HP.

## 🎯 Next (Sedang Dikerjakan atau Siap Dieksekusi)

### Sprint 2: Approval Inbox (Target: Oct 2026)
- [ ] Bikin tabel `approvals` di Supabase (schema TBD)
- [ ] Hermes push approval baru ke Supabase
- [ ] Build halaman /approvals dengan Realtime (WebSocket)
- [ ] Approve/Reject buttons yang update Supabase
- [ ] Push notif ke Telegram tiap ada approval baru

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

### Long-term Vision
- Sprint 3: Today's Brief page (merge Calendar + TickTick + cron status)
- Integrasi ke agent lain (bukan cuma Hermes)
- Dashboard multi-user (untuk team Levner)
- API buat external system query cron status Gugi

## ✅ Done

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

## Sprint 2 - IN PROGRESS

### Hermes side - DONE (2026-10-01)
- ✅ Tabel content_pipeline live (23 kolom)
- ✅ 16 row initial data populated
- ✅ Management API access enabled untuk autonomous migration

### Dashboard side - PENDING
- [ ] View Kanban (group by stage): Ideas → Drafts → Ready → Scheduled → Published
- [ ] View Kalender (group by scheduled_at / published_at)
- [ ] Style: Preset C (left status stripe card)
- [ ] Landing page update: nav ke /content

## Backlog (future sprints)

### Infrastructure
- Approval workflow bidirectional (dashboard klik → Hermes react)
- Multi-agent activation (agent-writer, agent-producer beneran run)
- Auto-post ke LinkedIn (Maton API) + IG (Composio)

### Security
- Rotate Supabase Management token tiap 90 hari (next: ~24 Dec 2026)

### Polish
- Naming consistency policy Supabase: "Allow public read" vs 
  "Allow public read access to cron_jobs" — standardize

## 📝 How to Use This File

- **Idea baru**? Tulis di "Ideas" section. Gak perlu detail, cukup 
  one-liner.
- **Siap dikerjain**? Pindahin dari "Ideas" ke "Next" dengan sub-tasks.
- **Selesai**? Pindahin dari "Next" ke "Done" dengan tanggal dan short 
  description.
- **Edit dari HP**: buka github.com/gyogaswara/gugi-os-dashboard/blob/main/docs/BACKLOG.md
  → klik pensil → edit → commit.
