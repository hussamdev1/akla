import { CATEGORIES } from "@/data/categories";
import { MEALS } from "@/data/meals";
import { RESTAURANTS } from "@/data/restaurants";
import { activeRegion } from "./region";
import type { L } from "./types";

/** Loose normalisation so "شاورما", "شاورمه" and "Shawarma" all match. */
export function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const hit = (q: string, ...ls: (L | string | undefined)[]) =>
  ls.some((x) => x && (typeof x === "string" ? norm(x).includes(q) : norm(x.ar).includes(q) || norm(x.en).includes(q)));

export function searchAll(raw: string) {
  const q = norm(raw);
  if (!q) return { restaurants: [], meals: [], categories: [] };
  const categories = CATEGORIES.filter((c) => hit(q, c.name, c.id));
  const catIds = new Set(categories.map((c) => c.id));
  // listings of the selected country only
  const { country } = activeRegion();
  const inCountry = new Set(RESTAURANTS.filter((r) => r.country === country).map((r) => r.id));
  return {
    categories,
    restaurants: RESTAURANTS.filter((r) => r.country === country && (hit(q, r.name, r.tagline) || r.categories.some((c) => catIds.has(c)))).slice(0, 8),
    meals: MEALS.filter((m) => inCountry.has(m.restaurantId) && (hit(q, m.name, m.description) || catIds.has(m.category))).slice(0, 10),
  };
}
