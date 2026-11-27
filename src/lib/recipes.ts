/** Recipes: types, cuisines, quantity scaling and formatting. Data: scripts/build-recipes.mjs → src/data/generated/recipes*.json. */
import type { L, Locale } from "./types";

export type Course = "main" | "soup" | "salad" | "side" | "dessert" | "breakfast" | "bread";
export type Unit = "cup" | "tbsp" | "tsp" | "kg" | "g" | "ml" | "l" | "oz" | "lb" | "clove" | "can" | "pinch" | "slice" | "handful" | "bunch";
/** `h` = group heading ("For the dressing"); q/q2 = amount (range), u = unit, text = the rest. */
export type Ingredient = { h?: boolean; q?: number; q2?: number; u?: Unit; text: string };

export type Recipe = {
  id: string;
  cuisine: CuisineId;
  name: string;
  course: Course;
  image?: string;
  imageCredit?: { author?: string; license: string; url: string };
  video?: string;
  servings?: number;
  /** minutes mentioned in the steps (or stated by the source); a lower bound, not a promise */
  minutes?: number;
  difficulty: 1 | 2 | 3;
  veg: boolean;
  ingredients: Ingredient[];
  steps: string[];
  source: { kind: "mealdb" | "wikibooks"; url: string; title: string; license?: string; licenseUrl?: string };
  hash: string;
};
export type RecipeAr = { hash: string; name: string; ingredients: string[]; steps: string[] };
export type RecipeSummary = {
  id: string;
  cuisine: CuisineId;
  name: { en: string; ar?: string };
  image?: string;
  course: Course;
  minutes?: number;
  difficulty: 1 | 2 | 3;
  veg: boolean;
  keys: string;
};

export type CuisineId =
  | "syrian" | "lebanese" | "palestinian" | "gulf" | "yemeni" | "egyptian" | "moroccan" | "algerian" | "tunisian"
  | "turkish" | "indian" | "chinese" | "japanese" | "thai" | "italian" | "mexican";

/** Display order = this order. `flag` is the country's emoji flag; `color` a soft card tint. */
export const CUISINES: { id: CuisineId; name: L; flag: string; color: string }[] = [
  { id: "syrian", name: { ar: "سوري", en: "Syrian" }, flag: "🇸🇾", color: "#FFE3C9" },
  { id: "lebanese", name: { ar: "لبناني", en: "Lebanese" }, flag: "🇱🇧", color: "#DDF5C8" },
  { id: "palestinian", name: { ar: "فلسطيني", en: "Palestinian" }, flag: "🇵🇸", color: "#E3F0D9" },
  { id: "gulf", name: { ar: "سعودي وخليجي", en: "Saudi & Gulf" }, flag: "🇸🇦", color: "#FFF1B8" },
  { id: "yemeni", name: { ar: "يمني", en: "Yemeni" }, flag: "🇾🇪", color: "#FFD9D2" },
  { id: "egyptian", name: { ar: "مصري", en: "Egyptian" }, flag: "🇪🇬", color: "#FFE9B0" },
  { id: "moroccan", name: { ar: "مغربي", en: "Moroccan" }, flag: "🇲🇦", color: "#FFD6CC" },
  { id: "algerian", name: { ar: "جزائري", en: "Algerian" }, flag: "🇩🇿", color: "#D9F2E3" },
  { id: "tunisian", name: { ar: "تونسي", en: "Tunisian" }, flag: "🇹🇳", color: "#FFDDE3" },
  { id: "turkish", name: { ar: "تركي", en: "Turkish" }, flag: "🇹🇷", color: "#FFD6D9" },
  { id: "indian", name: { ar: "هندي", en: "Indian" }, flag: "🇮🇳", color: "#FFE2C2" },
  { id: "chinese", name: { ar: "صيني", en: "Chinese" }, flag: "🇨🇳", color: "#FFD4CC" },
  { id: "japanese", name: { ar: "ياباني", en: "Japanese" }, flag: "🇯🇵", color: "#F4E1F0" },
  { id: "thai", name: { ar: "تايلندي", en: "Thai" }, flag: "🇹🇭", color: "#DCE8FF" },
  { id: "italian", name: { ar: "إيطالي", en: "Italian" }, flag: "🇮🇹", color: "#E1F5D6" },
  { id: "mexican", name: { ar: "مكسيكي", en: "Mexican" }, flag: "🇲🇽", color: "#FFF0C2" },
];
export const cuisineById = (id: string) => CUISINES.find((c) => c.id === id);
export const COURSES: Course[] = ["main", "soup", "salad", "side", "dessert", "breakfast", "bread"];
export const COURSE_EMOJI: Record<Course, string> = { main: "🍲", soup: "🥣", salad: "🥗", side: "🫓", dessert: "🍰", breakfast: "🍳", bread: "🍞" };

