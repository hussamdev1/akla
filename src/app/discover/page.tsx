import type { Metadata } from "next";
import { DiscoverView } from "@/views/DiscoverView";

export const metadata: Metadata = { title: "Discover Food · اكتشف الأكل" };

export default function Page() {
  return <DiscoverView />;
}
