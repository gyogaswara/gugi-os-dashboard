import type { Metadata } from "next";
import ContentView from "./content-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch + filter dilakukan di ContentView (client component).
export const metadata: Metadata = {
  title: "Content Pipeline",
};

export default function ContentPage() {
  return <ContentView />;
}
