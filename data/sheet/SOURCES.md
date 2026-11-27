# Sheet data sources

Every meal row in `meals.csv` was read on **2026-11-28** from the restaurant’s own website, ordering page or menu PDF
(never a delivery app). All rows are `draft`. Review, then set `status` to `published`. Descriptions are our own wording;
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
| Mughal Mahal (`mughal-mahal`) | 17 | <https://www.mughalmahal2go.com/category/> | Undated 15% discount shown on many items; list prices used. |
| P.F. Chang's (`pf-changs`) | 16 | <https://www.pfchangsme.com/en/menu?country=Kuwait> |  |
| The Cheesecake Factory (`the-cheesecake-factory`) | 19 | <https://thecheesecakefactoryme.com/kw/en/list/specialties><br><https://thecheesecakefactoryme.com/kw/en/list/salads><br><https://www.thecheesecakefactoryme.com/kw/en/elist/cheesecakes-specialty-desserts> |  |
| Shrimpy (`shrimpy`) | 17 | <https://www.shrimpy.com/> |  |
| Pick (`pick`) | 20 | <https://orderpick.com/en/pick-aljahra-31> |  |
| Dhahia Juice (`dhahia-juice`) | 21 | <https://order.dhahia.com/> |  |
| Koobs Coffee (`koobs-coffee`) | 15 | <https://www.koobs.cafe/menu> |  |
| Baked (`baked`) | 12 | <https://whileimbaked.ordable.com/category/bangin-bagels><br><https://whileimbaked.ordable.com/category/sweet-thaangs><br><https://whileimbaked.ordable.com/category/drinks> |  |
| DipnDip (`dipndip`) | 16 | <https://order.dipndipkw.com/menu/category/dip-crepes-1><br><https://order.dipndipkw.com/menu/category/dip-waffles-1><br><https://order.dipndipkw.com/menu/category/dip-pancakes-1><br><https://order.dipndipkw.com/menu/category/dip-cups><br><https://order.dipndipkw.com/menu/category/dip-coffee><br><https://order.dipndipkw.com/menu/category/milkshake> | Store showed an undated 15% discount; the regular (struck-through) price is used. |
| Cinnabon (`cinnabon`) | 12 | <https://cinnabonkw.ordable.com/> | 0.750 KD coffee items left out (looked like a promo). |
| Crumbs (`crumbs`) | 10 | <https://www.crumbskw.com/category/48-cookies-more><br><https://www.crumbskw.com/category/39-desserts-and-pudding><br><https://www.crumbskw.com/category/33-slice-of-cake-mini-tower><br><https://www.crumbskw.com/category/24-pops-cupcakes> | Undated discounts shown; the regular (struck-through) price is used. Items are sharing-size (family). |

**Total:** 25 restaurants, 388 meals, 0 offers (no official page stated an offer with dates).

## Checked but left out
No Kuwait prices on an official source (or the site was unreachable): Hardee’s, Five Guys, Johnny Rockets, Elevation Burger (2022 image-only PDF), Burger Boutique,
Pizza Hut (prices only after entering an address), Domino’s, Papa John’s, Kababji (Lebanon/USD only), Atyab Al Marshoud, Caribou Coffee, Tim Hortons,
Costa Coffee, % Arabica, Krispy Kreme, Gelatico (orders only via delivery apps), Ananas, IHOP, Texas Roadhouse, Proper Sliders, Shawarma Al Mousely,
Al-Tayeb Grill, Zwara, Mlas Bo Khammas, Meem Cafe, Locarb, Zero Carb, Balanced Cafe, Chipotle, Meme’s Curry, Assaha.
Also left out: Lenôtre café and Waraq Enab Factory. Their gathering trays and boxes have no stated portion size.
