/** Small recipe list for browsing, home and search (no steps). Client-safe. */
import index from "./generated/recipes-index.json";
import { CUISINES, type RecipeSummary } from "@/lib/recipes";

export const RECIPE_INDEX = index as RecipeSummary[];
/** Cuisines that have at least one recipe, in display order, with their counts. */
export const RECIPE_CUISINES = CUISINES.map((c) => ({ ...c, count: RECIPE_INDEX.filter((r) => r.cuisine === c.id).length })).filter((c) => c.count > 0);
