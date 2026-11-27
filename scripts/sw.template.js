/* Akla service worker.
 * Source: scripts/sw.template.js. `node scripts/build-sw.mjs` (runs after `next build`) fills in the
 * placeholders and writes out/sw.js — never edit out/sw.js. See docs/DEVELOPMENT.md → "PWA".
 *
 * Strategies
 *  - install:        precache the app shell (key pages, all hashed /_next/static files, icons, manifest,
 *                    offline page) + places.json
 *  - pages (HTML):   network-first (4 s timeout when a cached copy exists) → cached copy → /offline/
 *  - RSC payloads:   network-first → cache (lets client-side navigation work offline)
 *  - /_next/static:  cache-first (file names are content-hashed, so a cached copy is never stale)
 *  - /data/*.json:   stale-while-revalidate (survives deploys; not versioned)
 *  - other same-origin files (icons, manifest…): stale-while-revalidate
 *  - OSM map tiles:  network-first with a small capped fallback cache (OSM tile policy: no bulk caching)
 *  - recipe photos:  cache-first, capped (TheMealDB / Wikimedia, requested with CORS by FoodImage `cors`), so a
 *                    recipe opened once still shows its photo offline
 */
const VERSION = "__AKLA_VERSION__";
const BASE = "__AKLA_BASE__"; // "" locally, "/akla" on GitHub Pages
const PRECACHE = __AKLA_PRECACHE__;
const DATA_PRECACHE = __AKLA_DATA__;

const SHELL = `akla-shell-${VERSION}`;
const PAGES = `akla-pages-${VERSION}`;
const DATA = "akla-data";
const TILES = "akla-tiles";
const IMAGES = "akla-images";
const KEEP = [SHELL, PAGES, DATA, TILES, IMAGES];
const OFFLINE_URL = `${BASE}/offline/`;
const TILE_LIMIT = 60;
const IMAGE_LIMIT = 150;
const PAGE_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      await shell.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" })));
      const data = await caches.open(DATA);
      await Promise.all(
        DATA_PRECACHE.map(async (u) => {
          if (!(await data.match(u))) await data.add(new Request(u, { cache: "reload" })).catch(() => {});
        }),
      );
      // First install: take control straight away. Updates wait until the page asks (refresh toast).
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("akla-") && !KEEP.includes(n)).map((n) => caches.delete(n)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_VERSION") event.ports[0]?.postMessage(VERSION);
});

/** Cache key: path without query/hash, with the trailing slash `trailingSlash: true` pages use. */
function pageKey(url) {
  let path = url.pathname;
  if (!path.endsWith("/") && !path.split("/").pop().includes(".")) path += "/";
  return url.origin + path;
}

const isRsc = (req, url) => req.headers.get("RSC") === "1" || url.searchParams.has("_rsc") || url.pathname.endsWith(".txt");

// Keys are built without query strings, so exact matching is enough.
async function fromCache(key) {
  return (await caches.match(key)) || undefined;
}

async function networkFirstPage(event, url) {
  const key = pageKey(url);
  const network = (async () => {
    const res = (await event.preloadResponse) || (await fetch(event.request));
    if (res.ok && res.type === "basic") {
      const copy = res.clone();
      event.waitUntil(caches.open(PAGES).then((c) => c.put(key, copy)));
    }
    return res;
  })();
  event.waitUntil(network.catch(() => {}));
  const cached = await fromCache(key);
  if (cached) {
    const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), PAGE_TIMEOUT_MS));
    return Promise.race([network.catch(() => cached), timeout]);
  }
  try {
    return await network;
  } catch {
    return (await fromCache(OFFLINE_URL)) || Response.error();
  }
}

async function networkFirst(event, cacheName, key) {
  try {
    const res = await fetch(event.request);
    if (res.ok) {
      const copy = res.clone();
      event.waitUntil(caches.open(cacheName).then((c) => c.put(key, copy)));
    }
    return res;
  } catch (err) {
    const cached = await fromCache(key);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(event, cacheName) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  const res = await fetch(event.request);
  if (res.ok) {
    const copy = res.clone();
    event.waitUntil(caches.open(cacheName).then((c) => c.put(event.request, copy)));
  }
  return res;
}

async function staleWhileRevalidate(event, cacheName, key) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(key);
  const network = fetch(event.request)
    .then((res) => {
      if (res.ok) return cache.put(key, res.clone()).then(() => res);
      return res;
    })
    .catch(() => undefined);
  event.waitUntil(network);
  return cached || (await network) || Response.error();
}

/** Keeps the newest `limit` entries (cache keys are in insertion order). */
async function trim(cache, limit) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((k) => cache.delete(k)));
}

async function image(event) {
  const cache = await caches.open(IMAGES);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const res = await fetch(event.request);
  // CORS responses only: opaque ones would count against storage quota at a padded size.
  if (res.ok && res.type === "cors") {
    const copy = res.clone();
    event.waitUntil(cache.put(event.request, copy).then(() => trim(cache, IMAGE_LIMIT)));
  }
  return res;
}

async function tile(event) {
  const cache = await caches.open(TILES);
  try {
    const res = await fetch(event.request);
    // Only CORS responses (Leaflet sets crossOrigin) — opaque responses would eat storage quota.
    if (res.ok && res.type === "cors") {
      const copy = res.clone();
      event.waitUntil(
        cache.put(event.request, copy).then(async () => {
          const keys = await cache.keys();
          await Promise.all(keys.slice(0, Math.max(0, keys.length - TILE_LIMIT)).map((k) => cache.delete(k)));
        }),
      );
    }
    return res;
  } catch (err) {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (!url.pathname.startsWith(`${BASE}/`)) return;
    if (url.pathname === `${BASE}/sw.js`) return;
    if (req.mode === "navigate") return event.respondWith(networkFirstPage(event, url));
    if (url.pathname.startsWith(`${BASE}/_next/static/`)) return event.respondWith(cacheFirst(event, SHELL));
    if (url.pathname.startsWith(`${BASE}/data/`)) return event.respondWith(staleWhileRevalidate(event, DATA, url.origin + url.pathname));
    if (isRsc(req, url)) {
      // .txt payloads have their own path; an RSC request to a page path must not overwrite its HTML entry.
      const key = url.origin + url.pathname + (url.pathname.endsWith(".txt") ? "" : "?__rsc");
      return event.respondWith(networkFirst(event, PAGES, key));
    }
    return event.respondWith(staleWhileRevalidate(event, SHELL, url.origin + url.pathname));
  }

  if (/(^|\.)tile\.openstreetmap\.org$/.test(url.hostname)) return event.respondWith(tile(event));
  const recipeImage = (url.hostname === "www.themealdb.com" && url.pathname.startsWith("/images/")) || /^(upload|thumb)\.wikimedia\.org$/.test(url.hostname);
  if (recipeImage && req.mode === "cors") return event.respondWith(image(event));
});
