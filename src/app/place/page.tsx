import type { Metadata } from "next";
import { PlaceView } from "@/views/PlaceView";

export const metadata: Metadata = { title: "Place · مكان" };

export default function Page() {
  return <PlaceView />;
}
