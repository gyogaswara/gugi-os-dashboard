"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import type { ContentItem, ContentStage } from "@/lib/types";
import {
  Badge,
  type BadgeTone,
  ErrorState,
  FilterButtons,
  SearchInput,
  SkeletonRows,
  SummaryCard,
  truncate,
} from "@/components/dashboard-ui";

type ViewMode = "kanban" | "calendar";
type StatusFilter = "all" | "new" | "in_progress" | "done";

const STAGES: { stage: ContentStage; label: string; stripe: string }[] = [
  { stage: "idea", label: "Idea", stripe: "border-l-purple-400" },
  { stage: "draft", label: "Draft", stripe: "border-l-amber-400" },
  { stage: "ready", label: "Ready", stripe: "border-l-blue-400" },
  { stage: "scheduled", label: "Scheduled", stripe: "border-l-indigo-500" },
  { stage: "published", label: "Published", stripe: "border-l-green-500" },
  { stage: "archived", label: "Archived", stripe: "border-l-gray-300" },
];

const STAGE_STRIPE = Object.fromEntries(STAGES.map((s) => [s.stage, s.stripe])) as Record<
  ContentStage,
  string
>;

const STATUS_TONE: Record<string, BadgeTone> = { new: "purple", in_progress: "amber", done: "green" };

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "kanban", label: "Kanban" },
  { value: "calendar", label: "Kalender" },
];

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function channelLabel(channel: string): string {
  return channel.replace(/_/g, " ");
}

/** Tanggal kalender: scheduled_at, fallback ke published_at. */
function itemDate(item: ContentItem): Date | null {
  const value = item.scheduled_at ?? item.published_at;
  return value ? parseISO(value) : null;
}

