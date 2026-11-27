#!/usr/bin/env node
/**
 * Akla recipes snapshot — the data behind /recipes.
 *
 * Reads the curated list in data/recipes/sources.json, downloads each recipe from
 *   - TheMealDB (official JSON API, lookup.php; key from MEALDB_KEY, default the public test key "1"), or
 *   - the Wikibooks Cookbook (MediaWiki API, CC BY-SA 4.0 text; photos only when Commons lists an open licence),
 * normalises it (ingredients split into quantity / unit / text so servings can be scaled, steps split one per line,
 * time = minutes mentioned in the steps, difficulty, vegetarian) and writes src/data/generated/recipes.json.
 *
 * The snapshot is committed. The site never calls these services at runtime, and normal builds don't re-download:
 *   node scripts/build-recipes.mjs            → only downloads when the snapshot is missing; prints translation coverage
 *   node scripts/build-recipes.mjs --refresh  → re-downloads everything (keeps the old recipe if a download fails)
 *   node scripts/build-recipes.mjs --check    → coverage report only, exits 1 if a recipe lacks an up-to-date Arabic translation
 *
 * Every run also writes src/data/generated/recipes-index.json: the small list (names, cuisine, filters, search words)
 * the browse page, home and search use, so they don't bundle every recipe's steps.
 *
 * Arabic lives in src/data/recipes-ar.json, keyed by recipe id. Each entry stores the `hash` of the English text it
 * was translated from; when a refresh changes the English, the hash no longer matches and the page falls back to
 * English (with a note) until the translation is updated.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = path.join(ROOT, "data", "recipes", "sources.json");
const OUT = path.join(ROOT, "src", "data", "generated", "recipes.json");
const INDEX = path.join(ROOT, "src", "data", "generated", "recipes-index.json");
const AR = path.join(ROOT, "src", "data", "recipes-ar.json");
const KEY = process.env.MEALDB_KEY || "1";
const UA = "Akla-recipes-builder/1.0 (static recipe snapshot, low volume)";
const args = new Set(process.argv.slice(2));

const log = (...a) => console.log("[recipes]", ...a);
const warn = (...a) => console.warn("[recipes] ⚠", ...a);
const readJson = (p, fb) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fb;
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i >= tries) throw e;
      await sleep(6000 * i); // Wikimedia answers 429 when called too fast
    }
  }
}

/* ---------------- text helpers ---------------- */

export const slug = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const clean = (s) => s.replace(/\s+/g, " ").replace(/\s+([,.;:!?)])/g, "$1").replace(/\(\s+/g, "(").trim();
const titleCase = (s) => (s && s[0] === s[0].toLowerCase() ? s[0].toUpperCase() + s.slice(1) : s);

const FRACTIONS = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };
const NUM = String.raw`(?:\d+\s*[½¼¾⅓⅔⅛]|\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])`;
function num(s) {
  s = s.trim().replace(",", ".");
  let m;
  if ((m = s.match(/^(\d+)\s*([½¼¾⅓⅔⅛])$/))) return +m[1] + FRACTIONS[m[2]];
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return +m[1] + +m[2] / +m[3];
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return +m[1] / +m[2];
  if (FRACTIONS[s]) return FRACTIONS[s];
  return +s;
}
const UNITS = [
  ["cup", /^(cups?|c)\b\.?/i],
  ["tbsp", /^(tablespoons?|tbsp?s?|tblsp?s?|tbls|tbl)\b\.?/i],
  ["tsp", /^(teaspoons?|tsps?|tspn)\b\.?/i],
  ["kg", /^(kg|kgs|kilograms?|kilos?)\b\.?/i],
  ["g", /^(g|gr|grams?|grammes?)\b\.?/i],
  ["ml", /^(ml|mls|millilit(?:re|er)s?)\b\.?/i],
  ["l", /^(l|lt|lit(?:re|er)s?)\b\.?/i],
  ["oz", /^(oz|ounces?)\b\.?/i],
  ["lb", /^(lbs?|pounds?)\b\.?/i],
  ["clove", /^cloves?\b/i],
  ["can", /^(cans?|tins?)\b/i],
  ["pinch", /^pinch(es)?\b/i],
  ["slice", /^slices?\b/i],
  ["handful", /^handfuls?\b/i],
  ["bunch", /^bunch(es)?\b/i],
];
const SIZES = /^(small|medium|large|big|whole|fresh|ripe|thin|thick|heaping|heaped|level)\b/i;

