import { MEALS } from "./meals";
import { RESTAURANTS } from "./restaurants";
import { DATA_META } from "./source";

/** What real (or, with AKLA_SHOW_DEMO, demo) content this build has. Pages hide sections that would be empty. */
export const HAS_LISTINGS = RESTAURANTS.length > 0;
export const HAS_MEALS = MEALS.length > 0;
/** Number of real places in the OpenStreetMap snapshot. */
export const OSM_COUNT = DATA_META.osm?.count ?? 0;
