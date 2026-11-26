#!/usr/bin/env node
/**
 * Akla data builder — runs before `next build` (and on a schedule in GitHub Actions).
 *
 * 1. OpenStreetMap: downloads every named restaurant / café / fast-food place in Kuwait via the
 *    public Overpass API and writes a compact snapshot to public/data/places.json.
 *    If the download fails, the previous snapshot is kept (the site never breaks because Overpass is busy).
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
const PLACES_OUT = path.join(ROOT, "public", "data", "places.json");
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

fs.mkdirSync(path.dirname(PLACES_OUT), { recursive: true });
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

const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const QUERY = `[out:json][timeout:180];
area["ISO3166-1"="KW"][admin_level=2]->.kw;
nwr["amenity"~"^(restaurant|fast_food|cafe|ice_cream|food_court)$"]["name"](area.kw);
out center tags;`;

const AMENITY = { restaurant: "r", fast_food: "f", cafe: "c", ice_cream: "i", food_court: "o" };
const r5 = (n) => Math.round(n * 1e5) / 1e5;

async function fetchOsm() {
  let lastErr;
  for (const url of OVERPASS) {
    try {
      log("Overpass →", url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: QUERY }),
        signal: AbortSignal.timeout(240_000),
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

async function buildOsm() {
  const existing = fs.existsSync(PLACES_OUT);
  const ageH = meta.osm?.fetchedAt ? (Date.now() - Date.parse(meta.osm.fetchedAt)) / 36e5 : Infinity;
  if (args.has("--skip-osm") || (!isCI && !args.has("--force-osm") && existing && ageH < OSM_MAX_AGE_H)) {
    log(`OSM snapshot kept (${existing ? `${ageH.toFixed(1)}h old` : "missing"})`);
    return meta.osm ?? { count: 0, fetchedAt: null };
  }
  try {
    const { osmBase, places } = compactPlaces(await fetchOsm());
    if (places.length < 50) throw new Error(`only ${places.length} places returned — keeping previous snapshot`);
    fs.writeFileSync(PLACES_OUT, JSON.stringify({ v: 1, osmBase, fetchedAt: new Date().toISOString(), places }));
    log(`OSM: ${places.length} real places saved`);
    return { count: places.length, fetchedAt: new Date().toISOString(), osmBase };
  } catch (e) {
    warn("OSM update skipped:", e.message);
    if (!existing) fs.writeFileSync(PLACES_OUT, JSON.stringify({ v: 1, osmBase: null, fetchedAt: null, places: [] }));
    return meta.osm ?? { count: 0, fetchedAt: null };
  }
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

const yes = (v) => /^(yes|y|true|1|نعم)$/i.test(v ?? "");
const num = (v) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const list = (v, allowed) => (v ? v.split(/[,،|]/).map((s) => s.trim().toLowerCase()).filter((s) => s && (!allowed || allowed.has(s))) : []);
const slug = (v) => (v ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
/** "2026-12-01 18:00" in Kuwait time (UTC+3) → ISO */
const kwDate = (v) => {
  if (!v) return undefined;
  const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (!m) return undefined;
  const [, y, mo, d, h = "0", mi = "0"] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h - 3, +mi)).toISOString();
};

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
  const placeMap = new Map((readJson(PLACES_OUT, { places: [] }).places ?? []).map((p) => [p.i, p]));
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
    restaurants.push({
      id, osmId: osmKey(r.osm_id) || undefined,
      name: { ar: r.name_ar || r.name_en, en: r.name_en || r.name_ar },
      tagline: { ar: r.tagline_ar || "", en: r.tagline_en || "" },
      description: { ar: r.description_ar || "", en: r.description_en || "" },
      categories: cats, areaId: r.area_id || undefined, lat, lng,
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

  const meals = [];
  for (const m of published(raw.meals)) {
    const id = slug(m.id), rid = slug(m.restaurant_id), price = num(m.price_kwd);
    const category = (m.category ?? "").toLowerCase();
    if (!id || !rIds.has(rid) || price === undefined || !CATEGORY_IDS.has(category) || !(m.name_ar || m.name_en)) {
      problems.push(`meals: row "${m.id}" needs id, a published restaurant_id, name, valid category and price_kwd`);
      continue;
    }
    meals.push({
      id, restaurantId: rid, name: { ar: m.name_ar || m.name_en, en: m.name_en || m.name_ar },
      description: { ar: m.description_ar || "", en: m.description_en || "" }, category, price,
      image: m.image_url || undefined, emoji: m.emoji || "🍽️",
      spicy: Math.min(3, Math.max(0, num(m.spicy) ?? 0)), vegetarian: yes(m.vegetarian),
      size: SIZES.has(m.size) ? m.size : "regular",
      moods: list(m.moods, MOODS), times: list(m.times, TIMES).length ? list(m.times, TIMES) : ["lunch", "dinner"],
      editorsPick: yes(m.editors_pick),
    });
  }
  const mIds = new Set(meals.map((m) => m.id));

  const offers = [];
  for (const o of published(raw.offers)) {
    const id = slug(o.id), rid = slug(o.restaurant_id), type = (o.type ?? "").toLowerCase();
    const startsAt = kwDate(o.starts_at), expiresAt = kwDate(o.expires_at);
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
      startsAt, expiresAt, addedAt: kwDate(o.added_at) ?? startsAt,
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
const showDemo = (process.env.AKLA_SHOW_DEMO || "auto").toLowerCase();
fs.writeFileSync(
  META_OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), showDemo: ["always", "never", "auto"].includes(showDemo) ? showDemo : "auto", osm, sheet: sheet.info }, null, 1),
);
log("done");
