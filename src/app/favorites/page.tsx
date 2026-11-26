import type { Metadata } from "next";
import { FavoritesView } from "@/views/FavoritesView";

export const metadata: Metadata = { title: "Favorites · المفضلة" };

export default function Page() {
  return <FavoritesView />;
}
