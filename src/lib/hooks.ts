"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { buildOffers, OFFER_SPEC_ENDS_BEFORE_TODAY, OFFER_SPEC_STARTS_AFTER_TODAY } from "@/data/offers";
import { RESTAURANTS } from "@/data/restaurants";
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
  return useMemo(() => {
    const all = buildOffers(now ?? PRE_MOUNT_ANCHOR);
    if (!now) {
      return {
        all,
        active: all.filter((o) => !OFFER_SPEC_ENDS_BEFORE_TODAY.has(o.id) && !OFFER_SPEC_STARTS_AFTER_TODAY.has(o.id)),
        upcoming: all.filter((o) => OFFER_SPEC_STARTS_AFTER_TODAY.has(o.id)),
        expired: all.filter((o) => OFFER_SPEC_ENDS_BEFORE_TODAY.has(o.id)),
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
  }, [now]);
}

/** Distance (km) from the user's chosen location to every demo restaurant. */
export function useDistances() {
  const loc = useStore((s) => s.location);
  return useMemo(() => {
    const p = locationPoint(loc);
    const map: Record<string, number> = {};
    for (const r of RESTAURANTS) map[r.id] = haversineKm(p, r);
    return map;
  }, [loc]);
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
