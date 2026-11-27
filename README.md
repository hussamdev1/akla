# 🍔 Akla · أكلة

> **شنو ناكل اليوم؟ خلّها علينا.** — *What are we eating today? Leave it to us.*

Akla is a playful food discovery, deals and decision-making web app for Kuwait.
Arabic (RTL) by default, English one tap away. Built with **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4**,
exported as a static site so it runs free on **GitHub Pages**.

- 🤝 **New to the project? Start with the handover → [HANDOVER.md](HANDOVER.md)**
- 🏗️ Architecture → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 🛠️ Development guide → [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- 🎨 Brand & identity → [docs/BRAND.md](docs/BRAND.md)
- 🗺️ Phased roadmap → [docs/ROADMAP.md](docs/ROADMAP.md)
- 🔌 Free data sources research → [docs/APIS.md](docs/APIS.md)
- 📊 Real data setup (OpenStreetMap + Google Sheet) → [docs/DATA.md](docs/DATA.md)

## What's inside

| Area | Route | Highlights |
|---|---|---|
| Home hub | `/` | Animated hero, floating food, time-aware greeting, highlights with live countdowns, 23 categories, mood picker, near you, best offers, games |
| Food Roulette | `/picker` | 8 modes, 10 filters, wind-up + deceleration physics, tick sounds, confetti, full result screen |
| Offers | `/offers` | 13 deal categories, 7 sorts, filters, Verified vs Community, expired deals never shown as active |
| Restaurants | `/restaurants`, `/restaurants/[id]` | Searchable directory + profile pages (hours with honest open/closed in Kuwait time, map, menu, offers, similar, report) |
| Nearby | `/nearby` | Leaflet map + list, GPS or area picker, walking/driving radius, **real places from OpenStreetMap** |
| Discover | `/discover` | Browse meals by category, meal time and mood + **budget planner** (per-head & group totals) |
| Games | `/games/*` | Food Battle bracket, Mystery Meal gift reveal, Daily Challenges + random challenge, Group Decision with veto & wheel |
| Favorites | `/favorites` | Save restaurants/meals/offers/categories, custom collections |
| Trending | `/trending` | Editorial picks (labelled), your own activity — no fake popularity numbers |
| Compare | `/compare` | Up to 3 meals side by side, best-value badge, "not equivalent" warning |
| Profile | `/profile` | 9 achievements, daily streak, stats, language / motion / sound settings |

## Real data
- **~1,600 real Kuwait food places from OpenStreetMap**, refreshed automatically on every build (every 6 hours).
- **Your own listings, menus and offers from a Google Sheet** you edit. Setup guide: [docs/DATA.md](docs/DATA.md).
- Live data only by default. Fictional **demo** content (🧪 badge) is off unless `AKLA_SHOW_DEMO=always` or `auto`.

## Run locally

```powershell
npm install
```

```powershell
npm run dev
```

Open http://localhost:3000.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder to the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the static
   site with `NEXT_PUBLIC_BASE_PATH=/<repo-name>` and publishes it to `https://<user>.github.io/<repo-name>/`.

> Using a custom domain or a `<user>.github.io` repository? Remove the `NEXT_PUBLIC_BASE_PATH` line from the workflow.

Build the static site yourself:

```powershell
npm run build
```

The output is in `out/`.

## Project structure

```
src/
  app/            routes (thin server pages + metadata, static params)
  views/          page UIs (client components)
  components/     design system, cards, wheel, map, shell (header, bottom nav, search)
  data/           demo restaurants, meals, offers, Kuwait areas, categories
  lib/            i18n messages (ar/en), store (favourites, achievements), time (Asia/Kuwait), recommendation engine, OSM client
docs/             brand, roadmap, API research
```
