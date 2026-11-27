#!/usr/bin/env node
/**
 * One-off generator for src/data/generated/countries.json (committed; not part of the build).
 * Reads the IANA tz database's zone.tab (country → time zones with city coordinates) and adds each country's
 * currency. Re-run when tzdata changes:  node scripts/gen-countries.mjs [/path/to/zone.tab]
 *
 * Output per ISO 3166-1 alpha-2 code:  { c: currency, z: [[timeZone, lat, lng, cityEn, cityAr?], …] }
 * The first zone is the country's default city (most populous / capital where zone.tab's order differs).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ZONE_TAB = process.argv[2] || "/usr/share/zoneinfo/zone.tab";
const OUT = path.join(ROOT, "src", "data", "generated", "countries.json");

// ISO 4217 currency in everyday use (Bulgaria and Croatia use EUR; Panama, Zimbabwe, Timor-Leste quote USD).
const CURRENCY = Object.fromEntries(
  `AD EUR AE AED AF AFN AG XCD AI XCD AL ALL AM AMD AO AOA AR ARS AS USD AT EUR AU AUD AW AWG AX EUR AZ AZN BA BAM BB BBD
  BD BDT BE EUR BF XOF BG EUR BH BHD BI BIF BJ XOF BL EUR BM BMD BN BND BO BOB BQ USD BR BRL BS BSD BT BTN BW BWP BY BYN
  BZ BZD CA CAD CC AUD CD CDF CF XAF CG XAF CH CHF CI XOF CK NZD CL CLP CM XAF CN CNY CO COP CR CRC CU CUP CV CVE CW ANG
  CX AUD CY EUR CZ CZK DE EUR DJ DJF DK DKK DM XCD DO DOP DZ DZD EC USD EE EUR EG EGP EH MAD ER ERN ES EUR ET ETB FI EUR
  FJ FJD FK FKP FM USD FO DKK FR EUR GA XAF GB GBP GD XCD GE GEL GF EUR GG GBP GH GHS GI GIP GL DKK GM GMD GN GNF GP EUR
  GQ XAF GR EUR GS GBP GT GTQ GU USD GW XOF GY GYD HK HKD HN HNL HR EUR HT HTG HU HUF ID IDR IE EUR IL ILS IM GBP IN INR
  IO USD IQ IQD IR IRR IS ISK IT EUR JE GBP JM JMD JO JOD JP JPY KE KES KG KGS KH KHR KI AUD KM KMF KN XCD KP KPW KR KRW
  KW KWD KY KYD KZ KZT LA LAK LB LBP LC XCD LI CHF LK LKR LR LRD LS LSL LT EUR LU EUR LV EUR LY LYD MA MAD MC EUR MD MDL
  ME EUR MF EUR MG MGA MH USD MK MKD ML XOF MM MMK MN MNT MO MOP MP USD MQ EUR MR MRU MS XCD MT EUR MU MUR MV MVR MW MWK
  MX MXN MY MYR MZ MZN NA NAD NC XPF NE XOF NF AUD NG NGN NI NIO NL EUR NO NOK NP NPR NR AUD NU NZD NZ NZD OM OMR PA USD
  PE PEN PF XPF PG PGK PH PHP PK PKR PL PLN PM EUR PN NZD PR USD PS ILS PT EUR PW USD PY PYG QA QAR RE EUR RO RON RS RSD
  RU RUB RW RWF SA SAR SB SBD SC SCR SD SDG SE SEK SG SGD SH SHP SI EUR SJ NOK SK EUR SL SLE SM EUR SN XOF SO SOS SR SRD
  SS SSP ST STN SV USD SX ANG SY SYP SZ SZL TC USD TD XAF TF EUR TG XOF TH THB TJ TJS TK NZD TL USD TM TMT TN TND TO TOP
  TR TRY TT TTD TV AUD TW TWD TZ TZS UA UAH UG UGX US USD UY UYU UZ UZS VA EUR VC XCD VE VES VG USD VI USD VN VND VU VUV
  WF XPF WS WST YE YER YT EUR ZA ZAR ZM ZMW ZW USD`
    .trim()
    .split(/\s+/)
    .reduce((acc, v, i, a) => (i % 2 ? acc : [...acc, [v, a[i + 1]]]), []),
);

// Not places people eat out in (or uninhabited).
const SKIP = new Set(["AQ", "BV", "HM", "UM"]);

// Default city where zone.tab's first zone isn't the obvious one.
const DEFAULT_ZONE = {
  AR: "America/Argentina/Buenos_Aires", AU: "Australia/Sydney", BR: "America/Sao_Paulo", CA: "America/Toronto",
  CD: "Africa/Kinshasa", CL: "America/Santiago", CN: "Asia/Shanghai", CY: "Asia/Nicosia", DE: "Europe/Berlin",
  EC: "America/Guayaquil", ES: "Europe/Madrid", FM: "Pacific/Pohnpei", GL: "America/Nuuk", ID: "Asia/Jakarta",
  KI: "Pacific/Tarawa", KZ: "Asia/Almaty", MH: "Pacific/Majuro", MN: "Asia/Ulaanbaatar", MX: "America/Mexico_City",
  MY: "Asia/Kuala_Lumpur", NZ: "Pacific/Auckland", PF: "Pacific/Tahiti", PG: "Pacific/Port_Moresby", PS: "Asia/Hebron",
  PT: "Europe/Lisbon", RU: "Europe/Moscow", UA: "Europe/Kyiv", US: "America/New_York", UZ: "Asia/Tashkent",
};

// zone.tab names some zones after the country; use the city instead.
const CITY_EN = { "Asia/Kuwait": "Kuwait City", "Asia/Qatar": "Doha", "Asia/Bahrain": "Manama", "Indian/Comoro": "Moroni", "Africa/El_Aaiun": "Laayoune" };
// Arabic names for cities in Arabic-speaking countries (Arabic UI shows the English name elsewhere).
const CITY_AR = {
  "Asia/Kuwait": "مدينة الكويت", "Asia/Riyadh": "الرياض", "Asia/Dubai": "دبي", "Asia/Qatar": "الدوحة", "Asia/Bahrain": "المنامة",
  "Asia/Muscat": "مسقط", "Africa/Cairo": "القاهرة", "Asia/Amman": "عمّان", "Asia/Beirut": "بيروت", "Asia/Damascus": "دمشق",
  "Asia/Baghdad": "بغداد", "Asia/Aden": "عدن", "Asia/Hebron": "الخليل", "Asia/Gaza": "غزة", "Africa/Casablanca": "الدار البيضاء",
  "Africa/Algiers": "الجزائر", "Africa/Tunis": "تونس", "Africa/Tripoli": "طرابلس", "Africa/Khartoum": "الخرطوم",
  "Africa/Nouakchott": "نواكشوط", "Africa/Mogadishu": "مقديشو", "Africa/Djibouti": "جيبوتي", "Indian/Comoro": "موروني",
  "Africa/El_Aaiun": "العيون",
};

const coord = (s) => {
  // ±DDMM[SS]±DDDMM[SS]
  const m = s.match(/^([+-])(\d{2})(\d{2})(\d{2})?([+-])(\d{3})(\d{2})(\d{2})?$/);
  if (!m) throw new Error(`bad coordinate ${s}`);
  const dms = (sign, d, mi, se = "0") => (sign === "-" ? -1 : 1) * (+d + +mi / 60 + +se / 3600);
  return [Math.round(dms(m[1], m[2], m[3], m[4]) * 1e3) / 1e3, Math.round(dms(m[5], m[6], m[7], m[8]) * 1e3) / 1e3];
};

const out = {};
for (const line of fs.readFileSync(ZONE_TAB, "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const [cc, co, tz] = line.split("\t");
  if (SKIP.has(cc)) continue;
  const [lat, lng] = coord(co);
  const city = CITY_EN[tz] ?? tz.split("/").pop().replace(/_/g, " ");
  const entry = [tz, lat, lng, city];
  if (CITY_AR[tz]) entry.push(CITY_AR[tz]);
  (out[cc] ??= { c: CURRENCY[cc] ?? "USD", z: [] }).z.push(entry);
}
for (const [cc, def] of Object.entries(DEFAULT_ZONE)) {
  const z = out[cc]?.z;
  const i = z?.findIndex((e) => e[0] === def) ?? -1;
  if (i > 0) z.unshift(...z.splice(i, 1));
}
const missing = Object.keys(out).filter((cc) => !CURRENCY[cc]);
if (missing.length) console.warn("[countries] no currency for", missing.join(" "), "→ USD");
const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
fs.writeFileSync(OUT, JSON.stringify(sorted));
console.log(`[countries] ${Object.keys(sorted).length} countries → ${path.relative(ROOT, OUT)} (${fs.statSync(OUT).size} B)`);
