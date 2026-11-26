"use client";
import { useCallback, useMemo } from "react";
import { MESSAGES } from "./messages";
import { useStore } from "./store";
import type { L } from "./types";

export function formatPrice(n: number, locale: "ar" | "en") {
  const v = n.toFixed(3);
  return locale === "ar" ? `${v} د.ك` : `KWD ${v}`;
}

export function formatKm(km: number, locale: "ar" | "en") {
  const v = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  return locale === "ar" ? `${v} كم` : `${v} km`;
}

export function formatClock(hm: string, locale: "ar" | "en") {
  const [h, m] = hm.split(":").map(Number);
  const pm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = locale === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM";
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDate(iso: string, locale: "ar" | "en", withTime = false) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-KW-u-nu-latn" : "en-GB", {
    timeZone: "Asia/Kuwait",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function useI18n() {
  const locale = useStore((s) => s.locale);
  const t = MESSAGES[locale];
  const l = useCallback((x: L) => x[locale], [locale]);
  return useMemo(
    () => ({
      locale,
      t,
      l,
      dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
      price: (n: number) => formatPrice(n, locale),
      km: (n: number) => formatKm(n, locale),
      clock: (hm: string) => formatClock(hm, locale),
      date: (iso: string, withTime = false) => formatDate(iso, locale, withTime),
    }),
    [locale, t, l],
  );
}
