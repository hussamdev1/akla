"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_AREA, DEFAULT_AREA_ID } from "@/data/geo";
import { locationPoint } from "./geo";
import { activeRegion, DEFAULT_COUNTRY, defaultCity, isCountry, isFeatured, setActiveRegion, speaksArabic, type ActiveRegion } from "./region";
import { restaurantById } from "@/data/restaurants";
import { mealById } from "@/data/meals";
import type { Collection, FavKind, Locale, UserLocation } from "./types";

export type AchievementId = "first" | "burger" | "pizza" | "discount" | "adventurer" | "ten" | "cuisine" | "battle" | "streak";
export const ACHIEVEMENTS: { id: AchievementId; emoji: string; color: string; goal: number }[] = [
  { id: "first", emoji: "🧭", color: "#E63462", goal: 1 },
  { id: "burger", emoji: "🍔", color: "#FFD23F", goal: 3 },
  { id: "pizza", emoji: "🍕", color: "#F2542D", goal: 1 },
  { id: "discount", emoji: "🏷️", color: "#F2542D", goal: 5 },
  { id: "adventurer", emoji: "🎡", color: "#0E8C99", goal: 10 },
  { id: "ten", emoji: "🔟", color: "#9BE15D", goal: 10 },
  { id: "cuisine", emoji: "🌍", color: "#0284C7", goal: 6 },
  { id: "battle", emoji: "🏆", color: "#FFD23F", goal: 1 },
  { id: "streak", emoji: "🔥", color: "#E63462", goal: 3 },
];

export type SpinEntry = { at: string; label: string; emoji: string; href?: string };

type State = {
  locale: Locale;
  /** true once the user picked a language themselves; until then the language follows the country */
  langChosen: boolean;
  /** ISO 3166-1 alpha-2 of the selected country */
  country: string;
  location: UserLocation;
  /** device-time-zone country suggestion: shown once, then "done" */
  regionHint: "pending" | "done";
  motion: "system" | "reduced" | "full";
  sound: boolean;
  favorites: Record<FavKind, string[]>;
  collections: Collection[];
  views: Record<string, number>;
  offerViews: string[];
  categoryViews: string[];
  spins: SpinEntry[];
  spinCount: number;
  battlesWon: number;
  achievements: Partial<Record<AchievementId, string>>;
  streak: { last: string; count: number };
  challengesDone: Record<string, string[]>;
  // transient
  toast: { id: number; text: string; emoji?: string } | null;
  /** derived from country + location: time zone and currency (not persisted) */
  region: ActiveRegion;
};

type Actions = {
  setLocale: (l: Locale) => void;
  setLocation: (l: UserLocation) => void;
  /** Switch country; without a location, jumps to its default area / city. */
  setCountry: (country: string, location?: UserLocation) => void;
  dismissRegionHint: () => void;
  setMotion: (m: State["motion"]) => void;
  setSound: (s: boolean) => void;
  toggleFav: (kind: FavKind, id: string) => boolean;
  addCollection: (name: string, emoji: string) => string;
  deleteCollection: (id: string) => void;
  toggleInCollection: (cid: string, kind: FavKind, id: string) => void;
  trackView: (restaurantId: string) => void;
  trackOffer: (offerId: string) => void;
  trackCategory: (categoryId: string) => void;
  recordSpin: (e: Omit<SpinEntry, "at">) => void;
  winBattle: () => void;
  touchStreak: (dateKey: string) => void;
  toggleChallenge: (dateKey: string, id: string) => void;
  showToast: (text: string, emoji?: string) => void;
  clearToast: () => void;
  resetAll: () => void;
};

type Persisted = Omit<State, "toast" | "region">;

const initial: Persisted = {
  locale: "ar",
  langChosen: false,
  country: DEFAULT_COUNTRY,
  location: { kind: "area", areaId: DEFAULT_AREA_ID },
  regionHint: "pending",
  motion: "system",
  sound: true,
  favorites: { restaurants: [], meals: [], offers: [], categories: [] },
  collections: [],
  views: {},
  offerViews: [],
  categoryViews: [],
  spins: [],
  spinCount: 0,
  battlesWon: 0,
  achievements: {},
  streak: { last: "", count: 0 },
  challengesDone: {},
};

/** Progress toward each achievement, derived from state. */
export function achievementProgress(s: Persisted): Record<AchievementId, number> {
  const viewed = Object.keys(s.views);
  const burgerViews = viewed.filter((id) => restaurantById(id)?.categories.includes("burgers")).length;
  const pizzaSaved =
    s.favorites.meals.some((id) => mealById(id)?.category === "pizza") ||
    s.favorites.restaurants.some((id) => restaurantById(id)?.categories.includes("pizza")) ||
    s.favorites.categories.includes("pizza");
  return {
    first: viewed.length,
    burger: burgerViews,
    pizza: pizzaSaved ? 1 : 0,
    discount: s.offerViews.length,
    adventurer: s.spinCount,
    ten: viewed.length,
    cuisine: s.categoryViews.length,
    battle: s.battlesWon,
    streak: s.streak.count,
  };
}

let toastSeq = 0;

