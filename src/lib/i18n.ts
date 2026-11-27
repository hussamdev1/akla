"use client";
import { useCallback, useMemo } from "react";
import { MESSAGES } from "./messages";
import { useStore } from "./store";
import { activeRegion, scaleBudget } from "./region";
import type { L } from "./types";

/** Arabic symbols for the featured (Gulf) currencies; other currencies show their ISO code in Arabic. */
const AR_SYMBOL: Record<string, string> = { KWD: "د.ك", SAR: "ر.س", AED: "د.إ", QAR: "ر.ق", BHD: "د.ب", OMR: "ر.ع", EGP: "ج.م", JOD: "د.أ" };
const nf = new Map<string, Intl.NumberFormat>();
const numberFormat = (key: string, make: () => Intl.NumberFormat) => nf.get(key) ?? (nf.set(key, make()), nf.get(key)!);

/** Price in the item's currency (defaults to the selected country's). KWD keeps 3 decimals: "KWD 2.750" / "2.750 د.ك". */
export function formatPrice(n: number, locale: "ar" | "en", currency = activeRegion().currency) {
  const en = numberFormat(`en:${currency}`, () => new Intl.NumberFormat("en", { style: "currency", currency }));
  if (locale === "en") return en.format(n).replace(/^([A-Z]{3})\s?/, "$1 ");
  const digits = en.resolvedOptions().maximumFractionDigits;
  const v = numberFormat(`ar:${currency}`, () => new Intl.NumberFormat("en", { minimumFractionDigits: digits, maximumFractionDigits: digits })).format(n);
  return `${v} ${AR_SYMBOL[currency] ?? currency}`;
}

/** Currency label for headings like "Budget (KWD)". */
export const currencyLabel = (locale: "ar" | "en", currency = activeRegion().currency) => (locale === "ar" ? AR_SYMBOL[currency] ?? currency : currency);

export function formatKm(km: number, locale: "ar" | "en") {
  const v = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return locale === "ar" ? `${v} كم` : `${v} km`;
}

export function formatClock(hm: string, locale: "ar" | "en") {
  if (hm === "24/7") return locale === "ar" ? "٢٤ ساعة" : "24 hours";
  const [h0, m] = hm.split(":").map(Number);
  const h = h0 % 24;
  const pm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = locale === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM";
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDate(iso: string, locale: "ar" | "en", withTime = false, timeZone = activeRegion().timeZone) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function useI18n() {
  const locale = useStore((s) => s.locale);
  // Re-render translated/formatted UI when the country (currency, time zone) changes.
  const region = useStore((s) => s.region);
  const t = MESSAGES[locale];
  const l = useCallback((x: L) => x[locale], [locale]);
  return useMemo(
    () => ({
      locale,
      t,
      l,
      dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
      region,
      price: (n: number, currency?: string) => formatPrice(n, locale, currency ?? region.currency),
      cur: currencyLabel(locale, region.currency),
      /** a built-in KWD budget preset in the selected currency */
      amt: (kwd: number) => scaleBudget(kwd, region.currency),
      km: (n: number) => formatKm(n, locale),
      clock: (hm: string) => formatClock(hm, locale),
      date: (iso: string, withTime = false) => formatDate(iso, locale, withTime, region.timeZone),
    }),
    [locale, t, l, region],
  );
}
