"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SyncLog } from "@/lib/types";
import { evaluateSync, type SyncLevel } from "@/lib/sync-health";

const DOT: Record<SyncLevel, string> = {
  green: "bg-green-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

const PILL: Record<SyncLevel, string> = {
  green: "border-green-200 bg-green-50 text-green-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-800",
  gray: "border-gray-200 bg-gray-50 text-gray-600",
};

function tooltip(row: SyncLog | null): string | undefined {
  if (!row) return "Belum ada row di sync_log";
  return [
    `Type: ${row.sync_type}`,
    `Status: ${row.status}`,
    row.tables_synced?.length ? `Synced: ${row.tables_synced.join(", ")}` : null,
    row.tables_failed?.length ? `Failed: ${row.tables_failed.join(", ")}` : null,
    row.error_message ? `Error: ${row.error_message}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Indikator kecil: kapan terakhir Hermes sync ke Supabase. Klik buat buka /sync-log. */
export default function SyncHealthIndicator() {
  // undefined = loading, null = tidak ada row, string = query gagal
  const [row, setRow] = useState<SyncLog | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("sync_log")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setFailed(true);
        setRow(error ? null : ((data?.[0] as SyncLog | undefined) ?? null));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (row === undefined) {
    return <span className="inline-block h-7 w-36 animate-pulse rounded-full bg-gray-100" aria-busy="true" />;
  }

  const { level, text } = failed
    ? { level: "gray" as SyncLevel, text: "Sync status unavailable" }
    : evaluateSync(row, new Date());

  return (
    <Link
      href="/sync-log"
      title={tooltip(row)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${PILL[level]}`}
    >
      <span className={`h-2 w-2 rounded-full ${DOT[level]}`} aria-hidden />
      {text}
    </Link>
  );
}
