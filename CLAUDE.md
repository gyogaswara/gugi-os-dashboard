# Gugi OS Dashboard — Claude Code Context

File ini dibaca otomatis oleh Claude Code tiap sesi. Berisi konteks 
project, working preferences Gugi, dan non-negotiable rules.

## Project Overview
- Nama: Gugi OS Dashboard
- Owner: Gugi Yogaswara (CEO Levner Consulting)
- Purpose: Personal mission control dashboard buat monitor AI agent 
  Gugi (utamanya Hermes Agent di OpenClaw)
- Problem yang diselesaikan: Hermes state cuma di memory internal, 
  gak ada visibility ke cron/approval/schedule dari luar
- Live URL: https://gugi-os-dashboard.vercel.app
- Repo: https://github.com/gyogaswara/gugi-os-dashboard

## Architecture
- Frontend: Next.js 15 (App Router, TypeScript, Tailwind v4)
- Backend: Supabase (Postgres + REST API + RLS + Realtime)
- Hosting: Vercel (auto-deploy dari GitHub main branch)
- Data flow: Hermes (OpenClaw) → POST ke Supabase → Dashboard read via 
  REST API
- Supabase URL: https://njjbmuhljbrnidrqrvqd.supabase.co
- Supabase region: Seoul (ap-northeast-2)

## Current State (as of Sept 30, 2026)
- [x] Sprint 1: Cron Monitor page /cron — LIVE
- [x] 26 real cron jobs populated di tabel cron_jobs dengan governance 
  context (background, process_steps, skills_used, dll)
- [x] RLS enabled dengan SELECT policy untuk anon key
- [x] Vercel deploy pipeline working
- [ ] Sprint 2: Approval Inbox page /approvals (dengan Realtime)
- [ ] Sprint 3: Today's Brief page / (integrate Google Calendar + TickTick)

## Working Preferences (dari Gugi)
- Communicate in casual Indonesian (gue/lo register)
- Direct, blunt, data-backed — no diplomatic framing
- Verify technical claims sebelum present as solutions
- Incremental walkthrough > large upfront generation
- Full automation from start > manual workarounds
- One step verified before next — no batch build
- Peer-level treatment, not deferential
- Explain the WHY of technical decisions
- Gugi mobile-first, minimize laptop time

## Non-Negotiable Rules
- NEVER pake DeepSeek buat coding tasks (proven unreliable)
- NEVER commit .env.local atau file dengan credentials
- NEVER pake service_role key di client-side code (cuma anon key dengan 
  NEXT_PUBLIC_ prefix)
- NEVER overwrite file Gugi tanpa nanya dulu
- NEVER disable RLS di tabel production
- ALWAYS pakai TypeScript strict mode
- ALWAYS test build local sebelum push kalo ada perubahan besar

## Key Files
- migrations/001_create_cron_jobs_table.sql — database schema
- src/lib/supabase.ts — Supabase client singleton
- src/lib/types.ts — TypeScript types for cron_jobs
- .env.local — credentials (NEVER read/print/commit)
- docs/BACKLOG.md — single source of truth for roadmap + ideas + 
  changelog

## Design Decisions Log
- Why Supabase over VPS: no sysadmin burden, managed Postgres + 
  Realtime + Auth
- Why Vercel: zero-config Next.js deploy, free tier sufficient
- Why 25-field schema for cron_jobs: governance context enables 
  long-term maintenance, not just monitoring
- Why RLS from Sprint 1: security best practice, easier to add policy 
  than retrofit
- Why light mode locked: consistent cross-device UX, dark mode support 
  later

## Communication Style with Gugi
- Ambil inisiatif — kalo Gugi kasih request ambigu, propose approach 
  based on CLAUDE.md, jangan tanya bolak-balik
- Kalo perlu decision besar yang gak ada di rules/roadmap, baru tanya
- Kalo ada trade-off, sebutin — jangan sembunyiin
- Pas selesai task, kasih laporan concise: apa yang berubah, apa yang 
  perlu Gugi lakuin next

## How to Add New Feature (Standard Flow)
1. Baca docs/BACKLOG.md — pastikan feature udah di-approve di "Next"
2. Kalo butuh tabel Supabase baru: bikin SQL migration di migrations/ 
   folder, tunjukin ke Gugi buat run manual di Supabase SQL Editor
3. Kalo butuh update tabel existing: sama, SQL migration dulu
4. Bikin file page baru di src/app/<route>/page.tsx
5. Kalo butuh Realtime, pake supabase.channel() dengan cleanup
6. Test local dengan npm run dev
7. Git commit + push — Vercel auto-deploy
8. Update docs/BACKLOG.md: pindah feature dari "Next" ke "Done" dengan 
   tanggal + short description