/** "1 1/2 cups (360 ml) flour, sifted" → { q: 1.5, u: "cup", text: "flour, sifted" } */
function parseQty(line) {
  const m = line.match(new RegExp(String.raw`^\s*(${NUM})(?:\s*(?:-|–|to)\s*(${NUM}))?\s*(.*)$`, "i"));
  if (!m) return { text: clean(line) };
  const out = { q: num(m[1]) };
  if (m[2]) out.q2 = num(m[2]);
  let rest = m[3];
  for (const [u, re] of UNITS) {
    const um = rest.match(re);
    if (um) {
      out.u = u;
      rest = rest.slice(um[0].length);
      break;
    }
  }
  // drop conversions that would not scale: "200g/7oz", "1 cup (240 ml / 8 oz)"
  rest = rest.replace(/^\s*\/\s*\d[\d.,]*\s*[a-z]+\.?/i, "").replace(/^\s*\(\s*(?:about\s*)?[\d½¼¾⅓⅔.,/ –-]+\s*[a-z.]+(?:\s*\/\s*[\d½¼¾⅓⅔.,/ –-]+\s*[a-z.]+)*\s*\)/i, "");
  rest = rest.replace(/^\s*of\s+/i, "");
  out.text = clean(rest);
  if (!Number.isFinite(out.q) || out.q <= 0) return { text: clean(line) };
  return out;
}

/** Sum of explicit durations in the steps, in minutes ("for 20 minutes", "1-2 hours", "half an hour"). */
function minutesIn(steps) {
  let total = 0;
  const text = steps.join(" ").toLowerCase();
  const re = new RegExp(String.raw`(${NUM}|an?|one|half an?)(?:\s*(?:-|–|to|or)\s*(${NUM}))?\s*(?:more\s+|extra\s+|additional\s+)?(minutes?|mins?|hours?|hrs?)\b`, "g");
  for (const m of text.matchAll(re)) {
    const w = { a: 1, an: 1, one: 1, "half a": 0.5, "half an": 0.5 };
    const v = m[2] ? num(m[2]) : w[m[1]] ?? num(m[1]);
    if (!Number.isFinite(v)) continue;
    total += /^h/.test(m[3]) ? v * 60 : v;
  }
  return total ? Math.round(total) : undefined;
}

const MEAT = /\b(chicken|beef|lamb|mutton|goat|veal|pork|bacon|ham|turkey|duck|fish|salmon|tuna|cod|haddock|prawns?|shrimps?|crab|lobster|anchov\w*|sardines?|pilchards?|mince|minced meat|meat|sausages?|chorizo|gelatine?|fish sauce|oyster sauce|squid|mussels?|clams?|scallops?|liver|lard|suet|stock cube|bouillon|kingfish|snapper|sea bass|tilapia|mackerel)\b/i;
// Akla leaves out recipes with pork or alcohol (ingredients, or alcohol/pork named in the steps).
const BANNED_STEPS = /\b(pork|bacon|ham|beer|brandy|rum|vodka|whisky|whiskey|sake|mirin|sherry(?! vinegar)|marsala|liqueur|cognac|cooking wine|wine(?! vinegar))\b/i;
const BANNED = /\b(pork|bacon|ham|prosciutto|pancetta|chorizo|lard|beer|brandy|rum|vodka|whisky|whiskey|sake|mirin|gin|sherry(?! vinegar)|marsala|kirsch|liqueur|cognac|stout|tequila|guanciale|salami|pepperoni|wine(?! vinegar))\b/i;

function course(given, name, category) {
  if (given) return given;
  const n = name.toLowerCase();
  if (/soup|chorba|corba|congee|broth|leblebi/.test(n)) return "soup";
  if (/salad/.test(n)) return "salad";
  if (/bread|khobz|feteer|flatbread/.test(n)) return "bread";
  if (/dessert|cake|biscuit|cookie|tart|knaf|kunaf|baklava/.test(n) || /dessert/i.test(category)) return "dessert";
  if (/breakfast/i.test(category)) return "breakfast";
  if (/side|starter/i.test(category)) return "side";
  return "main";
}

