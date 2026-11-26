import type { Metadata } from "next";
import { RestaurantsView } from "@/views/RestaurantsView";

export const metadata: Metadata = { title: "Restaurants · المطاعم" };

export default function Page() {
  return <RestaurantsView />;
}
