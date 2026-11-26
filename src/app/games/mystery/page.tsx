import type { Metadata } from "next";
import { MysteryView } from "@/views/games/MysteryView";

export const metadata: Metadata = { title: "Mystery Meal · الوجبة الغامضة" };

export default function Page() {
  return <MysteryView />;
}
