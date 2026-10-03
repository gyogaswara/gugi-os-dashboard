import type { Metadata } from "next";
import ContentStreamView from "./content-stream-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch + filter dilakukan di ContentStreamView (client component).
export const metadata: Metadata = {
  title: "Content Stream",
};

export default function ContentStreamPage() {
  return <ContentStreamView />;
}
