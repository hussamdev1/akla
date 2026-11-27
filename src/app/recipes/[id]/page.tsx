import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECIPES, recipeAr, recipeById } from "@/data/recipes";
import { RecipeView } from "@/views/RecipeView";

export const dynamicParams = false;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = recipeById(id);
  const ar = recipeAr(id);
  return { title: r ? `${r.name}${ar ? ` · ${ar.name}` : ""}` : "Recipe", description: r ? `${r.name}: ingredients and step-by-step instructions.` : undefined };
}

// The full recipe is passed as props from this server component, so only this page's payload carries its steps.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = recipeById(id);
  if (!r) notFound();
  return <RecipeView recipe={r} ar={recipeAr(id)} />;
}
