import { formatDistanceToNow, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { CronJob } from "@/lib/types";

// Selalu render ulang per request supaya data monitoring tidak basi
// (tanpa ini Next.js bisa men-prerender halaman ini secara statis saat build).
export const dynamic = "force-dynamic";

type CronJobRow = Pick<
  CronJob,
  | "code"
  | "name"
  | "category"
  | "status"
  | "schedule_human"
  | "agent_name"
  | "last_run_at"
  | "last_run_status"
>;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-700",
};

const RUN_STATUS_STYLES: Record<string, string> = {
  success: "text-green-700",
  failed: "text-red-700",
  skipped: "text-gray-500",
};

export default async function CronPage() {
  const { data, error } = await supabase
    .from("cron_jobs")
    .select(
      "code, name, category, status, schedule_human, agent_name, last_run_at, last_run_status",
    )
    .order("code", { ascending: true });

  const jobs = (data ?? []) as CronJobRow[];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Cron Monitor</h1>
        <p className="text-sm text-gray-500">
          26 scheduled jobs across Levner, Academy, ESG, Personal, Bunda
        </p>
      </header>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Gagal mengambil data cron_jobs dari Supabase.</p>
          <p className="mt-1 font-mono">{error.message}</p>
          {error.hint && <p className="mt-1">Hint: {error.hint}</p>}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada data di tabel cron_jobs.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Schedule</th>
                <th className="px-4 py-2">Agent</th>
                <th className="px-4 py-2">Last Run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.code}>
                  <td className="px-4 py-2 font-mono">{job.code}</td>
                  <td className="px-4 py-2">{job.name}</td>
                  <td className="px-4 py-2 capitalize">{job.category ?? "-"}</td>
                  <td className="px-4 py-2">
                    {job.status ? (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[job.status] ?? ""}`}
                      >
                        {job.status}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2">{job.schedule_human ?? "-"}</td>
                  <td className="px-4 py-2">{job.agent_name ?? "-"}</td>
                  <td className="px-4 py-2">
                    {job.last_run_at ? (
                      <>
                        {formatDistanceToNow(parseISO(job.last_run_at), { addSuffix: true })}
                        {job.last_run_status && (
                          <span
                            className={`ml-2 text-xs ${RUN_STATUS_STYLES[job.last_run_status] ?? ""}`}
                          >
                            ({job.last_run_status})
                          </span>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
