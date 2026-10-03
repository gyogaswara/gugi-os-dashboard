/**
 * Detail satu modul. Server component (tanpa state): bagian yang bisa dilipat
 * pakai <details> bawaan browser, jadi tidak perlu JavaScript di client.
 */
import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { FrameworkLayer, FrameworkModule } from "@/lib/framework";
import {
  BUCKET_STYLE,
  Markdown,
  MilestoneMark,
  PilotBadge,
  StatusBadge,
  StatusDot,
} from "@/components/framework-ui";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-medium uppercase text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-400">{text}</p>;
}

function ModuleLinks({ list }: { list: FrameworkModule[] }) {
  if (list.length === 0) return <p className="text-sm text-gray-400">—</p>;
  return (
    <ul className="space-y-1 text-sm">
      {list.map((m) => (
        <li key={m.slug} className="flex items-center gap-2">
          <StatusDot status={m.status} />
          <Link href={`/framework/modul/${m.slug}`} className="underline">
            {m.namespace}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const day = (d: string) => format(parseISO(d), "d MMM yyyy");

export default function ModulDetailView({
  modul,
  dependencies,
  dependents,
  layers,
  bucketName,
}: {
  modul: FrameworkModule;
  dependencies: FrameworkModule[];
  dependents: FrameworkModule[];
  layers: FrameworkLayer[];
  bucketName: string;
}) {
  const style = BUCKET_STYLE[modul.bucket];
  // Breadcrumb dari namespace: areas/brand -> Areas / Brand
  const trail = modul.namespace.split("/").slice(1, -1);

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-8">
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <Link href="/framework" className="underline">
          Framework
        </Link>
        <span>/</span>
        <span>PARA</span>
        <span>/</span>
        <span>{bucketName}</span>
        {trail.map((t) => (
          <span key={t} className="contents">
            <span>/</span>
            <span className="capitalize">{t}</span>
          </span>
        ))}
        <span>/</span>
        <span className="text-gray-800">{modul.name}</span>
      </nav>

      <header className={`mb-6 rounded border border-l-4 border-gray-200 bg-white p-4 ${style.accent}`}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{modul.name}</h1>
          <StatusBadge status={modul.status} />
          {modul.is_pilot && <PilotBadge />}
        </div>
        <p className={`mt-1 text-sm ${style.text}`}>
          {bucketName} · {modul.subtitle}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          <span className="font-mono">{modul.namespace}</span> · updated {day(modul.updated_at)}
        </p>
      </header>

      <Block title="Anatomi modul — regulation dari 5 layer">
        <div className="space-y-2">
          {[...layers]
            .sort((a, b) => a.order - b.order)
            .map((l) => {
              const content = modul.sections[l.key];
              return (
                <details
                  key={l.key}
                  open={l.key === "functions" || (modul.is_pilot && Boolean(content))}
                  className="rounded border border-gray-200 bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="font-medium">
                      {l.order}. {l.name}
                    </span>
                    <span className={`text-xs ${content ? "text-green-700" : "text-gray-400"}`}>
                      {content ? "terisi" : "belum didefinisikan"}
                    </span>
                  </summary>
                  <div className="border-t border-gray-100 px-4 py-3">
                    {content ? (
                      <Markdown source={content} />
                    ) : (
                      <p className="text-sm text-gray-400">Not yet defined. Rujukan layer: {l.summary}.</p>
                    )}
                  </div>
                </details>
              );
            })}
        </div>
      </Block>

      <Block title="Sub-modul">
        {modul.sub_modules.length === 0 ? (
          <Empty text="Belum ada sub-modul." />
        ) : (
          <ul className="space-y-1 rounded border border-gray-200 bg-white p-3 text-sm">
            {modul.sub_modules.map((s) => (
              <li key={s.name} className="flex items-center gap-2">
                <StatusDot status={s.status ?? "not-designed"} />
                <span className="font-medium">{s.name}</span>
                {s.note && <span className="text-xs text-gray-500">{s.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Task / workstream">
        {modul.tasks.length === 0 ? (
          <Empty text="Belum ada task." />
        ) : (
          <ul className="space-y-1 rounded border border-gray-200 bg-white p-3 text-sm">
            {modul.tasks.map((t) => (
              <li key={t.title} className="flex gap-2">
                <MilestoneMark status={t.status} />
                <span>{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title="Bot assignment">
        {modul.bots.length === 0 ? (
          <Empty text="Belum ada bot yang di-assign." />
        ) : (
          <>
            <table className="hidden w-full rounded border border-gray-200 bg-white text-left text-sm md:table">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Bot</th>
                  <th className="px-4 py-2 font-medium">Mode</th>
                  <th className="px-4 py-2 font-medium">Role di modul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {modul.bots.map((b) => (
                  <tr key={b.name}>
                    <td className="px-4 py-2 font-medium">{b.name}</td>
                    <td className="px-4 py-2">{b.mode}</td>
                    <td className="px-4 py-2 text-gray-700">{b.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="space-y-2 md:hidden">
              {modul.bots.map((b) => (
                <li key={b.name} className="rounded border border-gray-200 bg-white p-3 text-sm">
                  <p className="font-medium">
                    {b.name} <span className="font-normal text-gray-500">· {b.mode}</span>
                  </p>
                  <p className="text-gray-700">{b.role}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Block>

      <Block title="Dependencies">
        <div className="grid gap-3 rounded border border-gray-200 bg-white p-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Depends on</p>
            <ModuleLinks list={dependencies} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Supports</p>
            <ModuleLinks list={dependents} />
          </div>
        </div>
      </Block>

      <Block title="Status history">
        {modul.history.length === 0 ? (
          <Empty text="Belum ada riwayat status." />
        ) : (
          <ol className="relative ml-2 space-y-3 border-l border-gray-200 pl-4 text-sm">
            {modul.history.map((h, n) => (
              <li key={`${h.date}-${n}`}>
                <span className="absolute -left-[5px] mt-1.5 inline-block">
                  <StatusDot status={h.status} />
                </span>
                <p>
                  <span className="text-gray-500">{day(h.date)}</span> · <StatusBadge status={h.status} />
                </p>
                {h.note && <p className="text-gray-700">{h.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </Block>

      <Block title="Related docs">
        {modul.related.length === 0 ? (
          <Empty text="Belum ada referensi." />
        ) : (
          <ul className="space-y-1 rounded border border-gray-200 bg-white p-3 text-sm">
            {modul.related.map((r) => (
              <li key={r.label}>
                {r.href ? (
                  <Link href={r.href} className="underline">
                    {r.label}
                  </Link>
                ) : (
                  r.label
                )}
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Link href="/framework" className="text-sm underline">
        ← Kembali ke Framework
      </Link>
    </main>
  );
}
