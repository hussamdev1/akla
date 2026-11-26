import type { CategoryId, Restaurant, WeeklyHours } from "@/lib/types";
import { mdb } from "@/lib/img";
import { parseOpeningHours } from "@/lib/openingHours";
import { SHEET, SHOW_DEMO } from "./source";
import { AREAS } from "./geo";
import { CATEGORIES } from "./categories";

/**
 * DEMO DATA — every restaurant below is fictional and exists only to demonstrate the product.
 * Ratings, prices and hours are sample values. They are labelled "Demo" everywhere in the UI.
 * Replace with verified data from the admin CMS / restaurant portal (see docs/ROADMAP.md).
 */
const UPDATED = "2026-11-20";

const H = (open: string, close: string, fri?: [string, string] | "closed"): WeeklyHours => ({
  default: { open, close },
  overrides: fri ? { 5: fri === "closed" ? "closed" : { open: fri[0], close: fri[1] } } : undefined,
});

const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: "bun-voyage", name: { ar: "بن فوياج", en: "Bun Voyage" },
    tagline: { ar: "برجر مشوي على الفحم برحلة نكهات", en: "Char-grilled burgers on a flavour trip" },
    description: { ar: "برجر سماش بلحم طازج يومياً، خبز بريوش محمّص وصوصات سرّية. المكان المثالي لعشّاق البرجر في السالمية.", en: "Smash burgers with daily-fresh beef, toasted brioche and secret sauces. A Salmiya stop for serious burger lovers." },
    categories: ["burgers", "sandwiches"], areaId: "salmiya", lat: 29.3362, lng: 48.0721, priceLevel: 2,
    rating: 4.6, ratingCount: 1240, phone: "+965 2200 0101", hours: H("11:00", "02:00", ["13:00", "02:00"]),
    delivery: true, dineIn: true, cover: mdb("44bzep1761848278"), emoji: "🍔", brand: "#E63462", featured: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "crust-co", name: { ar: "كرست آند كو", en: "Crust & Co." },
    tagline: { ar: "بيتزا نابولية من فرن الحطب", en: "Wood-fired Neapolitan pizza" },
    description: { ar: "عجينة مخمّرة ٤٨ ساعة وفرن حطب على ٤٥٠ درجة. بيتزا رقيقة بأطراف منفوخة.", en: "48-hour fermented dough and a 450° wood oven. Thin centres, puffy leopard-spotted crusts." },
    categories: ["pizza", "italian"], areaId: "hawalli", lat: 29.3349, lng: 48.0301, priceLevel: 2,
    rating: 4.5, ratingCount: 860, phone: "+965 2200 0102", hours: H("12:00", "00:00"),
    delivery: true, dineIn: true, cover: mdb("x0lk931587671540"), emoji: "🍕", brand: "#F2542D", featured: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "crispy-coop", name: { ar: "كريسبي كوب", en: "Crispy Coop" },
    tagline: { ar: "دجاج مقرمش بتتبيلة ١١ بهار", en: "Crunchy chicken, 11-spice brine" },
    description: { ar: "دجاج متبّل طوال الليل ومقلي حتى القرمشة الذهبية، مع صوصات حارة بخمس درجات.", en: "Chicken brined overnight and fried golden, with hot sauces on a five-step heat scale." },
    categories: ["fried-chicken", "sandwiches"], areaId: "farwaniya", lat: 29.2791, lng: 47.9561, priceLevel: 1,
    rating: 4.3, ratingCount: 2105, phone: "+965 2200 0103", hours: H("10:30", "03:00"),
    delivery: true, dineIn: true, cover: mdb("tyywsw1505930373"), emoji: "🍗", brand: "#FFD23F", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "saj-spit", name: { ar: "صاج وسيخ", en: "Saj & Spit" },
    tagline: { ar: "شاورما على الصاج من الصبح لآخر الليل", en: "Saj shawarma, morning till late" },
    description: { ar: "شاورما دجاج ولحم على السيخ، خبز صاج طازج وثومية كريمية. سريع ورخيص ولذيذ.", en: "Chicken and beef shawarma off the spit, fresh saj bread and creamy toum. Fast, cheap, addictive." },
    categories: ["shawarma", "arabic", "sandwiches"], areaId: "kuwait-city", lat: 29.3741, lng: 47.9802, priceLevel: 1,
    rating: 4.4, ratingCount: 3120, phone: "+965 2200 0104", hours: H("09:00", "03:00", ["13:00", "03:00"]),
    delivery: true, dineIn: true, cover: mdb("hcg6l91763596970"), emoji: "🌯", brand: "#D98200", featured: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "diwan-kabsa", name: { ar: "ديوان الكبسة", en: "Diwan Al Kabsa" },
    tagline: { ar: "مندي وكبسة على أصولها", en: "Mandi and kabsa, done properly" },
    description: { ar: "لحم وحاشي ودجاج مطبوخ على الطريقة الخليجية التقليدية مع رز بسمتي ودقوس. صواني عائلية للديوانية.", en: "Lamb, camel and chicken cooked the traditional Gulf way with basmati and daqoos. Family trays for the diwaniya." },
    categories: ["arabic", "grilled"], areaId: "jabriya", lat: 29.3171, lng: 48.0262, priceLevel: 3,
    rating: 4.7, ratingCount: 980, phone: "+965 2200 0105", hours: H("12:00", "00:00"),
    delivery: true, dineIn: true, cover: mdb("utqnjv1763598650"), emoji: "🍚", brand: "#A8661B", featured: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "masala-moon", name: { ar: "مسالا مون", en: "Masala Moon" },
    tagline: { ar: "برياني وكاري من تنور الهند", en: "Biryani & curries from the tandoor" },
    description: { ar: "برياني على نار هادية، كاري غني وخبز نان من التنور. خيارات نباتية كثيرة.", en: "Slow dum biryani, rich curries and tandoor naan. Plenty of vegetarian choices." },
    categories: ["indian"], areaId: "khaitan", lat: 29.2871, lng: 47.9741, priceLevel: 1,
    rating: 4.2, ratingCount: 1530, phone: "+965 2200 0106", hours: H("11:00", "00:30"),
    delivery: true, dineIn: true, cover: mdb("xrttsx1487339558"), emoji: "🍛", brand: "#D97706", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "pasta-piazza", name: { ar: "باستا بياتزا", en: "Pasta Piazza" },
    tagline: { ar: "باستا طازجة تنعمل قدامك", en: "Fresh pasta, rolled in front of you" },
    description: { ar: "باستا يدوية يومياً، صوصات إيطالية كلاسيكية وتيراميسو البيت.", en: "Hand-rolled pasta daily, classic Italian sauces and a house tiramisu." },
    categories: ["italian", "pasta"], areaId: "shuwaikh", lat: 29.3472, lng: 47.9411, priceLevel: 3,
    rating: 4.5, ratingCount: 640, phone: "+965 2200 0107", hours: H("12:00", "23:30"),
    delivery: false, dineIn: true, cover: mdb("llcbn01574260722"), emoji: "🍝", brand: "#16A34A", isNew: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "wok-this-way", name: { ar: "ووك ذس واي", en: "Wok This Way" },
    tagline: { ar: "نودلز وأرز مقلي على نار عالية", en: "Fire-tossed noodles and fried rice" },
    description: { ar: "مطبخ آسيوي سريع: تايلندي، صيني وفيتنامي. ووك على نار عالية ونكهات جريئة.", en: "Fast pan-Asian: Thai, Chinese and Vietnamese. High-flame wok, bold flavours." },
    categories: ["asian"], areaId: "salmiya", lat: 29.3318, lng: 48.0796, priceLevel: 2,
    rating: 4.1, ratingCount: 720, phone: "+965 2200 0108", hours: H("12:00", "01:00"),
    delivery: true, dineIn: true, cover: mdb("rg9ze01763479093"), emoji: "🥡", brand: "#DC2626", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "sakura-roll", name: { ar: "ساكورا رول", en: "Sakura Roll" },
    tagline: { ar: "سوشي ورامن بلمسة عصرية", en: "Sushi & ramen with a modern twist" },
    description: { ar: "رولات سوشي إبداعية، ساشيمي طازج، وأطباق يابانية ساخنة مثل الكاتسو واليودون.", en: "Creative sushi rolls, fresh sashimi and hot Japanese plates like katsu and udon." },
    categories: ["japanese", "sushi", "asian"], areaId: "sharq", lat: 29.3871, lng: 47.9921, priceLevel: 3,
    rating: 4.6, ratingCount: 910, phone: "+965 2200 0109", hours: H("12:30", "23:30", ["14:00", "23:30"]),
    delivery: true, dineIn: true, cover: mdb("g046bb1663960946"), emoji: "🍣", brand: "#E11D48", featured: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "gulf-catch", name: { ar: "صيد الخليج", en: "Gulf Catch" },
    tagline: { ar: "صيد اليوم مشوي أو مقلي", en: "Today's catch, grilled or fried" },
    description: { ar: "اختر سمكتك من الصيد اليومي واطلبها مشوية أو مقلية أو مطبقة. ربيان وكاليماري وسلطعون.", en: "Pick from the daily catch and have it grilled, fried or mutabbaq. Prawns, calamari and crab too." },
    categories: ["seafood", "arabic"], areaId: "fahaheel", lat: 29.0846, lng: 48.1331, priceLevel: 3,
    rating: 4.4, ratingCount: 530, phone: "+965 2200 0110", hours: H("12:00", "23:00"),
    delivery: false, dineIn: true, cover: mdb("ze8uwg1763196123"), emoji: "🦐", brand: "#0284C7", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "casa-chili", name: { ar: "كاسا تشيلي", en: "Casa Chili" },
    tagline: { ar: "تاكو وبوريتو بنكهة الشارع", en: "Street-style tacos & burritos" },
    description: { ar: "تورتيلا طازجة، سالسا حارة ولحوم متبّلة على الطريقة المكسيكية.", en: "Fresh tortillas, fiery salsas and marinated meats Mexican street style." },
    categories: ["mexican"], areaId: "salwa", lat: 29.2981, lng: 48.0761, priceLevel: 2,
    rating: 4.0, ratingCount: 410, phone: "+965 2200 0111", hours: H("12:00", "00:00"),
    delivery: true, dineIn: true, cover: mdb("uvuyxu1503067369"), emoji: "🌮", brand: "#CA8A04", isNew: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "green-bowl-lab", name: { ar: "غرين بول لاب", en: "Green Bowl Lab" },
    tagline: { ar: "أكل صحي يشبع بجد", en: "Healthy food that actually fills you" },
    description: { ar: "بولات بروتين، سلطات مبتكرة وعصائر طبيعية. السعرات مكتوبة على كل طبق.", en: "Protein bowls, inventive salads and cold-pressed juices. Calories listed on every plate." },
    categories: ["healthy", "salads", "beverages"], areaId: "sharq", lat: 29.3842, lng: 47.9969, priceLevel: 2,
    rating: 4.5, ratingCount: 690, phone: "+965 2200 0112", hours: H("07:30", "22:00", ["09:00", "22:00"]),
    delivery: true, dineIn: true, cover: mdb("k29viq1585565980"), emoji: "🥗", brand: "#0F9F75", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "smoke-yard", name: { ar: "سموك يارد", en: "Smoke Yard" },
    tagline: { ar: "تدخين بطيء ١٢ ساعة", en: "12-hour low & slow smoke" },
    description: { ar: "بريسكت وأضلاع مدخّنة على خشب البلوط، صوصات باربكيو منزلية وأطباق جانبية كلاسيكية.", en: "Oak-smoked brisket and ribs, house BBQ sauces and classic sides." },
    categories: ["bbq", "grilled"], areaId: "jahra", lat: 29.3392, lng: 47.6611, priceLevel: 3,
    // Rating intentionally unknown: shows how the UI handles missing data honestly.
    phone: "+965 2200 0113", hours: H("13:00", "00:00"),
    delivery: false, dineIn: true, cover: mdb("ursuup1487348423"), emoji: "🍖", brand: "#B5432A", isNew: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "sugar-dune", name: { ar: "شوقر ديون", en: "Sugar Dune" },
    tagline: { ar: "كنافة وحلويات تذوب بالفم", en: "Kunafa & melt-in-your-mouth sweets" },
    description: { ar: "كنافة نابلسية ساخنة، بقلاوة بالفستق وكيك بالتمر. ركن الحلا في السالمية.", en: "Hot Nabulsi kunafa, pistachio baklava and date cake. Salmiya's sweet corner." },
    categories: ["desserts", "coffee"], areaId: "salmiya", lat: 29.3381, lng: 48.0779, priceLevel: 2,
    rating: 4.8, ratingCount: 1780, phone: "+965 2200 0114", hours: H("10:00", "01:00"),
    delivery: true, dineIn: true, cover: mdb("76nffj1763593933"), emoji: "🍰", brand: "#9333EA", featured: true, source: "demo", updatedAt: UPDATED,
  },
  {
    id: "polar-scoop", name: { ar: "بولار سكوب", en: "Polar Scoop" },
    tagline: { ar: "آيس كريم إيطالي بنكهات خليجية", en: "Gelato with Gulf flavours" },
    description: { ar: "جيلاتو يومي بنكهات مثل الزعفران والهيل والتمر واللقيمات.", en: "Daily gelato in flavours like saffron, cardamom, dates and luqaimat." },
    categories: ["ice-cream", "desserts"], areaId: "mangaf", lat: 29.0979, lng: 48.1281, priceLevel: 1,
    rating: 4.6, ratingCount: 450, // hours intentionally unknown
    delivery: true, dineIn: true, cover: mdb("p277uc1764109195"), emoji: "🍦", brand: "#0E8C99", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "bean-there", name: { ar: "بين ذير", en: "Bean There" },
    tagline: { ar: "قهوة مختصة وحلا خفيف", en: "Specialty coffee & light bites" },
    description: { ar: "حبوب محمّصة محلياً، V60 وسبانش لاتيه، مع كرواسون وكوكيز طازجة.", en: "Locally roasted beans, V60 and Spanish latte, with fresh croissants and cookies." },
    categories: ["coffee", "breakfast", "desserts"], areaId: "hawalli", lat: 29.3305, lng: 48.0262, priceLevel: 2,
    rating: 4.4, ratingCount: 1320, phone: "+965 2200 0116", hours: H("06:30", "00:00"),
    delivery: true, dineIn: true, cover: mdb("1543774956"), emoji: "☕", brand: "#7C4A1E", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "sunny-side", name: { ar: "صني سايد داينر", en: "Sunny Side Diner" },
    tagline: { ar: "فطور طول اليوم", en: "All-day breakfast" },
    description: { ar: "شكشوكة، فول، بيض بنديكت وبان كيك. لأن الفطور ما له وقت.", en: "Shakshuka, foul, eggs Benedict and pancakes. Because breakfast has no curfew." },
    categories: ["breakfast", "arabic", "coffee"], areaId: "sabah-alsalem", lat: 29.2591, lng: 48.0551, priceLevel: 1,
    rating: 4.3, ratingCount: 870, phone: "+965 2200 0117", hours: H("06:00", "15:00", ["07:00", "16:00"]),
    delivery: true, dineIn: true, cover: mdb("g373701551450225"), emoji: "🍳", brand: "#D4A000", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "grill-garage", name: { ar: "قريل قراج", en: "Grill Garage" },
    tagline: { ar: "مشاوي على الفحم وكباب", en: "Charcoal grills & kebabs" },
    description: { ar: "كباب، شيش طاووق وريش غنم على الفحم مع خبز تنور وسلطات.", en: "Kebab, shish tawook and lamb chops on charcoal with tannour bread and salads." },
    categories: ["grilled", "arabic", "bbq"], areaId: "ahmadi", lat: 29.0788, lng: 48.0861, priceLevel: 2,
    rating: 4.5, ratingCount: 1010, phone: "+965 2200 0118", hours: H("12:00", "01:00"),
    delivery: true, dineIn: true, cover: mdb("04axct1763793018"), emoji: "🔥", brand: "#E2541B", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "squeeze-me", name: { ar: "سكويز مي", en: "Squeeze Me" },
    tagline: { ar: "عصائر وسموذي طازجة", en: "Fresh juices & smoothies" },
    description: { ar: "عصير برتقال وجزر وليمون نعناع، سموذي وكوكتيلات فواكه بدون سكر مضاف.", en: "Orange, carrot and lemon-mint juices, smoothies and fruit cocktails with no added sugar." },
    categories: ["beverages", "healthy"], areaId: "farwaniya", lat: 29.2758, lng: 47.9612, priceLevel: 1,
    rating: 4.2, ratingCount: 380, phone: "+965 2200 0119", hours: H("09:00", "02:00"),
    delivery: true, dineIn: false, cover: mdb("6g3rso1763486069"), emoji: "🧃", brand: "#14B8A6", source: "demo", updatedAt: UPDATED,
  },
  {
    id: "sandwich-studio", name: { ar: "ساندويتش ستوديو", en: "Sandwich Studio" },
    tagline: { ar: "ساندويتشات فنية بخبز يومي", en: "Artful sandwiches on daily bread" },
    description: { ar: "بان مي، راب لحم بالكمون، جبن مشوي ومزيد. خبز يُخبز كل صباح.", en: "Banh mi, cumin lamb wraps, grilled cheese and more. Bread baked every morning." },
    categories: ["sandwiches", "breakfast"], areaId: "kuwait-city", lat: 29.3779, lng: 47.9748, priceLevel: 1,
    rating: 4.1, ratingCount: 290, phone: "+965 2200 0120", hours: H("07:00", "23:00", "closed"),
    delivery: true, dineIn: true, cover: mdb("sonirb1763782831"), emoji: "🥪", brand: "#5FA324", isNew: true, source: "demo", updatedAt: UPDATED,
  },
];

