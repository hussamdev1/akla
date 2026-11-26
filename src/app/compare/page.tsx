import type { Metadata } from "next";
import { CompareView } from "@/views/CompareView";

export const metadata: Metadata = { title: "Compare Meals · قارن الوجبات" };

export default function Page() {
  return <CompareView />;
}
