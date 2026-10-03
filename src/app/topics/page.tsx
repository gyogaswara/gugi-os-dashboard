import type { Metadata } from "next";
import TopicsView from "./topics-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch + filter dilakukan di TopicsView (client component).
export const metadata: Metadata = {
  title: "Topics",
};

export default function TopicsPage() {
  return <TopicsView />;
}
