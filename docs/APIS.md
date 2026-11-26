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
| **TheMealDB** (`themealdb.com`) | Food photography (`/small`, `/medium` sizes) + 300+ recipes | Test key `1` | Free for development/education; becoming a supporter is expected for public/commercial apps. Credit TheMealDB in the footer. Images are used for the demo meals. |

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
