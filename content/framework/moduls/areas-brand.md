---
slug: areas-brand
name: Brand
subtitle: LinkedIn, Threads, IG
bucket: areas
namespace: areas/brand
status: designing
is_pilot: true
created_at: "2026-10-03"
updated_at: "2026-10-04"
depends_on: []
supports: [projects-social-ppaz]
bots:
  - name: Warta
    mode: partner
    role: Content lead — ide, draft, revisi
  - name: Sandi
    mode: staff
    role: Research supplier — topic bank
  - name: Rupa
    mode: tool
    role: Visual generator
sub_modules:
  - name: LinkedIn
    status: designing
    note: channel utama thought leadership
  - name: Threads
    status: not-designed
  - name: Instagram
    status: not-designed
tasks:
  - title: Shakedown — Grok menulis ke topic bank dan activity log
    status: todo
  - title: Drill Functions layer (isi harian, handler, hasil kerja, ukuran)
    status: todo
  - title: Kunci KPI awal modul
    status: todo
history:
  - date: "2026-10-03"
    status: not-designed
    note: Modul dibuat dari framework v0.1
  - date: "2026-10-03"
    status: designing
    note: Dipilih jadi pilot — paling hidup, Warta sudah jalan, metric engagement ada
related:
  - label: Framework v0.1 — Section 4.3 Functions (entry drill)
  - label: Framework v0.1 — Section 6 Konsep Modul
  - label: Content Pipeline
    href: /content
  - label: Content Stream
    href: /content-stream
  - label: Topics
    href: /topics
---

## Philosophical Anchor

Brand ada untuk **memperkuat eksistensi Gugi di kancah profesional nasional dan internasional** lewat thought leadership personal. Bot di modul ini adalah partner yang menemani Gugi merumuskan pemikirannya, bukan sekadar mesin posting.

## Value Guardrails

- **Approval gate** — tidak ada yang di-post tanpa OK eksplisit dari Gugi
- **Nggak boleh ngarang** — klaim, data, dan referensi harus bisa dilacak; asumsi di-flag
- **Verdict first, tipis-tipis** — draft langsung ke inti
- **Walls personal vs Levner** — konten personal brand tidak membocorkan data klien Levner
- **FARA** — fast fail learn fast: eksperimen format dan angle boleh, asal dievaluasi

## Functions Definition

Alur kerja (draft, akan dikunci saat drill Functions):

1. **Topics** — Sandi meriset dan mengisi topic bank
2. **Ideas** — topik dipilih jadi ide konten
3. **Waiting Answer** — Warta bertanya ke Gugi kalau butuh arah (angle, cerita pribadi)
4. **Drafting** — Warta menulis draft, Rupa menyiapkan visual
5. **Pending Approval** — Gugi review dan approve
6. **Ready / Scheduled** — dijadwalkan di Buffer
7. **Published** — engagement ditarik balik

One front door: Gugi berinteraksi lewat satu chat Grok, bot berbagi peran di belakangnya.

## Evidence Requirements

- Row konten di pipeline dengan jejak stage lengkap (ide sampai published)
- Activity log per bot (siapa melakukan apa, kapan)
- Jawaban dan approval Gugi tercatat
- Post yang terbit di channel

## Measure/KPI

Kandidat (belum dikunci, ditentukan saat drill Functions):

- Jumlah post terbit per minggu per channel
- Engagement per post (impressions, reactions, comments, shares)
- Waktu dari ide ke published
- Waktu tunggu approval Gugi
- Cost per post (Rupiah)
