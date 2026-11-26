# Akla — Phased build plan

Stack: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Motion + Zustand + Leaflet**,
exported as a **static site** (`output: 'export'`) and deployed to **GitHub Pages** via GitHub Actions.
Arabic (RTL) is the default language; English is one tap away.

Legend: ✅ done in this build · 🟡 partial · ⬜ planned

---

## Phase 0 — Foundation & identity ✅
- ✅ Brand identity: name, mascot "Lugma", palette, type, voice ([BRAND.md](BRAND.md))
- ✅ Next.js static export + GitHub Pages workflow (`basePath` auto-set to the repo name)
- ✅ Arabic‑first i18n with RTL/LTR switching, Kuwaiti Dinar formatting, Kuwait governorates & areas
- ✅ "Sticker Pop" design system: tokens, cards, chips, badges, buttons, empty states, loaders
- ✅ App shell: desktop header, **mobile bottom nav**, global search (⌘/Ctrl+K), location picker
- ✅ Accessibility: reduced‑motion (system + manual), sound toggle, focus rings, semantic HTML
- ✅ Trust layer: Demo / Verified / Community / OSM badges, "last updated", expired-offer filtering

## Phase 1 — Core discovery MVP ✅
- ✅ **Home hub**: animated hero, floating food, photo collage, search + location, Find My Meal / Spin
- ✅ Today's highlights, categories (23), restaurants near you, best offers with live countdowns, mood selector
- ✅ **Food Roulette**: 8 modes, filters (budget, include/exclude categories, distance, delivery/dine‑in, offers, veg, spice, size), physics‑style spin, tick sounds, confetti result screen with all actions
- ✅ **Offers marketplace**: 13 offer categories, 7 sort orders, cuisine/budget/area/restaurant/type filters, verified vs community
- ✅ **Restaurants directory** + detail pages (cover, hours with honest open/closed, map, menu, offers, similar, directions)
- ✅ **Discover food**: browse meals, categories, mood + time‑of‑day recommendations, budget planner

## Phase 2 — Location & personalisation ✅/🟡
- ✅ **Nearby**: Leaflet map + list, governorate/area picker or GPS (optional), walking/driving radius, open now, offers filter
- ✅ **Real places layer** from OpenStreetMap (Overpass) — real Kuwait restaurants, no fake ratings
- ✅ Recommendation engine (mood, time of day, budget, favourites, history, distance, active offers)
- ✅ Favourites + custom collections (on-device)
- ✅ Food comparison with value scoring and "not directly equivalent" warnings
- 🟡 Trending: editorial picks + *your* activity (real community trends need the backend in Phase 4)

## Phase 2.5 — Real data ✅
- ✅ Build-time OpenStreetMap snapshot of all Kuwait food places (directory tab, place pages, nearby, picker, search)
- ✅ Google Sheet CMS for listings, menus and offers (published/draft rows, auto-expiry, verified vs community)
- ✅ Scheduled rebuild every 6 hours; demo data auto-hides once real listings exist

## Phase 3 — Games & gamification ✅/🟡
- ✅ Food Battle (8‑meal bracket), Mystery Meal (gift reveal), Daily Challenges, Random Challenge generator
- ✅ Achievements (9 badges), daily streak, celebratory animations, profile page
- 🟡 Group Decision: pass‑the‑phone mode + shareable link that carries the shortlist. Live multi‑device voting → Phase 4

## Phase 4 — Accounts, community & realtime ⬜
- Supabase Auth (email, Google, Apple), sync favourites/achievements across devices
- **Live group rooms** (Supabase Realtime): invite link, suggest, vote, veto, synchronized wheel
- Reviews & ratings, food photo uploads (Storage), comments, recommendations, reporting
- Moderation queue, rate limiting, profanity filter (AR + EN)
- Real community trending (views, saves, picks) with privacy-preserving aggregation

## Phase 5 — Admin & restaurant portal ⬜
- Admin CMS: restaurants, categories, meals, offers (with expiry), featuring, users, reports
- Approve community offers → "Verified"; "Report incorrect info" pipeline
- Analytics: popular restaurants/categories, picker selections, engagement funnels
- Restaurant self‑service portal (claim listing, post offers, see insights)

## Phase 6 — Real data & growth ⬜
- Foursquare (via serverless proxy) for ratings/photos; nightly GitHub Action to refresh OSM data snapshot
- PWA (install, offline favourites), push notifications for "your favourite place has a new deal"
- Lunch/dinner smart alerts, weekly "food wrapped" recap, referral rewards
- SEO: per‑language URLs (`/ar`, `/en`), OG images per restaurant/offer

## Phase 7 — Business ⬜
- Sponsored placements (always labelled "Sponsored"), featured offers, restaurant subscriptions
- Affiliate ordering deep links, exclusive Akla deals, restaurant analytics dashboards
- GCC expansion: per‑country currency, areas, languages

---

## Extra ideas included / proposed
- ✅ **"Hunger meter"** slider in the picker (snack → feast) that maps to meal size
- ✅ **Time-aware greeting** ("Good morning — breakfast mode") that re-ranks everything
- ✅ **Veto chips** ("anything but pizza") in the picker and group mode
- ✅ **Kuwait time everywhere** (Asia/Kuwait) for open/closed and countdowns
- ⬜ **Ramadan mode**: iftar/suhoor timers, iftar deals, late-night re‑ordering of meal times
- ⬜ **Diwaniya mode**: big-group feast planner with per-person cost split
- ⬜ **Weather-aware picks** (hot day → cold drinks & ice cream) via Open‑Meteo (free, no key)
- ⬜ **Payday radar**: bigger treats around the 25th, budget mode near month-end
