import type { Metadata } from "next";
import { TrendingView } from "@/views/TrendingView";

export const metadata: Metadata = { title: "Trending · الرائج" };

export default function Page() {
  return <TrendingView />;
}
