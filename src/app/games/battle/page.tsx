import type { Metadata } from "next";
import { BattleView } from "@/views/games/BattleView";

export const metadata: Metadata = { title: "Food Battle · معركة الأكل" };

export default function Page() {
  return <BattleView />;
}