/** 1 easy · 2 medium · 3 takes effort — from the recipe's own length (or Wikibooks' 1–5 rating). */
function difficulty(ingredients, steps, wbRating) {
  if (wbRating) return wbRating <= 2 ? 1 : wbRating === 3 ? 2 : 3;
  const n = ingredients.filter((i) => !i.h).length;
  if (n <= 8 && steps.length <= 5) return 1;
  if (n >= 15 || steps.length >= 11) return 3;
  return 2;
}

function splitSteps(raw) {
  let lines = raw
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s && !/^(step\s*\d+|\d+[.)]?|method|instructions|directions|preparation|▢)$/i.test(s))
    .map((s) => s.replace(/^(step\s*\d+\s*[:.)-]?\s*|\d+\s*[.)-]\s+|[-•▢*]\s*)/i, "").trim())
    .filter(Boolean);
  // break long paragraphs into a few sentences each, so cook mode stays readable
  lines = lines.flatMap((s) => {
    if (s.length <= 360) return [s];
    const sentences = s.match(/[^.!?]+(?:[.!?]+(?=\s+[A-Z(]|$)|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? [s];
    const out = [];
    for (const x of sentences) {
      if (out.length && out[out.length - 1].length + x.length < 260) out[out.length - 1] += " " + x;
      else out.push(x);
    }
    return out;
  });
  // merge tiny fragments ("Enjoy!") into the previous step
  return lines.reduce((acc, s) => {
    if (acc.length && s.length < 18) acc[acc.length - 1] += " " + s;
    else acc.push(s);
    return acc;
  }, []);
}

const hashOf = (r) => crypto.createHash("sha1").update(JSON.stringify([r.name, r.ingredients.map((i) => i.text), r.steps])).digest("hex").slice(0, 10);

/* ---------------- TheMealDB ---------------- */

async function fromMealDb(entry) {
  const d = await getJson(`https://www.themealdb.com/api/json/v1/${KEY}/lookup.php?i=${entry.mealdb}`);
  const m = d?.meals?.[0];
  if (!m) throw new Error("not found");
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = clean(m[`strIngredient${i}`] ?? "");
    if (!name) continue;
    const measure = clean(m[`strMeasure${i}`] ?? "");
    const p = parseQty(measure);
    let rest = p.text;
    const text = !rest ? name : SIZES.test(rest) ? `${rest.toLowerCase()} ${name}` : `${name}, ${rest.toLowerCase()}`;
    ingredients.push({ ...(p.q ? { q: p.q } : {}), ...(p.q2 ? { q2: p.q2 } : {}), ...(p.u ? { u: p.u } : {}), text });
  }
  const steps = splitSteps(m.strInstructions ?? "");
  const serves = (m.strInstructions ?? "").match(/serves\s+(\d+)/i);
  const all = `${m.strMeal} ${ingredients.map((i) => i.text).join(" ")}`;
  return {
    name: entry.name ?? titleCase(clean(m.strMeal)),
    course: course(entry.course, m.strMeal, m.strCategory ?? ""),
    image: m.strMealThumb || undefined,
    video: /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+$/.test(m.strYoutube ?? "") ? m.strYoutube : undefined,
    servings: entry.servings ?? (serves ? +serves[1] : undefined),
    ingredients,
    steps,
    veg: !MEAT.test(all.replace(/kidney beans?/gi, "")),
    banned: BANNED.test(all) || BANNED_STEPS.test(steps.join(" ")),
    source: { kind: "mealdb", url: `https://www.themealdb.com/meal/${m.idMeal}`, title: clean(m.strMeal) },
  };
}

/* ---------------- Wikibooks ---------------- */

function wikiClean(s) {
  return clean(
    s
      .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\{\{(?:convert|cvt)\|([\d.]+)\|([a-z]+)[^}]*\}\}/gi, "$1 $2")
      .replace(/\{\{[^{}]*\}\}/g, "")
      .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, "")
      .replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, "$1")
      .replace(/\[\[([^\]]*)\]\]/g, (_, x) => x.replace(/^Cookbook:/, ""))
      .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
      .replace(/'{2,}/g, "")
      .replace(/<[^>]+>/g, ""),
  );
}