/** The recipe's name in the current language (English when there is no Arabic yet). */
export const recipeName = (n: RecipeSummary["name"], locale: Locale) => (locale === "ar" && n.ar) || n.en;

/** An Arabic translation is used only if it was made from the current English text (same rule as the build script). */
export const usableAr = (r: Recipe, a?: RecipeAr) =>
  a && a.hash === r.hash && a.name && a.ingredients.length === r.ingredients.length && a.steps.length === r.steps.length ? a : undefined;

/* ---------- quantities ---------- */

const NICE: [number, string][] = [[0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"]];
const METRIC: Unit[] = ["g", "ml"];

/** 1.5 → "1½", 0.333 → "⅓", 437.5 g → "440". Latin digits in both languages (brand rule). */
export function formatQty(n: number, unit?: Unit) {
  if (unit && METRIC.includes(unit)) return String(n >= 100 ? Math.round(n / 10) * 10 : n >= 10 ? Math.round(n / 5) * 5 : Math.round(n));
  if (n >= 10) return String(Math.round(n));
  const whole = Math.floor(n);
  const frac = n - whole;
  const near = NICE.find(([v]) => Math.abs(frac - v) < 0.04);
  if (frac < 0.06) return String(whole || (n > 0 ? "¼" : "0"));
  if (frac > 0.94) return String(whole + 1);
  if (near) return whole ? `${whole}${near[1]}` : near[1];
  return String(Math.round(n * 10) / 10);
}

const UNIT_LABEL: Record<Unit, { en: [string, string]; ar: string }> = {
  cup: { en: ["cup", "cups"], ar: "كوب" },
  tbsp: { en: ["tbsp", "tbsp"], ar: "ملعقة كبيرة" },
  tsp: { en: ["tsp", "tsp"], ar: "ملعقة صغيرة" },
  kg: { en: ["kg", "kg"], ar: "كغ" },
  g: { en: ["g", "g"], ar: "غ" },
  ml: { en: ["ml", "ml"], ar: "مل" },
  l: { en: ["litre", "litres"], ar: "لتر" },
  oz: { en: ["oz", "oz"], ar: "أونصة" },
  lb: { en: ["lb", "lb"], ar: "رطل" },
  clove: { en: ["clove", "cloves"], ar: "فص" },
  can: { en: ["can", "cans"], ar: "علبة" },
  pinch: { en: ["pinch", "pinches"], ar: "رشة" },
  slice: { en: ["slice", "slices"], ar: "شريحة" },
  handful: { en: ["handful", "handfuls"], ar: "حفنة" },
  bunch: { en: ["bunch", "bunches"], ar: "ربطة" },
};

/** "1½ cups", "2–3 tbsp", "440 g" — or "" when the source gives no amount. */
export function amount(i: Ingredient, factor: number, locale: Locale) {
  if (i.q === undefined) return "";
  const q = formatQty(i.q * factor, i.u) + (i.q2 ? `–${formatQty(i.q2 * factor, i.u)}` : "");
  if (!i.u) return q;
  const many = (i.q2 ?? i.q) * factor > 1;
  return `${q} ${locale === "ar" ? UNIT_LABEL[i.u].ar : UNIT_LABEL[i.u].en[many ? 1 : 0]}`;
}

/** 45 → "45 min", 90 → "1 h 30 min" (ar: "45 د", "1 س 30 د"). */
export function formatMinutes(m: number, locale: Locale) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  const [H, M] = locale === "ar" ? ["س", "د"] : ["h", "min"];
  return h ? `${h} ${H}${r ? ` ${r} ${M}` : ""}` : `${r} ${M}`;
}

/** First duration in a step ("simmer for 20 minutes") → seconds, for the cook-mode timer. Reads the English text. */
export function stepTimer(step: string) {
  const m = step.toLowerCase().match(/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(minutes?|mins?|hours?|hrs?)\b/);
  if (!m) return undefined;
  const v = +(m[2] ?? m[1]);
  const s = Math.round(/^h/.test(m[3]) ? v * 3600 : v * 60);
  return s > 0 && s <= 6 * 3600 ? s : undefined;
}
