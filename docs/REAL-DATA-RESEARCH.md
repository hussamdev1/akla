# Real menus, prices and offers: can Akla get them? (researched 28 Nov 2026)

**Short answer: no from the delivery apps, yes from the restaurants themselves.**
talabat, Deliveroo, Keeta, Jahez, Snoonu and Careem offer **no public or affiliate API** for reading menus, prices or offers.
Their terms limit content to personal, non-commercial use, and the big ones (talabat, Deliveroo, Jahez) sit behind
Cloudflare bot protection that turns away scripted requests. Scraping them is **not viable and not advisable** for Akla.
The legitimate route is to get data **from the restaurants**: manual entry from their own channels, then
restaurant self-submission, plus free open place data (OpenStreetMap + Overture) for the basics.

> Summary of terms, robots files and Kuwaiti law. This is not legal advice. Ask a Kuwait-qualified lawyer before
> relying on any of it commercially.

Method: robots.txt fetched with an honest one-off user agent (`AklaResearchBot/0.1`). Where that was blocked I loaded
the page once in a normal browser. Each site got a handful of page loads at most. I bypassed no challenge, used no
proxy, faked no user agent and stored no menus or photos. Unless noted, every source was accessed on **2026-11-28**.

---

## 1. Comparison

| Source (Kuwait) | Official access | ToS on scraping / reuse | robots.txt | What's technically exposed (no login) | Risk | Recommendation |
|---|---|---|---|---|---|---|
| **talabat** (Delivery Hero) | No public or affiliate API. Delivery Hero's POS/menu APIs are **for vendors and POS partners, invite-only**, and push menus *into* talabat [6][7] | **Explicitly forbidden.** Robots, spiders, scraping, data mining, putting content into "any database", commercial reuse and even **deep-linking without authorisation** are all prohibited [1] | `User-agent: *` with **no Disallow**, only sitemaps [2]. Scripted requests get **HTTP 403 from Cloudflare**, even for robots.txt itself | Brand pages (`/kuwait/{slug}`) are server-rendered with JSON-LD `Restaurant` (name, logo, cuisine, `aggregateRating`). **No menu until you pick an area** [3] | 🔴 High (contract + bot protection) | **Don't scrape.** Link to the brand page at most. Ask talabat for written OK to link, or for a partner feed |
| **Deliveroo Kuwait** (DoorDash since 2025) | No public or affiliate API found for Kuwait. A UAE affiliate listing exists on a third-party directory only [13] | No explicit "scraping" word, but §7: *"You may not copy, reproduce, republish, download … or otherwise use any content on our site in any way except for your own personal, non-commercial use."* Service is "for personal, non-commercial use" [4] | Disallows `/api/`, `*/item/`, `*/brands/`, `*/graphql`, account and order paths. `/menu/` pages are allowed. Sitemap lists 4,000+ menu URLs [5] | Full menu with prices and image URLs in a ~5 MB `__NEXT_DATA__` blob. No JSON-LD. Scripted requests get **403 "Just a moment…" (Cloudflare challenge)** | 🔴 High (copying breaches §7; bot wall) | **Don't scrape.** Linking to a menu page is fine (no linking restriction found) |
| **Keeta** (Meituan, in Kuwait since 15 Sep 2025 [9]) | **Keeta Open Platform** API exists, but it's for merchants and POS integrators: NDA, developer approval, per-merchant OAuth [8]. No discovery or affiliate feed. Business contact: `marketing.kw@keetainc.com` | Consumer terms aren't on the website (app only), so not verified. Treat as "personal use only" like the others | `Allow: /`, `Disallow: /api/`. AI crawlers are explicitly welcome [10] | SEO pages (`/KW/en/wst/restaurants/{cityId}/{city}`) list restaurant names and cuisines, server-rendered. **No menus or prices on the web**: ordering is app-only | 🟠 Medium (little to get; terms unknown) | Nothing useful to take. Email the marketing contact about a partnership |
| **Jahez Kuwait** | None found | Terms not publicly reachable | Empty `User-agent: *` (allows all) [11] | Homepage returns **403 with a Cloudflare challenge**, to both a script and a normal browser load. **Stopped there**, as the brief required | 🔴 High (bot wall) | Stop. Partnership only |
| **Snoonu** (Jahez-owned, launched in Kuwait 2025 [14]) | None found | Not reviewed | `Allow: /` for `*`, but **`Disallow: /` for a long list of data and AI crawlers** (CCBot, GPTBot, ClaudeBot, Diffbot…) [12]. A clear "don't harvest" signal | Not probed | 🟠 Medium | Partnership only |
| **Careem** | None for food | ToS page renders with JavaScript. No clause found in the static HTML | Disallows `/api/`, `/auth/`, `/*/food/selection/`, `/*/quik/` [15] | No public menu pages. Careem Food's 2025–26 news is UAE-only [16], so its Kuwait food service is unconfirmed | ⚪ Low relevance | Ignore for now |
| **Cari** | — | — | `trycarriage.com` (old Carriage) returns Cloudflare 526. `cari.com.kw` doesn't resolve | **Cari has left Kuwait.** Its customers were moved to Deliveroo under a commercial agreement (late 2025) [17][18] | — | Remove from docs and app copy |
| **Zomato** | Public API shut years ago | — | Request failed (HTTP/2 error) | — | — | Not relevant in Kuwait |
| **Commercial scrapers** (Apify, Bright Data, ScrapingBee "talabat scraper") [19] | Sell talabat/Deliveroo Kuwait menus | They don't change the platform's terms. Akla would still be republishing data it has no right to | — | — | 🔴 High | **Don't buy** |

