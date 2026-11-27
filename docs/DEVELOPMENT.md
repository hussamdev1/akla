# Akla — Development guide

Recipes for common changes, plus the conventions the existing code follows. Read [ARCHITECTURE.md](ARCHITECTURE.md)
first for the big picture.

> ⚠️ **This is not the Next.js in your training data.** The repo pins **Next.js 16.4.6** / **React 19.3**, which have
> breaking changes (e.g. `params` is a `Promise`, Turbopack is the default bundler). As [AGENTS.md](../AGENTS.md) says,
> read the bundled guides in `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …) before writing
> framework code, and heed deprecation notices. `next dev` re-creates that `AGENTS.md` block if it is removed.

## Everyday commands

| Command | What it does |
|---|---|
| `npm ci` | Clean install from `package-lock.json` (CI uses Node 22). |
| `npm run dev` | Dev server on http://localhost:3000 (also `.claude/launch.json` → `akla-dev`). |
| `npm run data -- --skip-osm` | Rebuild `src/data/generated/*` from the sheet/CSVs without calling Overpass. |
| `npm run data` | Same, and re-downloads OSM if the snapshot is older than 12 h. |
| `npm run data:refresh` | Force an OSM re-download. |
| `npm run lint` | ESLint 9 flat config (`eslint.config.mjs`: `next/core-web-vitals` + `next/typescript`). |
| `npx tsc --noEmit` | Type-check (there is no `typecheck` script). |
| `npm run build` | `prebuild` runs the data script, then `next build` → static site in `out/`. |

There is **no test suite** yet. "Done" today means: lint clean, `tsc` clean, `npm run build` succeeds, and the page
works in both languages at phone and desktop width.

**Generated files are committed** (`public/data/places.json`, `src/data/generated/meta.json`, `sheet.json`).
`npm run data` / `npm run build` rewrite them (at least the timestamps in `meta.json`). Don't commit that churn with
unrelated work: `git checkout -- public/data src/data/generated` before committing, unless refreshing data is the point.

## Conventions observed in the code

- **Thin routes, client views.** `src/app/**/page.tsx` only exports `metadata` (bilingual title, e.g.
  `"Offers · العروض"`) and renders one View. All UI is in `src/views/*View.tsx`, which start with `"use client"`
  and are **named exports** (`export function OffersView()`). Route files use `export default function Page()`.
- **Imports via `@/`** (`@/lib/…`, `@/components/…`, `@/data/…`), mapped to `src/` in `tsconfig.json`.
- **No user-visible string in components.** Text comes from `t` (`useI18n()`), content from `L = { ar, en }`
  objects rendered with `l(x)`. Prices, distances, clock times and dates go through `price()`, `km()`, `clock()`,
  `date()` from `useI18n()`.
- **RTL-safe styling.** Use logical utilities (`start-*`, `end-*`, `ps-*`/`pe-*`, `text-start`) rather than
  left/right; flip directional glyphs with `rtl:rotate-180`. Brand tokens (`bg-brand`, `text-ink`, `bg-sun`,
  `bg-lagoon`, `shadow-sticker`, `font-display`) are defined in `@theme` in `src/app/globals.css`; prefer them over
  hex values. Reusable class recipes (`btn`, `btn-primary`, `sticker`, `input`, …) live in the same file.
- **Compose with `components/ui.tsx`** (`Container`, `PageHero`, `SectionHeader`, `EmptyState`, `Loader`, `Sheet`,
  `Toggle`, `FavButton`, `Countdown`, badges) and `components/cards.tsx`. Join classes with `cx()`.
- **Honesty rules are product rules.** Never invent ratings, popularity or open/closed state: unknown hours stay
  unknown (`openingHours.ts`), partner ratings need a `ratingSource`, demo content carries `DemoBadge`, expired offers
  never appear as active. See [BRAND.md](BRAND.md) §8.
- **Kuwait time only** via `src/lib/time.ts`; never `new Date().getHours()` for business logic.
- **Hydration-safe time and storage.** Use `useNow()` / `useMounted()` (`src/lib/hooks.ts`) for anything that depends
  on the clock or the browser; render a neutral state until they are set.
- **Respect motion & sound preferences.** Use `motion/react` (wrapped in `MotionConfig` by `Providers`) and
  `celebrate()` / `sfx` from `src/lib/fx.ts`, which already check the user's settings.
- **Compact, dense code style**: short helpers, one-line object literals, few comments except where a rule needs
  explaining (`// a rating is only shown when …`). Match the surrounding file.

## Recipes

### Add a page / route

1. Create the view: `src/views/FooView.tsx` with `"use client"` and `export function FooView() { … }`.
2. Create the route: `src/app/foo/page.tsx`:
   ```tsx
   import type { Metadata } from "next";
   import { FooView } from "@/views/FooView";

   export const metadata: Metadata = { title: "Foo · فو" };

   export default function Page() {
     return <FooView />;
   }
   ```
3. Add navigation if needed: desktop `nav` / `extra` arrays in `src/components/shell/Header.tsx`, mobile items and the
   "More" sheet list in `src/components/shell/BottomNav.tsx`, footer links in `Footer.tsx`. Write hrefs **with a
   trailing slash** (`/foo/`). Add the label to `nav` in `src/lib/messages.ts` (both languages).
4. Need a parameter?
   - Small, known set at build time → a dynamic segment with `generateStaticParams` and `dynamicParams = false`,
     copying `src/app/restaurants/[id]/page.tsx` (remember the placeholder param if the list can be empty).
   - Unbounded or runtime-only (OSM ids, user input) → a query param read with `<QueryParam name="x" onValue={…} />`
     (`src/components/QueryParam.tsx`), like `PlaceView`. Pass a `useCallback`-stable `onValue`.
5. Using the map? Import it with `dynamic(() => import("@/components/MapView").then((m) => m.MapView), { ssr: false })`.
6. Check `npm run build` lists the route.

### Add a food category

Category ids are duplicated in a few places — update all of them:

1. `CategoryId` union in `src/lib/types.ts`.
2. `CATEGORIES` in `src/data/categories.ts` (bilingual name, emoji, tint `color`, accent `ink`, optional `image`
   via `mdb("<TheMealDB id>")`). Order here is display order.
3. `CATEGORY_IDS` in `scripts/build-data.mjs`, otherwise sheet rows using it are rejected.
4. Optionally map OSM cuisines to it: the `CUISINE` regex table and `EMOJI` map in `src/lib/places.ts`.
5. Update the category list in [DATA.md](DATA.md) (restaurants table) so sheet editors know it exists.

Moods, meal times, sizes, offer types and offer tags follow the same pattern (union in `types.ts`, allow-list set in
`build-data.mjs`, labels in `messages.ts` guarded by `satisfies Record<…>`, and e.g. `MOOD_E` in
`src/views/DiscoverView.tsx`).

### Add a translation string

1. Add the key to the `en` object in `src/lib/messages.ts`, inside the relevant group (`common`, `picker`, …).
2. Add the same key to `ar` in the same file. `ar` is typed `Messages` (`typeof en`), so `tsc` fails until it exists.
   Functions are allowed: `closesAt: (t: string) => \`Closes ${t}\``.
3. Use it: `const { t } = useI18n(); … {t.group.key}`.
4. Arabic copy follows the voice rules in [BRAND.md](BRAND.md) §7: Gulf-friendly Arabic for headlines and buttons,
   Modern Standard Arabic for terms, prices and legal text.

### Add an achievement

1. Extend `AchievementId` and add `{ id, emoji, color, goal }` to `ACHIEVEMENTS` in `src/lib/store.ts`.
2. Return its progress number from `achievementProgress()`. If it needs new history, add a field to `State` and
   `initial`, an action that updates it, and call `check()` at the end of that action.
3. Add `[title, description]` under `achievements` in **both** `en` and `ar` in `src/lib/messages.ts`.
4. Profile (`ProfileView`) and the games hub (`GamesHubView`) render `ACHIEVEMENTS` automatically.
5. Adding fields to the persisted state is backward compatible (Zustand merges with defaults). If you **rename or
   change the shape** of an existing field, bump `version` in the `persist` options and add a `migrate` function.

### Add a Google Sheet column

1. Add the column header to the template in `data/sheet/<tab>.csv` (headers are lower-cased and trimmed by the parser).
2. Read it in `buildSheet()` in `scripts/build-data.mjs` (`r.my_column`), using the helpers `yes()`, `num()`, `list()`,
   `slug()`, `kwDate()`; add it to the object pushed into `restaurants` / `meals` / `offers`.
3. Add the field to the matching type in `src/lib/types.ts` (`Restaurant`, `Meal`, `Offer`). For restaurants, also
   check the `SheetRestaurant` mapping in `src/data/restaurants.ts`.
4. Use it in the UI. Demo data in `src/data/*.ts` must still type-check (make the field optional or fill it).
5. Document it in the tab's table in [DATA.md](DATA.md), and add the header to the live Google Sheet.
6. `npm run data -- --skip-osm` to regenerate, then build.

## Previewing a production build

`out/` is plain static files. With no base path, any static server works, e.g. `npx serve out`. To mimic GitHub
Pages, build with `NEXT_PUBLIC_BASE_PATH=/akla npx next build` and serve so that `out/` is reachable at `/akla/`.
