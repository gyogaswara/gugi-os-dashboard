"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  format,
  formatDistanceToNow,
  isThisWeek,
  isToday,
  isYesterday,
  parseISO,
  subDays,
  subWeeks,
  isSameWeek,
} from "date-fns";
import {
  ArrowUpRight,
  Crown,
  Image as ImageIcon,
  PenLine,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { GrokActivityLog, GrokActivityStatus, GrokActor } from "@/lib/types";
import {
  Badge,
  type BadgeTone,
  ErrorState,
  FilterButtons,
  SkeletonRows,
  SummaryCard,
} from "@/components/dashboard-ui";

type ActorFilter = "all" | GrokActor;
type StatusFilter = "all" | GrokActivityStatus;
type RangeFilter = "today" | "7d" | "30d";

const ACTOR_META: Record<GrokActor, { label: string; role: string; icon: LucideIcon }> = {
  sandi: { label: "Sandi", role: "research", icon: Search },
  warta: { label: "Warta", role: "writer", icon: PenLine },
  rupa: { label: "Rupa", role: "visual", icon: ImageIcon },
  user: { label: "You", role: "Gugi", icon: User },
  chief_of_staff: { label: "Chief of Staff", role: "orchestrator", icon: Crown },
};

const STATUS_TONE: Record<GrokActivityStatus, BadgeTone> = {
  completed: "green",
  in_progress: "blue",
  pending_approval: "amber",
  failed: "red",
  skipped: "gray",
};

const ACTOR_OPTIONS: { value: ActorFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sandi", label: "Sandi" },
  { value: "warta", label: "Warta" },
  { value: "rupa", label: "Rupa" },
  { value: "user", label: "User" },
  { value: "chief_of_staff", label: "Chief of Staff" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
];

const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const GROUP_ORDER = ["Today", "Yesterday", "Earlier this week", "Last week", "Older"];

function rangeStart(range: RangeFilter, now: Date): Date {
  if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return subDays(now, range === "7d" ? 7 : 30);
}

function groupLabel(date: Date, now: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "Earlier this week";
  if (isSameWeek(date, subWeeks(now, 1), { weekStartsOn: 1 })) return "Last week";
  return "Older";
}

function ActorIcon({ actor }: { actor: GrokActor }) {
  const meta = ACTOR_META[actor] ?? ACTOR_META.user;
  const Icon = meta.icon;
  return (
    <span
      title={`${meta.label} (${meta.role})`}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700"
    >
      <Icon size={16} aria-hidden />
    </span>
  );
}

/** Link dari database cuma dipakai kalau http(s), supaya URL javascript: tidak bisa lolos. */
function safeUrl(url: string | null): string | null {
  return url !== null && /^https?:\/\//i.test(url) ? url : null;
}

/** Kartu mencolok: aktivitas yang menunggu tindakan Gugi. */
function ActionCard({ log }: { log: GrokActivityLog }) {
  const link = safeUrl(log.user_action_url);
  const meta = ACTOR_META[log.actor] ?? ACTOR_META.user;
  const body = (
    <div className="flex items-start gap-3">
      <ActorIcon actor={log.actor} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-950">
          {meta.label}: {log.action}
        </p>
        {log.subject && <p className="mt-0.5 text-sm text-amber-900">{log.subject}</p>}
        <p className="mt-1 text-xs text-amber-800">
          {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
          {log.channel ? ` · ${log.channel.replace(/_/g, " ")}` : ""}
        </p>
      </div>
      {link && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-900 px-2.5 py-1.5 text-xs font-medium text-white">
          Buka di Grok
          <ArrowUpRight size={14} aria-hidden />
        </span>
      )}
    </div>
  );

  const cls = "block rounded border border-amber-300 bg-amber-50 p-4";
  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className={`${cls} hover:bg-amber-100`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function ActivityDetail({ log }: { log: GrokActivityLog }) {
  const items: [string, string | null][] = [
    ["Content ID", log.content_pipeline_id],
    ["Channel", log.channel],
    ["User response", log.user_response],
    [
      "Responded at",
      log.user_responded_at ? format(parseISO(log.user_responded_at), "d MMM yyyy HH:mm") : null,
    ],
    ["Action link", log.user_action_url],
  ];
  const hasPayload = log.payload && Object.keys(log.payload).length > 0;
  return (
    <div className="space-y-3 text-xs">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {items
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-gray-500">{label}</dt>
              <dd className="break-all">{value}</dd>
            </div>
          ))}
      </dl>
      {hasPayload && (
        <div>
          <p className="font-medium uppercase text-gray-500">Payload</p>
          <pre className="mt-1 overflow-x-auto rounded border border-gray-200 bg-white p-2 font-mono">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        </div>
      )}
      {!hasPayload && !items.some(([, v]) => v) && <p className="text-gray-500">Tidak ada detail tambahan.</p>}
    </div>
  );
}

export default function ContentStreamView() {
  const [logs, setLogs] = useState<GrokActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [range, setRange] = useState<RangeFilter>("30d");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("grok_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setError(error.message);
    } else {
      setLogs((data ?? []) as GrokActivityLog[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Belum dijawab = butuh tindakan dan belum ada user_responded_at. Section ini
  // tidak ikut filter di bawah: yang menunggu Gugi harus selalu kelihatan.
  const needsAction = useMemo(
    () => logs.filter((l) => l.requires_user_action && !l.user_responded_at),
    [logs],
  );

  const filtered = useMemo(() => {
    const start = rangeStart(range, new Date()).getTime();
    return logs.filter(
      (l) =>
        parseISO(l.created_at).getTime() >= start &&
        (actorFilter === "all" || l.actor === actorFilter) &&
        (statusFilter === "all" || l.status === statusFilter),
    );
  }, [logs, actorFilter, statusFilter, range]);

  const groups = useMemo(() => {
    const now = new Date();
    const map = new Map<string, GrokActivityLog[]>();
    for (const log of filtered) {
      const label = groupLabel(parseISO(log.created_at), now);
      map.set(label, [...(map.get(label) ?? []), log]);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ label: g, rows: map.get(g) ?? [] }));
  }, [filtered]);

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Content Stream</h1>
        <p className="text-sm text-gray-500">
          {loading && logs.length === 0
            ? "Loading…"
            : "Activity feed Grok: Sandi (research), Warta (writer), Rupa (visual)"}
        </p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Needs Your Action" value={needsAction.length} />
            <SummaryCard label="Activities" value={filtered.length} />
            <SummaryCard label="In Progress" value={filtered.filter((l) => l.status === "in_progress").length} />
            <SummaryCard label="Failed" value={filtered.filter((l) => l.status === "failed").length} />
          </section>

          {needsAction.length > 0 && (
            <section className="mb-6" aria-label="Needs your action">
              <h2 className="mb-2 text-xs font-medium uppercase text-amber-800">
                Needs your action ({needsAction.length})
              </h2>
              <div className="space-y-2">
                {needsAction.map((log) => (
                  <ActionCard key={log.id} log={log} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-4 flex flex-col gap-2">
            <FilterButtons label="Range" options={RANGE_OPTIONS} value={range} onChange={setRange} />
            <FilterButtons label="Actor" options={ACTOR_OPTIONS} value={actorFilter} onChange={setActorFilter} />
            <FilterButtons label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          </section>

          {filtered.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              {logs.length === 0
                ? "Belum ada aktivitas Grok tercatat. Feed ini terisi begitu Sandi, Warta, atau Rupa mulai menulis ke grok_activity_log."
                : "Tidak ada aktivitas yang cocok dengan filter."}
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.label}>
                  <h2 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    {group.label} · {group.rows.length}
                  </h2>
                  <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
                    {group.rows.map((log) => {
                      const meta = ACTOR_META[log.actor] ?? ACTOR_META.user;
                      return (
                        <li key={log.id}>
                          <button
                            type="button"
                            onClick={() => toggle(log.id)}
                            aria-expanded={expandedId === log.id}
                            className="flex w-full items-start gap-3 p-3 text-left hover:bg-gray-50"
                          >
                            <ActorIcon actor={log.actor} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{meta.label}</span>{" "}
                                <span className="text-gray-700">{log.action}</span>
                              </p>
                              {log.subject && <p className="mt-0.5 truncate text-sm text-gray-600">{log.subject}</p>}
                              <p className="mt-1 text-xs text-gray-500" title={log.created_at}>
                                {format(parseISO(log.created_at), "HH:mm")} ·{" "}
                                {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                                {log.channel ? ` · ${log.channel.replace(/_/g, " ")}` : ""}
                              </p>
                            </div>
                            <Badge tone={STATUS_TONE[log.status] ?? "gray"}>{log.status.replace(/_/g, " ")}</Badge>
                          </button>
                          {expandedId === log.id && (
                            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                              <ActivityDetail log={log} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
