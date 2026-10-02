import type { Metadata } from "next";
import CronView from "./cron-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch + filter dilakukan di CronView (client component).
export const metadata: Metadata = {
  title: "Cron Jobs",
};

export default function CronPage() {
  return <CronView />;
}
