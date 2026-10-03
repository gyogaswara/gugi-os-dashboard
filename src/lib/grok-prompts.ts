/**
 * Prompt "copy to Grok" buat konten dan topik yang diproduksi Grok.
 *
 * Pola sama dengan prompts.ts (Hermes): dashboard tetap read-only, Gugi yang
 * paste ke chat Grok. Bedanya: sapaannya "Bro" (satu chat, tanpa nama bot),
 * pengenalnya kode di Supabase (content_pipeline.code, atau teks topik buat
 * content_topics), dan Grok sendiri yang menulis balik ke Supabase. Aksi yang
 * menulis data tetap 2 langkah: tunjukkan dulu, tulis setelah Gugi approve.
 */
import type { ContentItem, ContentTopic } from "@/lib/types";
import { TWO_STEP_RULE, type PromptAction } from "@/lib/prompts";
import type { BulkPromptAction } from "@/lib/bulk-prompts";

type Kind = "waiting" | "approval" | "idea" | "drafting" | "ready" | "scheduled" | "published" | "archived";

/** Jenis konten buat nentuin aksi: status menang atas stage (sama dengan kolom Kanban). */
function kindOf(item: ContentItem): Kind {
  if (item.status === "waiting_user_answer") return "waiting";
  if (item.status === "pending_approval") return "approval";
  switch (item.stage) {
    case "idea":
      return "idea";
    case "draft":
      return "drafting";
    case "ready":
      return "ready";
    case "scheduled":
      return "scheduled";
    case "published":
      return "published";
    default:
      return "archived";
  }
}

