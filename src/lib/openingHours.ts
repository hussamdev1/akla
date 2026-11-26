import type { DayHours, WeeklyHours } from "./types";

/**
 * Conservative parser for the OpenStreetMap `opening_hours` syntax (also used for the Google Sheet `hours` column).
 * Supports the common forms:  "24/7" · "Mo-Su 10:00-23:00" · "Sa-Th 08:00-00:00; Fr 13:00-00:00" · "Fr off".
 * Anything ambiguous (split shifts, AM/PM, holidays, a single one-day rule, repeated days…) returns `undefined`,
 * which the UI shows as "hours not available" — we never guess whether a place is open.
 */
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const dayIdx = (d: string) => DAYS.indexOf(d as (typeof DAYS)[number]);

function expandDays(spec: string): number[] | null {
  const out: number[] = [];
  for (const part of spec.split(",")) {
    const m = part.trim().match(/^([A-Z][a-z])(?:-([A-Z][a-z]))?$/);
    if (!m) return null;
    const a = dayIdx(m[1]);
    const b = m[2] ? dayIdx(m[2]) : a;
    if (a < 0 || b < 0) return null;
    for (let i = a; ; i = (i + 1) % 7) {
      out.push(i);
      if (i === b) break;
    }
  }
  return out;
}

const pad = (t: string) => {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m || +m[1] > 24 || +m[2] > 59) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
};

export function parseOpeningHours(raw?: string): WeeklyHours | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (s === "24/7") return { default: { open: "00:00", close: "24:00" }, allDay: true };
  const week: (DayHours | undefined)[] = Array(7).fill(undefined);
  const rules = s.split(";").map((r) => r.trim()).filter(Boolean);
  if (!rules.length) return undefined;
  for (const rule of rules) {
    const m = rule.match(/^([A-Za-z,\- ]+?)\s+(off|closed|\d{1,2}:\d{2}-\d{1,2}:\d{2})$/i);
    if (!m) return undefined;
    const days = expandDays(m[1].replace(/\s+/g, ""));
    if (!days) return undefined;
    let h: DayHours;
    if (/^(off|closed)$/i.test(m[2])) h = "closed";
    else {
      const [o, c] = m[2].split("-").map(pad);
      if (!o || !c) return undefined;
      h = { open: o, close: c === "00:00" ? "24:00" : c };
    }
    for (const d of days) {
      if (week[d] !== undefined) return undefined; // repeated day → ambiguous
      week[d] = h;
    }
  }
  const covered = week.filter((d) => d !== undefined).length;
  // A lone rule covering fewer than 7 days (e.g. "Su-Su 09:00-22:00") is usually a mapping mistake → unknown.
  if (rules.length === 1 && covered < 7) return undefined;
  const filled = week.map((d) => d ?? "closed");
  return { default: filled[0], overrides: Object.fromEntries(filled.map((d, i) => [i, d])) as WeeklyHours["overrides"] };
}
