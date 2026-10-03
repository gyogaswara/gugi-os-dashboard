"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import type {
  FrameworkBot,
  FrameworkBucket,
  FrameworkLayer,
  FrameworkMeta,
  FrameworkModule,
} from "@/lib/framework";
import {
  BUCKET_STYLE,
  MilestoneMark,
  PilotBadge,
  StatusDot,
  StatusLegend,
} from "@/components/framework-ui";
import { Badge, type BadgeTone } from "@/components/dashboard-ui";

const PHASE_TONE: Record<string, BadgeTone> = { current: "green", upcoming: "blue", future: "gray", done: "gray" };
const BOT_TONE: Record<FrameworkBot["status"], BadgeTone> = {
  active: "green",
  outdated: "amber",
  retired: "gray",
  unknown: "gray",
};
const BOT_LABEL: Record<FrameworkBot["status"], string> = {
  active: "active",
  outdated: "instruksi lama",
  retired: "retired",
  unknown: "unknown",
};

/** Modal pakai <dialog> bawaan browser (tanpa library UI). */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded border border-gray-200 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Tutup"
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-4 py-3 text-sm">{children}</div>
    </dialog>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-medium uppercase text-gray-500">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Kotak modul di peta: klik ke halaman detail modul. */
function ModuleBox({ m, bucket }: { m: FrameworkModule; bucket: FrameworkBucket["key"] }) {
  return (
    <Link
      href={`/framework/modul/${m.slug}`}
      className={`block rounded border bg-white p-2 text-center hover:shadow-sm ${
        m.is_pilot ? "border-yellow-400 ring-2 ring-yellow-200" : "border-gray-200"
      }`}
    >
      <span className="flex items-center justify-center gap-1.5 text-sm font-medium">
        <StatusDot status={m.status} />
        {m.name}
      </span>
      <span className={`block text-xs ${BUCKET_STYLE[bucket].text}`}>{m.subtitle}</span>
      {m.is_pilot && (
        <span className="mt-1 inline-block">
          <PilotBadge />
        </span>
      )}
    </Link>
  );
}

function StaticBox({ name, subtitle, bucket }: { name: string; subtitle: string; bucket: FrameworkBucket["key"] }) {
  return (
    <div className="rounded border border-dashed border-gray-300 bg-white/60 p-2 text-center">
      <span className="block text-sm font-medium text-gray-700">{name}</span>
      <span className={`block text-xs ${BUCKET_STYLE[bucket].text}`}>{subtitle}</span>
    </div>
  );
}

function modulesIn(modules: FrameworkModule[], prefix: string) {
  return modules.filter((m) => m.namespace === prefix || m.namespace.startsWith(`${prefix}/`));
}

