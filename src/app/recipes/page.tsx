import type { Metadata } from "next";
import { RecipesView } from "@/views/RecipesView";

export const metadata: Metadata = { title: "Recipes · وصفات", description: "Step-by-step recipes from Syrian, Lebanese, Egyptian, Gulf, Indian, Italian and more cuisines." };

export default function Page() {
  return <RecipesView />;
}
