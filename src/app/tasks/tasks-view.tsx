"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import ActionButtons from "@/components/action-buttons";
import { executionActions } from "@/lib/prompts";
import type { AgentExecution } from "@/lib/types";
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

type TypeFilter = "all" | AgentExecution["execution_type"];
type StatusFilter = "all" | AgentExecution["status"];

const TYPE_TONE: Record<AgentExecution["execution_type"], BadgeTone> = {
  cron: "blue",
  chat: "purple",
  chain: "amber",
  manual: "gray",
};

const STATUS_TONE: Record<AgentExecution["status"], BadgeTone> = {
  ok: "green",
  error: "red",
  running: "blue",
  unknown: "gray",
};

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cron", label: "Cron" },
  { value: "chat", label: "Chat" },
  { value: "chain", label: "Chain" },
  { value: "manual", label: "Manual" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ok", label: "OK" },
  { value: "error", label: "Error" },
  { value: "running", label: "Running" },
  { value: "unknown", label: "Unknown" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startedAgo(value: string): string {
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

function source(execution: AgentExecution): string {
  return execution.execution_type === "cron" && execution.raw_cron_code
    ? execution.raw_cron_code
    : "—";
}

function output(execution: AgentExecution): string {
  const parts = [execution.delivery_channel, execution.output_destination].filter(Boolean);
  return parts.length ? truncate(parts.join(" · "), 40) : "—";
}

/** Detail yang muncul saat row di-expand. */
function ExecutionDetail({ execution }: { execution: AgentExecution }) {
  const items: [string, string | null][] = [
    ["Schedule", execution.schedule_human],
    ["Skills", execution.skills_used?.length ? execution.skills_used.join(", ") : null],
    ["Context from", execution.context_from?.length ? execution.context_from.join(", ") : null],
    ["Error", execution.error_message],
    ["Hermes job ID", execution.hermes_job_id],
  ];
  return (
    <>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
        {items.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd className={`break-all ${label === "Error" && value ? "text-red-700" : ""}`}>
              {value ?? "—"}
            </dd>
          </Fragment>
        ))}
      </dl>
      <div className="mt-3">
        <ActionButtons actions={executionActions(execution)} />
      </div>
    </>
  );
}

export default function TasksView() {
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("agent_executions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
    } else {
      setExecutions((data ?? []) as AgentExecution[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = executions.length;
    const ok = executions.filter((e) => e.status === "ok").length;
    const errors = executions.filter((e) => e.status === "error").length;
    const since = Date.now() - DAY_MS;
    const last24h = executions.filter((e) => parseISO(e.started_at).getTime() > since).length;
    const successRate = total ? Math.round((ok / total) * 100) : 0;
    return { total, errors, last24h, successRate };
  }, [executions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return executions.filter(
      (e) =>
        (typeFilter === "all" || e.execution_type === typeFilter) &&
        (statusFilter === "all" || e.status === statusFilter) &&
        (!q || e.agent_name.toLowerCase().includes(q)),
    );
  }, [executions, typeFilter, statusFilter, search]);

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Execution Log</h1>
        <p className="text-sm text-gray-500">
          {loading && executions.length === 0
            ? "Loading…"
            : `Last 100 executions, ${stats.successRate}% success`}
        </p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Total Executions" value={stats.total} />
            <SummaryCard label="Success Rate" value={`${stats.successRate}%`} />
            <SummaryCard label="Errors" value={stats.errors} />
            <SummaryCard label="Last 24h" value={stats.last24h} />
          </section>

          <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <FilterButtons
                label="Type"
                options={TYPE_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
              />
              <FilterButtons
                label="Status"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search agent name…" />
          </section>

          {filtered.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No executions found.
            </p>
          ) : (
            <>
              {/* Desktop: tabel, klik row untuk expand detail */}
              <div className="hidden overflow-x-auto rounded border border-gray-200 bg-white md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Started At</th>
                      <th className="px-4 py-2 font-medium">Agent</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Source</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Output</th>
                      <th className="px-4 py-2 font-medium">Model</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((e) => (
                      <Fragment key={e.id}>
                        <tr
                          onClick={() => toggle(e.id)}
                          aria-expanded={expandedId === e.id}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 whitespace-nowrap" title={e.started_at}>
                            {startedAgo(e.started_at)}
                          </td>
                          <td className="px-4 py-2">{e.agent_name}</td>
                          <td className="px-4 py-2">
                            <Badge tone={TYPE_TONE[e.execution_type]}>{e.execution_type}</Badge>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{source(e)}</td>
                          <td className="px-4 py-2">
                            <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{output(e)}</td>
                          <td className="px-4 py-2">{e.model_used ?? "—"}</td>
                        </tr>
                        {expandedId === e.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-4 py-3">
                              <ExecutionDetail execution={e} />
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
                {filtered.map((e) => (
                  <li key={e.id} className="rounded border border-gray-200 bg-white text-sm">
                    <button
                      type="button"
                      onClick={() => toggle(e.id)}
                      aria-expanded={expandedId === e.id}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{e.agent_name}</p>
                          <p className="text-xs text-gray-500">{startedAgo(e.started_at)}</p>
                        </div>
                        <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Badge tone={TYPE_TONE[e.execution_type]}>{e.execution_type}</Badge>
                        <span className="font-mono">{source(e)}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">{output(e)}</p>
                    </button>
                    {expandedId === e.id && (
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                        <ExecutionDetail execution={e} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  );
}
