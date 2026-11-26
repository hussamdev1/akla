import type { Metadata } from "next";
import { NearbyView } from "@/views/NearbyView";

export const metadata: Metadata = { title: "Nearby · القريب مني" };

export default function Page() {
  return <NearbyView />;
}
