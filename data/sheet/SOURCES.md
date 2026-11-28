# Sheet data sources

Every meal row in `meals.csv` was read on **2026-11-28** from the restaurant’s own website, ordering page or menu PDF
(never a delivery app). The first 25 restaurants below are `published`. Descriptions are our own wording;
no photos were copied (`image_url` is empty, emojis are used). One OpenStreetMap branch is linked per brand (`osm_id`)
for location and hours.

| Restaurant | Meals | Official source(s) | Review note |
|---|---|---|---|
| Burger King (`burger-king`) | 16 | <https://www.bk.com.kw/menu/sandwiches><br><https://www.bk.com.kw/menu/flame-grilled-meals><br><https://www.bk.com.kw/menu/sides-salads> |  |
| Shake Shack (`shake-shack`) | 15 | <https://www.shakeshackme.com/en/menu?country=Kuwait> |  |
| Thinnies (`thinnies`) | 14 | <https://img1.wsimg.com/blobby/go/5470abb0-621c-4446-82dd-d58693de8fd3/KW%20Menu%20HRZ%20(1).pdf> | Kuwait menu PDF (linked from thinnies.com) prints prices without a currency sign; KWD inferred from the KW title and a "100 fils" line. Sandwich-only prices used. |
| KFC (`kfc`) | 15 | <https://kuwait.kfc.me/en/burgers/1365> | Only the Burgers category was readable; Big Kentaaky Combo uses its regular price. |
| Naif Chicken (`naif-chicken`) | 12 | <https://www.ordernaif.com/> | Promo items show an undated discount; the regular (struck-through) price is used. |
| Raising Cane's (`raising-canes`) | 8 | <https://www.raisingcanesme.com/en/menu> |  |
| Chicster (`chicster`) | 17 | <https://www.chicsterkw.com/> |  |
| Bazooka (`bazooka`) | 14 | <https://bazookakuwait.com/en/resturant/bazooka> | Most items showed an undated ~50% discount; the regular (struck-through) price is used. |
| Subway (`subway`) | 15 | <https://www.subway.com.kw/menu/mc-sub-sandwiches> | Listing does not say 6-inch or footlong. |
| SOLO Pizza Napulitana (`solo-pizza`) | 14 | <https://order.solopn.com/category/pizza><br><https://order.solopn.com/category/antipasti><br><https://order.solopn.com/category/pasta><br><https://order.solopn.com/category/dolci><br><https://order.solopn.com/category/drinks> |  |
| Mais Alghanim (`mais-alghanim`) | 22 | <https://qrmenu.maisalghanim.com/category/grilled-meat/><br><https://qrmenu.maisalghanim.com/category/mix-grill/><br><https://qrmenu.maisalghanim.com/category/grilled-chicken/><br><https://qrmenu.maisalghanim.com/category/hot-appetizers/><br><https://qrmenu.maisalghanim.com/category/cold-appetizers/><br><https://qrmenu.maisalghanim.com/category/salads/><br><https://qrmenu.maisalghanim.com/category/sea-food/><br><https://qrmenu.maisalghanim.com/category/arabic-desserts/><br><https://qrmenu.maisalghanim.com/category/fresh-juices/> | Dine-in QR menu prices (default branch). OSM hours lack days, so hours show as not available. |
| Freej Swaileh (`freej-swaileh`) | 13 | <https://freej-swaeleh.com/home> | freej-swaeleh.com is brand-named with an Our Story page but shows no social links; confirm it is the official site. |
| Cafe Bazza (`cafe-bazza`) | 20 | <https://www.cafebazzadelivery.com/> | cafebazza.com has an expired TLS certificate; prices from cafebazzadelivery.com, which presents itself as the brand’s own ordering site. |
| Caesars Restaurant (`caesars`) | 18 | <https://restaurant.ordercaesars.com/> |  |
| Mughal Mahal (`mughal-mahal`) | 17 | <https://www.mughalmahal2go.com/category/> | 15% discount shown on many items; list prices used. The discount is now the dated offer `mughal-mahal-15-off-selected-dec`. |
| P.F. Chang's (`pf-changs`) | 16 | <https://www.pfchangsme.com/en/menu?country=Kuwait> |  |
| The Cheesecake Factory (`the-cheesecake-factory`) | 19 | <https://thecheesecakefactoryme.com/kw/en/list/specialties><br><https://thecheesecakefactoryme.com/kw/en/list/salads><br><https://www.thecheesecakefactoryme.com/kw/en/elist/cheesecakes-specialty-desserts> |  |
| Shrimpy (`shrimpy`) | 17 | <https://www.shrimpy.com/> |  |
| Pick (`pick`) | 20 | <https://orderpick.com/en/pick-aljahra-31> |  |
| Dhahia Juice (`dhahia-juice`) | 21 | <https://order.dhahia.com/> |  |
| Koobs Coffee (`koobs-coffee`) | 15 | <https://www.koobs.cafe/menu> |  |
| Baked (`baked`) | 12 | <https://whileimbaked.ordable.com/category/bangin-bagels><br><https://whileimbaked.ordable.com/category/sweet-thaangs><br><https://whileimbaked.ordable.com/category/drinks> |  |
| DipnDip (`dipndip`) | 16 | <https://order.dipndipkw.com/menu/category/dip-crepes-1><br><https://order.dipndipkw.com/menu/category/dip-waffles-1><br><https://order.dipndipkw.com/menu/category/dip-pancakes-1><br><https://order.dipndipkw.com/menu/category/dip-cups><br><https://order.dipndipkw.com/menu/category/dip-coffee><br><https://order.dipndipkw.com/menu/category/milkshake> | Store showed a 15% discount; the regular (struck-through) price is used. The discount is now the dated offer `dipndip-15-off-delivery-dec`. |
| Cinnabon (`cinnabon`) | 12 | <https://cinnabonkw.ordable.com/> | 0.750 KD coffee items left out (looked like a promo). |
| Crumbs (`crumbs`) | 10 | <https://www.crumbskw.com/category/48-cookies-more><br><https://www.crumbskw.com/category/39-desserts-and-pudding><br><https://www.crumbskw.com/category/33-slice-of-cake-mini-tower><br><https://www.crumbskw.com/category/24-pops-cupcakes> | Undated discounts shown; the regular (struck-through) price is used. Items are sharing-size (family). |

