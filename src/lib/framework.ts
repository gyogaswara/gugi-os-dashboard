/**
 * Loader data Gugi OS Framework (Opsi A: file statis di content/framework/).
 *
 * Server-only: baca file saat build (Server Component / generateStaticParams),
 * hasilnya data polos (JSON-serializable) yang dioper ke client component.
 * Update status modul = edit file + commit + deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const ROOT = path.join(process.cwd(), "content", "framework");

export type ModuleStatus =
  | "not-designed"
  | "designing"
  | "designed"
  | "implementing"
  | "live"
  | "optimizing"
  | "archived";

export type BucketKey = "projects" | "areas" | "resources" | "archive";
export type BotMode = "partner" | "staff" | "tool";
export type LayerKey = "philosophical" | "value" | "functions" | "evidence" | "measure";
export type MilestoneStatus = "todo" | "doing" | "done";

export interface FrameworkLayer {
  key: LayerKey;
  name: string;
  order: number;
  summary: string;
  apa: string;
  isi: string;
  fungsi: string;
  notes_title?: string;
  notes?: string[];
}

export interface FrameworkBucket {
  key: BucketKey;
  name: string;
  subtitle: string;
  criteria: string;
  namespaces?: { key: string; name: string; subtitle: string }[];
  items?: { name: string; subtitle: string }[];
  open_items?: string[];
}

export interface FrameworkPhase {
  name: string;
  period: string;
  status: "current" | "upcoming" | "future" | "done";
  description: string;
  milestones: { title: string; status: MilestoneStatus }[];
}

export interface FrameworkMeta {
  version: string;
  status: string;
  updated_at: string;
  drilling: LayerKey;
  scope: string;
  pilot_modul: string;
  tagline: string;
  layers: FrameworkLayer[];
  feedback_loop: string[];
  modes: { key: BotMode; name: string; points: string[] }[];
  buckets: FrameworkBucket[];
  phases: FrameworkPhase[];
  decisions: { id: string; title: string; rationale: string }[];
  principles: string[];
  pages: { group: string; links: { href: string; label: string; note?: string }[] }[];
}

export interface FrameworkBot {
  name: string;
  role: string;
  status: "active" | "outdated" | "retired" | "unknown";
  default_mode: BotMode | null;
  modules: string[];
}

export interface FrameworkModule {
  slug: string;
  name: string;
  subtitle: string;
  bucket: BucketKey;
  /** Contoh: "areas/brand" atau "projects/social/ppaz". */
  namespace: string;
  status: ModuleStatus;
  is_pilot: boolean;
  created_at: string;
  updated_at: string;
  depends_on: string[];
  supports: string[];
  bots: { name: string; mode: BotMode; role: string }[];
  sub_modules: { name: string; status?: ModuleStatus; note?: string }[];
  tasks: { title: string; status: MilestoneStatus }[];
  history: { date: string; status: ModuleStatus; note?: string }[];
  related: { label: string; href?: string }[];
  /** Isi markdown per layer; null = belum didefinisikan. */
  sections: Record<LayerKey, string | null>;
}

/** Graph dependency antar modul (hook buat /framework/graph di Phase 4). */
export interface ModuleGraph {
  /** Modul yang dibutuhkan modul ini (depends_on). */
  getDependencies(slug: string): FrameworkModule[];
  /** Modul yang bergantung ke modul ini: supports + modul lain yang depends_on ke sini. */
  getDependents(slug: string): FrameworkModule[];
}

const SECTION_KEYS: [RegExp, LayerKey][] = [
  [/^philosophical/i, "philosophical"],
  [/^value/i, "value"],
  [/^functions?/i, "functions"],
  [/^evidence/i, "evidence"],
  [/^measure/i, "measure"],
];

const PLACEHOLDER = /^content to be filled\.?$/i;

function readYaml<T>(file: string): T {
  return parse(fs.readFileSync(path.join(ROOT, file), "utf8")) as T;
}

/** Pisah frontmatter YAML dan body markdown, lalu body dipecah per heading "## ". */
function parseModule(raw: string): FrameworkModule {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("Modul tanpa frontmatter");
  const front = parse(match[1]) as Omit<FrameworkModule, "sections">;

  const sections: Record<LayerKey, string | null> = {
    philosophical: null,
    value: null,
    functions: null,
    evidence: null,
    measure: null,
  };
  for (const chunk of match[2].split(/^## /m).slice(1)) {
    const [heading, ...rest] = chunk.split(/\r?\n/);
    const key = SECTION_KEYS.find(([re]) => re.test(heading.trim()))?.[1];
    const content = rest.join("\n").trim();
    if (key) sections[key] = content && !PLACEHOLDER.test(content) ? content : null;
  }

  return {
    ...front,
    depends_on: front.depends_on ?? [],
    supports: front.supports ?? [],
    bots: front.bots ?? [],
    sub_modules: front.sub_modules ?? [],
    tasks: front.tasks ?? [],
    history: front.history ?? [],
    related: front.related ?? [],
    is_pilot: Boolean(front.is_pilot),
    sections,
  };
}

export function loadMeta(): FrameworkMeta {
  return readYaml<FrameworkMeta>("meta.yaml");
}

export function loadBots(): { bots: FrameworkBot[]; retired: string[] } {
  const data = readYaml<{ bots: FrameworkBot[]; retired?: string[] }>("bots.yaml");
  return { bots: data.bots ?? [], retired: data.retired ?? [] };
}

export function loadModules(): FrameworkModule[] {
  const dir = path.join(ROOT, "moduls");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseModule(fs.readFileSync(path.join(dir, f), "utf8")))
    .sort((a, b) => a.namespace.localeCompare(b.namespace));
}

export function moduleGraph(modules: FrameworkModule[]): ModuleGraph {
  const bySlug = new Map(modules.map((m) => [m.slug, m]));
  const pick = (slugs: string[]) =>
    [...new Set(slugs)].map((s) => bySlug.get(s)).filter((m): m is FrameworkModule => Boolean(m));
  return {
    getDependencies: (slug) => pick(bySlug.get(slug)?.depends_on ?? []),
    getDependents: (slug) =>
      pick([
        ...(bySlug.get(slug)?.supports ?? []),
        ...modules.filter((m) => m.depends_on.includes(slug)).map((m) => m.slug),
      ]),
  };
}
