import type { Metadata } from "next";
import { GamesHubView } from "@/views/games/GamesHubView";

export const metadata: Metadata = { title: "Food Games · ألعاب الأكل" };

export default function Page() {
  return <GamesHubView />;
}
