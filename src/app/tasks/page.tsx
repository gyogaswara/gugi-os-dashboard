import type { Metadata } from "next";
import TasksView from "./tasks-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch + filter dilakukan di TasksView (client component).
export const metadata: Metadata = {
  title: "Tasks",
};

export default function TasksPage() {
  return <TasksView />;
}
