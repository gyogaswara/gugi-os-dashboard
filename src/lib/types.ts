/**
 * TypeScript types untuk tabel `cron_jobs`.
 *
 * Harus sinkron dengan migrations/001_create_cron_jobs_table.sql.
 * Kolom tanpa NOT NULL di SQL diketik sebagai `| null`, termasuk kolom
 * yang punya default (default hanya berlaku kalau kolom tidak diisi saat
 * insert; nilai null eksplisit tetap diterima database).
 * Kolom timestamptz diketik sebagai `string` (ISO 8601), karena
 * supabase-js mengembalikan timestamp sebagai string, bukan Date.
 */

/** Kategori cron job. */
export type CronJobCategory =
  | "levner"
  | "academy"
  | "esg"
  | "personal"
  | "bunda"
  | "completed";

/** Status runtime cron job. */
export type CronJobStatus = "active" | "paused" | "error" | "completed";

/** Hasil eksekusi terakhir cron job. */
export type CronJobRunStatus = "success" | "failed" | "skipped";

/** Frekuensi review governance cron job. */
export type CronJobReviewFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "on-demand";

/** Satu row di tabel `cron_jobs`. */
export type CronJob = {
  // ---------------------------------------------------------------------------
  // CORE IDENTITY
  // ---------------------------------------------------------------------------

  /** Primary key (UUID), di-generate otomatis oleh database. */
  id: string;
  /** Kode unik cron job yang human-readable, contoh: "LVN-004". */
  code: string;
  /** Nama cron job. */
  name: string;
  /** Deskripsi singkat fungsi cron job. */
  description: string | null;
  /** Kategori/area yang dilayani cron job. */
  category: CronJobCategory | null;
  /** Pemilik cron job. Default: "gugi". */
  owner: string | null;

  // ---------------------------------------------------------------------------
  // GOVERNANCE CONTEXT
  // ---------------------------------------------------------------------------

  /** Alasan kenapa cron job ini ada. */
  background: string | null;
  /** Sumber input dan formatnya. */
  input_detail: string | null;
  /** Langkah-langkah yang dijalankan cron job. */
  process_steps: string | null;
  /** Format output dan lokasi penyimpanannya. */
  output_detail: string | null;
  /** Daftar nama skill yang dipakai agent. */
  skills_used: string[] | null;
  /** Tag untuk pengelompokan/filter skill. */
  skill_tags: string[] | null;
  /** Catatan tambahan bebas. */
  notes: string | null;

  // ---------------------------------------------------------------------------
  // EXECUTION CONFIG
  // ---------------------------------------------------------------------------

  /** Jadwal dalam format cron expression, contoh: "30 23 * * *". */
  schedule_cron: string | null;
  /** Jadwal dalam bahasa manusia, contoh: "Daily 23:30 WIB". */
  schedule_human: string | null;
  /** Nama agent yang menjalankan cron job. */
  agent_name: string | null;
  /** Model LLM yang dipakai, contoh: "deepseek-v4-flash". */
  model: string | null;
  /** ID job di sistem Hermes, untuk mapping ke agent. */
  hermes_job_id: string | null;

  // ---------------------------------------------------------------------------
  // RUNTIME STATE
  // ---------------------------------------------------------------------------

  /** Status cron job saat ini. Default: "active". */
  status: CronJobStatus | null;
  /** Waktu eksekusi terakhir (ISO 8601). */
  last_run_at: string | null;
  /** Hasil eksekusi terakhir. */
  last_run_status: CronJobRunStatus | null;
  /** Pesan error dari eksekusi terakhir, kalau gagal. */
  last_run_error: string | null;
  /** Waktu eksekusi berikutnya yang dijadwalkan (ISO 8601). */
  next_run_at: string | null;

  // ---------------------------------------------------------------------------
  // GOVERNANCE STATE
  // ---------------------------------------------------------------------------

  /** Seberapa sering cron job ini perlu di-review. Default: "quarterly". */
  review_frequency: CronJobReviewFrequency | null;
  /** Waktu review terakhir (ISO 8601). */
  last_reviewed_at: string | null;

  // ---------------------------------------------------------------------------
  // AUDIT TRAIL
  // ---------------------------------------------------------------------------

  /** Waktu row dibuat (ISO 8601). Default: now(). */
  created_at: string | null;
  /** Waktu row terakhir di-update (ISO 8601), di-set otomatis oleh trigger. */
  updated_at: string | null;
};

/** Satu row di tabel `agents`: registry agent Hermes. */
export interface Agent {
  id: string;
  /** Kode unik agent, contoh: "AGT-001". */
  agent_code: string;
  agent_name: string;
  status: "active" | "idle" | "deprecated";
  model: string | null;
  scope_description: string | null;
  skills_attached: string[] | null;
  /** Kode cron yang di-handle agent ini. */
  cron_attached: string[] | null;
  last_run_at: string | null;
  total_runs_count: number | null;
  reviewer_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Satu row di tabel `agent_executions`: log eksekusi agent. */
export interface AgentExecution {
  id: string;
  hermes_job_id: string | null;
  hermes_message_id: string | null;
  agent_name: string;
  execution_type: "cron" | "chat" | "manual" | "chain";
  /** Kode cron sumber eksekusi (kalau execution_type = "cron"). */
  raw_cron_code: string | null;
  schedule_expression: string | null;
  schedule_human: string | null;
  status: "ok" | "error" | "running" | "unknown";
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  output_destination: string | null;
  delivery_channel: string | null;
  model_used: string | null;
  skills_used: string[] | null;
  /** Eksekusi lain yang jadi input konteks (untuk chain). */
  context_from: string[] | null;
  error_message: string | null;
  input_summary: string | null;
  output_summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** Stage pipeline konten, berurutan dari awal sampai akhir. */
export type ContentStage = "idea" | "draft" | "ready" | "scheduled" | "published" | "archived";

/** Satu row di tabel `content_pipeline`: pipeline konten dari ide sampai publish. */
export interface ContentItem {
  id: string;
  /** Kode unik konten, contoh: "CNT-202609-001". */
  code: string;
  title: string;
  title_final: string | null;
  body_preview: string;
  body_full: string | null;
  media_urls: string[] | null;
  stage: ContentStage;
  status: "new" | "in_progress" | "done" | string;
  channel: string;
  angle: string | null;
  content_type: string;
  source_agent: string | null;
  source_cron_code: string | null;
  source_file_path: string | null;
  source_type: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer_notes: string | null;
  performance_summary: string | null;
  tags: string[] | null;
}
