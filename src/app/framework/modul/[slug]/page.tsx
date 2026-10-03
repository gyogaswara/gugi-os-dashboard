import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadMeta, loadModules, moduleGraph } from "@/lib/framework";
import ModulDetailView from "./modul-detail-view";

// Semua modul diketahui saat build: tiap slug di-prerender statis.
export function generateStaticParams() {
  return loadModules().map((m) => ({ slug: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = loadModules().find((x) => x.slug === slug);
  return { title: m ? `${m.name} — Framework` : "Modul" };
}

export default async function ModulPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const modules = loadModules();
  const modul = modules.find((m) => m.slug === slug);
  if (!modul) notFound();

  const graph = moduleGraph(modules);
  const meta = loadMeta();
  return (
    <ModulDetailView
      modul={modul}
      dependencies={graph.getDependencies(slug)}
      dependents={graph.getDependents(slug)}
      layers={meta.layers}
      bucketName={meta.buckets.find((b) => b.key === modul.bucket)?.name ?? modul.bucket}
    />
  );
}
