#!/usr/bin/env node
/**
 * Akla data builder — runs before `next build` (and on a schedule in GitHub Actions).
 *
 * 1. OpenStreetMap: for each featured country (AKLA_COUNTRIES, default the six GCC states) downloads every named
 *    restaurant / café / fast-food place via the public Overpass API and writes a compact snapshot to
 *    public/data/places/<ISO2>.json. Other countries are queried live by the browser (src/lib/places.ts).
 *    If a download fails, that country's previous snapshot is kept (the site never breaks because Overpass is busy).
 * 2. Google Sheet: if AKLA_SHEET_ID is set, reads the `restaurants`, `meals` and `offers` tabs of that sheet
 *    (shared as "Anyone with the link → Viewer"). Otherwise reads the local templates in data/sheet/*.csv.
 *    Only rows with status = "published" are used. Output: src/data/generated/sheet.json
 *
 * Usage:  node scripts/build-data.mjs [--force-osm] [--skip-osm]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLACES_DIR = path.join(ROOT, "public", "data", "places");
const LEGACY_PLACES = path.join(ROOT, "public", "data", "places.json"); // Kuwait-only snapshot before multi-country
const COUNTRIES = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "generated", "countries.json"), "utf8"));
// Keep in sync with FEATURED_COUNTRIES in src/data/geo.ts.
const FEATURED = (process.env.AKLA_COUNTRIES || "KW,SA,AE,QA,BH,OM").split(",").map((c) => c.trim().toUpperCase()).filter((c) => COUNTRIES[c]);
const placesFile = (cc) => path.join(PLACES_DIR, `${cc}.json`);
const GEN_DIR = path.join(ROOT, "src", "data", "generated");
const SHEET_OUT = path.join(GEN_DIR, "sheet.json");
const META_OUT = path.join(GEN_DIR, "meta.json");
const LOCAL_SHEET_DIR = process.env.AKLA_SHEET_DIR || path.join(ROOT, "data", "sheet");

const args = new Set(process.argv.slice(2));
const isCI = !!process.env.CI;
const UA = "Akla-data-builder/1.0 (static food discovery site)";
const OSM_MAX_AGE_H = 12;

const log = (...a) => console.log("[data]", ...a);
const warn = (...a) => console.warn("[data] ⚠", ...a);

fs.mkdirSync(PLACES_DIR, { recursive: true });
if (fs.existsSync(LEGACY_PLACES) && !fs.existsSync(placesFile("KW"))) fs.renameSync(LEGACY_PLACES, placesFile("KW"));
fs.mkdirSync(GEN_DIR, { recursive: true });

const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
};
const meta = readJson(META_OUT, {});

/* ------------------------------------------------------------------ */
/* 1. OpenStreetMap                                                     */
/* ------------------------------------------------------------------ */

const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const query = (cc) => `[out:json][timeout:300];
area["ISO3166-1"="${cc}"][admin_level=2]->.c;
nwr["amenity"~"^(restaurant|fast_food|cafe|ice_cream|food_court)$"]["name"](area.c);
out center tags;`;

const AMENITY = { restaurant: "r", fast_food: "f", cafe: "c", ice_cream: "i", food_court: "o" };
const r5 = (n) => Math.round(n * 1e5) / 1e5;

async function fetchOsm(cc) {
  let lastErr;
  for (const url of OVERPASS) {
    try {
      log(`Overpass ${cc} →`, url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query(cc) }),
        signal: AbortSignal.timeout(330_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json;
    } catch (e) {
      lastErr = e;
      warn("Overpass failed:", e.message);
    }
  }
  throw lastErr;
}

