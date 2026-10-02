import type { Metadata } from "next";
import SyncLogView from "./sync-log-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch + filter dilakukan di SyncLogView (client component).
export const metadata: Metadata = {
  title: "Sync Log",
};

export default function SyncLogPage() {
  return <SyncLogView />;
}
