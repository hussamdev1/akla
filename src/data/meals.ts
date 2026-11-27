import type { CategoryId, Meal, MealSize, MealTime, Mood } from "@/lib/types";
import { mdb } from "@/lib/img";
import { SHEET, SHOW_DEMO } from "./source";

/** DEMO DATA — sample menu items for the fictional demo restaurants. Prices are illustrative (KWD). */
type Row = [
  id: string, restaurantId: string, en: string, ar: string, descEn: string, descAr: string,
  category: CategoryId, price: number, img: string | null, emoji: string,
  spicy: 0 | 1 | 2 | 3, veg: boolean, size: MealSize, moods: Mood[], times: MealTime[], pick?: boolean,
];

const ALLDAY: MealTime[] = ["lunch", "afternoon", "dinner", "late"];
const MAIN: MealTime[] = ["lunch", "dinner"];

const rows: Row[] = [
  // Bun Voyage
  ["bv-smash", "bun-voyage", "Double Smash Burger", "دبل سماش برجر", "Two crispy-edged beef patties, cheddar, pickles, house sauce.", "قطعتين لحم مقرمشة الأطراف، شيدر، مخلل وصوص البيت.", "burgers", 2.75, "44bzep1761848278", "🍔", 0, false, "regular", ["starving", "delicious", "comfort"], ALLDAY, true],
  ["bv-classic", "bun-voyage", "The Classic Stack", "الكلاسيك ستاك", "Big-stack beef burger with special sauce, lettuce and onion.", "برجر لحم كبير مع صوص خاص وخس وبصل.", "burgers", 2.25, "urzj1d1587670726", "🍔", 0, false, "regular", ["comfort", "cheap"], ALLDAY],
  ["bv-halloumi", "bun-voyage", "Chicken & Halloumi Burger", "برجر دجاج وحلوم", "Grilled chicken, squeaky halloumi, rocket and chilli jam.", "دجاج مشوي، حلوم، جرجير ومربى فلفل حار.", "burgers", 2.5, "vdwloy1713225718", "🍔", 1, false, "regular", ["delicious", "new"], ALLDAY],
  ["bv-kofta", "bun-voyage", "Kofta Burger", "برجر كفتة", "Spiced lamb kofta patty, tahini slaw, pickled turnip.", "كفتة غنم متبّلة، سلطة طحينة، لفت مخلل.", "burgers", 2.95, "lgmnff1763789847", "🍔", 2, false, "regular", ["spicy", "new"], MAIN],
  // Crust & Co.
  ["cc-margherita", "crust-co", "Margherita Napoletana", "مارغريتا نابوليتانا", "San Marzano tomato, fior di latte, basil, olive oil.", "طماطم سان مارزانو، موزاريلا طازجة، ريحان وزيت زيتون.", "pizza", 2.9, "x0lk931587671540", "🍕", 0, true, "regular", ["delicious", "comfort"], ALLDAY, true],
  ["cc-diavola", "crust-co", "Diavola", "ديافولا", "Spicy beef pepperoni, chilli honey, mozzarella.", "ببروني لحم حار، عسل بالفلفل، موزاريلا.", "pizza", 3.4, "x0lk931587671540", "🌶️", 3, false, "regular", ["spicy", "starving"], ALLDAY],
  ["cc-family", "crust-co", "Family Feast Box", "بوكس العائلة", "Two large pizzas, garlic knots and a 1.5L drink.", "بيتزا كبيرتين، عقد ثوم ومشروب ١.٥ لتر.", "pizza", 8.5, "x0lk931587671540", "🍕", 0, false, "family", ["starving"], MAIN],
  // Crispy Coop
  ["cp-bucket", "crispy-coop", "8-Piece Crunch Bucket", "سطل ٨ قطع", "Eight pieces of 11-spice fried chicken with two sides.", "٨ قطع دجاج مقرمش مع طبقين جانبيين.", "fried-chicken", 4.25, "tyywsw1505930373", "🍗", 1, false, "family", ["starving", "comfort"], ALLDAY],
  ["cp-sandwich", "crispy-coop", "Nashville Hot Sandwich", "ساندويتش ناشفيل الحار", "Fiery crispy thigh, slaw, pickles on brioche.", "فخذ دجاج حار مقرمش، كول سلو ومخلل.", "fried-chicken", 1.65, "sbx7n71587673021", "🔥", 3, false, "regular", ["spicy", "cheap"], ALLDAY, true],
  ["cp-wings", "crispy-coop", "Cumin Lemon Wings", "أجنحة بالكمون والليمون", "Crispy wings tossed in cumin, lemon and garlic.", "أجنحة مقرمشة بالكمون والليمون والثوم.", "fried-chicken", 1.95, "4hzyvq1763792564", "🍗", 1, false, "snack", ["delicious", "cheap"], ["afternoon", "dinner", "late"]],
  // Saj & Spit
  ["ss-chicken", "saj-spit", "Chicken Shawarma Saj", "شاورما دجاج صاج", "Spit-roasted chicken, toum, pickles, fries inside.", "دجاج على السيخ، ثومية، مخلل وبطاطا داخل الصاج.", "shawarma", 0.75, "hcg6l91763596970", "🌯", 0, false, "regular", ["cheap", "comfort", "starving"], ["morning", "lunch", "afternoon", "dinner", "late"], true],
  ["ss-beef", "saj-spit", "Beef Shawarma Plate", "صحن شاورما لحم", "Beef shawarma, tahini, salad, fries and bread.", "شاورما لحم مع طحينة وسلطة وبطاطا وخبز.", "shawarma", 1.85, "kcv6hj1598733479", "🥙", 0, false, "large", ["starving"], MAIN],
  ["ss-falafel", "saj-spit", "Falafel Pita", "فلافل بالخبز", "Crispy falafel, tahini, tomato, parsley.", "فلافل مقرمشة، طحينة، طماطم وبقدونس.", "sandwiches", 0.5, "ae6clc1760524712", "🧆", 0, true, "snack", ["cheap", "healthy"], ["breakfast", "morning", "lunch", "late"]],
  // Diwan Al Kabsa
  ["dk-kabsa", "diwan-kabsa", "Chicken Kabsa", "كبسة دجاج", "Spiced basmati with half a roast chicken and daqoos.", "رز بسمتي متبّل مع نص دجاجة ودقوس.", "arabic", 2.5, "utqnjv1763598650", "🍚", 1, false, "large", ["starving", "comfort"], MAIN, true],
  ["dk-mandi", "diwan-kabsa", "Lamb Mandi", "مندي لحم", "Tender pit-cooked lamb on smoky mandi rice.", "لحم غنم طري مطبوخ بالتنور على رز مندي مدخّن.", "arabic", 4.75, "1nalo51765188375", "🍖", 0, false, "large", ["starving", "delicious"], MAIN],
  ["dk-tray", "diwan-kabsa", "Diwaniya Feast Tray", "صينية الديوانية", "Whole lamb shoulder, rice, salads and laban for 5–6.", "كتف غنم كامل مع رز وسلطات ولبن لـ٥-٦ أشخاص.", "arabic", 18.0, "gr4lo51763791826", "🍽️", 0, false, "family", ["starving"], ["dinner"]],
  ["dk-hummus", "diwan-kabsa", "Hummus & Baba Ghanoush", "حمص ومتبل", "Two classic dips with warm bread.", "حمص ومتبل مع خبز حار.", "arabic", 1.2, "gpon5u1763801180", "🫓", 0, true, "snack", ["healthy", "cheap"], ["lunch", "afternoon", "dinner"]],
  // Masala Moon
  ["mm-biryani", "masala-moon", "Lamb Dum Biryani", "برياني لحم دم", "Saffron basmati layered with spiced lamb, sealed and slow-cooked.", "رز بسمتي بالزعفران مع لحم متبّل مطبوخ على نار هادئة.", "indian", 2.25, "xrttsx1487339558", "🍛", 2, false, "large", ["starving", "spicy", "delicious"], MAIN, true],
  ["mm-handi", "masala-moon", "Chicken Handi", "دجاج هاندي", "Creamy tomato chicken curry cooked in a clay pot.", "كاري دجاج كريمي بالطماطم بقدر فخاري.", "indian", 1.95, "wyxwsp1486979827", "🍛", 2, false, "regular", ["comfort", "spicy"], MAIN],
  ["mm-dal", "masala-moon", "Dal Fry & Naan", "دال فراي مع نان", "Yellow lentils tempered with cumin and garlic, with naan.", "عدس أصفر بالكمون والثوم مع خبز نان.", "indian", 0.95, "wuxrtu1483564410", "🥘", 1, true, "regular", ["cheap", "healthy", "comfort"], ["lunch", "dinner", "late"]],
  ["mm-rogan", "masala-moon", "Lamb Rogan Josh", "روغن جوش لحم", "Kashmiri chilli lamb curry, deep and aromatic.", "كاري لحم بالفلفل الكشميري، غني وعطري.", "indian", 2.6, "vvstvq1487342592", "🌶️", 3, false, "regular", ["spicy", "new"], MAIN],
  // Pasta Piazza
  ["pp-carbonara", "pasta-piazza", "Spaghetti Carbonara (Beef Bacon)", "سباغيتي كاربونارا (بيكون لحم)", "Egg yolk, pecorino, black pepper and crispy beef bacon.", "صفار بيض، بيكورينو، فلفل أسود وبيكون لحم مقرمش.", "pasta", 3.75, "llcbn01574260722", "🍝", 0, false, "regular", ["delicious", "comfort"], MAIN, true],
  ["pp-arrabiata", "pasta-piazza", "Penne Arrabbiata", "بيني أرابياتا", "Fiery tomato, garlic and chilli sauce.", "صوص طماطم حار بالثوم والفلفل.", "pasta", 2.95, "ustsqw1468250014", "🌶️", 2, true, "regular", ["spicy", "cheap"], MAIN],
  ["pp-lasagne", "pasta-piazza", "Nonna's Lasagne", "لازانيا الجدة", "Layers of beef ragù, béchamel and parmesan.", "طبقات راغو لحم وبشاميل وبارميزان.", "italian", 4.25, "wtsvxx1511296896", "🍝", 0, false, "large", ["comfort", "starving"], MAIN],
  ["pp-alfredo", "pasta-piazza", "Fettuccine Alfredo", "فيتوتشيني ألفريدو", "Silky parmesan cream sauce.", "صوص كريمة البارميزان الناعم.", "pasta", 3.5, "0jv5gx1661040802", "🍝", 0, true, "regular", ["comfort"], MAIN],
  // Wok This Way
  ["wt-padthai", "wok-this-way", "Prawn Pad Thai", "باد تاي بالربيان", "Rice noodles, tamarind, peanuts, lime and prawns.", "نودلز رز، تمر هندي، فول سوداني، ليمون وربيان.", "asian", 2.85, "rg9ze01763479093", "🍜", 1, false, "regular", ["delicious", "new"], ALLDAY, true],
  ["wt-kungpao", "wok-this-way", "Kung Pao Chicken", "دجاج كونغ باو", "Wok-fried chicken, dried chillies, cashews.", "دجاج على الووك مع فلفل مجفف وكاجو.", "asian", 2.45, "1525872624", "🌶️", 3, false, "regular", ["spicy"], ALLDAY],
  ["wt-friedrice", "wok-this-way", "Chicken Fried Rice", "أرز مقلي بالدجاج", "Wok-smoky rice, egg, spring onion.", "أرز على الووك مع بيض وبصل أخضر.", "asian", 1.75, "wuyd2h1765655837", "🍚", 0, false, "regular", ["cheap", "comfort"], ALLDAY],
  ["wt-greencurry", "wok-this-way", "Thai Green Curry", "كاري أخضر تايلندي", "Coconut green curry with chicken and jasmine rice.", "كاري أخضر بجوز الهند مع دجاج ورز ياسمين.", "asian", 2.95, "sstssx1487349585", "🥥", 2, false, "regular", ["spicy", "delicious"], MAIN],
  // Sakura Roll
  ["sr-platter", "sakura-roll", "Sakura Sushi Platter (24 pcs)", "طبق سوشي ساكورا (٢٤ قطعة)", "Chef's selection of maki, nigiri and signature rolls.", "تشكيلة الشيف من الماكي والنيغيري والرولات المميزة.", "sushi", 7.5, "g046bb1663960946", "🍣", 0, false, "large", ["delicious", "new"], MAIN, true],
  ["sr-salmon", "sakura-roll", "Honey Teriyaki Salmon", "سلمون ترياكي بالعسل", "Glazed salmon with rice and pickles.", "سلمون مزجّج مع رز ومخللات.", "japanese", 4.25, "xxyupu1468262513", "🐟", 0, false, "regular", ["healthy", "delicious"], MAIN],
  ["sr-katsu", "sakura-roll", "Chicken Katsu Curry", "كاتسو كاري دجاج", "Panko chicken, Japanese curry, steamed rice.", "دجاج بانكو مع كاري ياباني ورز.", "japanese", 3.5, "vwrpps1503068729", "🍛", 1, false, "large", ["comfort", "starving"], MAIN],
  ["sr-udon", "sakura-roll", "Yaki Udon", "ياكي أودون", "Thick udon noodles stir-fried with vegetables.", "نودلز أودون سميكة مقلية مع خضار.", "japanese", 2.95, "wrustq1511475474", "🍜", 1, true, "regular", ["comfort", "new"], ALLDAY],
  // Gulf Catch
  ["gc-gambas", "gulf-catch", "Garlic Gambas", "ربيان بالثوم", "Sizzling prawns in garlic, chilli and olive oil.", "ربيان بالثوم والفلفل وزيت الزيتون.", "seafood", 3.95, "ze8uwg1763196123", "🦐", 1, false, "regular", ["delicious", "new"], MAIN, true],
  ["gc-calamari", "gulf-catch", "Crispy Calamari", "كاليماري مقرمش", "Lightly fried squid with lemon and tartare.", "حبار مقلي خفيف مع ليمون وصوص تارتار.", "seafood", 2.75, "yhi46r1763330279", "🦑", 0, false, "snack", ["delicious"], ["afternoon", "dinner"]],
  ["gc-sardines", "gulf-catch", "Grilled Catch of the Day", "صيد اليوم مشوي", "Whole grilled fish with rice and salad (price per plate).", "سمكة كاملة مشوية مع رز وسلطة (السعر للطبق).", "seafood", 5.5, "lpd4wy1614347943", "🐟", 0, false, "large", ["healthy", "starving"], MAIN],
  ["gc-crab", "gulf-catch", "Fried Crab Basket", "سلة سلطعون مقلي", "Crunchy fried crab with spicy dip.", "سلطعون مقلي مقرمش مع صوص حار.", "seafood", 4.5, "rprcc51782774240", "🦀", 2, false, "regular", ["spicy", "new"], ["dinner"]],
  // Casa Chili
  ["cch-tacos", "casa-chili", "Fish Tacos (3)", "تاكو سمك (٣)", "Cajun fish, slaw, lime crema on corn tortillas.", "سمك كاجن، كول سلو، كريمة ليمون على تورتيلا ذرة.", "mexican", 2.95, "uvuyxu1503067369", "🌮", 2, false, "regular", ["spicy", "new", "delicious"], ALLDAY, true],
  ["cch-enchilada", "casa-chili", "Chicken Enchiladas", "إنشيلادا دجاج", "Baked tortillas with chicken, salsa roja and cheese.", "تورتيلا مخبوزة بالدجاج وصلصة حمراء وجبن.", "mexican", 3.25, "qtuwxu1468233098", "🌯", 2, false, "large", ["comfort", "spicy"], MAIN],
  ["cch-fajitas", "casa-chili", "Chickpea Fajitas", "فاهيتا الحمص", "Smoky chickpeas, peppers and onions with tortillas.", "حمص مدخّن وفلفل وبصل مع تورتيلا.", "mexican", 2.25, "tvtxpq1511464705", "🫑", 1, true, "regular", ["healthy", "new"], MAIN],
  // Green Bowl Lab
  ["gb-quinoa", "green-bowl-lab", "Chicken Quinoa Greek Bowl", "بول كينوا ودجاج يوناني", "Quinoa, grilled chicken, feta, olives, cucumber. 520 kcal.", "كينوا، دجاج مشوي، فيتا، زيتون وخيار. ٥٢٠ سعرة.", "healthy", 2.95, "k29viq1585565980", "🥗", 0, false, "regular", ["healthy"], ["lunch", "dinner"], true],
  ["gb-couscous", "green-bowl-lab", "Aubergine Couscous Salad", "سلطة كسكس وباذنجان", "Roasted aubergine, herbs, pomegranate. 410 kcal.", "باذنجان مشوي، أعشاب، رمان. ٤١٠ سعرة.", "salads", 2.25, "02s6gc1763799560", "🍆", 0, true, "regular", ["healthy", "new"], ["lunch", "afternoon"]],
  ["gb-prawnsalad", "green-bowl-lab", "Bang Bang Prawn Salad", "سلطة ربيان بانغ بانغ", "Crunchy veg, prawns, sweet-chilli peanut dressing.", "خضار مقرمشة، ربيان وصوص فول سوداني بالفلفل الحلو.", "salads", 3.25, "4xcfai1763765676", "🦐", 1, false, "regular", ["healthy", "spicy"], ["lunch", "dinner"]],
  // Smoke Yard
  ["sy-brisket", "smoke-yard", "Smoked Brisket Plate", "صحن بريسكت مدخّن", "12-hour oak-smoked brisket, pickles, white bread, two sides.", "بريسكت مدخّن ١٢ ساعة، مخلل، خبز أبيض وطبقين جانبيين.", "bbq", 5.75, "ursuup1487348423", "🍖", 0, false, "large", ["starving", "delicious"], MAIN, true],
  ["sy-asado", "smoke-yard", "Beef Asado Ribs", "أضلاع أسادو", "Fire-roasted short ribs with chimichurri.", "أضلاع مشوية على النار مع تشيميتشوري.", "bbq", 6.5, "kgfh3q1763075438", "🍖", 1, false, "large", ["starving", "new"], ["dinner"]],
  ["sy-wrap", "smoke-yard", "Cumin Lamb Wrap", "راب لحم بالكمون", "Pulled smoked lamb, slaw, spicy mayo.", "لحم مدخّن مفتت، كول سلو ومايونيز حار.", "bbq", 2.95, "jyylmo1763790808", "🌯", 2, false, "regular", ["spicy"], ["lunch", "dinner", "late"]],
  // Sugar Dune
  ["sd-kunafa", "sugar-dune", "Hot Nabulsi Kunafa", "كنافة نابلسية ساخنة", "Stretchy cheese, crisp kataifi, rose syrup.", "جبن مطاطي، كنافة مقرمشة، قطر بماء الورد.", "desserts", 1.75, "76nffj1763593933", "🧀", 0, true, "regular", ["sweet", "comfort"], ["afternoon", "dinner", "late"], true],
  ["sd-baklava", "sugar-dune", "Pistachio Baklava Box", "علبة بقلاوة فستق", "12 pieces of pistachio baklava.", "١٢ قطعة بقلاوة بالفستق.", "desserts", 2.5, "ytme8t1764111401", "🍯", 0, true, "family", ["sweet"], ["afternoon", "dinner", "late"]],
  ["sd-cake", "sugar-dune", "Kunafa Chocolate Cake", "كيك كنافة بالشوكولاتة", "The viral pistachio-kunafa chocolate slice.", "شريحة الشوكولاتة بالكنافة والفستق المشهورة.", "desserts", 1.95, "yh3sg71763741307", "🍫", 0, true, "snack", ["sweet", "new"], ["afternoon", "late"]],
  // Polar Scoop
  ["ps-saffron", "polar-scoop", "Saffron & Cardamom Gelato", "جيلاتو زعفران وهيل", "Two scoops of our signature Gulf gelato.", "سكوبين من الجيلاتو الخليجي المميز.", "ice-cream", 1.25, null, "🍨", 0, true, "snack", ["sweet", "new"], ["afternoon", "late"], true],
  ["ps-luqaimat", "polar-scoop", "Luqaimat Sundae", "صنداي لقيمات", "Vanilla gelato, warm luqaimat, date syrup.", "جيلاتو فانيلا، لقيمات حارة ودبس تمر.", "ice-cream", 1.75, null, "🍦", 0, true, "regular", ["sweet", "comfort"], ["afternoon", "dinner", "late"]],
  ["ps-cone", "polar-scoop", "Kids' Rainbow Cone", "كون قوس قزح للأطفال", "One scoop, sprinkles, smiles.", "سكوب واحد مع رشّات ملوّنة.", "ice-cream", 0.6, null, "🍦", 0, true, "snack", ["sweet", "cheap"], ["afternoon", "late"]],
  // Bean There
  ["bt-spanish", "bean-there", "Spanish Latte", "سبانش لاتيه", "Double shot with condensed milk.", "دبل شوت مع حليب مكثّف.", "coffee", 1.4, null, "☕", 0, true, "snack", ["sweet", "comfort"], ["breakfast", "morning", "afternoon"], true],
  ["bt-v60", "bean-there", "V60 Ethiopia", "V60 إثيوبي", "Bright, floral filter coffee.", "قهوة مقطّرة بنكهة زهرية.", "coffee", 1.6, null, "☕", 0, true, "snack", ["new"], ["breakfast", "morning", "afternoon"]],
  ["bt-pastry", "bean-there", "Cream Cheese Fruit Pastry", "معجنات جبن كريمي وفواكه", "Flaky pastry with cream cheese and berries.", "معجنات هشّة بالجبن الكريمي والتوت.", "breakfast", 1.1, "1543774956", "🥐", 0, true, "snack", ["sweet"], ["breakfast", "morning"]],
  // Sunny Side
  ["sun-shakshuka", "sunny-side", "Shakshuka Skillet", "مقلاة شكشوكة", "Eggs poached in spiced tomato, with bread.", "بيض مطبوخ في صلصة طماطم متبّلة مع خبز.", "breakfast", 1.35, "g373701551450225", "🍳", 1, true, "regular", ["comfort", "cheap", "healthy"], ["breakfast", "morning"], true],
  ["sun-foul", "sunny-side", "Foul Medames", "فول مدمس", "Slow-cooked fava beans, olive oil, lemon, cumin.", "فول مطبوخ ببطء، زيت زيتون، ليمون وكمون.", "breakfast", 0.85, "lvn2d51598732465", "🫘", 0, true, "regular", ["cheap", "healthy"], ["breakfast", "morning"]],
  ["sun-benedict", "sunny-side", "Salmon Eggs Benedict", "بيض بنديكت بالسلمون", "Poached eggs, smoked salmon, hollandaise.", "بيض مسلوق، سلمون مدخّن وصوص هولنديز.", "breakfast", 2.95, "1550440197", "🥚", 0, false, "regular", ["delicious", "new"], ["breakfast", "morning"]],
  ["sun-pancakes", "sunny-side", "Banana Pancake Stack", "بان كيك بالموز", "Fluffy pancakes, banana, maple.", "بان كيك هش مع موز وشراب القيقب.", "breakfast", 1.75, "sywswr1511383814", "🥞", 0, true, "regular", ["sweet", "comfort"], ["breakfast", "morning"]],
  // Grill Garage
  ["gg-adana", "grill-garage", "Adana Kebab Plate", "صحن كباب أضنة", "Spicy minced lamb kebab, grilled tomato, tannour bread.", "كباب لحم حار مع طماطم مشوية وخبز تنور.", "grilled", 2.75, "04axct1763793018", "🔥", 2, false, "large", ["spicy", "starving"], MAIN, true],
  ["gg-tawook", "grill-garage", "Shish Tawook Skewers", "أسياخ شيش طاووق", "Yoghurt-marinated chicken skewers with garlic sauce.", "أسياخ دجاج متبّل باللبن مع ثومية.", "grilled", 2.25, "3um6il1763794322", "🍢", 0, false, "regular", ["healthy", "delicious"], MAIN],
  ["gg-chops", "grill-garage", "Chilli Ginger Lamb Chops", "ريش غنم بالزنجبيل", "Charred lamb chops with chilli-ginger glaze.", "ريش غنم مشوية بصوص الزنجبيل والفلفل.", "grilled", 4.95, "8xuvhj1763794991", "🍖", 2, false, "regular", ["delicious", "spicy"], ["dinner"]],
  ["gg-mixgrill", "grill-garage", "Family Mix Grill", "مشاوي مشكلة عائلية", "Kebab, tawook, chops and wings for four.", "كباب وطاووق وريش وأجنحة لأربعة أشخاص.", "grilled", 11.5, "rjhf741585564676", "🍢", 1, false, "family", ["starving"], ["dinner"]],
  // Squeeze Me
  ["sq-lemonmint", "squeeze-me", "Lemon Mint Frozen", "ليمون نعناع فروزن", "Fresh lemon, mint, crushed ice.", "ليمون طازج ونعناع وثلج مجروش.", "beverages", 0.75, null, "🍋", 0, true, "snack", ["cheap", "healthy"], ["morning", "afternoon", "late"], true],
  ["sq-cocktail", "squeeze-me", "Fruit Cocktail Layers", "كوكتيل فواكه طبقات", "Avocado, mango, strawberry layers topped with nuts.", "طبقات أفوكادو ومانجو وفراولة مع مكسرات.", "beverages", 1.25, null, "🥭", 0, true, "regular", ["sweet", "healthy"], ["afternoon", "late"]],
  ["sq-orange", "squeeze-me", "Fresh Orange Juice", "عصير برتقال طازج", "Just oranges. Nothing else.", "برتقال فقط. ولا شي ثاني.", "beverages", 0.85, null, "🍊", 0, true, "snack", ["healthy", "cheap"], ["breakfast", "morning", "afternoon"]],
  // Sandwich Studio
  ["sst-banhmi", "sandwich-studio", "Vegan Banh Mi", "بان مي نباتي", "Crispy tofu, pickled carrot, coriander, chilli.", "توفو مقرمش، جزر مخلل، كزبرة وفلفل.", "sandwiches", 1.5, "sonirb1763782831", "🥖", 1, true, "regular", ["healthy", "new"], ["lunch", "afternoon"], true],
  ["sst-grilledcheese", "sandwich-studio", "Mac & Cheese Toastie", "توست ماك آند تشيز", "Mac and cheese grilled between sourdough.", "ماك آند تشيز مشوي بين خبز العجين المخمّر.", "sandwiches", 1.35, "xutquv1505330523", "🧀", 0, true, "regular", ["comfort", "cheap"], ["lunch", "late"]],
  ["sst-turkey", "sandwich-studio", "Turkey Banh Mi", "بان مي ديك رومي", "Roast turkey, pickles, herbs, sriracha mayo.", "ديك رومي مشوي، مخللات، أعشاب ومايونيز سريراتشا.", "sandwiches", 1.75, "1wj8w31763781990", "🥪", 1, false, "regular", ["delicious"], ["breakfast", "lunch"]],
];

const DEMO_MEALS: Meal[] = rows.map((r) => ({
  id: r[0], restaurantId: r[1], name: { en: r[2], ar: r[3] }, description: { en: r[4], ar: r[5] },
  category: r[6], price: r[7], image: r[8] ? mdb(r[8]) : undefined, emoji: r[9], spicy: r[10],
  vegetarian: r[11], size: r[12], moods: r[13], times: r[14], editorsPick: r[15], currency: "KWD",
}));

// Sheet meals built before multi-country support have no currency: they are Kuwaiti dinars.
const SHEET_MEALS = (SHEET.meals as unknown as Meal[]).map((m) => ({ ...m, currency: m.currency ?? "KWD" }));
export const MEALS: Meal[] = [...SHEET_MEALS, ...(SHOW_DEMO ? DEMO_MEALS : [])];

export const mealById = (id: string) => MEALS.find((m) => m.id === id);
export const mealsByRestaurant = (rid: string) => MEALS.filter((m) => m.restaurantId === rid);
