/** Full recipes (steps included). Import only from server components (route files) so the steps aren't bundled into client JS. */
import data from "./generated/recipes.json";
import ar from "./recipes-ar.json";
import type { Recipe, RecipeAr } from "@/lib/recipes";

export const RECIPES = data.recipes as Recipe[];
export const recipeById = (id: string) => RECIPES.find((r) => r.id === id);
export const recipeAr = (id: string) => (ar as Record<string, RecipeAr>)[id];
