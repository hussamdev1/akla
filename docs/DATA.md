# Real data in Akla

Akla has three data sources. All of them are combined **when the site is built**, so GitHub Pages keeps serving plain
static files: no server and no API keys in the browser.

| Source | What it gives | Badge in the app | Where it shows |
|---|---|---|---|
| **OpenStreetMap** (automatic) | Real restaurants, cafés and fast-food places — a build-time snapshot for Kuwait, Saudi Arabia, UAE, Qatar, Bahrain and Oman (`public/data/places/<ISO2>.json`), loaded live around the user everywhere else: names, location, cuisine, opening hours, phone, website | none (credited in the footer and on maps) | Restaurants → *All places*, Nearby map, Food Picker *A place near me*, Home *Places near you*, search, `/place` pages |
| **Your Google Sheet** (you manage it) | Restaurants you list, with menus, prices, photos, offers, delivery-app links | none (real listing) | Everywhere: home, picker, offers, restaurant pages, games |
| **Demo data** (built-in) | Fictional sample content | “Sample” | Only while your sheet has **no** published restaurants |

The GitHub Action rebuilds the site **on every push and every 6 hours**, so sheet edits and OpenStreetMap updates go
live automatically. To publish right away, go to **Actions → Deploy Akla to GitHub Pages → Run workflow**.

---

## 1. Set up the Google Sheet (about 10 minutes, once)

1. Create a new Google Sheet, for example "Akla data".
2. Create **three tabs** named exactly `restaurants`, `meals` and `offers`.
3. Import the templates from this repository, one per tab: **File → Import → Upload → Replace current sheet**.
   - [`data/sheet/restaurants.csv`](../data/sheet/restaurants.csv)
   - [`data/sheet/meals.csv`](../data/sheet/meals.csv)
   - [`data/sheet/offers.csv`](../data/sheet/offers.csv)
4. Select all cells (Ctrl+A) and choose **Format → Number → Plain text** in every tab.
   This stops Google from changing prices, phone numbers and dates.
5. Click **Share → General access → Anyone with the link → Viewer**.
6. Copy the **sheet ID** from the address bar: `https://docs.google.com/spreadsheets/d/`**`THIS-PART`**`/edit`.
7. In GitHub open **hussamdev1/akla → Settings → Secrets and variables → Actions → Variables tab → New repository variable**:
   - Name: `AKLA_SHEET_ID`
   - Value: the ID from step 6
8. Run the workflow: **Actions → Deploy Akla to GitHub Pages → Run workflow**.

Only rows with `status` = **published** go live. Use `draft` while you work on a row and `hidden` to take one down.
The templates already hold 25 real Kuwait restaurants and 388 menu items, all `draft`, so nothing appears until you
review a row and switch it to `published`. Every meal row links to the restaurant's own official menu in `source_url`.

## 2. Filling the tabs

### `restaurants`
| Column | Required | Notes |
|---|---|---|
| `id` | ✅ | short English slug, e.g. `bun-voyage`; used in links (`/restaurants/bun-voyage/`) |
| `status` | ✅ | `published` / `draft` / `hidden` |
| `name_ar`, `name_en` | ✅ (one of them) | |
| `categories` | ✅ | comma list from: burgers, pizza, fried-chicken, grilled, bbq, sandwiches, shawarma, arabic, indian, italian, asian, japanese, sushi, seafood, mexican, healthy, salads, pasta, desserts, ice-cream, coffee, breakfast, beverages |
| `osm_id` | recommended | Find the place at openstreetmap.org, click it, and copy the ID from the URL (`node/123` → `n123`, `way/456` → `w456`). Location, hours, phone and website are then filled in automatically. |
| `lat`, `lng` | if no `osm_id` | |
| `hours` | optional | OpenStreetMap format, e.g. `Sa-Th 11:00-23:00; Fr 13:00-23:00` or `24/7`. Days: Su Mo Tu We Th Fr Sa. Unclear hours show as "not available"; Akla never guesses. |
| `price_level` | optional | 1–4 |
| `delivery`, `dine_in`, `featured`, `is_new` | optional | `yes` / `no` |
| `cover_image_url`, `emoji`, `brand_color` | optional | Use images you own or have permission to use. |
| `logo_url`, `logo_bg` | optional | The restaurant's logo, shown in its tile instead of the emoji. Use a full image URL or a file in `public/logos/` written as `/logos/<id>.png`. `logo_bg` is the colour behind it (default white; use a dark colour for white logos). Take logos only from the restaurant's own website. |
| `order_url` | optional | Link to the restaurant's own ordering page **or** its page on talabat / Deliveroo / Keeta / Cari. Shown as the **Order** button. |
| `rating`, `rating_count`, `rating_source` | optional | A rating is shown **only** if `rating_source` says where it comes from (e.g. `Google Maps · Nov 2026`). |

