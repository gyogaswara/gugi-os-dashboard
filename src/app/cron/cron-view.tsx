"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { CronJob, CronJobCategory, CronJobStatus } from "@/lib/types";
import ActionButtons, { ActionMenu } from "@/components/action-buttons";
import { cronActions } from "@/lib/prompts";
import {
  Badge,
  type BadgeTone,
  ErrorState,
  FilterButtons,
  SearchInput,
  SkeletonRows,
  SummaryCard,
} from "@/components/dashboard-ui";

type CategoryFilter = "all" | CronJobCategory;
type StatusFilter = "all" | CronJobStatus;

const STATUS_TONE: Record<CronJobStatus, BadgeTone> = {
  active: "green",
  paused: "amber",
  error: "red",
  completed: "gray",
};

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "levner", label: "Levner" },
  { value: "academy", label: "Academy" },
  { value: "esg", label: "ESG" },
  { value: "personal", label: "Personal" },
  { value: "bunda", label: "Bunda" },
  { value: "completed", label: "Completed" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "error", label: "Error" },
  { value: "completed", label: "Completed" },
];

const RUN_STATUS_TEXT: Record<string, string> = {
  success: "text-green-700",
  failed: "text-red-700",
  skipped: "text-gray-500",
};

function ago(value: string | null): string {
  return value ? formatDistanceToNow(parseISO(value), { addSuffix: true }) : "Never";
}

function LastRun({ job }: { job: CronJob }) {
  if (!job.last_run_at) return <>—</>;
  return (
    <>
      {ago(job.last_run_at)}
      {job.last_run_status && (
        <span className={`ml-2 text-xs ${RUN_STATUS_TEXT[job.last_run_status] ?? ""}`}>
          ({job.last_run_status})
        </span>
      )}
    </>
  );
}

/** Detail governance yang muncul saat row di-expand. */
function CronDetail({ job }: { job: CronJob }) {
  const longText: [string, string | null][] = [
    ["Description", job.description],
    ["Background", job.background],
    ["Input", job.input_detail],
    ["Process steps", job.process_steps],
    ["Output", job.output_detail],
    ["Notes", job.notes],
    ["Last error", job.last_run_error],
  ];
  const meta: [string, string | null][] = [
    ["Schedule", [job.schedule_human, job.schedule_cron].filter(Boolean).join(" · ") || null],
    ["Next run", job.next_run_at ? ago(job.next_run_at) : null],
    ["Model", job.model],
    ["Owner", job.owner],
    ["Hermes job ID", job.hermes_job_id],
    ["Review", `${job.review_frequency ?? "—"} · last reviewed ${job.last_reviewed_at ? ago(job.last_reviewed_at) : "never"}`],
    ["Skills", job.skills_used?.length ? job.skills_used.join(", ") : null],
    ["Tags", job.skill_tags?.length ? job.skill_tags.join(", ") : null],
  ];

  return (
    <div className="space-y-3 text-xs">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {meta.map(([label, value]) => (
          <Fragment key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd className="break-words">{value ?? "—"}</dd>
          </Fragment>
        ))}
      </dl>
      {longText
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <p className="font-medium uppercase text-gray-500">{label}</p>
            <p
              className={`mt-0.5 whitespace-pre-wrap ${label === "Last error" ? "text-red-700" : "text-gray-800"}`}
            >
              {value}
            </p>
          </div>
        ))}
    </div>
  );
}

export default function CronView() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("cron_jobs")
      .select("*")
      .order("code", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setJobs((data ?? []) as CronJob[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      active: jobs.filter((j) => j.status === "active").length,
      paused: jobs.filter((j) => j.status === "paused").length,
      failed: jobs.filter((j) => j.last_run_status === "failed").length,
    }),
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(
      (job) =>
        (categoryFilter === "all" || job.category === categoryFilter) &&
        (statusFilter === "all" || job.status === statusFilter) &&
        (!q ||
          job.name.toLowerCase().includes(q) ||
          job.code.toLowerCase().includes(q) ||
          (job.agent_name ?? "").toLowerCase().includes(q)),
    );
  }, [jobs, categoryFilter, statusFilter, search]);

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Cron Monitor</h1>
        <p className="text-sm text-gray-500">
          {loading && jobs.length === 0
            ? "Loading…"
            : `${jobs.length} scheduled jobs: ${counts.active} active, ${counts.paused} paused`}
        </p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={6} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Total Jobs" value={jobs.length} />
            <SummaryCard label="Active" value={counts.active} />
            <SummaryCard label="Paused" value={counts.paused} />
            <SummaryCard label="Last Run Failed" value={counts.failed} />
          </section>

          <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <FilterButtons
                label="Category"
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
              <FilterButtons
                label="Status"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, code, agent…" />
          </section>

          {filtered.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No cron jobs found.
            </p>
          ) : (
            <>
              {/* Desktop: tabel, klik row untuk expand governance detail */}
              <div className="hidden overflow-x-auto rounded border border-gray-200 bg-white md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Code</th>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Category</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Schedule</th>
                      <th className="px-4 py-2 font-medium">Agent</th>
                      <th className="px-4 py-2 font-medium">Last Run</th>
                      <th className="px-4 py-2 font-medium">Prompt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((job) => (
                      <Fragment key={job.id}>
                        <tr
                          onClick={() => toggle(job.id)}
                          aria-expanded={expandedId === job.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            job.status === "completed" ? "opacity-60" : ""
                          }`}
                        >
                          <td className="px-4 py-2 font-mono text-xs">{job.code}</td>
                          <td className="px-4 py-2">{job.name}</td>
                          <td className="px-4 py-2 capitalize">{job.category ?? "—"}</td>
                          <td className="px-4 py-2">
                            {job.status ? <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge> : "—"}
                          </td>
                          <td className="px-4 py-2">{job.schedule_human ?? "—"}</td>
                          <td className="px-4 py-2">{job.agent_name ?? "—"}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <LastRun job={job} />
                          </td>
                          <td className="px-4 py-2">
                            <ActionMenu actions={cronActions(job)} />
                          </td>
                        </tr>
                        {expandedId === job.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={8} className="px-4 py-3">
                              <CronDetail job={job} />
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
                {filtered.map((job) => (
                  <li
                    key={job.id}
                    className={`rounded border border-gray-200 bg-white text-sm ${
                      job.status === "completed" ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(job.id)}
                      aria-expanded={expandedId === job.id}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs text-gray-500">{job.code}</p>
                          <p className="font-medium">{job.name}</p>
                        </div>
                        {job.status && <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>}
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <dt className="text-gray-500">Category</dt>
                        <dd className="capitalize">{job.category ?? "—"}</dd>
                        <dt className="text-gray-500">Schedule</dt>
                        <dd>{job.schedule_human ?? "—"}</dd>
                        <dt className="text-gray-500">Agent</dt>
                        <dd>{job.agent_name ?? "—"}</dd>
                        <dt className="text-gray-500">Last Run</dt>
                        <dd>
                          <LastRun job={job} />
                        </dd>
                      </dl>
                    </button>
                    <div className="px-4 pb-4">
                      <ActionButtons actions={cronActions(job)} />
                    </div>
                    {expandedId === job.id && (
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                        <CronDetail job={job} />
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
