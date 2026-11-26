import type { Metadata } from "next";
import { OffersView } from "@/views/OffersView";

export const metadata: Metadata = { title: "Offers · العروض" };

export default function Page() {
  return <OffersView />;
}
