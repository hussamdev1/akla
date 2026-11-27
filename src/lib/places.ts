"use client";
import { useEffect, useState } from "react";
import { nearestArea } from "@/data/geo";
import { locationPoint } from "./geo";
import { BASE_PATH } from "./img";
import { isFeatured } from "./region";
import { useStore } from "./store";
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
  /** curated area (featured countries) */
  areaId?: string;
  /** addr:city from OpenStreetMap (live places) */
  city?: string;
  emoji: string;
};

/** Compact place as written by scripts/build-data.mjs (and by compact() below for live results). */
type RawPlace = { i: string; n: string; a?: string; e?: string; y: number; x: number; t: string; c?: string; h?: string; p?: string; w?: string; g?: string; b?: string; d?: 1; v?: 1; k?: string };

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

function decode(r: RawPlace, country: string): Place {
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
    areaId: nearestArea(r.y, r.x, country)?.id,
    city: r.k,
    emoji: (categories[0] && EMOJI[categories[0]]) || (kind === "fast_food" ? "🍟" : "🍽️"),
  };
}

export type PlacesState = {
  status: "loading" | "ready" | "error";
  places: Place[];
  fetchedAt?: string | null;
  /** loaded live from Overpass around the user's location (not a build-time snapshot) */
  live?: boolean;
  /** radius of a live query, km */
  radiusKm?: number;
};

/* ---------------- Featured countries: build-time snapshot per country ---------------- */

const cache = new Map<string, Promise<PlacesState>>();

function loadSnapshot(country: string): Promise<PlacesState> {
  const key = `snap:${country}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`${BASE_PATH}/data/places/${country}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ fetchedAt: string | null; places: RawPlace[] }>;
      })
      .then((j) => ({ status: "ready" as const, places: j.places.map((x) => decode(x, country)), fetchedAt: j.fetchedAt }))
      .catch(() => {
        cache.delete(key);
        return { status: "error" as const, places: [] };
      });
    cache.set(key, p);
  }
  return p;
}

/* ---------------- Everywhere else: live Overpass query around the location ----------------
 * Fair use of the free public Overpass API: one request at a time per visitor, small radius, at most LIMIT
 * results, cached on the device per ~1 km grid cell for 24 h, other mirrors if the first fails or is slow. */

// Tried in order. All three answer CORS requests; the main server is often the slowest under load.
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const LIMIT = 400;
const RADII = [2500, 8000]; // m — widen once when the first ring has few places
const TTL = 24 * 3600e3;
const LIVE_KEY = "akla-live";
const LIVE_MAX = 8;
const AMENITY: Record<string, string> = { restaurant: "r", fast_food: "f", cafe: "c", ice_cream: "i", food_court: "o" };
const r5 = (n: number) => Math.round(n * 1e5) / 1e5;

type OsmElement = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

/** Same compaction as scripts/build-data.mjs, plus addr:city. */
function compact(el: OsmElement): RawPlace | null {
  const t = el.tags ?? {};
  const p = el.center ?? (el.lat !== undefined ? { lat: el.lat, lon: el.lon! } : null);
  if (!p || !t.name || t["disused:amenity"] || t.disused === "yes") return null;
  const o: RawPlace = { i: `${el.type[0]}${el.id}`, n: t.name, y: r5(p.lat), x: r5(p.lon), t: AMENITY[t.amenity] ?? "r" };
  if (t["name:ar"] && t["name:ar"] !== t.name) o.a = t["name:ar"];
  if (t["name:en"] && t["name:en"] !== t.name) o.e = t["name:en"];
  if (t.cuisine) o.c = t.cuisine;
  if (t.opening_hours) o.h = t.opening_hours;
  if (t.phone ?? t["contact:phone"]) o.p = t.phone ?? t["contact:phone"];
  if (t.website ?? t["contact:website"]) o.w = t.website ?? t["contact:website"];
  if (t["contact:instagram"]) o.g = t["contact:instagram"];
  if (t.brand) o.b = t.brand;
  if (t.delivery === "yes") o.d = 1;
  if (t["diet:vegetarian"] === "yes" || t["diet:vegetarian"] === "only") o.v = 1;
  if (t["addr:city"]) o.k = t["addr:city"];
  return o;
}