/** Real listings managed in the Akla Google Sheet (see docs/DATA.md). */
type SheetRestaurant = Omit<Restaurant, "hours" | "areaId" | "cover" | "source"> & { hoursText?: string; areaId?: string; cover?: string };

const nearestArea = (lat: number, lng: number) =>
  AREAS.reduce((best, a) => ((a.lat - lat) ** 2 + (a.lng - lng) ** 2 < (best.lat - lat) ** 2 + (best.lng - lng) ** 2 ? a : best)).id;

const PARTNER_RESTAURANTS: Restaurant[] = (SHEET.restaurants as unknown as SheetRestaurant[]).map(({ hoursText, ...r }) => ({
  ...r,
  categories: r.categories as CategoryId[],
  areaId: r.areaId && AREAS.some((a) => a.id === r.areaId) ? r.areaId : nearestArea(r.lat, r.lng),
  hours: parseOpeningHours(hoursText),
  cover: r.cover || CATEGORIES.find((c) => c.id === r.categories[0])?.image || "",
  // a rating is only shown when the sheet says where it comes from
  rating: r.ratingSource ? r.rating : undefined,
  ratingCount: r.ratingSource ? r.ratingCount : undefined,
  source: "partner",
}));

export const RESTAURANTS: Restaurant[] = [...PARTNER_RESTAURANTS, ...(SHOW_DEMO ? DEMO_RESTAURANTS : [])];

export const restaurantById = (id: string) => RESTAURANTS.find((r) => r.id === id);
