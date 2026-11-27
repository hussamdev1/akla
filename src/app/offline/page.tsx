import type { Metadata } from "next";
import { OfflineView } from "@/views/OfflineView";

// Served by the service worker when a page isn't cached and there is no network.
export const metadata: Metadata = { title: "Offline · بدون نت", robots: { index: false } };

export default function Page() {
  return <OfflineView />;
}
