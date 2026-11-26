export type Locale = "ar" | "en";
export type L = { ar: string; en: string };

export type GovernorateId = "capital" | "hawalli" | "farwaniya" | "mubarak" | "ahmadi" | "jahra";

export type CategoryId =
  | "burgers" | "pizza" | "fried-chicken" | "grilled" | "bbq" | "sandwiches" | "shawarma"
  | "arabic" | "indian" | "italian" | "asian" | "japanese" | "sushi" | "seafood" | "mexican"
  | "healthy" | "salads" | "pasta" | "desserts" | "ice-cream" | "coffee" | "breakfast" | "beverages";

export type Mood =
  | "starving" | "delicious" | "cheap" | "healthy" | "spicy" | "comfort" | "sweet" | "surprise" | "new";

export type MealTime = "breakfast" | "morning" | "lunch" | "afternoon" | "dinner" | "late";

export type MealSize = "snack" | "regular" | "large" | "family";

export type Area = {
  id: string;
  name: L;
  governorate: GovernorateId;
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

/** Opening hours in Kuwait local time, "HH:MM". close < open means it closes after midnight. */
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
  areaId: string;
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
  price: number; // KWD
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
  | { kind: "gps"; lat: number; lng: number };
