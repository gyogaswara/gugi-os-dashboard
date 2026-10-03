"use client";

import { useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { ContentItem, ContentTopic } from "@/lib/types";
import ActionButtons from "@/components/action-buttons";
import { contentActions } from "@/lib/prompts";
import { contentReference, grokContentActions, grokTopicActions } from "@/lib/grok-prompts";
import { Badge, type BadgeTone, truncate } from "@/components/dashboard-ui";

export type ColumnId =
  | "topics"
  | "ideas"
  | "waiting"
  | "drafting"
  | "approval"
  | "ready"
  | "scheduled"
  | "published"
  | "archived";

export const COLUMNS: { id: ColumnId; label: string; stripe: string }[] = [
  { id: "topics", label: "Topics", stripe: "border-l-cyan-400" },
  { id: "ideas", label: "Ideas", stripe: "border-l-purple-400" },
  { id: "waiting", label: "Waiting Answer", stripe: "border-l-orange-400" },
  { id: "drafting", label: "Drafting", stripe: "border-l-amber-400" },
  { id: "approval", label: "Pending Approval", stripe: "border-l-blue-500" },
  { id: "ready", label: "Ready", stripe: "border-l-teal-400" },
  { id: "scheduled", label: "Scheduled", stripe: "border-l-indigo-500" },
  { id: "published", label: "Published", stripe: "border-l-green-500" },
  { id: "archived", label: "Archived", stripe: "border-l-gray-300" },
];

export const COLUMN_LABEL = Object.fromEntries(COLUMNS.map((c) => [c.id, c.label])) as Record<ColumnId, string>;
const COLUMN_STRIPE = Object.fromEntries(COLUMNS.map((c) => [c.id, c.stripe])) as Record<ColumnId, string>;

/** Status menang atas stage: konten yang menunggu jawaban/approval punya kolom sendiri. */
export function columnOf(item: ContentItem): ColumnId {
  if (item.status === "waiting_user_answer") return "waiting";
  if (item.status === "pending_approval") return "approval";
  switch (item.stage) {
    case "idea":
      return "ideas";
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

/** Row lama (Hermes) punya producer_system default 'hermes'; null dianggap Hermes. */
export function producerOf(item: ContentItem): string {
  return item.producer_system ?? "hermes";
}

export function channelLabel(channel: string): string {
  return channel.replace(/_/g, " ");
}

/** Tanggal kalender: scheduled_at, lalu jadwal Buffer, lalu published_at. */
export function itemDate(item: ContentItem): Date | null {
  const value = item.scheduled_at ?? item.buffer_scheduled_at ?? item.published_at;
  return value ? parseISO(value) : null;
}

export const STATUS_TONE: Record<string, BadgeTone> = {
  new: "purple",
  approved: "green",
  rejected: "red",
  hold: "gray",
  in_progress: "amber",
  done: "green",
  waiting_user_answer: "amber",
  pending_approval: "blue",
};

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function ProducerTag({ item }: { item: ContentItem }) {
  return <span className="text-gray-400">via {producerOf(item) === "grok" ? "Grok" : "Hermes"}</span>;
}

/** Badge Buffer kalau konten sudah dijadwalkan di Buffer. */
function BufferBadge({ item }: { item: ContentItem }) {
  if (!item.buffer_scheduled_at && !item.buffer_post_id) return null;
  return (
    <Badge tone="blue">
      Scheduled in Buffer
      {item.buffer_scheduled_at ? ` · ${format(parseISO(item.buffer_scheduled_at), "d MMM HH:mm")}` : ""}
    </Badge>
  );
}

/** Ringkasan engagement_metrics: maksimal 4 pasangan angka/teks. */
function Metrics({ item }: { item: ContentItem }) {
  const entries = Object.entries(item.engagement_metrics ?? {})
    .filter(([, v]) => typeof v === "number" || typeof v === "string")
    .slice(0, 4);
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span key={k} className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-800">
          {k.replace(/_/g, " ")} <span className="font-semibold">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

/** Detail yang muncul saat card/row di-expand. */
export function ContentDetail({ item }: { item: ContentItem }) {
  const details: [string, string | null][] = [
    ["Angle", item.angle],
    ["Type", item.content_type],
    ["Producer", producerOf(item)],
    ["Source", [item.source_agent, item.source_cron_code].filter(Boolean).join(" · ") || null],
    ["Source file", item.source_file_path],
    ["Source topic", item.source_topic_id],
    ["Reviewer notes", item.reviewer_notes],
    ["Pending question", item.pending_question],
    ["Your answer", item.user_answer],
    ["Answered", item.user_answered_at ? format(parseISO(item.user_answered_at), "d MMM yyyy HH:mm") : null],
    ["Performance", item.performance_summary],
    ["Scheduled", item.scheduled_at ? format(parseISO(item.scheduled_at), "d MMM yyyy HH:mm") : null],
    ["Buffer post", item.buffer_post_id],
    ["Published", item.published_at ? format(parseISO(item.published_at), "d MMM yyyy HH:mm") : null],
  ];
  return (
    <div className="text-xs">
      <p className="whitespace-pre-wrap text-gray-700">{item.body_full ?? item.body_preview}</p>
      <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-gray-500">{label}</dt>
              <dd className="break-words">{value}</dd>
            </div>
          ))}
      </dl>
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} tone="gray">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/** Aksi satu konten: prompt Hermes buat konten Hermes, prompt Grok buat konten Grok. */
export function actionsFor(item: ContentItem) {
  return producerOf(item) === "grok"
    ? grokContentActions(item)
    : [
        ...contentActions(item),
        {
          id: "reference",
          label: "Copy reference",
          prompt: `Ini konten yang gue maksud:\n\n${contentReference(item)}\n\n`,
        },
      ];
}

/**
 * Card dengan stripe warna kiri per kolom (Preset C); klik untuk expand inline.
 * Tombol prompt menyesuaikan produsen: Hermes atau Grok.
 */
export function ContentCard({
  item,
  picked,
  onPick,
}: {
  item: ContentItem;
  picked: boolean;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const column = columnOf(item);
  const actions = actionsFor(item);

  return (
    <li
      className={`relative rounded border border-l-4 border-gray-200 bg-white ${COLUMN_STRIPE[column]} ${
        picked ? "ring-2 ring-gray-900" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={picked}
        onChange={() => onPick(item.id)}
        aria-label={`Pilih ${item.code}`}
        className="absolute left-3 top-3 h-4 w-4 cursor-pointer"
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="block w-full p-3 text-left text-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="pl-6 font-mono text-xs text-gray-500">{item.code}</span>
          <Badge tone={STATUS_TONE[item.status] ?? "gray"}>{statusLabel(item.status)}</Badge>
        </div>
        <p className="mt-1 font-medium">{item.title_final ?? item.title}</p>
        <p className="mt-1 text-xs text-gray-500">
          {channelLabel(item.channel)} · {item.content_type} · <ProducerTag item={item} />
        </p>

        {column === "waiting" && item.pending_question && (
          <p className="mt-2 rounded border border-orange-200 bg-orange-50 p-2 text-xs font-medium text-orange-900">
            {item.pending_question}
          </p>
        )}
        {column === "approval" && (
          <p className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-950">
            {truncate(item.body_full ?? item.body_preview, open ? 600 : 200)}
          </p>
        )}
        {column !== "waiting" && column !== "approval" && !open && (
          <p className="mt-1 text-xs text-gray-600">{truncate(item.body_preview, 90)}</p>
        )}

        {column === "published" && <Metrics item={item} />}
        {(item.buffer_scheduled_at || item.buffer_post_id) && (
          <div className="mt-2">
            <BufferBadge item={item} />
          </div>
        )}
      </button>
      {actions.length > 0 && (
        <div className="px-3 pb-3">
          <ActionButtons actions={actions} />
        </div>
      )}
      {open && (
        <div className="border-t border-gray-200 p-3">
          <ContentDetail item={item} />
        </div>
      )}
    </li>
  );
}

/** Bentuk sources bebas (array string / array {title,url}); dinormalkan jadi daftar tampilan. */
export function sourceLines(sources: unknown): { label: string; href: string | null }[] {
  if (!Array.isArray(sources)) return [];
  return sources.flatMap((s): { label: string; href: string | null }[] => {
    if (typeof s === "string") return [{ label: s, href: /^https?:\/\//i.test(s) ? s : null }];
    if (s && typeof s === "object") {
      const o = s as Record<string, unknown>;
      const url = typeof o.url === "string" && /^https?:\/\//i.test(o.url) ? o.url : null;
      const label = String(o.title ?? o.name ?? o.url ?? JSON.stringify(o));
      return [{ label, href: url }];
    }
    return [];
  });
}

/** Card topik dari topic bank (kolom Topics dan halaman /topics). */
export function TopicCard({ topic, usedIn }: { topic: ContentTopic; usedIn?: string }) {
  const [open, setOpen] = useState(false);
  const sources = sourceLines(topic.sources);
  const actions = grokTopicActions(topic);
  return (
    <li className="rounded border border-l-4 border-gray-200 border-l-cyan-400 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="block w-full p-3 text-left text-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-gray-500">{topic.category ?? "uncategorized"}</span>
          <Badge tone={topic.status === "fresh" ? "blue" : topic.status === "used" ? "green" : "gray"}>
            {topic.status}
          </Badge>
        </div>
        <p className="mt-1 font-medium">{topic.topic}</p>
        <p className="mt-1 text-xs text-gray-500">
          {topic.researched_by ?? "sandi"}
          {topic.researched_at ? ` · ${formatDistanceToNow(parseISO(topic.researched_at), { addSuffix: true })}` : ""}
          {topic.relevance_score != null ? ` · relevance ${topic.relevance_score}` : ""}
        </p>
        {!open && topic.description && <p className="mt-1 text-xs text-gray-600">{truncate(topic.description, 90)}</p>}
      </button>
      <div className="px-3 pb-3">
        <ActionButtons actions={actions} />
      </div>
      {open && (
        <div className="space-y-3 border-t border-gray-200 p-3 text-xs">
          {topic.description && <p className="whitespace-pre-wrap text-gray-700">{topic.description}</p>}
          {sources.length > 0 && (
            <div>
              <p className="font-medium uppercase text-gray-500">Sources</p>
              <ul className="mt-1 space-y-0.5">
                {sources.map((s, i) => (
                  <li key={i} className="break-words">
                    {s.href ? (
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline">
                        {s.label}
                      </a>
                    ) : (
                      s.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
            {topic.picked_at && (
              <>
                <dt className="text-gray-500">Picked</dt>
                <dd>{format(parseISO(topic.picked_at), "d MMM yyyy HH:mm")}</dd>
              </>
            )}
            {topic.used_in_content_id && (
              <>
                <dt className="text-gray-500">Used in</dt>
                <dd className="break-words">{usedIn ?? topic.used_in_content_id}</dd>
              </>
            )}
          </dl>
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topic.tags.map((tag) => (
                <Badge key={tag} tone="gray">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
