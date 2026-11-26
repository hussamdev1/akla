/**
 * Real places from OpenStreetMap via the public Overpass API (free, no key).
 * Fair use: small radius, results cached in sessionStorage, attribution shown in the UI.
 */
export type OsmPlace = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  nameAr?: string;
  nameEn?: string;
  amenity: string;
  cuisine?: string;
  hours?: string;
  phone?: string;
  website?: string;
};

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

export async function fetchOsmPlaces(lat: number, lng: number, radiusKm: number, signal?: AbortSignal): Promise<OsmPlace[]> {
  const r = Math.min(Math.round(radiusKm * 1000), 5000);
  const key = `osm:${lat.toFixed(3)}:${lng.toFixed(3)}:${r}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore */
  }
  const q = `[out:json][timeout:25];(nwr["amenity"~"^(restaurant|fast_food|cafe|ice_cream|food_court)$"]["name"](around:${r},${lat},${lng}););out center 200;`;
  let lastErr: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: q }), signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
      const places: OsmPlace[] = json.elements
        .map((e) => {
          const p = e.center ?? (e.lat !== undefined ? { lat: e.lat, lon: e.lon! } : null);
          const tg = e.tags ?? {};
          if (!p || !tg.name) return null;
          return {
            id: `osm-${e.type}-${e.id}`,
            lat: p.lat,
            lng: p.lon,
            name: tg.name,
            nameAr: tg["name:ar"],
            nameEn: tg["name:en"],
            amenity: tg.amenity,
            cuisine: tg.cuisine?.replace(/_/g, " ").replace(/;/g, ", "),
            hours: tg.opening_hours,
            phone: tg.phone ?? tg["contact:phone"],
            website: tg.website ?? tg["contact:website"],
          } satisfies OsmPlace;
        })
        .filter(Boolean) as OsmPlace[];
      try {
        sessionStorage.setItem(key, JSON.stringify(places));
      } catch {
        /* ignore */
      }
      return places;
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

export function osmEmoji(p: OsmPlace) {
  const c = (p.cuisine ?? "").toLowerCase();
  if (p.amenity === "cafe") return "☕";
  if (p.amenity === "ice_cream") return "🍦";
  if (/burger/.test(c)) return "🍔";
  if (/pizza/.test(c)) return "🍕";
  if (/chicken/.test(c)) return "🍗";
  if (/shawarma|kebab|lebanese|arab|turkish|syrian/.test(c)) return "🌯";
  if (/sushi|japanese/.test(c)) return "🍣";
  if (/indian|pakistani/.test(c)) return "🍛";
  if (/chinese|thai|asian|korean/.test(c)) return "🥡";
  if (/seafood|fish/.test(c)) return "🦐";
  if (/coffee/.test(c)) return "☕";
  if (/dessert|cake|donut/.test(c)) return "🍰";
  if (/sandwich/.test(c)) return "🥪";
  if (p.amenity === "fast_food") return "🍟";
  return "🍽️";
}
