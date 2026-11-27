import countries from "@/data/generated/countries.json";
import { FEATURED_COUNTRIES } from "@/data/geo";
import type { L, Locale } from "./types";

/**
 * Country model. Data comes from the IANA tz database (scripts/gen-countries.mjs): per ISO 3166-1 alpha-2 code the
 * currency and the time zones with a representative city. Country names come from the browser (Intl.DisplayNames).
 */
type Zone = [tz: string, lat: number, lng: number, cityEn: string, cityAr?: string];
const DATA = countries as unknown as Record<string, { c: string; z: Zone[] }>;

export const DEFAULT_COUNTRY = "KW";
export const COUNTRY_CODES = Object.keys(DATA);
export const isCountry = (cc: string | undefined): cc is string => !!cc && cc in DATA;
export const isFeatured = (cc: string) => (FEATURED_COUNTRIES as readonly string[]).includes(cc);

/** Arab League members: Arabic is the natural default language there. */
const ARABIC = new Set("AE BH DJ DZ EG EH IQ JO KM KW LB LY MA MR OM PS QA SA SD SO SY TN YE".split(" "));
export const speaksArabic = (cc: string) => ARABIC.has(cc);

export const currencyOf = (cc: string) => DATA[cc]?.c ?? "USD";
export const zonesOf = (cc: string) => DATA[cc]?.z ?? DATA[DEFAULT_COUNTRY].z;

/** Default city of a country (capital / largest city), used when the user hasn't picked an area. */
export function defaultCity(cc: string): { name: L; lat: number; lng: number } {
  const [, lat, lng, en, ar] = zonesOf(cc)[0];
  return { name: { en, ar: ar ?? en }, lat, lng };
}

/** Time zone for a point in a country: the zone whose reference city is closest (exact for single-zone countries). */
export function timeZoneAt(cc: string, p?: { lat: number; lng: number }) {
  const z = zonesOf(cc);
  if (z.length === 1 || !p) return z[0][0];
  return z.reduce((best, x) => ((x[1] - p.lat) ** 2 + (x[2] - p.lng) ** 2 < (best[1] - p.lat) ** 2 + (best[2] - p.lng) ** 2 ? x : best))[0];
}

/** Guess the visitor's country from the device time zone (no network, no permission). */
export function countryFromDeviceTz(): string | undefined {
  let tz: string | undefined;
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
  if (!tz) return undefined;
  for (const cc of COUNTRY_CODES) if (DATA[cc].z.some((z) => z[0] === tz)) return cc;
  return undefined;
}

const names = new Map<Locale, Intl.DisplayNames | null>();
export function countryName(cc: string, locale: Locale) {
  if (!names.has(locale)) {
    try {
      names.set(locale, new Intl.DisplayNames([locale], { type: "region" }));
    } catch {
      names.set(locale, null);
    }
  }
  return names.get(locale)?.of(cc) ?? cc;
}

export const flag = (cc: string) => String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));

/* ------------------------------------------------------------------ */
/* Active region — the selected country's time zone and currency.     */
/* Kept in sync by the store (src/lib/store.ts) so pure helpers in     */
/* time.ts / i18n.ts can default to it without importing the store.   */
/* ------------------------------------------------------------------ */

export type ActiveRegion = { country: string; timeZone: string; currency: string };
let active: ActiveRegion = { country: DEFAULT_COUNTRY, timeZone: "Asia/Kuwait", currency: "KWD" };
export const activeRegion = () => active;
export function setActiveRegion(country: string, point?: { lat: number; lng: number }) {
  const cc = isCountry(country) ? country : DEFAULT_COUNTRY;
  active = { country: cc, timeZone: timeZoneAt(cc, point), currency: currencyOf(cc) };
}

/**
 * Built-in budget presets ("under 2", the 0–20 price slider) are defined in KWD. This turns them into friendly local
 * amounts with a rough, fixed scale per currency — never shown as an exchange rate. Unknown currencies use 1:1
 * (those countries have no listed menus yet, so no prices to filter).
 */
const PER_KWD: Record<string, number> = {
  KWD: 1, SAR: 12, AED: 12, QAR: 12, BHD: 1.2, OMR: 1.25, USD: 3.25, EUR: 3, GBP: 2.5, EGP: 160, JOD: 2.3, TRY: 110, INR: 280, JPY: 500,
};
export function scaleBudget(kwd: number, currency = active.currency) {
  const rate = PER_KWD[currency] ?? 1;
  if (rate === 1 || kwd <= 0) return kwd;
  const v = kwd * rate;
  const e = 10 ** Math.floor(Math.log10(v));
  const m = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 10].reduce((best, x) => (Math.abs(x - v / e) < Math.abs(best - v / e) ? x : best));
  return Math.round(m * e * 100) / 100;
}
