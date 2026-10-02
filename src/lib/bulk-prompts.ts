/**
 * Prompt batch buat tombol aksi "copy to Hermes" saat beberapa konten dipilih
 * sekaligus di /content. Sama seperti prompts.ts: dashboard tetap read-only,
 * Gugi yang paste ke Hermes, dan aksi yang menulis data memakai pola 2 langkah.
 */
import type { ContentItem } from "@/lib/types";
import { TWO_STEP_RULE, type PromptAction } from "@/lib/prompts";

export type BulkPromptAction = PromptAction & {
  /** Jumlah item terpilih yang berlaku buat aksi ini (0 = tombol dinonaktifkan). */
  count: number;
};

function bulkList(items: ContentItem[]): string {
  return items
    .map((item, i) => {
      const lines = [
        `${i + 1}. ${item.code} — ${item.title_final ?? item.title}`,
        `   ${item.channel} ${item.content_type} | stage: ${item.stage} (${item.status})${item.angle ? ` | angle: ${item.angle}` : ""}`,
        `   Preview: ${item.body_preview}`,
        item.source_file_path ? `   Source file: ${item.source_file_path}` : null,
        item.reviewer_notes ? `   Reviewer notes: ${item.reviewer_notes}` : null,
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n");
}

function codeList(items: ContentItem[]): string {
  return items.map((i) => `'${i.code}'`).join(", ");
}

export function contentBulkActions(items: ContentItem[]): BulkPromptAction[] {
  const reviewable = items.filter((i) => i.stage === "idea" || i.stage === "draft");
  const withNotes = items.filter(
    (i) => i.reviewer_notes && i.stage !== "published" && i.stage !== "archived",
  );
  const ideas = items.filter((i) => i.stage === "idea");
  const measurable = items.filter(
    (i) =>
      i.stage === "published" &&
      (i.channel === "linkedin" || i.channel === "threads") &&
      !i.performance_summary,
  );

  const make = (
    id: string,
    label: string,
    list: ContentItem[],
    header: string,
    instruction: string,
  ): BulkPromptAction => ({
    id,
    label,
    count: list.length,
    prompt: list.length ? `${header}\n\nItems (${list.length}):\n${bulkList(list)}\n\n${instruction}` : "",
  });

  return [
    make(
      "bulk-review",
      "Review",
      reviewable,
      `Hermes, review these ${reviewable.length} content ideas/drafts.`,
      "For each item give: verdict (keep / rework / drop), a one-line reason, and one concrete improvement to the angle or hook. Then rank all items by priority for publishing, considering the channel mix. This is read-only: do not change any data.",
    ),
    make(
      "bulk-address-notes",
      "Tindak lanjuti notes",
      withNotes,
      `Hermes, address the reviewer notes on these ${withNotes.length} content items.`,
      `For each item, act on its reviewer notes and propose the revised angle and body_preview.\n${TWO_STEP_RULE}\nOn approve: UPDATE content_pipeline for each code with the agreed angle/body_preview, WHERE code IN (${codeList(withNotes)}). Do not touch other columns.`,
    ),
    make(
      "bulk-develop",
      "Develop jadi draft",
      ideas,
      `Hermes, develop these ${ideas.length} content ideas into full drafts.`,
      `Write a full draft for each, in Gugi's voice, following its channel, angle, and reviewer notes.\n${TWO_STEP_RULE}\nOn approve: for each code UPDATE content_pipeline SET stage='draft', status='in_progress', body_full=<its draft> WHERE code IN (${codeList(ideas)}).`,
    ),
    make(
      "bulk-performance",
      "Tarik performa",
      measurable,
      `Hermes, pull the performance of these ${measurable.length} published posts.`,
      `For each, get the engagement metrics (impressions, reactions, comments, shares) and write a 2-3 sentence performance_summary.\n${TWO_STEP_RULE}\nOn approve: UPDATE content_pipeline SET performance_summary=<its summary> for each, WHERE code IN (${codeList(measurable)}).`,
    ),
  ];
}