**First batch:** 25 restaurants, 388 meals.

**All Kuwait, after the second batch:** 73 restaurants (60 published, 13 draft), 845 meals (727 published), 5 offers (all published).

## Checked but left out
No Kuwait prices on an official source (or the site was unreachable): Hardee’s, Five Guys, Johnny Rockets, Elevation Burger (2022 image-only PDF), Burger Boutique,
Pizza Hut (prices only after entering an address), Domino’s, Papa John’s, Kababji (Lebanon/USD only), Atyab Al Marshoud, Caribou Coffee, Tim Hortons,
Costa Coffee, % Arabica, Krispy Kreme, Gelatico (orders only via delivery apps), Ananas, IHOP, Texas Roadhouse, Proper Sliders, Shawarma Al Mousely,
Al-Tayeb Grill, Zwara, Mlas Bo Khammas, Meem Cafe, Locarb, Zero Carb, Balanced Cafe, Chipotle, Meme’s Curry, Assaha.
Also left out: Lenôtre café and Waraq Enab Factory. Their gathering trays and boxes have no stated portion size.

## Added 2026-11-28 (second batch)

Read on **2026-11-28** from each brand's own website, own ordering store (white-label Ordable, Tapcom, Zyda, UPayments,
Mnasati or Wiyak stores run by the brand) or official menu file. Never from a delivery app. Location is the linked OSM
branch, or one branch pin taken from the brand's own store/branches page. Rows without any location stay `draft`.

