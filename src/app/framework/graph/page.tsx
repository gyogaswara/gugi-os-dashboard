import type { Metadata } from "next";
import Link from "next/link";
import { loadModules } from "@/lib/framework";

// Placeholder: route dicadangkan untuk dependency graph view (Phase 4).
// Sementara menampilkan daftar edge dari depends_on di frontmatter modul.
export const metadata: Metadata = {
  title: "Dependency Graph",
};

export default function FrameworkGraphPage() {
  const modules = loadModules();
  const name = (slug: string) => modules.find((m) => m.slug === slug)?.namespace ?? slug;
  const edges = modules.flatMap((m) => m.depends_on.map((d) => ({ from: m.namespace, to: name(d) })));

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Dependency graph</h1>
      <p className="mt-1 text-sm text-gray-500">
        Visual graph menyusul di Phase 4. Untuk sekarang: daftar dependency antar modul.
      </p>
      <ul className="mt-4 divide-y divide-gray-200 rounded border border-gray-200 bg-white text-sm">
        {edges.length === 0 ? (
          <li className="p-3 text-gray-500">Belum ada dependency tercatat.</li>
        ) : (
          edges.map((e) => (
            <li key={`${e.from}-${e.to}`} className="p-3">
              <span className="font-mono">{e.from}</span> <span className="text-gray-400">depends on</span>{" "}
              <span className="font-mono">{e.to}</span>
            </li>
          ))
        )}
      </ul>
      <Link href="/framework" className="mt-4 inline-block text-sm underline">
        ← Kembali ke Framework
      </Link>
    </main>
  );
}
