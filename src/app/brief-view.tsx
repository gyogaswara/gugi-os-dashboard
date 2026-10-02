"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO, subDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Agent, AgentExecution, ContentItem, CronJob } from "@/lib/types";
import ActionButtons from "@/components/action-buttons";
import { cronActions, executionActions } from "@/lib/prompts";
import {
  Badge,
  type BadgeTone,
  ErrorState,
  SkeletonRows,
  SummaryCard,
} from "@/components/dashboard-ui";

type BriefData = {
  crons: CronJob[];
  agents: Agent[];
  executions: AgentExecution[];
  content: ContentItem[];
};

const EXEC_TONE: Record<AgentExecution["status"], BadgeTone> = {
  ok: "green",
  error: "red",
  running: "blue",
  unknown: "gray",
};

function ago(value: string): string {
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

function jakartaParts(now: Date): { greeting: string; date: string } {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Jakarta" }).format(now),
  );
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(now);
  return { greeting, date };
}

function whenJakarta(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(parseISO(value));
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <h2 className="text-xs font-medium uppercase text-gray-500">{title}</h2>
        <Link href={href} className="text-xs text-gray-500 underline">
          Lihat semua
        </Link>
      </div>
      <div className="p-4 text-sm">{children}</div>
    </section>
  );
}

