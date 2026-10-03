"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import type { ContentItem, ContentTopic } from "@/lib/types";
import ActionButtons from "@/components/action-buttons";
import BulkActionBar from "@/components/bulk-action-bar";
import { contentBulkActions } from "@/lib/bulk-prompts";
import { grokBulkActions } from "@/lib/grok-prompts";
import {
  Badge,
  ErrorState,
  FilterButtons,
  SearchInput,
  SkeletonRows,
  SummaryCard,
} from "@/components/dashboard-ui";
import {
  COLUMNS,
  COLUMN_LABEL,
  ContentCard,
  ContentDetail,
  STATUS_TONE,
  TopicCard,
  actionsFor,
  channelLabel,
  columnOf,
  itemDate,
  producerOf,
  type ColumnId,
} from "./content-parts";

type ViewMode = "kanban" | "calendar" | "list";
type ProducerFilter = "all" | "hermes" | "grok";

const STRIPE = Object.fromEntries(COLUMNS.map((c) => [c.id, c.stripe])) as Record<ColumnId, string>;

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "kanban", label: "Kanban" },
  { value: "calendar", label: "Kalender" },
  { value: "list", label: "List" },
];

const PRODUCER_OPTIONS: { value: ProducerFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hermes", label: "Hermes" },
  { value: "grok", label: "Grok" },
];

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function KanbanBoard({
  items,
  topics,
  showTopics,
  picked,
  onPick,
  onPickMany,
}: {
  items: ContentItem[];
  topics: ContentTopic[];
  showTopics: boolean;
  picked: Set<string>;
  onPick: (id: string) => void;
  onPickMany: (ids: string[]) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const columns = COLUMNS.filter(
    (c) => (c.id !== "archived" || showArchived) && (c.id !== "topics" || showTopics),
  );
  const archivedCount = items.filter((i) => columnOf(i) === "archived").length;

  return (
    <>
      {/* 8 kolom terlalu lebar buat grid: scroll horizontal di semua ukuran */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {columns.map(({ id, label }) => {
          const isTopics = id === "topics";
          const rows = isTopics ? [] : items.filter((i) => columnOf(i) === id);
          const selectable = rows;
          const count = isTopics ? topics.length : rows.length;
          return (
            <section key={id} className="w-72 shrink-0 snap-start">
              <h2 className="mb-2 flex items-center justify-between text-xs font-medium uppercase text-gray-500">
                <label className="flex items-center gap-2">
                  {selectable.length > 0 && (
                    <input
                      type="checkbox"
                      aria-label={`Pilih semua ${label}`}
                      checked={selectable.every((r) => picked.has(r.id))}
                      onChange={() => onPickMany(selectable.map((r) => r.id))}
                      className="h-4 w-4 cursor-pointer"
                    />
                  )}
                  {label}
                </label>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{count}</span>
              </h2>
              {count === 0 ? (
                <p className="rounded border border-dashed border-gray-200 p-3 text-xs text-gray-400">Kosong</p>
              ) : (
                <ul className="space-y-2">
                  {isTopics
                    ? topics.map((t) => <TopicCard key={t.id} topic={t} />)
                    : rows.map((item) => (
                        <ContentCard key={item.id} item={item} picked={picked.has(item.id)} onPick={onPick} />
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

function CalendarView({
  items,
  picked,
  onPick,
}: {
  items: ContentItem[];
  picked: Set<string>;
  onPick: (id: string) => void;
}) {
  const dated = useMemo(
    () =>
      items.flatMap((item) => {
        const date = itemDate(item);
        return date ? [{ item, date }] : [];
      }),
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
                    className={`block truncate rounded border-l-4 bg-gray-50 px-1 ${STRIPE[columnOf(r)]}`}
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
                <ContentCard key={item.id} item={item} picked={picked.has(item.id)} onPick={onPick} />
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
              <ContentCard key={item.id} item={item} picked={picked.has(item.id)} onPick={onPick} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** List: tabel di desktop (klik row untuk expand), card di mobile. */
function ListView({
  items,
  picked,
  onPick,
}: {
  items: ContentItem[];
  picked: Set<string>;
  onPick: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <>
      <div className="hidden overflow-x-auto rounded border border-gray-200 bg-white md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Channel</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Via</th>
              <th className="px-3 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => {
              const date = itemDate(item);
              const actions = actionsFor(item);
              return (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => toggle(item.id)}
                    aria-expanded={expandedId === item.id}
                    className={`cursor-pointer hover:bg-gray-50 ${picked.has(item.id) ? "bg-gray-50" : ""}`}
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={picked.has(item.id)}
                        onChange={() => onPick(item.id)}
                        aria-label={`Pilih ${item.code}`}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{item.code}</td>
                    <td className="px-3 py-2">{item.title_final ?? item.title}</td>
                    <td className="px-3 py-2 capitalize">{channelLabel(item.channel)}</td>
                    <td className="px-3 py-2">{COLUMN_LABEL[columnOf(item)]}</td>
                    <td className="px-3 py-2">
                      <Badge tone={STATUS_TONE[item.status] ?? "gray"}>{item.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{producerOf(item)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {date ? format(date, "d MMM yyyy") : "—"}
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-4 py-3">
                        <ContentDetail item={item} />
                        {actions.length > 0 && (
                          <div className="mt-3">
                            <ActionButtons actions={actions} />
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} picked={picked.has(item.id)} onPick={onPick} />
        ))}
      </ul>
    </>
  );
}

export default function ContentView() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [producerFilter, setProducerFilter] = useState<ProducerFilter>("all");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [pipeline, topicRows] = await Promise.all([
      supabase
        .from("content_pipeline")
        .select("*")
        .order("created_at", { ascending: false })
        .order("code", { ascending: false }),
      supabase
        .from("content_topics")
        .select("*")
        .eq("status", "fresh")
        .order("researched_at", { ascending: false, nullsFirst: false }),
    ]);

    if (pipeline.error) {
      setError(pipeline.error.message);
    } else {
      setItems((pipeline.data ?? []) as ContentItem[]);
    }
    // Topics opsional: kalau gagal, pipeline tetap tampil dan kolom Topics kosong.
    setTopicsError(topicRows.error ? topicRows.error.message : null);
    setTopics(topicRows.error ? [] : ((topicRows.data ?? []) as ContentTopic[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const channelOptions = useMemo(() => {
    const channels = [...new Set(items.map((i) => i.channel))].sort();
    return [{ value: "all", label: "All" }, ...channels.map((c) => ({ value: c, label: channelLabel(c) }))];
  }, [items]);

  const statusOptions = useMemo(() => {
    const statuses = [...new Set(items.map((i) => i.status))].sort();
    return [{ value: "all", label: "All" }, ...statuses.map((st) => ({ value: st, label: st.replace(/_/g, " ") }))];
  }, [items]);

  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (channelFilter === "all" || item.channel === channelFilter) &&
          (statusFilter === "all" || item.status === statusFilter) &&
          (producerFilter === "all" || producerOf(item) === producerFilter) &&
          (!q ||
            item.title.toLowerCase().includes(q) ||
            (item.title_final ?? "").toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            (item.tags ?? []).some((t) => t.toLowerCase().includes(q))),
      ),
    [items, channelFilter, statusFilter, producerFilter, q],
  );

  // Topics berasal dari Sandi/Grok: disembunyikan kalau filter Hermes, dan tidak
  // ikut filter channel (topik belum punya channel).
  const showTopics = producerFilter !== "hermes";
  const filteredTopics = useMemo(
    () =>
      showTopics
        ? topics.filter(
            (t) =>
              !q ||
              t.topic.toLowerCase().includes(q) ||
              (t.category ?? "").toLowerCase().includes(q) ||
              (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
          )
        : [],
    [topics, showTopics, q],
  );

  const togglePick = (id: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  // Kalau semua sudah terpilih, klik lagi melepas semuanya; selain itu pilih semua.
  const togglePickMany = (ids: string[]) =>
    setPicked((current) => {
      const next = new Set(current);
      const allPicked = ids.every((id) => next.has(id));
      ids.forEach((id) => (allPicked ? next.delete(id) : next.add(id)));
      return next;
    });

  // Yang dihitung cuma item yang masih tampil di filter aktif, supaya prompt tidak
  // memuat konten yang tersembunyi.
  const pickedItems = useMemo(() => filtered.filter((i) => picked.has(i.id)), [filtered, picked]);

  // Aksi batch dipisah per produsen: prompt Hermes buat konten Hermes, prompt Grok buat
  // konten Grok. Kalau pilihan campur, label diberi awalan supaya tidak ketuker.
  const bulkActions = useMemo(() => {
    const hermes = pickedItems.filter((i) => producerOf(i) === "hermes");
    const grok = pickedItems.filter((i) => producerOf(i) === "grok");
    const mixed = hermes.length > 0 && grok.length > 0;
    const tag = (prefix: string, list: ReturnType<typeof contentBulkActions>) =>
      mixed ? list.map((a) => ({ ...a, label: `${prefix}: ${a.label}` })) : list;
    return [
      ...(hermes.length ? tag("Hermes", contentBulkActions(hermes)) : []),
      ...(grok.length ? tag("Grok", grokBulkActions(grok)) : []),
    ];
  }, [pickedItems]);

  const inColumn = (id: ColumnId) => items.filter((i) => columnOf(i) === id).length;
  const needsYou = inColumn("waiting") + inColumn("approval");

  return (
    <main className={`mx-auto max-w-6xl p-4 md:p-8 ${pickedItems.length > 0 ? "pb-44" : ""}`}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Content Pipeline</h1>
          <p className="text-sm text-gray-500">
            {loading && items.length === 0
              ? "Loading…"
              : `${topics.length} topics, ${inColumn("ideas")} ideas, ${inColumn("drafting")} drafting, ${inColumn("published")} published`}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/content-stream" className="rounded border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50">
            Content Stream
          </Link>
          <Link href="/topics" className="rounded border border-gray-200 bg-white px-3 py-1.5 hover:bg-gray-50">
            Topics
          </Link>
        </div>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total" value={items.length} />
            <SummaryCard label="Fresh Topics" value={topics.length} />
            <SummaryCard label="Needs You" value={needsYou} />
            <SummaryCard label="Published" value={inColumn("published")} />
          </section>

          <section className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <FilterButtons label="View" options={VIEW_OPTIONS} value={view} onChange={setView} />
              <SearchInput value={search} onChange={setSearch} placeholder="Search title, code, tag…" />
            </div>
            <FilterButtons label="Channel" options={channelOptions} value={channelFilter} onChange={setChannelFilter} />
            <FilterButtons label="Status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
            <FilterButtons label="Producer" options={PRODUCER_OPTIONS} value={producerFilter} onChange={setProducerFilter} />
          </section>

          {topicsError && (
            <p className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
              Kolom Topics tidak bisa dimuat ({topicsError}). Pipeline tetap tampil.
            </p>
          )}

          {filtered.length === 0 && filteredTopics.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">No content found.</p>
          ) : view === "kanban" ? (
            <KanbanBoard
              items={filtered}
              topics={filteredTopics}
              showTopics={showTopics}
              picked={picked}
              onPick={togglePick}
              onPickMany={togglePickMany}
            />
          ) : view === "calendar" ? (
            <CalendarView items={filtered} picked={picked} onPick={togglePick} />
          ) : (
            <ListView items={filtered} picked={picked} onPick={togglePick} />
          )}
        </>
      )}

      <BulkActionBar
        count={pickedItems.length}
        actions={bulkActions}
        onClear={() => setPicked(new Set())}
      />
    </main>
  );
}