### Legitimate alternatives

| Source | Access | Terms | What it gives for Kuwait | Fit for static GitHub Pages | Recommendation |
|---|---|---|---|---|---|
| **OpenStreetMap** (already used) | Overpass, free | ODbL, attribution | 1,628 places. In our current file: 761 have cuisine, 387 a brand, 144 a phone, 141 hours, **140 a website, 22 an Instagram**. No menus or ratings | ✅ already in `build-data.mjs` | Keep. Add missing Instagram/website tags at openstreetmap.org (that helps everyone) |
| **Overture Maps Places** | Free GeoParquet on S3/Azure | **CDLA-Permissive-2.0** (the Places guide says no OSM data and no share-alike) [20]. Earth Engine lists ODbL, so confirm before shipping | Names, categories, **websites, socials, phones**, brand, operating status | ✅ build-time extract (DuckDB, Kuwait bounding box), monthly | **Add**: best free way to find restaurants' own sites and Instagram |
| **Foursquare OS Places** | Free dataset, now **gated** (you share contact details) [21] | Apache-2.0 tag on Hugging Face | Similar POI fields, no ratings or photos | ✅ build-time | Optional, after Overture |
| **Foursquare Places API** | Key; 10k free **Pro** calls a month. Ratings, tips and photos are **Premium (paid)** [22] | Per API terms | Ratings and photos cost money | ⚠️ needs a key, so build-time only | Skip for now |
| **Google Places API (New)** | Billing account; per-SKU free caps (10k Essentials / 5k Pro / 1k Enterprise a month) since Mar 2025 [23] | **No caching of content** except `place_id` (kept forever) and lat/lng (30 days) [24] | Ratings, photos, hours | ❌ can't bake ratings or photos into static files | Store **`place_id` only** and link "Reviews on Google Maps". Never copy Google ratings into the sheet |
| **Restaurants' own websites and Instagram** | Manual, by an editor | Their content, their copyright. Prices are facts. Photos need permission | Menus, prices, offers (often posted on Instagram first) | ✅ via the existing Google Sheet CMS | **Primary source for menus and offers** |
| **Instagram API** | Business Discovery needs your own IG professional account plus app review [25]. oEmbed embeds posts [26] | Meta platform terms | Post media and captions of business accounts | ⚠️ needs a token, so build-time only | Later: embed the official offer post via oEmbed instead of copying it |
| **Restaurant self-submission** | Google Form → sheet | Restaurant grants Akla a licence | Menus, prices, photos, offers, "verified" | ✅ fits the sheet pipeline | **Add next**: the long-term source of truth |

