import type { DayHours, MealTime, WeeklyHours } from "./types";

/** Kuwait is UTC+3 all year (no DST). */
const KW_OFFSET = 3 * 3600e3;

export function kuwaitParts(now: Date) {
  const k = new Date(now.getTime() + KW_OFFSET);
  return { day: k.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6, minutes: k.getUTCHours() * 60 + k.getUTCMinutes(), y: k.getUTCFullYear(), m: k.getUTCMonth(), d: k.getUTCDate() };
}

/** Epoch ms of 00:00 Kuwait time for the day containing `now`. */
export function kuwaitDayStart(now: Date) {
  const p = kuwaitParts(now);
  return Date.UTC(p.y, p.m, p.d) - KW_OFFSET;
}

/** YYYY-MM-DD in Kuwait — used for daily challenges & streaks. */
export function kuwaitDateKey(now: Date) {
  const p = kuwaitParts(now);
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

export function openState(hours: WeeklyHours | undefined, now: Date): OpenState {
  if (!hours) return { status: "unknown" };
  if (hours.allDay) return { status: "open", closesAt: "24/7", closingSoon: false };
  const { day, minutes } = kuwaitParts(now);
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

export function mealTimeAt(now: Date): MealTime {
  const h = kuwaitParts(now).minutes / 60;
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
