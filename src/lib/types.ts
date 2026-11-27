export type Locale = "ar" | "en";
export type L = { ar: string; en: string };

export type CategoryId =
  | "burgers" | "pizza" | "fried-chicken" | "grilled" | "bbq" | "sandwiches" | "shawarma"
  | "arabic" | "indian" | "italian" | "asian" | "japanese" | "sushi" | "seafood" | "mexican"
  | "healthy" | "salads" | "pasta" | "desserts" | "ice-cream" | "coffee" | "breakfast" | "beverages";

export type Mood =
  | "starving" | "delicious" | "cheap" | "healthy" | "spicy" | "comfort" | "sweet" | "surprise" | "new";

export type MealTime = "breakfast" | "morning" | "lunch" | "afternoon" | "dinner" | "late";

export type MealSize = "snack" | "regular" | "large" | "family";

/** A curated area / city of a featured country (src/data/geo.ts). */
export type Area = {
  id: string;
  name: L;
  /** ISO 3166-1 alpha-2 */
  country: string;
  /** optional grouping, e.g. a Kuwait governorate */
  region?: string;
  lat: number;
  lng: number;
};

export type Category = {
  id: CategoryId;
  name: L;
  emoji: string;
  color: string; // background tint
  ink: string; // accent
  image?: string;
};

/** Opening hours in the place's local time, "HH:MM". close < open means it closes after midnight. */
export type DayHours = { open: string; close: string } | "closed";
export type WeeklyHours = {
  default: DayHours;
  /** open around the clock (OSM "24/7") */
  allDay?: boolean;
  /** 0 = Sunday … 6 = Saturday */
  overrides?: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DayHours>>;
};

/** demo = fictional sample · partner = from the Akla Google Sheet · osm = OpenStreetMap */
export type DataSource = "demo" | "osm" | "partner";

export type Restaurant = {
  id: string;
  name: L;
  tagline: L;
  description: L;
  categories: CategoryId[];
  /** ISO 3166-1 alpha-2; listings only show in their own country */
  country: string;
  /** ISO 4217 currency of its menu and offers */
  currency: string;
  /** IANA time zone its opening hours and offer dates are in */
  timeZone: string;
  /** curated area (featured countries), undefined elsewhere */
  areaId?: string;
  /** city name when there's no curated area */
  city?: string;
  lat: number;
  lng: number;
  priceLevel: 1 | 2 | 3 | 4;
  rating?: number; // undefined = unknown
  ratingCount?: number;
  /** where a real rating came from, e.g. "Google Maps · Nov 2026" — required to show a partner rating */
  ratingSource?: string;
  website?: string;
  instagram?: string;
  osmId?: string;
  phone?: string;
  hours?: WeeklyHours; // undefined = unknown
  delivery: boolean;
  dineIn: boolean;
  cover: string;
  emoji: string;
  brand: string; // brand colour
  featured?: boolean;
  isNew?: boolean;
  orderUrl?: string;
  source: DataSource;
  updatedAt: string; // ISO date
};

export type Meal = {
  id: string;
  restaurantId: string;
  name: L;
  description: L;
  category: CategoryId;
  price: number; // in `currency`
  currency: string;
  image?: string;
  emoji: string;
  spicy: 0 | 1 | 2 | 3;
  vegetarian: boolean;
  size: MealSize;
  moods: Mood[];
  times: MealTime[];
  editorsPick?: boolean;
};

export type OfferType = "percent" | "bogo" | "combo" | "family" | "free-delivery" | "fixed";
export type OfferTag = "lunch" | "dinner" | "exclusive" | "limited" | "weekend";

export type Offer = {
  id: string;
  restaurantId: string;
  mealId?: string;
  title: L;
  description: L;
  type: OfferType;
  originalPrice?: number;
  finalPrice?: number;
  currency?: string;
  percent?: number;
  /** ISO timestamps (computed for demo data) */
  startsAt: string;
  expiresAt: string;
  addedAt: string;
  verified: boolean;
  source: "demo" | "community" | "partner";
  sourceUrl?: string;
  terms: L;
  tags: OfferTag[];
  editorsPick?: boolean;
  image?: string;
};

export type FavKind = "restaurants" | "meals" | "offers" | "categories";

export type Collection = {
  id: string;
  name: string;
  emoji: string;
  items: { kind: FavKind; id: string }[];
  createdAt: string;
};

export type UserLocation =
  | { kind: "area"; areaId: string }
  /** a city found by search, or a country's default city */
  | { kind: "city"; country: string; name: L; lat: number; lng: number }
  | { kind: "gps"; lat: number; lng: number };
