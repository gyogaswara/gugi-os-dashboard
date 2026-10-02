"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Agent } from "@/lib/types";
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

type StatusFilter = "all" | Agent["status"];

const STATUS_ORDER: Record<Agent["status"], number> = { active: 0, idle: 1, deprecated: 2 };

const STATUS_TONE: Record<Agent["status"], BadgeTone> = {
  active: "green",
  idle: "amber",
  deprecated: "gray",
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "idle", label: "Idle" },
  { value: "deprecated", label: "Deprecated" },
];

function lastRun(value: string | null): string {
  return value ? formatDistanceToNow(parseISO(value), { addSuffix: true }) : "Never";
}

export default function AgentsView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("last_run_at", { ascending: false, nullsFirst: false });

    if (error) {
      setError(error.message);
    } else {
      // Postgres mengurutkan text status secara alfabetis (active, deprecated, idle),
      // jadi urutan active → idle → deprecated dilakukan di sini. Sort JS stabil,
      // sehingga urutan last_run_at DESC dari query tetap terjaga di tiap status.
      const rows = ((data ?? []) as Agent[]).sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      );
      setAgents(rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { active: 0, idle: 0, deprecated: 0 };
    for (const agent of agents) c[agent.status] = (c[agent.status] ?? 0) + 1;
    return c;
  }, [agents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter(
      (agent) =>
        (statusFilter === "all" || agent.status === statusFilter) &&
        (!q || agent.agent_name.toLowerCase().includes(q)),
    );
  }, [agents, statusFilter, search]);

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <p className="text-sm text-gray-500">
          {loading && agents.length === 0
            ? "Loading…"
            : `${counts.active} active, ${counts.idle} idle, ${counts.deprecated} deprecated`}
        </p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label="Total Agents" value={agents.length} />
            <SummaryCard label="Active Agents" value={counts.active} />
            <SummaryCard label="Deprecated" value={counts.deprecated} />
          </section>

          <section className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <FilterButtons
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Search agent name…" />
          </section>

          {filtered.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No agents found.
            </p>
          ) : (
            <>
              {/* Desktop: tabel */}
              <div className="hidden overflow-x-auto rounded border border-gray-200 bg-white md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Agent</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Model</th>
                      <th className="px-4 py-2 font-medium">Scope</th>
                      <th className="px-4 py-2 text-right font-medium">Skills</th>
                      <th className="px-4 py-2 text-right font-medium">Cron</th>
                      <th className="px-4 py-2 font-medium">Last Run</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((agent) => (
                      <tr
                        key={agent.id}
                        className={agent.status === "deprecated" ? "opacity-60" : undefined}
                      >
                        <td className="px-4 py-2">
                          <span className="font-mono text-xs text-gray-500">{agent.agent_code}</span>
                          <span className="ml-2">{agent.agent_name}</span>
                        </td>
                        <td className="px-4 py-2">
                          <Badge tone={STATUS_TONE[agent.status]}>{agent.status}</Badge>
                        </td>
                        <td className="px-4 py-2">{agent.model ?? "—"}</td>
                        <td className="px-4 py-2 text-gray-600" title={agent.scope_description ?? undefined}>
                          {truncate(agent.scope_description, 50)}
                        </td>
                        <td className="px-4 py-2 text-right">{agent.skills_attached?.length ?? 0}</td>
                        <td className="px-4 py-2 text-right">{agent.cron_attached?.length ?? 0}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{lastRun(agent.last_run_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: card view */}
              <ul className="space-y-3 md:hidden">
                {filtered.map((agent) => (
                  <li
                    key={agent.id}
                    className={`rounded border border-gray-200 bg-white p-4 text-sm ${
                      agent.status === "deprecated" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-gray-500">{agent.agent_code}</p>
                        <p className="font-medium">{agent.agent_name}</p>
                      </div>
                      <Badge tone={STATUS_TONE[agent.status]}>{agent.status}</Badge>
                    </div>
                    <p className="mt-2 text-gray-600">{truncate(agent.scope_description, 50)}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <dt className="text-gray-500">Model</dt>
                      <dd>{agent.model ?? "—"}</dd>
                      <dt className="text-gray-500">Skills / Cron</dt>
                      <dd>
                        {agent.skills_attached?.length ?? 0} / {agent.cron_attached?.length ?? 0}
                      </dd>
                      <dt className="text-gray-500">Last Run</dt>
                      <dd>{lastRun(agent.last_run_at)}</dd>
                    </dl>
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
