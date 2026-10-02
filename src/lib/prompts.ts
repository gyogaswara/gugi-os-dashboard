/**
 * Template prompt untuk tombol aksi "copy to Hermes".
 *
 * Dashboard tetap read-only (ADR-001/003): tombol cuma menyusun prompt dari
 * data record dan menyalinnya ke clipboard; Gugi yang paste ke Telegram Hermes.
 * Aksi yang menulis data memakai pola 2 langkah: Hermes tunjukkan dulu,
 * baru eksekusi setelah Gugi approve.
 */
import type { Agent, AgentExecution, ContentItem } from "@/lib/types";

export type PromptAction = {
  id: string;
  label: string;
  prompt: string;
};

const TWO_STEP_RULE =
  "Rule: this is a 2-step flow. STEP 1: do the work and show me the result, do NOT write anything to Supabase yet. STEP 2: only after I reply \"approve\", apply the change.";

/** Susun prompt: header konteks (field kosong dibuang) + instruksi. */
function build(header: string, fields: [string, string | null | undefined][], instruction: string): string {
  const context = fields
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`)
    .join("\n");
  return `${header}\n\nContext:\n${context}\n\n${instruction}`;
}

export function contentActions(item: ContentItem): PromptAction[] {
  const base: [string, string | null | undefined][] = [
    ["Code", item.code],
    ["Title", item.title_final ?? item.title],
    ["Channel", item.channel],
    ["Type", item.content_type],
    ["Angle", item.angle],
    ["Current stage", `${item.stage} (status: ${item.status})`],
    ["Preview", item.body_preview],
    ["Source file", item.source_file_path],
    ["Reviewer notes", item.reviewer_notes],
  ];

  if (item.stage === "idea") {
    return [
      {
        id: "develop-draft",
        label: "Develop jadi draft",
        prompt: build(
          `Hermes, develop content idea ${item.code} into a full draft.`,
          base,
          `Write the full draft for the ${item.channel} ${item.content_type}, in Gugi's voice, following the angle and reviewer notes above.\n${TWO_STEP_RULE}\nOn approve: UPDATE content_pipeline SET stage='draft', status='in_progress', body_full=<draft> WHERE code='${item.code}'.`,
        ),
      },
    ];
  }

  if (item.stage === "draft") {
    return [
      {
        id: "review-draft",
        label: "Review draft",
        prompt: build(
          `Hermes, review the draft of ${item.code}.`,
          base,
          `Review it for clarity, tone, and ${item.channel} fit. Give me concrete edits, not general advice. This is read-only: do not change any data.`,
        ),
      },
    ];
  }

  // Metrik cuma relevan buat channel publik; WA/Telegram itu forward manual.
  const hasMetrics = item.channel === "linkedin" || item.channel === "threads";
  if (item.stage === "published" && hasMetrics && !item.performance_summary) {
    return [
      {
        id: "pull-performance",
        label: "Tarik performa",
        prompt: build(
          `Hermes, pull the performance of published post ${item.code}.`,
          [...base, ["Published at", item.published_at]],
          `Get the engagement metrics for this ${item.channel} post (impressions, reactions, comments, shares) and write a 2-3 sentence performance_summary.\n${TWO_STEP_RULE}\nOn approve: UPDATE content_pipeline SET performance_summary=<summary> WHERE code='${item.code}'.`,
        ),
      },
    ];
  }

  return [];
}

export function executionActions(execution: AgentExecution): PromptAction[] {
  if (!execution.error_message) return [];

  const mismatch =
    execution.status === "ok"
      ? "Note: this execution is recorded as status='ok' even though it has an error_message. That is the known status-vs-delivery-error mismatch; include it in your diagnosis."
      : "";

  return [
    {
      id: "diagnose-error",
      label: "Diagnosa error",
      prompt: build(
        "Hermes, diagnose this failed execution.",
        [
          ["Agent", execution.agent_name],
          ["Type", execution.execution_type],
          ["Cron code", execution.raw_cron_code],
          ["Hermes job ID", execution.hermes_job_id],
          ["Started at", execution.started_at],
          ["Status recorded", execution.status],
          ["Delivery channel", execution.delivery_channel],
          ["Output destination", execution.output_destination],
          ["Error", execution.error_message],
        ],
        `Find the root cause and propose a fix. ${mismatch}\nThis is read-only: do not change anything (config, cron, or Supabase) until I approve your proposed fix.`,
      ),
    },
  ];
}

export function agentActions(agent: Agent): PromptAction[] {
  if (agent.status !== "idle") return [];

  return [
    {
      id: "assess-activation",
      label: "Cek kesiapan",
      prompt: build(
        `Hermes, assess whether ${agent.agent_name} (${agent.agent_code}) is ready to be activated.`,
        [
          ["Agent", `${agent.agent_code} ${agent.agent_name}`],
          ["Status", agent.status],
          ["Model", agent.model ?? "not configured"],
          ["Scope", agent.scope_description],
          ["Skills attached", agent.skills_attached?.join(", ")],
          ["Cron attached", agent.cron_attached?.join(", ")],
          ["Last run", agent.last_run_at],
          ["Reviewer notes", agent.reviewer_notes],
        ],
        `List what is missing before it can go active (SOUL defined? model configured? skills and cron attached?) and what you recommend I do. This is read-only: do not change the agent status or any config.`,
      ),
    },
  ];
}
