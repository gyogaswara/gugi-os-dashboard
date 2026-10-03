import type { Metadata } from "next";
import { loadBots, loadMeta, loadModules } from "@/lib/framework";
import FrameworkView from "./framework-view";

// Server Component: baca content/framework/* saat build (data statis, Opsi A),
// lalu oper data polos ke FrameworkView (client component) buat interaksi.
export const metadata: Metadata = {
  title: "Framework",
};

export default function FrameworkPage() {
  const meta = loadMeta();
  const modules = loadModules();
  const { bots, retired } = loadBots();
  return <FrameworkView meta={meta} modules={modules} bots={bots} retired={retired} />;
}
