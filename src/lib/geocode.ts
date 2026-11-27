"use client";
import type { Locale } from "./types";

/**
 * Nominatim (OpenStreetMap geocoder), used for city search outside the curated areas and to find the country of a
 * GPS fix. Public-instance policy (operations.osmfoundation.org/policies/nominatim): max 1 request/second, no
 * search-as-you-type, cache results, attribute OSM. We only call it on an explicit submit / GPS tap, queue calls
 * ≥1.1 s apart and cache answers in localStorage.
 */
const BASE = "https://nominatim.openstreetmap.org";
const GAP_MS = 1100;
let last = 0;
let queue: Promise<unknown> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = last + GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    return fn();
  });
  queue = run.catch(() => undefined);
  return run;
}

const CACHE_KEY = "akla-geocode";
const CACHE_MAX = 60;
function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  let store: Record<string, T> = {};
  try {
    store = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {}
  if (key in store) return Promise.resolve(store[key]);
  return fn().then((v) => {
    try {
      const entries = Object.entries({ ...store, [key]: v }).slice(-CACHE_MAX);
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
    return v;
  });
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json() as Promise<T>;
}

export type CityHit = { name: string; detail: string; lat: number; lng: number; country: string };

/** Cities / towns / neighbourhoods matching `q`, limited to one country. */
export function searchCity(q: string, country: string, locale: Locale): Promise<CityHit[]> {
  const query = q.trim();
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "8", countrycodes: country.toLowerCase(), "accept-language": locale, addressdetails: "1" });
  return cached(`s:${country}:${locale}:${query.toLowerCase()}`, () =>
    throttled(() => getJson<{ name: string; display_name: string; lat: string; lon: string; address?: { country_code?: string } }[]>(`/search?${params}`)).then((rows) =>
      rows.map((r) => ({
        name: r.name || r.display_name.split(",")[0],
        detail: r.display_name.split(",").slice(1, 3).join(",").trim(),
        lat: Number(r.lat),
        lng: Number(r.lon),
        country: (r.address?.country_code ?? country).toUpperCase(),
      })),
    ),
  );
}

/** ISO country code of a point, or undefined (sea, error). Rounded to ~1 km so repeated GPS fixes hit the cache. */
export function countryAt(lat: number, lng: number): Promise<string | undefined> {
  const la = lat.toFixed(2), lo = lng.toFixed(2);
  return cached(`r:${la},${lo}`, () =>
    throttled(() => getJson<{ address?: { country_code?: string } }>(`/reverse?${new URLSearchParams({ lat: la, lon: lo, format: "jsonv2", zoom: "3" })}`)).then(
      (r) => r.address?.country_code?.toUpperCase(),
    ),
  ).catch(() => undefined);
}
