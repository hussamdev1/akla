import { activeRegion } from "./region";
import type { DayHours, MealTime, WeeklyHours } from "./types";

/**
 * Local time in the selected city's time zone (defaults to the active region, see src/lib/region.ts).
 * Uses Intl so DST zones work; results are memoised per (instant, zone) because lists call this per place.
 */
const fmts = new Map<string, Intl.DateTimeFormat>();
const fmt = (tz: string) => {
  let f = fmts.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", weekday: "short", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    fmts.set(tz, f);
  }
  return f;
};
const WD: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
type Parts = { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; minutes: number; y: number; m: number; d: number; s: number };
let memo: { t: number; tz: string; p: Parts } | null = null;

export function localParts(now: Date, tz = activeRegion().timeZone): Parts {
  const t = now.getTime();
  if (memo && memo.t === t && memo.tz === tz) return memo.p;
  const o: Record<string, string> = {};
  for (const x of fmt(tz).formatToParts(now)) o[x.type] = x.value;
  const p: Parts = { day: WD[o.weekday] ?? 0, minutes: (+o.hour % 24) * 60 + +o.minute, y: +o.year, m: +o.month - 1, d: +o.day, s: +o.second };
  memo = { t, tz, p };
  return p;
}

/** Offset of `tz` from UTC at instant `t`, in ms. */
export function tzOffset(t: number, tz = activeRegion().timeZone) {
  const p = localParts(new Date(t), tz);
  return Date.UTC(p.y, p.m, p.d, Math.floor(p.minutes / 60), p.minutes % 60, p.s) - Math.floor(t / 1000) * 1000;
}

/** Epoch ms of local midnight for the day containing `now`. */
export function localDayStart(now: Date, tz = activeRegion().timeZone) {
  const p = localParts(now, tz);
  const guess = Date.UTC(p.y, p.m, p.d);
  return guess - tzOffset(guess - tzOffset(guess, tz), tz);
}

/** YYYY-MM-DD in local time — used for daily challenges & streaks. */
export function localDateKey(now: Date, tz = activeRegion().timeZone) {
  const p = localParts(now, tz);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

const toMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

const hoursFor = (w: WeeklyHours, day: number): DayHours => w.overrides?.[day as 0] ?? w.default;

export type OpenState =
  | { status: "unknown" }
  | { status: "open"; closesAt: string; closingSoon: boolean }
  | { status: "closed"; opensAt?: string };

export function openState(hours: WeeklyHours | undefined, now: Date, tz?: string): OpenState {
  if (!hours) return { status: "unknown" };
  if (hours.allDay) return { status: "open", closesAt: "24/7", closingSoon: false };
  const { day, minutes } = localParts(now, tz);
  const today = hoursFor(hours, day);
  const yesterday = hoursFor(hours, (day + 6) % 7);

  // Spill-over from yesterday (e.g. open 11:00 → 02:00)
  if (yesterday !== "closed") {
    const o = toMin(yesterday.open), c = toMin(yesterday.close);
    if (c < o && minutes < c) return { status: "open", closesAt: yesterday.close, closingSoon: c - minutes <= 45 };
  }
  if (today === "closed") return { status: "closed" };
  const o = toMin(today.open), c = toMin(today.close);
  const overnight = c < o;
  if (minutes >= o && (overnight || minutes < c)) {
    const left = overnight ? 1440 - minutes + c : c - minutes;
    return { status: "open", closesAt: today.close, closingSoon: left <= 45 };
  }
  if (minutes < o) return { status: "closed", opensAt: today.open };
  const tomorrow = hoursFor(hours, (day + 1) % 7);
  return { status: "closed", opensAt: tomorrow === "closed" ? undefined : tomorrow.open };
}

export function mealTimeAt(now: Date, tz?: string): MealTime {
  const h = localParts(now, tz).minutes / 60;
  if (h >= 5 && h < 10) return "breakfast";
  if (h >= 10 && h < 12) return "morning";
  if (h >= 12 && h < 15.5) return "lunch";
  if (h >= 15.5 && h < 18) return "afternoon";
  if (h >= 18 && h < 22.5) return "dinner";
  return "late";
}

export function countdownParts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Deterministic PRNG for "daily" content (same for everyone on the same day). */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