/** Default location of a country: its curated default area, else its capital / largest city. */
export function defaultLocation(country: string): UserLocation {
  if (isFeatured(country) && DEFAULT_AREA[country]) return { kind: "area", areaId: DEFAULT_AREA[country] };
  return { kind: "city", country, ...defaultCity(country) };
}

/** Recompute the active region (time zone, currency) and mirror it for the pure helpers. */
const regionFor = (country: string, location: UserLocation) => {
  setActiveRegion(country, locationPoint(location, country));
  return activeRegion();
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => {
      /** Re-check achievements after any change and surface a toast for new unlocks. */
      const check = () => {
        const s = get();
        const prog = achievementProgress(s);
        const newly = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && prog[a.id] >= a.goal);
        if (!newly.length) return;
        const now = new Date().toISOString();
        const achievements = { ...s.achievements };
        newly.forEach((a) => (achievements[a.id] = now));
        set({ achievements, toast: { id: ++toastSeq, text: `achievement:${newly[0].id}`, emoji: newly[0].emoji } });
      };

      return {
        ...initial,
        toast: null,
        region: regionFor(initial.country, initial.location),
        setLocale: (locale) => set({ locale, langChosen: true }),
        setLocation: (location) => set({ location, region: regionFor(get().country, location) }),
        setCountry: (country, location) => {
          if (!isCountry(country)) return;
          const loc = location ?? defaultLocation(country);
          const s = get();
          set({
            country,
            location: loc,
            region: regionFor(country, loc),
            regionHint: "done",
            // Until the user picks a language, it follows the country (Arabic in Arabic-speaking countries).
            ...(s.langChosen ? {} : { locale: speaksArabic(country) ? "ar" : "en" }),
          });
        },
        dismissRegionHint: () => set({ regionHint: "done" }),
        setMotion: (motion) => set({ motion }),
        setSound: (sound) => set({ sound }),
        toggleFav: (kind, id) => {
          const list = get().favorites[kind];
          const has = list.includes(id);
          set({ favorites: { ...get().favorites, [kind]: has ? list.filter((x) => x !== id) : [id, ...list] } });
          check();
          return !has;
        },
        addCollection: (name, emoji) => {
          const id = `c${Date.now().toString(36)}`;
          set({ collections: [...get().collections, { id, name, emoji, items: [], createdAt: new Date().toISOString() }] });
          return id;
        },
        deleteCollection: (id) => set({ collections: get().collections.filter((c) => c.id !== id) }),
        toggleInCollection: (cid, kind, id) =>
          set({
            collections: get().collections.map((c) => {
              if (c.id !== cid) return c;
              const has = c.items.some((i) => i.kind === kind && i.id === id);
              return { ...c, items: has ? c.items.filter((i) => !(i.kind === kind && i.id === id)) : [...c.items, { kind, id }] };
            }),
          }),
        trackView: (rid) => {
          set({ views: { ...get().views, [rid]: (get().views[rid] ?? 0) + 1 } });
          check();
        },
        trackOffer: (oid) => {
          if (!get().offerViews.includes(oid)) set({ offerViews: [...get().offerViews, oid] });
          check();
        },
        trackCategory: (cid) => {
          if (!get().categoryViews.includes(cid)) set({ categoryViews: [...get().categoryViews, cid] });
          check();
        },
        recordSpin: (e) => {
          set({ spins: [{ ...e, at: new Date().toISOString() }, ...get().spins].slice(0, 12), spinCount: get().spinCount + 1 });
          check();
        },
        winBattle: () => {
          set({ battlesWon: get().battlesWon + 1 });
          check();
        },
        touchStreak: (key) => {
          const { last, count } = get().streak;
          if (last === key) return;
          const y = new Date(new Date(key + "T00:00:00Z").getTime() - 864e5).toISOString().slice(0, 10);
          set({ streak: { last: key, count: last === y ? count + 1 : 1 } });
          check();
        },
        toggleChallenge: (key, id) => {
          const list = get().challengesDone[key] ?? [];
          set({ challengesDone: { ...get().challengesDone, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } });
        },
        showToast: (text, emoji) => set({ toast: { id: ++toastSeq, text, emoji } }),
        clearToast: () => set({ toast: null }),
        resetAll: () => {
          const { locale, langChosen, country, location, regionHint } = get();
          set({ ...initial, locale, langChosen, country, location, regionHint });
        },
      };
    },
    {
      name: "akla",
      version: 2,
      skipHydration: true,
      // v1 (Kuwait-only) settings: keep everything, add the country. The locale was the user's own choice.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<Persisted>;
        if (version < 2) return { ...p, country: DEFAULT_COUNTRY, langChosen: p.locale === "en", regionHint: "done" } as Persisted;
        return p as Persisted;
      },
      merge: (persisted, current) => {
        const s = { ...current, ...(persisted as Partial<Persisted>) };
        if (!isCountry(s.country)) s.country = DEFAULT_COUNTRY;
        return { ...s, region: regionFor(s.country, s.location) };
      },
      partialize: ({ toast: _t, region: _r, ...rest }) => {
        void _t;
        void _r;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
    },
  ),
);

export const useFav = (kind: FavKind, id: string) => useStore((s) => s.favorites[kind].includes(id));
