#!/usr/bin/env node
// Writes out/sw.js from scripts/sw.template.js after `next build` (npm "postbuild"; CI calls it explicitly).
// The cache VERSION is a hash of everything the worker precaches except page HTML, so a deploy that changes
// code, styles, icons or the template gets a new version (old caches are dropped and the refresh toast shows),
// while HTML-only changes are picked up by the network-first page strategy without one.
// Force a new version without code changes: bump SW_REVISION below.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SW_REVISION = 1;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

// Pages available offline from the first visit (manifest shortcuts + the ones that work on local data).
const SHELL_PAGES = ["/", "/offline/", "/picker/", "/offers/", "/nearby/", "/favorites/", "/profile/", "/restaurants/", "/discover/", "/games/"];
const STATIC_FILES = ["/manifest.webmanifest", "/favicon.ico", "/icon.svg", "/apple-icon.png", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-192.png", "/icons/maskable-512.png"];
// Places data to have offline from the first visit: the single snapshot, or (per-country layout) the default country.
// Other data files are cached at runtime (stale-while-revalidate); live Overpass/Nominatim calls are never cached.
const DATA_CANDIDATES = ["/data/places.json", "/data/places/KW.json"];

if (!existsSync(OUT)) {
  console.error("[sw] out/ not found — run `next build` first.");
  process.exit(1);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])));
  return files.flat();
}
const toUrl = (abs) => "/" + path.relative(OUT, abs).split(path.sep).join("/");

// Hashed Next assets. Skip the per-build id folder (_buildManifest etc., pages-router only).
const staticDir = path.join(OUT, "_next/static");
const nextAssets = (await walk(staticDir))
  .map(toUrl)
  .filter((u) => /^\/_next\/static\/(chunks|media|css)\//.test(u))
  .sort();

// RSC payloads of the shell pages, so client-side navigation between them works offline.
const rsc = [];
for (const page of SHELL_PAGES) {
  const dir = path.join(OUT, page);
  if (!existsSync(dir)) throw new Error(`[sw] shell page ${page} missing from out/`);
  for (const f of await readdir(dir)) if (f.endsWith(".txt")) rsc.push(path.posix.join(page, f));
}

const DATA_FILES = DATA_CANDIDATES.filter((f) => existsSync(path.join(OUT, f))).slice(0, 1);
if (!DATA_FILES.length) console.warn(`[sw] none of ${DATA_CANDIDATES.join(", ")} in out/ — no places data precached`);
const files = [...STATIC_FILES, ...DATA_FILES];
for (const f of files) if (!existsSync(path.join(OUT, f))) throw new Error(`[sw] ${f} missing from out/`);

const template = await readFile(path.join(ROOT, "scripts/sw.template.js"), "utf8");
const hash = createHash("sha256").update(`${SW_REVISION}\n${BASE}\n${template}\n${nextAssets.join("\n")}`);
for (const f of STATIC_FILES) hash.update(await readFile(path.join(OUT, f)));
const version = hash.digest("hex").slice(0, 12);

const precache = [...SHELL_PAGES, ...rsc.sort(), ...STATIC_FILES, ...nextAssets].map((u) => BASE + u);
const sw = template
  .replace("__AKLA_VERSION__", version)
  .replace("__AKLA_BASE__", BASE)
  .replace("__AKLA_PRECACHE__", JSON.stringify(precache))
  .replace("__AKLA_DATA__", JSON.stringify(DATA_FILES.map((u) => BASE + u)));
await writeFile(path.join(OUT, "sw.js"), sw);

let bytes = 0;
for (const u of [...SHELL_PAGES.map((p) => `${p}index.html`), ...rsc, ...STATIC_FILES, ...nextAssets]) bytes += (await stat(path.join(OUT, u))).size;
console.log(`[sw] out/sw.js version ${version} · ${precache.length} files precached (${(bytes / 1024 / 1024).toFixed(1)} MB) · base "${BASE || "/"}"`);
