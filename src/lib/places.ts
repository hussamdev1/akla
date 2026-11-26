"use client";
import { useEffect, useState } from "react";
import { AREAS } from "@/data/geo";
import { BASE_PATH } from "./img";
import { parseOpeningHours } from "./openingHours";
import type { CategoryId, L, WeeklyHours } from "./types";

/** A real food place from OpenStreetMap (snapshot built by scripts/build-data.mjs). No ratings, prices or offers. */
export type Place = {
  id: string; // "n123" / "w123" / "r123"
  name: L;
  lat: number;
  lng: number;
  kind: "restaurant" | "fast_food" | "cafe" | "ice_cream" | "food_court";
  cuisineText?: string;
  categories: CategoryId[];
  hours?: WeeklyHours;
  hoursText?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  brand?: string;
  delivery?: boolean;
  vegetarian?: boolean;
  areaId: string;
  emoji: string;
};

type RawPlace = { i: string; n: string; a?: string; e?: string; y: number; x: number; t: string; c?: string; h?: string; p?: string; w?: string; g?: string; b?: string; d?: 1; v?: 1 };

const KIND: Record<string, Place["kind"]> = { r: "restaurant", f: "fast_food", c: "cafe", i: "ice_cream", o: "food_court" };

const CUISINE: [RegExp, CategoryId][] = [
  [/burger|american|hot_?dog/, "burgers"],
  [/pizza/, "pizza"],
  [/fried_chicken|^chicken|;chicken|broast/, "fried-chicken"],
  [/shawarma|falafel/, "shawarma"],
  [/kebab|grill|steak|barbecue|bbq|mandi/, "grilled"],
  [/barbecue|bbq|smoke/, "bbq"],
  [/sandwich|sub|bagel|wrap/, "sandwiches"],
  [/arab|lebanese|kuwaiti|regional|middle_eastern|syrian|turkish|persian|iranian|mediterranean|yemeni|egyptian|saudi|gulf|mandi|kabsa/, "arabic"],
  [/indian|pakistani|biryani|afghan|sri_lankan|nepal/, "indian"],
  [/italian|pasta/, "italian"],
  [/pasta/, "pasta"],
  [/chinese|thai|asian|filipino|korean|vietnamese|indonesian|malaysian|noodle/, "asian"],
  [/japanese|ramen/, "japanese"],
  [/sushi/, "sushi"],
  [/seafood|fish/, "seafood"],
  [/mexican|tex-mex|taco|burrito/, "mexican"],
  [/healthy|vegan|vegetarian|poke|salad/, "healthy"],
  [/salad/, "salads"],
  [/dessert|cake|donut|chocolate|crepe|waffle|pastry|bakery|kunafa|sweets/, "desserts"],
  [/ice_cream|frozen_yogurt|gelato/, "ice-cream"],
  [/coffee|cafe/, "coffee"],
  [/breakfast|pancake|brunch/, "breakfast"],
  [/juice|tea|bubble_tea|smoothie/, "beverages"],
];

const EMOJI: Partial<Record<CategoryId, string>> = {
  burgers: "🍔", pizza: "🍕", "fried-chicken": "🍗", shawarma: "🌯", grilled: "🔥", bbq: "🍖", sandwiches: "🥪", arabic: "🫓",
  indian: "🍛", italian: "🍝", asian: "🥡", japanese: "🍜", sushi: "🍣", seafood: "🦐", mexican: "🌮", healthy: "🥗",
  salads: "🥬", desserts: "🍰", "ice-cream": "🍦", coffee: "☕", breakfast: "🍳", beverages: "🧃", pasta: "🍝",
};

const isArabic = (s: string) => /[؀-ۿ]/.test(s);

const nearestArea = (lat: number, lng: number) =>
  AREAS.reduce((best, a) => ((a.lat - lat) ** 2 + (a.lng - lng) ** 2 < (best.lat - lat) ** 2 + (best.lng - lng) ** 2 ? a : best)).id;

function decode(r: RawPlace): Place {
  const kind = KIND[r.t] ?? "restaurant";
  const c = (r.c ?? "").toLowerCase();
  const cats = new Set<CategoryId>();
  for (const [re, cat] of CUISINE) if (re.test(c)) cats.add(cat);
  if (kind === "cafe" && !cats.size) cats.add("coffee");
  if (kind === "ice_cream") cats.add("ice-cream");
  const categories = [...cats];
  return {
    id: r.i,
    name: { ar: r.a ?? (isArabic(r.n) ? r.n : r.e ?? r.n), en: r.e ?? (isArabic(r.n) ? r.n : r.n) },
    lat: r.y,
    lng: r.x,
    kind,
    cuisineText: r.c?.replace(/_/g, " ").replace(/;/g, ", "),
    categories,
    hours: parseOpeningHours(r.h),
    hoursText: r.h,
    phone: r.p,
    website: r.w,
    instagram: r.g,
    brand: r.b,
    delivery: r.d === 1,
    vegetarian: r.v === 1,
    areaId: nearestArea(r.y, r.x),
    emoji: (categories[0] && EMOJI[categories[0]]) || (kind === "fast_food" ? "🍟" : "🍽️"),
  };
}

export type PlacesState = { status: "loading" | "ready" | "error"; places: Place[]; fetchedAt?: string | null };

let cache: Promise<PlacesState> | null = null;
function load(): Promise<PlacesState> {
  cache ??= fetch(`${BASE_PATH}/data/places.json`)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<{ fetchedAt: string | null; places: RawPlace[] }>;
    })
    .then((j) => ({ status: "ready" as const, places: j.places.map(decode), fetchedAt: j.fetchedAt }))
    .catch(() => {
      cache = null;
      return { status: "error" as const, places: [] };
    });
  return cache;
}

/** Real OpenStreetMap places, loaded once per visit (≈170 KB). */
export function usePlaces(enabled = true): PlacesState {
  const [state, setState] = useState<PlacesState>({ status: "loading", places: [] });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void load().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return state;
}

export const osmUrl = (id: string) => `https://www.openstreetmap.org/${{ n: "node", w: "way", r: "relation" }[id[0] as "n"]}/${id.slice(1)}`;