function compactPlaces(json) {
  const out = [];
  const seen = new Set();
  for (const el of json.elements ?? []) {
    const t = el.tags ?? {};
    const p = el.center ?? (el.lat !== undefined ? { lat: el.lat, lon: el.lon } : null);
    if (!p || !t.name) continue;
    if (t["disused:amenity"] || t.disused === "yes" || t.abandoned === "yes") continue;
    const id = `${el.type[0]}${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const place = { i: id, n: t.name, y: r5(p.lat), x: r5(p.lon), t: AMENITY[t.amenity] ?? "r" };
    if (t["name:ar"] && t["name:ar"] !== t.name) place.a = t["name:ar"];
    if (t["name:en"] && t["name:en"] !== t.name) place.e = t["name:en"];
    if (t.cuisine) place.c = t.cuisine;
    if (t.opening_hours) place.h = t.opening_hours;
    const phone = t.phone ?? t["contact:phone"];
    if (phone) place.p = phone;
    const web = t.website ?? t["contact:website"];
    if (web) place.w = web;
    const ig = t["contact:instagram"];
    if (ig) place.g = ig;
    if (t.brand) place.b = t.brand;
    if (t.delivery === "yes") place.d = 1;
    if (t["diet:vegetarian"] === "yes" || t["diet:vegetarian"] === "only") place.v = 1;
    out.push(place);
  }
  out.sort((a, b) => a.i.localeCompare(b.i));
  return { osmBase: json.osm3s?.timestamp_osm_base ?? null, places: out };
}

async function buildCountry(cc, prev) {
  const file = placesFile(cc);
  const existing = fs.existsSync(file);
  const ageH = prev?.fetchedAt ? (Date.now() - Date.parse(prev.fetchedAt)) / 36e5 : Infinity;
  // Re-fetch when stale (12 h) — in CI too, so a 6-hourly deploy refreshes each country about twice a day.
  if (args.has("--skip-osm") || (!args.has("--force-osm") && existing && ageH < OSM_MAX_AGE_H)) {
    log(`OSM ${cc}: snapshot kept (${existing ? `${ageH.toFixed(1)}h old` : "missing"})`);
    if (!existing) fs.writeFileSync(file, JSON.stringify({ v: 1, osmBase: null, fetchedAt: null, places: [] }));
    return prev ?? { count: 0, fetchedAt: null };
  }
  try {
    const { osmBase, places } = compactPlaces(await fetchOsm(cc));
    // Guard against partial answers: keep the old file if the new one is much smaller.
    const min = Math.max(20, Math.floor((prev?.count ?? 0) * 0.5));
    if (places.length < min) throw new Error(`only ${places.length} places returned (expected ≥ ${min}) — keeping previous snapshot`);
    const fetchedAt = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify({ v: 1, country: cc, osmBase, fetchedAt, places }));
    log(`OSM ${cc}: ${places.length} real places saved`);
    return { count: places.length, fetchedAt, osmBase };
  } catch (e) {
    warn(`OSM ${cc} update skipped:`, e.message);
    if (!existing) fs.writeFileSync(file, JSON.stringify({ v: 1, osmBase: null, fetchedAt: null, places: [] }));
    return prev ?? { count: 0, fetchedAt: null };
  }
}

async function buildOsm() {
  // meta before multi-country support described the Kuwait snapshot only.
  const prevAll = meta.osm?.countries ?? (meta.osm ? { KW: { count: meta.osm.count, fetchedAt: meta.osm.fetchedAt, osmBase: meta.osm.osmBase } } : {});
  const countries = {};
  for (const cc of FEATURED) {
    countries[cc] = await buildCountry(cc, prevAll[cc]);
    // Be gentle with the shared Overpass servers between country queries.
    if (countries[cc] !== prevAll[cc] && cc !== FEATURED.at(-1)) await new Promise((r) => setTimeout(r, 3000));
  }
  const times = Object.values(countries).map((c) => c.fetchedAt).filter(Boolean).sort();
  return { count: Object.values(countries).reduce((n, c) => n + (c.count ?? 0), 0), fetchedAt: times[0] ?? null, countries };
}

/* ------------------------------------------------------------------ */
/* 2. Google Sheet (or local CSV templates)                             */
/* ------------------------------------------------------------------ */

/** RFC 4180-ish CSV parser (quotes, escaped quotes, newlines in cells). */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

async function readTab(tab) {
  const id = process.env.AKLA_SHEET_ID?.trim();
  if (id) {
    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`Google Sheet tab "${tab}": HTTP ${res.status} (is the sheet shared "Anyone with the link → Viewer"?)`);
    const text = await res.text();
    if (text.trimStart().startsWith("<")) throw new Error(`Google Sheet tab "${tab}" returned HTML — check sharing settings and tab name`);
    return parseCsv(text);
  }
  const file = path.join(LOCAL_SHEET_DIR, `${tab}.csv`);
  return fs.existsSync(file) ? parseCsv(fs.readFileSync(file, "utf8")) : [];
}

const CATEGORY_IDS = new Set(["burgers", "pizza", "fried-chicken", "grilled", "bbq", "sandwiches", "shawarma", "arabic", "indian", "italian", "asian", "japanese", "sushi", "seafood", "mexican", "healthy", "salads", "pasta", "desserts", "ice-cream", "coffee", "breakfast", "beverages"]);
const MOODS = new Set(["starving", "delicious", "cheap", "healthy", "spicy", "comfort", "sweet", "surprise", "new"]);
const TIMES = new Set(["breakfast", "morning", "lunch", "afternoon", "dinner", "late"]);
const SIZES = new Set(["snack", "regular", "large", "family"]);
const OFFER_TYPES = new Set(["percent", "bogo", "combo", "family", "free-delivery", "fixed"]);
const OFFER_TAGS = new Set(["lunch", "dinner", "exclusive", "limited", "weekend"]);
const STALE_DAYS = 60; // meal prices older than this are flagged in the problem list

const yes = (v) => /^(yes|y|true|1|نعم)$/i.test(v ?? "");
const num = (v) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const list = (v, allowed) => (v ? v.split(/[,،|]/).map((s) => s.trim().toLowerCase()).filter((s) => s && (!allowed || allowed.has(s))) : []);
const slug = (v) => (v ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
/** Offset of an IANA zone from UTC at instant `t` (ms). */
const tzOffset = (t, tz) => {
  const o = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
      .formatToParts(new Date(t))
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second) - Math.floor(t / 1000) * 1000;
};
/** "2026-12-01 18:00" in the restaurant's local time (default Asia/Kuwait) → ISO */
const localDate = (v, tz = "Asia/Kuwait") => {
  if (!v) return undefined;
  const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (!m) return undefined;
  const [, y, mo, d, h = "0", mi = "0"] = m;
  const wall = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  return new Date(wall - tzOffset(wall - tzOffset(wall, tz), tz)).toISOString();
};
const validTz = (tz) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
/** Zone of a point in a country: nearest zone.tab reference city (exact for single-zone countries). */
const zoneAt = (cc, lat, lng) =>
  COUNTRIES[cc].z.reduce((best, z) => ((z[1] - lat) ** 2 + (z[2] - lng) ** 2 < (best[1] - lat) ** 2 + (best[2] - lng) ** 2 ? z : best))[0];

async function buildSheet() {
  const source = process.env.AKLA_SHEET_ID ? "google-sheet" : "local-csv";
  const problems = [];
  const published = (rows) => rows.filter((r) => (r.status ?? "").toLowerCase() === "published");
  let raw;
  try {
    raw = { restaurants: await readTab("restaurants"), meals: await readTab("meals"), offers: await readTab("offers") };
  } catch (e) {
    warn(e.message);
    if (isCI && process.env.AKLA_SHEET_ID) {
      // Keep the last good sheet data instead of publishing an empty site.
      const prev = readJson(SHEET_OUT, null);
      if (prev) return { data: prev, info: { ...(meta.sheet ?? {}), error: e.message } };
    }
    raw = { restaurants: [], meals: [], offers: [] };
  }

  // Rows can point at an OpenStreetMap place (osm_id like "n123456" or "node/123456") to inherit its location & hours.
  const placeMap = new Map(FEATURED.flatMap((cc) => readJson(placesFile(cc), { places: [] }).places ?? []).map((p) => [p.i, p]));
  const osmKey = (v) => (v ? v.trim().replace(/^(node|way|relation)\//, (m) => m[0]) : "");

  const restaurants = [];
  for (const r of published(raw.restaurants)) {
    const id = slug(r.id);
    const osm = placeMap.get(osmKey(r.osm_id));
    const lat = num(r.lat) ?? osm?.y, lng = num(r.lng) ?? osm?.x;
    if (!r.hours && osm?.h) r.hours = osm.h;
    if (!r.phone && osm?.p) r.phone = osm.p;
    if (!r.website && osm?.w) r.website = osm.w;
    const cats = list(r.categories, CATEGORY_IDS);
    if (!id || !(r.name_ar || r.name_en) || !cats.length) { problems.push(`restaurants: row "${r.id}" needs id, a name and at least one valid category`); continue; }
    if (lat === undefined || lng === undefined) { problems.push(`restaurants: row "${r.id}" needs lat/lng or a valid osm_id`); continue; }
    // Multi-country columns. Rows without them are Kuwait (KWD, Asia/Kuwait), as before.
    const country = (r.country || "KW").trim().toUpperCase();
    if (!COUNTRIES[country]) { problems.push(`restaurants: row "${r.id}" has unknown country "${r.country}" (use a 2-letter ISO code like KW, SA, AE, GB)`); continue; }
    const timeZone = r.timezone && validTz(r.timezone.trim()) ? r.timezone.trim() : zoneAt(country, lat, lng);
    if (r.timezone && timeZone !== r.timezone.trim()) problems.push(`restaurants: row "${r.id}" timezone "${r.timezone}" is not an IANA zone — using ${timeZone}`);
    const currency = (r.currency || COUNTRIES[country].c).trim().toUpperCase();
    restaurants.push({
      id, osmId: osmKey(r.osm_id) || undefined,
      name: { ar: r.name_ar || r.name_en, en: r.name_en || r.name_ar },
      tagline: { ar: r.tagline_ar || "", en: r.tagline_en || "" },
      description: { ar: r.description_ar || "", en: r.description_en || "" },
      categories: cats, areaId: r.area_id || undefined, lat, lng, country, currency, timeZone, city: r.city || undefined,
      priceLevel: Math.min(4, Math.max(1, num(r.price_level) ?? 2)),
      rating: num(r.rating), ratingCount: num(r.rating_count), ratingSource: r.rating_source || undefined,
      phone: r.phone || undefined, hoursText: r.hours || undefined,
      delivery: yes(r.delivery), dineIn: yes(r.dine_in),
      cover: r.cover_image_url || undefined, emoji: r.emoji || "🍽️", brand: r.brand_color || "#E63462",
      featured: yes(r.featured), isNew: yes(r.is_new),
      orderUrl: r.order_url || undefined, website: r.website || undefined, instagram: r.instagram || undefined,
      updatedAt: r.updated_at || new Date().toISOString().slice(0, 10),
    });
  }
  const rIds = new Set(restaurants.map((r) => r.id));
  const rById = new Map(restaurants.map((r) => [r.id, r]));

  const meals = [];
  for (const m of published(raw.meals)) {
    // `price` is in the restaurant's currency (or `currency`); `price_kwd` is the pre-multi-country column, kept working.
    const id = slug(m.id), rid = slug(m.restaurant_id), legacy = m.price === undefined || m.price === "";
    const price = legacy ? num(m.price_kwd) : num(m.price);
    const category = (m.category ?? "").toLowerCase();
    if (!id || !rIds.has(rid) || price === undefined || !CATEGORY_IDS.has(category) || !(m.name_ar || m.name_en)) {
      problems.push(`meals: row "${m.id}" needs id, a published restaurant_id, name, valid category and price (or price_kwd)`);
      continue;
    }
    meals.push({
      id, restaurantId: rid, name: { ar: m.name_ar || m.name_en, en: m.name_en || m.name_ar },
      description: { ar: m.description_ar || "", en: m.description_en || "" }, category, price,
      currency: (m.currency || (legacy ? "KWD" : rById.get(rid).currency)).trim().toUpperCase(),
      image: m.image_url || undefined, emoji: m.emoji || "🍽️",
      spicy: Math.min(3, Math.max(0, num(m.spicy) ?? 0)), vegetarian: yes(m.vegetarian),
      size: SIZES.has(m.size) ? m.size : "regular",
      moods: list(m.moods, MOODS), times: list(m.times, TIMES).length ? list(m.times, TIMES) : ["lunch", "dinner"],
      editorsPick: yes(m.editors_pick),
      // Provenance (optional columns): official page the price was read from, and when it was checked.
      sourceUrl: m.source_url || undefined, checkedAt: /^\d{4}-\d{2}-\d{2}$/.test(m.checked_at ?? "") ? m.checked_at : undefined,
    });
    if (!m.source_url) problems.push(`meals: row "${m.id}" has no source_url (link to the official menu the price came from)`);
    else if (m.checked_at && Date.now() - Date.parse(m.checked_at) > STALE_DAYS * 864e5) problems.push(`meals: row "${m.id}" price was checked on ${m.checked_at}, over ${STALE_DAYS} days ago — re-check it`);
  }
  const mIds = new Set(meals.map((m) => m.id));

  const offers = [];
  for (const o of published(raw.offers)) {
    const id = slug(o.id), rid = slug(o.restaurant_id), type = (o.type ?? "").toLowerCase();
    const tz = rById.get(rid)?.timeZone ?? "Asia/Kuwait";
    const startsAt = localDate(o.starts_at, tz), expiresAt = localDate(o.expires_at, tz);
    if (!id || !rIds.has(rid) || !OFFER_TYPES.has(type) || !startsAt || !expiresAt || !(o.title_ar || o.title_en)) {
      problems.push(`offers: row "${o.id}" needs id, published restaurant_id, title, valid type and starts_at/expires_at (YYYY-MM-DD HH:MM)`);
      continue;
    }
    const orig = num(o.original_price), fin = num(o.final_price);
    offers.push({
      id, restaurantId: rid, mealId: mIds.has(slug(o.meal_id)) ? slug(o.meal_id) : undefined,
      title: { ar: o.title_ar || o.title_en, en: o.title_en || o.title_ar },
      description: { ar: o.description_ar || "", en: o.description_en || "" }, type,
      originalPrice: orig, finalPrice: fin,
      percent: num(o.percent) ?? (orig && fin !== undefined ? Math.round((1 - fin / orig) * 100) : undefined),
      currency: rById.get(rid).currency, startsAt, expiresAt, addedAt: localDate(o.added_at, tz) ?? startsAt,
      verified: yes(o.verified), source: yes(o.verified) ? "partner" : "community", sourceUrl: o.source_url || undefined,
      terms: { ar: o.terms_ar || "", en: o.terms_en || "" }, tags: list(o.tags, OFFER_TAGS), editorsPick: yes(o.editors_pick),
    });
  }

  problems.forEach((p) => warn(p));
  fs.writeFileSync(SHEET_OUT, JSON.stringify({ restaurants, meals, offers }, null, 1));
  log(`Sheet (${source}): ${restaurants.length} restaurants, ${meals.length} meals, ${offers.length} offers published`);
  return { data: { restaurants, meals, offers }, info: { source, fetchedAt: new Date().toISOString(), restaurants: restaurants.length, meals: meals.length, offers: offers.length, problems: problems.length } };
}

const osm = await buildOsm();
const sheet = await buildSheet();
// Live data only by default; set AKLA_SHOW_DEMO=always (or auto) to bring the fictional demo content back.
const showDemo = (process.env.AKLA_SHOW_DEMO || "never").toLowerCase();
fs.writeFileSync(
  META_OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), showDemo: ["always", "never", "auto"].includes(showDemo) ? showDemo : "never", osm, sheet: sheet.info }, null, 1),
);
log("done");
