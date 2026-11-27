# Real data in Akla

Akla has three data sources. All of them are combined **when the site is built**, so GitHub Pages keeps serving plain
static files: no server and no API keys in the browser.

| Source | What it gives | Badge in the app | Where it shows |
|---|---|---|---|
| **OpenStreetMap** (automatic) | ~1,600 real restaurants, cafés and fast-food places in Kuwait: names, location, cuisine, opening hours, phone, website | 🗺️ OpenStreetMap | Restaurants → *All real places*, Nearby map, Food Picker *Real restaurant near me*, Home *Real places near you*, search, `/place` pages |
| **Your Google Sheet** (you manage it) | Restaurants you list, with menus, prices, photos, offers, delivery-app links | none (real listing) | Everywhere: home, picker, offers, restaurant pages, games |
| **Demo data** (built-in) | Fictional sample content | 🧪 Demo | Only while your sheet has **no** published restaurants |

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
| `order_url` | optional | Link to the restaurant's own ordering page **or** its page on talabat / Deliveroo / Keeta / Cari. Shown as the **Order** button. |
| `rating`, `rating_count`, `rating_source` | optional | A rating is shown **only** if `rating_source` says where it comes from (e.g. `Google Maps · Nov 2026`). |

### `meals`
`id`, `status`, `restaurant_id` (must match a published restaurant), `name_ar`/`name_en`, `category` (one id from the list above),
`price_kwd` (e.g. `2.750`), optional: `description_ar/en`, `image_url`, `emoji`, `spicy` (0–3), `vegetarian`,
`size` (`snack`/`regular`/`large`/`family`), `moods` (starving, delicious, cheap, healthy, spicy, comfort, sweet, new),
`times` (breakfast, morning, lunch, afternoon, dinner, late), `editors_pick`.
Provenance (strongly recommended, flagged in the build's problem list when missing): `source_url`, the restaurant's **own**
website, ordering page or official post the price was read from (never a delivery app), and `checked_at` (`YYYY-MM-DD`),
the day you checked it. Prices checked more than 60 days ago are flagged so you know to re-check them. The restaurant page
shows "Prices from the official menu, checked …" with a link to the source.

### `offers`
`id`, `status`, `restaurant_id`, `title_ar`/`title_en`, `type` (`percent`, `bogo`, `combo`, `family`, `free-delivery`, `fixed`),
`starts_at` and `expires_at` in **Kuwait time** as `YYYY-MM-DD HH:MM`. Optional: `meal_id`, prices (`original_price`, `final_price`, `percent`),
`verified` (`yes` only if you checked it with the restaurant or its official account), `source_url` (link to the official post),
`terms_ar/en`, `tags` (lunch, dinner, exclusive, limited, weekend).

Expired offers disappear automatically: the visitor's browser checks the time live, and every rebuild checks it again.

## 3. Demo data switch
By default demo content disappears as soon as your sheet has at least one published restaurant.
To force it, add a repository variable `AKLA_SHOW_DEMO` with the value `always` or `never`.

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
