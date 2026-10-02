/** Logika murni indikator sync health (dipisah dari komponen supaya bisa dites). */
import { differenceInHours, parseISO } from "date-fns";
import type { SyncLog } from "@/lib/types";

export type SyncLevel = "green" | "yellow" | "red" | "gray";

const STALE_HOURS = 24;
const DEAD_HOURS = 72;

function hoursText(hours: number): string {
  if (hours < 1) return "less than 1 hour ago";
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

/** Tentukan level + teks dari row sync_log terbaru (null = belum ada sync). */
export function evaluateSync(
  row: Pick<SyncLog, "started_at" | "status"> | null,
  now: Date,
): { level: SyncLevel; text: string } {
  if (!row) return { level: "gray", text: "Sync not configured" };

  const hours = differenceInHours(now, parseISO(row.started_at));

  if (row.status === "failed") return { level: "red", text: "Sync failed" };
  if (hours > DEAD_HOURS) return { level: "red", text: `No sync for ${Math.floor(hours / 24)} days` };
  if (row.status === "partial") return { level: "yellow", text: "Partial sync" };
  if (hours >= STALE_HOURS) return { level: "yellow", text: `Sync stale: ${hoursText(hours)}` };
  return { level: "green", text: `Synced ${hoursText(hours)}` };
}
