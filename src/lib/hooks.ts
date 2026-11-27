"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { osmCountFor } from "@/data/live";
import { MEALS } from "@/data/meals";
import { buildOffers, preMountStatus } from "@/data/offers";
import { restaurantById, restaurantsIn } from "@/data/restaurants";
import { haversineKm, locationPoint } from "./geo";
import { useStore } from "./store";
import type { Offer } from "./types";

const subscribeNoop = () => () => {};
/** true only after hydration on the client */
export function useMounted() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/** Current time, ticking. `null` until mounted so server and first client render match. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value read after hydration (static export)
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const PRE_MOUNT_ANCHOR = new Date("2026-01-01T09:00:00Z");

export type OfferBuckets = { all: Offer[]; active: Offer[]; upcoming: Offer[]; expired: Offer[]; now: Date | null };

/** Offers bucketed by status. Expired offers are never part of `active`. */
export function useOffers(intervalMs = 30_000): OfferBuckets {
  const now = useNow(intervalMs);
  const country = useCountry();
  return useMemo(() => {
    const all = buildOffers(now ?? PRE_MOUNT_ANCHOR).filter((o) => restaurantById(o.restaurantId)?.country === country);
    if (!now) {
      return {
        all,
        active: all.filter((o) => preMountStatus(o) === "active"),
        upcoming: all.filter((o) => preMountStatus(o) === "upcoming"),
        expired: all.filter((o) => preMountStatus(o) === "expired"),
        now,
      };
    }
    const t = now.getTime();
    return {
      all,
      active: all.filter((o) => +new Date(o.startsAt) <= t && +new Date(o.expiresAt) > t),
      upcoming: all.filter((o) => +new Date(o.startsAt) > t),
      expired: all.filter((o) => +new Date(o.expiresAt) <= t),
      now,
    };
  }, [now, country]);
}

/** Selected country (ISO 3166-1 alpha-2). */
export const useCountry = () => useStore((s) => s.country);

/** Listed restaurants (Google Sheet / demo) in the selected country. */
export function useRestaurants() {
  const country = useCountry();
  return useMemo(() => restaurantsIn(country), [country]);
}

/** Listed meals in the selected country. */
export function useMeals() {
  const country = useCountry();
  return useMemo(() => MEALS.filter((m) => restaurantById(m.restaurantId)?.country === country), [country]);
}

/** What live content the selected country has; pages hide sections that would be empty. */
export function useLive() {
  const restaurants = useRestaurants();
  const meals = useMeals();
  const country = useCountry();
  return { hasListings: restaurants.length > 0, hasMeals: meals.length > 0, osmCount: osmCountFor(country) };
}

/** Distance (km) from the user's chosen location to every listed restaurant. */
export function useDistances() {
  const loc = useStore((s) => s.location);
  const country = useCountry();
  return useMemo(() => {
    const p = locationPoint(loc, country);
    const map: Record<string, number> = {};
    for (const r of restaurantsIn(country)) map[r.id] = haversineKm(p, r);
    return map;
  }, [loc, country]);
}

export function usePrefersReducedMotion() {
  const pref = useStore((s) => s.motion);
  const system = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  return pref === "reduced" || (pref === "system" && system);
}
