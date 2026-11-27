"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bike, Heart, MapPin, Navigation, RotateCcw, ShoppingBag, SlidersHorizontal, Store, Volume2, VolumeX } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { mealsByRestaurant } from "@/data/meals";
import { restaurantById } from "@/data/restaurants";
import { areaOf } from "@/data/geo";
import { useI18n } from "@/lib/i18n";
import { usePlaces, type Place } from "@/lib/places";
import { haversineKm, locationPoint } from "@/lib/geo";
import { useDistances, useLive, useMeals, useOffers, useRestaurants } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { celebrate } from "@/lib/fx";
import { directionsUrl } from "@/lib/geo";
import type { Category, CategoryId, Meal, MealSize, Offer, Restaurant } from "@/lib/types";
import { Wheel, type WheelHandle, type WheelItem } from "@/components/Wheel";
import { Container, cx, DemoBadge, Loader, DistanceTag, EmptyState, FavButton, FoodImage, OpenBadge, RatingBadge, Sheet, Toggle, TrustBadge } from "@/components/ui";
import { MealCard } from "@/components/cards";

type Mode = "category" | "restaurant" | "meal" | "offer" | "cheapest" | "rated" | "near" | "anything";
const MODES: { id: Mode; e: string }[] = [
  { id: "anything", e: "🎁" }, { id: "meal", e: "🍽️" }, { id: "category", e: "🗂️" }, { id: "restaurant", e: "🏪" },
  { id: "offer", e: "🏷️" }, { id: "cheapest", e: "🪙" }, { id: "rated", e: "⭐" }, { id: "near", e: "📍" },
];
const SIZES: (MealSize | "any")[] = ["any", "snack", "regular", "large", "family"];

type Filters = {
  min: number; max: number; include: CategoryId[]; exclude: CategoryId[]; restaurants: string[]; maxKm: number;
  service: "both" | "delivery" | "dineIn"; onlyOffers: boolean; veg: boolean; spice: "any" | "none" | "mild" | "hot"; size: MealSize | "any";
};
const DEFAULT: Filters = { min: 0, max: 20, include: [], exclude: [], restaurants: [], maxKm: 60, service: "both", onlyOffers: false, veg: false, spice: "any", size: "any" };