function clip(text: string | null, max: number): string | null {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Blok referensi satu konten: baris kosong dibuang. */
export function contentReference(item: ContentItem): string {
  const fields: [string, string | null | undefined][] = [
    ["code", item.code],
    ["title", item.title_final ?? item.title],
    ["channel", `${item.channel} ${item.content_type}`],
    ["stage", `${item.stage} (status: ${item.status})`],
    ["producer", item.producer_system ?? "hermes"],
    ["angle", item.angle],
    ["preview", clip(item.body_preview, 300)],
    ["pending question", item.pending_question],
    ["jawaban gue sejauh ini", item.user_answer],
    [
      "Buffer",
      item.buffer_scheduled_at || item.buffer_post_id
        ? [item.buffer_post_id, item.buffer_scheduled_at].filter(Boolean).join(" @ ")
        : null,
    ],
    ["source topic id", item.source_topic_id],
  ];
  return fields
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`)
    .join("\n");
}

const REF_HEADER = "Referensi (Supabase, tabel content_pipeline, pakai code sebagai pengenal):";

function referenceAction(items: ContentItem[]): PromptAction {
  return {
    id: "grok-reference",
    label: "Copy reference",
    prompt:
      items.length === 1
        ? `Bro, ini konten yang gue maksud:\n\n${contentReference(items[0])}\n\n`
        : `Bro, ini ${items.length} konten yang gue maksud:\n\n${items
            .map((i, n) => `${n + 1}.\n${contentReference(i)}`)
            .join("\n\n")}\n\n`,
  };
}

/** Aksi satu konten Grok, tergantung posisinya di pipeline. */
export function grokContentActions(item: ContentItem): PromptAction[] {
  const ref = `${REF_HEADER}\n${contentReference(item)}`;
  const code = item.code;
  const kind = kindOf(item);
  const actions: PromptAction[] = [];

  if (kind === "waiting") {
    actions.push({
      id: "grok-answer",
      label: "Jawab pertanyaan",
      prompt: `Bro, ini jawaban gue buat pertanyaan di konten ${code}.\n\n${ref}\n\nJawaban gue: <TULIS JAWABAN DI SINI>\n\nCatat jawaban gue di Supabase buat konten ini, lalu lanjutin prosesnya.`,
    });
  }

  if (kind === "approval") {
    actions.push(
      {
        id: "grok-revise",
        label: "Revisi draft",
        prompt: `Bro, gue mau revisi draft ${code}.\n\n${ref}\n\nRevisi yang gue mau: <TULIS REVISI DI SINI>\n\n${TWO_STEP_RULE}`,
      },
      {
        id: "grok-approve",
        label: "Approve",
        prompt: `Bro, gue approve draft ${code}.\n\n${ref}\n\nLanjutin ke step berikutnya (jadwalin di Buffer) dan update Supabase.`,
      },
    );
  }

  if (kind === "idea") {
    actions.push({
      id: "grok-develop",
      label: "Kembangkan jadi draft",
      prompt: `Bro, kembangin ide konten ${code} jadi draft lengkap.\n\n${ref}\n\n${TWO_STEP_RULE}`,
    });
  }

  if (kind === "drafting") {
    actions.push({
      id: "grok-review",
      label: "Review draft",
      prompt: `Bro, review draft ${code}.\n\n${ref}\n\nKasih masukan konkret soal clarity, tone, dan fit ke channel-nya. Ini read-only: jangan ubah data apa pun.`,
    });
  }

  if (kind === "idea" || kind === "drafting") {
    actions.push({
      id: "grok-angle",
      label: "Ganti angle",
      prompt: `Bro, angle buat ${code} mau gue ganti.\n\n${ref}\n\nKasih 3 opsi angle baru beserta alasannya. Jangan ubah data dulu, tunggu gue pilih.`,
    });
  }

  if (kind === "ready") {
    actions.push({
      id: "grok-schedule",
      label: "Jadwalkan di Buffer",
      prompt: `Bro, jadwalin ${code} di Buffer.\n\n${ref}\n\nUsulin waktu terbaik buat channel ini.\n${TWO_STEP_RULE}`,
    });
  }

  if (kind === "scheduled") {
    actions.push({
      id: "grok-reschedule",
      label: "Ubah jadwal",
      prompt: `Bro, gue mau ubah jadwal Buffer buat ${code}.\n\n${ref}\n\nJadwal baru: <TULIS JADWAL DI SINI>\n\n${TWO_STEP_RULE}`,
    });
  }

  if (kind === "published" && !item.engagement_metrics) {
    actions.push({
      id: "grok-engagement",
      label: "Tarik engagement",
      prompt: `Bro, tarik engagement buat konten ${code}.\n\n${ref}\n\nAmbil metrik post-nya (impressions, reactions, comments, shares) dan simpan ke engagement_metrics di Supabase.\n${TWO_STEP_RULE}`,
    });
  }

  actions.push(referenceAction([item]));
  return actions;
}

/** Aksi satu topik di topic bank. Pengenal topik = teks topik (unik di content_topics). */
export function grokTopicActions(topic: ContentTopic): PromptAction[] {
  const ref = [
    "Referensi (Supabase, tabel content_topics, pakai teks topik sebagai pengenal):",
    `- topic: ${topic.topic}`,
    topic.category ? `- category: ${topic.category}` : null,
    `- status: ${topic.status}`,
    topic.description ? `- description: ${clip(topic.description, 300)}` : null,
    topic.relevance_score != null ? `- relevance score: ${topic.relevance_score}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const actions: PromptAction[] = [];
  if (topic.status === "fresh" || topic.status === "picked") {
    actions.push(
      {
        id: "grok-topic-research",
        label: "Riset lebih dalam",
        prompt: `Bro, riset topik ini lebih dalam.\n\n${ref}\n\nCari sudut pandang dan sumber tambahan.\n${TWO_STEP_RULE}`,
      },
      {
        id: "grok-topic-content",
        label: "Jadikan konten",
        prompt: `Bro, jadiin topik ini konten.\n\n${ref}\n\nUsulin channel dan angle yang paling pas.\n${TWO_STEP_RULE}`,
      },
    );
  }
  actions.push({
    id: "grok-topic-reference",
    label: "Copy reference",
    prompt: `Bro, ini topik yang gue maksud:\n\n${ref}\n\n`,
  });
  return actions;
}

/** Aksi batch buat beberapa konten Grok terpilih: satu prompt gabungan. */
export function grokBulkActions(items: ContentItem[]): BulkPromptAction[] {
  const ideas = items.filter((i) => kindOf(i) === "idea");
  const reviewable = items.filter((i) => ["idea", "drafting", "approval"].includes(kindOf(i)));
  const approvable = items.filter((i) => kindOf(i) === "approval");
  const measurable = items.filter((i) => kindOf(i) === "published" && !i.engagement_metrics);

  const list = (xs: ContentItem[]) => xs.map((i, n) => `${n + 1}.\n${contentReference(i)}`).join("\n\n");
  const make = (id: string, label: string, xs: ContentItem[], text: string): BulkPromptAction => ({
    id,
    label,
    count: xs.length,
    prompt: xs.length ? `${text}\n\n${REF_HEADER}\n${list(xs)}` : "",
  });

  return [
    {
      ...referenceAction(items),
      id: "grok-bulk-reference",
      count: items.length,
    },
    make(
      "grok-bulk-review",
      "Review",
      reviewable,
      `Bro, review ${reviewable.length} konten ini.\nUntuk tiap item kasih verdict (keep / rework / drop), alasan satu baris, dan satu perbaikan konkret, lalu urutkan prioritas publish. Ini read-only: jangan ubah data.`,
    ),
    make(
      "grok-bulk-develop",
      "Kembangkan jadi draft",
      ideas,
      `Bro, kembangin ${ideas.length} ide konten ini jadi draft lengkap.\n${TWO_STEP_RULE}`,
    ),
    make(
      "grok-bulk-approve",
      "Approve",
      approvable,
      `Bro, gue approve ${approvable.length} draft ini.\nLanjutin ke step berikutnya (jadwalin di Buffer) dan update Supabase buat masing-masing.`,
    ),
    make(
      "grok-bulk-engagement",
      "Tarik engagement",
      measurable,
      `Bro, tarik engagement ${measurable.length} konten published ini dan simpan ke engagement_metrics di Supabase.\n${TWO_STEP_RULE}`,
    ),
  ];
}