let inFlight: Promise<unknown> = Promise.resolve();
/** Run Overpass queries one after another (the public servers allow ~2 parallel slots per IP). */
function overpass(ql: string): Promise<OsmElement[]> {
  const run = inFlight.then(async () => {
    let last: unknown;
    for (const [i, url] of OVERPASS.entries()) {
      try {
        // Form-encoded POST is a "simple" CORS request: no preflight. Don't wait long on a busy main server.
        const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: ql }), signal: AbortSignal.timeout(i === 0 ? 25_000 : 60_000) });
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        return ((await res.json()) as { elements?: OsmElement[] }).elements ?? [];
      } catch (e) {
        last = e;
      }
    }
    throw last;
  });
  inFlight = run.catch(() => undefined);
  return run;
}

const FOOD = `["amenity"~"^(restaurant|fast_food|cafe|ice_cream|food_court)$"]["name"]`;

type LiveEntry = { at: number; r: number; fetchedAt: string; places: RawPlace[] };
function readLive(): Record<string, LiveEntry> {
  try {
    return JSON.parse(localStorage.getItem(LIVE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writeLive(key: string, e: LiveEntry) {
  const all = { ...readLive(), [key]: e };
  const keep = Object.entries(all).sort((a, b) => b[1].at - a[1].at).slice(0, LIVE_MAX);
  try {
    localStorage.setItem(LIVE_KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch {
    // quota: drop the cache rather than fail
    try {
      localStorage.removeItem(LIVE_KEY);
    } catch {}
  }
}

const cellOf = (p: { lat: number; lng: number }) => `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;

function loadLive(country: string, p: { lat: number; lng: number }): Promise<PlacesState> {
  const cell = cellOf(p);
  const key = `live:${cell}`;
  const hit = readLive()[cell];
  if (hit && Date.now() - hit.at < TTL) {
    return Promise.resolve({ status: "ready", places: hit.places.map((x) => decode(x, country)), fetchedAt: hit.fetchedAt, live: true, radiusKm: hit.r / 1000 });
  }
  let pr = cache.get(key);
  if (!pr) {
    const [lat, lng] = cell.split(",").map(Number);
    pr = (async () => {
      let raw: RawPlace[] = [];
      let r = RADII[0];
      for (r of RADII) {
        const els = await overpass(`[out:json][timeout:60];nwr(around:${r},${lat},${lng})${FOOD};out tags center ${LIMIT};`);
        const seen = new Set<string>();
        raw = els.map(compact).filter((x): x is RawPlace => !!x && !seen.has(x.i) && !!seen.add(x.i));
        if (raw.length >= 25) break;
      }
      const fetchedAt = new Date().toISOString();
      writeLive(cell, { at: Date.now(), r, fetchedAt, places: raw });
      return { status: "ready" as const, places: raw.map((x) => decode(x, country)), fetchedAt, live: true, radiusKm: r / 1000 };
    })().catch(() => {
      cache.delete(key);
      return { status: "error" as const, places: [], live: true };
    });
    cache.set(key, pr);
  }
  return pr;
}

/** A single place by OSM id (for /place/?id= links outside the loaded area). */
export function loadPlaceById(id: string, country: string): Promise<Place | undefined> {
  const kind = { n: "node", w: "way", r: "relation" }[id[0]];
  const num = id.slice(1);
  if (!kind || !/^\d+$/.test(num)) return Promise.resolve(undefined);
  return overpass(`[out:json][timeout:25];${kind}(${num});out tags center;`)
    .then((els) => {
      const raw = els.map(compact).find(Boolean);
      return raw ? decode(raw, country) : undefined;
    })
    .catch(() => undefined);
}

const LOADING: PlacesState = { status: "loading", places: [] };

/**
 * Real OpenStreetMap places for the selected country: the build-time snapshot for featured countries
 * (≈130 KB–1 MB, loaded once per visit), or a live query around the chosen location elsewhere.
 */
export function usePlaces(enabled = true): PlacesState & { retry: () => void } {
  const country = useStore((s) => s.country);
  const loc = useStore((s) => s.location);
  const featured = isFeatured(country);
  const point = locationPoint(loc, country);
  const key = featured ? `snap:${country}` : `live:${country}:${cellOf(point)}`;
  const [state, setState] = useState<{ key: string; s: PlacesState } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const job = featured ? loadSnapshot(country) : loadLive(country, point);
    void job.then((s) => alive && setState({ key, s }));
    return () => {
      alive = false;
    };
    // point is derived from key; re-run only when the key or retry counter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, attempt]);
  const s = state?.key === key ? state.s : { ...LOADING, live: !featured };
  return { ...s, retry: () => setAttempt((n) => n + 1) };
}

export const osmUrl = (id: string) => `https://www.openstreetmap.org/${{ n: "node", w: "way", r: "relation" }[id[0] as "n"]}/${id.slice(1)}`;