**How other aggregators get their data.** Not by scraping each other. Delivery apps get menus from their
merchant contracts and POS integrations (e.g. Delivery Hero's vendor APIs [6], Keeta's Open Platform [8]).
Zomato built its listings with field teams: in the UAE, a 15-person Dubai team refreshed restaurant data every three
months, and elsewhere teams scanned printed menus in person [27]. Google relies on owner-managed Business Profiles and
user contributions. Akla should do the same on a small scale: an editor, then the restaurants themselves.

---

## 2. Key terms, quoted

**talabat, Kuwait Terms and Conditions** [1]:
- *"Except as specifically authorized by Talabat, you may not deep-link to the site for any purpose or access the site
  manually or with any robot, spider, web crawler, extraction software, automated process or device to scrape, copy,
  or monitor any portion of the site or any information, content, or material on the site."*
- *"You may not, for example, incorporate the information, content, or other material in any database, compilation,
  archive or cache."*
- Prohibited activities include *"using any data mining, robots or similar data gathering and extraction tools"*.
- *"You may not link or frame to any pages of the site … without prior written consent from Talabat. You may become a
  'fan' of the site or share links to the site via social networking …"*
- Content is *"subject to copyright and other intellectual property rights under state of Kuwait and international conventions"*.

**Deliveroo Kuwait, Terms of Use for Website and Applications** [4]:
- §7: *"We are the owner of or the licensee of all intellectual property rights in our Site and our Service … You may
  not copy, reproduce, republish, download, post, broadcast, transmit, make available to the public, or otherwise use
  any content on our site in any way except for your own personal, non-commercial use."*
- §2: *"You also agree not to access without authority, interfere with, damage or disrupt any part of our Site or our Service …"*

**What this means for Akla's existing `order_url` column.** Linking to a **Deliveroo** menu page is fine: we found no
restriction on inbound links. talabat's terms, read literally, also require authorisation for deep links, although
sharing links is tolerated. In practice the risk is low, but the clean fixes are: (a) prefer the restaurant's own
ordering link, (b) link to talabat **brand pages** like any shared link, and (c) ask talabat partnerships for written
OK if Akla grows.

---

## 3. Kuwait legal context (summary, not legal advice)

- **Copyright: Law No. 75 of 2019 on Copyright and Related Rights** [28]. It protects **databases** and **photographs**
  as works. Compilations are protected where the *selection or arrangement* is original, not the underlying facts
  (Art. 23(7), per the Commons summary [29]). Individual prices and dish names are facts. Copying whole menus,
  descriptions and especially **photos** from a platform risks infringement. Kuwait has **no EU-style separate database
  right**, so contract terms and copyright do the work.
- **Cybercrime: Law No. 63 of 2015 on Combating Information Technology Crimes** [30][31]. It criminalises deliberate
  unauthorised entry into an information system. Getting past a bot challenge or login to harvest data could be
  argued to fall under it. That alone rules out the "scraper behind Cloudflare" approach.
- **Contract.** Using the sites binds you to their terms (talabat: continued use means acceptance [1]). Breach of the
  terms is the most likely claim, and talabat specifically reserves *"temporary and permanent injunctive relief"*.
- **robots.txt** isn't law. It's a published signal of what the operator allows. Here robots.txt is permissive on
  talabat and Keeta, but the **terms and the bot walls are what count**.

---

## 4. Conclusion

| Question | Answer |
|---|---|
| Is scraping talabat / Deliveroo / Keeta / Jahez technically possible? | Only by getting around Cloudflare (talabat, Deliveroo, Jahez) or reverse-engineering the app (Keeta). Both are off-limits. |
| Is it allowed? | **No.** talabat forbids it outright. Deliveroo limits all content to personal, non-commercial use. |
| Is it advisable even if "just prices"? | **No.** It risks contract claims, possible cybercrime exposure, blocked builds (Cloudflare 403s would break the 6-hourly GitHub Action) and stale, unverifiable data. |
| Was `docs/DATA.md` §4 right? | **Yes, confirmed**, with two corrections: Cari has left Kuwait, and talabat's terms also restrict deep-linking. |
| Best legitimate route? | Restaurant-sourced data (editor entry → self-submission), open place data for the basics, link-outs for ordering, and a partnership request to the delivery apps. |