/** Card dengan stripe warna kiri per stage (Preset C); klik untuk expand inline. */
function ContentCard({ item }: { item: ContentItem }) {
  const [open, setOpen] = useState(false);
  const details: [string, string | null][] = [
    ["Angle", item.angle],
    ["Type", item.content_type],
    ["Source", [item.source_agent, item.source_cron_code].filter(Boolean).join(" · ") || null],
    ["Source file", item.source_file_path],
    ["Reviewer notes", item.reviewer_notes],
    ["Performance", item.performance_summary],
    ["Scheduled", item.scheduled_at ? format(parseISO(item.scheduled_at), "d MMM yyyy HH:mm") : null],
    ["Published", item.published_at ? format(parseISO(item.published_at), "d MMM yyyy HH:mm") : null],
  ];

  return (
    <li className={`rounded border border-l-4 border-gray-200 bg-white ${STAGE_STRIPE[item.stage]}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="block w-full p-3 text-left text-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs text-gray-500">{item.code}</span>
          <Badge tone={STATUS_TONE[item.status] ?? "gray"}>{item.status.replace("_", " ")}</Badge>
        </div>
        <p className="mt-1 font-medium">{item.title_final ?? item.title}</p>
        <p className="mt-1 text-xs text-gray-500">
          {channelLabel(item.channel)} · {item.content_type}
        </p>
        {!open && <p className="mt-1 text-xs text-gray-600">{truncate(item.body_preview, 90)}</p>}
      </button>
      {open && (
        <div className="border-t border-gray-200 p-3 text-xs">
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
      )}
    </li>
  );
}

function KanbanBoard({ items }: { items: ContentItem[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const columns = STAGES.filter((s) => s.stage !== "archived" || showArchived);
  const archivedCount = items.filter((i) => i.stage === "archived").length;

  return (
    <>
      {/* Mobile: kolom di-scroll horizontal; desktop: grid */}
      <div
        className={`-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:overflow-visible md:px-0 ${
          showArchived ? "md:grid-cols-6" : "md:grid-cols-5"
        }`}
      >
        {columns.map(({ stage, label }) => {
          const rows = items.filter((i) => i.stage === stage);
          return (
            <section key={stage} className="w-72 shrink-0 snap-start md:w-auto">
              <h2 className="mb-2 flex items-center justify-between text-xs font-medium uppercase text-gray-500">
                {label}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{rows.length}</span>
              </h2>
              {rows.length === 0 ? (
                <p className="rounded border border-dashed border-gray-200 p-3 text-xs text-gray-400">
                  Kosong
                </p>
              ) : (
                <ul className="space-y-2">
                  {rows.map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setShowArchived((v) => !v)}
        className="mt-3 text-xs text-gray-500 underline"
      >
        {showArchived ? "Sembunyikan" : "Tampilkan"} Archived ({archivedCount})
      </button>
    </>
  );
}

function CalendarView({ items }: { items: ContentItem[] }) {
  const dated = useMemo(
    () => items.flatMap((item) => { const date = itemDate(item); return date ? [{ item, date }] : []; }),
    [items],
  );
  const undated = useMemo(() => items.filter((item) => !itemDate(item)), [items]);

  // Buka di bulan konten terbaru supaya kalender tidak kosong saat data lama.
  const [month, setMonth] = useState(() => {
    const latest = dated.reduce<Date | null>((a, d) => (!a || d.date > a ? d.date : a), null);
    return startOfMonth(latest ?? new Date());
  });
  const [selected, setSelected] = useState<Date | null>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const forDay = (day: Date) => dated.filter((d) => isSameDay(d.date, day)).map((d) => d.item);
  const selectedItems = selected ? forDay(selected) : [];

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          aria-label="Bulan sebelumnya"
          className="rounded border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50"
        >
          ←
        </button>
        <h2 className="font-medium">{format(month, "MMMM yyyy")}</h2>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="Bulan berikutnya"
          className="rounded border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded border border-gray-200 bg-gray-200 text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-gray-50 px-1 py-1 text-center font-medium text-gray-500">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const rows = forDay(day);
          const isSelected = selected !== null && isSameDay(day, selected);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelected(day)}
              aria-pressed={isSelected}
              className={`min-h-14 bg-white p-1 text-left align-top hover:bg-gray-50 md:min-h-20 ${
                isSameMonth(day, month) ? "" : "text-gray-300"
              } ${isSelected ? "ring-2 ring-inset ring-gray-900" : ""}`}
            >
              <span className="block">{format(day, "d")}</span>
              {/* Mobile: titik per konten; desktop: chip judul */}
              <span className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                {rows.map((r) => (
                  <span key={r.id} className="h-2 w-2 rounded-full bg-gray-700" />
                ))}
              </span>
              <span className="mt-1 hidden space-y-0.5 md:block">
                {rows.slice(0, 2).map((r) => (
                  <span
                    key={r.id}
                    className={`block truncate rounded border-l-4 bg-gray-50 px-1 ${STAGE_STRIPE[r.stage]}`}
                  >
                    {r.title_final ?? r.title}
                  </span>
                ))}
                {rows.length > 2 && <span className="block text-gray-500">+{rows.length - 2}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <section className="mt-4">
          <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
            {format(selected, "d MMMM yyyy")} · {selectedItems.length}
          </h3>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada konten di tanggal ini.</p>
          ) : (
            <ul className="space-y-2">
              {selectedItems.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-medium uppercase text-gray-500">
          Undated (belum dijadwalkan) · {undated.length}
        </h3>
        {undated.length === 0 ? (
          <p className="text-sm text-gray-500">Semua konten punya tanggal.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {undated.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function ContentView() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("content_pipeline")
      .select("*")
      .order("created_at", { ascending: false })
      .order("code", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setItems((data ?? []) as ContentItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const channelOptions = useMemo(() => {
    const channels = [...new Set(items.map((i) => i.channel))].sort();
    return [
      { value: "all", label: "All" },
      ...channels.map((c) => ({ value: c, label: channelLabel(c) })),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (channelFilter === "all" || item.channel === channelFilter) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (!q ||
          item.title.toLowerCase().includes(q) ||
          (item.title_final ?? "").toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.tags ?? []).some((t) => t.toLowerCase().includes(q))),
    );
  }, [items, channelFilter, statusFilter, search]);

  const count = (stage: ContentStage) => items.filter((i) => i.stage === stage).length;

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Content Pipeline</h1>
        <p className="text-sm text-gray-500">
          {loading && items.length === 0
            ? "Loading…"
            : `${count("idea")} idea, ${count("draft")} draft, ${count("published")} published`}
        </p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total" value={items.length} />
            <SummaryCard label="Ideas" value={count("idea")} />
            <SummaryCard label="In Draft" value={count("draft")} />
            <SummaryCard label="Published" value={count("published")} />
          </section>

          <section className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <FilterButtons label="View" options={VIEW_OPTIONS} value={view} onChange={setView} />
              <SearchInput value={search} onChange={setSearch} placeholder="Search title, code, tag…" />
            </div>
            <FilterButtons
              label="Channel"
              options={channelOptions}
              value={channelFilter}
              onChange={setChannelFilter}
            />
            <FilterButtons
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </section>

          {filtered.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No content found.
            </p>
          ) : view === "kanban" ? (
            <KanbanBoard items={filtered} />
          ) : (
            <CalendarView items={filtered} />
          )}
        </>
      )}
    </main>
  );
}
