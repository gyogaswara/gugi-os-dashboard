import type { Metadata } from "next";
import AgentsView from "./agents-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch + filter dilakukan di AgentsView (client component).
export const metadata: Metadata = {
  title: "Agents",
};

export default function AgentsPage() {
  return <AgentsView />;
}
