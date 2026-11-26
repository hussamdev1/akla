import type { Metadata } from "next";
import { PickerView } from "@/views/PickerView";

export const metadata: Metadata = { title: "Food Roulette · عجلة الأكل" };

export default function Page() {
  return <PickerView />;
}