---

## 5. Recommended plan (fits static GitHub Pages + `scripts/build-data.mjs`)

**Phase A: now, free, no new infrastructure**
1. **Editor-curated menus for the top 30–50 places.** Use the existing Google Sheet `restaurants` / `meals` / `offers` tabs.
   Take prices and items from the restaurant's **own** website, Instagram or printed menu. Set `osm_id` so hours and
   location fill in. Don't copy delivery-app photos. Use photos the restaurant sends or that you take yourself.
2. **Track provenance on meals.** Add `source_url` and `checked_at` columns to `meals` (offers already has `source_url`).
   Show "Price checked 28 Nov" in the UI and flag rows older than 60 days in `build-data.mjs`'s problem list.
3. **Fix order links.** Order `order_url` by preference: restaurant's own site, then Deliveroo menu page, then talabat
   brand page. Drop Cari from copy and docs.
4. **Ratings.** Never copy delivery-app or Google ratings. Optionally store a Google `place_id` (allowed indefinitely
   [24]) and render a "Reviews on Google Maps" link. No API call at build time is needed for that.

**Phase B: next sprint, still static**
5. **Overture enrichment step.** Add a monthly GitHub Action that runs DuckDB over the Overture `places` theme with a
   Kuwait bounding box (lng 46.5–48.5, lat 28.5–30.1). It outputs a small `data/overture-kw.json` (id, name, websites,
   socials, phones, brand). It's matched to OSM places by name and distance (under 75 m) in `build-data.mjs`, and
   fills `w`/`g` where OSM is missing them. Attribution goes in the footer. Confirm the licence first (see table).
   This gives editors a list of official Instagram and website links to work from.
6. **Restaurant self-submission.** Publish a Google Form ("List your restaurant on Akla") that writes to a
   `submissions` tab. It needs a consent checkbox granting Akla a non-exclusive licence to show the menu, prices and
   photos, plus a contact for verification. An editor copies approved rows into the main tabs with `status = published`
   and `verified = yes`. No server needed.
7. **Offer posts via oEmbed.** For an offer from an official Instagram post, store the post URL in `source_url` and
   embed it at build time with Meta oEmbed [26], instead of re-hosting the image.

**Phase C: business**
8. **Partnership requests.** Send to talabat (Delivery Hero partnerships), Deliveroo Kuwait and Keeta
   (`marketing.kw@keetainc.com`) asking for an affiliate link programme or a licensed content feed. Akla's pitch:
   it sends hungry users with intent to order. Any feed they grant then plugs into `build-data.mjs` as one more
   source, with its own badge.
9. **Phase 5 portal** (from the roadmap) replaces the form once there's a backend.

**What not to do:** buy scraper datasets, run headless browsers against the delivery apps, copy their photos or
ratings, or put API keys in the browser.

---

## 6. Sources (all accessed 2026-11-28)