| Restaurant | Status | Meals | Official source(s) | Review note |
|---|---|---|---|---|
| Mishmash (`mishmash`) | published | 9 | <https://mishmash.ordable.com/> | Menu read from the brand's own ordable store (KD prices, pickup menu). Location = Salmiya branch coordinates from the store's branch list (15 branches). |
| Shawarma Matic (`shawarma-matic`) | published | 9 | <https://shawarmamatic.ordable.com/> | Menu read from the brand's own ordable store (KD prices, pickup menu). Location = Salmiya branch from the store's branch list (also Jahra, Bneid Al Gar). Store does not link an Instagram account. |
| Shahryar (`shahryar`) | published | 10 | <https://shahryar.ordable.com/> | Menu read from the brand's own ordable store (KD prices, pickup menu). Location from the store's single branch entry. |
| Machboos (`machboos`) | published | 10 | <https://machboos.ordable.com/> | Menu read from the brand's own ordable store (KD prices, pickup menu). Location = Hawally branch from the store's branch list. Salads/starters categories failed to load, so not included. |
| Arayes (`arayes`) | published | 9 | <https://arayeskw.ordable.com/> | Menu read from the brand's own ordable store (KD prices, pickup menu). Location = Bahar Center branch from the store's branch list. Sandwich names on the menu are just the filling (e.g. "لحم"); we prefixed "عرايس"/"Arayes" for clarity. |
| Meshwiyat Abu Hassan (`abu-hassan-grills`) | draft | 9 | <https://abuhassan.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Menu read from the brand's own ordable store (KD prices, pickup menu). Only branch listed is "Salmiya - Amman Street, block 10" with no coordinates; not found in OSM. Logo original is 16800px, local copy resized to 1024px. |
| Abu Arab (`abu-arab`) | draft | 10 | <https://www.abuarabkuwait.com/menu> | **No location** (not in OSM, no branch pin on its own site). Prices from the brand's own website menu (KD). Locations page lists only a "Kuwait Delivery Hub" in central Kuwait with no address, so no coordinates. Site links Snapchat/TikTok, not Instagram. Names are given in English only on the menu; Arabic names are our translations. |
| Namli Gurme (`namli-gurme`) | draft | 9 | <https://namligurme.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Menu read from the brand's own ordable store (KD prices, pickup menu). Store says The Avenues Mall but its branch entry has no coordinates and it is not in OSM. Turkish rather than Arab cuisine; included as Middle Eastern grills. |
| Furn AlZaytoun (`furn-al-zaytoun`) | published | 9 | <https://furnalzaytoun.ordable.com/> | Menu read from the brand's own ordable store (KD prices, pickup menu). Location = Hawally branch from the store's branch list (also Mubarakiya, Fnaitees). Store shows a free-delivery promo for Rawda with no dates, so not added as an offer. Logo is only 150px. |
| Tasa Express (`tasa-express`) | published | 9 | <https://tasaexpress.ordable.com/> | Menu read from the brand's own ordable store (KD prices, pickup menu). Most single mains (machboos, biryani, maash) are priced per size option, so only fixed-price items are listed. OSM node is the Ardiya branch. |
| Swaikhat Lumi (`swaikhat-lumi`) | published | 10 | <https://www.swaikhatlumi.com/> | Prices from the brand's own UPayments uStore (pickup menu, KD). Menu read in Arabic; English names are our translations. No Instagram link on the store. |
| Shabestan (`shabestan`) | published | 9 | <https://menus.gourmania.com.kw/shabestan/category/charcoal-grill-kebabs/><br><https://menus.gourmania.com.kw/shabestan/category/cold-appetizers/><br><https://menus.gourmania.com.kw/shabestan/category/special-dishes/><br><https://menus.gourmania.com.kw/shabestan/category/dessert/> | Prices from the official menu site run by the operator, Gourmania International (dine-in menu, KD). No own ordering page (delivery link points to an aggregator). Menu only in Latin transliteration; Arabic names are our transliterations. Kebabs have a +0.500 KD option for mixed rice. |
| Asha's (`ashas`) | published | 10 | <https://ashasrestaurants.com/kuwait-menus><br><https://ashasrestaurants.com/wp-content/uploads/2026/06/ALSHAYA-ALACARTE-MENU-KWT.pdf> | Prices read from the Kuwait a la carte menu PDF linked on the official Kuwait menus page (file uploaded 2026/06; PDF metadata dated Jan 2025). Text in the PDF is outlined, so prices were read visually. No own online ordering; site lists Kuwait branches at The Avenues, Spoons (Mahboula), 360 Mall and Waterfront. OSM node is the Mahboula/Spoons area branch. |
| Benihana (`benihana`) | draft | 12 | <https://benihana.com.kw/menu/><br><https://benihana.com.kw/index.php/traditional-hibachi-meal/><br><https://benihana.com.kw/index.php/special-sushi-roll/><br><https://benihana.com.kw/index.php/rice/><br><https://benihana.com.kw/index.php/desserts/><br><https://benihana.com.kw/> | **No location** (not in OSM, no branch pin on its own site). No OSM match and the official site only embeds Google Maps by address (no coordinates): branches at The Avenues (Phase II, Ground Level) and Pixel Complex, Sabah Al Salem. The site's ORDER ONLINE button points to subsandmorekuwait.com (operator's site), so order_url left empty. Homepage banner advertises 50% off sushi & sashimi on Mondays (Avenues) / Saturdays (Sabah Al Salem) with no dates, so not added as an offer. Hibachi dinners include onion soup, salad, shrimp appetizer, vegetables and rice. |
| Sushi Club (`sushi-club`) | draft | 11 | <https://sushiclubkw.com/> | **No location** (not in OSM, no branch pin on its own site). Own UPayments store. No branch address/coordinates on the store and no OSM match, so location missing. Logo image includes phone numbers. |
| KAI Asian Diner (`kai-asian-diner`) | published | 11 | <https://www.kaiasiandiner.com/><br><https://www.kaiasiandiner.com/assets/menus/kai-menu-september-2026.bf975b4ee37f.pdf> | Prices from the official menu PDF dated 8 September 2026 (prices in KWD). Coordinates from the site's own structured data (Salem Al-Mubarak Street, Salmiya). Online ordering only via delivery apps, so order_url empty. Logo is white with red accents (dark background needed); file is WebP saved as .webp. |
| BALANCE (`balance-kw`) | published | 10 | <https://www.balancekw.com/><br><https://www.balancekw.com/branch/4> | Own ordering store (tapcom/ordable). Coordinates from the store's Kuwait City branch 'Get directions' link (only 3 decimals). Not the same brand as the rejected 'Balanced Cafe' (itsbalancedcafe.com). Item descriptions on the store are macro counts. |
| The Local Beet (`local-beet`) | published | 10 | <https://localbeet.ordable.com/><br><https://localbeet.ordable.com/contact> | Own ordable store. Coordinates from the Kuwait City branch 'Get directions' link on the store (branches: Kuwait City, Abu Hasaniya, Jabriya). |
| Biryani Pot (`biryani-pot`) | published | 9 | <https://www.biryanipotkw.com/category/biryani-rice><br><https://www.biryanipotkw.com/category/tandoori-khazana><br><https://www.biryanipotkw.com/category/breads><br><https://www.biryanipotkw.com/contact> | Own ordable store. Store shows a banner '15% discount full menu' with struck-through prices and no dates; the regular (struck-through) prices are used here and no offer was added. Coordinates come from the store's 'Salmiya' branch directions link (29.257, 47.935), which actually plots south-west of Salmiya near Ardiya; reviewer may want to verify. Many biryanis are 'price on selection' and were skipped. |
| Salad Creations (`salad-creations`) | published | 8 | <https://saladcreationskw.com/en/categories/18446a20-9ee9-49ac-96c2-62241f00fabd><br><https://saladcreationskw.com/en/categories/c28471ae-6fa1-47d4-9480-ff2cd78a2036><br><https://saladcreationskw.com/en/categories/579c3272-9835-4651-afdf-cefbdb1c7dc2> | Own Zyda ordering store (Alkulaib National Group). Coordinates from the store's first branch map link (360 Mall); other branches KIPCO, Andalus, Zain (Shuwaikh). Logo URL has no file extension; it is a PNG. |
| Health Stop (`health-stop`) | published | 9 | <https://order.healthstop.com.kw/category/protein-bowls><br><https://order.healthstop.com.kw/category/salads><br><https://order.healthstop.com.kw/category/cooked-sushi><br><https://healthstop.com.kw/> | Own ordering site (order.healthstop.com.kw). Item names on the ordering site are shown in Arabic; English names are from the site's English labels/our translation. OSM node is the Mahboula branch. |
| Genki Sushi (`genki-sushi`) | published | 10 | <https://www.genkisushi.com.kw/category/ura-maki><br><https://www.genkisushi.com.kw/category/noodles-and-rice><br><https://www.genkisushi.com.kw/category/appetizers><br><https://www.genkisushi.com.kw/contact> | Own ordable store. Store shows an undated '28% discount' with struck-through prices; regular prices used and no offer added. Coordinates from the Al Messilah branch (The Spot Complex) directions link. |
| Thakkara (`thakkara`) | published | 10 | <https://shop.thakkara.com/><br><https://order.thakkara.com/> | Official site links 'Order Online' to order.thakkara.com which links to shop.thakkara.com (brand's ordable store). Branches: Fahaheel, Salmiya, Farwaniya, Dajeej, Abbasiya. '2 KD combo' items show struck-through 2.750 with no dates; not used as an offer. |
| Shrimp House (`shrimp-house`) | published | 9 | <https://shrimphouse.ordable.com/category/main-dish><br><https://shrimphouse.ordable.com/category/fried-dishes><br><https://shrimphouse.ordable.com/category/boiled-seafood-bag> | Own ordable store (loaded slowly / intermittent 520 errors). Branch detail page did not load, so location is the OSM node named 'Shrimp House' in the Ardiya area (store lists Abu Al Hasaniya and Ardiah branches). Logo has a black background. |
| Overjar (`overjar`) | published | 9 | <https://www.overjar.com/category/to-share><br><https://www.overjar.com/category/gathering-1><br><https://www.overjar.com/category/bites-1><br><https://www.overjar.com/category/dessert-pizza-1><br><https://www.overjar.com/category/taybeen-cakes> | Prices from Overjar's own ordering site (same platform as Ordable). The site shows a standing 'Chocolate Snaps 50% off' promo with no real end date, so it was not added as an offer. |
| Toby's Estate (`tobys-estate`) | published | 10 | <https://kw.tobysestateme.com/category/espresso-bar><br><https://kw.tobysestateme.com/category/special-beverages><br><https://kw.tobysestateme.com/category/croissants-1><br><https://kw.tobysestateme.com/category/sandwiches><br><https://kw.tobysestateme.com/category/sweets> | Prices from Toby's Estate Kuwait's own online store. |
| Roaster Cafe (`roaster-cafe`) | published | 10 | <https://roasterkw.com/><br><https://roasterkw.com/ar> | Prices from Roaster Cafe's own Mnasati-powered ordering site. OSM node is tagged 'رزوتا كوفي' but links to roasterkw.com and sits at the branch coordinates listed on roasterkw.com/branches (Sulaibikhat). |
| Hefaure (`hefaure`) | published | 9 | <https://hefaurekw.com/en/category/23-souffl%C3%A9><br><https://hefaurekw.com/category/23-souffl%C3%A9><br><https://hefaurekw.com/en/category/48-brown-sugar-hot-cold><br><https://hefaurekw.com/en/category/66-matcha> | Prices from Hefaure's own Mnasati-powered ordering site (Arabic names from the Arabic version of the same pages). brand_color is an estimate. |
| T La Felice (`tlafelice`) | published | 10 | <https://tlafelicestore.com/><br><https://tlafelicestore.com/product-category/03-tiramisu/><br><https://tlafelicestore.com/product-category/48-hot-drinks/><br><https://tlafelicestore.com/product-category/09-all-day-breakfast/> | Prices read from T La Felice's own WooCommerce store (product pages). The store shows English names only; Arabic names are our own translations. |
| Mango World (`mango-world`) | published | 9 | <https://mangoworld.ordable.com/category/natural-juice><br><https://mangoworld.ordable.com/category/milkshake><br><https://mangoworld.ordable.com/category/mango-world-dishes><br><https://mangoworld.ordable.com/category/boxes-1> | Prices from Mango World's own Ordable store. Juices and shakes are priced by size; the Small cup price is used. |
| Boba Shop (`boba-shop`) | published | 10 | <https://order.lovebobashop.com/category/signature-boba-1><br><https://order.lovebobashop.com/category/matcha-japanese-ceremonial-grade-1><br><https://order.lovebobashop.com/category/soft-serve><br><https://order.lovebobashop.com/category/gathering-boxes-1> | Prices from Boba Shop's own ordering site. Soft serve cup price (1.450) is the 'Cup' option shown on the product. |
| Villa Vanilla (`villa-vanilla`) | published | 10 | <https://villavanillakw.com/en/category/1439><br><https://villavanillakw.com/category/1439><br><https://villavanillakw.com/en/category/4936> | Prices from Villa Vanilla's own Mnasati-powered store; items are whole cakes / Pyrex trays. Pistachio Cheesecake shows 14.000 struck through and 12.500 with no end date, so the regular 14.000 is used. No OSM node found; lat/lng is the branch pin on villavanillakw.com/en/branches. brand_color is an estimate. |
| Air Roastery (`air-roastery`) | published | 10 | <https://order.airroastery.com/category/hot-drinks><br><https://order.airroastery.com/category/cold-drinks><br><https://order.airroastery.com/category/signature-drinks><br><https://order.airroastery.com/category/pastries><br><https://order.airroastery.com/category/desserts> | Prices from Air Roastery's own ordering site (Ordable/Tapcom platform). |
| Shako Mako Juice (`shako-mako-juice`) | published | 9 | <https://www.shakomakojuice.com/category/fresh-juices><br><https://www.shakomakojuice.com/category/cocktail><br><https://www.shakomakojuice.com/category/barred-shake><br><https://www.shakomakojuice.com/category/hello-%D8%B1%D9%82%D9%8A> | Prices from Shako Mako Juice's own ordering site (Ordable/Tapcom platform). Drinks are priced by size; the Medium price is used. The site lists a standing '10% discount' promo with no real end date, so it was not added as an offer. |
| Häagen-Dazs (`haagen-dazs`) | published | 10 | <https://haagendazskw.com/20794812753/delivery/84741><br><https://haagendazskw.com/20794812753/delivery/84750><br><https://haagendazskw.com/20794812753/delivery/84743><br><https://haagendazskw.com/20794812753/delivery/84746><br><https://haagendazskw.com/20794812753/delivery/84749><br><https://haagendazskw.com/20794812753/delivery/84748> | Prices from Häagen-Dazs Kuwait's own ordering site (Wiyak platform), read from the page data. Many items show 'Price on selection' because you pick flavours; the listed base price is used. |
| illy Caffè (`illy-caffe`) | published | 10 | <https://illycafekw.com/954572290726/delivery/27123><br><https://illycafekw.com/954572290726/delivery/84122><br><https://illycafekw.com/954572290726/delivery/84123><br><https://illycafekw.com/954572290726/delivery/26916><br><https://illycafekw.com/954572290726/delivery/26918><br><https://illycafekw.com/954572290726/delivery/26920> | Prices from illy Caffè Kuwait's own ordering site (Wiyak platform), read from the page data. OSM node is the 'Espressamente illy' cafe that links to illycafekw.com. Logo file is a PNG despite the .jpg URL. |
| Little Caesars (`little-caesars`) | published | 12 | <https://kw.littlecaesars.com/en-kw/menu/><br><https://kw.littlecaesars.com/ar-kw/menu/> | Menu says all pizzas are large and serve 3-4. Ordering buttons send visitors to outside pages the brand does not run, so order_url is empty. Arabic names taken from the site's Arabic menu. |
| PizzaExpress (`pizza-express`) | published | 13 | <https://www.pizzaexpresskw.com/en/menu><br><https://www.pizzaexpresskw.com/en/fsr-menu.json> | Prices come from the Kuwait menu data that the official menu page loads (/en/fsr-menu.json). Pizza size is not stated; the Kuwait FAQ says pizzas come in Medium (11") and Large (14"). FAQ says they do not deliver, so order_url is empty. No logo file found on the site (header loads by script). |
| Jollibee (`jollibee`) | published | 12 | <https://www.jollibeekw.com/en/categories/ff8d3714-1d1f-4866-b622-4ec34b42b6bd><br><https://www.jollibeekw.com/en/categories/aa6c1583-aa8e-4112-a55f-3b7a61238a39><br><https://www.jollibeekw.com/en/categories/4e27449f-74e7-4887-a24a-2aa2d75e0378><br><https://www.jollibeekw.com/en/categories/5e5a4550-0968-4759-9efc-6125d7356651><br><https://www.jollibeekw.com/en/categories/ea445de0-1e8e-4c04-90ac-1a714455dc0b><br><https://www.jollibeekw.com/en/categories/dcf80ff0-fa11-41b1-a8b1-26982789db12> | Official Zyda-powered store. Prices are the display price shown per item (some items also carry a lower internal base price that is not shown). OSM node is the Fahaheel branch; the store lists 9 branches with map pins. |
| Police Steak (`police-steak`) | published | 6 | <https://policesteakkw.com/en/products/beef-steak-sandwich><br><https://policesteakkw.com/en/products/chicken-fillet-sandwich-1><br><https://policesteakkw.com/en/products/original-burger-sandwich><br><https://policesteakkw.com/en/products/individual-police-steak-meal><br><https://policesteakkw.com/en/products/beef-steak-platter><br><https://policesteakkw.com/en/products/onion-rings> | Prices read from individual product pages before choosing a branch; category pages say "Price according to choice". Offer items (1.000 KWD) have no dates and were left out. Arabic item names are our own spelling. |
| Smashy's (`smashys`) | draft | 8 | <https://order.smashys.com/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store. No OSM match and the store lists no branch address or map pin, so location is missing. Logo is the store's 120 px image. |
| Prime Burger (`prime-burger`) | draft | 8 | <https://primeburgerkw.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store. No OSM match and the store lists no branch address or map pin, so location is missing. |
| Hunny's (`hunnys`) | draft | 8 | <https://hunnys.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store. No OSM match and the store lists no branch address or map pin, so location is missing. Beef burgers priced by size option (shown as 0.000) were left out. |
| Signature (`signature-burger`) | draft | 9 | <https://signature.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store (store domain www.signature-kw.com). Id has a -burger suffix to avoid a generic "signature" slug. No OSM match and the store lists no branch address or map pin, so location is missing. |
| What?izza (`whatpizza`) | draft | 8 | <https://whatpizza.ordable.com/><br><https://whatpizza.ordable.com/category/pizza/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store; store says scheduled delivery only (no ASAP orders). Pizza prices are per size option. No OSM match and the store lists no branch address or map pin, so location is missing. |
| FIYA (`fiya`) | draft | 8 | <https://eatfy.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store (store domain www.eatfiya.com). No OSM match and the store lists no branch address or map pin, so location is missing. |
| PETE'S Pizza (`petes-pizza`) | draft | 8 | <https://petespizza.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store. Offer bundles in the store have no dates and were not added as offers. No OSM match and the store lists no branch address or map pin, so location is missing. |
| Casa Angelo (`casa-angelo`) | draft | 10 | <https://casaangelo.ordable.com/> | **No location** (not in OSM, no branch pin on its own site). Ordable-powered own store (store domain www.ordercasangelo.com). No OSM match and the store lists no branch address or map pin, so location is missing. |

