import type { Offer, OfferTag, OfferType, L } from "@/lib/types";
import { localDayStart } from "@/lib/time";
import { GENERATED_AT, SHEET, SHOW_DEMO } from "./source";

/**
 * DEMO DATA — sample promotions for the fictional demo restaurants.
 * Times are relative to the current day in Kuwait so the demo always has a mix of
 * live, ending-soon, upcoming and expired offers. Expired ones are never shown as active.
 */
type Spec = {
  id: string; r: string; meal?: string; type: OfferType; title: L; desc: L;
  orig?: number; final?: number; pct?: number;
  starts: [number, string]; ends: [number, string]; added: number;
  verified: boolean; tags: OfferTag[]; terms?: L; pick?: boolean;
};

const T: L = { ar: "لفترة محدودة وحسب التوفر. لا يمكن جمعه مع عروض أخرى.", en: "Limited time, while stocks last. Cannot be combined with other offers." };

const SPECS: Spec[] = [
  { id: "o-bv-bogo", r: "bun-voyage", meal: "bv-smash", type: "bogo", title: { ar: "اشترِ برجر واحصل على الثاني مجاناً", en: "Buy 1 Smash, get 1 free" }, desc: { ar: "على دبل سماش برجر، كل ثلاثاء وأربعاء.", en: "On the Double Smash Burger, every Tue & Wed." }, orig: 5.5, final: 2.75, pct: 50, starts: [-2, "11:00"], ends: [0, "23:59"], added: -2, verified: true, tags: ["limited", "dinner"], pick: true },
  { id: "o-bv-lunch", r: "bun-voyage", meal: "bv-classic", type: "combo", title: { ar: "كومبو الغداء: برجر + بطاطا + مشروب", en: "Lunch combo: burger + fries + drink" }, desc: { ar: "من ١٢ الظهر إلى ٣ العصر.", en: "12pm to 3pm only." }, orig: 3.6, final: 2.5, pct: 31, starts: [0, "12:00"], ends: [6, "15:00"], added: -5, verified: true, tags: ["lunch"] },
  { id: "o-cc-family", r: "crust-co", meal: "cc-family", type: "family", title: { ar: "بوكس العائلة بخصم ٢٥٪", en: "Family Feast Box 25% off" }, desc: { ar: "بيتزا كبيرتين وعقد ثوم ومشروب.", en: "Two large pizzas, garlic knots and a drink." }, orig: 8.5, final: 6.375, pct: 25, starts: [-1, "12:00"], ends: [3, "23:59"], added: -1, verified: true, tags: ["dinner", "weekend"], pick: true },
  { id: "o-cc-delivery", r: "crust-co", type: "free-delivery", title: { ar: "توصيل مجاني فوق ٤ د.ك", en: "Free delivery over KWD 4" }, desc: { ar: "عند الطلب مباشرة من المطعم.", en: "When ordering directly from the restaurant." }, starts: [-10, "00:00"], ends: [20, "23:59"], added: -10, verified: true, tags: [] },
  { id: "o-cp-bucket", r: "crispy-coop", meal: "cp-bucket", type: "percent", title: { ar: "سطل ٨ قطع بخصم ٣٠٪", en: "8-piece bucket 30% off" }, desc: { ar: "عرض نهاية الأسبوع.", en: "Weekend special." }, orig: 4.25, final: 2.975, pct: 30, starts: [-1, "10:30"], ends: [1, "03:00"], added: -1, verified: true, tags: ["weekend", "limited"], pick: true },
  { id: "o-cp-sandwich", r: "crispy-coop", meal: "cp-sandwich", type: "fixed", title: { ar: "ساندويتش ناشفيل بـ ١ د.ك", en: "Nashville Hot sandwich for KWD 1" }, desc: { ar: "عرض الغداء.", en: "Lunch deal." }, orig: 1.65, final: 1.0, pct: 39, starts: [0, "11:00"], ends: [0, "15:00"], added: 0, verified: false, tags: ["lunch", "limited"] },
  { id: "o-ss-two", r: "saj-spit", meal: "ss-chicken", type: "bogo", title: { ar: "٢ صاج دجاج بـ ١ د.ك", en: "2 chicken saj for KWD 1" }, desc: { ar: "بعد ١١ بالليل للسهارى.", en: "After 11pm for night owls." }, orig: 1.5, final: 1.0, pct: 33, starts: [0, "23:00"], ends: [7, "03:00"], added: -3, verified: true, tags: ["limited"], pick: true },
  { id: "o-dk-tray", r: "diwan-kabsa", meal: "dk-tray", type: "family", title: { ar: "صينية الديوانية + ٢ لبن مجاناً", en: "Diwaniya tray + 2 free laban" }, desc: { ar: "للطلبات المسبقة قبل ٢٤ ساعة.", en: "For pre-orders 24h ahead." }, orig: 18.0, final: 16.0, pct: 11, starts: [-4, "12:00"], ends: [10, "23:59"], added: -4, verified: true, tags: ["dinner", "exclusive"] },
  { id: "o-dk-kabsa", r: "diwan-kabsa", meal: "dk-kabsa", type: "percent", title: { ar: "كبسة الدجاج بخصم ٢٠٪", en: "Chicken kabsa 20% off" }, desc: { ar: "عرض الغداء اليومي.", en: "Daily lunch offer." }, orig: 2.5, final: 2.0, pct: 20, starts: [-6, "12:00"], ends: [-1, "16:00"], added: -6, verified: true, tags: ["lunch"] },
  { id: "o-mm-biryani", r: "masala-moon", meal: "mm-biryani", type: "percent", title: { ar: "برياني يوم الجمعة بخصم ٤٠٪", en: "Friday biryani 40% off" }, desc: { ar: "خصم كبير على برياني اللحم.", en: "Big discount on lamb dum biryani." }, orig: 2.25, final: 1.35, pct: 40, starts: [-1, "11:00"], ends: [2, "23:00"], added: -1, verified: false, tags: ["weekend"] },
  { id: "o-pp-pasta", r: "pasta-piazza", meal: "pp-carbonara", type: "percent", title: { ar: "افتتاح جديد: ٣٥٪ على كل الباستا", en: "Grand opening: 35% off all pasta" }, desc: { ar: "احتفالاً بالافتتاح.", en: "Celebrating our opening." }, orig: 3.75, final: 2.438, pct: 35, starts: [-3, "12:00"], ends: [4, "23:30"], added: -3, verified: true, tags: ["exclusive", "limited"], pick: true },
  { id: "o-wt-lunch", r: "wok-this-way", meal: "wt-friedrice", type: "combo", title: { ar: "غداء الووك: أرز + سبرنغ رول + مشروب", en: "Wok lunch: rice + spring rolls + drink" }, desc: { ar: "أيام الأسبوع فقط.", en: "Weekdays only." }, orig: 2.85, final: 1.9, pct: 33, starts: [-7, "12:00"], ends: [14, "16:00"], added: -7, verified: true, tags: ["lunch"] },
  { id: "o-sr-sushi", r: "sakura-roll", meal: "sr-platter", type: "percent", title: { ar: "طبق السوشي بخصم ٢٥٪", en: "Sushi platter 25% off" }, desc: { ar: "عرض حصري لمستخدمي أكلة.", en: "Akla exclusive." }, orig: 7.5, final: 5.625, pct: 25, starts: [-1, "12:30"], ends: [0, "23:30"], added: -1, verified: true, tags: ["exclusive", "dinner", "limited"], pick: true },
  { id: "o-gc-gambas", r: "gulf-catch", meal: "gc-gambas", type: "bogo", title: { ar: "ربيان بالثوم: ٢ بسعر ١", en: "Garlic gambas: 2 for 1" }, desc: { ar: "للجلسات داخل المطعم فقط.", en: "Dine-in only." }, orig: 7.9, final: 3.95, pct: 50, starts: [1, "12:00"], ends: [5, "23:00"], added: 0, verified: true, tags: ["dinner"] },
  { id: "o-cch-tacos", r: "casa-chili", meal: "cch-tacos", type: "fixed", title: { ar: "ثلاثاء التاكو: ٣ تاكو بـ ٢ د.ك", en: "Taco Tuesday: 3 tacos for KWD 2" }, desc: { ar: "كل ثلاثاء.", en: "Every Tuesday." }, orig: 2.95, final: 2.0, pct: 32, starts: [-2, "12:00"], ends: [1, "00:00"], added: -2, verified: false, tags: ["limited"] },
  { id: "o-gb-bowl", r: "green-bowl-lab", meal: "gb-quinoa", type: "percent", title: { ar: "بول الكينوا بخصم ١٥٪ قبل ١ الظهر", en: "Quinoa bowl 15% off before 1pm" }, desc: { ar: "للطلبات المبكرة.", en: "Early-bird lunch." }, orig: 2.95, final: 2.508, pct: 15, starts: [-5, "07:30"], ends: [9, "13:00"], added: -5, verified: true, tags: ["lunch"] },
  { id: "o-sy-brisket", r: "smoke-yard", meal: "sy-brisket", type: "percent", title: { ar: "بريسكت الويكند بخصم ٢٠٪", en: "Weekend brisket 20% off" }, desc: { ar: "حتى نفاد الكمية اليومية.", en: "Until the daily batch sells out." }, orig: 5.75, final: 4.6, pct: 20, starts: [-1, "13:00"], ends: [2, "00:00"], added: -1, verified: true, tags: ["weekend", "dinner"] },
  { id: "o-sd-kunafa", r: "sugar-dune", meal: "sd-kunafa", type: "bogo", title: { ar: "كنافة ثانية مجاناً", en: "Second kunafa free" }, desc: { ar: "بعد ٩ مساءً.", en: "After 9pm." }, orig: 3.5, final: 1.75, pct: 50, starts: [-3, "21:00"], ends: [0, "21:30"], added: -3, verified: true, tags: ["limited"], pick: true },
  { id: "o-ps-cone", r: "polar-scoop", meal: "ps-cone", type: "fixed", title: { ar: "كون الأطفال بـ ٥٠٠ فلس", en: "Kids' cone for 500 fils" }, desc: { ar: "طوال الأسبوع.", en: "All week long." }, orig: 0.6, final: 0.5, pct: 17, starts: [-2, "00:00"], ends: [5, "23:59"], added: -2, verified: false, tags: [] },
  { id: "o-bt-latte", r: "bean-there", meal: "bt-spanish", type: "percent", title: { ar: "صباحك سبانش: ٣٠٪ قبل ٩ الصبح", en: "Morning Spanish latte 30% off before 9am" }, desc: { ar: "لعشّاق الصباح.", en: "For early birds." }, orig: 1.4, final: 0.98, pct: 30, starts: [-4, "06:30"], ends: [12, "09:00"], added: -4, verified: true, tags: [] },
  { id: "o-sun-breakfast", r: "sunny-side", meal: "sun-shakshuka", type: "combo", title: { ar: "فطور لشخصين بـ ٢.٥ د.ك", en: "Breakfast for two, KWD 2.5" }, desc: { ar: "شكشوكة + فول + شاي كرك لشخصين.", en: "Shakshuka + foul + karak tea for two." }, orig: 3.6, final: 2.5, pct: 31, starts: [-8, "06:00"], ends: [8, "11:00"], added: -8, verified: true, tags: [] },
  { id: "o-gg-family", r: "grill-garage", meal: "gg-mixgrill", type: "family", title: { ar: "مشاوي عائلية بخصم ٢٠٪", en: "Family mix grill 20% off" }, desc: { ar: "لأربعة أشخاص مع خبز وسلطات.", en: "For four with bread and salads." }, orig: 11.5, final: 9.2, pct: 20, starts: [-2, "12:00"], ends: [3, "01:00"], added: -2, verified: true, tags: ["dinner", "weekend"] },
  { id: "o-sq-delivery", r: "squeeze-me", type: "free-delivery", title: { ar: "توصيل مجاني لكل العصائر", en: "Free delivery on all juices" }, desc: { ar: "داخل الفروانية.", en: "Within Farwaniya." }, starts: [-1, "09:00"], ends: [1, "02:00"], added: -1, verified: false, tags: [] },
  { id: "o-sst-banhmi", r: "sandwich-studio", meal: "sst-banhmi", type: "percent", title: { ar: "بان مي نباتي بخصم ٢٠٪", en: "Vegan banh mi 20% off" }, desc: { ar: "احتفالاً بالافتتاح.", en: "Opening celebration." }, orig: 1.5, final: 1.2, pct: 20, starts: [-12, "07:00"], ends: [-2, "23:00"], added: -12, verified: true, tags: [] },
];

