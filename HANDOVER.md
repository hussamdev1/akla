# Akla · أكلة — Handover

Start here. This file is the entry point for a developer (or AI agent) picking the project up cold. It links to the
detailed docs instead of repeating them. Snapshot written **2026-11-28**.

| Doc | Read it for |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Folder layout, static-export rules, data pipeline, state, i18n/RTL, time, recommendations, maps |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Commands, code conventions, recipes (add a page, category, string, achievement, sheet column) |
| [docs/DATA.md](docs/DATA.md) | Setting up and filling the Google Sheet; OSM; demo switch; delivery-app policy |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased plan with ✅/🟡/⬜ status |
| [docs/BRAND.md](docs/BRAND.md) | Name, mascot, palette, type, voice, trust marks |
| [docs/APIS.md](docs/APIS.md) | Research on free data sources and why delivery apps aren't scraped |
| [AGENTS.md](AGENTS.md) | Warning that Next.js 16 differs from training data; docs in `node_modules/next/dist/docs/` |

## 1. What Akla is

A playful, **Arabic-first (RTL)** food discovery and "what do we eat?" web app for **Kuwait**, with an English toggle.
Food roulette, offers marketplace, restaurant directory, nearby map, meal discovery and budget planner, mini-games
(battle, mystery meal, daily challenges, group decision), favourites, compare, achievements.

- **Stack:** Next.js 16.4 (App Router) · React 19.3 · TypeScript · Tailwind CSS 4 · Zustand · Motion · Leaflet.
- **Hosting:** static export to **GitHub Pages**, live at https://hussamdev1.github.io/akla/ (returned HTTP 200 on 2026-11-28).
- **Repo:** https://github.com/hussamdev1/akla, default branch `main`.
- **No backend:** no server, database or accounts. User data (favourites, streaks, settings) lives in the browser's
  localStorage (`akla` key).

## 2. Current status

From [docs/ROADMAP.md](docs/ROADMAP.md):

| Phase | Status |
|---|---|
| 0 Foundation & identity · 1 Core discovery MVP | ✅ done |
| 2 Location & personalisation | ✅ except Trending (🟡: editorial + your own activity; real trends need a backend) |
| 2.5 Real data (OSM snapshot, Google Sheet CMS, 6-hourly rebuild) | ✅ done |
| 3 Games & gamification | ✅ except Group Decision (🟡: pass-the-phone + share link; live multi-device voting is Phase 4) |
| 4 Accounts, community, realtime (Supabase) · 5 Admin & restaurant portal · 6 Growth (SEO, Foursquare; PWA ✅ done) · 7 Business | ⬜ planned |

**Data right now:**
- **1,628 real OpenStreetMap places** in `public/data/places.json` (snapshot from 2026-11-26; CI refreshes it on every deploy).
- **0 published Google Sheet rows.** `gh variable list -R hussamdev1/akla` showed **no repository variables**, so
  `AKLA_SHEET_ID` appears unset and builds read the local templates in `data/sheet/*.csv` (all rows `draft`).
- Because the sheet is empty, the **fictional demo data** (20 restaurants, their meals and offers, 🧪 badge, header
  banner) is shown. It disappears automatically once one sheet restaurant is published.

**In progress elsewhere:** a separate session is doing a **responsive-layout pass** on its own branch. Expect changes to
views and shell components; check open branches/PRs before starting layout work.

**Deploys:** the last three workflow runs (push 2026-11-26, scheduled 2026-11-26 and 2026-11-27) all succeeded.

## 3. Run, build, deploy

Requires Node 22 (what CI uses) and npm.

```bash
npm ci
```

```bash
npm run dev
```

Open http://localhost:3000. Other commands (all checked on 2026-11-28 in this repo):

| Command | Result |
|---|---|
| `npm run data -- --skip-osm` | Regenerates `src/data/generated/*` from CSVs/sheet without network to Overpass ✅ |
| `npm run lint` | Clean ✅ |
| `npx tsc --noEmit` | Clean ✅ |
| `npm run build` | ✅ ~40 s; 39 static pages into `out/` (20 demo restaurant pages) |

