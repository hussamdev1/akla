import type { Metadata } from "next";
import { GroupView } from "@/views/games/GroupView";

export const metadata: Metadata = { title: "Group Decision · قرار الشلة" };

export default function Page() {
  return <GroupView />;
}
