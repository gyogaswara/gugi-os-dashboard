"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { SyncLog } from "@/lib/types";
import SyncHealthIndicator from "@/components/sync-health-indicator";
import {
  Badge,
  type BadgeTone,
  ErrorState,
  FilterButtons,
  SkeletonRows,
  SummaryCard,
  truncate,
} from "@/components/dashboard-ui";

type TypeFilter = "all" | SyncLog["sync_type"];
type StatusFilter = "all" | SyncLog["status"];

const PAGE_SIZE = 25;

const TYPE_TONE: Record<SyncLog["sync_type"], BadgeTone> = { cron: "blue", manual: "purple" };
const STATUS_TONE: Record<SyncLog["status"], BadgeTone> = {
  success: "green",
  partial: "amber",
  failed: "red",
};

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cron", label: "Cron" },
  { value: "manual", label: "Manual" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
];

function startedAt(value: string): string {
  return `${format(parseISO(value), "d MMM yyyy HH:mm")} (${formatDistanceToNow(parseISO(value), { addSuffix: true })})`;
}

function rows(log: SyncLog): string {
  return `${log.total_rows_inserted ?? 0} / ${log.total_rows_updated ?? 0} / ${log.total_rows_skipped ?? 0}`;
}

function duration(log: SyncLog): string {
  return log.duration_seconds == null ? "—" : `${log.duration_seconds}s`;
}

function FailedTables({ log }: { log: SyncLog }) {
  const failed = log.tables_failed ?? [];
  if (failed.length === 0) return <>0</>;
  return (
    <span className="text-red-700" title={failed.join(", ")}>
      {failed.length}
    </span>
  );
}

/** Detail yang muncul saat row di-expand. */
function SyncDetail({ log }: { log: SyncLog }) {
  const items: [string, string | null][] = [
    ["Trigger", log.trigger_source],
    ["Completed", log.completed_at ? format(parseISO(log.completed_at), "d MMM yyyy HH:mm:ss") : null],
    ["Tables synced", log.tables_synced?.length ? log.tables_synced.join(", ") : null],
    ["Tables failed", log.tables_failed?.length ? log.tables_failed.join(", ") : null],
    ["Error", log.error_message],
  ];
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
  return (
    <div className="space-y-3 text-xs">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {items.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd className={`break-words ${label === "Error" && value ? "whitespace-pre-wrap text-red-700" : ""}`}>
              {value ?? "—"}
            </dd>
          </Fragment>
        ))}
      </dl>
      {hasMetadata && (
        <div>
          <p className="font-medium uppercase text-gray-500">Metadata</p>
          <pre className="mt-1 overflow-x-auto rounded border border-gray-200 bg-white p-2 font-mono">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function SyncLogView() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("sync_log")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(200);

    if (error) {
      setError(error.message);
    } else {
      setLogs((data ?? []) as SyncLog[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      logs.filter(
        (log) =>
          (typeFilter === "all" || log.sync_type === typeFilter) &&
          (statusFilter === "all" || log.status === statusFilter),
      ),
    [logs, typeFilter, statusFilter],
  );
  const shown = filtered.slice(0, visible);

  const stats = useMemo(() => {
    const success = logs.filter((l) => l.status === "success").length;
    return {
      total: logs.length,
      success,
      problems: logs.length - success,
      rate: logs.length ? Math.round((success / logs.length) * 100) : 0,
    };
  }, [logs]);

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sync Log</h1>
          <p className="text-sm text-gray-500">
            {loading && logs.length === 0
              ? "Loading…"
              : "Heartbeat sync Hermes → Supabase. Rows: inserted / updated / skipped."}
          </p>
        </div>
        <SyncHealthIndicator />
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Total Syncs" value={stats.total} />
            <SummaryCard label="Success Rate" value={`${stats.rate}%`} />
            <SummaryCard label="Success" value={stats.success} />
            <SummaryCard label="Partial / Failed" value={stats.problems} />
          </section>

          <section className="mb-4 flex flex-col gap-2">
            <FilterButtons
              label="Type"
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setVisible(PAGE_SIZE);
              }}
            />
            <FilterButtons
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setVisible(PAGE_SIZE);
              }}
            />
          </section>

          {filtered.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              {logs.length === 0
                ? "Belum ada sync tercatat. Sync cron jalan harian jam 06:00 WIB, atau trigger manual lewat Hermes."
                : "No sync logs match the filter."}
            </p>
          ) : (
            <>
              {/* Desktop: tabel, klik row untuk expand detail */}
              <div className="hidden overflow-x-auto rounded border border-gray-200 bg-white md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Started At</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 text-right font-medium">Synced</th>
                      <th className="px-4 py-2 text-right font-medium">Failed</th>
                      <th className="px-4 py-2 font-medium">Rows I/U/S</th>
                      <th className="px-4 py-2 text-right font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {shown.map((log) => (
                      <Fragment key={log.id}>
                        <tr
                          onClick={() => toggle(log.id)}
                          aria-expanded={expandedId === log.id}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 whitespace-nowrap">{startedAt(log.started_at)}</td>
                          <td className="px-4 py-2">
                            <Badge tone={TYPE_TONE[log.sync_type]}>{log.sync_type}</Badge>
                          </td>
                          <td className="px-4 py-2">
                            <Badge tone={STATUS_TONE[log.status]}>{log.status}</Badge>
                          </td>
                          <td className="px-4 py-2 text-right">{log.tables_synced?.length ?? 0}</td>
                          <td className="px-4 py-2 text-right">
                            <FailedTables log={log} />
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{rows(log)}</td>
                          <td className="px-4 py-2 text-right">{duration(log)}</td>
                          <td className="px-4 py-2 text-red-700">{truncate(log.error_message, 40)}</td>
                        </tr>
                        {expandedId === log.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={8} className="px-4 py-3">
                              <SyncDetail log={log} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: card view, tap untuk expand detail */}
              <ul className="space-y-3 md:hidden">
                {shown.map((log) => (
                  <li key={log.id} className="rounded border border-gray-200 bg-white text-sm">
                    <button
                      type="button"
                      onClick={() => toggle(log.id)}
                      aria-expanded={expandedId === log.id}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={TYPE_TONE[log.sync_type]}>{log.sync_type}</Badge>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(parseISO(log.started_at), { addSuffix: true })}
                          </span>
                        </div>
                        <Badge tone={STATUS_TONE[log.status]}>{log.status}</Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <dt className="text-gray-500">Tables synced / failed</dt>
                        <dd>
                          {log.tables_synced?.length ?? 0} / <FailedTables log={log} />
                        </dd>
                        <dt className="text-gray-500">Rows I/U/S</dt>
                        <dd className="font-mono">{rows(log)}</dd>
                        <dt className="text-gray-500">Duration</dt>
                        <dd>{duration(log)}</dd>
                      </dl>
                      {log.error_message && (
                        <p className="mt-2 text-xs text-red-700">{truncate(log.error_message, 80)}</p>
                      )}
                    </button>
                    {expandedId === log.id && (
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                        <SyncDetail log={log} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {filtered.length > visible && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="mt-4 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Show more ({filtered.length - visible} remaining)
                </button>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
