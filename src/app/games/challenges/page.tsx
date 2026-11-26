import type { Metadata } from "next";
import { ChallengesView } from "@/views/games/ChallengesView";

export const metadata: Metadata = { title: "Daily Challenges · التحديات اليومية" };

export default function Page() {
  return <ChallengesView />;
}
