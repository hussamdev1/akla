import { MEALS } from "@/data/meals";
import { restaurantById } from "@/data/restaurants";
import { activeRegion, scaleBudget } from "./region";
import type { Meal, MealTime, Mood, Offer } from "./types";

export type RecoInput = {
  mood?: Mood;
  time?: MealTime;
  maxPrice?: number;
  favRestaurants?: string[];
  favCategories?: string[];
  viewed?: Record<string, number>;
  distances?: Record<string, number>;
  activeOffers?: Offer[];
  random?: () => number;
  /** only meals of restaurants in this country (defaults to the selected one) */
  country?: string;
};

/**
 * Transparent, rule-based scoring. Every factor is explainable to the user:
 * mood, time of day, budget, favourites, distance, live offers and (demo) ratings.
 */
export function recommend(input: RecoInput, limit = 8): Meal[] {
  const rnd = input.random ?? Math.random;
  const offerMeals = new Set((input.activeOffers ?? []).map((o) => o.mealId).filter(Boolean));
  const country = input.country ?? activeRegion().country;
  const pool = MEALS.filter((m) => restaurantById(m.restaurantId)?.country === country);
  const scored = pool.filter((m) => input.maxPrice === undefined || m.price <= input.maxPrice).map((m) => {
    const r = restaurantById(m.restaurantId)!;
    let s = 0;
    if (input.mood && input.mood !== "surprise") {
      if (m.moods.includes(input.mood)) s += 6;
      if (input.mood === "cheap") s += Math.max(0, 3 - m.price / scaleBudget(1, m.currency));
      if (input.mood === "starving" && (m.size === "large" || m.size === "family")) s += 2;
      if (input.mood === "spicy") s += m.spicy;
      if (input.mood === "new" && !input.viewed?.[r.id]) s += 3;
      if (input.mood === "new" && r.isNew) s += 2;
    }
    if (input.time && m.times.includes(input.time)) s += 3;
    if (input.favRestaurants?.includes(r.id)) s += 2;
    if (input.favCategories?.includes(m.category)) s += 2;
    if (offerMeals.has(m.id)) s += 2;
    if (m.editorsPick) s += 1;
    if (r.rating) s += (r.rating - 4) * 2;
    const d = input.distances?.[r.id];
    if (d !== undefined) s -= Math.min(4, d * 0.15);
    s += rnd() * (input.mood === "surprise" ? 12 : 1.5);
    return { m, s };
  });
  scored.sort((a, b) => b.s - a.s);
  // Keep variety: max 2 meals per restaurant
  const per: Record<string, number> = {};
  const out: Meal[] = [];
  for (const { m } of scored) {
    if ((per[m.restaurantId] ?? 0) >= 2) continue;
    per[m.restaurantId] = (per[m.restaurantId] ?? 0) + 1;
    out.push(m);
    if (out.length >= limit) break;
  }
  return out;
}