**Other countries (optional columns, add them at the end of the tab):** `country` (2-letter ISO code, default `KW`),
`city` (shown where there's no curated area), `timezone` (IANA name such as `Asia/Riyadh`; default: worked out from
the country and location), `currency` (ISO 4217, default: the country's currency). Existing Kuwait rows need no change.
Listings only appear when the visitor has selected their country.

### `meals`
`id`, `status`, `restaurant_id` (must match a published restaurant), `name_ar`/`name_en`, `category` (one id from the list above),
`price` in the restaurant's currency (e.g. `2.750`; the older `price_kwd` column still works and means KWD), optional: `currency` (ISO code, default = the restaurant's), `description_ar/en`, `image_url`, `emoji`, `spicy` (0–3), `vegetarian`,
`size` (`snack`/`regular`/`large`/`family`), `moods` (starving, delicious, cheap, healthy, spicy, comfort, sweet, new),
`times` (breakfast, morning, lunch, afternoon, dinner, late), `editors_pick`.
Provenance (strongly recommended, flagged in the build's problem list when missing): `source_url`, the restaurant's **own**
website, ordering page or official post the price was read from (never a delivery app), and `checked_at` (`YYYY-MM-DD`),
the day you checked it. Prices checked more than 60 days ago are flagged so you know to re-check them. The restaurant page
shows "Prices from the official menu, checked …" with a link to the source.

### `offers`
`id`, `status`, `restaurant_id`, `title_ar`/`title_en`, `type` (`percent`, `bogo`, `combo`, `family`, `free-delivery`, `fixed`),
`starts_at` and `expires_at` in the **restaurant's local time** (Kuwait time for Kuwait rows) as `YYYY-MM-DD HH:MM`; prices are in the restaurant's currency. Optional: `meal_id`, prices (`original_price`, `final_price`, `percent`),
`verified` (`yes` only if you checked it with the restaurant or its official account), `source_url` (link to the official post),
`terms_ar/en`, `tags` (lunch, dinner, exclusive, limited, weekend).

Expired offers disappear automatically: the visitor's browser checks the time live, and every rebuild checks it again.

## 3. Demo data switch
By default Akla shows **live data only** (`never`): real OpenStreetMap places plus published sheet rows.
Features that need menus or offers (offers, discover, trending, compare, battle, mystery) show a "coming soon" card
pointing to the real places until the sheet has published rows. To bring the fictional demo content back (e.g. for a
preview), add a repository variable `AKLA_SHOW_DEMO` with `always`, or `auto` (demo only while the sheet is empty).

## 4. About talabat, Keeta, Deliveroo and Cari
They have **no public API**, and copying their menus, prices or photos automatically goes against their terms
and their content rights. Akla doesn't do that. The safe options are:
- **Link out** with the `order_url` column. Visitors tap **Order** and land on the restaurant's page in the delivery app.
- Add offers you see on a restaurant's **official** Instagram or website by hand, with `source_url` pointing to the post.
- Later: apply to the delivery apps' **affiliate or partner programmes** for an official feed (roadmap phase 7).

## 5. Run locally
```powershell
npm run data
```
This reads `data/sheet/*.csv`, or your Google Sheet if the `AKLA_SHEET_ID` environment variable is set. It refreshes
OpenStreetMap at most every 12 hours; `npm run data:refresh` forces a refresh.

OpenStreetMap data © OpenStreetMap contributors, licensed ODbL. Improve it at openstreetmap.org and Akla picks up the change on the next rebuild.