### Checked in this batch but left out

- Zaatar W Zeit (Kuwait): Kuwait page on zaatarwzeit.net shows a menu image without prices; order.zaatarwzeit.net store is the Lebanon menu
- Shawarmer: shawarmer.com has no Kuwait menu or KWD prices
- Lebanese Roaster: lebaneseroaster.com is a UAE grocery shop (AED); no Kuwait restaurant menu
- Burj Al Hamam: burjalhamam.com and its menu PDF are the Lebanon restaurant; no Kuwait prices
- Em Sherif / Operation Falafel / Leila Min Lebnan / Abdel Wahab / Barbar / Al Khaima: no official Kuwait site or ordering page found
- Shawarma Factory: shawarmafactory.com is a parked domain; prices only on delivery apps
- Dar Hamad: own ordable store sells only dessert trays, gift boxes and pickles, no restaurant meals
- Swaikhat Al Jahra: swaikhataljahra.com has no menu prices
- Shawarma Shakir / Kalha / Kashounat Al Bait / Akelna Mahyouf / Freej Hamood / Soulaf: no official price page found (Instagram or delivery apps only)
- Khaneen: site behind a bot-check page; skipped
- Ubon (Thai): official site ubonkw.com shows the menu without prices; ordering only via delivery apps
- Fish Market (fishmarket.ordable.com): own store would not load (Cloudflare 520 / empty menu)
- Bento (bento.ordable.com): own store categories failed to load (520); country not confirmed
- JOA (joa.ordable.com): store shows 'We'll be back soon' (inactive)
- House of Lavan: own UPayments store shows 'Store Unavailable'
- Copper Chimney Kuwait: copperchimneykw.com is a parked domain; no official Kuwait price page found
- The Japanese Butcher: site returns an inactive placeholder page
- Chowking Kuwait: no official Kuwait site or price page found
- Ocean Basket Kuwait: no Kuwait menu with prices on the official site
- Wagamama Kuwait: no Kuwait site found
- Saravanaa Bhavan Kuwait: global site has no Kuwait prices
- Al Noukhaza / Al Boom: no official website with prices found (only delivery apps/hotel listings)
- Maki, Little Tokyo, Sushi Sora and other Kuwait sushi brands: no own ordering site found; prices only on delivery apps
- Starbucks Kuwait: official site (starbucks.com.kw) has no menu prices; ordering is app-only
- Dunkin' Kuwait: dunkinkuwait.com has no prices; dunkinkw.com ordering store shows 'Store Unavailable'
- White Roastery: own store sells only beans, capsules and merch, no cafe menu
- Juan Valdez Kuwait: own Ordable store sells only beans/instant/capsules/merch, no cafe menu
- Espressolab Kuwait: own store (espressolabkw.com) exposes only merchandise, no drink prices
- Cro Bakery & Cafe: website redirects to Instagram; prices only on delivery apps
- Wahed Bared Juice: link page only points to delivery apps and a Google Drive file; no official price page
- Bartone: own site shows no KWD prices
- La Mer Chocolatier: own store sells chocolate gift trays, not a cafe/dessert menu
- PAUL / Le Pain Quotidien / Magnolia / Joe & The Juice / Baskin-Robbins / Pinkberry / Cold Stone (Kuwait): no Kuwait-specific official price page found
- Wingstop Kuwait: wingstop.com.kw is a temporary "website unavailable" page that only points to delivery apps; no prices.
- McDonald's Kuwait: mcdonalds.com/kw menu pages refuse automated access (403) and the site shows no prices.
- Texas Chicken Kuwait: No Kuwait site found (only UAE/Oman/Iraq regional sites).
- Taco Bell Kuwait: No official Kuwait menu with prices; tacobell.ordable.com shows an inactive "We'll be back soon" page.
- Chili's Kuwait: No official Kuwait website or price list found.
- Applebee's Kuwait: Only an app listing by a third-party developer; no official web menu with prices.
- TGI Fridays Kuwait: Only a rewards app; no official Kuwait web menu with prices.
- Wimpy Kuwait: wimpy.me has no prices; ordering is app-only.
- Steak 'n Shake Kuwait: No official Kuwait site found.
- Fatburger Kuwait: No official Kuwait site found (order.fatburger.com is US and blocked by Cloudflare).
- Ruby Tuesday Kuwait: rubytuesdaykuwait.ordable.com shows an inactive "We'll be back soon" page.
- Charleys Kuwait: charleyskuwait.com loads its menu only through a private app API; no prices in the page.
- Burger & Lobster Kuwait: Official site no longer lists a Kuwait location or menu.
- Little Caesars / PizzaExpress offers: Checked for dated offers; none found on official pages.
- Offers sweep: Burger King, Subway, KFC, Shake Shack, Raising Cane's, P.F. Chang's, Cheesecake Factory, Thinnies, Chicster, Bazooka, SOLO, Caesars, Cafe Bazza, Shrimpy, Dhahia, Baked, Cinnabon, Koobs, Pick, Crumbs, Freej Swaileh, Mais Alghanim: No offer with a stated end date found on their official sites (several are script-only pages; Bazooka/Police Steak/Pete's show offer items without dates).
- What?izza loyalty rewards: Points-redemption rules valid to 2034-35, not a real time-limited offer.

## Offers (checked 2026-11-28)

Only promotions the restaurant itself runs, with a real end date, are listed. All are `verified = yes`.

| Offer | Restaurant | Runs (Kuwait time) | Source | Note |
|---|---|---|---|---|
| Free delivery on orders of 5 KD+ (`naif-chicken-free-delivery-5kd`) | Naif Chicken | until 2026-12-01 03:00 | <https://www.ordernaif.com/> | End date printed on the store. |
| 15% off delivery orders (`dipndip-15-off-delivery-dec`) | DipnDip | until 2026-12-31 23:59 | <https://order.dipndipkw.com/> | Dates from the store's own promotion data, not printed text. |
| 15% off selected dishes (`mughal-mahal-15-off-selected-dec`) | Mughal Mahal | 2026-11-21 → 2026-12-31 | <https://www.mughalmahal2go.com/> | Dates from the store's own promotion data. |
| Seafood Gumbo Soup, buy 1 get 1 (`mughal-mahal-soup-bogo-dec`) | Mughal Mahal | 2026-11-24 → 2026-12-04 | <https://www.mughalmahal2go.com/category/11-free/> | Dates from the store's own promotion data. |
| Value Boxes (`mughal-mahal-value-boxes-dec`) | Mughal Mahal | 2026-11-12 → 2026-12-31 | <https://www.mughalmahal2go.com/category/value-boxes/> | Dates from the store's own promotion data. |

Seen but left out because no end date was given (or the end date was a placeholder such as 2030/2033): Benihana's
Monday/Saturday sushi 50%, Biryani Pot 15%, Genki Sushi 28%, Thakkara 2 KD combos, Furn AlZaytoun free delivery to
Rawda, Overjar 50%, Shako Mako 10%, and offer items at Bazooka, Police Steak and Pete's Pizza. Where an item showed one of
these discounts, its regular (struck-through) price is used.

## Logos and links
Logos in `public/logos/` were downloaded on 2026-11-28 from each restaurant's own website or ordering site (both batches)
(site icon, header logo or the store's logo image) and resized to 256 px. KFC has no logo: kuwait.kfc.me only
offers a "KFC Lite" app icon, so it keeps its emoji. PizzaExpress also has none (its header logo is loaded by script). Logos are the brands' trademarks, used only to identify
each restaurant. Remove a file and its `logo_url` if a restaurant asks.

Restaurant pages show **Order** (`order_url`), **Website** (`website`, hidden when it is the same site as Order)
and **Instagram** (`instagram`). Instagram handles were added only where the restaurant's own site links to them.
Thinnies, The Cheesecake Factory and Koobs have no ordering page of their own (Koobs orders through its app),
so they have no Order button. No delivery-app links were added.