export default function BriefView() {
  const [data, setData] = useState<BriefData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [crons, agents, executions, content] = await Promise.all([
      supabase.from("cron_jobs").select("*").order("code"),
      supabase.from("agents").select("*"),
      supabase.from("agent_executions").select("*").order("started_at", { ascending: false }).limit(100),
      supabase.from("content_pipeline").select("*").order("created_at", { ascending: false }),
    ]);
    const failed = [crons, agents, executions, content].find((r) => r.error);
    if (failed?.error) {
      setError(failed.error.message);
      return;
    }
    setData({
      crons: (crons.data ?? []) as CronJob[],
      agents: (agents.data ?? []) as Agent[],
      executions: (executions.data ?? []) as AgentExecution[],
      content: (content.data ?? []) as ContentItem[],
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const brief = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const failedCrons = data.crons.filter((c) => c.last_run_status === "failed");
    const errorExecs = data.executions.filter((e) => e.error_message);
    const staleNextRun = data.crons.filter(
      (c) => c.status === "active" && c.next_run_at && parseISO(c.next_run_at) < now,
    );
    const upcoming = data.crons
      .filter((c) => c.status === "active" && c.next_run_at && parseISO(c.next_run_at) >= now)
      .sort((a, b) => (a.next_run_at as string).localeCompare(b.next_run_at as string))
      .slice(0, 5);
    const since = subDays(now, 1).getTime();
    const last24h = data.executions.filter((e) => parseISO(e.started_at).getTime() > since);
    const stage = (s: ContentItem["stage"]) => data.content.filter((c) => c.stage === s);
    return {
      now,
      failedCrons,
      errorExecs,
      staleNextRun,
      upcoming,
      last24h,
      ideas: stage("idea"),
      drafts: stage("draft"),
      published: stage("published")
        .filter((c) => c.published_at)
        .sort((a, b) => (b.published_at as string).localeCompare(a.published_at as string)),
      attention: failedCrons.length + errorExecs.length + (staleNextRun.length > 0 ? 1 : 0),
    };
  }, [data]);

  const { greeting, date } = jakartaParts(brief?.now ?? new Date());

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{brief ? `${greeting}, Gugi` : "Today's Brief"}</h1>
        <p className="text-sm text-gray-500">{brief ? date : "Loading…"}</p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data || !brief ? (
        <SkeletonRows rows={5} />
      ) : (
        <div className="space-y-4">
          {brief.attention === 0 ? (
            <section className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              All clear. Tidak ada cron gagal atau eksekusi dengan error.
            </section>
          ) : (
            <section className="rounded border border-red-200 bg-red-50 p-4 text-sm">
              <h2 className="font-semibold text-red-800">Needs attention ({brief.attention})</h2>
              <ul className="mt-3 space-y-3">
                {brief.failedCrons.map((job) => (
                  <li key={job.id} className="space-y-2">
                    <p>
                      <Link href="/cron" className="font-medium underline">
                        {job.code} {job.name}
                      </Link>{" "}
                      — last run failed {job.last_run_at ? ago(job.last_run_at) : ""}
                    </p>
                    <ActionButtons actions={cronActions(job).filter((a) => a.id === "investigate-failure")} />
                  </li>
                ))}
                {brief.errorExecs.map((exec) => (
                  <li key={exec.id} className="space-y-2">
                    <p>
                      <Link href="/tasks" className="font-medium underline">
                        {exec.agent_name}
                        {exec.raw_cron_code ? ` · ${exec.raw_cron_code}` : ""}
                      </Link>{" "}
                      — {exec.error_message}{" "}
                      <span className="text-gray-500">({ago(exec.started_at)}, recorded as {exec.status})</span>
                    </p>
                    <ActionButtons actions={executionActions(exec)} />
                  </li>
                ))}
                {brief.staleNextRun.length > 0 && (
                  <li className="text-gray-700">
                    <Link href="/cron" className="font-medium underline">
                      {brief.staleNextRun.length} active cron
                    </Link>{" "}
                    punya next_run_at yang sudah lewat. Hermes belum me-refresh kolom ini, jadi jadwal
                    berikutnya di dashboard tidak akurat.
                  </li>
                )}
              </ul>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Link href="/cron">
              <SummaryCard
                label="Cron Jobs"
                value={
                  <>
                    {data.crons.filter((c) => c.status === "active").length}
                    <span className="ml-1 text-sm font-normal text-gray-500">
                      active / {data.crons.filter((c) => c.status === "paused").length} paused
                    </span>
                  </>
                }
              />
            </Link>
            <Link href="/agents">
              <SummaryCard
                label="Agents"
                value={
                  <>
                    {data.agents.filter((a) => a.status === "active").length}
                    <span className="ml-1 text-sm font-normal text-gray-500">
                      active / {data.agents.filter((a) => a.status === "idle").length} idle
                    </span>
                  </>
                }
              />
            </Link>
            <Link href="/tasks">
              <SummaryCard
                label="Executions 24h"
                value={
                  <>
                    {brief.last24h.length}
                    <span className="ml-1 text-sm font-normal text-gray-500">
                      / {brief.last24h.filter((e) => e.error_message).length} with error
                    </span>
                  </>
                }
              />
            </Link>
            <Link href="/content">
              <SummaryCard
                label="Content"
                value={
                  <>
                    {brief.ideas.length}
                    <span className="ml-1 text-sm font-normal text-gray-500">
                      ideas / {brief.drafts.length} draft
                    </span>
                  </>
                }
              />
            </Link>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Upcoming crons" href="/cron">
              {brief.upcoming.length === 0 ? (
                <p className="text-gray-500">
                  Tidak ada jadwal mendatang yang tercatat (next_run_at kosong atau sudah lewat).
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {brief.upcoming.map((job) => (
                    <li key={job.id} className="flex items-baseline justify-between gap-3 py-1.5">
                      <span>
                        <span className="font-mono text-xs text-gray-500">{job.code}</span> {job.name}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        {whenJakarta(job.next_run_at as string)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Recent executions" href="/tasks">
              <ul className="divide-y divide-gray-100">
                {data.executions.slice(0, 5).map((exec) => (
                  <li key={exec.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span>
                      {exec.agent_name}
                      {exec.raw_cron_code && (
                        <span className="ml-1 font-mono text-xs text-gray-500">{exec.raw_cron_code}</span>
                      )}
                      <span className="ml-2 text-xs text-gray-500">{ago(exec.started_at)}</span>
                    </span>
                    <Badge tone={EXEC_TONE[exec.status]}>{exec.status}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Content pipeline" href="/content">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    In draft ({brief.drafts.length})
                  </p>
                  {brief.drafts.length === 0 ? (
                    <p className="text-gray-500">Tidak ada draft berjalan.</p>
                  ) : (
                    brief.drafts.map((c) => (
                      <p key={c.id}>
                        <span className="font-mono text-xs text-gray-500">{c.code}</span> {c.title_final ?? c.title}
                      </p>
                    ))
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Ideas waiting ({brief.ideas.length})
                  </p>
                  {brief.ideas.slice(0, 3).map((c) => (
                    <p key={c.id}>
                      <span className="font-mono text-xs text-gray-500">{c.code}</span> {c.title_final ?? c.title}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Last published</p>
                  {brief.published.slice(0, 2).map((c) => (
                    <p key={c.id}>
                      <span className="font-mono text-xs text-gray-500">{c.code}</span> {c.title_final ?? c.title}
                      <span className="ml-2 text-xs text-gray-500">{ago(c.published_at as string)}</span>
                    </p>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Agents" href="/agents">
              <ul className="divide-y divide-gray-100">
                {data.agents
                  .filter((a) => a.status === "active")
                  .map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-1.5">
                      <span>
                        <span className="font-mono text-xs text-gray-500">{a.agent_code}</span> {a.agent_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {a.last_run_at ? `last run ${ago(a.last_run_at)}` : "never ran"}
                      </span>
                    </li>
                  ))}
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                {data.agents.filter((a) => a.status === "idle").length} idle,{" "}
                {data.agents.filter((a) => a.status === "deprecated").length} deprecated
              </p>
            </Panel>
          </div>
        </div>
      )}
    </main>
  );
}
