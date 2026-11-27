"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Bike, Store, Tag, Utensils } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { categoryById } from "@/data/categories";
import { restaurantById } from "@/data/restaurants";
import { mealById } from "@/data/meals";
import { areaOf } from "@/data/geo";
import type { Category, Meal, Offer, Restaurant } from "@/lib/types";
import { BrandMark, Countdown, cx, DemoBadge, DistanceTag, FavButton, FoodImage, OpenBadge, PriceLevel, RatingBadge, Tilt, TrustBadge } from "./ui";

export function RestaurantCard({ r, km, offers = 0, featuredMeal, className }: { r: Restaurant; km?: number; offers?: number; featuredMeal?: Meal; className?: string }) {
  const { l, t } = useI18n();
  const area = areaOf(r);
  return (
    <Tilt className={cx("h-full", className)} max={5}>
      <Link href={`/restaurants/${r.id}/`} className="sticker group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[6px_6px_0_#2B1B3D]">
        <div className="relative h-40 border-b-2 border-ink">
          {/* only the photo clips, so the logo tile can overlap the card body */}
          <div className="absolute inset-0 overflow-hidden">
            <FoodImage src={r.cover} emoji={r.emoji} alt={l(r.name)} className="size-full transition-transform duration-500 group-hover:scale-110" />
          </div>
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
            <div className="flex flex-wrap gap-1">
              {r.isNew && <span className="rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-xs font-extrabold">{t.common.newPlace}</span>}
              {offers > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-chili px-2 py-0.5 text-xs font-extrabold text-white">
                  <Tag className="size-3" /> {offers}
                </span>
              )}
            </div>
            <FavButton kind="restaurants" id={r.id} size="sm" />
          </div>
          <BrandMark r={r} className="absolute -bottom-0.5 start-3 z-10 size-12 translate-y-1/2 rounded-2xl border-2 border-ink text-2xl shadow-[2px_2px_0_#2B1B3D]" />
          <DemoBadge className="absolute bottom-2 end-2" source={r.source} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4 pt-7">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-display text-xl font-bold leading-tight">{l(r.name)}</h3>
            <PriceLevel level={r.priceLevel} />
          </div>
          <p className="line-clamp-1 text-sm text-ink-soft">{r.categories.map((c) => l(categoryById(c).name)).join(" · ")}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <RatingBadge rating={r.rating} compact />
            <DistanceTag km={km} />
            {area && <span className="text-xs text-ink-soft">{l(area.name)}</span>}
          </div>
          <OpenBadge hours={r.hours} tz={r.timeZone} />
          {featuredMeal && (
            <p className="line-clamp-1 text-sm">
              <span className="me-1">{featuredMeal.emoji}</span>
              <span className="font-semibold">{l(featuredMeal.name)}</span>
            </p>
          )}
          <div className="mt-auto flex items-center gap-3 pt-1 text-xs font-semibold text-ink-soft">
            {r.delivery && (
              <span className="inline-flex items-center gap-1">
                <Bike className="size-3.5" /> {t.common.delivery}
              </span>
            )}
            {r.dineIn && (
              <span className="inline-flex items-center gap-1">
                <Store className="size-3.5" /> {t.common.dineIn}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function MealCard({ m, offer, km, className, onClick }: { m: Meal; offer?: Offer; km?: number; className?: string; onClick?: () => void }) {
  const { l, t, price } = useI18n();
  const r = restaurantById(m.restaurantId)!;
  const cat = categoryById(m.category);
  const final = offer?.finalPrice;
  const Body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink">
        <FoodImage src={m.image} emoji={m.emoji} alt={l(m.name)} color={cat.color} className="size-full transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <div className="flex flex-wrap gap-1">
            {offer?.percent && <span className="rounded-full border-2 border-ink bg-chili px-2 py-0.5 text-xs font-extrabold text-white">-{offer.percent}%</span>}
            {m.spicy > 1 && <span className="rounded-full border-2 border-ink bg-white px-1.5 text-xs">{"🌶️".repeat(m.spicy - 1)}</span>}
            {m.vegetarian && <span className="rounded-full border-2 border-ink bg-lime px-1.5 text-xs font-bold">🌱</span>}
          </div>
          <FavButton kind="meals" id={m.id} size="sm" />
        </div>
        {m.editorsPick && <span className="absolute bottom-2 start-2 rounded-full border-2 border-ink bg-sun px-2 py-0.5 text-[11px] font-extrabold">★ {t.common.editorsPick}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug">{l(m.name)}</h3>
        <p className="line-clamp-1 text-sm text-ink-soft">
          {r.emoji} {l(r.name)}
        </p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <div className="leading-tight">
            {final !== undefined && final < m.price ? (
              <>
                <div className="text-xs text-ink-soft line-through">{price(m.price)}</div>
                <div className="font-display text-xl font-extrabold text-chili">{price(final)}</div>
              </>
            ) : (
              <div className="font-display text-xl font-extrabold">{price(m.price)}</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <RatingBadge rating={r.rating} compact />
            <DistanceTag km={km} />
          </div>
        </div>
      </div>
    </>
  );
  const cls = cx("sticker group flex h-full flex-col overflow-hidden text-start transition-shadow hover:shadow-[6px_6px_0_#2B1B3D]", className);
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {Body}
      </button>
    );
  return (
    <Link href={`/restaurants/${r.id}/#meal-${m.id}`} className={cls}>
      {Body}
    </Link>
  );
}

export function OfferCard({ o, km, className, wide }: { o: Offer; km?: number; className?: string; wide?: boolean }) {
  const { l, t, price, date } = useI18n();
  const trackOffer = useStore((s) => s.trackOffer);
  const r = restaurantById(o.restaurantId)!;
  const meal = o.mealId ? mealById(o.mealId) : undefined;
  const area = areaOf(r);
  const big = o.type === "bogo" ? "1+1" : o.type === "free-delivery" ? "🛵" : o.percent ? `-${o.percent}%` : "★";
  return (
    <Tilt className={cx("h-full", className)} max={4}>
      <Link
        href={`/restaurants/${r.id}/#offers`}
        onClick={() => trackOffer(o.id)}
        className={cx("sticker group relative flex h-full overflow-hidden transition-shadow hover:shadow-[6px_6px_0_#2B1B3D]", wide ? "flex-col sm:flex-row" : "flex-col")}
      >
        <div className={cx("relative overflow-hidden border-ink", wide ? "h-44 border-b-2 sm:h-auto sm:w-2/5 sm:border-b-0 sm:border-e-2" : "h-40 border-b-2")}>
          <FoodImage src={meal?.image ?? r.cover} emoji={meal?.emoji ?? r.emoji} alt={l(o.title)} className="size-full transition-transform duration-500 group-hover:scale-110" />
          <motion.div
            className="absolute -top-1 end-3 grid size-[4.5rem] place-items-center rounded-full border-2 border-ink bg-chili font-display text-xl font-extrabold text-white shadow-[3px_3px_0_#2B1B3D]"
            initial={{ rotate: -12 }}
            whileHover={{ rotate: 8, scale: 1.08 }}
            style={{ marginTop: 10 }}
            dir="ltr"
          >
            {big}
          </motion.div>
          <FavButton kind="offers" id={o.id} size="sm" className="absolute start-2 top-2" />
          <div className="absolute bottom-2 start-2 flex items-center gap-1.5">
            <BrandMark r={r} className="size-9 rounded-xl border-2 border-ink text-lg" />
            <DemoBadge source={r.source} />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <TrustBadge verified={o.verified} />
            <span className="rounded-full bg-lagoon/10 px-2 py-0.5 text-xs font-bold text-lagoon">{t.offerTypes[o.type]}</span>
            {o.tags.includes("exclusive") && <span className="rounded-full bg-sun/40 px-2 py-0.5 text-xs font-bold">{t.offerTags.exclusive}</span>}
          </div>
          <h3 className="font-display text-lg font-bold leading-snug">{l(o.title)}</h3>
          <p className="text-sm text-ink-soft">
            {l(r.name)} · {area && l(area.name)}
          </p>
          <div className="flex items-end justify-between gap-2">
            {o.finalPrice !== undefined ? (
              <div className="leading-tight">
                {o.originalPrice !== undefined && <div className="text-xs text-ink-soft line-through">{price(o.originalPrice)}</div>}
                <div className="font-display text-2xl font-extrabold text-chili">{price(o.finalPrice)}</div>
              </div>
            ) : (
              <div className="font-display text-lg font-extrabold text-emerald-700">{t.offerTypes[o.type]}</div>
            )}
            <div className="flex flex-col items-end gap-0.5">
              <RatingBadge rating={r.rating} compact />
              <DistanceTag km={km} />
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-ink/20 pt-2">
            <Countdown to={o.expiresAt} compact label={t.common.endsIn} />
            <span className="text-[11px] text-ink-soft" suppressHydrationWarning>
              {t.offersPage.expires}: {date(o.expiresAt, true)}
            </span>
          </div>
          <details className="text-xs text-ink-soft" onClick={(e) => e.stopPropagation()}>
            <summary className="cursor-pointer font-semibold">{t.offersPage.terms}</summary>
            <p className="mt-1">
              {l(o.description)} {l(o.terms)}
            </p>
          </details>
        </div>
      </Link>
    </Tilt>
  );
}

export function CategoryCard({ c, onClick, active, size = "md" }: { c: Category; onClick?: () => void; active?: boolean; size?: "sm" | "md" }) {
  const { l } = useI18n();
  const track = useStore((s) => s.trackCategory);
  const inner = (
    <motion.div
      whileHover={{ y: -6, rotate: -2 }}
      whileTap={{ scale: 0.95 }}
      className={cx("sticker group relative flex flex-col items-center overflow-hidden text-center", size === "sm" ? "w-28 p-2" : "w-36 p-3 sm:w-40", active && "ring-4 ring-lagoon")}
      style={{ background: c.color }}
    >
      <div className={cx("relative overflow-hidden rounded-full border-2 border-ink bg-white", size === "sm" ? "size-16" : "size-24")}>
        {c.image ? (
          <FoodImage src={c.image} emoji={c.emoji} alt="" size="small" className="size-full transition-transform duration-500 group-hover:scale-125" color={c.color} />
        ) : (
          <div className="grid size-full place-items-center text-4xl transition-transform group-hover:scale-125">{c.emoji}</div>
        )}
      </div>
      <span className={cx("absolute grid place-items-center rounded-full border-2 border-ink bg-white shadow-[2px_2px_0_#2B1B3D]", size === "sm" ? "top-1 end-1 size-7 text-sm" : "top-2 end-2 size-9 text-lg")}>{c.emoji}</span>
      <span className={cx("mt-2 font-display font-bold leading-tight", size === "sm" ? "text-sm" : "text-lg")} style={{ color: "#2B1B3D" }}>
        {l(c.name)}
      </span>
    </motion.div>
  );
  if (onClick)
    return (
      <button type="button" onClick={() => { track(c.id); onClick(); }} aria-pressed={active}>
        {inner}
      </button>
    );
  return (
    <Link href={`/discover/?c=${c.id}`} onClick={() => track(c.id)}>
      {inner}
    </Link>
  );
}

export function MiniMealRow({ m, right }: { m: Meal; right?: React.ReactNode }) {
  const { l, price } = useI18n();
  const r = restaurantById(m.restaurantId)!;
  return (
    <div className="flex items-center gap-3">
      <FoodImage src={m.image} emoji={m.emoji} alt="" size="small" className="size-14 shrink-0 rounded-2xl border-2 border-ink" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{l(m.name)}</div>
        <div className="truncate text-sm text-ink-soft">
          {l(r.name)} · {price(m.price)}
        </div>
      </div>
      {right ?? <Utensils className="size-4 text-ink-soft" />}
    </div>
  );
}

/** Card for a real OpenStreetMap place (no prices / ratings / offers — and we say so). */
export function PlaceCard({ p, km, className }: { p: import("@/lib/places").Place; km?: number; className?: string }) {
  const { l, t } = useI18n();
  const cat = p.categories[0] ? categoryById(p.categories[0]) : undefined;
  return (
    <Link href={`/place/?id=${p.id}`} className={cx("sticker group flex h-full items-start gap-3 p-3 transition-shadow hover:shadow-[6px_6px_0_#2B1B3D]", className)}>
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink text-3xl transition-transform group-hover:rotate-6" style={{ background: cat?.color ?? "#FFEBD6" }}>
        {p.emoji}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="line-clamp-1 font-display text-lg font-bold leading-tight">{l(p.name)}</h3>
        <p className="line-clamp-1 text-sm text-ink-soft">
          {t.places.kinds[p.kind]}
          {p.cuisineText ? ` · ${p.cuisineText}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <DistanceTag km={km} />
          <DemoBadge source="osm" />
        </div>
        <OpenBadge hours={p.hours} />
      </div>
    </Link>
  );
}
