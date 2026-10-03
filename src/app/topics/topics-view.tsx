"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContentTopic, ContentTopicStatus } from "@/lib/types";
import {
  ErrorState,
  FilterButtons,
  SearchInput,
  SkeletonRows,
  SummaryCard,
} from "@/components/dashboard-ui";
import { TopicCard } from "../content/content-parts";

type StatusFilter = "all" | ContentTopicStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fresh", label: "Fresh" },
  { value: "picked", label: "Picked" },
  { value: "used", label: "Used" },
  { value: "archived", label: "Archived" },
];

export default function TopicsView() {
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  // id -> "CODE — judul", buat menampilkan "used in" yang bisa dibaca manusia
  const [contentLabels, setContentLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [topicRows, contentRows] = await Promise.all([
      supabase.from("content_topics").select("*").order("researched_at", { ascending: false, nullsFirst: false }),
      supabase.from("content_pipeline").select("id, code, title, title_final"),
    ]);

    if (topicRows.error) {
      setError(topicRows.error.message);
    } else {
      setTopics((topicRows.data ?? []) as ContentTopic[]);
    }
    // Label konten opsional: tanpa itu "used in" jatuh ke id mentah.
    const labels: Record<string, string> = {};
    for (const row of contentRows.data ?? []) {
      labels[row.id as string] = `${row.code} — ${(row.title_final ?? row.title) as string}`;
    }
    setContentLabels(labels);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(topics.map((t) => t.category).filter((c): c is string => Boolean(c)))].sort();
    return [{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))];
  }, [topics]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics.filter(
      (t) =>
        (statusFilter === "all" || t.status === statusFilter) &&
        (categoryFilter === "all" || t.category === categoryFilter) &&
        (!q ||
          t.topic.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))),
    );
  }, [topics, statusFilter, categoryFilter, search]);

  const count = (status: ContentTopicStatus) => topics.filter((t) => t.status === status).length;

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Topics</h1>
        <p className="text-sm text-gray-500">
          {loading && topics.length === 0 ? "Loading…" : "Research bank dari Sandi (Grok)"}
        </p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Total Topics" value={topics.length} />
            <SummaryCard label="Fresh" value={count("fresh")} />
            <SummaryCard label="Picked" value={count("picked")} />
            <SummaryCard label="Used" value={count("used")} />
          </section>

          <section className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <FilterButtons label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
              <SearchInput value={search} onChange={setSearch} placeholder="Search topic, tag…" />
            </div>
            {categoryOptions.length > 1 && (
              <FilterButtons
                label="Category"
                options={categoryOptions}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            )}
          </section>

          {filtered.length === 0 ? (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              {topics.length === 0
                ? "Topic bank masih kosong. Terisi begitu Sandi mulai menulis hasil riset ke content_topics."
                : "Tidak ada topik yang cocok dengan filter."}
            </p>
          ) : (
            <ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  usedIn={topic.used_in_content_id ? contentLabels[topic.used_in_content_id] : undefined}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
