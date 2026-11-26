"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_AREA_ID } from "@/data/geo";
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
  location: UserLocation;
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
};

type Actions = {
  setLocale: (l: Locale) => void;
  setLocation: (l: UserLocation) => void;
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

const initial: Omit<State, "toast"> = {
  locale: "ar",
  location: { kind: "area", areaId: DEFAULT_AREA_ID },
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
export function achievementProgress(s: Omit<State, "toast">): Record<AchievementId, number> {
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
        setLocale: (locale) => set({ locale }),
        setLocation: (location) => set({ location }),
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
        resetAll: () => set({ ...initial, locale: get().locale }),
      };
    },
    {
      name: "akla",
      version: 1,
      skipHydration: true,
      partialize: ({ toast: _t, ...rest }) => {
        void _t;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
    },
  ),
);

export const useFav = (kind: FavKind, id: string) => useStore((s) => s.favorites[kind].includes(id));
