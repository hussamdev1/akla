# Free data sources for Akla (researched Nov 2026)

GitHub Pages hosts **static files only**, so every source must be callable from the browser (CORS) **without a secret key**,
or be pulled at build time by a script/GitHub Action. Anything needing a secret key goes through a free serverless
backend later (Phase 4: Supabase / Cloudflare Workers).

## ✅ Used now

| Source | What we get | Key? | Notes |
|---|---|---|---|
| **OpenStreetMap Overpass API** (`overpass-api.de`) | **Real** restaurants, cafés, fast food in Kuwait: name (AR/EN), cuisine, coordinates, `opening_hours`, phone, website | No | Used on the **Nearby** page ("Real places" layer). Fair‑use limits: keep queries small (radius ≤ 5 km), cache results in the browser. No ratings exist in OSM — we show "rating unavailable" instead of inventing one. Attribution "© OpenStreetMap contributors" required. Blocks scripted requests without a proper client, works from browsers. |
| **OpenStreetMap tiles** via Leaflet | Interactive map | No | Tile usage policy: light use only. Switch to a free MapTiler/Stadia key or self-hosted tiles when traffic grows. |
| **Nominatim** (optional) | Geocoding / reverse geocoding | No | 1 req/s max, must show attribution. Kuwait areas are pre‑bundled so we rarely need it. |
| **TheMealDB** (`themealdb.com`) | Food photography (`/small`, `/medium` sizes) + recipes for `/recipes` (see Recipes below) | Test key `1` | Free for development/education; becoming a supporter is expected for public/commercial apps. Credit TheMealDB in the footer. Images are used for the demo meals and recipes. |

## 🟡 Good next options

| Source | Why | Cost |
|---|---|---|
| **Foursquare Places API** | Ratings, photos, popularity, hours for Kuwait venues | Sandbox + monthly free credits, then pay‑as‑you‑go. Needs a key → call through a serverless proxy. |
| **TheCocktailDB** (`?a=Non_Alcoholic`) | Drink/juice images & recipes for the Beverages category | Free test key |
| **Open Food Facts** | Packaged snacks/drinks nutrition | Free, open data |
| **Supabase** (free tier) | Auth, Postgres, Realtime (group rooms), Storage (user food photos), admin CMS | Free tier |

## ❌ Not available / not recommended

| Source | Status |
|---|---|
| **talabat, Deliveroo, Carriage, Jahez** | No official public developer API. Third‑party scrapers exist but likely violate their Terms of Service — **don't build on them**. Partner/affiliate feeds require a business agreement. |
| **Google Places API** | No free tier any more; billing account required. |
| **Foodish API** | Was returning HTTP 503 during testing — unreliable. |

## 🔑 Where real deals will come from
There is **no free public API for restaurant offers in Kuwait.** Real offer data has to come from:
1. **Restaurant self‑service portal** (Phase 5) — restaurants post their own offers, with expiry dates → "Verified".
2. **Community submissions** with photo proof + moderation → "Community" badge until verified.
3. **Editorial team** checking official Instagram/website promotions.
4. **Affiliate partnerships** with delivery apps (Phase 7).

Until then the app ships with **clearly labelled demo restaurants, meals and offers** (fictional names, 🧪 badge everywhere).

## 🍳 Recipes (researched and decided Nov 2026)

The `/recipes` section uses two sources, downloaded **once** by `scripts/build-recipes.mjs` into
`src/data/generated/recipes.json` (committed). The site never calls them at runtime; photos are hot-linked thumbnails.

| Source | Used for | Licence / terms (checked 2026-11-28) | How we comply |
|---|---|---|---|
| **TheMealDB** (`lookup.php`, key `MEALDB_KEY`, default test key `1`) | 78 recipes: Syrian, Egyptian, Saudi/Gulf, Yemeni (mandi, lahsa), Moroccan, Algerian, Tunisian, Turkish, Indian, Chinese, Japanese, Thai, Italian, Mexican | [Terms](https://www.themealdb.com/terms_of_use.php): content from the **official API** may be copied and modified; don't scrape the website; credit TheMealDB and link back; don't remove notices. The test key is for development/education — **a public release is expected to buy the one-off supporter key** ([api.php](https://www.themealdb.com/api.php), [FAQ](https://www.themealdb.com/faq.php)). | API only; every recipe page says "Recipe source: TheMealDB" linking to `themealdb.com/meal/<id>`; footer credit. **Open decision for the owner:** buy the supporter key and set `MEALDB_KEY` before relying on this publicly. |
| **Wikibooks Cookbook** (MediaWiki API) | 15 recipes where TheMealDB has nothing: Lebanese (fattoush, moutabbal, toum, hummus, sayyadieh, garlic-lemon chicken), Palestinian (maqluba, musakhan, mujaddara), Yemeni (maraq, bint al-sahn, hilbah), Syrian tabbouleh, guacamole, huevos rancheros | Text **CC BY-SA 4.0**. Photos come from Wikimedia Commons and are only used when Commons lists an open licence (CC / public domain). | Per recipe: link to the exact revision used, "Text licence: CC BY-SA 4.0", photo author + licence. Our Arabic translation is an adaptation, so it is offered under the same licence (said on the page). |

- **Not found:** no openly licensed **Kuwaiti** recipe (machboos, murabyan, harees…) exists in either source, and Lebanese/Kuwaiti
  recipe sites don't licence reuse, so none were scraped. The "Saudi & Gulf" cuisine (kabsa, mutabbaq, maamoul, knafeh, shawarma) is the
  closest. Kuwaiti dishes need original recipes written or licensed by the team (add them as a third source — see DEVELOPMENT.md).
- **Left out on purpose:** recipes using pork or alcohol (in the ingredients, or alcohol named in the steps — e.g. sushi with rice wine,
  General Tso's with cooking sherry), checked automatically by the script. Two recipes keep salami as an *optional* topping in the steps.
- **Also considered:** Open Food Facts (packaged-product nutrition, not recipes — not useful here); Spoonacular/Edamam (API keys + terms
  that forbid caching/redistribution); recipe blogs (no reuse licence).
- **Arabic:** both sources are English. `src/data/recipes-ar.json` holds a careful translation of all 93 recipes (name, every ingredient
  line, every step), keyed by recipe id and the hash of the English text it was made from. A recipe whose English changes falls back to
  English with a small note until it is re-translated.
