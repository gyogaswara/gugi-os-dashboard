/**
 * Komponen kecil untuk halaman /framework (dipakai server dan client component):
 * status modul, warna bucket PARA, badge pilot, dan renderer Markdown mini.
 */
import type { ReactNode } from "react";
import type { BucketKey, MilestoneStatus, ModuleStatus } from "@/lib/framework";

export const STATUS_META: Record<ModuleStatus, { label: string; dot: string }> = {
  "not-designed": { label: "not designed", dot: "bg-gray-300" },
  designing: { label: "designing", dot: "bg-yellow-400" },
  designed: { label: "designed", dot: "bg-blue-500" },
  implementing: { label: "implementing", dot: "bg-orange-500" },
  live: { label: "live", dot: "bg-green-600" },
  optimizing: { label: "optimizing", dot: "bg-green-300" },
  archived: { label: "archived", dot: "bg-gray-700" },
};

/** Warna aksen per bucket PARA (light mode): coral, teal, blue, gray. */
export const BUCKET_STYLE: Record<BucketKey, { box: string; head: string; accent: string; text: string }> = {
  projects: {
    box: "border-orange-200 bg-orange-50",
    head: "border-orange-300 bg-orange-100 text-orange-900",
    accent: "border-l-orange-500",
    text: "text-orange-800",
  },
  areas: {
    box: "border-teal-200 bg-teal-50",
    head: "border-teal-300 bg-teal-100 text-teal-900",
    accent: "border-l-teal-500",
    text: "text-teal-800",
  },
  resources: {
    box: "border-blue-200 bg-blue-50",
    head: "border-blue-300 bg-blue-100 text-blue-900",
    accent: "border-l-blue-500",
    text: "text-blue-800",
  },
  archive: {
    box: "border-gray-200 bg-gray-50",
    head: "border-gray-300 bg-gray-100 text-gray-800",
    accent: "border-l-gray-500",
    text: "text-gray-700",
  },
};

export function StatusDot({ status }: { status: ModuleStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META["not-designed"];
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden />;
}

/** Titik kecil + teks, konsisten dengan badge status di halaman lain. */
export function StatusBadge({ status }: { status: ModuleStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META["not-designed"];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700">
      <StatusDot status={status} />
      {meta.label}
    </span>
  );
}

export function PilotBadge() {
  return (
    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-900">
      ★ Pilot
    </span>
  );
}

export function MilestoneMark({ status }: { status: MilestoneStatus }) {
  if (status === "done") return <span className="text-green-700" aria-label="selesai">✓</span>;
  if (status === "doing") return <span className="text-blue-600" aria-label="sedang jalan">●</span>;
  return <span className="text-gray-300" aria-label="belum">○</span>;
}

/** Legenda status modul. */
export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
      {(Object.keys(STATUS_META) as ModuleStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <StatusDot status={s} />
          {STATUS_META[s].label}
        </span>
      ))}
    </div>
  );
}

/** Inline: **bold**, `code`, [label](url http/https atau path internal). */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${m.index}`;
    if (token.startsWith("**")) {
      out.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      out.push(
        <code key={key} className="rounded bg-gray-100 px-1 font-mono text-xs">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/) ?? [];
      const safe = /^(https?:\/\/|\/)/i.test(href ?? "");
      out.push(
        safe ? (
          <a key={key} href={href} className="underline">
            {label}
          </a>
        ) : (
          label
        ),
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Renderer Markdown mini buat isi modul: paragraf, ### judul, list "-" dan "1.",
 * plus inline bold/code/link. Sengaja kecil (tanpa library); cukup buat file modul.
 */
export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^###\s+/.test(line)) {
      blocks.push(
        <h4 key={i} className="mt-3 font-semibold">
          {inline(line.replace(/^###\s+/, ""))}
        </h4>,
      );
      i++;
      continue;
    }
    const listRe = /^\s*(-|\d+\.)\s+/;
    if (listRe.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && listRe.test(lines[i])) {
        items.push(lines[i].replace(listRe, ""));
        i++;
      }
      const cls = `ml-5 space-y-1 ${ordered ? "list-decimal" : "list-disc"}`;
      const children = items.map((it, n) => <li key={n}>{inline(it)}</li>);
      blocks.push(
        ordered ? (
          <ol key={i} className={cls}>
            {children}
          </ol>
        ) : (
          <ul key={i} className={cls}>
            {children}
          </ul>
        ),
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !listRe.test(lines[i]) && !/^###\s+/.test(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(<p key={i}>{inline(para.join(" "))}</p>);
  }
  return <div className="space-y-2 text-sm leading-relaxed text-gray-800">{blocks}</div>;
}