const atOffset = (dayStart: number, [d, hm]: [number, string]) => {
  const [h, m] = hm.split(":").map(Number);
  return new Date(dayStart + d * 864e5 + (h * 60 + m) * 6e4).toISOString();
};

/** Real offers from the Google Sheet have fixed dates (in the restaurant's time zone) and are filtered by the clock like everything else. */
const SHEET_OFFERS = SHEET.offers as unknown as Offer[];

export function buildOffers(now: Date): Offer[] {
  return [...SHEET_OFFERS, ...(SHOW_DEMO ? buildDemoOffers(now) : [])];
}

function buildDemoOffers(now: Date): Offer[] {
  const day = localDayStart(now, "Asia/Kuwait"); // demo restaurants are in Kuwait
  return SPECS.map((s) => ({
    id: s.id, restaurantId: s.r, mealId: s.meal, title: s.title, description: s.desc, type: s.type,
    originalPrice: s.orig, finalPrice: s.final, percent: s.pct,
    startsAt: atOffset(day, s.starts), expiresAt: atOffset(day, s.ends), addedAt: atOffset(day, [s.added, "09:00"]),
    currency: "KWD", verified: s.verified, source: s.verified ? "demo" : "community", terms: s.terms ?? T, tags: s.tags, editorsPick: s.pick,
  }));
}

/** Deterministic pre-mount rule: an offer is "clearly expired" if it ended before today. */
export const OFFER_SPEC_ENDS_BEFORE_TODAY = new Set(SPECS.filter((s) => s.ends[0] < 0).map((s) => s.id));
export const OFFER_SPEC_STARTS_AFTER_TODAY = new Set(SPECS.filter((s) => s.starts[0] > 0).map((s) => s.id));

/**
 * Status used before the browser clock is known (static HTML + first render must match).
 * Demo offers use their relative day rule; real offers are judged at build time.
 */
export function preMountStatus(o: Offer): "active" | "upcoming" | "expired" {
  if (o.source !== "partner" && SPECS.some((s) => s.id === o.id)) {
    if (OFFER_SPEC_ENDS_BEFORE_TODAY.has(o.id)) return "expired";
    if (OFFER_SPEC_STARTS_AFTER_TODAY.has(o.id)) return "upcoming";
    return "active";
  }
  const t = GENERATED_AT.getTime();
  if (+new Date(o.expiresAt) <= t) return "expired";
  if (+new Date(o.startsAt) > t) return "upcoming";
  return "active";
}