**Deploy** = push to `main`. [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs on push, **every 6
hours** (`17 */6 * * *`) and manually (Actions → *Deploy Akla to GitHub Pages* → Run workflow). It runs
`npm ci` → `node scripts/build-data.mjs` → `next build` with `NEXT_PUBLIC_BASE_PATH=/<repo>` → uploads `out/` to
Pages. Pages must be set to **Source: GitHub Actions** in the repo settings.

## 4. Configuration

All are optional; there are no secrets.

| Variable | Where it's set | Effect |
|---|---|---|
| `AKLA_SHEET_ID` | GitHub → Settings → Secrets and variables → Actions → **Variables** (read by the workflow); or your shell locally | ID of the Google Sheet (shared "Anyone with the link → Viewer"). Unset → reads `data/sheet/*.csv`. See [DATA.md §1](docs/DATA.md). |
| `AKLA_SHOW_DEMO` | Same | `auto` (default): demo data only while the sheet has no published restaurants. `always` / `never` force it. |
| `NEXT_PUBLIC_BASE_PATH` | Hard-coded in the workflow as `/${{ github.event.repository.name }}`; empty locally | URL prefix for GitHub Pages project sites. **Remove it** for a custom domain or a `<user>.github.io` repo. Raw `fetch` URLs must use `BASE_PATH` from `src/lib/img.ts`. |
| `AKLA_SHEET_DIR` | Shell (rarely needed) | Alternative folder of CSVs instead of `data/sheet/`. |

## 5. Where the data comes from

Everything is assembled **at build time** by `scripts/build-data.mjs`; the browser only gets static files.

1. **OpenStreetMap** via the public Overpass API → `public/data/places.json`, fetched by the browser at runtime.
2. **Google Sheet** (tabs `restaurants`, `meals`, `offers`) or the local CSV templates → `src/data/generated/sheet.json`,
   bundled into the pages. Only `status = published` rows are used.
3. **Demo data** hard-coded in `src/data/restaurants.ts`, `meals.ts`, `offers.ts`, included when `SHOW_DEMO`
   (`src/data/source.ts`).

Static reference data: 23 categories (`src/data/categories.ts`), Kuwait governorates and areas (`src/data/geo.ts`).
Food photos are hot-linked stock images from TheMealDB (`src/lib/img.ts`), not photos of the actual restaurants.
Map tiles come from `tile.openstreetmap.org`. Details: [ARCHITECTURE.md §4](docs/ARCHITECTURE.md#4-data-pipeline) and [DATA.md](docs/DATA.md).

## 6. Known issues and gotchas

- **Local builds rewrite committed files.** `npm run build` runs the data script first; `meta.json` timestamps
  always change, and if the OSM snapshot is over 12 h old it re-downloads `places.json` from Overpass. Revert with
  `git checkout -- public/data src/data/generated` unless you mean to commit a data refresh.
- **New sheet restaurants need a rebuild to get a page.** `/restaurants/[id]/` is pre-rendered from the list at build
  time (`dynamicParams = false`). With no restaurants at all it emits a placeholder `/restaurants/_/` that 404s
  (verified with `AKLA_SHOW_DEMO=never`).
- **"Report incorrect info" does nothing.** The form in `src/views/RestaurantView.tsx` only shows a thank-you toast;
  no data is sent anywhere.
- **No tests and no lint/typecheck step in CI.** The workflow only builds (`next build` does type-check). Pure
  modules like `src/lib/openingHours.ts`, `time.ts`, `recommend.ts` and the CSV parser are good first test targets.
- **Overpass is a free shared service.** It can be slow or rate-limit. The script tries two mirrors and keeps the
  previous snapshot if both fail, so a deploy won't break, but data can go stale silently (check the `[data]` log lines
  in the Actions run).
- **Scheduled workflows pause on idle repos.** GitHub disables `schedule` triggers on public repos after 60 days with
  no activity; the 6-hourly data refresh then stops until it's re-enabled in the Actions tab.
- **OSM tile usage policy.** Tiles are loaded directly from openstreetmap.org, which is fine for light use; a busy site
  should switch to a tile provider.
- **On-device state only.** Clearing site data wipes favourites/achievements. The persisted store is `version: 1`
  with no `migrate`; renaming persisted fields needs one (see [DEVELOPMENT.md](docs/DEVELOPMENT.md#add-an-achievement)).
- **Hydration.** The HTML is built once, so anything that depends on time, location or localStorage must wait for
  `useNow()` / `useMounted()` (`src/lib/hooks.ts`). Ignoring this causes hydration warnings.
- **Doc inconsistencies found while writing this:** [DATA.md](docs/DATA.md) lists meal `moods` without `surprise`,
  which `build-data.mjs` also accepts. [ROADMAP.md](docs/ROADMAP.md) Phase 6 still lists a "nightly GitHub Action to refresh OSM
  data snapshot" as planned, but the 6-hourly workflow already does this (Phase 2.5). The README's run commands use
  `powershell` code fences and `npm install`.
- `npm ci` warns that `eslint@9` is no longer supported; harmless for now.
- **PWA / service worker.** The site is installable and works offline ([DEVELOPMENT.md → PWA](docs/DEVELOPMENT.md#pwa-install--offline)).
  `out/sw.js` is generated *after* `next build` (`postbuild`, and an explicit step in `deploy.yml`), so a bare
  `npx next build` has no worker. Every deploy that changes code (including the 6-hourly rebuilds, because
  `meta.json` timestamps are bundled) gets a new cache version and returning users see a "new version — refresh"
  toast. Bump `SW_REVISION` in `scripts/build-sw.mjs` to force one.

## 7. Open decisions

These need an owner's call before the next phases:

1. **Real content source.** Keep the Google Sheet as the CMS (cheap, no backend) or move to the admin/restaurant portal
   in Phase 5? Who maintains listings and verifies offers?
2. **Backend.** The roadmap assumes Supabase (Auth, Realtime, Storage) for Phase 4. Leaving pure static hosting means
   choosing where it runs and how auth works with the static export.
3. **Demo data at launch.** Keep `auto`, or set `AKLA_SHOW_DEMO=never` once there are enough real listings?
4. **Domain.** Custom domain vs. `hussamdev1.github.io/akla` (affects `NEXT_PUBLIC_BASE_PATH`).
5. **Delivery apps.** Link-out only (`order_url`) for now; affiliate/partner feeds are a Phase 7 business decision
   (see [DATA.md §4](docs/DATA.md) and [APIS.md](docs/APIS.md)).
6. **Analytics & privacy.** None is installed. Any tracking needs a consent approach.
7. **SEO URLs.** Per-language routes (`/ar`, `/en`) are planned in Phase 6; today language is a client-side setting
   and every page's HTML is Arabic/RTL by default.

## 8. Recommended next steps

1. **Turn on real listings:** create the sheet per [DATA.md §1](docs/DATA.md), set `AKLA_SHEET_ID` as a repository
   variable, publish a first restaurant, run the workflow. Demo data then hides itself.
2. **Land the responsive-layout pass** from the other session before starting new UI work, to avoid conflicts.
3. **Add a CI quality gate:** `npm run lint` and `npx tsc --noEmit` before the build in `deploy.yml`, or in a
   separate PR workflow.
4. **Add unit tests** (e.g. Vitest) for `openingHours`, `time`, `recommend`, `search` and the CSV/sheet parsing.
5. **Make "Report incorrect info" real**, e.g. by linking to a Google Form or creating GitHub issues, until Phase 5 exists.
6. **Fix the doc inconsistencies** listed in §6.
7. Then follow [ROADMAP.md](docs/ROADMAP.md) Phase 4 (accounts, live group rooms) once the backend decision is made.