function section(wikitext, re) {
  const lines = wikitext.split("\n");
  const start = lines.findIndex((l) => /^==+[^=]+==+\s*$/.test(l) && re.test(l));
  if (start < 0) return [];
  const level = lines[start].match(/^=+/)[0].length;
  const out = [];
  for (const l of lines.slice(start + 1)) {
    const h = l.match(/^(=+)\s*([^=]+?)\s*=+\s*$/);
    if (h && h[1].length <= level) break;
    out.push(l);
  }
  return out;
}

async function fromWikibooks(entry) {
  const d = await getJson(`https://en.wikibooks.org/w/api.php?action=parse&page=${encodeURIComponent(entry.wikibooks)}&prop=wikitext|revid|images&redirects=1&format=json&formatversion=2`);
  if (!d.parse) throw new Error(d.error?.info ?? "no page");
  const wt = d.parse.wikitext;
  const box = (k) => wt.match(new RegExp(String.raw`\|\s*${k}\s*=\s*([^\n|}]+)`, "i"))?.[1]?.trim();
  const ingredients = [];
  for (const l of section(wt, /ingredients/i)) {
    const h = l.match(/^(?:=+\s*([^=]+?)\s*=+|;\s*(.+))\s*$/);
    if (h) {
      ingredients.push({ h: true, text: wikiClean(h[1] ?? h[2]).replace(/:$/, "") });
      continue;
    }
    if (!/^\*/.test(l)) continue;
    const p = parseQty(wikiClean(l.replace(/^\*+/, "")));
    if (p.text) ingredients.push(p);
  }
  const steps = [];
  for (const l of section(wt, /procedure|directions|method|preparation|instructions/i)) {
    if (/^[#*]/.test(l)) {
      const s = wikiClean(l.replace(/^[#*:]+/, ""));
      if (s) steps.push(s);
    }
  }
  if (!ingredients.length || !steps.length) throw new Error("could not read ingredients/steps");
  const all = `${entry.wikibooks} ${ingredients.map((i) => i.text).join(" ")}`;
  const title = d.parse.title.replace(/^Cookbook:/, "");
  const r = {
    name: entry.name ?? title,
    course: course(entry.course, title, box("Category") ?? ""),
    servings: entry.servings ?? (box("Servings") ? num(box("Servings").match(new RegExp(NUM))?.[0] ?? "") || undefined : undefined),
    statedMinutes: box("Time") ? minutesIn([box("Time")]) : undefined,
    wbDifficulty: +(box("Difficulty") ?? 0) || undefined,
    ingredients,
    steps,
    veg: !MEAT.test(all),
    banned: BANNED.test(all) || BANNED_STEPS.test(steps.join(" ")),
    source: {
      kind: "wikibooks",
      url: `https://en.wikibooks.org/w/index.php?title=${encodeURIComponent(d.parse.title.replace(/ /g, "_"))}&oldid=${d.parse.revid}`,
      title,
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  };
  const file = (d.parse.images ?? []).find((f) => /\.(jpe?g|png|webp)$/i.test(f));
  if (file) {
    await sleep(1200);
    const ii = await getJson(`https://en.wikibooks.org/w/api.php?action=query&titles=File:${encodeURIComponent(file)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&format=json&formatversion=2`).catch(() => null);
    const info = ii?.query?.pages?.[0]?.imageinfo?.[0];
    const md = info?.extmetadata ?? {};
    const lic = md.LicenseShortName?.value ?? "";
    if (info?.thumburl && /^(CC|Public domain|PD)/i.test(lic)) {
      r.image = info.thumburl.split("?")[0];
      r.imageCredit = { author: wikiClean(md.Artist?.value ?? "").slice(0, 80) || undefined, license: lic, url: info.descriptionurl };
    }
  }
  return r;
}

/* ---------------- build ---------------- */

const prev = readJson(OUT, null);
const prevById = new Map((prev?.recipes ?? []).map((r) => [r.id, r]));

async function download() {
  const src = readJson(SOURCES, null);
  if (!src) throw new Error(`${SOURCES} missing`);
  const recipes = [];
  const seen = new Set();
  for (const [cuisine, entries] of Object.entries(src.cuisines)) {
    for (const entry of entries) {
      const label = entry.mealdb ? `TheMealDB ${entry.mealdb}` : entry.wikibooks;
      let r;
      try {
        r = entry.mealdb ? await fromMealDb(entry) : await fromWikibooks(entry);
      } catch (e) {
        const old = [...prevById.values()].find((p) => p.source.url.includes(entry.mealdb ?? encodeURIComponent((entry.wikibooks ?? "").replace(/ /g, "_"))));
        warn(`${label}: ${e.message}${old ? " — keeping the previous copy" : " — skipped"}`);
        if (old) recipes.push(old);
        continue;
      } finally {
        await sleep(entry.wikibooks ? 2500 : 250);
      }
      if (r.banned) {
        warn(`${label} (${r.name}): contains pork or alcohol — skipped`);
        continue;
      }
      let id = slug(r.name.replace(/\(.*?\)/g, "")) || slug(r.name);
      while (seen.has(id)) id += "-2";
      seen.add(id);
      const { banned: _b, statedMinutes, wbDifficulty, ...rest } = r;
      void _b;
      const out = { id, cuisine, ...rest, minutes: statedMinutes ?? minutesIn(r.steps), difficulty: difficulty(r.ingredients, r.steps, wbDifficulty) };
      out.hash = hashOf(out);
      recipes.push(JSON.parse(JSON.stringify(out)));
    }
  }
  return recipes;
}

/** An Arabic translation counts only if it was made from the current English text. */
export const arFor = (r, ar) => {
  const a = ar[r.id];
  return a && a.hash === r.hash && a.name && a.ingredients?.length === r.ingredients.length && a.steps?.length === r.steps.length ? a : undefined;
};

function writeIndex(recipes) {
  const ar = readJson(AR, {});
  const index = recipes.map((r) => {
    const a = arFor(r, ar);
    const words = [...r.ingredients.filter((i) => !i.h).map((i) => i.text.split(",")[0]), ...(a ? a.ingredients.map((x) => x.split("،")[0]) : [])];
    return {
      id: r.id,
      cuisine: r.cuisine,
      name: a ? { en: r.name, ar: a.name } : { en: r.name },
      image: r.image,
      course: r.course,
      minutes: r.minutes,
      difficulty: r.difficulty,
      veg: r.veg,
      keys: [...new Set(words.map((w) => w.toLowerCase().trim()))].join(" · ").slice(0, 400),
    };
  });
  fs.writeFileSync(INDEX, `[\n${index.map((r) => JSON.stringify(r)).join(",\n")}\n]\n`);
}

function coverage(recipes) {
  const ar = readJson(AR, {});
  const missing = [];
  const stale = [];
  for (const r of recipes) {
    const a = ar[r.id];
    if (!a) missing.push(r.id);
    else if (a.hash !== r.hash || a.ingredients?.length !== r.ingredients.length || a.steps?.length !== r.steps.length) stale.push(r.id);
  }
  const ok = recipes.length - missing.length - stale.length;
  log(`Arabic: ${ok}/${recipes.length} recipes translated` + (missing.length ? ` · missing: ${missing.join(", ")}` : "") + (stale.length ? ` · out of date: ${stale.join(", ")}` : ""));
  return missing.length + stale.length;
}

if (args.has("--check")) {
  process.exit(coverage(prev?.recipes ?? []) ? 1 : 0);
}

if (prev && !args.has("--refresh")) {
  log(`using the committed snapshot (${prev.recipes.length} recipes); pass --refresh to re-download`);
  writeIndex(prev.recipes);
  coverage(prev.recipes);
} else {
  const recipes = await download();
  if (recipes.length < 10) {
    warn(`only ${recipes.length} recipes downloaded — keeping the previous snapshot`);
    process.exit(prev ? 0 : 1);
  }
  const counts = recipes.reduce((a, r) => ({ ...a, [r.cuisine]: (a[r.cuisine] ?? 0) + 1 }), {});
  // one recipe per line keeps refresh diffs readable
  fs.writeFileSync(OUT, `{"generatedAt":${JSON.stringify(new Date().toISOString())},"recipes":[\n${recipes.map((r) => JSON.stringify(r)).join(",\n")}\n]}\n`);
  log(`wrote ${recipes.length} recipes → ${path.relative(ROOT, OUT)}`, counts);
  writeIndex(recipes);
  coverage(recipes);
}