1. talabat, Terms and Conditions (Kuwait): <https://www.talabat.com/kuwait/terms>
2. talabat robots.txt: <https://www.talabat.com/robots.txt> (scripted fetch got Cloudflare 403; read in a browser)
3. talabat brand page example, JSON-LD observed: <https://www.talabat.com/kuwait/kababji>
4. Deliveroo Kuwait, Legal (Terms of Service; Terms of Use for Website and Applications): <https://deliveroo.com.kw/en/legal>. Arabic ToS PDF (June 2026): <https://a.storyblok.com/f/62776/x/4059c7567e/kw_terms-of-service-june-2026-docx-en-ar_kw-c-docx.pdf>
5. Deliveroo Kuwait robots.txt and sitemap: <https://deliveroo.com.kw/robots.txt>, <https://deliveroo.com.kw/en/sitemap-index.xml>
6. Delivery Hero developer portal (POS / partner APIs): <https://developers.deliveryhero.com>, <https://developers.deliveryhero.com/documentation/pos.html>
7. foodpanda/Delivery Hero integration prerequisites: <https://integration.foodpanda.com/en/documentation/>
8. Keeta Open Platform API docs: <https://api-docs.mykeeta.com/>, <https://api-docs.mykeeta.com/apis/opendelivery/keeta-developer-portal>
9. Keeta launches in Kuwait (TechNode, 16 Sep 2025): <https://technode.com/2025/09/16/meituan-expands-food-delivery-brand-keeta-to-kuwait/>
10. Keeta robots.txt and Kuwait sitemap: <https://www.keeta-global.com/robots.txt>, <https://www.keeta-global.com/sitemap-xml/kw/en/sitemap-kw-en-001.xml>
11. Jahez robots.txt: <https://www.jahez.net/robots.txt>. Homepage behind Cloudflare challenge: <https://www.jahez.net/>
12. Snoonu robots.txt: <https://snoonu.com/robots.txt>
13. Deliveroo UAE affiliate listing (third-party directory): <https://www.affilitizer.com/programs/deliveroo.ae>
14. Snoonu arrives in Kuwait (Zawya): <https://www.zawya.com/en/press-release/companies-news/snoonu-arrives-in-kuwait-a-new-era-of-everyday-technology-wzt8qi2h>
15. Careem robots.txt: <https://www.careem.com/robots.txt>. Kuwait ToS: <https://www.careem.com/en-kw/terms-of-service/>
16. Careem Food news (UAE): <https://blog.careem.com/posts/careem-food-launches-catering-service-in-the-uae>
17. Deliveroo to welcome Cari customers (Zawya): <https://www.zawya.com/en/press-release/companies-news/deliveroo-to-welcome-cari-customers-following-commercial-agreement-umilxhqa>
18. Cari exits Kuwait market (248am): <https://248am.com/mark/news/cari-exits-kuwait-market>
19. Example commercial scrapers (not endorsed): <https://apify.com/scrapesage/talabat-scraper>, <https://brightdata.com/products/web-scraper/talabat>
20. Overture Maps Places guide (licence, schema): <https://docs.overturemaps.org/guides/places>
21. Foursquare OS Places (gated dataset): <https://huggingface.co/datasets/foursquare/fsq-os-places>. Blog: <https://foursquare.com/resources/blog/data/evolving-fsq-open-source-places/>
22. Foursquare pricing: <https://foursquare.com/pricing/>
23. Google Maps Platform, March 2025 pricing changes: <https://developers.google.com/maps/billing-and-pricing/march-2025>
24. Google Maps Platform Service Specific Terms (Places caching): <https://cloud.google.com/archive/maps-platform/terms/maps-service-terms-20250501>
25. Instagram Business Discovery: <https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery>
26. Instagram oEmbed: <https://developers.facebook.com/docs/instagram-platform/oembed>. Changelog: <https://developers.facebook.com/docs/instagram-platform/changelog>
27. Zomato data collection: The National <https://www.thenationalnews.com/business/zomato-gives-you-food-choices-fast-with-a-click-of-a-mouse-1.287876>, Inquirer <https://lifestyle.inquirer.net/?p=102783>
28. Kuwait Law No. 75 of 2019 on Copyright and Related Rights (WIPO Lex): <https://www.wipo.int/wipolex/en/legislation/details/19908>
29. Wikimedia Commons, Copyright rules: Kuwait (secondary summary): <https://c.enwp.org/wiki/Commons:CRT/Kuwait>
30. Kuwait Law No. 63 of 2015 on Combating IT Crimes (Ministry of Justice, Arabic): <https://www.moj.gov.kw/AR/Documents/MojDocs/قانون رقم 63 لسنة 2015 بإصدار قانون مكافحة جرائم تقنية المعلومات.pdf>
31. Council of Europe, Kuwait cybercrime legal profile: <https://rm.coe.int/octocom-legal-profile-kuwait/16809e5372>

OSM coverage figures come from Akla's own `public/data/places.json` (fetched 2026-11-26).