/** Desktop: peta 4 kolom PARA (gaya diagram framework). */
function ParaMap({ buckets, modules }: { buckets: FrameworkBucket[]; modules: FrameworkModule[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {buckets.map((b) => (
        <div key={b.key} className={`rounded border p-2 ${BUCKET_STYLE[b.key].box}`}>
          <div className={`mb-2 rounded border px-2 py-2 text-center ${BUCKET_STYLE[b.key].head}`}>
            <p className="font-semibold">{b.name}</p>
            <p className="text-xs">{b.subtitle}</p>
          </div>
          <div className="space-y-2">
            {b.namespaces?.map((ns) => {
              const inNs = modulesIn(modules, `${b.key}/${ns.key}`);
              return (
                <div key={ns.key} className="rounded border border-orange-200 bg-white/70 p-2">
                  <p className="text-center text-sm font-medium">{ns.name}</p>
                  <p className={`text-center text-xs ${BUCKET_STYLE[b.key].text}`}>{ns.subtitle}</p>
                  {inNs.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {inNs.map((m) => (
                        <ModuleBox key={m.slug} m={m} bucket={b.key} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {!b.namespaces &&
              modulesIn(modules, b.key).map((m) => <ModuleBox key={m.slug} m={m} bucket={b.key} />)}
            {b.items?.map((it) => (
              <StaticBox key={it.name} name={it.name} subtitle={it.subtitle} bucket={b.key} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mobile: data yang sama sebagai tree yang bisa dilipat (<details>). */
function ParaTree({ buckets, modules }: { buckets: FrameworkBucket[]; modules: FrameworkModule[] }) {
  const leaf = (m: FrameworkModule) => (
    <li key={m.slug}>
      <Link
        href={`/framework/modul/${m.slug}`}
        className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
      >
        <StatusDot status={m.status} />
        <span className="font-medium">{m.name}</span>
        <span className="truncate text-xs text-gray-500">{m.subtitle}</span>
        {m.is_pilot && <PilotBadge />}
      </Link>
    </li>
  );
  return (
    <div className="space-y-2">
      {buckets.map((b) => {
        const count = modulesIn(modules, b.key).length;
        return (
          <details
            key={b.key}
            open={b.key === "areas"}
            className={`rounded border border-l-4 bg-white ${BUCKET_STYLE[b.key].accent} border-gray-200`}
          >
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
              {b.name} <span className="font-normal text-gray-500">· {b.subtitle}</span>
              {count > 0 && <span className="ml-1 font-normal text-gray-500">· {count} modul</span>}
            </summary>
            <div className="border-t border-gray-100 px-2 py-2 text-sm">
              {b.namespaces ? (
                <ul className="space-y-1">
                  {b.namespaces.map((ns) => {
                    const inNs = modulesIn(modules, `${b.key}/${ns.key}`);
                    return (
                      <li key={ns.key}>
                        <details open={inNs.length > 0}>
                          <summary className="cursor-pointer px-2 py-1">
                            {ns.name}/ <span className="text-xs text-gray-500">{ns.subtitle}</span>
                          </summary>
                          <ul className="ml-4 border-l border-gray-200 pl-2">
                            {inNs.length ? (
                              inNs.map(leaf)
                            ) : (
                              <li className="px-2 py-1 text-xs text-gray-400">Belum ada modul</li>
                            )}
                          </ul>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="space-y-1">
                  {modulesIn(modules, b.key).map(leaf)}
                  {b.items?.map((it) => (
                    <li key={it.name} className="px-2 py-1 text-gray-600">
                      {it.name} <span className="text-xs text-gray-400">{it.subtitle}</span>
                    </li>
                  ))}
                </ul>
              )}
              {b.open_items && b.open_items.length > 0 && (
                <p className="mt-2 px-2 text-xs text-gray-500">Open: {b.open_items.join(" · ")}</p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function LayerDetail({ layer, meta }: { layer: FrameworkLayer; meta: FrameworkMeta }) {
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        <dt className="text-gray-500">Apa</dt>
        <dd>{layer.apa}</dd>
        <dt className="text-gray-500">Isi</dt>
        <dd>{layer.isi}</dd>
        <dt className="text-gray-500">Fungsi</dt>
        <dd>{layer.fungsi}</dd>
      </dl>
      {layer.notes && layer.notes.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">{layer.notes_title ?? "Catatan"}</p>
          <ul className="ml-5 mt-1 list-disc space-y-1">
            {layer.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      {layer.key === "functions" && (
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Mode partnership (nested di Functions)</p>
          <ul className="mt-1 space-y-1">
            {meta.modes.map((mode) => (
              <li key={mode.key}>
                <span className="font-medium">{mode.name}</span> — {mode.points.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(layer.key === "philosophical" || layer.key === "measure") && (
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Feedback loop</p>
          <ul className="ml-5 mt-1 list-disc space-y-1">
            {meta.feedback_loop.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function FrameworkView({
  meta,
  modules,
  bots,
  retired,
}: {
  meta: FrameworkMeta;
  modules: FrameworkModule[];
  bots: FrameworkBot[];
  retired: string[];
}) {
  const [layer, setLayer] = useState<FrameworkLayer | null>(null);
  const [decision, setDecision] = useState<FrameworkMeta["decisions"][number] | null>(null);

  const layers = [...meta.layers].sort((a, b) => a.order - b.order);
  const drillingLayer = layers.find((l) => l.key === meta.drilling);
  const pilot = modules.find((m) => m.slug === meta.pilot_modul);

  // "Next up": 3 milestone teratas yang belum selesai, urut fase (yang jalan duluan).
  const nextUp = meta.phases
    .flatMap((p) => p.milestones.map((ms) => ({ ...ms, phase: p.name })))
    .filter((ms) => ms.status !== "done")
    .sort((a, b) => (a.status === "doing" ? -1 : 0) - (b.status === "doing" ? -1 : 0))
    .slice(0, 3);

  const moduleName = (slug: string) => modules.find((m) => m.slug === slug)?.name ?? slug;

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Section 1: overview */}
      <section className="mb-8 rounded border border-gray-200 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">Gugi OS Framework</h1>
          <Badge tone="purple">v{meta.version} — {meta.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">{meta.tagline}</p>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase text-gray-500">Last updated</dt>
            <dd>{format(parseISO(meta.updated_at), "d MMM yyyy")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Status</dt>
            <dd>Active drill — {drillingLayer?.name ?? meta.drilling} layer</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Scope</dt>
            <dd>{meta.scope}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Pilot modul</dt>
            <dd>
              {pilot ? (
                <Link href={`/framework/modul/${pilot.slug}`} className="underline">
                  {pilot.namespace}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Section 2: peta framework (5 layer di atas, PARA di bawah) */}
      <Section title="Framework map" subtitle="5-layer guardrails nurunin kenapa & boleh/nggak — governs & gates — PARA: apa, status, actionable">
        <div className="space-y-1.5">
          {layers.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setLayer(l)}
              className={`flex w-full flex-col items-start gap-0.5 rounded border px-4 py-2.5 text-left hover:bg-violet-100 sm:flex-row sm:items-center sm:justify-between ${
                l.key === meta.drilling
                  ? "border-violet-500 bg-violet-100 ring-2 ring-violet-200"
                  : "border-violet-200 bg-violet-50"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-violet-950">
                <span className="text-xs text-violet-500">{l.order}</span>
                {l.name}
                {l.key === meta.drilling && (
                  <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    ★ drilling
                  </span>
                )}
              </span>
              <span className="text-xs text-violet-800 sm:text-sm">{l.summary}</span>
            </button>
          ))}
        </div>
        <p className="my-3 text-center text-xs text-gray-400">↓ governs & gates ↓</p>
        <div className="hidden md:block">
          <ParaMap buckets={meta.buckets} modules={modules} />
        </div>
        <div className="md:hidden">
          <ParaTree buckets={meta.buckets} modules={modules} />
        </div>
        <div className="mt-3">
          <StatusLegend />
        </div>
      </Section>

      {/* Section 3: roadmap */}
      <Section title="Roadmap" subtitle="Fase sebagai kerangka, item dokumen sebagai milestone">
        {nextUp.length > 0 && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase text-blue-900">Next up</p>
            <ol className="mt-2 space-y-1.5 text-sm">
              {nextUp.map((ms) => (
                <li key={ms.title} className="flex gap-2">
                  <MilestoneMark status={ms.status} />
                  <span>
                    {ms.title} <span className="text-xs text-blue-800">· {ms.phase}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {meta.phases.map((p) => {
            const done = p.milestones.filter((m) => m.status === "done").length;
            return (
              <div
                key={p.name}
                className={`rounded border bg-white p-4 ${p.status === "current" ? "border-green-400" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {p.name} <span className="font-normal text-gray-500">· {p.period}</span>
                    </p>
                    <p className="text-sm text-gray-600">{p.description}</p>
                  </div>
                  <Badge tone={PHASE_TONE[p.status] ?? "gray"}>{p.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {done}/{p.milestones.length} milestone selesai
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {p.milestones.map((ms) => (
                    <li key={ms.title} className="flex gap-2">
                      <MilestoneMark status={ms.status} />
                      <span className={ms.status === "done" ? "text-gray-500" : ""}>{ms.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Section 4: roster bot */}
      <Section title="Bot roster" subtitle="Bot = kapabilitas, bukan milik bucket. Satu bot bisa melayani banyak modul.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <li key={bot.name} className="rounded border border-gray-200 bg-white p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{bot.name}</p>
                  <p className="text-xs text-gray-500">{bot.role}</p>
                </div>
                <Badge tone={BOT_TONE[bot.status] ?? "gray"}>{BOT_LABEL[bot.status] ?? bot.status}</Badge>
              </div>
              <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
                <dt className="text-gray-500">Default mode</dt>
                <dd>{bot.default_mode ?? "belum didefinisikan"}</dd>
                <dt className="text-gray-500">Modul</dt>
                <dd>
                  {bot.modules.length
                    ? bot.modules.map((slug, n) => (
                        <span key={slug}>
                          {n > 0 && ", "}
                          <Link href={`/framework/modul/${slug}`} className="underline">
                            {moduleName(slug)}
                          </Link>
                        </span>
                      ))
                    : "—"}
                </dd>
              </dl>
            </li>
          ))}
        </ul>
        {retired.length > 0 && (
          <details className="mt-3 text-sm text-gray-600">
            <summary className="cursor-pointer">Retired ({retired.length})</summary>
            <p className="mt-1 pl-4">{retired.join(", ")}</p>
          </details>
        )}
      </Section>

      {/* Section 5: peta halaman dashboard */}
      <Section title="Peta halaman dashboard" subtitle="Semua halaman yang ada dan posisinya di framework">
        <div className="grid gap-3 md:grid-cols-3">
          {meta.pages.map((g) => (
            <div key={g.group} className="rounded border border-gray-200 bg-white p-3 text-sm">
              <p className="font-medium">{g.group}</p>
              <ul className="mt-2 space-y-1">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="underline">
                      {l.label}
                    </Link>
                    {l.note && <span className="text-xs text-gray-500"> · {l.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 6: decision log + prinsip */}
      <Section title="Decision log" subtitle="Klik keputusan untuk lihat alasannya">
        <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
          {meta.decisions.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setDecision(d)}
                className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-mono text-xs text-gray-500">{d.id}</span>
                <span>{d.title}</span>
              </button>
            </li>
          ))}
        </ul>
        <details className="mt-4 rounded border border-gray-200 bg-white text-sm">
          <summary className="cursor-pointer px-4 py-2.5 font-medium">
            Prinsip panduan ({meta.principles.length})
          </summary>
          <ol className="ml-9 list-decimal space-y-1 px-4 pb-3">
            {meta.principles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </details>
      </Section>

      <p className="text-xs text-gray-500">
        Data dari <span className="font-mono">content/framework/</span> (statis, update lewat commit).{" "}
        <Link href="/framework/graph" className="underline">
          Dependency graph
        </Link>{" "}
        menyusul.
      </p>

      {layer && (
        <Modal title={`${layer.order}. ${layer.name} layer`} onClose={() => setLayer(null)}>
          <LayerDetail layer={layer} meta={meta} />
        </Modal>
      )}
      {decision && (
        <Modal title={`${decision.id} — ${decision.title}`} onClose={() => setDecision(null)}>
          <p className="text-xs font-medium uppercase text-gray-500">Alasan</p>
          <p className="mt-1">{decision.rationale}</p>
        </Modal>
      )}
    </main>
  );
}

