import { MEALS } from "./meals";
import { RESTAURANTS } from "./restaurants";
import { DATA_META } from "./source";

/** What real (or, with AKLA_SHOW_DEMO, demo) content this build has, in any country. Per-country: useLive() in lib/hooks. */
export const HAS_LISTINGS = RESTAURANTS.length > 0;
export const HAS_MEALS = MEALS.length > 0;
/** Places in a featured country's OpenStreetMap snapshot (undefined for live-only countries). */
export const osmCountFor = (country: string): number | undefined =>
  DATA_META.osm?.countries?.[country]?.count ?? (country === "KW" && !DATA_META.osm?.countries ? DATA_META.osm?.count : undefined);
