import type { Metadata } from "next";
import BriefView from "./brief-view";

// Page tetap Server Component supaya bisa export metadata (title tab);
// fetch dilakukan di BriefView (client component).
export const metadata: Metadata = {
  title: "Today's Brief",
};

export default function Home() {
  return <BriefView />;
}