type Pick =
  | { kind: "meal"; meal: Meal; offer?: Offer }
  | { kind: "restaurant"; restaurant: Restaurant }
  | { kind: "category"; category: Category }
  | { kind: "offer"; offer: Offer; meal?: Meal }
  | { kind: "place"; place: Place; km: number };

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  let x = seed + 1;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 16807) % 2147483647;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PickerView() {
  const RESTAURANTS = useRestaurants();
  const MEALS = useMeals();
  const { hasMeals: HAS_MEALS } = useLive();
  // Without menus only the real-places mode (OpenStreetMap) has anything to spin.
  const AVAILABLE_MODES = HAS_MEALS ? MODES : MODES.filter((m) => m.id === "near");
  const { t, l, amt, cur, region } = useI18n();
  const [modeState, setMode] = useState<Mode>("anything");
  const mode = AVAILABLE_MODES.some((x) => x.id === modeState) ? modeState : AVAILABLE_MODES[0].id;
  // Price filters are in the selected currency; the default max is the KWD 20 preset scaled (see scaleBudget).
  const defaults = useMemo<Filters>(() => ({ ...DEFAULT, max: amt(20) }), [amt]);
  const [f, setF] = useState<Filters>(defaults);
  const [fCur, setFCur] = useState(region.currency);
  if (fCur !== region.currency) {
    setFCur(region.currency);
    setF(defaults);
  }
  const [showFilters, setShowFilters] = useState(false);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<Pick | null>(null);
  const [spinning, setSpinning] = useState(false);
  const wheel = useRef<WheelHandle>(null);
  const dist = useDistances();
  const placesState = usePlaces(mode === "near");
  const userLoc = useStore((s) => s.location);
  const me = useMemo(() => locationPoint(userLoc), [userLoc]);
  const { active } = useOffers();
  const sound = useStore((s) => s.sound);
  const setSound = useStore((s) => s.setSound);
  const recordSpin = useStore((s) => s.recordSpin);
  const spins = useStore((s) => s.spins);

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode") as Mode | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value read after hydration (static export)
    if (m && MODES.some((x) => x.id === m)) setMode(m);
  }, []);

  const offerByMeal = useMemo(() => Object.fromEntries(active.filter((o) => o.mealId).map((o) => [o.mealId!, o])), [active]);

  const mealOk = (m: Meal) => {
    const r = restaurantById(m.restaurantId)!;
    const price = offerByMeal[m.id]?.finalPrice ?? m.price;
    if (price < f.min || price > f.max) return false;
    if (f.include.length && !f.include.includes(m.category) && !r.categories.some((c) => f.include.includes(c))) return false;
    if (f.exclude.includes(m.category)) return false;
    if (f.restaurants.length && !f.restaurants.includes(r.id)) return false;
    if (f.maxKm < 60 && dist[r.id] > f.maxKm) return false;
    if (f.service === "delivery" && !r.delivery) return false;
    if (f.service === "dineIn" && !r.dineIn) return false;
    if (f.onlyOffers && !offerByMeal[m.id]) return false;
    if (f.veg && !m.vegetarian) return false;
    if (f.spice === "none" && m.spicy > 0) return false;
    if (f.spice === "mild" && (m.spicy < 1 || m.spicy > 2)) return false;
    if (f.spice === "hot" && m.spicy < 2) return false;
    if (f.size !== "any" && m.size !== f.size) return false;
    return true;
  };

  const { items, picks } = useMemo(() => {
    const meals = MEALS.filter(mealOk);
    let picks: Pick[] = [];
    switch (mode) {
      case "category": {
        const cats = new Set(meals.map((m) => m.category));
        picks = CATEGORIES.filter((c) => cats.has(c.id)).map((c) => ({ kind: "category", category: c }));
        break;
      }
      case "restaurant": {
        const rs = new Set(meals.map((m) => m.restaurantId));
        picks = RESTAURANTS.filter((r) => rs.has(r.id)).map((r) => ({ kind: "restaurant", restaurant: r }));
        break;
      }
      case "near": {
        // Real places from OpenStreetMap: category include/exclude + distance apply; budget/menu filters can't (no prices in OSM).
        const nearest = placesState.places
          .filter((p) => !f.include.length || p.categories.some((c) => f.include.includes(c)))
          .filter((p) => !p.categories.some((c) => f.exclude.includes(c)))
          .map((p) => ({ p, km: haversineKm(me, p) }))
          .filter(({ km }) => f.maxKm >= 60 || km <= f.maxKm)
          .sort((a, b) => a.km - b.km)
          .slice(0, 30);
        picks = nearest.map(({ p, km }) => ({ kind: "place", place: p, km }));
        break;
      }
      case "offer": {
        const ok = new Set(meals.map((m) => m.id));
        picks = active
          .filter((o) => !o.mealId || ok.has(o.mealId))
          .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
          .slice(0, 8)
          .map((o) => ({ kind: "offer", offer: o, meal: MEALS.find((m) => m.id === o.mealId) }));
        break;
      }
      case "cheapest":
        picks = [...meals].sort((a, b) => (offerByMeal[a.id]?.finalPrice ?? a.price) - (offerByMeal[b.id]?.finalPrice ?? b.price)).slice(0, 8).map((m) => ({ kind: "meal", meal: m, offer: offerByMeal[m.id] }));
        break;
      case "rated":
        picks = meals
          .filter((m) => restaurantById(m.restaurantId)!.rating !== undefined)
          .sort((a, b) => restaurantById(b.restaurantId)!.rating! - restaurantById(a.restaurantId)!.rating! || (b.editorsPick ? 1 : 0) - (a.editorsPick ? 1 : 0))
          .slice(0, 8)
          .map((m) => ({ kind: "meal", meal: m, offer: offerByMeal[m.id] }));
        break;
      default:
        picks = meals.map((m) => ({ kind: "meal", meal: m, offer: offerByMeal[m.id] }));
    }
    const onWheel = shuffle(picks, seed).slice(0, 12);
    const items: WheelItem[] = onWheel.map((p) => {
      if (p.kind === "category") return { id: p.category.id, label: l(p.category.name), emoji: p.category.emoji };
      if (p.kind === "restaurant") return { id: p.restaurant.id, label: l(p.restaurant.name), emoji: p.restaurant.emoji };
      if (p.kind === "place") return { id: p.place.id, label: l(p.place.name), emoji: p.place.emoji };
      if (p.kind === "offer") return { id: p.offer.id, label: p.offer.percent ? `-${p.offer.percent}% ${l(restaurantById(p.offer.restaurantId)!.name)}` : l(restaurantById(p.offer.restaurantId)!.name), emoji: p.meal?.emoji ?? "🏷️" };
      return { id: p.meal.id, label: l(p.meal.name), emoji: p.meal.emoji };
    });
    return { items, picks: onWheel, total: picks.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, f, seed, dist, active, offerByMeal, l, placesState.places, me]);

  const onResult = (i: number) => {
    const p = picks[i];
    setSpinning(false);
    setResult(p);
    celebrate("big");
    const e = items[i];
    const href =
      p.kind === "place" ? `/place/?id=${p.place.id}` : p.kind === "category" ? `/discover/?c=${p.category.id}` : p.kind === "restaurant" ? `/restaurants/${p.restaurant.id}/` : p.kind === "offer" ? `/restaurants/${p.offer.restaurantId}/#offers` : `/restaurants/${p.meal.restaurantId}/`;
    recordSpin({ label: e.label, emoji: e.emoji, href });
  };

  const toggleIn = (key: "include" | "exclude" | "restaurants", id: string) =>
    setF((s) => ({ ...s, [key]: (s[key] as string[]).includes(id) ? (s[key] as string[]).filter((x) => x !== id) : [...(s[key] as string[]), id] }));

  const filterCount = (Object.keys(defaults) as (keyof Filters)[]).filter((k) => JSON.stringify(f[k]) !== JSON.stringify(defaults[k])).length;

  const filtersPanel = (
    <div className="space-y-5">
      <div className={HAS_MEALS ? undefined : "hidden"}>
        <h3 className="mb-2 font-bold">{t.picker.budget(cur)}</h3>
        <div className="flex items-center gap-2">
          <label className="flex-1 text-sm">
            {t.picker.min}
            <input type="number" min={0} step={amt(0.25)} value={f.min} onChange={(e) => setF({ ...f, min: Number(e.target.value) })} className="input mt-1" />
          </label>
          <label className="flex-1 text-sm">
            {t.picker.max}
            <input type="number" min={0} step={amt(0.25)} value={f.max} onChange={(e) => setF({ ...f, max: Number(e.target.value) })} className="input mt-1" />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[1, 2, 3, 5, 10].map(amt).map((v) => (
            <button key={v} type="button" className="chip !px-2.5 !py-1 !text-xs" aria-pressed={f.max === v && f.min === 0} onClick={() => setF({ ...f, min: 0, max: v })}>
              ≤ {v}
            </button>
          ))}
        </div>
      </div>
      <div className={HAS_MEALS ? undefined : "hidden"}>
        <h3 className="mb-2 font-bold">{t.picker.hunger}</h3>
        <input type="range" min={0} max={4} value={SIZES.indexOf(f.size)} onChange={(e) => setF({ ...f, size: SIZES[Number(e.target.value)] })} className="w-full accent-brand" />
        <div className="flex justify-between text-xs font-semibold text-ink-soft">
          {SIZES.map((s) => (
            <span key={s} className={f.size === s ? "text-brand" : ""}>
              {s === "any" ? t.common.any : t.sizes[s]}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-bold">{t.picker.include}</h3>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="chip !px-2.5 !py-1 !text-xs" aria-pressed={f.include.includes(c.id)} onClick={() => toggleIn("include", c.id)}>
              {c.emoji} {l(c.name)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-bold">🚫 {t.picker.exclude}</h3>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={cx("chip !px-2.5 !py-1 !text-xs", f.exclude.includes(c.id) && "!bg-chili !text-white line-through")} onClick={() => toggleIn("exclude", c.id)}>
              {c.emoji} {l(c.name)}
            </button>
          ))}
        </div>
      </div>
      <div className={HAS_MEALS ? undefined : "hidden"}>
        <h3 className="mb-2 font-bold">{t.picker.restaurants}</h3>
        <div className="flex flex-wrap gap-1.5">
          {RESTAURANTS.map((r) => (
            <button key={r.id} type="button" className="chip !px-2.5 !py-1 !text-xs" aria-pressed={f.restaurants.includes(r.id)} onClick={() => toggleIn("restaurants", r.id)}>
              {r.emoji} {l(r.name)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-bold">
          {t.picker.maxDistance}: <span className="text-brand">{f.maxKm >= 60 ? t.common.any : `${f.maxKm} ${t.common.km}`}</span>
        </h3>
        <input type="range" min={1} max={60} value={f.maxKm} onChange={(e) => setF({ ...f, maxKm: Number(e.target.value) })} className="w-full accent-brand" />
      </div>
      <div className={HAS_MEALS ? undefined : "hidden"}>
        <h3 className="mb-2 font-bold">{t.picker.service}</h3>
        <div className="flex flex-wrap gap-1.5">
          {(["both", "delivery", "dineIn"] as const).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={f.service === s} onClick={() => setF({ ...f, service: s })}>
              {s === "both" ? t.picker.both : s === "delivery" ? `🛵 ${t.common.delivery}` : `🪑 ${t.common.dineIn}`}
            </button>
          ))}
        </div>
      </div>
      <div className={HAS_MEALS ? undefined : "hidden"}>
        <h3 className="mb-2 font-bold">{t.picker.spice}</h3>
        <div className="flex flex-wrap gap-1.5">
          {(["any", "none", "mild", "hot"] as const).map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={f.spice === s} onClick={() => setF({ ...f, spice: s })}>
              {s === "any" ? t.common.any : s === "none" ? `🧊 ${t.picker.noSpice}` : s === "mild" ? `🌶️ ${t.picker.mild}` : `🔥 ${t.picker.hot}`}
            </button>
          ))}
        </div>
      </div>
      <div className={cx("space-y-3 rounded-2xl border-2 border-ink bg-white p-3", !HAS_MEALS && "hidden")}>
        <Toggle checked={f.onlyOffers} onChange={(v) => setF({ ...f, onlyOffers: v })} label={`🏷️ ${t.picker.onlyOffers}`} />
        <Toggle checked={f.veg} onChange={(v) => setF({ ...f, veg: v })} label={`🌱 ${t.picker.vegOnly}`} />
      </div>
      <button type="button" className="btn btn-light w-full" onClick={() => setF(defaults)}>
        <RotateCcw className="size-4" /> {t.common.reset}
      </button>
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 start-1/2 size-[40rem] -translate-x-1/2 animate-blob rounded-full bg-sun/40 blur-3xl" />
        <div className="dots-bg absolute inset-0 opacity-40" />
      </div>
      <Container className="relative py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl font-extrabold">🎡 {t.picker.title}</h1>
            <p className="mt-1 text-lg text-ink-soft">{t.picker.subtitle}</p>
          </div>
          <button type="button" onClick={() => setSound(!sound)} className="btn btn-light btn-sm" aria-pressed={sound}>
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />} {t.picker.sound}
          </button>
        </div>

        <div className="grid gap-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h2 className="mb-2 font-bold">{t.picker.mode}</h2>
            <div className="scroll-row !pb-3">
              {AVAILABLE_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={mode === m.id}
                  onClick={() => {
                    setMode(m.id);
                    setSeed((s) => s + 1);
                  }}
                  className={cx("sticker flex items-center gap-2 px-4 py-2.5 font-bold transition-colors", mode === m.id ? "!bg-ink text-white" : "")}
                >
                  <span className="text-xl">{m.e}</span>
                  {t.picker.modes[m.id]}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center">
              {mode === "near" && placesState.status === "loading" ? (
                <Loader label={t.places.loading} />
              ) : items.length ? (
                <>
                  <Wheel ref={wheel} items={items} onResult={onResult} onStart={() => setSpinning(true)} />
                  <p className="mt-4 text-sm font-semibold text-ink-soft">{t.picker.candidates(items.length)}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      animate={spinning ? {} : { scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      disabled={spinning}
                      onClick={() => wheel.current?.spin()}
                      className="btn btn-primary max-w-full whitespace-normal px-6 py-4 text-center font-display text-xl sm:px-8 sm:text-2xl"
                    >
                      {spinning ? t.picker.spinning : t.picker.spin}
                    </motion.button>
                    <button type="button" className="btn btn-light lg:hidden" onClick={() => setShowFilters(true)}>
                      <SlidersHorizontal className="size-5" /> {t.picker.customize}
                      {filterCount > 0 && <span className="grid size-6 place-items-center rounded-full bg-brand text-xs text-white">{filterCount}</span>}
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => setSeed((s) => s + 1)} disabled={spinning} aria-label={t.common.shuffle}>
                      🔀
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState title={t.picker.empty} action={<button className="btn btn-primary" onClick={() => setF(defaults)}>{t.common.reset}</button>} />
              )}
            </div>

            {spins.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-3 font-display text-2xl font-bold">{t.picker.history}</h2>
                <div className="flex flex-wrap gap-2">
                  {spins.slice(0, 8).map((s) => (
                    <Link key={s.at} href={s.href ?? "#"} className="chip">
                      {s.emoji} {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="sticker hidden h-fit p-5 lg:block">
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold">
              <SlidersHorizontal className="size-5" /> {t.picker.customize}
            </h2>
            {filtersPanel}
          </aside>
        </div>
      </Container>

      <Sheet open={showFilters} onClose={() => setShowFilters(false)} title={t.picker.customize}>
        {filtersPanel}
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setShowFilters(false)}>
          {t.common.apply} · {t.picker.candidates(items.length)}
        </button>
      </Sheet>

      <ResultSheet
        pick={result}
        onClose={() => setResult(null)}
        onAgain={() => {
          setResult(null);
          setTimeout(() => wheel.current?.spin(), 350);
        }}
        dist={dist}
        offersByRestaurant={(rid) => active.filter((o) => o.restaurantId === rid)}
        offerByMeal={offerByMeal}
      />
    </div>
  );
}

function ResultSheet({ pick, onClose, onAgain, dist, offersByRestaurant, offerByMeal }: { pick: Pick | null; onClose: () => void; onAgain: () => void; dist: Record<string, number>; offersByRestaurant: (rid: string) => Offer[]; offerByMeal: Record<string, Offer> }) {
  const MEALS = useMeals();
  const { t, l, price } = useI18n();
  const showToast = useStore((s) => s.showToast);
  if (!pick) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  if (pick.kind === "place") {
    const pl = pick.place;
    return (
      <Sheet open onClose={onClose} title={t.picker.result.decided} wide>
        <div className="flex flex-col items-center gap-3 text-center">
          <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 10 }} className="grid size-32 place-items-center rounded-full border-4 border-ink bg-sun text-6xl shadow-[5px_5px_0_#2B1B3D]">
            {pl.emoji}
          </motion.div>
          <h2 className="font-display text-4xl font-extrabold">{l(pl.name)}</h2>
          <p className="text-ink-soft">{t.places.kinds[pl.kind]}{pl.cuisineText ? ` · ${pl.cuisineText}` : ""}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <DistanceTag km={pick.km} />
            <OpenBadge hours={pl.hours} />
          </div>
          <p className="max-w-md text-sm text-ink-soft">{t.places.noRating}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button type="button" className="btn btn-chili" onClick={() => { celebrate("small"); showToast(t.picker.result.decided, "😍"); onClose(); }}>
              <Heart className="size-5 fill-white" /> {t.picker.result.love}
            </button>
            <button type="button" className="btn btn-lagoon" onClick={onAgain}>🎡 {t.picker.result.again}</button>
            <Link href={`/place/?id=${pl.id}`} className="btn btn-light">
              <Store className="size-4" /> {t.picker.result.view}
            </Link>
            <a href={directionsUrl(pl.lat, pl.lng)} target="_blank" rel="noreferrer" className="btn btn-light">
              <Navigation className="size-4" /> {t.common.directions}
            </a>
          </div>
        </div>
      </Sheet>
    );
  }

  if (pick.kind === "category") {
    const c = pick.category;
    const meals = MEALS.filter((m) => m.category === c.id).slice(0, 4);
    return (
      <Sheet open onClose={onClose} title={t.picker.result.decided} wide>
        <div className="text-center">
          <p className="font-semibold text-ink-soft">{t.picker.result.category}</p>
          <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 10 }} className="mx-auto my-3 grid size-36 place-items-center rounded-full border-4 border-ink text-7xl shadow-[5px_5px_0_#2B1B3D]" style={{ background: c.color }}>
            {c.emoji}
          </motion.div>
          <h2 className="font-display text-5xl font-extrabold" style={{ color: c.ink }}>
            {l(c.name)}
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {meals.map((m) => (
            <MealCard key={m.id} m={m} offer={offerByMeal[m.id]} km={dist[m.restaurantId]} />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href={`/discover/?c=${c.id}`} className="btn btn-primary">{t.picker.result.explore}</Link>
          <button type="button" className="btn btn-lagoon" onClick={onAgain}>🎡 {t.picker.result.again}</button>
          <FavButton kind="categories" id={c.id} />
        </div>
      </Sheet>
    );
  }

  const meal = pick.kind === "meal" ? pick.meal : pick.kind === "offer" ? pick.meal : mealsByRestaurant(pick.restaurant.id).find((m) => m.editorsPick) ?? mealsByRestaurant(pick.restaurant.id)[0];
  const r = pick.kind === "restaurant" ? pick.restaurant : restaurantById(pick.kind === "offer" ? pick.offer.restaurantId : pick.meal.restaurantId)!;
  const offer = pick.kind === "offer" ? pick.offer : pick.kind === "meal" ? pick.offer : meal ? offerByMeal[meal.id] : undefined;
  const rOffers = offersByRestaurant(r.id);
  const area = areaOf(r);
  const title = pick.kind === "restaurant" ? l(r.name) : meal ? l(meal.name) : l(pick.kind === "offer" ? pick.offer.title : r.name);

  return (
    <Sheet open onClose={onClose} title={t.picker.result.decided} wide>
      <div className="grid gap-5 md:grid-cols-2">
        <motion.div initial={{ rotateY: 90, scale: 0.8 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: "spring", stiffness: 140, damping: 14 }} className="relative">
          <FoodImage src={pick.kind === "restaurant" ? r.cover : meal?.image ?? r.cover} emoji={meal?.emoji ?? r.emoji} alt={title} size="full" className="aspect-square w-full rounded-3xl border-2 border-ink shadow-[5px_5px_0_#2B1B3D]" />
          {offer?.percent && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: -12 }} transition={{ delay: 0.4, type: "spring" }} className="absolute -top-3 end-3 grid size-20 place-items-center rounded-full border-2 border-ink bg-chili font-display text-2xl font-extrabold text-white shadow-[3px_3px_0_#2B1B3D]" dir="ltr">
              -{offer.percent}%
            </motion.span>
          )}
          <DemoBadge className="absolute bottom-3 start-3" source={r.source} />
        </motion.div>
        <div className="flex flex-col gap-3">
          <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="font-display text-4xl font-extrabold leading-tight">
            {title}
          </motion.h2>
          <Link href={`/restaurants/${r.id}/`} className="inline-flex items-center gap-2 font-bold text-brand hover:underline">
            <span className="grid size-8 place-items-center rounded-lg border-2 border-ink" style={{ background: r.brand }}>{r.emoji}</span>
            {l(r.name)}
          </Link>
          {meal && <p className="text-ink-soft">{l(meal.description)}</p>}
          {meal && (
            <div className="flex items-end gap-3">
              {offer?.finalPrice !== undefined && offer.finalPrice < meal.price ? (
                <>
                  <span className="font-display text-4xl font-extrabold text-chili">{price(offer.finalPrice)}</span>
                  <span className="pb-1 text-lg text-ink-soft line-through">{price(meal.price)}</span>
                </>
              ) : (
                <span className="font-display text-4xl font-extrabold">{price(meal.price)}</span>
              )}
            </div>
          )}
          <p className="text-xs text-ink-soft">{t.common.mealPriceOnly}</p>
          <div className="flex flex-wrap items-center gap-3">
            <RatingBadge rating={r.rating} count={r.ratingCount} />
            <DistanceTag km={dist[r.id]} />
            {area && <span className="inline-flex items-center gap-1 text-sm"><MapPin className="size-3.5" />{l(area.name)}</span>}
          </div>
          <OpenBadge hours={r.hours} tz={r.timeZone} />
          <div className="flex gap-3 text-sm font-semibold text-ink-soft">
            {r.delivery && <span className="inline-flex items-center gap-1"><Bike className="size-4" />{t.common.delivery}</span>}
            {r.dineIn && <span className="inline-flex items-center gap-1"><Store className="size-4" />{t.common.dineIn}</span>}
          </div>
          {(offer ?? rOffers[0]) && (
            <div className="rounded-2xl border-2 border-dashed border-chili bg-chili/10 p-3">
              <div className="mb-1 flex items-center gap-2">
                <TrustBadge verified={(offer ?? rOffers[0]).verified} />
              </div>
              <p className="font-bold">🏷️ {l((offer ?? rOffers[0]).title)}</p>
            </div>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="btn btn-chili"
              onClick={() => {
                celebrate("small");
                showToast(t.picker.result.decided, "😍");
                onClose();
              }}
            >
              <Heart className="size-5 fill-white" /> {t.picker.result.love}
            </button>
            <button type="button" className="btn btn-lagoon" onClick={onAgain}>
              🎡 {t.picker.result.again}
            </button>
            {meal ? <FavButton kind="meals" id={meal.id} /> : <FavButton kind="restaurants" id={r.id} />}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/restaurants/${r.id}/`} className="btn btn-light btn-sm">
              <Store className="size-4" /> {t.picker.result.view}
            </Link>
            <Link href={`/discover/?c=${meal?.category ?? r.categories[0]}`} className="btn btn-light btn-sm">
              🔍 {t.picker.result.similar}
            </Link>
            <a href={directionsUrl(r.lat, r.lng)} target="_blank" rel="noreferrer" className="btn btn-light btn-sm">
              <Navigation className="size-4" /> {t.common.directions}
            </a>
            {r.orderUrl ? (
              <a href={r.orderUrl} target="_blank" rel="noreferrer" className="btn btn-light btn-sm">
                <ShoppingBag className="size-4" /> {t.common.order}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Sheet>
  );
}


